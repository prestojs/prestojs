#!/usr/bin/env python
"""
This script should be used to rename the default sample app (Xenopus Frog) to
a client-specific name. It will rename files and directories, and update file
contents.
"""
import argparse
import os
from pathlib import Path
import re
import subprocess
from typing import List

# Allow values to be passed in via args for scripting
parser = argparse.ArgumentParser()
parser.add_argument("--app-name")
parser.add_argument("--class-name-prefix")
parser.add_argument("--client-name")
parser.add_argument(
    "--skip-git-check",
    action="store_true",
    default=False,
    help="Ignore any uncommited changes",
)
parser.add_argument(
    "--no-input",
    action="store_true",
    default=False,
    help="Do not request confirmation",
)
args = parser.parse_args()

APP_NAME_TO_REPLACE = "xenopus_frog"
CLASS_PREFIX_TO_REPLACE = "XenopusFrog"
CLIENT_NAME_TO_REPLACE = "Xenopus Frog"

# Only traverse these directories when updating file content
DIRECTORIES_TO_UPDATE_FILE_CONTENT = ("django-root", "frontend")

# Only check these file extensions when updating file content
FILE_EXTENSIONS_TO_UPDATE = (".js", ".py", ".jsx", ".css", ".less", ".csv", ".json")


def is_git_work_tree_clean():
    proc = subprocess.Popen(["git", "diff-index", "--quiet", "HEAD", "--"])
    proc.communicate()
    return proc.returncode == 0


def is_valid_app_name(_name):
    return len(_name) and not re.search(r"[^a-z_]", _name)


def is_valid_class_prefix(_name):
    # This is just a basic check that the string at least starts with an upper case character
    # and is all alpha numeric
    return (
        len(_name)
        and _name[0].isupper()
        and _name[0].isalpha()
        and all(char.isalnum() for char in _name)
    )


def is_valid_client_name(_name):
    return len(_name)


config = {
    "app_name": {
        "description": "App name",
        "prompt": "Enter valid app name (e.g. xnp_core): ",
        "message": "App name - this is used for app directory, db table names, etc. "
        "Letters and underscores only, no spaces",
        "message_invalid": "letters and underscores only",
        "validator": is_valid_app_name,
    },
    "class_name_prefix": {
        "description": "Class name prefix",
        "prompt": "Enter valid class name prefix (e.g. XYZ): ",
        "message": "Class name prefix - prefix for class names such as <XenopusFrog>AppConfig, "
        "<XenopusFrog>AppHomepageView. Letters only, title case",
        "message_invalid": "letters and numbers only, must be title case",
        "validator": is_valid_class_prefix,
    },
    "client_name": {
        "description": "Human readable client name",
        "prompt": "Enter client name (e.g. Xenopus Frog): ",
        "message": "Client name, used for example as verbose name in app config",
        "message_invalid": "name cannot be empty",
        "validator": is_valid_client_name,
    },
}


def get_user_input(initial_values=None):
    if initial_values is None:
        initial_values = {}

    user_input = {key: initial_values.get(key, "") for key in config.keys()}

    for _key, _config in config.items():

        def is_valid(_val):
            return _config["validator"](_val)

        if not is_valid(user_input[_key]):
            print("\n%s" % _config["message"])

        while not is_valid(user_input[_key]):
            user_input[_key] = input(_config["prompt"])
            if not is_valid(user_input[_key]):
                print("Value entered is invalid: %s" % _config["message_invalid"])

    return user_input


def get_confirmed_input(initial_values=None):
    if initial_values is None:
        initial_values = {}

    confirm = ""
    while confirm != "y":
        _user_input = get_user_input(initial_values=initial_values)

        print(
            "\nCONFIRMATION:\nThe Xenopus Frog app will be renamed using the following values:"
        )
        for _key, _config in config.items():
            print("- %s: %s" % (_config["description"], _user_input[_key]))

        if args.no_input:
            return _user_input

        while confirm.lower() not in ("y", "n"):
            confirm = input("Are these values correct (y/n)? ")

        if confirm != "y":
            confirm = ""

    return _user_input


def should_rename_directory(_name):
    return re.search(APP_NAME_TO_REPLACE, Path(_name).name)


def should_rename_file(_name):
    return re.search(CLASS_PREFIX_TO_REPLACE, _name)


def renamed_path(_path, _user_input):
    parent = Path(_path).parent
    base_name = Path(_path).name
    base_name = re.sub(APP_NAME_TO_REPLACE, _user_input["app_name"], base_name)
    base_name = re.sub(
        CLASS_PREFIX_TO_REPLACE, _user_input["class_name_prefix"], base_name
    )
    return parent.joinpath(base_name)


def rename_files_and_directories(user_input):
    root = Path(__file__).absolute().parent.parent
    directories_to_rename: List[Path] = []
    files_to_rename: List[Path] = []

    for dir_name, sub_dir_list, file_list in os.walk(root):
        if should_rename_directory(dir_name):
            directories_to_rename.append(Path(dir_name))
        for file_name in file_list:
            if should_rename_file(file_name):
                files_to_rename.append(Path(dir_name).joinpath(file_name))

    # Rename files before directories
    if files_to_rename:
        print("Renaming files...")
        for _file in files_to_rename:
            src = _file
            dst = renamed_path(_file, user_input)
            print("from: ", src)
            print("to:   ", dst)
            src.rename(dst)

    # directories_to_rename will contain deeper directories toward the end of the list
    # so we rename the directories in reverse order.
    if directories_to_rename:
        print("Renaming directories...")
        directories_to_rename.reverse()
        for directory in directories_to_rename:
            src = directory
            dst = renamed_path(directory, user_input)
            print("from: ", src)
            print("to:   ", dst)
            src.rename(dst)


def update_file_contents(_user_input):
    root = Path(__file__).absolute().parent.parent
    content_update_pattern = r"(%s)|(%s)|(%s)" % (
        APP_NAME_TO_REPLACE,
        CLASS_PREFIX_TO_REPLACE,
        CLIENT_NAME_TO_REPLACE,
    )

    print("Updating files...")
    for _dir in DIRECTORIES_TO_UPDATE_FILE_CONTENT:
        traverse_root = root.joinpath(_dir)
        for dir_name, sub_dir_list, file_list in os.walk(traverse_root):
            for file_name in file_list:
                full_path = Path(dir_name).joinpath(file_name)
                ext = full_path.suffix
                if ext not in FILE_EXTENSIONS_TO_UPDATE:
                    continue
                with full_path.open("r", encoding="utf-8") as in_file:
                    content = in_file.read()
                    should_update = re.search(content_update_pattern, content)

                if should_update:
                    with full_path.open("w") as out_file:
                        print("Updating file:", full_path)
                        content = re.sub(
                            APP_NAME_TO_REPLACE, _user_input["app_name"], content
                        )
                        content = re.sub(
                            CLASS_PREFIX_TO_REPLACE,
                            _user_input["class_name_prefix"],
                            content,
                        )
                        content = re.sub(
                            CLIENT_NAME_TO_REPLACE, _user_input["client_name"], content
                        )
                        out_file.write(content)


if not args.skip_git_check and not is_git_work_tree_clean():
    print(
        "ERROR: Commit any existing changes before running this script, to allow easier reset "
        "(or use --skip-git-check to bypass this warning)."
    )
    exit(1)

initial_values = {key: vars(args).get(key) or "" for key in config.keys()}
user_input = get_confirmed_input(initial_values=initial_values)
update_file_contents(user_input)
rename_files_and_directories(user_input)
