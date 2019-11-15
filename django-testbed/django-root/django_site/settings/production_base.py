"""
Common settings for production/staging/ci etc
"""
import json
import os as _os

import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

from .base import *

# ----------------------------------------------------------------------------------------------------------------------
# Core Site configuration

ALLOWED_HOSTS = []

# ----------------------------------------------------------------------------------------------------------------------
# Static files (CSS, JavaScript, Images)
# We only set this in production to avoid issues with unittests. See comments in base.py.
STATICFILES_STORAGE = "django.contrib.staticfiles.storage.ManifestStaticFilesStorage"

# ----------------------------------------------------------------------------------------------------------------------
# SECRET_KEY
SECRET_KEY = get_env_setting("SECRET_KEY")


# ----------------------------------------------------------------------------------------------------------------------
# Database Configuration

# First try using DATABASE_URL
if "DATABASE_URL" in _os.environ:
    import dj_database_url as _dj_database_url

    _config = _dj_database_url.config()
    DATABASES["default"].update(_config)

# Next fill in any missing variables
_settings = {
    "HOST": "DB_HOST",
    "NAME": "DB_NAME",
    "USER": "DB_USER",
    "PASSWORD": "DB_PASSWORD",
}
for var, env_var in _settings.items():
    if var not in DATABASES["default"]:
        DATABASES["default"][var] = get_env_setting(env_var)

# port is optional
if "PORT" not in DATABASES["default"]:
    _port = get_env_setting("DB_PORT", None)
    if _port is not None:
        DATABASES["default"]["PORT"] = _port

# ----------------------------------------------------------------------------------------------------------------------
# Force HTTPS
# HTTPS redirecting is preferably done from a webserver, however in some circumstances a web server may not be used,
# for eg: on Heroku when served with something like Whitenoise. In those cases your only option is to do so from Django.
# See config/nginx.conf.erb for redirecting from Nginx.
#
# SECURE_SSL_REDIRECT = True
# SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Only use HTTPS for various cookies
# SESSION_COOKIE_SECURE = True
# CSRF_COOKIE_SECURE = True

# ----------------------------------------------------------------------------------------------------------------------
# Email Configuration

# See: https://docs.djangoproject.com/en/dev/ref/settings/#email-backend

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = get_env_setting("EMAIL_HOST", "localhost")
EMAIL_PORT = get_env_setting("EMAIL_PORT", "25")
EMAIL_HOST_USER = get_env_setting("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = get_env_setting("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = False
EMAIL_USE_SSL = False
EMAIL_TIMEOUT = (
    300  # 5mins deafult timeout as specced by rfc5321 to prevent inf waiting
)
# EMAIL_FILE_PATH =


# See: https://docs.djangoproject.com/en/dev/ref/settings/#email-subject-prefix
EMAIL_SUBJECT_PREFIX = "[%s] " % SITE_NAME

# See: https://docs.djangoproject.com/en/dev/ref/settings/#server-email
SERVER_EMAIL = "webmaster@localhost"

# ----------------------------------------------------------------------------------------------------------------------
# Cache configuration
CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache",}}


# ----------------------------------------------------------------------------------------------------------------------
# Sentry logging

# If you're deploying to heroku, install the Sentry addon to your heroku instance and you're set.
# Otherwise, you can choose to either setup an sentry account or outright turn it off
USE_SENTRY = True
SENTRY_DSN_PYTHON = get_env_setting("SENTRY_DSN")

# By default it'll use the same DSN as python - this may not be what you want the behavior to be.
# You can create another DSN for javascript only.
SENTRY_DSN_JS = get_env_setting("SENTRY_DSN_JS", None) or SENTRY_DSN_PYTHON
SENTRY_CONFIG_JS = {
    "environment": None,
    "dsn": SENTRY_DSN_JS,
}


def setup_sentry(environment, version_file=VERSION_JSON_FILE):
    if not USE_SENTRY:
        return

    SENTRY_CONFIG_JS["environment"] = environment
    try:
        with open(version_file) as f:
            data = json.loads(f.read())
            release = data.get("version")
    except FileNotFoundError:
        release = None

    if not release:
        print(
            f"Release could not be determined from {version_file}. Sentry errors will not be tagged with a release"
        )

    sentry_sdk.init(
        dsn=SENTRY_DSN_PYTHON,
        integrations=[DjangoIntegration()],
        # This sends user data - specifically email and id, but should still hide supersensitive info eg CC. See:
        # https://docs.sentry.io/error-reporting/configuration/?platform=python#send-default-pii
        send_default_pii=True,
        environment=environment,
        release=release,
    )
