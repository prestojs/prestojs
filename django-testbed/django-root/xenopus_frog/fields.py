from bleach import clean
from django.conf import settings
from django.db import models


class HtmlField(models.TextField):
    """Django field type corresponding to HTML text

    Parameters:
        allowed_tags (iterable): The set of allowed HTML tags (any others will be escaped/stripped from the text)
            Effective default is bleach.sanitizer.ALLOWED_TAGS
            See https://bleach.readthedocs.io/en/latest/clean.html#allowed-tags-tags fur further details
        allowed_attributes (list, map, or callable): The set of allowed HTML attributes
            Effective default is bleach.sanitizer.ALLOWED_ATTRIBUTES
            See https://bleach.readthedocs.io/en/latest/clean.html#allowed-attributes-attributes for further details
        allowed_styles (list): The set of allowed CSS styles
            Effective default is []
        strip_tags (bool): Controls whether to strip disallowed tags from the output (when True)
            or to escape disallowed tags (when False)
            Default is False
        strip_comments (bool): Controls whether or not to strip out comments
            Default is True
        trusted (bool): Whether the data going into this field comes only from trusted sources
            Default is False
            Setting this to True disables the entire cleaning process on save - be very careful when doing this!

    Attributes:
        bleach_options (obj): The bleach options to be used for HTML sanitization
            Compiled from the allowed_tags, allowed_attributes, allowed_styles, strip_tags, and strip_comments parameters
        trusted (bool): Whether the data going into this field comes only from trusted sources
            Copied directly from the trusted parameter
    """

    def __init__(
        self,
        allowed_tags=None,
        allowed_attributes=None,
        allowed_styles=None,
        strip_tags=None,
        strip_comments=None,
        trusted=False,
        *args,
        **kwargs
    ):
        super().init(*args, **kwargs)
        self.bleach_options = self.get_bleach_options(
            allowed_tags, allowed_attributes, allowed_styles, strip_tags, strip_comments
        )
        self.trusted = trusted

    @staticmethod
    def get_bleach_options(
        allowed_tags=None,
        allowed_attributes=None,
        allowed_styles=None,
        strip_tags=None,
        strip_comments=None,
    ):
        bleach_args = {}

        if allowed_tags:
            bleach_args["tags"] = allowed_tags
        elif hasattr(settings, "BLEACH_ALLOWED_TAGS"):
            bleach_args["tags"] = settings.BLEACH_ALLOWED_TAGS

        if allowed_attributes:
            bleach_args["attributes"] = allowed_attributes
        elif hasattr(settings, "BLEACH_ALLOWED_ATTRIBUTES"):
            bleach_args["attributes"] = settings.BLEACH_ALLOWED_ATTRIBUTES

        if allowed_styles:
            bleach_args["styles"] = allowed_styles
        elif hasattr(settings, "BLEACH_ALLOWED_STYLES"):
            bleach_args["styles"] = settings.BLEACH_ALLOWED_STYLES

        if strip_tags:
            bleach_args["strip"] = strip_tags
        elif hasattr(settings, "BLEACH_STRIP_TAGS"):
            bleach_args["strip"] = settings.BLEACH_STRIP_TAGS

        if strip_comments:
            bleach_args["strip_comments"] = strip_comments
        elif hasattr(settings, "BLEACH_STRIP_COMMENTS"):
            bleach_args["strip_comments"] = settings.BLEACH_STRIP_COMMENTS

        return bleach_args

    def pre_save(self, model_instance, add):
        raw_value = getattr(model_instance, self.attname)
        cleaned = (
            clean(raw_value, **self.bleach_options) if not self.trusted else raw_value
        )
        setattr(model_instance, self.attname, cleaned)
        return cleaned
