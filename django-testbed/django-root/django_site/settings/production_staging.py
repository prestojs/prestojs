"""
Staging settings and globals
"""

from .production_base import *

# ----------------------------------------------------------------------------------------------------------------------
# Core Site configuration

ALLOWED_HOSTS = [
    # 'staging.mysite.com',
]

ALLOWED_HOSTS += get_env_setting("ALLOWED_HOSTS", "").split(",")

BODY_ENV_CLASS = "env-staging"

ADMINS = (
    # ('John Smith', 'email@example.com')
)

# ----------------------------------------------------------------------------------------------------------------------
# Sentry logging

setup_sentry("staging")
