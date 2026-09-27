#!/bin/bash
# 2026-09-24 (evening), BugHerd #170-#187: three pages (/, comprehensive, about-us) and
# site.css (the tick-list fix, #172, reaches every page through the stylesheet).
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
step node import-pages.mjs --only /,/services/comprehensive-pediatric-dentistry,/about-us --publish
echo; echo "=== ALL DONE"
