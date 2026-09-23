#!/usr/bin/env bash
# Ships the converter and its input to the Railway container, runs it, and
# brings the result back.
#
# WHY CHUNKED. `railway ssh` takes the whole command on the command line and
# fails — silently, with a zero exit — somewhere past ~10 KB per invocation.
# convert-css.md found this the hard way. Everything crossing the boundary is
# therefore gzipped, base64'd and appended in 6 KB slices.
#
# Idempotent: it truncates the remote staging files before appending, so a
# re-run after a failure does not concatenate onto a half-written payload.
#
# Usage:  RAILWAY_LINK_DIR=<dir linked by project ID> bash <tools>/instatic-site/push/ship.sh
#         run from the client folder that holds .tmp/import-input.b64 (build-import-input.mjs)
#
# PROMOTED 2026-09-23. Origin: bk-west-la-implants/deliver/brandklout/west-la-implants/workflows/21-instatic-upload/ship.sh. conv-preload.ts / conv-encode.ts come from
# tools/instatic-api-sync (identical there); import-run.ts sits beside this file.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
TMP="$(pwd)/.tmp"   # run from the client folder; payload and output live in <cwd>/.tmp
mkdir -p "$TMP"
# No apostrophe in this message: inside ${VAR:?...} a single quote opens a
# quoted string and the closing brace is never seen, so the whole file fails to
# parse rather than the variable failing to expand.
LINK="${RAILWAY_LINK_DIR:?set RAILWAY_LINK_DIR to a directory linked to the Railway project for THIS site — check-link.mjs verifies which}"

# MSYS_NO_PATHCONV is set HERE and nowhere else.
#
# Git Bash rewrites any argument that looks like a POSIX path into a Windows one
# before a native .exe sees it, so `railway ssh "rm -f /app/x"` arrives on the
# container as `rm -f C:/Program Files/Git/app/x`. Setting the variable stops
# that — but setting it for the WHOLE script breaks everything else, because
# `$HERE` is `/c/Users/…` and `node "$HERE/check-link.mjs"` then hands node a
# path Windows cannot resolve (`C:\c\Users\…`, MODULE_NOT_FOUND). Scope it to
# the one call that crosses into the container.
# Retried, because `railway ssh` fails transiently ("Failed to fetch: error
# decoding response body") a few times in a hundred calls, and `set -e` then
# aborts a fifty-chunk ship at chunk twelve. Three attempts, a short pause;
# every call here is idempotent (truncate-then-append, or read-only).
rs() {
  local n
  for n in 1 2 3; do
    ( cd "$LINK" && MSYS_NO_PATHCONV=1 railway ssh "$@" ) && return 0
    echo "  railway ssh failed (attempt $n), retrying" >&2
    sleep 4
  done
  return 1
}

say() { printf '\n=== %s\n' "$1"; }

# --- 0. is the link dir this site? ---------------------------------------
# Everything below runs inside whatever container $LINK is linked to, and
# nothing else here checks which one that is. A link dir carried over from a
# sibling worktree ships THIS site's payload into THAT site's container and
# runs the importer there. check-link.mjs asserts the linked project and
# environment actually serve INSTATIC_BASE_URL; read its header for the rest.
say "verifying the link dir"
[ -f "$HERE/check-link.mjs" ] || { echo "check-link.mjs is missing — refusing to ship unverified" >&2; exit 1; }
node "$HERE/check-link.mjs" "$LINK"

# --- 1. the three TypeScript files --------------------------------------
# Small enough to go in one shot each, but still base64'd: the sources contain
# quotes, backticks and $ that would otherwise need shell-escaping per file.
say "shipping converter sources"
for f in conv-preload.ts conv-encode.ts import-run.ts; do
  src="$HERE/$f"
  [ -f "$src" ] || src="$HERE/../../instatic-api-sync/$f"
  b64=$(base64 -w0 < "$src")
  rs "rm -f /app/$f.b64" >/dev/null
  printf '%s' "$b64" | split -b 6000 - "$TMP/part-"
  for p in "$TMP"/part-*; do
    rs "printf '%s' '$(cat "$p")' >> /app/$f.b64" >/dev/null
  done
  rm -f "$TMP"/part-*
  rs "base64 -d /app/$f.b64 > /app/$f && rm /app/$f.b64 && wc -c < /app/$f"
done

# --- 2. the payload ------------------------------------------------------
say "shipping import-input.json.gz ($(wc -c < "$TMP/import-input.b64") b64 bytes)"
rs "rm -f /app/import-input.b64" >/dev/null
split -b 6000 "$TMP/import-input.b64" "$TMP/chunk-"
n=0
for p in "$TMP"/chunk-*; do
  n=$((n + 1))
  rs "printf '%s' '$(cat "$p")' >> /app/import-input.b64" >/dev/null
  printf '  chunk %d\r' "$n"
done
rm -f "$TMP"/chunk-*
echo
rs "base64 -d /app/import-input.b64 > /app/import-input.json.gz && rm /app/import-input.b64 && wc -c < /app/import-input.json.gz"

# --- 3. convert ----------------------------------------------------------
say "converting"
rs "cd /app && bun run /app/import-run.ts"

# --- 4. bring the result home -------------------------------------------
say "retrieving import-out.json"
rs "gzip -9 -c /app/import-out.json | base64 -w0" | tr -d '\r\n ' > "$TMP/import-out.b64"
base64 -d < "$TMP/import-out.b64" | gunzip > "$TMP/import-out.json"
wc -c < "$TMP/import-out.json"
