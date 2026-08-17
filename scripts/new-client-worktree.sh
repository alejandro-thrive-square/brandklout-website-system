#!/usr/bin/env bash
set -euo pipefail

# Create a SPARSE worktree holding one client plus the shared process library,
# instead of the whole 2,438-file repo.
#
# A full worktree checks out every client's work: 2,438 files / 94 MB, of which
# a single client needs about a quarter. Sparse cone mode cuts that to ~635
# files / 20 MB while leaving commits completely intact — sparse-checkout only
# narrows the WORKING TREE. The index still holds every path, so a commit made
# here still contains all 461 giovanni-serrano files, all 445 farewell-agency
# files, and everything else. Verified, not assumed. Nothing is deleted by
# committing or merging from a sparse worktree.
#
# Cone mode also always materialises files at the repo root, so CLAUDE.md,
# AGENTS.md, SYSTEM_RULES.md and deliver/DELIVER_SYSTEM_RULES.md arrive without
# being listed — agents still get their directives.
#
# Usage:
#   bash scripts/new-client-worktree.sh <client-slug> [options]
#
#   <client-slug>      Prefix of a folder under deliver/<pillar>/, e.g. "mason-park".
#   --path <dir>       Where to create it. Default: the sibling Orca workspaces dir.
#   --branch <name>    Branch to create. Default: bk-<client-slug>.
#   --add <path>       Extra repo path to include in the cone. Repeatable.
#   --no-assets        Skip seeding heavy assets from main.
#   --dry-run          Print the plan and exit.

CLIENT=""
WT_PATH=""
BRANCH=""
EXTRA=()
SEED=true
DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --path)       WT_PATH="${2:?--path needs a directory}"; shift 2 ;;
    --branch)     BRANCH="${2:?--branch needs a name}"; shift 2 ;;
    --add)        EXTRA+=("${2:?--add needs a path}"); shift 2 ;;
    --no-assets)  SEED=false; shift ;;
    --dry-run)    DRY_RUN=true; shift ;;
    -h|--help)    sed -n '6,30p' "$0"; exit 0 ;;
    -*)           echo "new-client-worktree: unknown flag '$1'" >&2; exit 2 ;;
    *)            [[ -z "$CLIENT" ]] && CLIENT="$1" || { echo "new-client-worktree: unexpected arg '$1'" >&2; exit 2; }; shift ;;
  esac
done

[[ -n "$CLIENT" ]] || { echo "usage: bash scripts/new-client-worktree.sh <client-slug> [--path DIR] [--branch NAME] [--add PATH] [--no-assets] [--dry-run]" >&2; exit 2; }

MAIN="$(git worktree list --porcelain | awk '/^worktree /{print substr($0,10); exit}')"
cd "$MAIN"

# Resolve the client folder. A prefix is enough (mason-park, grand-mission).
mapfile -t MATCHES < <(ls -d deliver/*/"$CLIENT"*/ 2>/dev/null | sed 's|/$||')

if [[ ${#MATCHES[@]} -eq 0 ]]; then
  # A brand-new client has no folder yet — that is legitimate, the agent creates
  # it. Fall back to the pillar the other Brandklout clients live in.
  echo "new-client-worktree: no existing folder matches '$CLIENT' — treating it as a NEW client."
  CLIENT_DIR="deliver/brandklout/$CLIENT"
  PILLAR="deliver/brandklout"
elif [[ ${#MATCHES[@]} -gt 1 ]]; then
  echo "new-client-worktree: '$CLIENT' is ambiguous:" >&2
  printf '  %s\n' "${MATCHES[@]}" >&2
  exit 1
else
  CLIENT_DIR="${MATCHES[0]}"
  PILLAR="$(dirname "$CLIENT_DIR")"
fi

BRANCH="${BRANCH:-bk-$CLIENT}"
WT_PATH="${WT_PATH:-$(dirname "$MAIN")/../orca/workspaces/$(basename "$MAIN")/$BRANCH}"

# Shared surfaces every client build reads: the process library, the pillar's own
# docs and scripts, tooling, and MCP config.
CONE=(
  "deliver/process"
  "$PILLAR/docs"
  "$PILLAR/scripts"
  "$CLIENT_DIR"
  "scripts"
  "mcp-servers"
  ".claude"
)
[[ ${#EXTRA[@]} -gt 0 ]] && CONE+=("${EXTRA[@]}")

echo "=== new client worktree"
echo "  client dir : $CLIENT_DIR"
echo "  branch     : $BRANCH"
echo "  path       : $WT_PATH"
echo "  cone       : ${CONE[*]}"

if [[ "$DRY_RUN" == true ]]; then
  echo "=== dry run — nothing created."
  exit 0
fi

if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  echo "new-client-worktree: branch '$BRANCH' already exists — checking it out rather than creating." >&2
  git worktree add --no-checkout "$WT_PATH" "$BRANCH"
else
  git worktree add --no-checkout "$WT_PATH" -b "$BRANCH"
fi

cd "$WT_PATH"
git sparse-checkout init --cone
# A not-yet-existing client dir is fine here: cone entries need not resolve, and
# the folder materialises as soon as the agent creates it.
git sparse-checkout set "${CONE[@]}"
git checkout

# The post-checkout hook only seeds on a FIRST checkout (previous HEAD is the
# null SHA). The sparse flow checks out in a second step, so that hook does not
# fire and seeding has to be explicit here.
if [[ "$SEED" == true ]]; then
  echo ""
  echo "--- Seeding heavy assets for $CLIENT_DIR ---"
  bash "$MAIN/scripts/mirror-assets.sh" --to-worktree --scope "$CLIENT_DIR" || \
    echo "new-client-worktree: asset seeding failed — run mirror-assets.sh --to-worktree by hand."
fi

echo ""
echo "=== ready: $WT_PATH"
echo "  files on disk: $(find . -type f -not -path './.git/*' | wc -l)  (full checkout would be $(git ls-files | wc -l))"
echo "  add more paths later:  git sparse-checkout add <path>"
echo "  go full:               git sparse-checkout disable"
