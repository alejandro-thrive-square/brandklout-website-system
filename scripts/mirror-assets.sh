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
# closing that gap is a local file copy — no R2 round trip.
#
# This is deliberately NOT the backup path. scripts/assets.mjs backs client media
# up to R2; this moves media between worktrees on this machine.
#
# Safety
# ------
# Additive only. Files are copied when missing or newer at the source; nothing in
# the destination is ever deleted. An asset deleted in a worktree therefore
# lingers in main — see --prune-dry-run to list those rather than act on them.
#
# Cost
# ----
# Every worktree's post-commit fires this, so it must be cheap and must not
# stack. Two guards enforce that, and both are load-bearing on Windows where a
# process creation also allocates a console:
#   * one run at a time, via a lock in the shared git common dir
#     (WEBZITE_MIRROR_LOCK_WAIT seconds to wait, default 20;
#      WEBZITE_MIRROR_LOCK_STALE_MIN minutes before a lock is junk, default 30)
#   * the copy path batches with xargs -- never reintroduce a per-file stat/cp
#     loop, see SYSTEM_RULES.md section 4.2.1
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

# --- one run at a time -----------------------------------------------------
# post-commit fires this from EVERY worktree, and the scan is the expensive
# half. Without a lock, commits landing minutes apart in two worktrees left two
# multi-thousand-file scans running side by side; each one spawns Windows
# processes faster than the console subsystem can retire them, so the machine
# flashed terminal windows and pegged a core for as long as they overlapped.
#
# One run at a time is enough. The mirror is additive and idempotent, so
# whatever a skipped run would have copied is picked up by the next commit or by
# a manual sweep — the message below says how.
#
# Read-only modes cannot collide with anything, so they never take the lock.
cleanup() {
  [[ -n "${TMP:-}" ]] && rm -rf "$TMP" 2>/dev/null
  [[ "${LOCK_HELD:-false}" == true ]] && rm -rf "$LOCK_DIR" 2>/dev/null
  return 0
}
trap cleanup EXIT

LOCK_HELD=false
if [[ "$DRY_RUN" == false && "$PRUNE_DRY" == false ]]; then
  # The common dir is shared by every worktree, so one lock covers them all.
  GIT_COMMON="$(git rev-parse --git-common-dir)"
  case "$GIT_COMMON" in
    /*|[A-Za-z]:[/\]*) ;;
    *) GIT_COMMON="$(cd "$GIT_COMMON" && pwd -P)" ;;
  esac
  LOCK_DIR="$GIT_COMMON/webzite-mirror-assets.lock"
  LOCK_WAIT="${WEBZITE_MIRROR_LOCK_WAIT:-20}"      # seconds to wait for a turn
  LOCK_STALE_MIN="${WEBZITE_MIRROR_LOCK_STALE_MIN:-30}"  # after this, junk

  waited=0
  while ! mkdir "$LOCK_DIR" 2>/dev/null; do
    # A killed run leaves the directory behind. Treat an old one as junk rather
    # than blocking every future commit on a process that no longer exists.
    if [[ -n "$(find "$LOCK_DIR" -maxdepth 0 -mmin "+$LOCK_STALE_MIN" 2>/dev/null)" ]]; then
      echo "mirror-assets: clearing a stale lock (>${LOCK_STALE_MIN}m old)." >&2
      rm -rf "$LOCK_DIR" 2>/dev/null || true
      continue
    fi
    if (( waited >= LOCK_WAIT )); then
      HINT=""
      for s in ${SCOPES[@]+"${SCOPES[@]}"}; do HINT="$HINT --scope \"$s\""; done
      [[ "$ALL" == true ]] && HINT=" --all"
      echo "mirror-assets: another run holds the lock — skipped, nothing copied." >&2
      echo "  Re-run when it finishes:  bash \"$0\"$HINT" >&2
      exit 0
    fi
    sleep 1; waited=$((waited + 1))
  done
  LOCK_HELD=true
  echo "$$" > "$LOCK_DIR/pid" 2>/dev/null || true
fi

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

# --- copy engine -----------------------------------------------------------
# One process per BATCH of files, never one per file. The loop this replaced
# shelled out five times per file (two stats, dirname, mkdir, cp); at ~4,000
# files that is ~20,000 Windows process creations for a commit that usually
# copies nothing, and on Windows each one gets a console allocated — which is
# both the CPU spike and the terminal windows flashing across the screen.
#
# stat and cp each accept many paths per invocation and xargs packs them up to
# the command-line limit, so the same work is now a handful of processes. The
# skip rule is unchanged: same size at the destination means already mirrored.
TMP="$(mktemp -d)"
printf '%s\n' "$FILES" | grep . > "$TMP/list" || true
total=$(grep -c . "$TMP/list" || true)

if [[ "$total" -eq 0 ]]; then
  say "mirror-assets [$LABEL]: nothing to do (no ignored assets in scope)."
  exit 0
fi

# "<size> <relative path>" for every readable file, in 1-3 stat calls. A path
# absent from the map does not exist there: for the source that means a stale
# listing (skip it, as the old -f test did), for the destination it means copy.
sizes_for() {
  ( cd "$1" && xargs -d '\n' -r stat -c '%s %n' 2>/dev/null ) || true
}

sizes_for "$SRC_ROOT" < "$TMP/list" > "$TMP/src"
sizes_for "$DST_ROOT" < "$TMP/list" > "$TMP/dst"

: > "$TMP/tocopy"
awk '
  function relpath(s) { return substr(s, index(s, " ") + 1) }
  NR == FNR { dst[relpath($0)] = $1; next }
  {
    p = relpath($0)
    if (p in dst && dst[p] == $1) { skipped++ } else { print p > TOCOPY }
  }
  END { print skipped + 0 }
' TOCOPY="$TMP/tocopy" "$TMP/dst" "$TMP/src" > "$TMP/skipcount"
skipped=$(cat "$TMP/skipcount")
to_copy=$(grep -c . "$TMP/tocopy" || true)

if [[ "$DRY_RUN" == true ]]; then
  sed 's|^|  WOULD COPY: |' "$TMP/tocopy"
  copied=$to_copy; failed=0
else
  # --parents rebuilds the directory tree at the destination, so no per-file
  # mkdir; -t keeps the destination out of the packed argument list.
  ( cd "$SRC_ROOT" && xargs -d '\n' -r -a "$TMP/tocopy" \
      cp -p --parents -t "$DST_ROOT" ) 2> "$TMP/cp.err" || true

  # Verify by re-reading sizes rather than trusting a batched exit code: with
  # many files per cp invocation, one failure would otherwise condemn the batch.
  sizes_for "$DST_ROOT" < "$TMP/tocopy" > "$TMP/dst2"
  : > "$TMP/copied"
  awk '
    function relpath(s) { return substr(s, index(s, " ") + 1) }
    NR == FNR { src[relpath($0)] = $1; next }
    { p = relpath($0); if (p in src && src[p] == $1) print p > OK }
  ' OK="$TMP/copied" "$TMP/src" "$TMP/dst2"

  copied=$(grep -c . "$TMP/copied" || true)
  failed=$((to_copy - copied))
  if [[ "$failed" -gt 0 ]]; then
    awk 'NR==FNR { ok[$0]; next } !($0 in ok) { print "mirror-assets: FAILED " $0 }' \
      "$TMP/copied" "$TMP/tocopy" >&2
    head -n 3 "$TMP/cp.err" >&2 || true
  fi
fi

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
