#!/usr/bin/env bash
# Client script, 2026-09-30, rewritten 2026-10-09 for the complete site. The whole push to STAGING, in
# the order tools/instatic-site/README.md gives, with this toolkit copy's workarounds (each one is a
# fix that belongs on main; see the step runbook):
#   preload-paths.mjs        upload-media / set-alt use P without importing lib/paths.mjs
#   empty-embed-markers.mjs  build-import-input does not empty data-embed markers
#   embed-nodes.mjs          place-embeds.mjs skips nested slugs and takes one page per key; this puts
#                            the Embed blocks into the converted payload, so push-site writes them
#   framework.mjs apply      the Framework owns the tokens; re-applied after every full replace
# Full replace: staging carries only what site-src builds, and nobody edits it in the browser yet
# (check publishStatus first: draftMatchesPublished must be true). Once someone does, switch to
# `push-site.mjs --update`.
#
# Usage (from the step folder, scenario-0-new-site/03-design-build):
#   RAILWAY_LINK_DIR=<dir linked to the project's STAGING environment> bash output/code/push-staging.sh > output/push.log 2>&1
# One chain at a time: they share /app on the container. No pipes: Node 24 on Windows dies with a
# libuv assertion when its output is piped, so every step writes straight to the log.
set -euo pipefail

export INSTATIC_BASE_URL="https://hackensack-dental-implants-staging.up.railway.app"
export STAGING_HOST="hackensack-dental-implants-staging.up.railway.app"
export EXPECT_FONT_FACES=2
: "${RAILWAY_LINK_DIR:?set RAILWAY_LINK_DIR to a directory linked to the staging environment}"
T=../../tools/instatic-site
A=../../tools/instatic-api-sync
PRE="--import ./output/code/preload-paths.mjs"
FILMS="${FILMS:-}"

say() { printf '\n##### %s\n' "$1"; }

say "backup";           node $T/ops/backup-site.mjs --out output/backups/pre-site-stg
say "build";            ( cd output/code/site-src && node build.mjs )
say "upload media";     node $PRE $T/push/upload-media.mjs
say "alt text";         node $PRE $T/push/set-alt.mjs --apply
say "import payload";   node $T/push/build-import-input.mjs
say "empty markers";    node output/code/empty-embed-markers.mjs
say "ship and convert"; bash $T/push/ship.sh
say "embed blocks";     node output/code/embed-nodes.mjs
say "write the site";   node $T/push/push-site.mjs --apply --force
say "breakpoints";      node output/code/set-breakpoints.mjs --apply
say "404 template";     node $T/ops/apply-template-flags.mjs --page 404 --not-found
say "template guard";   node $T/gates/template-guard.mjs
say "seo settings";     node output/code/configure-seo.mjs --apply
# the import re-adds the :root tokens to the registry, where they shadow the Framework; the spec's
# registry.remove list takes them out again (refuses to save while any is left)
say "framework";        node $A/framework.mjs apply output/framework-spec.json --apply
say "publish";          node $A/insta-api.mjs publish
say "record";           node $T/push/push-site.mjs --record
say "done: $INSTATIC_BASE_URL/"
