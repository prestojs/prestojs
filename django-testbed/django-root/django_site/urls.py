from allianceutils.api.permissions import SimpleDjangoObjectPermissions
from authtools.views import LogoutView
from django.conf import settings
from django.conf.urls import include
from django.conf.urls import url
from django.conf.urls.static import static
from rest_framework.permissions import BasePermission
from rest_framework.routers import APIRootView

import django_site.views

# this has nothing to do with url, but unfortunately its the only place you can safely do it post-startup
# as by this point serializer definitions would had been imported
# @levi: i dont think it solves you dynamic generated classes issue tho, and anything not imported automatically
# would just gets ignored.
from presto_codegen import run_codegen

urlpatterns = []

if "silk" in settings.INSTALLED_APPS:
    urlpatterns += [url(r"^silk/", include("silk.urls", namespace="silk"))]

if settings.DEBUG:
    # SimpleDjangoObjectPermissions causes the BrowsableAPIRenderer to fail
    # (permission_required not set) so remove it in dev.
    # This's a weird place to patch this but can't find another that works.
    APIRootView.permission_classes = [
        x
        for x in APIRootView.permission_classes
        if not issubclass(x, SimpleDjangoObjectPermissions)
    ]
else:

    class NoEntryForAnyone(BasePermission):
        def has_permission(self, request, view):
            return False

    APIRootView.permission_classes = (NoEntryForAnyone,)

# Serve the SPA under a sub-directory to future proof against potential conflicts
# (eg. for SEO purposes, integration with a CMS etc).

urlpatterns += [
    url(r"^logout/$", LogoutView.as_view(), name="logout"),
    url(r"^api/", include("xenopus_frog.urls")),
    url(r"^hijack/", include("hijack.urls", namespace="hijack")),
    # see https://django-authtools.readthedocs.io/en/latest/views.html for other auth-related urls
    # you probably want to include (eg password change, password reset)
    url(
        r"^.*",
        django_site.views.FrontendView.as_view(basename="app", entry_point="app",),
    ),
]

# Serve media files in development (note: this is a no-op when DEBUG=False)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if "debug_toolbar" in settings.INSTALLED_APPS:
    import debug_toolbar

    urlpatterns += [
        url(r"^__debug__/", include(debug_toolbar.urls)),
    ]

if getattr(settings, "DJANGO_PRESTO_AUTO_CODEGEN", False) and settings.DEBUG:
    run_codegen()
