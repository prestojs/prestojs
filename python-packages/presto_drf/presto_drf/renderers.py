from allianceutils.util import camelize
from rest_framework.renderers import JSONRenderer


class CamelCaseJSONRenderer(JSONRenderer):
    def render(self, data, *args, **kwargs):
        print("===>", data)
        data = camelize(data)
        print("-->", data)
        return super().render(data, *args, **kwargs)
