#!/bin/bash
# 2026-09-26 BugHerd round five (#176-#433): ~80 photo swaps from the practice Drive, the badge strip off
# every page but home, the Suite 104B captions site-wide, ~70 copy edits, CSS and journey.js (ticker
# pause on hover). The badge strip and the captions touch all 215
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
