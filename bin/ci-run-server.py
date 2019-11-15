#!/usr/bin/env python
# This is still experimental
# It wraps the regular django server with a static file server for CI purposes
import argparse
import os
import sys

from django.conf import settings
from werkzeug.serving import run_simple

parser = argparse.ArgumentParser(
    description="Serve application for use in CI (with collected static assets)"
)
parser.add_argument("interface", type=str, help="Listening interface")
parser.add_argument("port", type=int, help="Listening port")
parser.add_argument(
    "--persistenttransactions",
    action="store_true",
    help="Required for front-end testing",
)
args = parser.parse_args()

# Need to add current dir (`django-root`) to pythonpath before loading application
sys.path.append(os.getcwd())
from wsgi import application  # isort:skip # noqa:E402

# Start server
run_simple(
    args.interface,
    args.port,
    application,
    static_files={
        settings.STATIC_URL: settings.STATIC_ROOT
    },  # URLs to not get passed in to the Django app, and their content root
    threaded=False,
)
