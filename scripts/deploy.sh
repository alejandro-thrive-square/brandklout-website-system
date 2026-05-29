#!/usr/bin/env bash
set -euo pipefail

# Deploy: commit + push tracked files, then sync binary/media assets via rclone.
# Must be run from the repo root.
# Usage: bash scripts/deploy.sh ["commit message"] [--direction push|pull|bisync] [--dry-run] [--resync] [--no-rclone]
#
#   "commit message"    Optional. Defaults to a timestamp message if omitted.
#   --direction         push (default) | pull | bisync — passed to sync-assets.sh
#   --dry-run           Preview rclone transfers without moving files
#   --resync            Force full resync for bisync mode (first run only)
#   --no-rclone         Skip rclone; git deploy only

COMMIT_MSG=""
DIRECTION="push"
DRY_RUN=""
RESYNC=""
NO_RCLONE=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --direction) DIRECTION="${2:-}"; shift 2 ;;
    --dry-run)   DRY_RUN="--dry-run"; shift ;;
    --resync)    RESYNC="--resync"; shift ;;
    --no-rclone) NO_RCLONE=true; shift ;;
    --*)
      echo "Unknown flag: $1" >&2
      echo "Usage: bash scripts/deploy.sh [\"message\"] [--direction push|pull|bisync] [--dry-run] [--resync] [--no-rclone]" >&2
      exit 1
      ;;
    *)
      if [[ -z "$COMMIT_MSG" ]]; then
        COMMIT_MSG="$1"
      fi
      shift
      ;;
  esac
done

# ── 1. Git: stage, commit, push ───────────────────────────────────────────────

echo ""
echo "=== [1/2] Git deploy ==="

if git diff --quiet && git diff --cached --quiet && [[ -z "$(git ls-files --others --exclude-standard)" ]]; then
  echo "Nothing to commit — working tree is clean. Skipping commit."
else
  MSG="${COMMIT_MSG:-"deploy: $(date -u +%Y-%m-%dT%H:%M:%SZ)"}"
  git add -A
  git commit -m "$MSG"
  echo "Committed: $MSG"
fi

git push origin main
echo "Pushed to origin/main — GitHub Actions will deploy to VPS."

# ── 2. Rclone: sync binary/media assets ──────────────────────────────────────

if [[ "$NO_RCLONE" == true ]]; then
  echo ""
  echo "=== Rclone skipped (--no-rclone) ==="
  exit 0
fi

echo ""
echo "=== [2/2] Asset sync (direction: $DIRECTION) ==="

bash scripts/sync-assets.sh \
  --direction "$DIRECTION" \
  ${DRY_RUN:+--dry-run} \
  ${RESYNC:+--resync}

echo ""
echo "=== Deploy complete ==="
