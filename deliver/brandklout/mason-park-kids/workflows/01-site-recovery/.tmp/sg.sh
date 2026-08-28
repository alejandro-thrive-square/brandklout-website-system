#!/usr/bin/env bash
# Thin SSH wrapper for the SiteGround account that hosts pediatricdentistkatytx.com.
#
# Reads connection details from the repo-root .env so no credential is ever typed
# on a command line (where it would land in shell history and in the Claude Code
# transcript). Which private key it uses is deliberately explicit:
#
#   SG_KEY=/path/to/key  bash sg.sh <remote command...>
#
# and it defaults to .secrets/sg_pediatric_recovery — the passphrase-less key
# generated for this recovery. The key shipped in .env as PRIVATEKEY does NOT
# work: it is truncated by one base64 character AND passphrase-protected. See
# README.md, "The credential problem".
#
#   bash sg.sh 'ls -la ~'          # run a remote command
#   bash sg.sh                     # interactive shell
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../../../../../.." && pwd)"
ENV_FILE="$ROOT/.env"

[ -f "$ENV_FILE" ] || { echo "no .env at $ENV_FILE" >&2; exit 1; }

# Read values without sourcing the file: PRIVATEKEY is a 387-char blob and
# sourcing would also execute anything else that lands in there later.
getenv() { sed -n "s/^$1=[[:space:]]*//p" "$ENV_FILE" | head -1 | tr -d '\r'; }

HOST="$(getenv HOSTNAME)"
USER_NAME="$(getenv USERNAME)"
PORT="$(getenv PORT)"
KEY="${SG_KEY:-$ROOT/.secrets/sg_pediatric_recovery}"

[ -n "$HOST" ] && [ -n "$USER_NAME" ] && [ -n "$PORT" ] || { echo "HOSTNAME/USERNAME/PORT missing from .env" >&2; exit 1; }
[ -f "$KEY" ] || { echo "no private key at $KEY (set SG_KEY=... to override)" >&2; exit 1; }

# SiteGround hands out shared-host keys; a strict permission check on Windows
# filesystems fails for reasons that have nothing to do with security here.
chmod 600 "$KEY" 2>/dev/null || true

exec ssh \
  -i "$KEY" \
  -p "$PORT" \
  -o IdentitiesOnly=yes \
  -o StrictHostKeyChecking=accept-new \
  -o ConnectTimeout=20 \
  -o BatchMode=yes \
  "$USER_NAME@$HOST" "$@"
