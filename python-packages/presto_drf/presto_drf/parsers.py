from distutils.util import strtobool
import json

from allianceutils.util.camel_case import underscoreize
from django.conf import settings
from rest_framework.exceptions import ParseError
from rest_framework.parsers import JSONParser
from rest_framework.parsers import MultiPartParser


class CamelCaseJSONParser(JSONParser):
    """Parser that recursively turns camelcase keys into underscored keys for JSON data

    This can be set globally on the [DEFAULT_PARSER_CLASSES](https://www.django-rest-framework.org/api-guide/settings/#default_parser_classes)
    setting or on a ViewSet on the `parser_classes` property.
    """

    def underscoreize(self, data, **kwargs):
        """Recursively turn camelcase keys into underscored keys"""
        return underscoreize(data, **kwargs)

    def parse(self, stream, media_type=None, parser_context=None):
        parser_context = parser_context or {}
        encoding = parser_context.get("encoding", settings.DEFAULT_CHARSET)

        try:
            data = stream.read().decode(encoding)
            return self.underscoreize(json.loads(data))
        except ValueError as exc:
            raise ParseError(f"JSON parse error") from exc


class CamelCaseMultiPartJSONParser(MultiPartParser):
    """Parser that recursively turns camelcase keys into underscored keys for JSON data and handles file uploads
    
    This parser supports receiving JSON data where a field value anywhere in the structure can be a file.

    This is achieved on the frontend by converting a structure like:

    ```js
    {
        name: 'Test',
        photo: File,
    }
    ```

    And converting it to

    ```js
    {
        name: 'Test',
        photo: '____ATTACHED_FILE_ID_1',
    }
    ```

    This is then set on a field `jsonData` and the file is set on `____ATTACHED_FILE_ID_1` and submitted
    as multipart.

    This parser then handles parsing the JSON data into a dict and setting each attached file on the
    correct key in the dict.

    Note that this works with nested data (ie. any File anywhere in a nested JSON structure is supported).

    To activate this behaviour the `X-MultiPart-JSON` header must be set to '1' or 'true'. If this header
    is not set it falls back to the default behaviour of MultiPartParser

    This can be set globally on the [DEFAULT_PARSER_CLASSES](https://www.django-rest-framework.org/api-guide/settings/#default_parser_classes)
    setting or on a ViewSet on the `parser_classes` property.

    Example frontend code to activate:

    ```js
    let fileCount = 0;
    const files = {};
    const replacer = (key, value) => {
        if (value instanceof File) {
            const id = `____ATTACHED_FILE_ID_${fileCount++}`;
            files[id] = value;
            return id;
        }
        return value;
    };
    const stringifiedData = JSON.stringify(data, replacer);
    const body = new FormData();
    const body.append('jsonData', stringifiedData);
    for (const [fileKey, file] of Object.entries(files)) {
        body.append(fileKey, file);
    }
    // eg. using a presto Endpoint
    await myEndpoint.execute({
        body,
        headers: {
            // Remove default content type from endpoint (eg. json)
            'Content-Type': undefined,
            'X-MultiPart-JSON': true,
        },
    });
    ```
    """

    def underscoreize(self, data, **kwargs):
        """Recursively turn camelcase keys into underscored keys"""
        return underscoreize(data, **kwargs)

    def parse(self, stream, media_type=None, parser_context=None):
        data_and_files = super().parse(stream, media_type, parser_context)
        request = parser_context["request"]
        if strtobool(request.META.get("HTTP_X_MULTIPART_JSON", "0")):

            def hook(value):
                transformed_values = []
                for (k, v) in value:
                    if type(v) == str and v.startswith("____ATTACHED_FILE_ID_"):
                        final_v = data_and_files.files.get(v)
                    else:
                        final_v = v
                    transformed_values.append((k, final_v))
                return dict(transformed_values)

            json_data = json.loads(
                data_and_files.data.get("jsonData"), object_pairs_hook=hook
            )
            return self.underscoreize(json_data)
        return super().parse(stream, media_type, parser_context)
