#!/bin/bash -e
set -o pipefail

source "$(dirname "${BASH_SOURCE[0]}")/common.inc"

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
	# if ! $is_template_repo && [[ $( find_exclude_paths "./$project_dir_relative" -name favicon.ico -print -quit ) = "" ]] ; then
	#	err "No favicon.ico found; check out https://realfavicongenerator.net/"
	# fi

}


lint_doc
exit $return_code
