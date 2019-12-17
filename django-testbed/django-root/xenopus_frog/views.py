from pathlib import Path

from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import TemplateView
from django_filters import rest_framework as filters
from rest_framework import serializers
from rest_framework.serializers import ModelSerializer
from rest_framework.viewsets import ModelViewSet

from django_site.apps import MyAppCodeGenConfig
from presto_codegen import register_serializer_viewmodel
from xenopus_frog.models import Candy
from xenopus_frog.models import User


class XenopusFrogAppHomepageView(LoginRequiredMixin, TemplateView):
    template_name = "xenopus_frog/homepage.html"


@register_serializer_viewmodel()
class UserSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "first_name", "last_name", "email", "region")


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


class CandyConfig(MyAppCodeGenConfig):
    generate_to = MyAppCodeGenConfig.frontend_path / "codegen/candy/models/generated/"
    generate_descendant_to = MyAppCodeGenConfig.frontend_path / 'models/'


@register_serializer_viewmodel(config="xenopus_frog.views.CandyConfig", fields=('color','flavor'))
class CandySerializer(ModelSerializer):
    # description = serializers.SerializerMethodField()

    class Meta:
        model = Candy
        # 'description', # FIXME - is there something we can do about SerializerMethodField? its currently ignored. do we want to create an AnyField?
        # "belongs_to",  # TODO - introduce this once relationship fields are in on frontend
        fields = (
            "color",
            "flavor",
            "is_unistable",
        )

    def get_description(self, instance):
        return f"{instance.flavor} flavored {instance.color} candy"


@register_serializer_viewmodel(
    config="xenopus_frog.views.CandyConfig",
    name="Suga",
    label="Suga",
    label_plural="Piles of Suga",
    exclude_fields=['belongs_to',]
)
class SugaSerializer(ModelSerializer):
    is_unistable = serializers.BooleanField(
        write_only=True, default=False, label="Most important fact about a candy"
    )

    class Meta:
        model = Candy
        fields = (
            "color",
            "flavor",
            "is_unistable",
            "belongs_to",
        )


class UserViewSet(ModelViewSet):
    queryset = User.objects.all().order_by("first_name", "last_name", "email")
    serializer_class = UserSerializer
    filterset_class = UserFilterSet
    permission_classes = []
