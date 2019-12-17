# fielddefs placeholder implementation.
from collections import OrderedDict

from .utils import snake_case_to_spaces

field_backend_type_to_frontend_type = {
    "PositiveSmallIntegerField": "IntegerField",
    "IntegerField": "IntegerField",
    "CharField": "CharField",
    "EmailField": "EmailField",
    "BooleanField": "BooleanField",
    # TODO - expand this to cover all fields.
}


def get_field_def(config, attr_name, field):
    field_type = field.__class__.__name__

    # if defined as callable, let the callable decide what attributes etc to return to frontend
    if field_type in config.field_maps and callable(config.field_maps[field_type]):
        return config.field_maps[field_type](attr_name, field)

    field_maps = dict(field_backend_type_to_frontend_type)
    field_maps.update(config.field_maps)

    # determine type of field; for choices, we check the type of first element's value
    if field_type != "ChoiceField":
        if field.__class__.__name__ not in field_maps:
            raise NotImplementedError(
                f"Cannot determine field type for {field.__class__.__name__}. If this is a custom field, set field_maps mapping in your config."
            )
        field_type = field_backend_type_to_frontend_type[field.__class__.__name__]
    else:
        if type(list(field.choices)[0]) == str:
            field_type = "CharField"
        elif type(list(field.choices)[0]) == int:
            field_type = "IntegerField"
        else:
            raise NotImplementedError(
                f"Cannot determine field type for {field.__class__.__name__}. This is apparently neither integer nor char which we dont support yet."
            )

    # attributes to set on frontend; consisted of mandatory ones and "possibly there" ones (field dependent)
    attributes = {
        "label": field.label or snake_case_to_spaces(attr_name),
        "readOnly": field.read_only,
        "writeOnly": field.write_only,
        "helpText": field.help_text,
        # required becomes !blank and allow_null becomes blankAsNull #TODO <- double check this's correct.
        "blank": not field.required,
        "blankAsNull": field.allow_null,
    }

    possible_attrs = {
        "minValue": "min_value",
        "maxValue": "max_value",
        "maxLength": "max_length",
        "defaultValue": "default_value",
        "choices": "choices",
    }
    for k, v in possible_attrs.items():
        if hasattr(field, v):
            attributes[k] = getattr(field, v)

    # this's the shape we pass onto template
    entry = {
        "name": attr_name,
        "type": field_type,
        "attributes": config.convert_field_attributes_to_js_representation(attributes),
    }

    return entry

def convert_field_attributes_to_js_representation(config, attributes):
    # convert to js
    for k, v in attributes.items():
        if type(v) == str:
            attributes[k] = f"'{v}'"
        if type(v) == bool:
            attributes[k] = str(v).lower()
        if (
            type(v) == OrderedDict
        ):  # TODO - in theory we want to automatically generate this as an enum in enum definition file somewhere. passing it as raw dict for now
            attributes[k] = f"new Map(Object.entries({str(dict(v))}))"
        if v is None:
            attributes[k] = "null"

    return attributes



def get_fields_for_serializer(config, serializer, **decorator_kwargs):
    instance = serializer()
    fields = instance.get_fields()

    fields_to_include = decorator_kwargs.get('fields', [])
    fields_to_exclude = decorator_kwargs.get('exclude_fields', [])

    result = []

    for attr_name, field in fields.items():
        if fields_to_include and attr_name not in fields_to_include: continue
        if attr_name in fields_to_exclude: continue
        result.append(config.get_field_def(attr_name, field))

    return result
