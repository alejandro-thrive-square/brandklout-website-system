#!/bin/bash
# 2026-10-01: everything published to staging today in one chain (round seven #507-#515, the
# /patient-reviews rebuild, the GHL form, the Canva team, #82), for the promotion to production:
#   PROMOTE=production INSTATIC_BASE_URL=https://mason-park-kids.up.railway.app bash publish-1001-all.sh
# Same result as publish-1001.sh + 1001b + 1001c in order: home/ holds the final state of all three.
set -e
cd "$(dirname "$0")"
export MSYS_NO_PATHCONV=1
PAGES=/,/contacts,/patient-reviews,/our-team,/our-doctors,/services/dental-hygiene-education
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
step node import-scripts.mjs
step node import-pages.mjs --only "$PAGES" --publish
step node add-elfsight-reviews.mjs --apply --publish
step node add-ghl-contact-form.mjs --apply --publish
echo; echo "=== ALL DONE"
