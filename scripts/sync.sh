#!/usr/bin/env bash
set -euo pipefail

# One-command, both-ways git sync between this local workspace and the VPS.
#
# Safe by design: integrates remote work BEFORE pushing local work; never auto-clobbers.
# Media is not synced here — it is backed up to R2 with scripts/assets.mjs.
#
# Usage:
#   bash scripts/sync.sh ["commit message"] [--dry-run]
#                        [--on-divergence rebase|merge|abort] [--no-push]
#
#   "commit message"      Optional. Defaults to a timestamp message.
#   --dry-run             Preview everything. No mutation.
#   --on-divergence       What to do when both sides committed (default: abort).
#                           abort  — stop and print recovery instructions.
#                           rebase — replay local commits on top of remote.
#                           merge  — create a merge commit preserving both.
#   --no-push             Pull/reconcile, but do not push local commits.
#
# Companion: on the VPS, push git-tracked changes with scripts/vps-commit-push.sh.
# See HERMES.md and SYSTEM_RULES.md §4.5 for the workspace authority/conflict policy.

COMMIT_MSG=""
DRY_RUN=""
ON_DIVERGENCE="abort"
NO_PUSH=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)       DRY_RUN="--dry-run"; shift ;;
    --no-push)       NO_PUSH=true; shift ;;
    --on-divergence)
      ON_DIVERGENCE="${2:-}"; shift 2
      case "$ON_DIVERGENCE" in
        rebase|merge|abort) ;;
        *) echo "ERROR: --on-divergence must be rebase|merge|abort (got '$ON_DIVERGENCE')." >&2; exit 1 ;;
      esac
      ;;
    --*)
      echo "Unknown flag: $1" >&2
      echo "Usage: bash scripts/sync.sh [\"message\"] [--dry-run] [--on-divergence rebase|merge|abort] [--no-push]" >&2
      exit 1
      ;;
    *)
      if [[ -z "$COMMIT_MSG" ]]; then COMMIT_MSG="$1"; fi
      shift
      ;;
  esac
done

# ── 0. Preconditions ──────────────────────────────────────────────────────────
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

BRANCH="$(git branch --show-current)"
if [[ -z "$BRANCH" ]]; then
  echo "ERROR: detached HEAD — check out a branch before syncing." >&2
  exit 1
fi

echo "=== Sync — branch '$BRANCH' ${DRY_RUN:+(dry run)} ==="

# ── 1. Fetch + classify git state ─────────────────────────────────────────────
echo ""
echo "--- [1/4] Fetching origin/$BRANCH ---"
# Non-fatal: a brand-new local branch has no remote ref yet, and fetch can fail
# offline. Either way we fall through to the "no-remote-branch" classification.
if ! git fetch origin "$BRANCH" 2>/dev/null; then
  echo "Could not fetch origin/$BRANCH (not pushed yet, or offline) — continuing."
fi

LOCAL="$(git rev-parse HEAD)"
STATE=""
if git rev-parse --verify --quiet "origin/$BRANCH" >/dev/null; then
  REMOTE="$(git rev-parse "origin/$BRANCH")"
  BASE="$(git merge-base HEAD "origin/$BRANCH")"
  if   [[ "$LOCAL" == "$REMOTE" ]]; then STATE="up-to-date"
  elif [[ "$REMOTE" == "$BASE"  ]]; then STATE="ahead"
  elif [[ "$LOCAL"  == "$BASE"  ]]; then STATE="behind"
  else                                   STATE="diverged"
  fi
else
  STATE="no-remote-branch"   # branch not pushed yet
fi
echo "Git state: $STATE"

# ── 2. Commit local work (clean-tree idiom shared with vps-commit-push.sh) ─────
echo ""
echo "--- [2/4] Local changes ---"
if git diff --quiet && git diff --cached --quiet && [[ -z "$(git ls-files --others --exclude-standard)" ]]; then
  echo "Working tree clean — nothing to commit."
else
  COUNT="$(git status --porcelain | wc -l | tr -d ' ')"
  if [[ -n "$DRY_RUN" ]]; then
    echo "Would commit $COUNT changed path(s):"
    git status --short
  else
    MSG="${COMMIT_MSG:-"sync: $(date -u +%Y-%m-%dT%H:%M:%SZ)"}"
    git add -A
    git commit -m "$MSG"
    echo "Committed: $MSG"
    LOCAL="$(git rev-parse HEAD)"   # refresh after commit
  fi
fi

# ── 3. Integrate remote, then push ─────────────────────────────────────────────
echo ""
echo "--- [3/4] Reconcile with origin/$BRANCH ---"
case "$STATE" in
  up-to-date)
    echo "Already up to date with remote."
    ;;
  ahead|no-remote-branch)
    echo "Local is ahead — nothing to integrate."
    ;;
  behind)
    if [[ -n "$DRY_RUN" ]]; then
      echo "Would fast-forward to origin/$BRANCH:"
      git --no-pager log --oneline "HEAD..origin/$BRANCH"
    else
      git merge --ff-only "origin/$BRANCH"
      echo "Fast-forwarded to origin/$BRANCH."
    fi
    ;;
  diverged)
    echo "DIVERGED — both sides have commits since they last agreed."
    echo ""
    echo "  Local-only commits:"
    git --no-pager log --oneline "origin/$BRANCH..HEAD" | sed 's/^/    /'
    echo "  Remote-only commits:"
    git --no-pager log --oneline "HEAD..origin/$BRANCH" | sed 's/^/    /'
    echo ""
    case "$ON_DIVERGENCE" in
      abort)
        echo "Stopping (--on-divergence abort). Nothing was pushed or synced."
        echo "Re-run with one of:"
        echo "  bash scripts/sync.sh --on-divergence rebase   # replay your commits on top of remote (usual choice)"
        echo "  bash scripts/sync.sh --on-divergence merge    # keep both with a merge commit"
        exit 1
        ;;
      rebase)
        if [[ -n "$DRY_RUN" ]]; then
          echo "Would rebase local commits onto origin/$BRANCH."
        else
          if ! git rebase "origin/$BRANCH"; then
            git rebase --abort
            echo "ERROR: rebase hit conflicts and was aborted — tree left untouched." >&2
            echo "Resolve manually, then re-run scripts/sync.sh." >&2
            exit 1
          fi
          echo "Rebased onto origin/$BRANCH."
        fi
        ;;
      merge)
        if [[ -n "$DRY_RUN" ]]; then
          echo "Would merge origin/$BRANCH into local."
        else
          if ! git merge --no-edit "origin/$BRANCH"; then
            echo "ERROR: merge conflicts — resolve them, commit, then re-run scripts/sync.sh." >&2
            echo "       Nothing was pushed or synced." >&2
            exit 1
          fi
          echo "Merged origin/$BRANCH."
        fi
        ;;
    esac
    ;;
esac

# Push (local is now a fast-forward over origin/$BRANCH, so the VPS pull stays --ff-only safe)
if [[ "$NO_PUSH" == true ]]; then
  echo "Skipping push (--no-push)."
elif [[ -n "$DRY_RUN" ]]; then
  echo "Would push to origin/$BRANCH."
else
  if git push origin "$BRANCH"; then
    if [[ "$BRANCH" == "main" ]]; then
      echo "Pushed origin/main — GitHub Actions will deploy to the VPS (git pull --ff-only)."
    else
      echo "Pushed origin/$BRANCH. (Auto-deploy to the VPS only fires on 'main'.)"
    fi
  else
    echo "ERROR: push rejected — the VPS likely pushed concurrently." >&2
    echo "Re-run: bash scripts/sync.sh" >&2
    exit 1
  fi
fi

# ── 4. Assets ──────────────────────────────────────────────────────────────────
# Media is not synced here. It is gitignored and backed up to Cloudflare R2:
#   node scripts/assets.mjs push            (after a task that made media)
#   node scripts/assets.mjs pull <client>   (restore a client on this machine)
echo ""
echo "--- [4/4] Assets ---"
echo "Not synced by this script. Back media up with: node scripts/assets.mjs push"

# ── Summary ────────────────────────────────────────────────────────────────────
echo ""
echo "=== Sync complete ${DRY_RUN:+(dry run — no changes made)} ==="
git --no-pager status -sb
