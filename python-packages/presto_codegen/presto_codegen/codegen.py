import inspect
import os

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.utils.module_loading import import_string

from .utils import *


def write_to_file(config, model, content, **decorator_kwargs):
    target_dir = config.generate_to

    try:
        os.makedirs(target_dir)
    except FileExistsError:
        pass

    target_filename = "Base%s.js" % model
    fresh_new_model = not os.path.exists(target_dir / target_filename)

    info("Writing to", target_dir / target_filename)
    debug(content)

    with open(target_dir / target_filename, "w") as f:
        f.write(content)

    if fresh_new_model:
        # generates descendant file as well, but only if we're not Regenerating the base (ie. no action if the base file already exist)
        descendant_dir = config.generate_descendant_to

        relpath = os.path.relpath(target_dir, descendant_dir)
        if not relpath.startswith("."):
            relpath = "./" + relpath

        try:
            os.makedirs(descendant_dir)
        except FileExistsError:
            pass

        descendant_filename = "%s.js" % model

        descendant = config.generate_descendant_base_on_base_model(model, relpath, **decorator_kwargs)
        with open(descendant_dir / descendant_filename, "w") as f:
            f.write(descendant)


def run_codegen():
    # === part i: Frontend Models Generation from Serializers ===
    from .registry import Registry
    from .config import BaseCodeGenConfig

    serializers = Registry.registered_serializers
    if not len(serializers):
        return

    base_config = (
        import_string(settings.DEFAULT_CODEGEN_CONFIG)
        if hasattr(settings, "DEFAULT_CODEGEN_CONFIG")
        else None
    )

    models = {}
    for serializer, decorator_kwargs in serializers:
        debug('Using kwargs', decorator_kwargs, 'for', serializer)

        if "config" in decorator_kwargs:
            config = decorator_kwargs.pop('config')
        else:
            config = base_config

        if isinstance(config, str):
            config = import_string(config)


        if config is None:
            raise ImproperlyConfigured(
                'No config found. Either set DEFAULT_CODEGEN_CONFIG or pass config="config.module" to your decorator.'
            )

        if not issubclass(config, BaseCodeGenConfig):
            raise ImproperlyConfigured(
                'Your config is not subclassing presto_codegen.BaseCodeGenConfig.'
            )

        for required in ['frontend_path', 'generate_to', 'generate_descendant_to']:
            if getattr(config, required, None) is None:
                raise ImproperlyConfigured(
                    f'"{required}" need to be explicitly set in your Config.'
                )


        model, content = config.generate_definition_for_serializer(
            serializer, **decorator_kwargs
        )
        if model in models:
            raise FileExistsError(
                f"\nDuplicate registration for model {model} found so we cannot generate a unique default name.\nYou must assign `model_name` manually to your decorator eg @register_serializer(model_name='Jobs1103').\nFirst entry: {serializer.__name__} from {inspect.getfile(serializer)}\nSecond entry: {models[model][-1].__name__} from {inspect.getfile(models[model][-1])}\n"
            )

        models[model, config] = [model, content, decorator_kwargs, serializer]

    for model, config in models:
        config.write_to_file(*models[model, config][:-1])
