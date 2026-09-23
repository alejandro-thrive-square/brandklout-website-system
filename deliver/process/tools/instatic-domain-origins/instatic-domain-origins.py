"""Instatic Domain & Admin Origins - module orchestrator.

The real executor is `check-origins.mjs` beside this file (the same exception
`webflow-build` and `instatic-embeds` make). This wrapper exists so the
module has one entry point, and so the cutover sequence is printed in the right
order rather than remembered in the wrong one.

    python instatic-domain-origins.py check                 # every site in sites.json
    python instatic-domain-origins.py check https://x.com   # one site
    python instatic-domain-origins.py cutover               # print the checklist

`check` sends no credentials and changes nothing, so it is safe for anyone to
run at any time. It exits non-zero while any site has a TRAP host - a host that
serves a normal-looking login page and then refuses the login itself.
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
CHECKER = HERE / "check-origins.mjs"

CUTOVER = """\
Instatic domain cutover - run every step, in order.
Full detail and the reasoning: instatic-domain-origins.md

  1. Record the platform host (<app>.up.railway.app). It must SURVIVE the change:
     it is the toolkit's way in and the fallback when the domain misbehaves.
  2. Point DNS at the Instatic host and add the domain in Railway
     (service -> Networking -> custom domain). Apex AND www, or decide
     deliberately that only one exists.
  3. Set PUBLIC_ORIGIN on the Instatic service - comma-separated,
     CLIENT DOMAIN FIRST, platform host last but still present:

         PUBLIC_ORIGIN=https://www.client.com,https://client.com,https://<app>.up.railway.app

     Every host a human might use must be listed. Matching is an exact string
     compare; nothing about `www` is implied. Omitting one produces no warning,
     only a trap.
  4. REDEPLOY, and CONFIRM a new deployment appeared. resolvePublicOrigins()
     runs once at boot; an env change alone does nothing. `railway variables
     --set` usually triggers the deploy, but Mason Park proved it does not
     always:  railway deployment list --service "<Service>"  must show a NEW
     entry, newer than your edit.
  5. Update sites.json here: adminUrl = the new canonical domain.
  6. Prove it against the RUNNING server:  node check-origins.mjs --all
     Every host must read OK. Zero TRAP lines. It exits non-zero until then.
     "I checked the variable in Railway" is NOT proof - Mason Park's variable
     read correctly for a day while the running container ignored it.
  7. Update INSTATIC_BASE_URL in that client's worktree .env to an origin that
     passes the gate, or the instatic-embeds toolkit starts failing with
     403s that look like permissions.
  8. Only now send the link - the one the checker printed after GIVE THIS LINK.
"""


def node() -> str:
    found = shutil.which("node")
    if not found:
        sys.exit("node is not on PATH; this module's executor is a Node script.")
    return found


def run_check(targets: list[str]) -> int:
    if not CHECKER.exists():
        sys.exit(f"missing executor: {CHECKER}")
    cmd = [node(), str(CHECKER)] + (targets or ["--all"])
    return subprocess.run(cmd, cwd=HERE).returncode


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)

    check = sub.add_parser("check", help="which admin URLs can actually save (no credentials)")
    check.add_argument("targets", nargs="*", help="site URLs; default is every site in sites.json")

    sub.add_parser("cutover", help="print the domain cutover checklist")

    args = parser.parse_args()
    if args.command == "cutover":
        print(CUTOVER)
        return 0
    return run_check(args.targets)


if __name__ == "__main__":
    raise SystemExit(main())
