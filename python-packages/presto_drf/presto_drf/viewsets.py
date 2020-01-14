import copy
from io import BytesIO
import json
import logging
import traceback
from urllib.parse import parse_qs
from urllib.parse import urlparse

from allianceutils.util.camel_case import camel_to_underscore
from allianceutils.util.camel_case import underscoreize
from django.conf import settings
from django.core.handlers.base import BaseHandler
from django.core.signals import got_request_exception
from django.http import QueryDict
from django.template.response import SimpleTemplateResponse
from django.urls import resolve
from django.urls import Resolver404
from rest_framework import status
from rest_framework import viewsets
from rest_framework.exceptions import APIException
from rest_framework.exceptions import ParseError
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import JSONParser
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response

from .filters import CamelCaseOrderingFilter
from .filters import PrestoDjangoFilterBackend

logger = logging.getLogger(__name__)
request_logger = logging.getLogger("django.request")


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 100
    page_size_query_param = "pageSize"


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
        ):  # FIXME - do we have any plan to update this / rename header?

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


# FIXME - currently (mostly) a copy paste from djrad1. How do we want to handle batch query in presto?
# FIXME - djrad_devtools related code currently stripped out, pending presto_devtools.
class BatchApiViewSet(viewsets.GenericViewSet):
    """
    A single POST endpoint that accepts a list of descriptions of requests to perform and returns the
    result from each request.

    **WARNING**: Middleware is _not_ applied to each individual request, it is only applied once to the
    main batch_call request. Each individual request gets a copy of the original request with it's
    specific headers, content type, method, body etc replaced.

    The response is  list of responses of the following shape in the order they were received in the
    incoming data:

    {
        'content': str response body,
        'headers': list of header key/value pairs,
        'status': int status code of response,
    }

    See batchApiMiddleware.js on the frontend for where the responses are handled.
    """

    permission_classes = []

    def batch_call(self, request):
        results = []

        for api_request in request.data:
            scheme, netloc, path, params, query, fragment = urlparse(
                api_request["endpoint"]
            )
            url_name = None

            try:
                resolver_match = resolve(path)
                view, args, kwargs = resolver_match
                url_name = resolver_match.url_name
                next_request = copy.copy(request._request)
                next_request.method = api_request["method"]
                next_request.content_type = dict(api_request["headers"]).get(
                    "Content-Type", "application/json"
                )
                next_request._read_started = False
                if api_request.get("body") is not None:
                    next_request._stream = BytesIO(
                        bytes(api_request["body"], encoding="utf8")
                    )
                next_request.GET = QueryDict(mutable=True)
                for key, value in parse_qs(query).items():
                    next_request.GET.setlist(key, value)
                for key, value in request._request.META.items():
                    next_request.META[key] = value
                for key, value in api_request["headers"]:
                    next_request.META["HTTP_" + key.upper().replace("-", "_")] = value
                response = view(next_request, *args, **kwargs)
            except APIException as e:
                headers = {}
                if getattr(e, "auth_header", None):
                    headers["WWW-Authenticate"] = e.auth_header
                if getattr(e, "wait", None):
                    headers["Retry-After"] = "%d" % e.wait

                if isinstance(e.detail, (list, dict)):
                    data = e.detail
                else:
                    data = {"detail": e.detail}
                response = Response(data, status=e.status_code, headers=headers)
                response.accepted_renderer = request.accepted_renderer
                response.accepted_media_type = request.accepted_media_type
                response.renderer_context = self.get_renderer_context()
            except Resolver404:
                response = Response(
                    {"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND
                )
                response.accepted_renderer = request.accepted_renderer
                response.accepted_media_type = request.accepted_media_type
                response.renderer_context = self.get_renderer_context()
            except Exception as e:
                # 500's shouldn't break the batch API call - we need to handle it
                # transparently so any other calls in the batch get returned. We
                # still want to log everything as normal.
                exc_data = {"error": 500, "message": "A server error occurred."}
                if settings.DEBUG:
                    exc_data["message"] = str(e)
                    exc_data["traceback"] = traceback.format_exc()
                response = Response(
                    exc_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                response.accepted_renderer = request.accepted_renderer
                response.accepted_media_type = request.accepted_media_type
                response.renderer_context = self.get_renderer_context()
                # Generate the usual 500 error email with stack trace and full
                # debugging information
                request_logger.error(
                    "Internal Server Error: %s",
                    self.request.path,
                    exc_info=True,
                    extra={"status_code": 500, "request": self.request},
                )

                # Here we lie a little bit. Because we swallow the exception,
                # the BaseHandler doesn't get to send this signal. It sets the
                # sender argument to self.__class__, in case the BaseHandler
                # is subclassed.
                got_request_exception.send(sender=BaseHandler, request=self.request)

            if isinstance(response, SimpleTemplateResponse):
                response.render()
            headers = list(response._headers.values())
            if hasattr(logger, "get_http_header"):
                headers.append(
                    (
                        logger.get_header_name(),
                        logger.get_http_header(url_name=url_name),
                    )
                )
            results.append(
                {
                    "content": response.content.decode(response.charset),
                    "status": response.status_code,
                    "headers": headers,
                }
            )
        return Response(results)


# FIXME - we'll need to rewrite/import test cases for presto_drf as well, but maybe a bit later?
class PrestoGenericViewSet(viewsets.GenericViewSet):
    presto_site = None
    pagination_class = StandardResultsSetPagination
    parser_classes = (CamelCaseJSONParser, CamelCaseMultiPartParser)
    filter_backends = (PrestoDjangoFilterBackend, CamelCaseOrderingFilter)

    @staticmethod
    def supports_create():
        return False

    @staticmethod
    def supports_retrieve():
        return False

    @staticmethod
    def supports_update():
        return False

    @staticmethod
    def supports_destroy():
        return False

    @staticmethod
    def supports_list():
        return False
