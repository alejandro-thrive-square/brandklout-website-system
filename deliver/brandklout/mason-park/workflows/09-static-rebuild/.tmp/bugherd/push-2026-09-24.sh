#!/usr/bin/env bash
# The 2026-09-24 push to STAGING (BugHerd round six). Same order as 09-16.
# Every step's exit code is checked; the chain stops on the first failure.
# RAILWAY_TOKEN is never exported: the Railway CLI is logged in on its own and
# an exported token makes every `railway ssh` answer "Unauthorized".
#
#   bash push-2026-09-24.sh > push-2026-09-24.log 2>&1
#
# This round touches 7 pages (six photos, the Cherry link) and site.css, so it is
# a full push, not a --dir. backup-staging...2026-09-24T21-29-12.json
# is the snapshot taken first: 63 pages, 1301 media, shell seq 114, draft == published.
set -u
cd "$(dirname "$0")/.."
unset RAILWAY_TOKEN
export INSTATIC_BASE_URL=https://staging.masonparkdental.com
export RAILWAY_ENV_NAME=staging

step() {
  echo "== $*  ($(date +%H:%M:%S))"
  node "$@"
  local rc=$?
  echo "-- exit $rc"
  if [ $rc -ne 0 ]; then echo "== STOPPED at $1"; exit $rc; fi
}

step to-instatic.mjs
step upload-media.mjs
step to-instatic.mjs --media instatic-media-map.json
step ship-payload.mjs
step run-converter.mjs
step fetch-nodes.mjs
step apply-image-alt.mjs
step apply-body-class.mjs
# The six /ads-landing-pages/ GHL forms and call tracking are placed on the
# converted nodes; without this step every full push drops them (they were
# missing from staging from round five until the launch day, 2026-09-24).
step place-ad-embeds.mjs
step import-pages.mjs --overwrite
step import-styles.mjs
step apply-blog-template.mjs
step apply-404-template.mjs
step import-scripts.mjs --publish
echo "== END"
