from typing import Optional, Union, Collection

from .registry import Registry
from .config import BaseCodeGenConfig

def register_serializer_viewmodel(
    config: Union[Optional[str], Optional[BaseCodeGenConfig]] = None,
    name: Optional[str] = None,
    label: Optional[str] = None,
    label_plural: Optional[str] = None,
    fields: Optional[Collection[str]] = None,
    exclude_fields: Optional[Collection[str]] = None,
):
    """
    usage: @register_serializer_viewmodel(**kwargs)
    params:
      config: string | Config Class. eg: config="oak.branch.common.Config" / config=FigConfig
      model_name: string. overrides default model name, becomes frontend model name and also part of generated file name
      model_label, model_label_plural: string. overrides default label / plural, use if you demand beeves.
    """

    def wrapped(cls):
        conf = {
            "config": config,
            "name": name,
            "label": label,
            "label_plural": label_plural,
            "fields": fields,
            "exclude_fields": exclude_fields,
        }
        cleaned_conf = {}
        cleaned_conf.update({k: v for k, v in conf.items() if v is not None})

        if fields and len(fields) == 1 and fields[0] == '__all__':
            del cleaned_conf['fields']

        Registry.registered_serializers.append(
            (
                cls,
                cleaned_conf,
            )
        )
        return cls

    return wrapped
