#!/usr/bin/env python
import glob
import itertools
import os
import sys

if __name__ == "__main__":
    """
    Usage:
    bin/lint-general.py
    """

    print("Linting general...")  # noqa
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

    error = os.system("bin/lint/lint_doc.sh") or error
    error = os.system("bin/lint/lint_python_hosting.sh") or error
    error = os.system("bin/lint/lint_python_packages.sh") or error
    error = os.system("bin/lint/lint_python_version.sh") or error
    error = os.system("bin/lint/lint_tests.sh") or error
    error = os.system("bin/lint/lint_virtualenv.sh") or error
    # error = os.system("bin/lint/lint_template_fixme.sh") or error

    print(f'{"👻" if error else "✅"} Linting General Done. Error code: {error}')  # noqa
    exit(1 if error else 0)
