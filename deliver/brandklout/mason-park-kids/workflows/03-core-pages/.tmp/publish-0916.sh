#!/bin/bash
# 2026-09-16 BugHerd round: brand-guide palette/type (#4), hospital claim (#11), edited gumball frames (#28).
set -e
cd "$(dirname "$0")"
step() { echo; echo "=== $*"; "$@"; }
step node backup-site.mjs
step node to-instatic.mjs --lean
step node upload-media.mjs
step node to-instatic.mjs --media instatic-media-map.json --lean
step node upload-fonts.mjs
step node ship-payload.mjs
step node run-convert.mjs
step node fetch-nodes.mjs
step node apply-body-class.mjs
step node apply-image-alt.mjs
step node import-styles.mjs
step node import-pages.mjs --publish
echo; echo "=== ALL DONE"
