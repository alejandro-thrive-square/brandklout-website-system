#!/bin/bash
# 2026-10-01 BugHerd #82 + the Canva team portraits (#502 #504 #506, every staff photo, Dr. Dave Cho): the practice's Playarea.jpg (382x510) in a portrait frame on the homepage
# #comfort chapter, replacing the st-play band. Staging by default (PROMOTE=production for production).
# The homepage re-import drops the Elfsight widget, so it is re-added last.
set -e
cd "$(dirname "$0")"
export MSYS_NO_PATHCONV=1
PAGES=/,/our-team,/our-doctors   # only these are converted, shipped and imported (to-instatic --only)
step() { echo; echo "=== $*"; "$@"; }
step node backup-site.mjs
step node to-instatic.mjs --lean --only "$PAGES"
step node upload-media.mjs
step node to-instatic.mjs --media instatic-media-map.json --lean --only "$PAGES"
step node ship-payload.mjs
step node run-convert.mjs
step node fetch-nodes.mjs
step node apply-body-class.mjs
step node apply-image-alt.mjs
step node import-styles.mjs
step node import-pages.mjs --only "$PAGES" --publish
step node add-elfsight-reviews.mjs --apply --publish
echo; echo "=== ALL DONE"
