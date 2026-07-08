#!/usr/bin/env bash
# Install + enable the agent-dispatch worker timer on the Hostinger VPS (Ubuntu).
# Run on the VPS:   bash .agents/vps/install-worker.sh
# Disable later:    systemctl disable --now agent-dispatch-worker.timer
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"        # .agents/vps
REPO="$(cd "$HERE/../.." && pwd)"            # repo root
DEST="/etc/systemd/system"

command -v python3 >/dev/null 2>&1 || { echo "python3 not found. Run: apt install -y python3"; exit 1; }
PY="$(command -v python3)"

[ -f "$REPO/.agents/dispatch.py" ] || { echo "dispatch.py not found at $REPO/.agents"; exit 1; }

echo "Repo:   $REPO"
echo "Python: $PY"
echo
echo "Rendering units into $DEST ..."
sed -e "s|@@PY@@|$PY|g" -e "s|@@REPO@@|$REPO|g" \
    "$HERE/agent-dispatch-worker.service" > "$DEST/agent-dispatch-worker.service"
install -m 0644 "$HERE/agent-dispatch-worker.timer" "$DEST/agent-dispatch-worker.timer"

systemctl daemon-reload
systemctl enable --now agent-dispatch-worker.timer

echo
echo "Installed. Inspect:"
echo "  systemctl status agent-dispatch-worker.timer"
echo "  systemctl list-timers agent-dispatch-worker.timer"
echo "  journalctl -u agent-dispatch-worker.service -n 50 --no-pager"
echo
echo "Queue a task anywhere (local or VPS), it will be processed within ~2 min:"
echo "  python3 $REPO/.agents/dispatch.py status"
