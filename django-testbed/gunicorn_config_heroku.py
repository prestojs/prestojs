"""
gunicorn configuration (Heroku)
for details see
    http://docs.gunicorn.org/en/stable/configure.html
    http://docs.gunicorn.org/en/stable/settings.html
"""
import multiprocessing  # noqa: F401
import os

chdir = os.path.join(os.path.dirname(os.path.realpath(__file__)), "django-root")

preload = True

# defaults to WEB_CONCURRENCY which is set automatically by Heroku; uncomment to override
# workers = 4
# workers = multiprocessing.cpu_count() * 2 + 1


def when_ready(server):
    # touch app-initialized when ready
    open("/tmp/app-initialized", "w").close()
