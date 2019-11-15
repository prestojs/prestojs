from django import template
from django.conf import settings

register = template.Library()


class SiteSettingsNode(template.Node):
    def __init__(self, variable):
        self.variable = variable

    def render(self, context):
        context[self.variable] = {
            "DEBUG_WEBPACK": settings.DEBUG_WEBPACK,
        }
        # add any extra relevant site data here
        return ""


@register.tag("site_settings")
def do_site_settings(parser, token):
    """
    This will store site settings in the context.

    We *could*  do this as a global template processor, but that will inject it into every template in the site which is
    massive overkill


    Usage::

        {% site_settings as var %}

    """
    # token.split_contents() isn't useful here because this tag doesn't accept variable as arguments
    args = token.contents.split()
    if len(args) != 3 or args[1] != "as":
        raise template.TemplateSyntaxError(
            "'site_settings' requires 'as variable' (got %r)" % args
        )
    return SiteSettingsNode(args[2])
