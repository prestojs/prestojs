from django.contrib.auth import get_user_model
from rest_framework.serializers import ModelSerializer
from rest_framework.viewsets import ModelViewSet


class UserSerializer(ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = ("email",)


class UserViewSet(ModelViewSet):
    queryset = get_user_model().objects.all()
    serializer_class = UserSerializer
    permission_classes = []
