#!/bin/bash
# 2026-09-29 BugHerd #406 caption on /services/invisalign, and the last "Gia or Kebra" lines on /new-patients and /our-team (staging by default).
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
step node import-pages.mjs --only /services/invisalign,/new-patients,/our-team --publish
echo; echo "=== ALL DONE"
