from allianceutils.util import camelize
from rest_framework.renderers import JSONRenderer


class CamelCaseJSONRenderer(JSONRenderer):
    def render(self, data, *args, **kwargs):
        data = camelize(data)
        return super().render(data, *args, **kwargs)
