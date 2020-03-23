#!/bin/bash -e
set -o pipefail

source "$(dirname "${BASH_SOURCE[0]}")/../bin/common.inc"
cd "$repo_dir"

# If changing this, please remember to rerun the test cases:
#   bin/test-init-dev-virtualenv.sh
#
# TODO: We're now using venv; do we still need the virtualenvwrapper checks?

function warn() {
	echo -e "${COLOR_WARN}$@${NO_COLOR}" >&2
}

function help() {
	echo "$0 [--help] [--no-dev] [--no-pyenv] [--no-input] [target_venv_path]"
	echo
	echo "Creates a clean python virtual environment with packages installed"
	echo "Defaults to using pyenv so expects a working pyenv + pyenv-virtualenvwrapper setup"
	echo
	echo "Options:"
	echo "   --help - this screen"
	echo "   --no-dev   - skip installing dev.txt requirements"
	echo "   --no-pyenv - don't use pyenv (useful on CI)"
	echo "   --no-input - auto-confirm prompts"
	echo
	print_target_details
}

use_pyenv=true
install_dev=true
show_help=false
auto_confirm=false
requirements_txt="requirements.txt"	# should only be used by test harness
custom_target_dir=false
function parse_args() {
	while [[ $# -gt 0 ]] ; do
		case "$1" in
			--no-dev)
				install_dev=false
				;;

			--no-input)
				auto_confirm=true
				;;

			--no-pyenv)
				use_pyenv=false
				;;

			--requirements)
				shift
				requirements_txt="$1"
				;;

			--help)
				# we don't do this straight away so that target_dir can be overriden
				show_help=true
				;;

			-*)
				help >&2
				exit 1
				;;

			*)
				target_dir="$1"
				custom_target_dir=true
				;;
		esac
		shift
	done
}

parse_args "$@"

! $show_help || { help ; exit ; }

set_python_target_vars

target_dir="${target_dir:-${WORKON_HOME:-~/.virtualenvs}/$target_venv}"
target_dir_real=$( realpath --canonicalize-missing "${target_dir/#\~/$HOME}" )
python_bin=$( which python$target_ver_short || true )
if [[ $python_bin != "" ]] ; then
	python_bin=$( realpath "$python_bin" 2>/dev/null || true)
	# We need to deal with the fact that if we ask for 3.6.3 but only 3.6.2 is installed then the pyenv shim will exist
	# but when you try to run it pyenv will just complain that 3.6.3 is not installed
	python_ver=$( $python_bin -c 'import sys; print(*sys.version_info[0:3], sep=".")' 2>/dev/null || echo "$target_ver" )
else
	# python version has not been installed in pyenv yet
	python_ver="$target_ver"
fi

python_ver_short=$( echo $python_ver | cut -f-2 -d. )


function print_target_details() {
	echo "virtualenv: ${target_venv}"
	if [[ $target_dir != $target_dir_real ]] ; then
		echo "target dir: ${target_dir} (${target_dir_real})"
	else
		echo "target dir: ${target_dir}"
	fi
	echo "python ver: ${python_ver} (requested $target_ver, will accept any $target_ver_short if already activated)"
	echo "python bin: ${python_bin}"
}

# Validation checks
[[ $VIRTUAL_ENV = "" ]] || fail "ERROR: Already a virtualenv ($VIRTUAL_ENV) active; please deactivate before running this"

if $use_pyenv  ; then
	[[ $( type -t pyenv ) = "file" ]] || fail "ERROR: pyenv is not installed"

	eval "$( pyenv init - )"

	[[ $( type -t pyenv ) = "function" ]] || fail "ERROR: pyenv is not activated"

	[[ $( type -t pyenv-virtualenvwrapper_lazy ) ]] || fail "ERROR: pyenv-virtualenvwrapper is not installed"

	# pyenv doesn't know about the python version we're requesting
	if ! pyenv versions --bare | grep '^[0-9.]*$' | fgrep "$python_ver_short." >/dev/null ; then
		pyenv versions --bare | grep '^[0-9.]*$' | fgrep "$python_ver_short."
		fail "ERROR: Requested python $target_ver but can't find any installed python $target_ver_short. Run 'brew upgrade pyenv && pyenv install $target_ver'"
	fi

	# if we get to here then pyenv knows about the python version we're requesting, but it's not active;
	# `which python3.x` works but the shim fails when you actually try to run it
	# TODO: prompt the user whether they'd like us to run "pyenv shell --unset"
	if ! "$python_bin" -c '' 2>/dev/null ; then
		if [[ $PYENV_VERSION != "" ]] ; then
			fail "ERROR: Conflicting pyenv shell version; run 'pyenv shell --unset' first"
		else
			fail "ERROR: Requested python found but failed trying to run $python_bin"
		fi
	fi

	pyenv virtualenvwrapper
	[[ $VIRTUALENVWRAPPER_VIRTUALENV != "" ]] || fail "ERROR: Missing (or not activated) pyenv-virtualenvwrapper"

	# if we're supposed to be using pyenv and the python version is not in pyenv then this is a problem
	# usually it means that someone on a mac is trying to use the homebrew version of python
	if ! echo "$( which "$python_bin" )" | grep .pyenv/shims ; then
		fail "ERROR: Expecting pyenv python but got something else (are you trying to use a system or homebrew version?)"
	fi
fi

if [[ $python_ver_short != $target_ver_short ]] ; then
	fail "ERROR: Current python version is not as expected ($python_ver; expected $(<.python-version) (did you accidentally set 'pyenv shell'?)"
fi

# paranoia: if we got this far then these should be correct, but double check

if $use_pyenv ; then
	[[ $( type -t mkvirtualenv ) = "function" ]] || fail "ERROR: Missing virtualenvwrapper"
fi

if [[ "$OSTYPE" =~ ^darwin ]] ; then
	# on dev/macos we expect to use pyenv; brew or OS python might cause problems if they come before the pyenv shims
	# (on linux though we generally prefer to use an OS-provided python)
	if ! $( realpath $( which python3 ) | grep '/.pyenv/shims/' >/dev/null ) ; then
		fail "ERROR: $( which python3 ) comes before pyenv python3 in your PATH; this will cause conflicts"
	fi
	if ! $( realpath $( which python ) | grep '/.pyenv/shims/' >/dev/null ) ; then
		fail "ERROR: $( which python ) comes before pyenv python in your PATH; this will cause conflicts"
	fi
	if ! $( realpath $( which virtualenv ) | grep '/.pyenv/shims/' >/dev/null ) ; then
		fail "ERROR: $( which virtualenv ) comes before pyenv virtualenv in your PATH; this will cause conflicts"
	fi
fi

if $use_pyenv ; then
	if [[ -e "~/.pyenv/.git" ]] ; then
		warn "WARNING: You appear to be using a pyenv source distribution (at ~/.pyenv). It is recommended that you use brew pyenv instead."
	elif [[ $( which pyenv ) != '/usr/local/bin/pyenv' ]] ; then
		warn "WARNING: You are using $( which pyenv) -- it is recommended to use a packaged pyenv rather than install from source"
	fi
fi


echo "---------------------------------"
echo "This will create a new virtualenv"
echo
print_target_details
echo
echo "Press Enter to continue or Ctrl-C to abort"
$auto_confirm || read

echo "---------------------------------"
echo "Syncing virtualenv $(<.venv) using $python_bin ($python_ver) in $target_dir"
# Check if python virtualenv exists.
if [[ ! -f $target_dir/bin/activate ]] ; then
	echo "Could not find virtualenv, creating using $python_ver from $python_bin"
	$python_bin -m venv "$target_dir"
else
	echo "Found virtualenv, checking python version"
	# the python --version fallback is in case of a truly whacky virtualenv (probably python2)
	check_ver=$( source "$target_dir/bin/activate" ; python3 -c 'import sys; print(*sys.version_info[0:3], sep=".")' || python --version )
	check_ver_short=$( echo "$check_ver" | cut -f-2 -d. )
	echo "   found $check_ver_short; was looking for $python_ver_short"
	if [[ $check_ver_short != $python_ver_short ]]; then
		echo "----------------------------------------"
		echo "PYTHON VERSION MISMATCH $check_ver is not a form of $python_ver_short"
		echo
		echo "About to destroy your existing virtualenv at '$target_dir' and recreate it"
		echo
		echo "Press Enter to recreate, or Ctrl-C to abort"
		echo
		$auto_confirm || read
		set -x
			rm -rf "$target_dir"
			python$python_ver_short -m venv "$target_dir"
		{ set +x; } 2>/dev/null
	else
		echo "   virtualenv python version is good"
	fi
fi

echo "Syncing requirements into virtualenv"
source "$target_dir/bin/activate"
set -x
	pip install venv-update

	pip-faster install --prune -r "$requirements_txt"
{ set +x; } 2>/dev/null

if $install_dev ; then
	echo "---------------------------------"
	echo "About to install dev packages into $(<.venv)"
	echo
	echo "Press Enter to continue or Ctrl-C to abort"
	$auto_confirm || read
	set -x
		pip install -r requirements/dev.txt
	{ set +x; } 2>/dev/null
fi

echo "-----------------------------"
echo "Environment creation complete. To activate the environment use:"
echo
if $custom_target_dir ; then
	echo "  source $target_dir/bin/activate"
else
	echo "  workon $target_venv"
fi
echo

