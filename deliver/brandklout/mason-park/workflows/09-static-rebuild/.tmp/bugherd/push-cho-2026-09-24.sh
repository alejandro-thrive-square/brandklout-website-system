#!/usr/bin/env bash
# "Dr. Cho leads" (2026-09-24): 45 pages, site.css, the ad pages and 49 blog articles,
# to one instance. TARGET=staging|production. Merge on production: nothing is deleted.
# The article rows are re-imported (PATCH, complete cells) and republished oldest
# first with --force, which keeps the /blog listing order.
#   TARGET=staging bash push-cho-2026-09-24.sh > push-cho-staging-2026-09-24.log 2>&1
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
step node apply-blog-template.mjs
step node apply-404-template.mjs
step node import-articles.mjs
step node import-scripts.mjs --publish
step node publish-articles.mjs --force
echo "== END"
