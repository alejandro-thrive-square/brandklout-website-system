#!/usr/bin/env bash
# Doctor names, one form each (2026-09-25, doctor-names.py): pages, the ad pages, the
# blog templates AND the article rows (re-imported, then republished oldest first with
# --force, which keeps the /blog order). To one instance. Merge on production.
#   TARGET=staging bash bugherd/push-doctor-names-2026-09-25.sh > bugherd/push-doctor-names-staging-2026-09-25.log 2>&1
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
step node import-articles.mjs
step node import-scripts.mjs --publish
step node publish-articles.mjs --force
echo "== END"
