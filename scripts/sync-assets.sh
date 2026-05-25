#!/usr/bin/env bash
set -euo pipefail

# Sync heavy binary/media assets to the VPS via rclone.
# Must be run from the repo root.
# Usage: bash scripts/sync-assets.sh [--dry-run]

VPS_DEST="vps:/root/webzite-agentic-workflow"
DRY_RUN=""

if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN="--dry-run"
  echo "=== DRY RUN — no files will be transferred ==="
fi

echo ""
echo "--- Syncing brand assets ---"
rclone sync ./manage/brand-assets/ "$VPS_DEST/manage/brand-assets/" \
  $DRY_RUN --progress

echo ""
echo "--- Syncing heavy media from .tmp/ folders ---"
rclone sync . "$VPS_DEST/" \
  --filter "+ **/" \
  --filter "+ **/.tmp/**/*.png" --filter "+ **/.tmp/**/*.jpg" --filter "+ **/.tmp/**/*.jpeg" \
  --filter "+ **/.tmp/**/*.gif" --filter "+ **/.tmp/**/*.svg" --filter "+ **/.tmp/**/*.webp" --filter "+ **/.tmp/**/*.ico" \
  --filter "+ **/.tmp/**/*.pdf" --filter "+ **/.tmp/**/*.mp4" --filter "+ **/.tmp/**/*.mov" \
  --filter "+ **/.tmp/**/*.zip" --filter "+ **/.tmp/**/*.7z" --filter "+ **/.tmp/**/*.psd" --filter "+ **/.tmp/**/*.ai" --filter "+ **/.tmp/**/*.eps" \
  --filter "+ **/.tmp/**/*.fig" --filter "+ **/.tmp/**/*.sketch" \
  --filter "- *" \
  $DRY_RUN --progress

echo ""
echo "=== Asset sync complete ==="
