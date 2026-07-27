#!/usr/bin/env python3
"""
Run an arbitrary command and show a desktop notification on exit.

Usage:
  python scripts/run-and-notify.py -- claude -p "Write a Flask app"
  python scripts/run-and-notify.py -- codex exec --skip-git-repo-check "..."

If the command succeeds, the notification says "OK". If it fails,
it shows the exit code and first 200 chars of stderr.
"""

from __future__ import annotations

import os
import subprocess
import sys
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from scripts.notify import notify


def main() -> int:
    args = sys.argv[1:]
    if not args:
        print("Usage: run-and-notify.py -- <command...>", file=sys.stderr)
        return 1

    # Strip a leading `--` if present
    if args[0] == "--":
        args = args[1:]

    label = args[0] if len(args) <= 3 else f"{args[0]} …"
    started = time.time()

    try:
        proc = subprocess.run(
            args,
            capture_output=True,
            text=True,
            timeout=3600,
        )
    except FileNotFoundError:
        notify(title="Command not found", message=args[0], sound=True)
        return 1
    except subprocess.TimeoutExpired:
        notify(title=f"Timed out ({label})", message="After 3600s", sound=True)
        return 1

    duration = time.time() - started
    status = "OK" if proc.returncode == 0 else f"FAIL (exit {proc.returncode})"

    message = f"{label} — {duration:.0f}s"
    if proc.returncode != 0:
        snippet = (proc.stderr or proc.stdout or "")[:200].strip().replace("\n", " | ")
        if snippet:
            message += f" — {snippet}"

    notify(title=f"Command {status}", message=message, sound=True)
    sys.stdout.write(proc.stdout)
    sys.stderr.write(proc.stderr)
    return proc.returncode


if __name__ == "__main__":
    raise SystemExit(main())
