#!/usr/bin/env bash
# BugHerd round seven (2026-10-01): the six ad pages (copy, terms line, credentials label,
# portrait, anchors, rail vs Termly), journey.js, site.css, and every image alt moved from the
# node onto its media asset (set-media-alt.mjs). Pages, the blog templates, the scripts; the
# articles are untouched. Merge on production: nothing is deleted.
#   TARGET=staging bash bugherd/push-r7-2026-10-01.sh > bugherd/push-r7-staging-2026-10-01.log 2>&1
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
step node set-media-alt.mjs --apply
step node import-scripts.mjs --publish
echo "== END"
