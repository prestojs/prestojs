# This is a wrapper to bin/common.inc for git hooks
#
# git hooks in our dir structure hooks are executed through a symlink;
# we can't use realpath() from common.inc because we don't know how to find it!
realpath=$( command -v realpath >/dev/null 2>&1 ) || function realpath() {
	python -c 'import os,sys;print(os.path.realpath(sys.argv[1]))' "$1"
}
self_path=$( realpath $(dirname "${BASH_SOURCE[0]}") )
source "$self_path/../bin/common.inc"

commit_categories='build|doc|feature|fix|refactor|style|sys|test|WIP'
commit_categories_bare='build|WIP'

# git doesn't invoke commit-msg for merges -- unless you have a conflict in
# which case it *does*, so we also allow Merge messages in here
commit_msg_regex="^((${commit_categories}):)|^ *Merge |^(${commit_categories_bare})$|^fixup!"
