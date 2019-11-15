#!/bin/bash -e
set -o pipefail

source "$(dirname "${BASH_SOURCE[0]}")/common.inc"

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

lint_python_hosting
exit $return_code
