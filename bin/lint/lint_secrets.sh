#!/bin/bash -e
set -o pipefail

source "$(dirname "${BASH_SOURCE[0]}")/common.inc"

function lint_secrets() {
	echo "Linting secrets"
	if git ls-files | grep SECRET_KEY --quiet ; then
		err "SECRET_KEY should not be committed"
	fi

	if egrep --ignore-case --files-with-matches -- '-----BEGIN (DSA|RSA|RSA1|ECDSA|ED25519) PRIVATE KEY-----' "$@" >&2 ; then
		err "SSH private keys should not be committed"
	fi

	# This is not perfect, but it should catch the most obvious violations
	# (AWS secret keys should be 40 chars, this should also catch accidental truncations)
	if egrep --ignore-case --files-with-matches -- '^\s*aws_?secret_?access_?key\s*=[[:space:]"'"'"']*[a-z0-9/+]{30}' "$@" >&2 ; then
		err "AWS secret keys should not be committed"
	fi
}

lint_secrets "$@"
exit $return_code
