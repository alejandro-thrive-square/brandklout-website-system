"""Instatic Domain & Admin Origins - module orchestrator.

The real executors are `check-origins.mjs` and `check-dns.mjs` beside this file
(the same exception `07-webflow-build` and `18-instatic-embeds` make). This
wrapper exists so the module has one entry point, and so the cutover sequence is
printed in the right order rather than remembered in the wrong one.

    python 20-instatic-domain-origins.py check                 # every site in sites.json
    python 20-instatic-domain-origins.py check https://x.com   # one site
    python 20-instatic-domain-origins.py dns                   # DNS pointers vs. Railway
    python 20-instatic-domain-origins.py all                   # both checks
    python 20-instatic-domain-origins.py cutover               # print the checklist

Two independent failures, two checks:

  check - THE GATE.    Who can actually log in. Sends no credentials and changes
          nothing, so it is safe for anyone to run at any time. Exits non-zero
          while any site has a TRAP host - one that serves a normal-looking
          login page and then refuses the login.
  dns   - THE POINTER. Whether the domain still reaches us at all. Read-only,
          but needs `railway login`: a Cloudflare-proxied record hides its
          target from the world, so Railway is the only source of truth for
          what it should be. Exits non-zero on a CHANGED target, a host that
          does not resolve, or a failed certificate.

Neither substitutes for the other. A site can pass the gate on the platform host
while its real domain points nowhere, which is exactly the state Mason Park was
left in on 2026-08-28.
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
CHECKER = HERE / "check-origins.mjs"
DNS_CHECKER = HERE / "check-dns.mjs"

CUTOVER = """\
Instatic domain cutover - run every step, in order.
Full detail and the reasoning: 20-instatic-domain-origins.md

  1. Record the platform host (<app>.up.railway.app). It must SURVIVE the change:
     it is the toolkit's way in and the fallback when the domain misbehaves.
  2. Add the domain in Railway (service -> Networking -> custom domain), apex AND
     www, then READ BACK THE TARGET RAILWAY MINTED FOR EACH ONE, separately:

         railway domain status <host> --service "<Svc>" --environment production

     Railway mints a RANDOM eight-character target PER DOMAIN. The apex's target
     is NOT the www target. Point each Cloudflare record at its own domain's
     target; using one for both still serves (Railway routes on Host) but no
     certificate will ever issue.
  3. Record those targets in sites.json under `dns` - `node check-dns.mjs
     --record` prints them in the right shape. Record only AFTER Cloudflare
     matches; recording first just files the outage as expected.
  4. Set PUBLIC_ORIGIN on the Instatic service - comma-separated,
     CLIENT DOMAIN FIRST, platform host last but still present:

         PUBLIC_ORIGIN=https://www.client.com,https://client.com,https://<app>.up.railway.app

     Every host a human might use must be listed. Matching is an exact string
     compare; nothing about `www` is implied. Omitting one produces no warning,
     only a trap.
  5. REDEPLOY, and CONFIRM a new deployment appeared. resolvePublicOrigins()
     runs once at boot; an env change alone does nothing. `railway variables
     --set` usually triggers the deploy, but Mason Park proved it does not
     always:  railway deployment list --service "<Service>"  must show a NEW
     entry, newer than your edit.

     A REDEPLOY DOES NOT TOUCH THE DOMAINS, and does not move the pointer.
     If you are here because a domain looks broken, do NOT delete and re-add it:
     that mints new targets and IS the outage, not the fix.
  6. Update sites.json here: adminUrl = the new canonical domain; keep `dns`
     current.
  7. Prove BOTH against reality rather than the dashboard:
         node check-dns.mjs             # the pointer
         node check-origins.mjs --all   # the gate, on the RUNNING server
     Both must exit 0: every host OK, zero TRAP, zero CHANGED. "I checked the
     variable in Railway" is NOT proof - Mason Park's variable read correctly
     for a day while the running container ignored it. A BLOCKED row is not a
     pass either: a CDN answered instead of the origin, so that host was never
     actually tested.
  8. Update INSTATIC_BASE_URL in that client's worktree .env to an origin that
     passes the gate, or the 18-instatic-embeds toolkit starts failing with
     403s that look like permissions.
  9. Only now send the link - the one the checker printed after GIVE THIS LINK.
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


def run_dns(clients: list[str]) -> int:
    if not DNS_CHECKER.exists():
        sys.exit(f"missing executor: {DNS_CHECKER}")
    return subprocess.run([node(), str(DNS_CHECKER)] + clients, cwd=HERE).returncode


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)

    check = sub.add_parser("check", help="which admin URLs can actually save (no credentials)")
    check.add_argument("targets", nargs="*", help="site URLs; default is every site in sites.json")

    dns = sub.add_parser("dns", help="are the DNS pointers still the ones Railway expects (needs railway login)")
    dns.add_argument("clients", nargs="*", help="client keys from sites.json; default is all")

    sub.add_parser("all", help="both checks; non-zero if either fails")
    sub.add_parser("cutover", help="print the domain cutover checklist")

    args = parser.parse_args()
    if args.command == "cutover":
        print(CUTOVER)
        return 0
    if args.command == "dns":
        return run_dns(args.clients)
    if args.command == "all":
        # Run BOTH even when the first fails. They are independent faults, and
        # seeing only the earlier one is how the second gets fixed a day later.
        dns_rc = run_dns([])
        check_rc = run_check([])
        return dns_rc or check_rc
    return run_check(args.targets)


if __name__ == "__main__":
    raise SystemExit(main())
