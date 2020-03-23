source "$(dirname "${BASH_SOURCE[0]}")/../common.inc"

cd "$repo_dir"
project_dir_relative=./$( realpath --relative-to="$repo_dir" "$project_dir" )
return_code=0


function err() {
	echo "❌: $1" >&2
	return_code=1
}
function warn() {
	echo "⚠️: $1" >&2
}

function notice() {
	echo "-----------------------"
	echo $1
}

exclude_dirs=(
	.tox
	.git
	.idea
	node_modules
	.yarn

	# these will only be present on CI
	venv
	cache
	ci-cache

	# legacy path structure
	frontend/node_modules
	frontend/bower_components
)

[[ $(pwd) =~ template-django$ ]] && is_template_repo=true || is_template_repo=false


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


commit_categories='build|doc|feature|fix|refactor|style|sys|test|WIP'
commit_categories_bare='build|WIP'

# git doesn't invoke commit-msg for merges -- unless you have a conflict in
# which case it *does*, so we also allow Merge messages in here
commit_msg_regex="^((${commit_categories}):)|^ *Merge |^(${commit_categories_bare})$|^fixup!|Publish"
