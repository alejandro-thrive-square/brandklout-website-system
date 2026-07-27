#!/usr/bin/env bash
set -euo pipefail

# Bootstrap: download heavy VPS assets into a freshly cloned repo.
# Run AFTER cloning, on a new computer. This script is the asset-restore half
# of INSTALL.md (Steps 5-6). It does NOT install Python, restore .env, or set
# up MCP auth — see INSTALL.md for the full setup.
#
# Safe by design: uses rclone COPY (VPS → local). It never deletes local files
# and never writes to the VPS. Preview with --dry-run before the first run.
#
# Must be run from inside the cloned repo (Git Bash on Windows, or any bash).
# Usage:
#   bash scripts/bootstrap.sh [--dry-run] [--brand-only] [--media-only]
#                             [--client <name>] [--no-ssh-check]
#
#   --dry-run        Preview what would be downloaded; transfer nothing.
#   --brand-only     Only restore manage/brand-assets/.
#   --media-only     Only restore heavy .tmp/ media under deliver/.
#   --client <name>  Restrict media restore to deliver/<name>/ (e.g. giovanni-serrano).
#                    Default: all deliver/ clients.
#   --no-ssh-check   Skip the VPS connectivity probe.
#
# Prerequisites (see INSTALL.md Steps 1, 5, 6):
#   - rclone installed, with a remote named "vps" configured (SFTP to Hostinger VPS).
#   - VPS SSH key restored and the VPS host key present in known_hosts.
#
# Companion scripts:
#   scripts/sync-assets.sh — directional asset sync (push/pull/bisync) for ongoing work.
#   scripts/sync.sh        — everyday both-ways sync (git + assets).

VPS_ROOT="vps:/root/webzite-agentic-workflow"
DRY_RUN=""
BRAND_ONLY=false
MEDIA_ONLY=false
CLIENT=""
SSH_CHECK=true

print_usage() {
  cat <<'USAGE'
Usage: bash scripts/bootstrap.sh [--dry-run] [--brand-only] [--media-only]
                                 [--client <name>] [--no-ssh-check]
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)      DRY_RUN="--dry-run"; shift ;;
    --brand-only)   BRAND_ONLY=true; shift ;;
    --media-only)   MEDIA_ONLY=true; shift ;;
    --client)       CLIENT="${2:-}"; shift 2 ;;
    --no-ssh-check) SSH_CHECK=false; shift ;;
    -h|--help)      print_usage; exit 0 ;;
    *)
      echo "Unknown flag: $1" >&2
      print_usage >&2
      exit 1
      ;;
  esac
done

# ── 0. Preconditions ──────────────────────────────────────────────────────────
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$ROOT" ]]; then
  echo "ERROR: not inside a git repository. Clone the repo first, then run from its root." >&2
  exit 1
fi
cd "$ROOT"

if ! command -v rclone >/dev/null 2>&1; then
  echo "ERROR: rclone is not installed or not on PATH." >&2
  echo "       Install rclone, then run 'rclone config' to create the 'vps' remote." >&2
  echo "       See INSTALL.md Step 6." >&2
  exit 1
fi

if ! rclone listremotes 2>/dev/null | grep -q '^vps:$'; then
  echo "ERROR: rclone remote 'vps' is not configured." >&2
  echo "       Run 'rclone config' and create an SFTP remote named 'vps' (Hostinger VPS)." >&2
  echo "       See INSTALL.md Step 6." >&2
  exit 1
fi

echo "=== Webzite bootstrap — restore VPS assets ${DRY_RUN:+(dry run)} ==="
echo "Repo:   $ROOT"
echo "Remote: $VPS_ROOT"
echo ""

# ── 1. Connectivity probe (exercises the same SFTP path the copies will use) ──
if [[ "$SSH_CHECK" == true ]]; then
  echo "--- [1/3] VPS connectivity probe ---"
  if rclone lsd "$VPS_ROOT" >/dev/null 2>&1; then
    echo "VPS reachable via rclone 'vps' remote."
  else
    echo "ERROR: could not list $VPS_ROOT via rclone." >&2
    echo "       Check the 'vps' remote config and SSH key. See INSTALL.md Steps 5-6." >&2
    echo "       Re-run with --no-ssh-check to skip this probe." >&2
    exit 1
  fi
  echo ""
fi

# ── 2. Brand assets ───────────────────────────────────────────────────────────
restore_brand() {
  echo "--- Brand assets: manage/brand-assets/ ---"
  mkdir -p ./manage/brand-assets
  rclone copy "$VPS_ROOT/manage/brand-assets/" "./manage/brand-assets/" \
    ${DRY_RUN:+--dry-run} --progress
  echo ""
}

# ── 3. Heavy .tmp/ media (file-type allowlist mirrors .gitignore & sync-assets.sh)
restore_media() {
  local scope_src="$VPS_ROOT/deliver/"
  local scope_dst="./deliver/"
  if [[ -n "$CLIENT" ]]; then
    scope_src="$VPS_ROOT/deliver/$CLIENT/"
    scope_dst="./deliver/$CLIENT/"
    echo "--- Heavy media: deliver/$CLIENT/**/.tmp/ ---"
  else
    echo "--- Heavy media: deliver/**/.tmp/ ---"
  fi

  mkdir -p "$scope_dst"
  # shellcheck disable=SC2086
  rclone copy "$scope_src" "$scope_dst" \
    --filter "+ **/" \
    --filter "+ **/.tmp/**/*.png"    --filter "+ **/.tmp/**/*.jpg"     --filter "+ **/.tmp/**/*.jpeg" \
    --filter "+ **/.tmp/**/*.gif"    --filter "+ **/.tmp/**/*.svg"     --filter "+ **/.tmp/**/*.webp"   --filter "+ **/.tmp/**/*.ico" \
    --filter "+ **/.tmp/**/*.pdf"    --filter "+ **/.tmp/**/*.mp4"     --filter "+ **/.tmp/**/*.webm"    --filter "+ **/.tmp/**/*.mov" \
    --filter "+ **/.tmp/**/*.zip"    --filter "+ **/.tmp/**/*.7z"      --filter "+ **/.tmp/**/*.psd" \
    --filter "+ **/.tmp/**/*.ai"     --filter "+ **/.tmp/**/*.eps"     --filter "+ **/.tmp/**/*.fig"    --filter "+ **/.tmp/**/*.sketch" \
    --filter "- *" \
    ${DRY_RUN:+--dry-run} --progress
  echo ""
}

# ── Dispatch ──────────────────────────────────────────────────────────────────
if [[ "$BRAND_ONLY" == true && "$MEDIA_ONLY" == true ]]; then
  echo "NOTE: --brand-only and --media-only both set — restoring both." >&2
  BRAND_ONLY=false; MEDIA_ONLY=false
fi

if [[ "$BRAND_ONLY" == true ]]; then
  restore_brand
elif [[ "$MEDIA_ONLY" == true ]]; then
  restore_media
else
  restore_brand
  restore_media
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo "=== Bootstrap complete ${DRY_RUN:+(dry run — no files transferred)} ==="
echo ""
echo "Next steps (see INSTALL.md):"
echo "  Step 3 — create the Python venv: python -m venv .venv && pip install -r requirements.txt"
echo "  Step 4 — restore root .env from your private credential store"
echo "  Step 7 — reauthorize MCP servers (claude mcp list)"
echo "  Ongoing work — bash scripts/sync.sh --dry-run   (then drop --dry-run)"
