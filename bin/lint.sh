#!/bin/bash -e
set -o pipefail

source "$(dirname "${BASH_SOURCE[0]}")/common.inc"
cd "$repo_dir"

return_code=0

[[ $(pwd) =~ template-django$ ]] && is_template_repo=true || is_template_repo=false

function err() {
	echo "ERROR: $1" >&2
	return_code=1
}
function warn() {
	echo "WARNING: $1" >&2
}

function notice() {
	echo "-----------------------"
	echo $1
}

notice "Linting"

exclude_dirs=(
	.git
	.idea
	node_modules
	.yarn

	# these will only be present on CI
	venv
	cache
	ci-cache

	# legacy path structure
	frontend/node_modules
	frontend/bower_components
)

function find_exclude_paths() {
	# Wrapper to 'find' that excludes paths we never want to touch
	local path
	path="$1"
	shift
	if [[ $path = "" ]] ; then
		err "find_exclude_paths: missing path"
	elif [[ $path != "." && ${path:0:2} != "./" ]] ; then
		# find's -path is a straight string match,
		# 'frontend' != './frontend', right now we only handle $path == '.'
		err "find_exclude_paths doesn't handle a starting path of $path"
	fi

	local startargs
	startargs=(
		"$path"
	)
	if [[ $1 = "-maxdepth" ]] ; then
		# maxdepth is special; it must come before other options
		startargs+=( "$1" "$2" )
		shift
		shift
	fi

	# see https://stackoverflow.com/a/16595367 for the way -not and -prune interact
	local find_exclude_path_params
	local find_exclude_dir
	find_exclude_path_params=()
	for find_exclude_dir in "${exclude_dirs[@]}" ; do
		find_exclude_path_params+=(
			-not \(
				-type d
				-path "./$find_exclude_dir"
				-prune
			\)
		)
	done

	$FIND "$path" "${find_exclude_path_params[@]}" \( "$@" \)
}

function lint_js() {
	notice "Linting javascript"
	local nvm_dirs
	local nvm_dir

	# nodejs minor version number
	if [[ -e .nvmrc ]] ; then
		if [[ "$(<.nvmrc)" =~ \. ]] ; then
			err "You have specified a nodejs minor version in .nvmrc -- this is rarely necessary, and will break the lint script"
		else
			require_nodejs
		fi
	fi

	# We should have a .nvmrc if we're using node
	if [[ $( find_exclude_paths . \
			\( -name package.json -o -name yarn.lock \) \
			-print \
			-quit \
		) != "" ]] ;
	then
		if [[ $( find_exclude_paths . -name .nvmrc -print -quit ) = "" ]] ; then
			err "Found a package.json without any .nvmrc"
		fi
	fi

	# Keep life simple: don't put whitespace in filenames or this may fail
	local filename
	for filename in $( find_exclude_paths . -maxdepth 1 -name package.json ) ; do
		if grep 'TEMPLATE_FIXME' "$filename" --quiet && ! $is_template_repo ; then
			err "You have TEMPLATE_FIXME still in $filename"
		fi
	done

	if $files_all || [[ ${#files_js[@]} -gt 0 ]] ; then
		(yarn run lint)
	fi
}

function lint_secrets() {
	notice "Linting secrets"
	if git ls-files | grep SECRET_KEY --quiet ; then
		err "SECRET_KEY should not be committed"
	fi
}

files_py=()
files_js=()
files_json=()
files_exec=()
function parse_filelists() {
	local f
	if [[ $# -eq 0 ]] ; then
		files_all=true
	else
		files_all=false
		for f in "$@" ; do
			if [[ $f =~ \.py$ ]] ; then
				files_py+=("$f")
			fi
			if [[ $f =~ \.(js|jsx)$ ]] ; then
				files_js+=("$f")
			fi
			if [[ $f =~ \.(json)$ ]] ; then
				files_json+=("$f")
			fi
			# executable or .inc, but not .py; keep in sync with lint_sh
			if [[ -f $f && ( -x $f || $f =~ \.(inc)$ ) && ! $f =~ \.(py) ]]; then
				files_exec+=("$f")
			fi
		done
	fi
}

parse_filelists "$@"

lint_js
lint_secrets

notice "Linting done"


exit $return_code
