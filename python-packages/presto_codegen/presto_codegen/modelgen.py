from allianceutils.util import underscore_to_camel
from .utils import *


# FIXME - ALL RELATIONSHIP FIELDS ARE CURRENTLY IGNORED. FIX THIS.
def generate_definition_for_serializer(config, serializer, **decorator_kwargs):
    msg("Generating frontend model definition for %s..." % serializer, decorator_kwargs)

    template = "model.html"

    model_name = model_label = model_label_plural = model_pk = None

    if hasattr(serializer.Meta, "model"):
        model_name = serializer.Meta.model._meta.object_name
        model_label = serializer.Meta.model._meta.verbose_name
        model_label_plural = serializer.Meta.model._meta.verbose_name_plural
        model_pk = serializer.Meta.model._meta.pk.name

    model_name = (
        decorator_kwargs.get("name", None)
        or model_name
        or raiser(
            ValueError,
            f"{serializer.__name__} is not a ModelSerializer. Define name in decorator for frontend use.",
        )
    )
    model_label = (
        decorator_kwargs.get("label", None)
        or model_label
        or raiser(
            ValueError,
            f"{serializer.__name__} is not a ModelSerializer. Define label in decorator for frontend use.",
        )
    )

    model_label_plural = (
        decorator_kwargs.get("label_plural", None)
        or model_label_plural
        or raiser(
            ValueError,
            f"{serializer.__name__} is not a ModelSerializer. Define label_plural in decorator for frontend use.",
        )
    )

    model_pk = (
        decorator_kwargs.get("pk", None)
        or model_pk
        or raiser(
            ValueError,
            f"{serializer.__name__} is not a ModelSerializer. Define pk in decorator for frontend use.",
        )
    )

    fields = config.get_fields_for_serializer(serializer, **decorator_kwargs)
    types = set([field["type"] for field in fields])

    if config.camelize_generated_code:
        model_name = underscore_to_camel(model_name)
        for f in fields:
            f['name'] = underscore_to_camel(f['name'])


    result = render_template(
        template,
        {
            "model_name": model_name,
            "field_types": ", ".join(types),
            "model_label": model_label,
            "model_label_plural": model_label_plural,
            "model_pk": model_pk,
            "fields": fields,
        },
    )

    return model_name, result




def generate_descendant_base_on_base_model(config, model, relpath, **decorator_kwargs):
    msg("Generating descendant definition for %s..." % model)
    template = "model_descendant.html"
    return render_template(template, {"model_name": model, "relpath": relpath,})

