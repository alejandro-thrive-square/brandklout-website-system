#!/usr/bin/env bash
# Client script, 2026-09-30. The whole push to STAGING, in the order tools/instatic-site/README.md
# gives, with the two workarounds this toolkit copy needs (see preload-paths.mjs and
# empty-embed-markers.mjs). Full replace: right while the site is one page and nobody edits it in
# the browser. Once someone does, switch to `push-site.mjs --update`.
#
# Usage (from the step folder, scenario-0-new-site/03-design-build):
#   RAILWAY_LINK_DIR=<dir linked to the project's STAGING environment> bash output/code/push-staging.sh > output/push.log 2>&1
# One chain at a time: they share /app on the container.
set -euo pipefail

export INSTATIC_BASE_URL="https://hackensack-dental-implants-staging.up.railway.app"
export STAGING_HOST="hackensack-dental-implants-staging.up.railway.app"
export EXPECT_FONT_FACES=2
: "${RAILWAY_LINK_DIR:?set RAILWAY_LINK_DIR to a directory linked to the staging environment}"
T=../../tools/instatic-site
PRE="--import ./output/code/preload-paths.mjs"

say() { printf '\n##### %s\n' "$1"; }

say "build";            ( cd output/code/site-src && node build.mjs )
say "upload media";     node $PRE $T/push/upload-media.mjs | tail -2
say "alt text";         node $PRE $T/push/set-alt.mjs --apply | tail -1
say "import payload";   node $T/push/build-import-input.mjs | tail -3
say "empty markers";    node output/code/empty-embed-markers.mjs
say "ship and convert"; bash $T/push/ship.sh | grep -v 'chunk' | tail -12
say "write the site";   node $T/push/push-site.mjs --apply --force | tail -8
say "breakpoints";      node output/code/set-breakpoints.mjs --apply | tail -1
say "place embeds";     node $T/push/place-embeds.mjs --apply | tail -3
say "seo settings";     node output/code/configure-seo.mjs --apply | tail -2
say "publish";          node ../../tools/instatic-api-sync/insta-api.mjs publish | tail -3
say "record";           node $T/push/push-site.mjs --record | tail -1
say "done: $INSTATIC_BASE_URL/"
