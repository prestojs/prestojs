import importlib

from django.conf import settings
from django.core import checks

from .renderers import CamelCaseJSONRenderer

ID_ERROR_DEFAULT_RENDERER_CLASS = "presto.E001"

ID_WARNING_DEFAULT_RENDERER = "presto.W001"


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
            if issubclass(renderer_class, CamelCaseJSONRenderer):
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
                "At least one renderer must inherit from presto_drf.renderers.CamelCaseJSONRenderer",
                hint="Check your settings for REST_FRAMERORK.DEFAULT_RENDERER_CLASSES",
                obj=settings,
                id=ID_ERROR_DEFAULT_RENDERER_CLASS,
            )
        ]


@checks.register
def check_settings(*args, **kwargs):
    return SettingsChecks().check()


# TODO - ACTUAL CHECKS PENDING - Dave mentioned we'll limit checks to codegen decorated parts. Easier to see whats the best way to do it post codegen-pt1 merge.
