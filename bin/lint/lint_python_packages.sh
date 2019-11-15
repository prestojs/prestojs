#!/bin/bash -e
set -o pipefail

source "$(dirname "${BASH_SOURCE[0]}")/common.inc"

function lint_python_packages() {
	notice "Linting python packages"
	# We use Operating System pytz to ensure timezone updates happen automatically
	if egrep '^\s*pytz[^$]' requirements/*.txt --quiet ; then
		err "pytz version specified in requirements - this will overwrite OS pytz. remove it."
	fi

	# TODO: Strictly speaking this only applies to the AJAX list filter
	# We could check for instances of ModelFieldSearchView or descendants instead of blacklisting the
	# whole package but the fact that this is in there at all is concerning
	if egrep '^\s*django-admin-steroids' requirements/*.txt --quiet ; then
		err "django-admin-steroids use is STRONGLY discouraged. See https://github.com/chrisspen/django-admin-steroids/issues/14"
	fi
}

lint_python_packages
exit $return_code
