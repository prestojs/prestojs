source "$(dirname "${BASH_SOURCE[0]}")/../common.inc"

# allowable message categories
commit_categories='build|doc|feature|fix|refactor|style|sys|test|WIP'

# these categories are allowed to have no explanation
# (note that must also appear in $commit_categories to pass validation)
commit_categories_bare='build|WIP'

# git doesn't invoke commit-msg for merges -- unless you have a conflict in
# which case it *does*, so we also allow Merge messages in here
commit_msg_regex="^((${commit_categories}):)|^ *Merge |^(${commit_categories_bare})$|^fixup!"
