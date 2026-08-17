#!/usr/bin/env bash
set -euo pipefail

# Mirror git-ignored heavy assets from a client worktree into the main worktree.
#
# Why this exists
# ---------------
# Heavy media is excluded from git on purpose (.gitignore §"Heavy binary/media
# assets"), and that exclusion is load-bearing in three places: it keeps merges
# clean, it keeps the VPS `git pull` lean, and it keeps the deploy's clean-tree
# gate passing (`test -z "$(git status --porcelain)"` in deploy-vps.yml — ignored
# files do not show there, tracked ones would).
#
# The cost of that design is that `git merge bk-<client>` brings the markup into
# main but not the images it references, so a design opened from main renders
# with broken assets. All worktrees live on ONE machine and share one .git, so
# closing that gap is a local file copy — no rclone, no VPS round trip.
#
# This is deliberately NOT the rclone path. scripts/sync-assets.sh moves media
# between local and the VPS; this moves media between worktrees on this machine.
#
# Safety
# ------
# Additive only. Files are copied when missing or newer at the source; nothing in
# the destination is ever deleted. An asset deleted in a worktree therefore
# lingers in main — see --prune-dry-run to list those rather than act on them.
#
# Usage:
#   bash scripts/mirror-assets.sh [--scope <path>]... [--all] [--dry-run]
#                                 [--to-worktree] [--quiet] [--prune-dry-run]
#
#   --scope <path>    Limit to this repo-relative path. Repeatable. When omitted
#                     and --all is not given, scopes are derived from the paths
#                     touched by HEAD (see derive_scopes_from_head).
#   --all             Sweep every ignored asset in the worktree. Slow; use after
#                     a bulk import or when a scope was missed.
#   --dry-run         List what would be copied. No mutation.
#   --to-worktree     Reverse direction: main -> this worktree. For picking up
#                     assets another client's merge left in main.
#   --quiet           Only print on error or when files actually moved. The
#                     post-commit hook uses this so ordinary commits stay silent.
#   --prune-dry-run   List destination files whose source is gone. Never deletes.

ASSET_EXT_RE='\.(png|jpe?g|gif|webp|svg|ico|pdf|mp4|mov|zip|7z|psd|ai|eps|fig|sketch|woff2?|ttf|otf)$'

# Vendored libraries are ignored too and are not media, so the extension list
# alone misses them. Designs load GSAP from ../_vendor/gsap/*.min.js — mirroring
# the images but not these produces a page that renders and does not move, which
# is a worse failure than a visibly broken image because it looks fine in a
# screenshot. Path-anchored so node_modules and build output cannot match.
VENDOR_PATH_RE='(^|/)(_vendor|vendor)/'

SCOPES=()
ALL=false
DRY_RUN=false
REVERSE=false
QUIET=false
PRUNE_DRY=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --scope)         SCOPES+=("${2:?--scope needs a path}"); shift 2 ;;
    --all)           ALL=true; shift ;;
    --dry-run)       DRY_RUN=true; shift ;;
    --to-worktree)   REVERSE=true; shift ;;
    --quiet)         QUIET=true; shift ;;
    --prune-dry-run) PRUNE_DRY=true; shift ;;
    *) echo "mirror-assets: unknown flag '$1'" >&2; exit 2 ;;
  esac
done

say() { [[ "$QUIET" == true ]] || echo "$@"; }

HERE="$(git rev-parse --show-toplevel)"
# The main worktree is always the first row of `git worktree list`.
MAIN="$(git worktree list --porcelain | awk '/^worktree /{print substr($0,10); exit}')"

if [[ -z "$MAIN" || ! -d "$MAIN" ]]; then
  echo "mirror-assets: could not locate the main worktree." >&2
  exit 1
fi

# Running inside main itself is a no-op, not an error: the shared post-commit
# hook fires there too.
if [[ "$(cd "$HERE" && pwd -P)" == "$(cd "$MAIN" && pwd -P)" ]]; then
  say "mirror-assets: in the main worktree — nothing to mirror."
  exit 0
fi

# Scopes default to the project roots touched by the last commit. Assets are
# ignored, so they never appear in the commit themselves; the committed markup is
# what tells us which client folder just changed. Depth 3 captures
# deliver/<pillar>/<client> and manage/<area>/<thing> alike.
derive_scopes_from_head() {
  git diff-tree --no-commit-id --name-only -r HEAD 2>/dev/null \
    | awk -F/ 'NF>=3 {print $1"/"$2"/"$3} NF==2 {print $1"/"$2}' \
    | sort -u
}

if [[ "$ALL" == false && ${#SCOPES[@]} -eq 0 ]]; then
  while IFS= read -r s; do [[ -n "$s" ]] && SCOPES+=("$s"); done < <(derive_scopes_from_head)
fi

if [[ "$ALL" == false && ${#SCOPES[@]} -eq 0 ]]; then
  say "mirror-assets: no project paths in HEAD — nothing to mirror."
  exit 0
fi

if [[ "$REVERSE" == true ]]; then SRC_ROOT="$MAIN"; DST_ROOT="$HERE"; LABEL="main -> $(basename "$HERE")"
else                              SRC_ROOT="$HERE"; DST_ROOT="$MAIN"; LABEL="$(basename "$HERE") -> main"; fi

# Enumerate ignored files from the SOURCE worktree. --exclude-standard plus
# --ignored is exactly "what git refuses to carry", which is the set we must move
# by hand; filtering to asset extensions keeps node_modules and build caches out.
list_ignored() {
  local root="$1"; shift
  ( cd "$root" && git ls-files --others --ignored --exclude-standard -- "$@" 2>/dev/null ) \
    | grep -Ei "$ASSET_EXT_RE|$VENDOR_PATH_RE" || true
}

if [[ "$ALL" == true ]]; then FILES="$(list_ignored "$SRC_ROOT" .)"
else                          FILES="$(list_ignored "$SRC_ROOT" "${SCOPES[@]}")"; fi

if [[ "$PRUNE_DRY" == true ]]; then
  echo "=== mirror-assets: destination files with no source ($LABEL)"
  n=0
  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    [[ -e "$SRC_ROOT/$f" ]] || { echo "  ORPHAN: $f"; n=$((n+1)); }
  done < <(if [[ "$ALL" == true ]]; then list_ignored "$DST_ROOT" .; else list_ignored "$DST_ROOT" "${SCOPES[@]}"; fi)
  echo "=== $n orphan(s). Nothing deleted — remove by hand if intended."
  exit 0
fi

copied=0; skipped=0; failed=0
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  src="$SRC_ROOT/$f"; dst="$DST_ROOT/$f"
  [[ -f "$src" ]] || continue

  # Skip when the destination already holds the same bytes. Size is a cheap
  # proxy; assets are written once and not edited in place.
  if [[ -f "$dst" ]] && [[ "$(stat -c%s "$src" 2>/dev/null)" == "$(stat -c%s "$dst" 2>/dev/null)" ]]; then
    skipped=$((skipped+1)); continue
  fi

  if [[ "$DRY_RUN" == true ]]; then
    echo "  WOULD COPY: $f"; copied=$((copied+1)); continue
  fi

  mkdir -p "$(dirname "$dst")"
  if cp -p "$src" "$dst" 2>/dev/null; then copied=$((copied+1))
  else echo "mirror-assets: FAILED $f" >&2; failed=$((failed+1)); fi
done <<< "$FILES"

# NB: these flags hold the strings "true"/"false", never the empty string, so
# ${DRY_RUN:+...} would expand on every run. Compare explicitly.
DRY_NOTE=""
[[ "$DRY_RUN" == true ]] && DRY_NOTE=" (dry run — nothing written)"

if [[ "$copied" -gt 0 || "$failed" -gt 0 ]]; then
  echo "mirror-assets [$LABEL]: ${copied} copied, ${skipped} already current, ${failed} failed${DRY_NOTE}"
else
  say "mirror-assets [$LABEL]: nothing to do (${skipped} already current)."
fi

[[ "$failed" -eq 0 ]]
