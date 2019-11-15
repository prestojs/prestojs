"""
gunicorn configuration (generic VM)
for details see
    http://docs.gunicorn.org/en/stable/configure.html
    http://docs.gunicorn.org/en/stable/settings.html
"""
import multiprocessing
import os

chdir = os.path.join(os.path.dirname(os.path.realpath(__file__)), "django-root")

preload = False

env = os.environ["USER"]

worker_class = "sync"
if env == "prod":
    workers = multiprocessing.cpu_count() * 2
else:
    workers = 2 if multiprocessing.cpu_count() == 1 else 3

# requires setproctitle package to be installed
proc_name = "%s django/gunicorn" % env
