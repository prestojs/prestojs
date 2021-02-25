#!/bin/bash -e
set -o pipefail

source "$(dirname "${BASH_SOURCE[0]}")/../bin/common.inc"
cd "$repo_dir"


# If updating, re-test this with environments created by both
# by virtualenv and venv
#
# Every option for locking packages has problems:
#
#  - pip and poetry have no way to remove alien packages
#    - https://github.com/sdispater/poetry/issues/648
#  - pip and pip-faster don't output package hashes
#    - https://github.com/pypa/pip/issues/4732
#  - pip and pip-faster can't mix package hashes with git source
#    - https://github.com/pypa/pip/issues/4995
#  - pip-compile doesn't pin git dependencies
#    - https://github.com/jazzband/pip-tools/issues/161
#  - pipenv works but is *very* slow
#  - pipenv and poetry have hard-to-read lockfile diffs


REQUIREMENTS_BASE="requirements/base.txt"
REQUIREMENTS_PROD="requirements/prod.txt"
REQUIREMENTS_DEV="requirements/dev.txt"
REQUIREMENTS_OUT="requirements/requirements.txt"

show_help() {
	echo "Syntax: $0 [--help]"
	echo
	echo "Update virtualenv to latest version of requirements specified in $REQUIREMENTS_IN "
	echo " and freeze versions to $REQUIREMENTS_OUT"
	echo
	echo "Arguments"
	echo "  --no-dev - do not install dev dependencies"
	echo "  --no-upgrade - do not upgrade packages."
	echo "         Useful if your existing requirements.txt has not been generated correctly"
	echo "         By default this script will do aggressive upgrades (transitive dependencies will upgrade)"
	echo "  --help - this screen"
	echo
	echo
}

do_dev=true
do_hash=true
do_upgrade=true
function parse_args() {
	while [[ $# -gt 0 ]] ; do
		case "$1" in
			--no-dev)
				do_dev=false
				;;
			--no-hash)
				do_hash=false
				;;
			--no-upgrade)
				do_upgrade=false
				;;
			--help)
				show_help
				exit
				;;

			*)
				help >&2
				exit 1
				;;
		esac
		shift
	done
}

parse_args "$@"

[[ -e "$REQUIREMENTS_BASE" ]] || ( echo "Missing pip requirements file: $REQUIREMENTS_BASE" 2>&1 ; exit 1)
[[ -e "$REQUIREMENTS_PROD" ]] || ( echo "Missing pip requirements file: $REQUIREMENTS_PROD" 2>&1 ; exit 1)
[[ -e "$VIRTUAL_ENV" ]] || ( echo "Missing VIRTUAL_ENV (you need to activate a virtualenv first; try 'workon $(<.venv)')" 2>&1 ; exit 1)

set_python_target_vars

python_bin=$( which python$target_ver_short || true )
{ [[ -x $python_bin ]] && $python_bin -c '' ; } || fail "Can't execute $python_bin"

python_ver=$( $python_bin -c 'import sys; print(*sys.version_info[0:3], sep=".")' )
[[ $python_ver = $target_ver ]] || echo "WARNING: Python version ($python_ver) does not match expected ($target_ver). Not updating."


echo "input reqs:   ${REQUIREMENTS_BASE:-ERROR}, ${REQUIREMENTS_PROD:-ERROR} "
echo "output reqs:  ${REQUIREMENTS_OUT:-ERROR}"
echo "virtualenv:   ${VIRTUAL_ENV:-ERROR}"
echo "python ver:   ${python_ver}"
echo "python bin:   ${python_bin}"
echo
echo Press Enter to continue or Ctrl-C to abort
read

echo
echo


if false ; then
	# We should no longer need to do this but is here if we need to revert it manually
	# in future
	echo "---------------------------------------------------------------------------------"
	echo "Resetting virtualenv"
	echo "---------------------------------------------------------------------------------"
	packages=$(
		pip list --format freeze \
		| { egrep -v "^($( IFS='|' ; echo "${CORE_PYTHON_PACKAGES[*]}" ))==" || true ; } \
		| sed 's/==.*//'
	)
	set -x
		pip uninstall --yes ${packages[@]}
	{ set +x; } 2>/dev/null
fi

echo "---------------------------------------------------------------------------------"
echo "Syncing requirements"
echo "---------------------------------------------------------------------------------"
set -x
	# venv-update includes pip-faster (we don't actually use venv-update itself)
	pip install venv-update $( ! $upgrade || echo "--upgrade --upgrade-strategy eager" )
	pip-faster install --prune -r "$REQUIREMENTS_BASE" -r "$REQUIREMENTS_PROD" $( ! $upgrade || echo "--upgrade --upgrade-strategy eager" )
{ set +x; } 2>/dev/null

echo
echo
echo "---------------------------------------------------------------------------------"
echo "Saving requirements"
echo "---------------------------------------------------------------------------------"
# not using "pip freeze -r $REQUIREMENTS_IN" because pip doesn't handle includes properly
cat /dev/null > "$REQUIREMENTS_OUT"
echo "# --------------------------------------------------------" >> "$REQUIREMENTS_OUT"
echo "# WARNING: Do not edit the contents of this file directly;" >> "$REQUIREMENTS_OUT"
echo "# You should modify base.txt and then run freeze.sh"        >> "$REQUIREMENTS_OUT"
echo "# --------------------------------------------------------" >> "$REQUIREMENTS_OUT"
pip freeze \
	| sed 's/^pytz=.*$/pytz/' \
	| grep -E -v '^(virtualenv)([>=<]|$)' \
	>> "$REQUIREMENTS_OUT"

# If for some reason you're stuck with setuptools >=34,<36 then you probably want to also filter out the extra dependencies
# see https://setuptools.readthedocs.io/en/latest/history.html#v36-0-0 for links to the problems this created
#	sed '/^setuptools=.*$/setuptools !=34.* ,!=35.*/' |
#	grep -E -v '^(appdirs|packaging|pyparsing)([>=<]|$)' |


if $do_dev ; then
	echo
	echo
	echo "---------------------------------------------------------------------------------"
	echo "Installing dev requirements"
	echo "---------------------------------------------------------------------------------"
	echo
	echo "$REQUIREMENTS_OUT has been frozen"
	echo
	echo "About to install extra $REQUIREMENTS_DEV requirements"
	echo
	echo "Press Enter to continue or Ctrl-C to abort"
	read
	set -x
		pip install -r "$REQUIREMENTS_DEV"
	{ set +x; } 2>/dev/null
fi
