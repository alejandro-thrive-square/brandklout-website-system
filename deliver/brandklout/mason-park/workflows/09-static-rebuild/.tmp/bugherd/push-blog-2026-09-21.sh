#!/usr/bin/env bash
# The blog's two CMS pages, 2026-09-21. THE SECOND HALF OF THE PUSH.
#
#   bash push-blog-2026-09-21.sh > push-blog-2026-09-21.log 2>&1
#
# WHY THIS EXISTS. /blog and /blog/<slug> are not in instatic/pages/. The 161
# articles are rows in the Articles table and two pages render them: `blog`
# (a base.loop listing) and `blog-article` (the entry template). to-instatic.mjs
# puts their HTML in instatic/pages-blog-cms/ and import-pages.mjs never looks
# there, so push-2026-09-21.sh changed 61 of the 63 live pages and left the
# blog's chrome on the OLD OPENING HOURS. verify-2026-09-21.mjs caught it on
# /blog; nothing in the main push would have.
#
# The order is the 2026-09-10 one. The two traps it is built around:
#   - fetch-nodes.mjs ALWAYS writes converted-pages.json, so the templates
#     cycle clobbers the pages' converted set. Copy it first, and never run
#     this before the pages cycle has finished with that file.
#   - apply-image-alt / apply-body-class default to the pages payload, so both
#     need --converted and --dir pointing at the templates.
set -u
cd "$(dirname "$0")/.."
unset RAILWAY_TOKEN
export INSTATIC_BASE_URL=https://staging.masonparkdental.com
export RAILWAY_ENV_NAME=staging

step() {
  echo "== $*  ($(date +%H:%M:%S))"
  "$@"
  local rc=$?
  echo "-- exit $rc"
  if [ $rc -ne 0 ]; then echo "== STOPPED at $2"; exit $rc; fi
}

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
