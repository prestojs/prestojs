#!/bin/bash -e
set -o pipefail

source "$(dirname "${BASH_SOURCE[0]}")/common.inc"


function lint_pythonversion() {
	notice  "Linting python versions"
	# check python version (requirements.txt)
	# Should look something like this:
	#   python-version-3.5.3; python_version < '3.5.3' or python_version > '3.5.3'
	# or
	#   python-version-3.5; python_version < '3.5' or python_version > '3.5'
	local python_version_pip
	local python_version_pip_regex
	local python_version_pip_minor
	local python_version_pip_minor_regex
	local python_version_latest
	local python_version_active
	local python_version_pyenv
	local pyenv_regex
	local pyenv_available

	local python_version_os_maintained
	python_version_os_maintained=(
		# Debian 8
		#2.7.9
		3.4.2

		# Ubuntu 14.04
		#2.7.6
		#3.4.3

		# Ubuntu 16.04
		#2.7.12
		3.5.2

		# Ubuntu 18.04
		3.6.7
	)

	python_version_pip=$( sed -E 's/^python-(assert-)?version-(([0-9]+\.)*[0-9]+).*$/\2/p;d' < requirements.txt )
	if [[ $python_version_pip = "" ]] ; then
		err "requirements.txt does not specify a python version"
	fi
	python_version_pip_regex="^${python_version_pip//./\\.}"
	python_version_pip_minor="$( sed -E 's/^python-(assert-)?version-([0-9]+\.[0-9]+).*$/\2/p;d' < requirements.txt )."
	python_version_pip_minor_regex="^${python_version_pip_minor//./\\.}"

	if $( which pyenv >/dev/null ) ; then
		# find the latest not-prerelease cpython available

		# pyenv install --list is a bit slow; so we cache the results for 1 day
		# if pyenv is updated then we should refresh the cache
		local pyenv_cache_dir=~/.cache/
		local pyenv_cache_file=alliance-pyenv-available
		if [[ -d ~/.cache ]] && \
				[[ $( $FIND $pyenv_cache_dir -maxdepth 1 -type f -name $pyenv_cache_file -mtime -1 -print -quit ) != "" ]] && \
				[[ "$pyenv_cache_dir/$pyenv_cache_file" -nt $( which pyenv ) ]] ;
		then
			pyenv_available=$(<~/.cache/alliance-pyenv-available)
		else
			pyenv_available=$( pyenv install --list )
			if [[ -d ~/.cache ]] ; then
				cat > ~/.cache/alliance-pyenv-available <<< "$pyenv_available"
			fi
		fi

		if ! python_version_latest=$( cat <<< "$pyenv_available" | sed 's/  //' | grep -E "${python_version_pip_minor_regex}" | grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' | tail -n 1 ) ; then
			err "Cannot determine latest python version"
		fi
		python_version_latest="${python_version_latest// /}"
	else
		python_version_latest=""
	fi

	# check python version (current environment)
	python_version_active=$( python --version 2>&1 | sed 's/Python //' )

	if [[ ! $python_version_active =~ $python_version_pip_regex ]] ; then
		if [[ $python_version_active =~ $python_version_pip_minor_regex ]] ; then
			warn "Active python version ($python_version_active) != requirements.txt ($python_version_pip)"
		else
			err  "Active python version ($python_version_active) != requirements.txt ($python_version_pip)"
		fi
	fi

	# check python version (pyenv)
	if [[ ! -e .python-version ]] ; then
		err "No pyenv .python-version specified"
	else
		python_version_pyenv="$(<.python-version)"
		python_version_pyenv="${python_version_pyenv// /}"

		if [[ ! $python_version_pyenv =~ $python_version_pip_regex ]] ; then
			err "requirements.txt ($python_version_pip) != pyenv .python-version ($python_version_pyenv)"
		fi

		if [[ $python_version_latest != "" && $python_version_pyenv != ${python_version_latest} ]] ; then
			# These versions are part of base OS distributions; security patches are backported so don't
			# warn about not being the latest version if using them (we can't tell here where the site is
			# to be deployed be this is good enough)

			python_version_pyenv_regex=" ${python_version_pyenv//./\\.} "
			if [[ ! " ${python_version_os_maintained[@]} "  =~ $python_version_pyenv_regex ]] ; then
				warn "pyenv .python-version ($python_version_pyenv) != latest point release ($python_version_latest)"
			fi
		fi
	fi

	# check python version (heroku)
	if [[ -e runtime.txt ]] ; then
		python_version_heroku="$(<runtime.txt)"
		python_version_heroku="${python_version_heroku//python-/}"

		if [[ ! $python_version_heroku =~ $python_version_pip_regex ]] ; then
			err "heroku runtime.txt ($python_version_heroku) != requirements.txt ($python_version_pip)"
		fi

		if [[ $python_version_heroku != $python_version_pyenv ]] && ! $is_template_repo ; then
			err "heroku runtime.txt ($python_version_heroku) != pyenv .python-version ($python_version_pyenv)"
		fi

		if [[ $python_version_latest != "" && $python_version_heroku != ${python_version_latest} ]] ; then
			# Can't be an error - latest version isn't always available in heroku
			warn "heroku runtime.txt ($python_version_heroku) != latest point release ($python_version_latest)"
		fi
	fi
}


lint_pythonversion
exit $return_code
