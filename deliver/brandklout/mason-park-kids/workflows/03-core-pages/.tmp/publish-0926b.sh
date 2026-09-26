#!/bin/bash
# 2026-09-26, BugHerd #226 #371: two captions removed after publish-0926.sh had converted.
# Two pages only.
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
step node import-pages.mjs --only /services/comprehensive-pediatric-dentistry,/new-patients --publish
echo; echo "=== ALL DONE"
