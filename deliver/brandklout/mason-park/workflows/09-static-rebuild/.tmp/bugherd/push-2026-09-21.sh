#!/usr/bin/env bash
# The 2026-09-21 push to STAGING (BugHerd round four). Same order as 09-16.
# Every step's exit code is checked; the chain stops on the first failure.
# RAILWAY_TOKEN is never exported: the Railway CLI is logged in on its own and
# an exported token makes every `railway ssh` answer "Unauthorized".
#
#   bash push-2026-09-21.sh > push-2026-09-21.log 2>&1
#
# This round touches every page (the opening hours are in the chrome), so it is
# a full push, not a --dir. backup-staging...2026-09-21T13-51-51.json is the
# snapshot taken first: 63 pages, 747 media, shell seq 99, draft == published.
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
step import-pages.mjs --overwrite
step import-styles.mjs
step apply-blog-template.mjs
step apply-404-template.mjs
step import-scripts.mjs --publish
echo "== END"
