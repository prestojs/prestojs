from allianceutils.checks import check_admins
from allianceutils.checks import check_url_trailing_slash
from django.apps.config import AppConfig
from django.conf import settings
from django.core.checks import register
from django.core.checks import Tags

from presto_codegen import BaseCodeGenConfig

ID_WARNING_GIT = "django_site.W001"
ID_WARNING_GIT_HOOKS = "django_site.W002"
ID_ERROR_GIT_HOOKS = "django_site.E003"
ID_ERROR_ADMINS = "django_site.W004"


def add_watchers(sender, **kwargs):
    """In dev we watch our .env and permissions files for changes to trigger dev server reload"""
    from manage import find_file_recursive

    env_file = find_file_recursive(".env")
    if env_file:
        sender.watch_file(env_file)

    sender.watch_file(settings.CSV_PERMISSIONS_PATH)


class DjangoSiteAppConfig(AppConfig):
    name = "django_site"
    verbose_name = "Django Site"

    def ready(self):
        check = check_url_trailing_slash(
            expect_trailing_slash=True, ignore_attrs={"_regex": ["^.*"]}
        )
        register(check=check, tags=Tags.urls)
        # register(check=check_git_hooks)
        register(check=check_admins)
        if settings.DEBUG:
            from django.utils.autoreload import autoreload_started

            autoreload_started.connect(add_watchers)


class MyAppCodeGenConfig(BaseCodeGenConfig):
    frontend_path = settings.BASE_DIR.parent / "frontend/src/"
    generate_to = frontend_path / 'models/generated/'
    generate_descendant_to = frontend_path / 'models/'

