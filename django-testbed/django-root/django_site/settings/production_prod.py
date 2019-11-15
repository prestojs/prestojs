"""
Production settings and globals
"""

from .production_base import *

# ----------------------------------------------------------------------------------------------------------------------
# Core Site configuration

ALLOWED_HOSTS = [
    # TEMPLATEFIXME: set allowed hosts in production, or delete this line and use env variable (comma delimited)
    # 'www.mysite.com',
]

ALLOWED_HOSTS += get_env_setting("ALLOWED_HOSTS", "").split(",")

BODY_ENV_CLASS = "env-prod"

# TEMPLATEFIXME: Warning - when used for naked sites behind cloudflare this has the potential to cause infinity redirects.
# Disable this should that happens. see: https://docs.djangoproject.com/en/2.2/ref/settings/#secure-ssl-host
SECURE_SSL_REDIRECT = True

ADMINS = (
    # TEMPLATEFIXME: set admins in production
    # ('John Smith', 'email@example.com')
)

# ----------------------------------------------------------------------------------------------------------------------
# Sentry logging

setup_sentry("prod")
