#!/bin/bash
# (rv-tablet-consult had never been uploaded: its first slot, #54, was dropped for #141.)
# 2026-09-24, BugHerd #169: a photograph on every homepage step card (site.css + index.html).
set -e
cd "$(dirname "$0")"
export MSYS_NO_PATHCONV=1
step() { echo; echo "=== $*"; "$@"; }
step node to-instatic.mjs --lean
step node upload-media.mjs
step node to-instatic.mjs --media instatic-media-map.json --lean
step node ship-payload.mjs
step node run-convert.mjs
step node fetch-nodes.mjs
step node apply-body-class.mjs
step node apply-image-alt.mjs
step node import-styles.mjs
step node import-pages.mjs --only / --publish
echo; echo "=== ALL DONE"
