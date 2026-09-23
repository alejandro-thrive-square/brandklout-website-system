#!/bin/bash
# 2026-09-23 BugHerd #41: the /special-offers hero is the reviewer's own front-desk
# frame (front-desk-tablet), held at 50% 28% by `.ar-bg.is-counter` in site.css.
# Same chain as publish-0921.sh; only /special-offers is imported (the converted
# slug, hence MSYS_NO_PATHCONV so Git Bash leaves the leading slash alone).
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
step node import-pages.mjs --only /special-offers --publish
echo; echo "=== ALL DONE"
