from django.conf import settings
from django.urls import get_script_prefix
from django.views.generic import TemplateView


class FrontendView(TemplateView):

    template_name = "frontend.html"

    entry_point: str = None
    basename: str = ""

    def get(self, request, *args, **kwargs):
        context = self.get_context_data(request=request, **kwargs)
        return self.render_to_response(context)

    def get_initial_state(self, request):
        return {
            "Auth": {
                "isLoggedIn": request.user and not request.user.is_anonymous,
                "userId": request.user and request.user.id,
                "isHijackedUser": request.session.get("is_hijacked_user", False),
            },
        }

    def get_app_context(self, request):
        return {
            "basename": self.basename,
            "baseUrl": "{}://{}{}".format(
                request.scheme, request.get_host(), get_script_prefix()
            ),
            # Used to populate redux initial state
            "initialState": self.get_initial_state(request),
            "sentry": getattr(settings, "SENTRY_CONFIG_JS", None),
            "user": {
                "id": request.user and request.user.id,
                "email": request.user and getattr(request.user, "email", None),
            },
            # Include other data you want made available to JS here
        }

    def get_context_data(self, request, **kwargs):
        context = super().get_context_data(**kwargs)

        if not self.entry_point:
            raise ValueError(
                'You must provide entry_point to FrontEndView, eg. FrontEndView.as_view(entry_point="app")'
            )

        context["entry_point"] = self.entry_point
        context["app_context"] = self.get_app_context(request)
        context["DEBUG"] = settings.DEBUG

        return context


class HomepageView(TemplateView):
    template_name = "homepage.html"
