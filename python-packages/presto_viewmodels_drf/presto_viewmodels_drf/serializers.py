class OptinFieldsSerializerMixin:
    """
    Regulates fields exposed by default & as requested.

    Construct URLs like /?include_fields=first_name,email to opt-in into fields.

    By default, all "opt_in_only_fields" are excluded from serializer, unless specifically opted-in.

    If any of fields specified to be included does not belong to opt_in_only_fields, the serializer
    will perform in "strict" mode that ONLY fields specced are included.
    """

    def __init__(self, *args, **kwargs):
        result = super().__init__(*args, **kwargs)

        # only if context.request is available (ie. not during inspection etc)
        if hasattr(self, "context") and (
            "request" in self.context or "include_fields" in self.context
        ):
            heavy_fields = set(getattr(self.Meta, "opt_in_only_fields", []))

            if "include_fields" in self.context["request"].query_params:
                include_fields = set(
                    self.context["request"].query_params["include_fields"].split(",")
                )
            elif "include_fields" in self.context:
                if type(self.context["include_fields"]) == str:
                    include_fields = set(self.context["include_fields"].split(","))
                else:
                    include_fields = set(self.context["include_fields"])
            else:
                include_fields = set(self.Meta.fields).difference(heavy_fields)

            strict = not heavy_fields.issuperset(include_fields)

            # in strict mode, only fields inside include_fields are included
            # otherwise, all heavy_fields not inside include_fields gets ejected
            if strict:
                fields_to_remove = set(self.Meta.fields).difference(include_fields)
            else:
                fields_to_remove = heavy_fields.difference(include_fields)

            for f in fields_to_remove:
                del self.fields[f]

        return result
