#!/bin/bash -e
set -o pipefail

source "$(dirname "${BASH_SOURCE[0]}")/../bin/common.inc"

PIP="pip-faster"
REQUIREMENTS_IN="requirements/prod.txt"
REQUIREMENTS_DEV="requirements/dev.txt"
REQUIREMENTS_OUT="requirements/requirements.txt"

show_help() {
	echo "Syntax: $0 [--help]"
	echo
	echo "Update virtualenv to latest version of requirements specified in $REQUIREMENTS_IN "
	echo " and freeze versions to $REQUIREMENTS_OUT"
	echo
	echo "Arguments"
	echo "  --help - this screen"
	echo
	echo
}

if [[ $1 = "--help" ]] ; then
	show_help
	exit 0
fi

[[ $# -le 1 ]] || { show_help ; exit 1 ; }

[[ -e "$REQUIREMENTS_IN" ]] || ( echo "Missing pip requirements file: $REQUIREMENTS_IN" 2>&1 ; exit 1)
[[ -e "$VIRTUAL_ENV" ]] || ( echo "Missing VIRTUAL_ENV (you need to activate a virtualenv first; try 'workon $(<../.venv)')" 2>&1 ; exit 1)

PYTHON_BIN="$( realpath $( python -c "import sysconfig ; print(sysconfig.get_config_var('BINDIR'))" )/python )"
[[ -x "$PYTHON_BIN" ]] || { echo "Bad python binary: $PYTHON_BIN" 2>&1 ; exit 1 ; }
PYTHON_VER=$( "$PYTHON_BIN" -V 2>&1 | cut -f2 -d' ' | cut -f-3 -d. )
[[ $PYTHON_VER = $(<.python-version) ]] || echo "WARNING: Python version ($PYTHON_VER) does not match expected ($(<.python-version))"


echo "input reqs:   ${REQUIREMENTS_IN:-ERROR}"
echo "output reqs:  ${REQUIREMENTS_OUT:-ERROR}"
echo "virtualenv:   ${VIRTUAL_ENV:-ERROR}"
echo "python ver:   ${PYTHON_VER}"
echo "python bin:   ${PYTHON_BIN}"
echo
echo Press Enter to continue or Ctrl-C to abort
read

echo
echo
echo "---------------------------------------------------------------------------------"
echo "Resetting virtualenv & installing requirements"
echo "---------------------------------------------------------------------------------"
set -x
bin/venv-update venv= "$VIRTUAL_ENV" install= -r "$REQUIREMENTS_IN" --upgrade
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
$PIP freeze |
	sed 's/^pytz=.*$/pytz/' |
	grep -E -v '^(virtualenv)([>=<]|$)' >> "$REQUIREMENTS_OUT"

# If for some reason you're stuck with setuptools >=34,<36 then you probably want to also filter out the extra dependencies
# see https://setuptools.readthedocs.io/en/latest/history.html#v36-0-0 for links to the problems this created
#	sed '/^setuptools=.*$/setuptools !=34.* ,!=35.*/' |
#	grep -E -v '^(appdirs|packaging|pyparsing)([>=<]|$)' |


echo
echo
echo "---------------------------------------------------------------------------------"
echo "Installing dev requirements"
echo "---------------------------------------------------------------------------------"
echo
echo "About to install $REQUIREMENTS_DEV requirements ($REQUIREMENTS_OUT has already been frozen)"
echo
echo "Press Enter to continue or Ctrl-C to abort"
read
$PIP install -r "$REQUIREMENTS_DEV"
