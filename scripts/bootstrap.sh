#!/usr/bin/env bash
set -euo pipefail

# Bootstrap a freshly cloned repo on a new computer: install the git hooks and
# restore client media from Cloudflare R2. Run AFTER cloning. It does NOT install
# Python/Node, restore ~/.webzite/.env, or set up MCP auth — see INSTALL.md.
#
# Media restore uses `node scripts/assets.mjs pull <client>`, which downloads the
# files listed in deliver/brandklout/<client>/assets.tsv and verifies each sha256.
# It never deletes local files and never writes to R2.
#
# Must be run from inside the cloned repo (Git Bash on Windows, or any bash).
# Usage:
#   bash scripts/bootstrap.sh [--dry-run] [--client <slug>]... [--all] [--hooks-only]
#
#   --dry-run        Preview the restore; transfer nothing, install no hooks.
#   --client <slug>  Restore one client (repeatable), e.g. mason-park.
#   --all            Restore every client that has an assets.tsv manifest.
#   --hooks-only     Install the git hooks and stop.
#   (no client flag) Hooks only, then print the restore commands.
#
# Prerequisites: Node 18+, and R2_TOKEN (or CLOUDFLARETESTING) in ~/.webzite/.env [shared].

DRY_RUN=""
CLIENTS=()
ALL=false
HOOKS_ONLY=false

print_usage() {
  sed -n '14,19p' "$0" | sed 's/^# \{0,1\}//'
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)    DRY_RUN="--dry"; shift ;;
    --client)     CLIENTS+=("${2:-}"); shift 2 ;;
    --all)        ALL=true; shift ;;
    --hooks-only) HOOKS_ONLY=true; shift ;;
    -h|--help)    print_usage; exit 0 ;;
    *)
      echo "Unknown flag: $1" >&2
      print_usage >&2
      exit 1
      ;;
  esac
done

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$ROOT" ]]; then
  echo "ERROR: not inside a git repository. Clone the repo first, then run from its root." >&2
  exit 1
fi
cd "$ROOT"

# ── Git hooks ─────────────────────────────────────────────────────────────────
# core.hooksPath is set to an ABSOLUTE path on purpose. Worktrees share one
# config, but a relative hooksPath resolves against each worktree's own root, so
# a `bk-*` worktree on a branch predating scripts/hooks/ would silently run no
# hook at all. Pointing every worktree at the main checkout's tracked hooks dir
# means the post-commit asset mirror and the scope check fire everywhere.
if [[ -z "$DRY_RUN" ]]; then
  echo "--- Installing git hooks ---"
  git config core.hooksPath "$ROOT/scripts/hooks"
  echo "core.hooksPath -> $(git config --get core.hooksPath)"
  # Every merge into main makes a merge commit, so pre-merge-commit sees it: a client branch that has
  # just merged main would otherwise fast-forward main past the hook.
  git config branch.main.mergeoptions --no-ff
fi
[[ "$HOOKS_ONLY" == true ]] && exit 0

# ── Client media from R2 ──────────────────────────────────────────────────────
if [[ "$ALL" == true ]]; then
  for manifest in deliver/brandklout/*/assets.tsv; do
    [[ -f "$manifest" ]] && CLIENTS+=("$(basename "$(dirname "$manifest")")")
  done
fi

if [[ ${#CLIENTS[@]} -eq 0 ]]; then
  echo ""
  echo "No client selected. Restore media with:"
  echo "  bash scripts/bootstrap.sh --client <slug>    # one client"
  echo "  bash scripts/bootstrap.sh --all              # every client with an assets.tsv"
  exit 0
fi

for client in "${CLIENTS[@]}"; do
  echo ""
  echo "--- Restoring $client ${DRY_RUN:+(dry run)} ---"
  node scripts/assets.mjs pull "$client" ${DRY_RUN:+$DRY_RUN}
done

echo ""
echo "=== Bootstrap complete ${DRY_RUN:+(dry run — nothing transferred)} ==="
echo "Next steps: INSTALL.md (credentials in ~/.webzite/.env, then npm install; MCP auth)."
