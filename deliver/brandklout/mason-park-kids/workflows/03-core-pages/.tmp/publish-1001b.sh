#!/bin/bash
# 2026-10-01 /patient-reviews rebuilt on the "Patient Stories" order (Asana 1218885013466701) and the
# GHL contact form on /contacts and /patient-reviews (BugHerd #34 #198). Styles and scripts change
# (carousel CSS + site.js). Staging by default (PROMOTE=production for production). Both re-imported
# pages drop their embeds, so the Elfsight wall and the form are re-added last.
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
step node import-pages.mjs --only /contacts,/patient-reviews --publish
step node add-elfsight-reviews.mjs --apply --publish
step node add-ghl-contact-form.mjs --apply --publish
echo; echo "=== ALL DONE"
