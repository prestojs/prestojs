from django.test import TestCase
from rest_framework.serializers import ModelSerializer

from xenopus_frog.models import User

from ..serializers import OptinFieldsSerializerMixin


class UserSerializer(OptinFieldsSerializerMixin, ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "first_name", "last_name", "email", "activated_at", "is_staff")
        opt_in_only_fields = ["activated_at", "is_staff"]


class MockRequest:
    def __init__(self, query_params):
        self.query_params = query_params


class OptinFieldMixinTestcase(TestCase):
    def test_no_optin_field_returned_by_default(self):
        context = {"request": MockRequest({})}
        serializer = UserSerializer(context=context)
        self.assertTrue("id" in serializer.fields)
        self.assertTrue("first_name" in serializer.fields)
        self.assertTrue("activated_at" not in serializer.fields)
        self.assertTrue("is_staff" not in serializer.fields)

    def test_specify_one_optin_field(self):
        context = {"request": MockRequest({"include_fields": "is_staff"})}
        serializer = UserSerializer(context=context)
        self.assertTrue("id" in serializer.fields)
        self.assertTrue("first_name" in serializer.fields)
        self.assertTrue("activated_at" not in serializer.fields)
        self.assertTrue("is_staff" in serializer.fields)

    def test_specify_multiple_optin_field(self):
        context = {"request": MockRequest({"include_fields": "is_staff,activated_at"})}
        serializer = UserSerializer(context=context)
        self.assertTrue("id" in serializer.fields)
        self.assertTrue("first_name" in serializer.fields)
        self.assertTrue("activated_at" in serializer.fields)
        self.assertTrue("is_staff" in serializer.fields)

    def test_strict_mode_no_optin_field(self):
        context = {"request": MockRequest({"include_fields": "id"})}
        serializer = UserSerializer(context=context)
        self.assertTrue("id" in serializer.fields)
        self.assertTrue("first_name" not in serializer.fields)
        self.assertTrue("activated_at" not in serializer.fields)
        self.assertTrue("is_staff" not in serializer.fields)

    def test_strict_mode_with_optin_field(self):
        context = {"request": MockRequest({"include_fields": "id,is_staff"})}
        serializer = UserSerializer(context=context)
        self.assertTrue("id" in serializer.fields)
        self.assertTrue("first_name" not in serializer.fields)
        self.assertTrue("activated_at" not in serializer.fields)
        self.assertTrue("is_staff" in serializer.fields)
