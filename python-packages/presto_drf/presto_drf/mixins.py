from typing import Callable
from typing import Optional
from typing import Type

from django.db.models import QuerySet
from django_filters.fields import LookupChoiceField
from django_filters.rest_framework import DjangoFilterBackend
from django_filters.rest_framework import Filter
from rest_framework import serializers
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.pagination import BasePagination
from rest_framework.request import Request
from rest_framework.response import Response

from .serializers import RelatedLookupSerializer

filter_set_refine_choices_api_url_base = "filter-refine-choices/"


class FilterSetRefineChoicesMixin:
    """
    Defines an DRF route that is used to lookup available values for filters that rely on
    a underlying model queryset (ModelChoiceFilter etc)

    By default you must explicitly define how to perform a lookup for each lookup field by either:

    1) Using the `lookup` argument to :meth:`presto_drf.filters.RefineModelChoiceFilter` or
       :meth:`presto_drf.filters.RefineModelMultipleChoiceFilter`

    2) Defining a method on your viewset with the name `filter_refine_choices_<filter_name>(self, qs, keywords, request)`

    If you wish to use client side filtering instead of server side filtering you must disable
    pagination by setting :meth:`presto_drf.mixins.FilterSetRefineChoicesMixin.get_filter_paginator` to None
    """

    @action(
        detail=False,
        methods=["GET"],
        url_path=f"{filter_set_refine_choices_api_url_base}(?P<filter_name>.*)",
    )
    def filter_refine_choices(
        self, request: Request, filter_name: str, **kwargs
    ) -> Response:
        """Endpoint for refining available choices for a filter. Accepts the following query params:

            values - pk value(s) to limit results to; param may appear multiple times
               (treated as a list using request.query_params.get_list)
            keywords - single string containing search keywords that will be passed to the
                method returned from :meth:`presto_drf.mixins.FilterSetRefineChoicesMixin.get_filter_refine_choices_method`

        Returns:
            data serialized with serializer as specified by :meth:`presto_drf.mixins.FilterSetRefineChoicesMixin.get_filter_refine_choices_serializer_class`
        """
        filter_backend = DjangoFilterBackend()
        qs = self.get_queryset()
        filter_class = filter_backend.get_filterset_class(self, qs)
        if not filter_class:
            return Response(
                "No filterset_class or filterset_fields defined",
                status=status.HTTP_404_NOT_FOUND,
            )
        filter_instance = filter_class(
            request.query_params, queryset=qs, request=request
        )
        f = filter_instance.filters.get(filter_name)
        if not f:
            return Response(
                "Bad filter name %s" % filter_name, status=status.HTTP_400_BAD_REQUEST
            )
        filterset_qs = self.get_filter_refine_choices_queryset(filter_name, f)
        # Frontend may request specific values upfront
        # eg. when populating initial values in a drop down
        values = [v for v in request.query_params.getlist("values") if v != ""]
        if values:
            filterset_qs = filterset_qs.filter(pk__in=values)

        keywords = request.query_params.get("keywords", "")
        filter_refine_choices = self.get_filter_refine_choices_method(filter_name, f)
        if filter_refine_choices:
            filterset_qs = filter_refine_choices(filterset_qs, keywords, request)

        paginator = self.get_filter_paginator(filter_name, f)
        if paginator is not None:
            page = paginator.paginate_queryset(filterset_qs, request, view=self)
            serializer = self.get_filter_refine_choices_serializer(
                filter_name, f, page, many=True
            )
            return paginator.get_paginated_response(serializer.data)

        return Response(
            self.get_filter_refine_choices_serializer(
                filter_name, f, filterset_qs, many=True
            ).data
        )

    def get_filter_refine_choices_method(
        self, filter_name: str, filter: Filter
    ) -> Optional[Callable[[QuerySet, str, Request], QuerySet]]:
        """Get method to use to refine choices on a filter

        This can either be a filter on viewset named as filter_refine_choices_<filter_name>
        or a 'lookup' property on the filter (see :meth:`~presto_drf.filters.RefineModelChoiceFilter`)

        This method will be passed the base queryset, the keywords to
        search on and the request object.
        """
        if hasattr(filter, "refine_choices"):
            return filter.refine_choices
        return getattr(self, "filter_refine_choices_{}".format(filter_name), None)

    def get_filter_paginator(
        self, filter_name: str, filter: Filter
    ) -> Optional[BasePagination]:
        """Paginator instance to use for API response. Returns `None` if no paginator class returned
        from :meth:`presto_drf.mixins.FilterSetRefineChoicesMixin.get_filter_paginator_class`. You typically don't
        need to implement this - implement :meth:`presto_drf.mixins.FilterSetRefineChoicesMixin.get_filter_paginator_class`
        instead.

        Args:
            filter_name: Name of filter being applied
            filter: Filter instance from FilterSet

        Returns:
            Paginator instance to use
        """
        if not hasattr(self, "_filter_paginator_cache"):
            self._filter_paginator_cache = {}
        if filter_name not in self._filter_paginator_cache:
            paginator_class = self.get_filter_paginator_class(filter_name, filter)
            if paginator_class is None:
                self._filter_paginator_cache[filter_name] = None
            else:
                self._filter_paginator_cache[filter_name] = paginator_class()
        return self._filter_paginator_cache[filter_name]

    def get_filter_paginator_class(
        self, filter_name: str, filter: Filter
    ) -> Optional[Type[BasePagination]]:
        """Paginator class to use for API response. Return `None` to disable pagination.

        Args:
            filter_name: Name of filter being applied
            filter: Filter instance from FilterSet

        Returns:
            Optional[Type[BasePagination]]: Paginator class to use.
        """
        from .viewsets import StandardResultsSetPagination

        return StandardResultsSetPagination

    def get_filter_refine_choices_queryset(
        self, filter_name: str, filter: Filter
    ) -> QuerySet:
        """Return queryset to use for a particular filter. Defaults to extracting from defined filter.

        Args:
            filter_name: Name of filter being applied
            filter: Filter instance from FilterSet

        Returns:
            Queryset to use. May be filtered further using method returned from
            :meth:`presto_drf.mixins.FilterSetRefineChoicesMixin.get_filter_refine_choices_method`
        """
        field = filter.field
        if isinstance(field, LookupChoiceField):
            field = field.fields[0]
        limit_choices_to = field.get_limit_choices_to()
        qs = field.queryset
        if limit_choices_to is not None:
            qs = qs.complex_filter(limit_choices_to)
        return qs

    def get_filter_refine_choices_serializer_context(self):
        return self.get_serializer_context()

    def get_filter_refine_choices_serializer(
        self, filter_name: str, filter: Filter, *args, **kwargs
    ):
        """Return the serializer instance that should be used for serializing results"""
        serializer_class = self.get_filter_refine_choices_serializer_class(
            filter_name, filter
        )
        kwargs["context"] = self.get_filter_refine_choices_serializer_context()
        return serializer_class(*args, **kwargs)

    def get_filter_refine_choices_serializer_class(
        self, filter_name: str, filter: Filter
    ) -> Type[serializers.Serializer]:
        """Get DRF serializer class to use for serializing results from endpoint

        If the attribute refine_choices_serializer_class exists on the filter that will
        be used otherwise defaults to RelatedLookupSerializer.

        See :meth:`~presto_drf.filters.RefineModelMultipleChoiceFilter` and :meth:`~presto_drf.filters.RefineModelChoiceFilter`
        for filters that support this.

        Args:
            filter_name: name of filter results are being serializer for
            filter: Filter instance from FilterSet

        Returns:
            Serializer class to use
        """
        if (
            hasattr(filter, "refine_choices_serializer_class")
            and filter.refine_choices_serializer_class is not None
        ):
            return filter.refine_choices_serializer_class

        return RelatedLookupSerializer


class SerializerOptinFieldsMixin:
    """
    Regulates fields exposed by default & as requested.

    Construct URLs like /?include_fields=first_name,email to opt-in into fields.

    By default, all "opt_in_only_fields" are excluded from serializer, unless specifically opted-in.

    If any of fields specified to be included does not belong to opt_in_only_fields, the serializer
    will perform in "strict" mode that ONLY fields specced are included.
    """

    def __init__(self, *args, **kwargs):
        result = super().__init__(*args, **kwargs)

        # only if context.request is available (ie. not during inspection etc)
        if hasattr(self, "context") and (
            "request" in self.context or "include_fields" in self.context
        ):
            heavy_fields = set(getattr(self.Meta, "opt_in_only_fields", []))

            if "include_fields" in self.context["request"].query_params:
                include_fields = set(
                    self.context["request"].query_params["include_fields"].split(",")
                )
            elif "include_fields" in self.context:
                if type(self.context["include_fields"]) == str:
                    include_fields = set(self.context["include_fields"].split(","))
                else:
                    include_fields = set(self.context["include_fields"])
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
