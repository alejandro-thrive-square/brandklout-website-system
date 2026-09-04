#!/usr/bin/env bash
set -uo pipefail

# Narrow the CURRENT worktree to one client plus the shared context, so a
# worktree stops showing every other client's folder.
#
# `scripts/new-client-worktree.sh` already creates worktrees this way, but
# worktrees made from the Orca app (or a plain `git worktree add`) land as full
# checkouts: all 13 Brandklout clients in every workspace, which is the
# duplication that makes it hard to tell which client you are actually in.
# This script fixes a worktree after the fact, and is safe to re-run.
#
# WHAT IT DOES NOT DO: sparse-checkout narrows the WORKING TREE only. The index
# still holds every path, so a commit made here still contains every other
# client's files untouched. Nothing is deleted from git, and merging out of a
# sparse worktree loses nothing. See SYSTEM_RULES.md 4.2.0.
#
# Usage:
#   bash scripts/sparsify-worktree.sh [options]
#
#   --client <slug>  Client folder (or prefix) to keep. Default: derived from
#                    the branch name, bk-<slug>.
#   --add <path>     Extra repo path to keep. Repeatable.
#   --force          Sparsify even with uncommitted tracked changes, or when
#                    the worktree is already sparse.
#   --undo           Restore the full checkout (git sparse-checkout disable).
#   --dry-run        Print the plan and exit.
#
# Undo at any time:  bash scripts/sparsify-worktree.sh --undo

CLIENT=""
EXTRA=()
FORCE=false
UNDO=false
DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --client)  CLIENT="${2:?--client needs a slug}"; shift 2 ;;
    --add)     EXTRA+=("${2:?--add needs a path}"); shift 2 ;;
    --force)   FORCE=true; shift ;;
    --undo)    UNDO=true; shift ;;
    --dry-run) DRY_RUN=true; shift ;;
    -h|--help) sed -n '5,30p' "$0"; exit 0 ;;
    *)         echo "sparsify-worktree: unknown argument '$1'" >&2; exit 2 ;;
  esac
done

HERE="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "sparsify-worktree: not inside a git repository." >&2; exit 1; }
MAIN="$(git worktree list --porcelain | awk '/^worktree /{print substr($0,10); exit}')"

# The main worktree is the source every other worktree seeds from, and the one
# place the whole repo is meant to be visible. Never narrow it.
if [[ "$(cd "$HERE" && pwd -P)" == "$(cd "$MAIN" && pwd -P)" ]]; then
  echo "sparsify-worktree: this is the MAIN worktree — left full on purpose."
  exit 0
fi

cd "$HERE"

if [[ "$UNDO" == true ]]; then
  git sparse-checkout disable
  echo "sparsify-worktree: full checkout restored ($(git ls-files | wc -l) tracked files)."
  exit 0
fi

if [[ "$(git config core.sparseCheckout || true)" == "true" && "$FORCE" != true ]]; then
  echo "sparsify-worktree: already sparse — leaving it alone. Current cone:"
  git sparse-checkout list | sed 's/^/  /'
  echo "  re-scope with --force, widen with 'git sparse-checkout add <path>', undo with --undo"
  exit 0
fi

# Modified tracked files outside the new cone would have to be discarded to
# narrow the tree, and git refuses. Bail before touching anything.
if [[ -n "$(git status --porcelain --untracked-files=no)" && "$FORCE" != true ]]; then
  echo "sparsify-worktree: uncommitted tracked changes here — commit or stash first," >&2
  echo "  or re-run with --force if you are sure they are inside the client you keep." >&2
  git status --short --untracked-files=no | sed 's/^/  /' >&2
  exit 1
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null)"

# Resolve the client folder under deliver/<pillar>/. Same derivation the
# post-checkout asset hook uses: strip the bk- prefix, then prefix-match on
# progressively shorter slugs, longest first. Orca branch names carry suffixes
# (bk-mason-park-2, bk-mason-park-fix) that a full-slug match alone would miss,
# and trimming longest-first stops bk-grand-mission being stolen by a sibling.
# Orca prefixes the branch it creates with the git username
# (alejandro-thrive-square/bk-livewell), so take the last path segment, and fall
# back to the worktree directory name, which is exactly what was typed in Orca.
SEEDS=()
if [[ -n "$CLIENT" ]]; then
  SEEDS=("$CLIENT")
else
  SEEDS=("$(basename "$HERE")" "${BRANCH##*/}")
fi

MATCHES=()
CANDIDATE=""
for seed in "${SEEDS[@]}"; do
  CANDIDATE="${seed#bk-}"
  while [[ -n "$CANDIDATE" ]]; do
    while IFS= read -r d; do
      MATCHES+=("${d%/}")
    done < <(cd "$MAIN" && ls -d deliver/*/"$CANDIDATE"*/ 2>/dev/null)
    [[ ${#MATCHES[@]} -gt 0 ]] && break
    [[ "$CANDIDATE" == *-* ]] || break
    CANDIDATE="${CANDIDATE%-*}"
  done
  [[ ${#MATCHES[@]} -gt 0 ]] && break
done

if [[ ${#MATCHES[@]} -gt 1 ]]; then
  echo "sparsify-worktree: '$CANDIDATE' is ambiguous:" >&2
  printf '  %s\n' "${MATCHES[@]}" >&2
  echo "  pick one with --client <slug>" >&2
  exit 1
fi

# The shared surfaces every build reads. Cone mode always materialises files at
# the repo ROOT, so CLAUDE.md, AGENTS.md and SYSTEM_RULES.md arrive unlisted.
PILLAR="deliver/brandklout"
CLIENT_DIR=""
if [[ ${#MATCHES[@]} -eq 1 ]]; then
  CLIENT_DIR="${MATCHES[0]}"
  PILLAR="$(dirname "$CLIENT_DIR")"
fi

CONE=(
  "deliver/process"
  "$PILLAR/docs"
  "$PILLAR/scripts"
  "scripts"
  "mcp-servers"
  ".claude"
)
[[ -n "$CLIENT_DIR" ]] && CONE+=("$CLIENT_DIR")
[[ ${#EXTRA[@]} -gt 0 ]] && CONE+=("${EXTRA[@]}")

echo "=== sparsify worktree"
echo "  worktree : $HERE"
echo "  branch   : $BRANCH"
echo "  client   : ${CLIENT_DIR:-<none derived from '$(basename "$HERE")'>}"
echo "  cone     : ${CONE[*]}"

if [[ "$DRY_RUN" == true ]]; then
  echo "=== dry run — nothing changed."
  exit 0
fi

# `set --cone` initialises and scopes in ONE step. Splitting it into
# `init --cone` + `set` makes git pass through a root-only cone first: it strips
# the whole tree, warns that every directory holding untracked files "is not in
# the sparse-checkout cone" (including ones the real cone keeps), then puts it
# all back. Alarming, and slow on a worktree the size of dr-nahlah.
git sparse-checkout set --cone "${CONE[@]}"

echo ""
if [[ -z "$CLIENT_DIR" ]]; then
  echo "No client folder matched '$(basename "$HERE")' or '$BRANCH' — kept the shared context only."
  echo "Add the one you want (nothing was lost — the index still holds them all):"
  (cd "$MAIN" && ls -d deliver/*/*/ 2>/dev/null | sed 's|/$||' | sed 's/^/  git sparse-checkout add /')
fi

# Sparse-checkout only removes TRACKED files. Heavy assets seeded by
# mirror-assets.sh are git-ignored, so other clients can survive as
# asset-only leftovers. Report them; deleting is the user's call.
LEFTOVERS=()
while IFS= read -r d; do
  d="${d%/}"
  keep=false
  for c in "${CONE[@]}"; do
    # Inside a cone entry, or an ancestor of one, means it belongs here.
    [[ "$d" == "$c" || "$d" == "$c"/* || "$c" == "$d"/* ]] && { keep=true; break; }
  done
  [[ "$keep" == true ]] && continue
  LEFTOVERS+=("$d")
done < <(ls -d deliver/*/*/ 2>/dev/null)

if [[ ${#LEFTOVERS[@]} -gt 0 ]]; then
  echo ""
  echo "Still on disk as git-ignored leftovers (mirrored assets, .tmp artifacts):"
  printf '  %s\n' "${LEFTOVERS[@]}"
  echo "These are not tracked here, so removing them loses nothing that main does not hold:"
  echo "  rm -rf ${LEFTOVERS[*]}"
fi

echo ""
echo "=== done: $(find . -type f -not -path './.git/*' -not -path './node_modules/*' | wc -l) files on disk (full checkout is $(git ls-files | wc -l) tracked)."
echo "  widen: git sparse-checkout add <path>   undo: bash scripts/sparsify-worktree.sh --undo"
