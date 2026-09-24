#!/bin/bash
# 2026-09-24, second push: BugHerd #140's "Learn more" links on /services/preventive-dentistry
# were written after publish-0924.sh had converted the pages. Same chain, one page imported.
set -e
cd "$(dirname "$0")"
export MSYS_NO_PATHCONV=1
step() { echo; echo "=== $*"; "$@"; }
step node to-instatic.mjs --media instatic-media-map.json --lean
step node ship-payload.mjs
step node run-convert.mjs
step node fetch-nodes.mjs
step node apply-body-class.mjs
step node apply-image-alt.mjs
step node import-pages.mjs --only /services/preventive-dentistry --publish
echo; echo "=== ALL DONE"
