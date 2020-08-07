from allianceutils.util import camelize
from rest_framework.renderers import JSONRenderer


class CamelCaseJSONRenderer(JSONRenderer):
    """Renderer that recursively turns underscore-cased keys into camel-cased keys

    This can be set globally on the [DEFAULT_RENDERER_CLASSES](https://www.django-rest-framework.org/api-guide/settings/#default_renderer_classes)
    setting or on a ViewSet on the `renderer_classes` property.
    """

    def render(self, data, *args, **kwargs):
        data = camelize(data)
        return super().render(data, *args, **kwargs)
