#!/bin/bash
# 2026-09-21 BugHerd round two: the pediatric map (#29/#40), the hours (#30/#39),
# the comfort card (#31), the sticker's ink (#33), the contact lede (#35), the
# address navigation (#36), the Note column (#37), the parked button fill (#38),
# plus the mangled phone number and the stray WordPress schema on five posts.
#
# Same sequence as publish-0916.sh. import-styles.mjs matters this round: two of
# the fixes are in site.css, and it ships what to-instatic.mjs wrote, so skipping
# to-instatic would publish the PREVIOUS stylesheet with no warning.
set -e
cd "$(dirname "$0")"
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
step node import-pages.mjs --publish
echo; echo "=== ALL DONE"
