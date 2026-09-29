#!/bin/bash
# 2026-09-29 BugHerd round six (#434-#506): ~25 Drive photo swaps and inserts, crops, copy, the team
# page, FAQ removals on four pages and the round-six CSS. Every page, styles and scripts. Staging by
# default (PROMOTE=production for production). A re-import drops the Elfsight widget, so it is re-added last.
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
step node import-styles.mjs
step node import-scripts.mjs
step node import-pages.mjs --publish
step node add-elfsight-reviews.mjs --apply --publish
echo; echo "=== ALL DONE"
