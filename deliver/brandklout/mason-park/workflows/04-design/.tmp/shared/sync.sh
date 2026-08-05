#!/usr/bin/env bash
# Copy the shared design system into each page package so every page folder is
# self-contained and openable on its own, while `shared/` stays the single
# source of truth.
#
# Usage: bash shared/sync.sh   (run from 04-design/.tmp/)
# Source Asana task GID: 1217040406855582
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root="$(dirname "$here")"

if [ ! -d "$here/img" ]; then
  echo "shared/img/ is missing — run: node shared/fetch-assets.mjs" >&2
  exit 1
fi

for page in invisalign new-patient-special thank-you; do
  mkdir -p "$root/$page/assets/img"
  cp "$here/mpd.css" "$root/$page/assets/mpd.css"
  cp "$here/mpd.js"  "$root/$page/assets/mpd.js"
  cp "$here"/img/*   "$root/$page/assets/img/"
  echo "synced -> $page/assets/"
done
