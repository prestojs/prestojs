import json

from allianceutils.util.camel_case import camel_to_underscore
from allianceutils.util.camel_case import underscoreize
from django.conf import settings
from rest_framework.exceptions import ParseError
from rest_framework.parsers import JSONParser
from rest_framework.parsers import MultiPartParser


class CamelCaseJSONParser(JSONParser):
    def parse(self, stream, media_type=None, parser_context=None):
        parser_context = parser_context or {}
        encoding = parser_context.get("encoding", settings.DEFAULT_CHARSET)

        try:
            data = stream.read().decode(encoding)
            return underscoreize(json.loads(data))
        except ValueError as exc:
            raise ParseError(f"JSON parse error") from exc


class CamelCaseMultiPartParser(MultiPartParser):
    """
    If we have received any files along with other json data it gets converted
    on frontend into multi-part post with a single key for all JSON data (formData)
    and a single key for each file in the original data. The JSON data will contain
    a placeholder value starting with  ____ATTACHED_FILE_ID_ to identify where
    each file should go to. We transform received data back to original json structure
    to be used transparently by serializers.
    This special case is identified by the header X-RADCOMBINEDFORMPOST
    """

    def parse(self, stream, media_type=None, parser_context=None):
        data_and_files = super().parse(stream, media_type, parser_context)
        request = parser_context["request"]
        prev_mutable = data_and_files.data._mutable
        data_and_files.data._mutable = True
        if request.META.get(
            "HTTP_X_RADCOMBINEDFORMPOST"
        ):  # TODO - Confirm this's what we want to call the header? ie, RAD?

            def hook(value):
                transformed_values = []
                for (k, v) in value:
                    if type(v) == str and v.startswith("____ATTACHED_FILE_ID_"):
                        final_v = data_and_files.files.get(v)
                    else:
                        final_v = underscoreize(v)
                    transformed_values.append((camel_to_underscore(k), final_v))

                return dict(transformed_values)

            regular_form_data = json.loads(
                data_and_files.data.get("formData"), object_pairs_hook=hook
            )
            return regular_form_data

        for key, value in data_and_files.data.items():
            new_key = camel_to_underscore(key)
            if new_key != key:
                data_and_files.data.pop(key)
            data_and_files.data[new_key] = underscoreize(value)
        data_and_files.data._mutable = prev_mutable
        return data_and_files
