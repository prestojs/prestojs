from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import TemplateView

from django_filters import rest_framework as filters
from rest_framework.pagination import CursorPagination
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.pagination import PageNumberPagination
from rest_framework.serializers import ModelSerializer
from rest_framework.viewsets import ModelViewSet

from presto_viewmodels_drf.presto_viewmodels_drf import serializers
from xenopus_frog.models import User


class XenopusFrogAppHomepageView(LoginRequiredMixin, TemplateView):
    template_name = "xenopus_frog/homepage.html"


class UserSerializer(serializers.OptinFieldsSerializerMixin, ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "first_name", "last_name", "email", "region", "activated_at", "is_staff")
        opt_in_only_fields = ["activated_at", "is_staff"]


class UserFilterSet(filters.FilterSet):
    first_name = filters.CharFilter(lookup_expr="icontains")
    last_name = filters.CharFilter(lookup_expr="icontains")

    class Meta:
        model = User
        fields = (
            "id",
            "first_name",
            "last_name",
        )


class CustomPageNumberPagination(PageNumberPagination):
    page_size = 10
    page_query_param = "page"
    page_size_query_param = "pageSize"


class UserCursorPagination(CursorPagination):
    ordering = "date_joined"
    page_size_query_param = "pageSize"


class UserViewSet(ModelViewSet):
    queryset = User.objects.all().order_by("first_name", "last_name", "email")
    serializer_class = UserSerializer
    filterset_class = UserFilterSet
    permission_classes = []

    @property
    def pagination_class(self):
        # For demonstration purposes - real app wouldn't let user choose pagination
        pagination_type = self.request.query_params.get("paginationType")
        if pagination_type == "cursor":
            return UserCursorPagination
        if pagination_type == "limitOffset":
            return LimitOffsetPagination
        if pagination_type == "pageNumber":
            return CustomPageNumberPagination
        return None
