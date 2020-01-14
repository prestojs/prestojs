from rest_framework import serializers


class RelatedLookupSerializer(serializers.Serializer):
    id = serializers.SerializerMethodField()
    __str__ = serializers.SerializerMethodField(method_name="_get_str")

    def get_id(self, instance):
        return instance.pk

    def _get_str(self, instance):
        backward_compatible_get_str = getattr(self, "get___str__", None)
        if backward_compatible_get_str:
            return backward_compatible_get_str(instance)
        return self.get_presto_label(instance)

    def get_presto_label(self, instance):
        return str(instance)
