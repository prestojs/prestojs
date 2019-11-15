"""
We override the core check command to make --deploy the default on production
"""
from django.conf import settings
from django.core.management.commands.check import Command as CheckCommand


class Command(CheckCommand):
    def handle(self, *app_labels, **options):
        if not settings.DEBUG and not getattr(settings, "AUTOMATED_TESTS"):
            options["deploy"] = True
        return super().handle(*app_labels, **options)
