#!/bin/bash -e
set -o pipefail

source "$(dirname "${BASH_SOURCE[0]}")/common.inc"

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
		":!/bin/lint/lint_template_fixme.sh"
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

lint_template_fixme
exit $return_code
