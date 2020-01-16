import json
from typing import Sequence

from django.conf import settings
from django.conf.urls import url
from django.contrib.auth import get_user_model
from django.http import HttpResponse
from django.template import RequestContext
from django.template import Template
from django.test import override_settings
from rest_framework import routers
from rest_framework.test import APIClient
from rest_framework.test import APITestCase

from presto_drf.viewsets import BatchApiViewSet

from .viewsets import UserViewSet

MIDDLEWARE = [m for m in settings.MIDDLEWARE if m != "silk.middleware.SilkyMiddleware"]


class RequestDescription:
    def __init__(
        self,
        url,
        method,
        headers=None,
        body=None,
        expected_content=None,
        expected_status_code=200,
        exclude_content_keys=None,
        ignore_content=False,
    ):
        self.url = url
        self.method = method
        self.headers = headers or {}
        self.body = body or {}
        self.expected_status_code = expected_status_code
        self.expected_content = expected_content
        self.exclude_content_keys = exclude_content_keys
        self.ignore_content = ignore_content


class TestBatchApi(APITestCase):
    @override_settings(ROOT_URLCONF=__name__, MIDDLEWARE=MIDDLEWARE)
    def setUp(self):
        user = get_user_model().objects.create(
            email="test@example.com", is_superuser=True, is_staff=True
        )
        user.set_password("password")
        user.save()
        self.user = user

        # This is just used to get csrf token
        def get_csrf_token(request):
            context = RequestContext(request, {})
            return HttpResponse(Template("{% csrf_token %}").render(context))

        def hello_view(request):
            if request.content_type == "text/html":
                return HttpResponse("<h1>Hello</h1>", content_type="text/html")
            return HttpResponse(status=400)

        router = routers.SimpleRouter()
        router.register(r"users", UserViewSet, basename="users")

        urlpatterns = router.urls + [
            url(
                r"^presto/batch-api/$", BatchApiViewSet.as_view({"post": "batch_call"})
            ),
            url(r"^get-token/$", get_csrf_token),
            url(r"^hello/$", hello_view),
        ]

        globals()["urlpatterns"] = urlpatterns

        self.client.force_login(self.user)
        response1 = self.client.get("/get-token/")
        assert response1.status_code == 200
        self.csrftoken = response1.cookies["csrftoken"].value

    @override_settings(ROOT_URLCONF=__name__, MIDDLEWARE=MIDDLEWARE)
    def batch_requests(self, requests: Sequence[RequestDescription], user=None):
        user = self.user
        responses = []
        for request in requests:
            client = APIClient()
            client.force_login(user)
            content_type = request.headers.get("Content-Type", "application/json")
            extra_kwargs = {}
            if content_type == "application/json":
                extra_kwargs["format"] = "json"
            else:
                extra_kwargs["content_type"] = content_type
            responses.append(
                getattr(client, request.method)(
                    request.url,
                    data=request.body,
                    **{
                        "HTTP_" + key.upper().replace("-", "_"): value
                        for key, value in request.headers.items()
                    },
                    **extra_kwargs,
                )
            )

        client = APIClient()
        client.force_login(user)
        batch_response = client.post(
            "/presto/batch-api/?format=json",
            [
                {
                    "endpoint": request.url,
                    "headers": list(request.headers.items())
                    + [["X-CSRFToken", self.csrftoken]],
                    "method": request.method,
                    "body": json.dumps(request.body)
                    if request.body is not None
                    else None,
                }
                for request in requests
            ],
            format="json",
        )
        self.assertEqual(200, batch_response.status_code)
        batched_responses = json.loads(batch_response.content.decode())
        self.assertEqual(len(batched_responses), len(responses))

        for i, response in enumerate(responses):
            request = requests[i]
            batch_response = batched_responses[i]
            self.assertEqual(
                response.status_code, request.expected_status_code, request.url
            )
            self.assertEqual(batch_response["status"], request.expected_status_code)
            headers1 = dict(map(list, response._headers.values()))
            headers2 = dict(batch_response["headers"])
            # Don't bother comparing Content-Type - we set it to application/json for purposes
            # of batch API but default view will use django DEFAULT_CONTENT_TYPE and return
            # HTML from default 404 template if defined otherwise django default fallback
            if response.status_code != 404:
                # We only compare some headers as not all headers will be equal due
                # to the fact that batched API calls will not have middleware applied
                # individually to each request (eg. XFrameOptionsMiddleware)
                self.assertEqual(headers1["Content-Type"], headers2["Content-Type"])

            if not request.ignore_content:
                data1 = response.content.decode()
                data2 = batch_response["content"]
                if headers1["Content-Type"] == "application/json":
                    data1 = json.loads(response.content.decode())
                    data2 = json.loads(batch_response["content"])
                if request.exclude_content_keys:
                    for key in request.exclude_content_keys:
                        del data1[key]
                        del data2[key]
                self.assertEqual(data2, data1)
                if request.expected_content:
                    self.assertEqual(request.expected_content, data1)

    @override_settings(ROOT_URLCONF=__name__, MIDDLEWARE=MIDDLEWARE)
    def test_batch_api_content_type(self):
        self.batch_requests(
            [
                RequestDescription(url="/users/?format=json", method="get", body=None,),
                RequestDescription(
                    url="/hello/",
                    method="get",
                    headers={"Content-Type": "text/html"},
                    expected_content="<h1>Hello</h1>",
                    expected_status_code=200,
                ),
                RequestDescription(
                    url="/hello/",
                    method="get",
                    headers={"Content-Type": "application/json"},
                    expected_status_code=400,
                ),
            ]
        )

    @override_settings(ROOT_URLCONF=__name__, MIDDLEWARE=MIDDLEWARE)
    def test_batch_api_call_single(self):
        self.batch_requests(
            [RequestDescription(url="/users/?format=json", method="get", body=None,)]
        )

        self.batch_requests(
            [
                RequestDescription(
                    url="/users/?a=1&format=json", method="get", body=None,
                )
            ]
        )

        self.batch_requests(
            [
                RequestDescription(
                    url="/users/?format=json",
                    method="post",
                    body={},
                    expected_content={"email": ["This field is required."],},
                    expected_status_code=400,
                )
            ]
        )

    @override_settings(ROOT_URLCONF=__name__, MIDDLEWARE=MIDDLEWARE)
    def test_batch_api_call_multiple(self):
        self.batch_requests(
            [
                RequestDescription(url="/users/?format=json", method="get", body=None,),
                RequestDescription(
                    url="/users/?format=json",
                    method="post",
                    body={},
                    expected_content={"email": ["This field is required."],},
                    expected_status_code=400,
                ),
            ]
        )
