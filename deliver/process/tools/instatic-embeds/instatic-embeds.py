"""Instatic Embeds — module orchestrator.

The real executor for this module is the Node toolchain beside this file (the
same exception `webflow-build` makes). This wrapper exists so the module has
one entry point that runs the documented sequence in the documented order, and
refuses the two mistakes that cost real time on the first client:

  * running any site-touching step without INSTATIC_BASE_URL, which on a shared
    toolkit would mean publishing one client's plugin to another client's site;
  * reaching for the publishing gate first. `verify-embed-editor.mjs` proves the
    block is offered to a person and publishes NOTHING, so it goes first.

    python instatic-embeds.py test          # offline suites only, no site
    python instatic-embeds.py install       # pack + inspect (add --apply to install)
    python instatic-embeds.py verify        # editor gate (no publish)
    python instatic-embeds.py verify --published   # also the publishing gate
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent


def env_site() -> str:
    """INSTATIC_BASE_URL from the environment or the repo-root .env.

    `lib/insta-api.mjs` does its own walk-up read; this is only so the wrapper
    can fail with a sentence instead of a stack trace.
    """
    site = os.environ.get("INSTATIC_BASE_URL", "").strip()
    if site:
        return site
    for parent in [HERE, *HERE.parents][:8]:
        env = parent / ".env"
        if not env.is_file():
            continue
        for line in env.read_text(encoding="utf-8", errors="replace").splitlines():
            key, _, value = line.partition("=")
            if key.strip() == "INSTATIC_BASE_URL":
                return value.strip().strip("\"'")
    return ""


def node(script: str, *args: str) -> int:
    exe = shutil.which("node")
    if exe is None:
        print("node is not on PATH — this module's executor is the Node toolchain.")
        return 127
    print(f"\n$ node {script} {' '.join(args)}".rstrip())
    return subprocess.run([exe, script, *args], cwd=HERE).returncode


def require_site() -> str:
    site = env_site()
    if not site:
        print(
            "INSTATIC_BASE_URL is not set.\n"
            "  Add it to the repo-root .env, e.g. INSTATIC_BASE_URL=https://client-site.com\n"
            "  The shared toolkit will not guess which site it is talking to."
        )
        raise SystemExit(2)
    return site


def cmd_test(_: argparse.Namespace) -> int:
    # The plugin and its offline suites live in ../instatic-plugins since 2026-09-23.
    return node("../instatic-plugins/plugins.mjs", "test", "--plugin", "embed-origins")


def cmd_install(args: argparse.Namespace) -> int:
    site = require_site()
    print(f"target site: {site}")
    # Packs from ../instatic-plugins/embed-origins and grants from plugins.json (2026-09-23).
    install_args = ["embed-origins"] + (["--apply"] if args.apply else [])
    return node("../instatic-plugins/install-plugin.mjs", *install_args)


def cmd_verify(args: argparse.Namespace) -> int:
    site = require_site()
    print(f"target site: {site}")
    # Editor first: it reads the draft and publishes nothing.
    rc = 0
    for step in ("--place", "--check", "--cleanup"):
        rc |= node("verify-embed-editor.mjs", step)
    if not args.published:
        print("\nSkipped the published-page gate. Add --published to run it —"
              "\nnote it PUBLISHES, and a publish bakes every page on the site.")
        return rc
    for step in ("--place", "--check", "--cleanup"):
        rc |= node("verify-embed-scripts.mjs", step)
    return rc


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("test", help="offline suites, no site touched").set_defaults(fn=cmd_test)

    install = sub.add_parser("install", help="pack and inspect the plugin package")
    install.add_argument("--apply", action="store_true", help="actually install (step-up auth)")
    install.set_defaults(fn=cmd_install)

    verify = sub.add_parser("verify", help="gate the editor path")
    verify.add_argument("--published", action="store_true",
                        help="also run the published-page gate, which publishes")
    verify.set_defaults(fn=cmd_verify)

    args = parser.parse_args()
    return args.fn(args)


if __name__ == "__main__":
    sys.exit(main())
