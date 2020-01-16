import copy
from io import BytesIO
import logging
import traceback
from urllib.parse import parse_qs
from urllib.parse import urlparse

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
from rest_framework.response import Response

logger = logging.getLogger(__name__)
request_logger = logging.getLogger("django.request")


class BatchApiViewSet(viewsets.ViewSet):
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

            # TODO - when we do presto_devtools later we'll want to wrap this func
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
