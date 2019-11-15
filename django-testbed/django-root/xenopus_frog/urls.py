from django.conf.urls import url

from .views import XenopusFrogAppHomepageView

app_name = "xenopus_frog"

urlpatterns = [
    url(r"^$", XenopusFrogAppHomepageView.as_view(), name="homepage"),
]
