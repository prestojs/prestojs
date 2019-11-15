#!/bin/bash -e
set -o pipefail

pushd . >/dev/null
source "$(dirname "${BASH_SOURCE[0]}")/common.inc"
popd >/dev/null

require_virtualenv

if [[ $1 = "--help" ]] ; then
	echo "Usage: $0 [--help] [--check-only] [...]"
	echo
	echo "Checks or reorders python imports according to .isort.cfg policy"
	echo "  --help       - this message"
	echo "  --check-only - show files with policy violations instead of rewriting them"
	echo "  --diff       - show corrected file diffs instead of rewriting them"
	echo "  passing a filename will reformat that file"
	echo "  passing a directory will recurse that tree and reformat all python files"
	echo "  NOTE: symlinks *are* followed"
	echo
	echo "Any extra arguments will be passed directly to isort."
	echo
	exit
fi

if [[ "$1" = "--check-only" ]] ; then
	check_only="--check-only"
	shift
else
	# Insist on an explicit target if we're going to be modifying files
	if [[ $# -eq 0 ]] ; then
		echo "You must specify something to reformat" >&2
		exit 1
	fi
fi

# first try a symlink in this dir
isort_cmd="$(dirname "${BASH_SOURCE[0]}")/isort"

# then the current virtualenv
if ! [ -x "$isort_cmd" ] ; then
	isort_cmd="$VIRTUAL_ENV/bin/isort"
fi

# then whatever the OS has available
if ! [ -x "$isort_cmd" ] ; then
	isort_cmd="$(which isort || true)"
fi

if ! [ -x "$isort_cmd" ] ; then
	echo "Can't find isort; this may not work trying to commit from a GUI" >&2
	echo "You can try symlinking isort in the $(dirname "${BASH_SOURCE[0]}") directory" >&2
	exit 1
fi

"$isort_cmd" \
	--settings-path "$repo_dir" \
	--recursive \
	$check_only \
	"${@:-$project_dir}" | \
	sed -E 's/^(Skipped .* files)$/Note: \1 due to config directives/'
