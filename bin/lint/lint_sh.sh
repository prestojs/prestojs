#!/bin/bash -e
set -o pipefail

source "$(dirname "${BASH_SOURCE[0]}")/common.inc"


function lint_sh() {
	notice "Linting shell scripts"

	if [[ $# -eq 0 ]] ; then
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
	else
		files_exec=("$@")
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


lint_sh "$@"
exit $return_code
