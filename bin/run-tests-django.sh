#!/bin/bash -e
set -o pipefail

source "$(dirname "${BASH_SOURCE[0]}")/common.inc"
cd "$project_dir"

./manage.py test "$@"
