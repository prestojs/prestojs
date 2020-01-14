from typing import Callable
from typing import Type
import warnings

from allianceutils.util.camel_case import camel_to_underscore
from django.conf import settings
from django.db.models import QuerySet
from django_filters import LookupChoiceFilter
from django_filters import ModelChoiceFilter
from django_filters import ModelMultipleChoiceFilter
from django_filters.fields import ModelChoiceField
from django_filters.fields import ModelMultipleChoiceField
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from rest_framework.request import Request
from rest_framework.serializers import Serializer


class RefineModelChoiceFilter(ModelChoiceFilter):
    def __init__(
        self,
        refine_choices: Callable[[QuerySet, str, Request], QuerySet],
        serializer_class: Type[Serializer] = None,
        **kwargs,
    ):
        """Same as :py:class:`django_filters.ModelChoiceFilter` but with refine_choices arg used to
        filter a queryset when performing a search from the frontend.

        See :meth:`presto_drf.mixins.FilterSetRefineChoicesMixin.get_filter_refine_choices_method` for where
        the this is used.

        Example:

        .. code-block:: python

            country = RefineModelChoiceFilter(
                queryset=Country.objects.all(),
                refine_choices=lambda qs, keywords, request: qs.filter(name__icontains=keywords)
            )

        Args:
            refine_choices: Callable to refine choices available for selection. Accepts queryset, keywords and current request.
            **kwargs:
            serializer_class: Serializer class used to serializer choices. See :meth:`~presto_drf.mixins.FilterSetRefineChoicesMixin.get_filter_refine_choices_serializer_class` for default.
        """
        super().__init__(**kwargs)
        # Property stored here, retrieved in FilterSetRefineChoicesMixin.get_filter_refine_choices_method
        self.refine_choices = refine_choices
        # Property stored here, retrieved in FilterSetRefineChoicesMixin.get_filter_refine_choices_serializer_class
        self.refine_choices_serializer_class = serializer_class


class RefineModelMultipleChoiceFilter(ModelMultipleChoiceFilter):
    def __init__(
        self,
        refine_choices: Callable[[QuerySet, str, Request], QuerySet],
        serializer_class: Type[Serializer] = None,
        **kwargs,
    ):
        """Same as :meth:`django_filters.ModelMultipleChoiceFilter` but with refine_choices arg used to
        filter a queryset when performing a search from the frontend.

        See :meth:`presto_drf.mixins.FilterSetRefineChoicesMixin.get_filter_refine_choices_method` for where
        this is used.

        Example:

        .. code-block:: python

            country = RefineModelMultipleChoiceFilter(
                queryset=Country.objects.all(),
                refine_choices=lambda qs, keywords, request: qs.filter(name__icontains=keywords)
            )

        Args:
            refine_choices: Callable to refine choices available for selection. Accepts queryset, keywords and current request.
            **kwargs:
            serializer_class: Serializer class used to serializer choices. See :meth:`~presto_drf.mixins.FilterSetRefineChoicesMixin.get_filter_refine_choices_serializer_class` for default.
        """
        super().__init__(**kwargs)
        # Property stored here, retrieved in FilterSetRefineChoicesMixin.get_filter_refine_choices_method
        self.refine_choices = refine_choices
        # Property stored here, retrieved in FilterSetRefineChoicesMixin.get_filter_refine_choices_serializer_class
        self.refine_choices_serializer_class = serializer_class


class RefineLookupChoiceFilter(LookupChoiceFilter):
    def __init__(
        self,
        refine_choices: Callable[[QuerySet, str, Request], QuerySet],
        serializer_class: Type[Serializer] = None,
        **kwargs,
    ):
        """Same as :meth:`django_filters.LookupChoiceFilter` but with refine_choices arg used to
        filter a queryset when performing a search from the frontend.

        Only applicable when field_class on LookupChoiceFilter is ModelChoiceField or ModelMultipleChoiceField

        See :meth:`presto_drf.mixins.FilterSetRefineChoicesMixin.get_filter_refine_choices_method` for where
        this is used.

        Example:

        .. code-block:: python

            country = RefineLookupChoiceFilter(
                queryset=Country.objects.all(),
                refine_choices=lambda qs, keywords, request: qs.filter(name__icontains=keywords)
                field_class=ModelChoiceField,
                lookup_choices=['exact', 'isnull'],
            )

        Args:
            refine_choices: Callable to refine choices available for selection. Accepts queryset, keywords and current request.
            **kwargs:
            serializer_class: Serializer class used to serializer choices. See :meth:`~presto_drf.mixins.FilterSetRefineChoicesMixin.get_filter_refine_choices_serializer_class` for default.
        """
        super().__init__(**kwargs)
        valid_super_classes = [ModelChoiceField, ModelMultipleChoiceField]
        if not any(
            [
                issubclass(self.field_class, field_class)
                for field_class in valid_super_classes
            ]
        ):
            valid_names = ", ".join(
                [field_class.__name__ for field_class in valid_super_classes]
            )
            raise ValueError(f"field_class must be one of {valid_names}")
        # Property stored here, retrieved in FilterSetRefineChoicesMixin.get_filter_refine_choices_method
        self.refine_choices = refine_choices
        # Property stored here, retrieved in FilterSetRefineChoicesMixin.get_filter_refine_choices_serializer_class
        self.refine_choices_serializer_class = serializer_class


class CamelCaseOrderingFilter(OrderingFilter):
    def get_ordering(self, request, queryset, view):
        """
        Ordering is set by a comma delimited ?ordering=... query parameter.

        The `ordering` query parameter can be overridden by setting
        the `ordering_param` value on the OrderingFilter or by
        specifying an `ORDERING_PARAM` value in the API settings.
        """
        # Support field name in URL mapping to different underlying field
        # eg. country => country__name
        params = request.query_params.get(self.ordering_param)
        if params:
            fields = []
            for param in params.split(","):
                param = camel_to_underscore(param.strip())
                fields.append(param)
            ordering = self.remove_invalid_fields(queryset, fields, view, request)
            if settings.DEBUG:
                invalid_fields = set(fields) - set(ordering)
                if invalid_fields:
                    warnings.warn(
                        "Attempted to order on invalid fields: %s. If this is unexpected make sure "
                        "the viewset specifies these fields under 'ordering_fields'"
                        % ",".join(invalid_fields),
                        RuntimeWarning,
                    )
            if ordering:
                return ordering

        # No ordering was included, or all the ordering fields were invalid
        return self.get_default_ordering(view)


class PrestoDjangoFilterBackend(DjangoFilterBackend):
    """
    Handles converting camel to underscore as required on field names
    """

    def filter_queryset(self, request, queryset, view):
        filter_class = self.get_filterset_class(view, queryset)

        qs = queryset
        if filter_class:
            query_params = request.query_params.copy()
            keys = list(request.query_params.keys())
            for key in keys:
                camel_key = camel_to_underscore(key)
                if key != camel_key:
                    value = query_params.pop(key)
                    query_params.setlist(camel_key, value)

            qs = filter_class(query_params, queryset=queryset, request=request).qs

        # Allow filtering by pk on quersets by default - used
        # on related lookups eg. ManyRelatedFormatter
        if "pk" in request.query_params:
            return qs.filter(pk__in=request.query_params.getlist("pk"))
        return qs
