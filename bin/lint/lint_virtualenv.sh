#!/bin/bash -e
set -o pipefail

source "$(dirname "${BASH_SOURCE[0]}")/common.inc"

function lint_virtualenv() {
	notice "Linting python virtualenv"
	local virtualenvs_dir
	# virtualenv
	if [[ ! -e .venv ]] ; then
		err "You have no .venv file"
	else
		# has the virtualenv name been changed?
		if [[ "$(<.venv)" = "alliance-template-django" ]] && ! $is_template_repo; then
			err "Virtualenv name in .venv has not been changed"
		fi

		# are we using the right virtualenv?
		require_virtualenv
		if [[ ${VIRTUAL_ENV##*/} != "$(<.venv)" ]] && ! $is_ci ; then
			warn "Active virtualenv (${VIRTUAL_ENV##*/}) != expected ($(<.venv)). Are you using the right virtualenv?"
		fi
	fi
}

lint_virtualenv
exit $return_code
