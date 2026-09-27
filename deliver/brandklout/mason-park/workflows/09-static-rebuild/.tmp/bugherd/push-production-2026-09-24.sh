#!/usr/bin/env bash
# The LAUNCH: the rebuilt site onto PRODUCTION (www.masonparkdental.com), 2026-09-24.
# Merge, not a cutover: the 63 rebuilt pages overwrite or add by slug, and the 31
# production pages the rebuild does not have (the six root ad pages the live ads
# land on, privacy/cookie policy, old URLs) are left in place. Nothing is deleted:
# import-pages, import-styles and import-scripts are incremental upserts, and the
# consent-bridge / consent-preferences / lp-faq scripts and mason-park-lp.css stay.
#
# Backups first (all 2026-09-24): API snapshot backup-www...2026-09-24T22-10-33.json
# (78 pages, 153 media, shell seq 37), DB copy on the volume
# /app/storage/backups/cms-2026-09-24-seq37-pre-launch.db, git tag
# mason-park-pre-launch-2026-09-24.
#
#   bash push-production-2026-09-24.sh > push-production-2026-09-24.log 2>&1
set -u
cd "$(dirname "$0")/.."
unset RAILWAY_TOKEN
export INSTATIC_BASE_URL=https://www.masonparkdental.com
export RAILWAY_ENV_NAME=production
export ALLOW_PRODUCTION=launch

step() {
  echo "== $*  ($(date +%H:%M:%S))"
  "$@"
  local rc=$?
  echo "-- exit $rc"
  if [ $rc -ne 0 ]; then echo "== STOPPED at $*"; exit $rc; fi
}

# The site's 63 pages: media first (ids are per instance), then the conversion.
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
step node import-fonts.mjs
step node import-styles.mjs

# The blog: the Articles table, its 161 rows, and the two template pages.
step node bugherd/articles-table.mjs --create-from bugherd/articles-table-staging.json
step node import-articles.mjs
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

# The Contact map's click-to-play iframe needs www.google.com as a frame origin.
step node bugherd/add-frame-origin.mjs https://www.google.com

# Scripts last, so their page scope covers every row; this publishes the site.
step node import-scripts.mjs --publish
step node publish-articles.mjs
echo "== END"
