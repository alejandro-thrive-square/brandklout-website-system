#!/usr/bin/env bash
set -euo pipefail

# Push git-tracked changes from the VPS back to GitHub.
# Run from the repo root on the VPS after an agent produces new artifacts.
# Usage: bash scripts/vps-commit-push.sh ["optional commit message"]
#
# Binary/media assets are gitignored and never pushed — they are backed up to R2
# with: node scripts/assets.mjs push (see DELIVER_SYSTEM_RULES.md §2)

MSG="${1:-"chore: vps agent output [$(date -u +%Y-%m-%dT%H:%M:%SZ)]"}"

if git diff --quiet && git diff --cached --quiet && [[ -z "$(git ls-files --others --exclude-standard)" ]]; then
  echo "Nothing to commit — working tree is clean."
  exit 0
fi

git add -A
git commit -m "$MSG"

# Pull-before-push: integrate any work pushed from local (via scripts/sync.sh)
# before pushing, so this push never gets rejected or clobbers remote history.
git fetch origin main
if ! git merge --ff-only origin/main; then
  echo "" >&2
  echo "ERROR: local and VPS histories diverged — cannot fast-forward." >&2
  echo "Both sides committed since they last agreed. Reconcile here with git" >&2
  echo "(e.g. 'git rebase origin/main'), resolve any conflicts, then re-run this script." >&2
  echo "Nothing was pushed." >&2
  exit 1
fi

git push origin main

echo ""
echo "=== VPS push complete. On local, run 'bash scripts/sync.sh' to receive changes (git + assets). ==="
