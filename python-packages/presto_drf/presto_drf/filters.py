from typing import Callable
from typing import Type

from django.db.models import QuerySet
from django_filters import LookupChoiceFilter
from django_filters import ModelChoiceFilter
from django_filters import ModelMultipleChoiceFilter
from django_filters.fields import ModelChoiceField
from django_filters.fields import ModelMultipleChoiceField
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

        See :meth:`djrad_rest.mixins.FilterSetRefineChoicesMixin.get_filter_refine_choices_method` for where
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
            serializer_class: Serializer class used to serializer choices. See :meth:`~djrad_rest.mixins.FilterSetRefineChoicesMixin.get_filter_refine_choices_serializer_class` for default.
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

        See :meth:`djrad_rest.mixins.FilterSetRefineChoicesMixin.get_filter_refine_choices_method` for where
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
            serializer_class: Serializer class used to serializer choices. See :meth:`~djrad_rest.mixins.FilterSetRefineChoicesMixin.get_filter_refine_choices_serializer_class` for default.
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

        See :meth:`djrad_rest.mixins.FilterSetRefineChoicesMixin.get_filter_refine_choices_method` for where
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
            serializer_class: Serializer class used to serializer choices. See :meth:`~djrad_rest.mixins.FilterSetRefineChoicesMixin.get_filter_refine_choices_serializer_class` for default.
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
