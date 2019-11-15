#!/bin/bash -e
set -o pipefail

source "$(dirname "${BASH_SOURCE[0]}")/common.inc"

function lint_fixtures() {
	notice "Linting fixtures and styles (json and less)"
	local fixture
	local min_size

	# If it's less than 16 bytes it's just a stub and can't contain anything useful
	$is_template_repo && min_size='+0c' || min_size='+16c'

	for fixture in init groups dev_users dev ; do
		if [[ $( find_exclude_paths "./$project_dir_relative" -name $fixture.json -size $min_size -print -quit ) = "" ]] ; then
			warn "Cannot find a non-trivial $fixture.json"
		fi
	done
}


lint_fixtures "$@"
exit $return_code
