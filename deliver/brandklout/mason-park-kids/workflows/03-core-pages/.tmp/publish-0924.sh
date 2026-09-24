#!/bin/bash
# 2026-09-24 BugHerd round three (#42-#168): ~60 photo swaps, 11 band deletions,
# ~30 copy edits, layout CSS, the two-level Services menu on every page, and a
# journey.js change (counter units, path .is-grid). The menu touches all 215
# pages and journey.js ships in the script bundle, so this is the whole chain:
# every page, the styles and the scripts.
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
echo; echo "=== ALL DONE"
