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
# Usage:  bash ship.sh          (from this directory, with the project linked)
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
TMP="$HERE/.tmp"
LINK="${RAILWAY_LINK_DIR:?set RAILWAY_LINK_DIR to a directory linked to the Stone project}"

rs() { ( cd "$LINK" && railway ssh "$@" ); }

say() { printf '\n=== %s\n' "$1"; }

# --- 1. the three TypeScript files --------------------------------------
# Small enough to go in one shot each, but still base64'd: the sources contain
# quotes, backticks and $ that would otherwise need shell-escaping per file.
say "shipping converter sources"
for f in conv-preload.ts conv-encode.ts import-run.ts; do
  src="$HERE/$f"
  [ -f "$src" ] || src="$HERE/../../../dr-nahlah/workflows/15-instatic-api-sync/$f"
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
