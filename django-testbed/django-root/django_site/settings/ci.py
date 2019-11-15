"""
Continuous Integration settings
Should be kept as close as possible to prod
"""
from distutils.util import strtobool as _strtobool
import os as _os
import sys as _sys

from .production_base import *

# ----------------------------------------------------------------------------------------------------------------------
# Core Site configuration

AUTOMATED_TESTS = True

# We need these for runserver
ALLOWED_HOSTS = [
    "127.0.0.1",
    "localhost",
    get_env_setting("SERVER_HOSTNAME"),
]

INSTALLED_APPS += TEST_MODEL_APPS

# INTERNAL_IPS = [
#     '127.0.0.1',
#     get_env_setting('SERVER_HOSTNAME'),
# ]

SELENIUM_SERVER = get_env_setting("SELENIUM__STANDALONE_CHROME_PORT_4444_TCP_ADDR", "")
if SELENIUM_SERVER:
    ALLOWED_HOSTS.append(SELENIUM_SERVER)
    # INTERNAL_IPS.append(SELENIUM_SERVER)

BODY_ENV_CLASS = "env-ci"


# ----------------------------------------------------------------------------------------------------------------------
# Database Configuration

# Live/testing should match, but if not then we might need to fix some things up

# <5.5.3: default_storage_engine
# >=5.5.3: storage_engine or default_storage_engine
# >=5.7.5: storage_engine
# _db_options = DATABASES['default']['OPTIONS']
# _db_options['init_command'] = _db_options['init_command'].replace('storage_engine', 'default_storage_engine')


# ----------------------------------------------------------------------------------------------------------------------
# Logging

# turn off logging of uninteresting requests, we just want to see test output
LOGGING["loggers"]["django.server"]["level"] = "WARNING"
LOGGING["loggers"]["werkzeug"]["level"] = "WARNING"


# ----------------------------------------------------------------------------------------------------------------------
# Email Configuration

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

EMAIL_SUBJECT_PREFIX = "[Django Template CI] "

SERVER_EMAIL = "server-error@example.com"


# ----------------------------------------------------------------------------------------------------------------------
# Turn on sql logging; useful if you can't figure out why test cases are failing
if _strtobool(get_env_setting("DEBUG_SQL", "0")):
    # Beware of unexpected side-effects of DEBUG!!
    # SQL logging is hardcoded to only log if DEBUG is turned on;
    # There's no way of turning on DEBUG just for SQL logging
    DEBUG = True
    DEBUG_WEBPACK = False
    print("Enabling SQL dump (pid %d)\n" % _os.getpid(), file=_sys.stderr)
    LOGGING["loggers"]["django.db.backends"]["handlers"].append("console")


# ----------------------------------------------------------------------------------------------------------------------

print("Loaded CI config (pid %d)\n" % _os.getpid(), file=_sys.stderr)

# This must be set for env to work
# assert(get_env_setting('MOCK_DATE_START', '') != '')
