#!/bin/bash -e
set -o pipefail

source "$(dirname "${BASH_SOURCE[0]}")/../bin/common.inc"
cd "$repo_dir"

# If changing this, make sure you deal with the following pyenv situations:
#  - requested 3.x.y but 3.x.z is currently activated (eg pyenv shell; we assume the users knows what they're doing and will use the activated version)
#  - requested 3.x.y but only 3.x.z is installed
#  - requested 3.x.y but no 3.x.* installed at all
#  - requested 3.x.y but pyenv doesn't know about 3.x.y
#  - requested 3.x.y but pyenv doesn't know about any 3.x.*

function warn() {
	echo "$@" >&2
}

function help() {
	echo "$0 [--help] [--no-dev] [--no-pyenv] [--no-input] [target_venv_path]"
	echo
	echo "Creates a clean virtualenv"
	echo "Expects to encounter a working pyenv + pyenv-virtualenvwrapper environment"
	echo
	echo "Options:"
	echo "   --help - this screen"
	echo "   --no-dev   - skip installing dev.txt requirements"
	echo "   --no-pyenv - don't check for pyenv (is not used on CI)"
	echo "   --no-input - auto-confirm prompts"
	echo
	print_target_details
}

use_pyenv=true
install_dev=true
show_help=false
auto_confirm=false
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
			;;
		esac
		shift
	done
}

parse_args "$@"

! $show_help || { help ; exit ; }

[[ -e .python-version ]] || fail "ERROR: Missing local .python-version file -- see pyenv documentation"

target_ver="$(< .python-version )"
target_ver_short="$( cut -f-2 -d. < .python-version )"
target_venv="$(<.venv)"
target_dir="${target_dir:-${WORKON_HOME:-~/.virtualenvs}/$target_venv}"
target_dir_real="$( realpath "${target_dir/#\~/$HOME}" )"
python_bin=$( which python$target_ver_short || true )
if [[ $python_bin != "" ]] ; then
	python_bin=$( realpath "$python_bin" 2>/dev/null || true)
	# We need to deal with the fact that if we ask for 3.6.3 but only 3.6.2 is installed then the pyenv shim will exist
	# but when you try to run it pyenv will just complain that 3.6.3 is not installed
	python_ver=$( $python_bin -V 2>/dev/null | cut -f2 -d' ' | cut -f-3 -d. || echo "$(<.python-version)" )
else
	# python version has not been installed in pyenv yet
	python_ver=$(<.python-version)
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
		fail "ERROR: Requested python $target_ver but can't find any installed python $target_ver_short. Run 'brew upgrade && pyenv install $target_ver'"
	fi

	# pyenv knows about the python version we're requesting, but another point release is installed instead;
	# the shim will fail when you try to run it
	if ! "$python_bin" -c '' 2>/dev/null ; then
		fail "ERROR: Requested python $target_ver but is not installed. Run 'brew upgrade && pyenv install $target_ver'"
	fi

	pyenv virtualenvwrapper
	[[ $VIRTUALENVWRAPPER_VIRTUALENV != "" ]] || fail "ERROR: Missing (or not activated) pyenv-virtualenvwrapper"
fi

[[ $python_ver_short = $target_ver_short ]] || fail "ERROR: Current python version is not as expected ($python_ver; expected $(<.python-version) (did you accidentally set 'pyenv shell' or leave another virtualenv active?)"

# paranoia: if we got this far then these should be correct, but double check

if $use_pyenv ; then
	[[ $( type -t mkvirtualenv ) = "function" ]] || fail "ERROR: Missing virtualenvwrapper"
fi

if [[ "$OSTYPE" =~ ^darwin ]] ; then
	# on dev/macos we expect to use pyenv; brew or OS python might cause problems if they come before the pyenv shims
	# (on linux though we generally prefer to use an OS-provided python)
	if ! $( realpath $( which python3 ) | grep '^/Users' >/dev/null ) ; then
		fail "ERROR: $( which python3 ) comes before pyenv python3 in your PATH; this will cause conflicts"
	fi
	if ! $( realpath $( which python ) | grep '^/Users' >/dev/null ) ; then
		fail "ERROR: $( which python ) comes before pyenv python in your PATH; this will cause conflicts"
	fi
	if ! $( realpath $( which virtualenv ) | grep '^/Users' >/dev/null ) ; then
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
echo "Syncing virtualenv $(<.venv) using $python_bin in $target_dir"
set -x
	bin/venv-update venv= "$target_dir" "--python=$python_bin" install= -r requirements.txt --upgrade
{ set +x; } 2>/dev/null

source $target_dir/bin/activate

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
