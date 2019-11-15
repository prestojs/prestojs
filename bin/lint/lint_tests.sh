#!/bin/bash -e
set -o pipefail

source "$(dirname "${BASH_SOURCE[0]}")/common.inc"

function lint_tests() {
	notice "Linting tests"
	if [[ ! $is_template_repo ]] && grep lint-template- .gitlab-ci.yml --quiet ; then
		err "lint-template-* tests should be removed from .gitlab-ci.yml"
	fi
}

lint_tests
exit $return_code
