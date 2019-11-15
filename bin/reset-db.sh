#!/bin/bash -e
set -o pipefail

source "$(dirname "${BASH_SOURCE[0]}")/common.inc"
cd "$project_dir"

do_fixtures=true

# initial data (reference data that we want in the DB but shouldn't get modified by users)
do_initial=true

# groups defined in code
do_groups=true

# dev data
do_dev=true

# override sanity checks
force=false

soft_reset=false

function show_help() {
	echo "Usage: $0 [--no-fixtures] [--no-dev] [--soft]"
	echo
	echo "Options:"
	echo " --no-fixtures   Don't load any fixtures"
	echo " --no-dev        Don't load user/dev fixtures"
	echo " --soft          Soft reset (truncate tables instead of resetting DB; may not work if you loaded data in migrations)"
	echo " --force         Force reset regardless of current environment"
	echo
}

function parse_args() {
	while [ $# -gt 0 ] ; do
		case "$1" in
			--no-dev)
				do_dev=false
				;;
			--no-fixtures)
				do_fixtures=false
				;;

			--soft)
				soft_reset=true
				;;

			--force)
				force=true
				;;

			--help)
				show_help
				exit 0
				;;
			*)
				echo "Unknown option '$1'" >&2
				echo >&2
				show_help >&2
				exit 1
				;;
		esac
		shift
	done
}

parse_args "$@"

# Make sure we only ever run this in dev or CI
if ! ./manage.py diffsettings 2>&1 >/dev/null | egrep "^Loaded (CI|dev) config" >/dev/null ; then
	if $force ; then
		echo "This will destroy all existing data in the database"
		echo
		sleep 4

		echo "You are logged in as $USER@$HOSTNAME"
		echo
		sleep 4
		read -p "Enter 'OK' to destroy the database contents: " response
		[[ $response = "OK" ]]

	else
		# abort and display errors if the config won't load
		./manage.py diffsettings 2>/dev/null >/dev/null || ./manage.py diffsettings

		echo "This should only be run in dev or CI environments" >&2
		exit 1
	fi
fi

if $soft_reset ; then
	./manage.py flush --noinput
else
	# requires django_extensions to be installed
	./manage.py reset_db --noinput
fi

./manage.py migrate --noinput

! $do_fixtures || ! $do_initial || ./manage.py loaddata init
! $do_fixtures || ! $do_groups  || ./manage.py loaddata groups
! $do_fixtures || ! $do_dev     || ./manage.py loaddata dev_users
! $do_fixtures || ! $do_dev     || ./manage.py loaddata dev
