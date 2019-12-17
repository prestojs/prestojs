
from .codegen import write_to_file
from .fielddefs import get_field_def
from .fielddefs import get_fields_for_serializer
from .fielddefs import convert_field_attributes_to_js_representation
from .modelgen import generate_definition_for_serializer
from .modelgen import generate_descendant_base_on_base_model

class BaseCodeGenConfig:
    # "base" path to search for frontend existing modules, eg settings.BASE_DIR.parent / "frontend/src/"
    frontend_path = None

    # FileSystem path to put generated code into. Final file will sit as <generate_to>/Base<model>.js
    # These files will be replaced every time code generation is run, so you might wish to keep them in a separate place eg '/frontend/src/codegen/models/'
    generate_to = None

    # FileSystem path to put generated descendant code into, usually one level above generate_to.
    # These files are generated only if they do not exist and will never be overwritten by codegen
    generate_descendant_to = None

    # Additional Backend->Frontend field maps eg. {'BooField': 'FarField'};
    #  passing existing names overwrites default settings eg. {'TextField': 'CharField'};
    # in addition to this ^ usage, you can also pass a function as value of the map, which can be used to override entire get_field_def for field specified, eg:
    #  {'BooField': lambda attr_name, field: {'name': attr_name, 'type': 'FarField', 'attributes': {'random': 'stuff} } }
    # attr_name and field would be passed onto func; expected return is a dict w/ 'name', 'type' and optionally 'attributes'.
    field_maps = {}

    # whether turn first_name to firstName automatically
    # FIXME - Placeholder. we want this to be True by default, however Presto_drf.renders.CamelCaseJSONRenderer needs to be merged first.
    camelize_generated_code = False

    # ^^^^^^^^^^^^^^ CONFIGURABLE PART ^^^^^^^^^^^^
    # For general use, overriding some of attributes above should be sufficient.
    # Actual methods below allows for advanced usage but should be normally not required.

    @classmethod
    def generate_definition_for_serializer(cls, serializer, **decorator_kwargs):
        return generate_definition_for_serializer(cls, serializer, **decorator_kwargs)

    @classmethod
    def generate_descendant_base_on_base_model(cls, model, relpath, **decorator_kwargs):
        return generate_descendant_base_on_base_model(cls, model, relpath, **decorator_kwargs)

    @classmethod
    def write_to_file(cls, model, content, decorator_kwargs):
        return write_to_file(cls, model, content, **decorator_kwargs)

    @classmethod
    def get_fields_for_serializer(cls, serializer, **decorator_kwargs):
        return get_fields_for_serializer(cls, serializer, **decorator_kwargs)

    @classmethod
    def get_field_def(cls, attr_name, field):
        return get_field_def(cls, attr_name, field)

    @classmethod
    def convert_field_attributes_to_js_representation(cls, attributes):
        return convert_field_attributes_to_js_representation(cls, attributes)
