import importlib
from typing import List

from django.conf import settings
from django.core import checks
from django.core.exceptions import ImproperlyConfigured
from django_filters.fields import ModelChoiceField
from django_filters.fields import ModelMultipleChoiceField
from django_filters.filters import LookupChoiceFilter
from django_filters.filters import ModelMultipleChoiceFilter
from django_filters.filters import QuerySetRequestMixin
from djrad_rest.viewsets import DjradGenericViewSet
from rest_framework.serializers import ALL_FIELDS

from .mixins import FilterSetRefineChoicesMixin
from .renderers import CamelCaseJSONRenderer

ID_ERROR_REGISTRATION_QUERYSET_MODEL_MISMATCH = "djrad.E001"
ID_ERROR_VIEWSET_EXTEND_BASE_CLASS = "djrad.E002"
ID_ERROR_SERIALIZER_CLASS_NOT_SPECIFIED = "djrad.E003"
ID_ERROR_ONE_OF_VIEWSET_OR_SERIALIZER_CLASS = "djrad.E004"
ID_ERROR_SERIALIZER_REGISTRATION_MODEL_MISMATCH = "djrad.E005"
ID_ERROR_SERIALIZER_FIELD_NAMES_EXLUSIVE = "djrad.E006"
ID_ERROR_ONE_OF_FIELDS_SERIALIZER_VIEWSET = "djrad.E007"
ID_ERROR_INVALID_SERIALIZER_FIELD_NAMES = "djrad.E008"
ID_ERROR_INVALID_CRUD_FIELDS = "djrad.E009"
ID_ERROR_FORBID_ALL_FIELDS = "djrad.E010"
ID_ERROR_DUPLICATE_URL_BASE = "djrad.E011"
ID_ERROR_NO_FILTER_SET_REFINE_CHOICES_MIXIN = "djrad.E012"
ID_ERROR_NO_CHOICE_REFINEMENT_WITH_PAGINATION = "djrad.E013"
ID_ERROR_CHOICE_REFINEMENT_DUPLICATE = "djrad.E014"
ID_ERROR_GLOBAL_OBJECT_ACTION_CONFLICT = "djrad.E015"
ID_ERROR_DEFAULT_RENDERER_CLASS = "djrad.E016"
ID_ERROR_MISSING_PERMISSION_ACTION_MAPPING = "djrad.E017"
ID_ERROR_INVALID_PK_FIELD_NAMES = "djrad.E018"
ID_ERROR_ASYNC_PERM_MISSING = "djrad.E019"

ID_WARNING_DEFAULT_RENDERER = "djrad.W001"


def must_inherit_from(parent, option, obj, id):
    return [
        checks.Error(
            "The value of '%s' must inherit from '%s'." % (option, parent),
            obj=obj.__class__,
            id=id,
        )
    ]


class SettingsChecks:
    def check(self):
        errors = []
        errors += self.check_default_renderers()
        return errors

    def check_default_renderers(self):
        default_renderers = settings.REST_FRAMEWORK.get("DEFAULT_RENDERER_CLASSES", [])
        for index, renderer in enumerate(default_renderers):
            module_name, class_name = renderer.rsplit(".", 1)
            module = importlib.import_module(module_name)
            renderer_class = getattr(module, class_name)
            if issubclass(renderer_class, EntitiesCamelCaseJSONRenderer):
                if index == 0:
                    return []
                return [
                    checks.Warning(
                        "%s is not default renderer. This has the potential to cause issues, see: "
                        "http://www.django-rest-framework.org/api-guide/renderers/#ordering-of-renderer-classes"
                        % renderer,
                        hint="Make %s the first entry in REST_FRAMERORK.DEFAULT_RENDERER_CLASSES"
                        % renderer,
                        obj=settings,
                        id=ID_WARNING_DEFAULT_RENDERER,
                    )
                ]

        return [
            checks.Error(
                "At least one renderer must inherit from djrad_rest.renderers.EntitiesCamelCaseJSONRenderer",
                hint="Check your settings for REST_FRAMERORK.DEFAULT_RENDERER_CLASSES",
                obj=settings,
                id=ID_ERROR_DEFAULT_RENDERER_CLASS,
            )
        ]


@checks.register
def check_settings(*args, **kwargs):
    return SettingsChecks().check()


class ModelRegistrationChecks:
    def check(self, registration):
        errors = []
        errors += self.check_viewset_class(registration)
        errors += self.check_filterset(registration)
        errors += self.check_serializer_class(registration)
        errors += self.check_serializer_field_names(registration)
        errors += self.check_crud_fields(registration)
        errors += self.check_permissions(registration)
        errors += self.check_pk_field_name(registration)

        return errors

    def check_viewset_class(self, registration):
        viewset_class = registration.viewset_class
        errors = []
        if not viewset_class:
            return errors
        if getattr(viewset_class, "queryset", None) is not None:
            if viewset_class.queryset.model != registration.model:
                errors.append(
                    checks.Error(
                        f"viewset_class queryset model ({viewset_class.queryset.model.__name__}) "
                        f"does not match registration model ({registration.model.__name__})",
                        obj=registration.__class__,
                        id=ID_ERROR_REGISTRATION_QUERYSET_MODEL_MISMATCH,
                    )
                )
        if not issubclass(viewset_class, DjradGenericViewSet):
            errors += must_inherit_from(
                DjradGenericViewSet,
                "viewset_class",
                registration,
                ID_ERROR_VIEWSET_EXTEND_BASE_CLASS,
            )
        if not registration.serializer_class:
            # Technically for a DRF viewset you don't have to define serializer_class - you can just
            # implement get_serializer_class(). We need to know about the serializer_class at startup
            # and so it essentially needs to be known statically. As such we required that there be
            # a serializer_class always specified. get_serializer_class can still be implemented but
            # is only relevant for per request dynamic behaviour.
            serializer_class = viewset_class.serializer_class
            if not serializer_class:
                errors.append(
                    checks.Error(
                        f"serializer_class must be specified on your viewset for model {registration.model.__name__} or provided explicitly on "
                        "the registration class. If you implement get_serializer_class() this is respected but only for "
                        "choosing the serializer class on each request. We must know about the serializer_class "
                        "statically to provide the frontend with a description of the available fields.",
                        obj=registration.__class__,
                        id=ID_ERROR_SERIALIZER_CLASS_NOT_SPECIFIED,
                    )
                )
        return errors

    def check_serializer_class(self, registration):
        serializer_class = registration.serializer_class
        viewset_class = registration.viewset_class
        errors = []
        if serializer_class and viewset_class and viewset_class.serializer_class:
            errors.append(
                checks.Error(
                    "Only one of viewset_class or serializer_class should be specified",
                    obj=registration.__class__,
                    id=ID_ERROR_ONE_OF_VIEWSET_OR_SERIALIZER_CLASS,
                )
            )

        if serializer_class and serializer_class.Meta.model != registration.model:
            errors.append(
                checks.Error(
                    f"serializer_class is for {serializer_class.Meta.model.__name__} "
                    f"but ModelRegistration is for {registration.model.__name__} - "
                    f"they should match",
                    obj=registration.__class__,
                    id=ID_ERROR_SERIALIZER_REGISTRATION_MODEL_MISMATCH,
                )
            )

        return errors

    def check_serializer_field_names(self, registration):
        field_names = registration.serializer_field_names
        serializer_class = registration.serializer_class
        if not serializer_class and registration.viewset_class:
            serializer_class = registration.viewset_class.serializer_class
        errors = []
        if field_names and serializer_class:
            errors.append(
                checks.Error(
                    "serializer_field_names should only be specified if serializer_class or viewset_class is not provided",
                    obj=registration.__class__,
                    id=ID_ERROR_SERIALIZER_FIELD_NAMES_EXLUSIVE,
                )
            )
        if not field_names and not serializer_class:
            errors.append(
                checks.Error(
                    "One of serializer_field_names, serializer_class or viewset_class must be provided",
                    obj=registration.__class__,
                    id=ID_ERROR_ONE_OF_FIELDS_SERIALIZER_VIEWSET,
                )
            )

        if field_names:
            if field_names == ALL_FIELDS:
                errors.append(
                    checks.Error(
                        "ALL_FIELDS should not be used - explicitly list field names",
                        obj=registration.__class__,
                        id=ID_ERROR_FORBID_ALL_FIELDS,
                    )
                )
            else:
                unknown_fields = set(field_names).difference(
                    set([field.name for field in registration.model._meta.get_fields()])
                )
                if unknown_fields:
                    errors.append(
                        checks.Error(
                            "Invalid field(s) specified in serializer_field_names: {}".format(
                                ", ".join(unknown_fields)
                            ),
                            obj=registration.__class__,
                            id=ID_ERROR_INVALID_SERIALIZER_FIELD_NAMES,
                        )
                    )

        return errors

    def check_crud_fields(self, registration):
        errors = []
        try:
            serializer_class = registration.get_serializer_class()
        except ImproperlyConfigured:
            # This is handled in other checks
            return errors
        if not serializer_class:
            return errors
        serializer_fields = serializer_class().get_fields()
        valid_field_names = set(serializer_fields.keys())
        for attr_name in (
            "list_fields",
            "create_fields",
            "update_fields",
            "detail_fields",
        ):
            values = getattr(registration, attr_name)
            if not values:
                continue
            unknown_fields = set(values).difference(valid_field_names)
            if unknown_fields:
                errors.append(
                    checks.Error(
                        "Invalid field(s) specified in {}: {}".format(
                            attr_name, ", ".join(unknown_fields)
                        ),
                        obj=registration.__class__,
                        id=ID_ERROR_INVALID_CRUD_FIELDS,
                    )
                )

        return errors

    def check_filterset(self, registration) -> List[checks.Error]:
        """Check filter configuration is defined correctly"""
        filter_class = registration.get_filter_class()
        if not filter_class:
            return []

        errors = []
        viewset_class = registration.viewset_class
        viewset = viewset_class()
        filters = filter_class.get_filters()
        for filter_name in registration.get_filter_names(filters):
            method_name = f"filter_refine_choices_{filter_name}"
            filter = filters.get(filter_name)
            is_lookup_choice_filter = isinstance(filter, LookupChoiceFilter)
            if is_lookup_choice_filter:
                # When dealing with LookupChoiceFilter we no longer use the base
                # filter types which implement QuerySetRequestMixin. Instead we
                # only have the underlying fields - check explicitly for ModelChoice
                # fields.
                requires_backend_search = issubclass(
                    filter.field_class, ModelMultipleChoiceField
                ) or issubclass(filter.field_class, ModelChoiceField)
            else:
                requires_backend_search = isinstance(filter, QuerySetRequestMixin)
            viewset_filter_refine_choices = getattr(viewset_class, method_name, None)
            filter_refine_choices = getattr(filter, "refine_choices", None)
            if requires_backend_search and not issubclass(
                viewset_class, FilterSetRefineChoicesMixin
            ):
                errors.append(
                    checks.Error(
                        f"Viewset '{viewset_class.__name__}' has a filter that supports backend "
                        f"queryset filtering but doesn't implement 'FilterSetRefineChoicesMixin'. Either add "
                        f"'FilterSetRefineChoicesMixin' to '{viewset_class.__name__}' or exclude "
                        f"filter '{filter_name}' from get_filter_names on the registration "
                        f"class '{registration.__class__.__name__}'.",
                        obj=registration.__class__,
                        id=ID_ERROR_NO_FILTER_SET_REFINE_CHOICES_MIXIN,
                    )
                )
            elif requires_backend_search:
                paginator_class = viewset.get_filter_paginator_class(
                    filter_name, filter
                )
                if paginator_class and not (
                    viewset_filter_refine_choices or filter_refine_choices
                ):
                    suggested_filter = "RefineModelChoiceFilter"
                    if isinstance(filter, ModelMultipleChoiceFilter):
                        suggested_filter = "RefineModelMultipleChoiceFilter"
                    elif is_lookup_choice_filter:
                        suggested_filter = "RefineLookupChoiceFilter"
                    errors.append(
                        checks.Error(
                            f"Filter '{filter_name}' on viewset '{viewset_class.__name__}' "
                            f"has a paginator class defined but does not support choice refinement on "
                            f"the backend. Either implement 'get_filter_paginator_class()' "
                            f"and return 'None' to disable pagination, implement '{method_name}' "
                            f"on your viewset or use {suggested_filter}",
                            obj=registration.__class__,
                            id=ID_ERROR_NO_CHOICE_REFINEMENT_WITH_PAGINATION,
                        )
                    )
            if viewset_filter_refine_choices and filter_refine_choices:
                errors.append(
                    checks.Error(
                        f"Filter choice refinement method '{method_name}' is defined on viewset "
                        f"{viewset_class.__name__} but also passed to "
                        f"filter on refine_choices kwarg. Only one should be defined.",
                        obj=registration.__class__,
                        id=ID_ERROR_CHOICE_REFINEMENT_DUPLICATE,
                    )
                )

        return errors

    def check_permissions(self, registration):
        errors = []
        actions = set(registration.get_global_actions()).union(
            registration.get_object_actions()
        )
        perm_map = registration.get_action_permissions()

        missing_action_mappings = actions.difference(set(perm_map.keys()))
        if missing_action_mappings:
            errors.append(
                checks.Error(
                    "Missing permission action mappings for actions: %s"
                    % ", ".join(sorted(missing_action_mappings)),
                    obj=registration.__class__,
                    id=ID_ERROR_MISSING_PERMISSION_ACTION_MAPPING,
                )
            )

        permissions = set(registration.get_global_permissions()).union(
            registration.get_object_permissions()
        )
        async_permissions = set(registration.get_async_permissions())
        missing_async_permissions = async_permissions.difference(set(permissions))
        if missing_async_permissions:
            errors.append(
                checks.Error(
                    "Async permissions must exist in either get_object_permissions or get_global_permissions. Permission missing: %s"
                    % ", ".join(sorted(missing_async_permissions)),
                    obj=registration.__class__,
                    id=ID_ERROR_ASYNC_PERM_MISSING,
                )
            )

        actions = set(registration.get_global_actions()).intersection(
            registration.get_object_actions()
        )
        if actions:
            errors.append(
                checks.Error(
                    f"Global action name cannot also be used as object action name. See action(s): {', '.join(actions)}",
                    obj=registration.__class__,
                    id=ID_ERROR_GLOBAL_OBJECT_ACTION_CONFLICT,
                )
            )

        return errors

    def check_pk_field_name(self, registration):
        """Check that specified pk_field_name is a valid field on the serializer"""
        errors = []
        try:
            serializer_class = registration.get_serializer_class()
        except ImproperlyConfigured:
            # This is handled in other checks
            return errors
        if not serializer_class:
            return errors

        pk_field_names = registration.get_pk_field_name()
        if type(pk_field_names) == str:
            pk_field_names = [pk_field_names]
        serializer_fields = serializer_class().get_fields()
        valid_field_names = set(serializer_fields.keys())
        unknown_fields = sorted(set(pk_field_names).difference(valid_field_names))
        if unknown_fields:
            errors.append(
                checks.Error(
                    "Invalid field(s) specified in pk_field_names: {}".format(
                        ", ".join(unknown_fields)
                    ),
                    obj=registration.__class__,
                    id=ID_ERROR_INVALID_PK_FIELD_NAMES,
                )
            )
        return errors


class RestSiteChecks:
    def check(self, site):
        errors = []
        errors += self.check_unique_url_base(site)

        return errors

    def check_unique_url_base(self, site):
        url_bases = set()
        duplicates = set()
        for registration in site.registry.values():
            url_base = registration.get_url_base()
            if url_base in url_bases:
                duplicates.add(url_base)
            url_bases.add(url_base)

        if duplicates:
            return [
                checks.Error(
                    "Duplicate url_base detected: {}".format(", ".join(duplicates)),
                    hint="Check url_base property or get_url_base on model registrations",
                    obj=site,
                    id=ID_ERROR_DUPLICATE_URL_BASE,
                )
            ]
        return []
