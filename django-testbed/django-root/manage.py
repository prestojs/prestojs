#!/usr/bin/env python
import os
from pathlib import Path
import sys
from typing import Union

# On heroku don't worry about this check - the python buildpack runs
# collectstatic from the root directory
if not os.environ.get("HEROKUENV"):
    assert os.getcwd() == str(
        Path(__file__).absolute().parent
    ), "To avoid import path issues please run manage.py from within the django-root dir"


def find_file_recursive(filename: str) -> Union[Path, bool]:
    """Search for a file recursively up"""
    current_dir = Path(__file__).absolute().parent
    while current_dir and current_dir != current_dir.parent:
        _file = Path(current_dir, filename)
        if _file.is_file():
            return _file
        current_dir = current_dir.parent
    return False


if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "django_site.settings")

    from django.core.management import execute_from_command_line

    execute_from_command_line(sys.argv)
