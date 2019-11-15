#!/bin/bash -e
set -o pipefail

source "$(dirname "${BASH_SOURCE[0]}")/common.inc"


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

	# If there's a package.json then there should be a lockfile of some sort
#	local package_json
#	for package_json in $( find_exclude_paths . -name package.json ) ; do
#		if ! [[ $package_json == *"eway/js"* ]] && ! [[ -e ${package_json/package\.json/yarn.lock} ]] && ! [[ -e ${package_json/package\.json/npm-shrinkwrap.json} ]] && ! $is_template_repo ; then
#			err "${package_json/.\//} has no yarn.lock or npm-shrinkwrap.json"
#		fi
#	done

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

	yarn run lint "$@"
}

lint_js "$@"
exit $return_code
