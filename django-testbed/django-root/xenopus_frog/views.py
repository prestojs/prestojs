from django.contrib.auth.mixins import LoginRequiredMixin
from django.db.models import Q
from django.views.generic import TemplateView
from django_filters import ModelMultipleChoiceFilter
from django_filters import rest_framework as filters
from rest_framework.pagination import CursorPagination
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.pagination import PageNumberPagination
from rest_framework.serializers import ModelSerializer
from rest_framework.viewsets import ModelViewSet

from presto_drf.mixins import SerializerOptInFieldsMixin
from xenopus_frog.models import User


class XenopusFrogAppHomepageView(LoginRequiredMixin, TemplateView):
    template_name = "xenopus_frog/homepage.html"


class UserSerializer(SerializerOptInFieldsMixin, ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "first_name",
            "last_name",
            "email",
            "region",
            "activated_at",
            "is_staff",
        )
        opt_in_only_fields = ["activated_at", "is_staff"]


class ModelIdFilter(ModelMultipleChoiceFilter):
    def filter(self, qs, value):
        return qs.filter(id__in=[record.id for record in value]) if value else qs


class UserFilterSet(filters.FilterSet):
    first_name = filters.CharFilter(lookup_expr="icontains")
    last_name = filters.CharFilter(lookup_expr="icontains")
    keywords = filters.CharFilter(method="filter_keywords")
    ids = ModelIdFilter(queryset=User.objects.all())

    class Meta:
        model = User
        fields = (
            "id",
            "ids",
            "first_name",
            "last_name",
        )

    def filter_keywords(self, qs, name, keywords):
        if not keywords:
            return qs
        filter = Q()
        for keyword in keywords.split():
            filter = filter & (
                Q(first_name__icontains=keyword)
                | Q(last_name__icontains=keyword)
                | Q(email__icontains=keyword)
            )
        return qs.filter(filter)


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
