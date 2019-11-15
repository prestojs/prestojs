#@IgnoreInspection BashAddShebang
#
# exports the following items:
#
# functions:
#  realpath() - resolve a path containing symlinks or .. to the real path
#  fail() - print arguments to stderr and exit with a failure code
#
# general variables:
#  MD5SUM - path to the gnu md5sum
#  repo_dir - root of the git repository
#
# django variables: (should match settings.py)
#  is_ci - true or false depending on whether running on a CI server
#  project_dir - root django project path
#  base_dir - django site app path
#  static_dir - collected static files path
#  frontend_dir - frontend spa javascript source path

# fallbacks for realpath (resolve symlinks & canonicalize path)
if type -t realpath >/dev/null ; then
	# nothing to do, realpath is already present
	:
elif command -v greadlink >/dev/null ; then
	function realpath() {
		greadlink --canonicalize "$@"
	}
elif [[ "$OSTYPE" =~ ^darwin ]] ; then
	function realpath() {
		python -c 'import os, sys; print(" ".join(os.path.realpath(arg) for arg in sys.argv[1:]))' "$@"
	}
else
	# assume linux with GNU readlink
	function realpath() {
		readlink --canonicalize "$@"
	}
fi

function require_virtualenv() {
	local virtualenvs_dir

	# validate that a virtualenv is active and if not, try to activate it
	if [ "$VIRTUAL_ENV" = "" ] ; then
		virtualenvs_dir=${WORKON_HOME:-${VIRTUALENVWRAPPER_HOOK_DIR:-~/.virtualenvs}}
		if [[ $( type -t workon ) = "function" ]] ; then
			workon "$(<.venv)"
		elif [[ -e "$virtualenvs_dir/$(<.venv)/bin/activate" ]] ; then
			source "$virtualenvs_dir/$(<.venv)/bin/activate"
		else
			fail "No virtualenv is active (and couldn't find the right one)"
		fi

	fi
}

function require_nodejs() {
	local node_ver_active
	# Check the version of nodejs in use
	node_ver_active=$( node --version | sed -E 's/^v([0-9]+)\.[0-9]+\.[0-9]+.*/\1/' )
	if [[ $node_ver_active != $(<.nvmrc) ]] ; then
		echo "WARNING: Expected nodejs '$(<.nvmrc)', found '$node_ver_active'. Switching." >&2

		if ! type -t nvm 2>/dev/null >/dev/null ; then
			nvm_dirs="${NVM_DIR:-$HOME/.nvm /usr/local/opt/nvm}"
			for nvm_dir in $nvm_dirs ; do
				if [ -e $nvm_dir/nvm.sh ] ; then
					source $nvm_dir/nvm.sh
					break
				fi
			done
		fi

		if ! type -t nvm 2>/dev/null >/dev/null ; then
			err "Could not find nvm"
		else
			nvm use
		fi
	fi
}

function fail() {
	echo "$@" >&2
	exit 1
}

function pathadd() {
	if [[ -d "$1" && ":$PATH:" != *":$1:"* ]]; then
		PATH="${PATH:+"$PATH:"}$1"
	fi
}

# If running inside a git GUI, /usr/local/bin may not be on PATH; we need it
if [[ "$OSTYPE" =~ ^darwin ]] ; then
	pathadd /usr/local/bin
fi

MD5SUM="$( which md5sum || which gmd5sum || fail 'Cannot find md5sum' )"
FIND="$( which gfind || which find || fail 'Cannot find GNU findutils' )"

if [[ "$OSTYPE" =~ ^darwin ]] ; then
	# -quit is a GNU findutils extension
	$FIND -quit 2>/dev/null || fail "Missing GNU find; run 'brew install findutils'"
fi

# BASE_DIR and PROJECT_DIR should resolve to the same thing as in the django settings file
repo_dir="$(realpath "$(dirname "${BASH_SOURCE[0]}")/..")"

is_ci="${CI-false}"
project_dir="$repo_dir/django-testbed/django-root"
base_dir="$project_dir/django_site"
static_dir="$repo_dir/assets"
frontend_dir="$repo_dir/frontend"

cd "$repo_dir"
