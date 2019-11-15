#!/bin/bash -e
set -o pipefail

source "$(dirname "${BASH_SOURCE[0]}")/common.inc"
cd "$repo_dir"
project_dir_relative=./$( realpath --relative-to="$repo_dir" "$project_dir" )

files_py=()

function help() {
	echo "$0 [--color] [paths]"
	echo
	echo "Lint python files"
	echo
	echo "Options:"
	echo "   --help       - this screen"
	echo "   --color      - force color output"
	echo "   --skip-black - skip running black --check"
	echo
	print_target_details
}

files_all=true
files_py=()

use_color=false; [[ -t 1 ]] && use_color=true
skip_black=false;
function parse_args() {
	while [ $# -gt 0 ] ; do
		case "$1" in
		--color)
			use_color=true
			;;

		--skip-black)
			skip_black=true
			;;

		--help)
			help
			exit 1
			;;

		-*)
			help >&2
			exit 1
			;;
		*)
			files_all=false
			files_py="$1"
			;;
		esac
		shift
	done
}

parse_args "$@"

function lint_python_source() {
	if ! $files_all && [[ ${#files_py[@]} -le 0 ]] ; then
		return 0
	fi

	local flake8_format

	if $use_color; then
		# If stdout is to a terminal, include colours in flake8 output
		flake8_format='${cyan}%(path)s${reset}:${yellow_bold}%(row)d${reset}:${green_bold}%(col)d${reset}: ${red_bold}%(code)s${reset} %(text)s'
	else
		flake8_format='%(path)s:%(row)d:%(col)d: %(code)s %(text)s'
	fi

	if $files_all; then
		flake8 --config=.flake8.cfg --format="$flake8_format" ./django-root ./bin *.py
	else
		flake8 --config=.flake8.cfg --format="$flake8_format" "${files_py[@]}"
	fi
}

lint_python_source

if ! $skip_black; then
	if ! black . --check; then
		err "Some files need formatting with black. Run 'black .' to reformat files."
		exit 1
	fi
fi

