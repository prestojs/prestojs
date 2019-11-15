#!/usr/bin/env python
import glob
import itertools
import os
import sys

if __name__ == "__main__":
    """
    Usage:
    bin/lint.py
    bin/lint.py django_root/manage.py
    bin/lint.py bin
    bin/lint.py frontend/
    bin/lint.py **/*.json
    """

    print("Linting...")  # noqa
    args = sys.argv[1:]
    files = []

    for arg in args:
        if os.path.isdir(arg):
            for fname in itertools.chain(glob.iglob(arg + "/**", recursive=True)):
                if not os.path.isdir(fname):
                    files.append(fname)
        else:
            files.append(arg)

    error = 0

    error = os.system(f"bin/lint/lint-general.py") or error
    error = os.system(f"bin/lint/lint_python_source.sh") or error
    error = os.system(f"bin/lint/lint_sh.sh") or error
    # error = os.system(f"bin/lint/lint_json_and_less.sh") or error
    error = os.system(f"bin/lint/lint_js.sh") or error

    print(f'{"👻" if error else "✅"} Linting Done. Error code: {error}')  # noqa
    exit(1 if error else 0)
