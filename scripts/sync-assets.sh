#!/usr/bin/env bash
set -euo pipefail

# Sync heavy binary/media assets between local and VPS via rclone.
# Must be run from the repo root.
# Usage: bash scripts/sync-assets.sh [--direction push|pull|bisync] [--dry-run] [--resync]
#
#   --direction push    (default) local → VPS
#   --direction pull    VPS → local  (use after VPS agent generates new assets)
#   --direction bisync  bidirectional merge (pass --resync on the very first run)
#   --dry-run           preview transfers without moving files
#   --resync            force full resync for bisync mode (required on first run only)

VPS_ROOT="vps:/root/webzite-agentic-workflow"
DIRECTION="push"
DRY_RUN=""
RESYNC=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --direction) DIRECTION="${2:-}"; shift 2 ;;
    --dry-run)   DRY_RUN="--dry-run"; shift ;;
    --resync)    RESYNC="--resync"; shift ;;
    *) echo "Unknown flag: $1. Use --direction push|pull|bisync, --dry-run, --resync." >&2; exit 1 ;;
  esac
done

if [[ -n "$DRY_RUN" ]]; then
  echo "=== DRY RUN — no files will be transferred ==="
fi

case "$DIRECTION" in
  push)
    BRAND_SRC="./manage/brand-assets/"
    BRAND_DST="$VPS_ROOT/manage/brand-assets/"
    MEDIA_SRC="."
    MEDIA_DST="$VPS_ROOT"
    ;;
  pull)
    BRAND_SRC="$VPS_ROOT/manage/brand-assets/"
    BRAND_DST="./manage/brand-assets/"
    MEDIA_SRC="$VPS_ROOT"
    MEDIA_DST="."
    ;;
  bisync) ;;
  *)
    echo "Unknown direction: '$DIRECTION'. Use push, pull, or bisync." >&2
    exit 1
    ;;
esac

MEDIA_FILTERS=(
  --filter "+ **/"
  --filter "+ **/.tmp/**/*.png"    --filter "+ **/.tmp/**/*.jpg"     --filter "+ **/.tmp/**/*.jpeg"
  --filter "+ **/.tmp/**/*.gif"    --filter "+ **/.tmp/**/*.svg"     --filter "+ **/.tmp/**/*.webp"   --filter "+ **/.tmp/**/*.ico"
  --filter "+ **/.tmp/**/*.pdf"    --filter "+ **/.tmp/**/*.mp4"     --filter "+ **/.tmp/**/*.mov"
  --filter "+ **/.tmp/**/*.zip"    --filter "+ **/.tmp/**/*.7z"      --filter "+ **/.tmp/**/*.psd"
  --filter "+ **/.tmp/**/*.ai"     --filter "+ **/.tmp/**/*.eps"     --filter "+ **/.tmp/**/*.fig"    --filter "+ **/.tmp/**/*.sketch"
  # Step deliverables. A scenario step stores what it produces in its `output/`
  # folder, OUTSIDE .tmp/, because that is the thing a client or reviewer opens.
  # Its imagery is still binary media that git refuses, so without these lines it
  # exists on one machine only. (First hit 2026-09-01 on Mason Park's frozen static
  # rebuild, whose images sat in a plainly named folder the .tmp/ filters never saw.)
  --filter "+ **/output/**/*.png"  --filter "+ **/output/**/*.jpg"   --filter "+ **/output/**/*.jpeg"
  --filter "+ **/output/**/*.gif"  --filter "+ **/output/**/*.svg"   --filter "+ **/output/**/*.webp" --filter "+ **/output/**/*.ico"
  --filter "+ **/output/**/*.avif" --filter "+ **/output/**/*.pdf"   --filter "+ **/output/**/*.mp4"  --filter "+ **/output/**/*.mov"
  --filter "- *"
)

if [[ "$DIRECTION" == "bisync" ]]; then
  echo ""
  echo "--- Bisyncing brand assets ---"
  rclone bisync "./manage/brand-assets/" "$VPS_ROOT/manage/brand-assets/" \
    ${RESYNC:+--resync} ${DRY_RUN:+--dry-run} --progress

  echo ""
  echo "--- Bisyncing heavy media from .tmp/ folders ---"
  rclone bisync "." "$VPS_ROOT" \
    "${MEDIA_FILTERS[@]}" \
    ${RESYNC:+--resync} ${DRY_RUN:+--dry-run} --progress
else
  echo ""
  echo "--- Syncing brand assets ($DIRECTION) ---"
  rclone sync "$BRAND_SRC" "$BRAND_DST" ${DRY_RUN:+--dry-run} --progress

  echo ""
  echo "--- Syncing heavy media from .tmp/ folders ($DIRECTION) ---"
  rclone sync "$MEDIA_SRC" "$MEDIA_DST" \
    "${MEDIA_FILTERS[@]}" \
    ${DRY_RUN:+--dry-run} --progress
fi

echo ""
echo "=== Asset sync complete (direction: $DIRECTION) ==="
