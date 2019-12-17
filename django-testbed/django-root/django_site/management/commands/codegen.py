import time

import django.core.management.base

from django_site.codegen.codegen import run_codegen


class Command(django.core.management.base.BaseCommand):
    def handle(self, *app_labels, **options):
        start = time.time()
        run_codegen()
        print("Done in ", time.time() - start, "secs")
