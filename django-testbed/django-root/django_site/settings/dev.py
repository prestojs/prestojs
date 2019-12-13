"""
Development settings and globals
"""
from distutils.util import strtobool as _strtobool
import hashlib as _hashlib
import logging as _logging
from pathlib import Path
import random as _random
import re as _re
import sys as _sys
import warnings as _warnings

from .base import *

# ----------------------------------------------------------------------------------------------------------------------
# Core Site configuration

DEBUG = _strtobool(get_env_setting("DEBUG", "1"))
DEBUG_WEBPACK = True
AUTOMATED_TESTS = True

ALLOWED_HOSTS += [
    "127.0.0.1",
    "localhost",
]

# WSGI_APPLICATION = None

INTERNAL_IPS = [
    "127.0.0.1",
]

# Add this to your base template to alter styling based on the environment
# (eg change background colour depending on whether prod/stage/dev)
BODY_ENV_CLASS = "env-dev"

# ----------------------------------------------------------------------------------------------------------------------
# Application definition

INSTALLED_APPS += (
    # 'ui_patterns',
)

# Include models required for unit tests
INSTALLED_APPS += TEST_MODEL_APPS

# Django Debug Toolbar (https://github.com/jazzband/django-debug-toolbar)
# Off by default
# "DEBUG_TOOLBAR=1 ./manage.py runserver" to run server w/ django debug toolbar on
if _strtobool(get_env_setting("DEBUG_TOOLBAR", "0")):
    INSTALLED_APPS += ("debug_toolbar",)
    MIDDLEWARE += ("debug_toolbar.middleware.DebugToolbarMiddleware",)
    DEBUG_TOOLBAR_CONFIG = {
        "SKIP_TEMPLATE_PREFIXES": (
            "django/forms/widgets/",
            "admin/widgets/",
            "floppyforms/",  # needed to avoid infinite loops
        ),
    }

# Django Silk (https://github.com/jazzband/django-silk)
# On by default
# "DJANGO_SILK=0 ./manage.py runserver" to run server w/ django silk off
if _strtobool(get_env_setting("DJANGO_SILK", "1")):
    INSTALLED_APPS += ("silk",)
    MIDDLEWARE += ("silk.middleware.SilkyMiddleware",)


# ----------------------------------------------------------------------------------------------------------------------
# Template configuration

if DEBUG:
    for _tpl in TEMPLATES:
        _tpl["OPTIONS"]["debug"] = True


# ----------------------------------------------------------------------------------------------------------------------
# Database Configuration
# https://docs.djangoproject.com/en/dev/ref/settings/#databases

# NOTE: The dev database name is shared with other developers,
# so use something sensible and unambiguous (`reponame`, or `clientname_reponame`)
DATABASES["default"]["NAME"] = get_env_setting("DB_NAME", "presto")
DATABASES["default"]["PORT"] = get_env_setting("DB_PORT", "5432")
DATABASES["default"]["USER"] = get_env_setting(["DB_USER", "USER"])
_db_password = get_env_setting("DB_PASSWORD", None)
if _db_password is not None:
    DATABASES["default"]["PASSWORD"] = _db_password


# ----------------------------------------------------------------------------------------------------------------------
# Static files (CSS, JavaScript, Images)

if DEBUG:
    WEBPACK_LOADER["DEFAULT"]["STATS_FILE"] = (
        PROJECT_DIR / "frontend/dev/webpack-stats-dev.json"
    )


# ----------------------------------------------------------------------------------------------------------------------
# SECRET_KEY

# If there is no SECRET_KEY defined, will write one to disk so that sessions are preserved across restarts
SECRET_KEY = get_env_setting("SECRET_KEY", "")
if SECRET_KEY == "":
    import subprocess as _subprocess

    try:
        _unhashed_secret = (Path(__file__).parent / "SECRET_KEY").read_text()
        if len(_unhashed_secret) == 0:
            # an empty file might as well not be there
            raise FileNotFoundError()
    except FileNotFoundError:
        with open(Path(__file__).parent / "SECRET_KEY", "wb") as _fp:
            _unhashed_secret = "\n".join(
                [
                    "# This is an automatically generated secret key",
                    "# DO NOT COMMIT THIS",
                    "# DO NOT USE THIS FOR PRODUCTION",
                    _hashlib.sha256(
                        str(_random.SystemRandom().getrandbits(256)).encode("utf-8")
                    ).hexdigest(),
                ]
            )
            _fp.write(_unhashed_secret.encode("utf-8"))
    # This slows down startup by 0.3-0.4 sec, but ensures that we have a semi-randomised output that will fail
    # on linux, so should make it harder to predict the SECRET_KEY if it is accidentally committed to source
    _proc = _subprocess.Popen(
        ["system_profiler", "SPStorageDataType"], stdout=_subprocess.PIPE
    )
    _unhashed_secret += "\n" + "\n".join(
        sorted(
            str(line) for line in _proc.communicate()[0].splitlines() if b"UUID" in line
        )
    )
    SECRET_KEY = _hashlib.sha256(_unhashed_secret.encode("utf-8")).hexdigest()


# ----------------------------------------------------------------------------------------------------------------------
# Test performance
if len(_sys.argv) > 1 and _sys.argv[1].startswith("test"):
    PASSWORD_HASHERS = (
        #'django_plainpasswordhasher.PlainPasswordHasher', # very fast but extremely insecure
        "django.contrib.auth.hashers.SHA1PasswordHasher",  # fast but insecure
    )

    # DEFAULT_FILE_STORAGE = 'inmemorystorage.InMemoryStorage'

    # pycharm django test runner (as of 2017.2.3) is not compatible with the test_without_migrations command so
    # disable migrations in setup
    if "--nomigrations" in _sys.argv:
        # Note: Modifying sys.argv means this won't persist through django settings reloads
        # but that doesn't happen for test invocations
        _sys.argv = [x for x in _sys.argv if x != "--nomigrations"]

        # have had issues with the settings module being reloaded; this is a hack to try to detect this
        import __builtins__

        try:
            assert __builtins__.django_settings_load_count == 1
        except AttributeError:
            __builtins__.django_settings_load_count = 1

        # see https://simpleisbetterthancomplex.com/tips/2016/08/19/django-tip-12-disabling-migrations-to-speed-up-unit-tests.html
        class _NoMigrations(object):
            def __contains__(self, item):
                return True

            def __getitem__(self, item):
                return None

        MIGRATION_MODULES = _NoMigrations()


# ----------------------------------------------------------------------------------------------------------------------
# Logging
if DEBUG:
    # for _logger in LOGGING['loggers'].values():
    #     if 'console' not in _logger['handlers']:
    #         _logger['handlers'].append('console')
    # LOGGING['loggers']['werkzeug']['level'] = 'DEBUG'
    # LOGGING['loggers']['werkzeug']['level'] = 'DEBUG'
    LOGGING["loggers"]["django"]["level"] = "DEBUG"
    LOGGING["loggers"]["django"]["handlers"].append("console")

    LOGGING["loggers"]["django.db.backends"] = {
        "handlers": [
            # Uncomment to display all SQL queries
            # 'console',
        ],
        "filter": ["require_debug_true"],
        "level": "DEBUG",
        "propagate": False,
    }

_logging.captureWarnings(True)
_warnings.simplefilter("once", Warning)
_warnings.filterwarnings("ignore", category=ResourceWarning, message="unclosed file")
_warnings.filterwarnings("ignore", module=r"^rest_framework\.")
_warnings.filterwarnings("ignore", module=r"^rules\.")

# ----------------------------------------------------------------------------------------------------------------------
# Email

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# If using mailcatcher for email (https://mailcatcher.me/) set this env variable
# to something non-empty (e.g MAILCATCHER=1). Assumes default mailcatcher port.
if get_env_setting("MAILCATCHER", None):
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
    EMAIL_HOST = "127.0.0.1"
    EMAIL_PORT = 1025
    EMAIL_PASSWORD = ""
    EMAIL_USERNAME = ""


# ----------------------------------------------------------------------------------------------------------------------
# Note that manage.py runserver forks processes so this will unavoidably display multiple times
_dev_notice_printed = False
if not _dev_notice_printed:
    # Only prints dev config if no arguments (makes bash tab-complete cleaner)
    if (
        _re.search(r"(^|/)(manage\.py|django-admin(\.py)?)$", _sys.argv[0])
        and len(_sys.argv) != 1
    ):
        import os as _os

        print("Loaded dev config (pid %d)\n" % _os.getpid(), file=_sys.stderr)
        print("Using database %s" % DATABASES["default"]["NAME"], file=_sys.stderr)
        _dev_notice_printed = True
