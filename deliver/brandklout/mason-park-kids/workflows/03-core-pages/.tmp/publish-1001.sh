#!/bin/bash
# 2026-10-01 BugHerd round seven (#507-#515): the home comfort card, /our-doctors removals, the
# /services/dental-hygiene-education photo, and the team ticker fix in journey.js. Staging by default
# (PROMOTE=production for production). The homepage re-import drops the Elfsight widget, so it is re-added last.
set -e
cd "$(dirname "$0")"
export MSYS_NO_PATHCONV=1
step() { echo; echo "=== $*"; "$@"; }
step node backup-site.mjs
step node to-instatic.mjs --lean
step node upload-media.mjs
step node to-instatic.mjs --media instatic-media-map.json --lean
step node ship-payload.mjs
step node run-convert.mjs
step node fetch-nodes.mjs
step node apply-body-class.mjs
step node apply-image-alt.mjs
step node import-scripts.mjs
step node import-pages.mjs --only /,/our-doctors,/services/dental-hygiene-education,/our-team --publish
step node add-elfsight-reviews.mjs --apply --publish
echo; echo "=== ALL DONE"
