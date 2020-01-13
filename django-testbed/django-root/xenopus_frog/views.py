from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import TemplateView
from django_filters import rest_framework as filters
from rest_framework.serializers import ModelSerializer
from rest_framework.viewsets import ModelViewSet

from xenopus_frog.models import User


class BunniesSerializer(ModelSerializer):
    """
    Regulates fields exposed by default & as requested.

    Construct URLs like /?include_fields=first_name&include_fields=email to opt-in into fields.

    By default, all "opt_in_only_fields" are excluded from serializer, unless specifically opted-in.

    If any of fields specified to be included does not belong to opt_in_only_fields, the serializer
    will perform in "strict" mode that ONLY fields specced are included.
    """

    def __init__(self, *args, **kwargs):
        result = super().__init__(*args, **kwargs)

        # only if context.request is available (ie. not during inspection etc)
        if hasattr(self, "context") and "request" in self.context:
            heavy_fields = set(getattr(self.Meta, "opt_in_only_fields", []))

            if "include_fields" in self.context["request"].GET:
                include_fields = dict(self.context["request"].GET)["include_fields"]
                if not type(include_fields) == list:
                    include_fields = [include_fields]
                include_fields = set(include_fields)
            else:
                include_fields = set(self.Meta.fields).difference(heavy_fields)

            strict = not heavy_fields.issuperset(include_fields)

            # in strict mode, only fields inside include_fields are included
            # otherwise, all heavy_fields not inside include_fields gets ejected
            if strict:
                fields_to_remove = set(self.Meta.fields).difference(include_fields)
            else:
                fields_to_remove = heavy_fields.difference(include_fields)

            for f in fields_to_remove:
                del self.fields[f]

        return result


class XenopusFrogAppHomepageView(LoginRequiredMixin, TemplateView):
    template_name = "xenopus_frog/homepage.html"


class UserSerializer(BunniesSerializer):
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
