#!/bin/bash -e
set -o pipefail

source "$(dirname "${BASH_SOURCE[0]}")/common.inc"
cd "$repo_dir"
project_dir_relative=./$( realpath --relative-to="$repo_dir" "$project_dir" )

return_code=0

[[ $(pwd) =~ template-django$ ]] && is_template_repo=true || is_template_repo=false

function err() {
	echo "ERROR: $1" >&2
	return_code=1
}
function warn() {
	echo "WARNING: $1" >&2
}

function notice() {
	echo "-----------------------"
	echo $1
}

notice "Linting"

exclude_dirs=(
	.git
	.idea
	node_modules

	# these will only be present on CI
	venv
	cache
	ci-cache

	# legacy path structure
	frontend/node_modules
	frontend/bower_components
)

function find_exclude_paths() {
	# Wrapper to 'find' that excludes paths we never want to touch
	local path
	path="$1"
	shift
	if [[ $path = "" ]] ; then
		err "find_exclude_paths: missing path"
	elif [[ $path != "." && ${path:0:2} != "./" ]] ; then
		# find's -path is a straight string match,
		# 'frontend' != './frontend', right now we only handle $path == '.'
		err "find_exclude_paths doesn't handle a starting path of $path"
	fi

	local startargs
	startargs=(
		"$path"
	)
	if [[ $1 = "-maxdepth" ]] ; then
		# maxdepth is special; it must come before other options
		startargs+=( "$1" "$2" )
		shift
		shift
	fi

	# see https://stackoverflow.com/a/16595367 for the way -not and -prune interact
	local find_exclude_path_params
	local find_exclude_dir
	find_exclude_path_params=()
	for find_exclude_dir in "${exclude_dirs[@]}" ; do
		find_exclude_path_params+=(
			-not \(
				-type d
				-path "./$find_exclude_dir"
				-prune
			\)
		)
	done

	$FIND "$path" "${find_exclude_path_params[@]}" \( "$@" \)
}

function lint_template_fixme() {
	notice "Linting TEMPLATEFIXME"
	local grep_exclude_params
	local grep_exclude_dir
	grep_exclude_params=()
	for grep_exclude_dir in "${exclude_dirs[@]}" ; do
		grep_exclude_params+=( ":!/$grep_exclude_dir" )
	done
	grep_exclude_params+=(
		":!/doc/checklist.md"
		":!/bin/lint.sh"
	)

	if ! $is_template_repo && \
		# we use git grep because gnu grep doesn't have a way to exclude
		# a specific file based on relative path (as opposed to filename)
		# see https://git-scm.com/docs/gitglossary#def_pathspec for available filters
		git grep \
			--no-index \
			TEMPLATEFIXME -- \
			"$repo_dir" \
			"${grep_exclude_params[@]}"
	then
		err "Please review all occurrences of the string 'TEMPLATEFIXME' in the project, and take necessary actions"
	fi
}

function lint_python_version() {
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

function lint_python_packages() {
	notice "Linting python packages"
	# TODO: Strictly speaking this only applies to the AJAX list filter
	# We could check for instances of ModelFieldSearchView or descendants instead of blacklisting the
	# whole package but the fact that this is in there at all is concerning
	if egrep '^\s*django-admin-steroids' requirements/*.txt --quiet ; then
		err "django-admin-steroids use is STRONGLY discouraged. See https://github.com/chrisspen/django-admin-steroids/issues/14"
	fi
}

function lint_python_source() {
	if ! $files_all && [[ ${#files_py[@]} -le 0 ]] ; then
		return 0
	fi

	local flake8_format

	if [[ -t 1 ]]; then
		# If stdout is to a terminal, include colours in flake8 output
		flake8_format='${cyan}%(path)s${reset}:${yellow_bold}%(row)d${reset}:${green_bold}%(col)d${reset}: ${red_bold}%(code)s${reset} %(text)s'
	else
		flake8_format='%(path)s:%(row)d:%(col)d: %(code)s %(text)s'
	fi

	if $files_all; then
		flake8 --config=.flake8.cfg --format="$flake8_format" ./django-root ./bin *.py
	else
		flake8 --config=.flake8.cfg --format="$flake8_format" "${files_py[@]}"
	fi
}

function lint_python_hosting() {
	notice "Linting WSGI / static files configuration"

	local found_whitenoise_wsgi
	local found_whitenoise_middleware
	local found_whitenoise_runserver
	grep --quiet '^[^#]*DjangoWhiteNoise' "$project_dir/wsgi.py" && found_whitenoise_wsgi=true || found_whitenoise_wsgi=false
	grep --quiet '^[^#]*WhiteNoiseMiddleware' "$base_dir"/settings/*.py && found_whitenoise_middleware=true || found_whitenoise_middleware=false
	grep --quiet '^[^#]*whitenoise.runserver_nostatic' "$base_dir"/settings/dev.py && found_whitenoise_runserver=true || found_whitenoise_runserver=false

	if $found_whitenoise_wsgi ; then
		# even if you were using whitenoise, WhiteNoiseMiddleware is better than DjangoWhiteNoise because it also applies to dev
		warn "DjangoWhiteNoise is not recommended; use nginx for serving static files instead"
	fi

	if $found_whitenoise_middleware ; then
		warn "WhiteNoiseMiddleware is not recommended; use nginx for serving static files instead"

		# make sure dev is as close to prod as possible
		if $found_whitenoise_runserver ; then
			warn "If you're using WhiteNoiseMiddleware then you should also use whitenoise.runserver_nostatic in dev"
		fi
	fi

	if [[ -e Procfile ]] ; then
		if ! grep --quiet '^[^#]*bin/start-nginx' Procfile ; then
			warn "You don't appear to be using nginx on heroku; nginx+gunicorn is the recommended configuration"
		fi

		if grep --quiet '^[^#]*waitress' Procfile ; then
			warn "You appear to be using waitress on heroku; nginx+gunicorn is the recommended configuration"
		fi
	fi

	# TODO: Far Future headers & [WhitenoiseCompressed]ManifestStaticFilesStorage
	# TODO: Precompressed static files

}

function lint_js() {
	notice "Linting javascript"
	local nvm_dirs
	local nvm_dir

	# nodejs minor version number
	if [[ -e .nvmrc ]] ; then
		if [[ "$(<.nvmrc)" =~ \. ]] ; then
			err "You have specified a nodejs minor version in .nvmrc -- this is rarely necessary, and will break the lint script"
		else
			require_nodejs
		fi
	fi

	# If there's a package.json then there should be a lockfile of some sort
	local package_json
	for package_json in $( find_exclude_paths . -name package.json ) ; do
		if ! [[ -e ${package_json/package\.json/yarn.lock} ]] && ! [[ -e ${package_json/package\.json/npm-shrinkwrap.json} ]] && ! $is_template_repo ; then
			err "${package_json/.\//} has no yarn.lock or npm-shrinkwrap.json"
		fi
	done

	# We should have a .nvmrc if we're using node
	if [[ $( find_exclude_paths . \
			\( -name package.json -o -name yarn.lock \) \
			-print \
			-quit \
		) != "" ]] ;
	then
		if [[ $( find_exclude_paths . -name .nvmrc -print -quit ) = "" ]] ; then
			err "Found a package.json without any .nvmrc"
		fi
	fi

	# Keep life simple: don't put whitespace in filenames or this may fail
	local filename
	for filename in $( find_exclude_paths . -maxdepth 1 -name package.json ) ; do
		if grep 'TEMPLATE_FIXME' "$filename" --quiet && ! $is_template_repo ; then
			err "You have TEMPLATE_FIXME still in $filename"
		fi
	done

	if $files_all || [[ ${#files_js[@]} -gt 0 ]] ; then
		(cd frontend && yarn run lint)
	fi
}

function lint_sh() {
	if ! $files_all && [[ ${#files_exec[@]} -le 0 ]] ; then
		return 0
	fi

	notice "Linting shell scripts"

	if $files_all ; then
		IFS=$'\n'
			files_exec=(
				$( find_exclude_paths \
					. \
					-type f \
					\( -executable -or -name \*.inc \) \
					! -name \*.py \
					-print \
				)
			)
		unset IFS
	fi

	# filter out
	#  - executables that aren't actually shell scripts
	#  - 3rd party files (by name)
	#
	# (note that .inc files won't be executable and won't have a #! but we still want to process them)
	# we could do this on a file-by-file basis with head+grep but that would be 2 new processes for every file;
	# instead we do it in a single awk process
	local files_hashbang=()
	local files_inc=()
	local files_bad=()

	for f in "${files_exec[@]}" ; do
		if [[ $f =~ '/venv-update$' ]] ; then
			continue
		fi
		if [[ -x $f ]] ; then
			files_hashbang+=("$f")
		else
			files_inc+=("$f")
		fi
	done

	IFS=$'\n'
		files_hashbang=( $( awk '/^#!\/bin\/bash/ && FNR == 1 { print FILENAME }' "${files_hashbang[@]}" ) )
	unset IFS

	files_exec=( "${files_hashbang[@]}" "${files_inc[@]}" )

	IFS=$'\n'
		files_bad=( $( egrep '^ ' -l "${files_exec[@]}" || true ) )
	unset IFS

	if [[ ${#files_bad[@]} -gt 0 ]] ; then
		OFS=$'\n'
			printf 'Leading spaces: %s\n' "${files_bad[@]}"
		unset OFS
		err "Shell scripts should use tabs, not spaces"
	fi
}

function lint_fixtures() {
	if ! $files_all && [[ ${#files_json[@]} -le 0 ]] ; then
		return 0
	fi

	notice "Linting fixtures"
	local fixture
	local min_size

	# If it's less than 16 bytes it's just a stub and can't contain anything useful
	$is_template_repo && min_size='+0c' || min_size='+16c'

	for fixture in init groups dev_users dev ; do
		if [[ $( find_exclude_paths "./$project_dir_relative" -name $fixture.json -size $min_size -print -quit ) = "" ]] ; then
			warn "Cannot find a non-trivial $fixture.json"
		fi
	done
}

function lint_doc() {
	notice "Linting documentation"
	if [[ ! -e README.md ]] ; then
		err "You have no README.md"
	elif ! $is_template_repo ; then
		if grep '# My Project' README.md --quiet ||
			grep 'alliance/template-django' README.md --quiet
		then
			err "You appear to have an unchanged README.md"
		fi
	fi

	if [[ ! -e logo.png ]] ; then
		err "Missing logo.png"
	else
		template_logo_md5="f442b9d75f10cd5ca5d6f27e624dbb39"
		if $is_template_repo ; then
			if [[ "$( $MD5SUM logo.png )" != "$template_logo_md5  logo.png" ]] ; then
				err "$0 needs to be updated with new logo.png hash"
			fi
		else
			if [[ "$( $MD5SUM logo.png )" = "$template_logo_md5  logo.png" ]] ; then
				err "logo.png has not been updated"
			fi
		fi
	fi

	# not really docs, but favicon usually comes from logo.png
	if ! $is_template_repo && [[ $( find_exclude_paths "./$project_dir_relative" -name favicon.ico -print -quit ) = "" ]] ; then
		err "No favicon.ico found; check out https://realfavicongenerator.net/"
	fi

}

function lint_secrets() {
	notice "Linting secrets"
	if git ls-files | grep SECRET_KEY --quiet ; then
		err "SECRET_KEY should not be committed"
	fi
}

function lint_tests() {
	notice "Linting tests"
	if [[ ! $is_template_repo ]] && grep lint-template- .gitlab-ci.yml --quiet ; then
		err "lint-template-* tests should be removed from .gitlab-ci.yml"
	fi
}


files_py=()
files_js=()
files_json=()
files_exec=()
function parse_filelists() {
	local f
	if [[ $# -eq 0 ]] ; then
		files_all=true
	else
		files_all=false
		for f in "$@" ; do
			if [[ $f =~ \.py$ ]] ; then
				files_py+=("$f")
			fi
			if [[ $f =~ \.(js|jsx)$ ]] ; then
				files_js+=("$f")
			fi
			if [[ $f =~ \.(json)$ ]] ; then
				files_json+=("$f")
			fi
			# executable or .inc, but not .py; keep in sync with lint_sh
			if [[ -f $f && ( -x $f || $f =~ \.(inc)$ ) && ! $f =~ \.(py) ]]; then
				files_exec+=("$f")
			fi
		done
	fi
}

parse_filelists "$@"

lint_template_fixme
lint_virtualenv
lint_python_version
lint_python_packages
lint_python_source
lint_python_hosting
lint_js
lint_sh
lint_doc
lint_fixtures
lint_secrets
lint_tests

notice "Linting done"


exit $return_code
