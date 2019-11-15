import os as _os
import platform as _platform
import sys as _sys

_dev_hosts = [
    (".local", "darwin"),  # local development
    (".internal.alliancesoftware.com.au", "darwin"),  # general catch-all
]


# can't just use use HOSTNAME as /usr/bin/env wipes it
_hostname = _platform.node()
if (
    _os.environ.get("DJANGO_SETTINGS_MODULE")
    and _os.environ.get("DJANGO_SETTINGS_MODULE") != __name__
):
    # Do nothing; handled by django importing a custom settings module directly
    pass
elif any(
    _hostname.endswith(dev_host) and _sys.platform == platform
    for (dev_host, platform) in _dev_hosts
):
    from .dev import *  # noqa isort:skip
# On heroku set HEROKUENV to either staging or production to determine what
# settings are loaded
elif _os.environ.get("HEROKUENV") == "staging":
    from .production_staging import *  # noqa isort:skip
elif _os.environ.get("HEROKUENV") == "production":
    from .production_prod import *  # noqa isort:skip
else:
    # Normally you should not import ANYTHING from Django directly
    # into your settings, but ImproperlyConfigured is an exception.
    from django.core.exceptions import ImproperlyConfigured

    raise ImproperlyConfigured(
        "Unrecognised host %s in %s. If this is a local dev machine, add to _dev_hosts in %s. If this is a live server (prod, staging, dev) then set the DJANGO_SETTINGS_MODULE env var."
        % (_hostname, __name__, _os.path.realpath(__file__))
    )
