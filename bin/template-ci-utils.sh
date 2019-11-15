#!/bin/bash -e
set -o pipefail

source "$(dirname "${BASH_SOURCE[0]}")/common.inc"
cd "$repo_dir"

return_code=0

[[ $(pwd) =~ template-django$ ]] && is_template_repo=true || is_template_repo=false

if ! $is_template_repo; then
	echo 'Not in template repo, skipping'
	exit 1
fi

function err() {
	echo "ERROR: $1" >&2
	return_code=1
}
function warn() {
	echo "WARNING: $1" >&2
}

function show_help() {
	echo "Usage: $0 command arguments"
	echo
	echo "Commands:"
	echo " initial-migrations    Make initial app migrations and run them. Supply the app name as an argument."
	echo
}

case "$1" in
	initial-migrations)
		(cd ${project_dir} && ./manage.py makemigrations $2 && ./manage.py migrate)
		;;
	*)
		echo "Unknown option '$1'" >&2
		echo >&2
		show_help >&2
		exit 1
		;;
esac
