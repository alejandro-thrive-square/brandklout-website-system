#!/usr/bin/env bash
# Contact is the hero and the form; every Flexbook "Book" link goes to /contacts/;
# the ad pages carry the client's Invisalign and New Patient Special forms
# (2026-09-25). Pages, site.css and the two blog template pages, to one instance.
# The articles are untouched (no Flexbook link in their bodies). Merge on
# production: nothing is deleted.
#   TARGET=staging bash bugherd/push-contact-forms-2026-09-25.sh > bugherd/push-contact-forms-staging-2026-09-25.log 2>&1
set -u
cd "$(dirname "$0")/.."
unset RAILWAY_TOKEN
case "${TARGET:-}" in
  staging)    export INSTATIC_BASE_URL=https://staging.masonparkdental.com RAILWAY_ENV_NAME=staging ;;
  production) export INSTATIC_BASE_URL=https://www.masonparkdental.com RAILWAY_ENV_NAME=production ALLOW_PRODUCTION=launch ;;
  *) echo "TARGET=staging|production"; exit 2 ;;
esac
step() {
  echo "== $*  ($(date +%H:%M:%S))"
  "$@"
  local rc=$?
  echo "-- exit $rc"
  if [ $rc -ne 0 ]; then echo "== STOPPED at $*"; exit $rc; fi
}
step node to-instatic.mjs
step node upload-media.mjs
step node to-instatic.mjs --media instatic-media-map.json
step node ship-payload.mjs
step node run-converter.mjs
step node fetch-nodes.mjs
step node apply-image-alt.mjs
step node apply-body-class.mjs
step node place-ad-embeds.mjs
step node import-pages.mjs --overwrite
step node import-styles.mjs
step node build-blog-templates.mjs
step node ship-payload.mjs --dir pages-templates
step node run-converter.mjs
step node fetch-nodes.mjs
step cp converted-pages.json converted-templates.json
step node apply-image-alt.mjs --converted converted-templates.json --dir pages-templates
step node apply-body-class.mjs --converted converted-templates.json --dir pages-templates
step node apply-blog-markers.mjs
step node import-pages.mjs --pages converted-templates.json --overwrite
step node import-styles.mjs --pages converted-templates.json
step node apply-blog-template.mjs
step node apply-404-template.mjs
step node import-scripts.mjs --publish
echo "== END"
