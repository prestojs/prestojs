import pathlib

from django.template import Context
from django.template import Template

# [0, 3]
VERBOSE = 2

# Colorful Prints!
def info(*args):
    if VERBOSE >= 2:
        print("\033[36m%s\033[0m" % " ".join(str(x) for x in args))


def debug(*args):
    if VERBOSE >= 3:
        print("\033[34m%s\033[0m" % " ".join(str(x) for x in args))


def msg(*args):
    if VERBOSE >= 1:
        print("\033[92m%s\033[0m" % " ".join(str(x) for x in args))


def snake_case_to_spaces(str):
    return str.replace("_", " ").capitalize()


# https://mail.python.org/pipermail/python-ideas/2014-November/029921.html
def raiser(type=ValueError, err=""):
    raise type(err)


# strip empty lines - kill those with spaces but nothing else within, keep "pure" empty ones. this's to fix use of if/fors within template.
def strip_blank_lines_with_space(str):
    lines = []
    for line in str.split("\n"):
        if not len(line):
            lines.append("")
        if not len(line.strip()):
            continue
        lines.append(line)
    return "\n".join(lines)


def render_template(template_name, context={}):
    template = Template(
        open(pathlib.Path(__file__).parent / "templates" / template_name).read()
    )
    context = Context(context)
    return strip_blank_lines_with_space(template.render(context))
