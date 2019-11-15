# import datetime

# import django.contrib.auth.hashers as hashers
import factory
import factory.django

from ..models import AdminProfile
from ..models import CustomerProfile
from ..models import User


class UserFactory(factory.django.DjangoModelFactory):

    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")

    @factory.post_generation
    def password(record, create, extracted, **kwargs):
        password = User.objects.make_random_password()
        record.set_password(password)
        record._unencrypted_password = password

    @classmethod
    def _after_postgeneration(cls, instance, create, results=None):
        super()._after_postgeneration(instance, create, results)
        if create:
            # restore _password after save() wipes it
            instance._password = instance._unencrypted_password
            delattr(instance, "_unencrypted_password")

    class Meta:
        model = User
        default_auto_fields = True


class AdminFactory(UserFactory):
    is_staff = True

    class Meta:
        model = AdminProfile


class CustomerFactory(UserFactory):
    class Meta:
        model = CustomerProfile
