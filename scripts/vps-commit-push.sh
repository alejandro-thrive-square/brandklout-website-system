#!/usr/bin/env bash
set -euo pipefail

# Push git-tracked changes from the VPS back to GitHub.
# Run from the repo root on the VPS after an agent produces new artifacts.
# Usage: bash scripts/vps-commit-push.sh ["optional commit message"]
#
# Binary/media assets are gitignored and never pushed — sync those separately
# on local with: bash scripts/sync-assets.sh --direction pull

MSG="${1:-"chore: vps agent output [$(date -u +%Y-%m-%dT%H:%M:%SZ)]"}"

if git diff --quiet && git diff --cached --quiet && [[ -z "$(git ls-files --others --exclude-standard)" ]]; then
  echo "Nothing to commit — working tree is clean."
  exit 0
fi

git add -A
git commit -m "$MSG"
git push origin main

echo ""
echo "=== VPS push complete. Run 'git pull' on local to receive changes. ==="
