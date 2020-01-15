from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import TemplateView
from django_filters import rest_framework as filters
from rest_framework.serializers import ModelSerializer
from rest_framework.viewsets import ModelViewSet

from presto_drf.mixins import SerializerOptInFieldsMixin
from xenopus_frog.models import User


class XenopusFrogAppHomepageView(LoginRequiredMixin, TemplateView):
    template_name = "xenopus_frog/homepage.html"


class UserSerializer(SerializerOptInFieldsMixin, ModelSerializer):
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


class UserViewSet(ModelViewSet):
    queryset = User.objects.all().order_by("first_name", "last_name", "email")
    serializer_class = UserSerializer
    filterset_class = UserFilterSet
    permission_classes = []
