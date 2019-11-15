from io import StringIO

from django.core.management import call_command
from django.test import TestCase

from .factory import AdminFactory
from .factory import CustomerFactory


class AuthTestCase(TestCase):
    def setUp(self):
        self.admin = AdminFactory.create()
        self.customer = CustomerFactory.create()

    # see https://gitlab.internal.alliancesoftware.com.au/alliance/template-django/issues/44
    def test_createsuperuser(self):
        output_buffer = StringIO()
        call_command(
            "createsuperuser",
            email="superuser@example.com",
            interactive=False,
            stdout=output_buffer,
        )
        output_buffer.seek(0)
        self.assertIn("Superuser created successfully.", output_buffer.read())
