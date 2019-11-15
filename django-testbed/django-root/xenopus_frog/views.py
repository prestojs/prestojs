from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import TemplateView


class XenopusFrogAppHomepageView(LoginRequiredMixin, TemplateView):
    template_name = "xenopus_frog/homepage.html"
