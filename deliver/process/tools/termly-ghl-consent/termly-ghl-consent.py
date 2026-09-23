"""Termly Consent + GoHighLevel Bridge - module entry point.

The real executor is `consent-kit.mjs` beside this file (the same exception `webflow-build`,
`instatic-embeds` and `instatic-domain-origins` make). Webflow steps run through the
`webflow-brandklout` MCP and are listed in termly-ghl-consent.md.

    python termly-ghl-consent.py status            # every Instatic site, read-only
    python termly-ghl-consent.py check <url>[,<url>]
"""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
KIT = HERE / "consent-kit.mjs"


def main() -> int:
    args = sys.argv[1:]
    if not args or args[0] not in {"status", "check"}:
        print(__doc__)
        return 1
    node = shutil.which("node")
    if not node:
        print("node is not on PATH")
        return 1
    cmd = [node, str(KIT), "instatic", "status"] if args[0] == "status" else [node, str(KIT), *args]
    out = HERE / ".tmp" / f"{args[0]}.out"
    out.parent.mkdir(exist_ok=True)
    # Redirect to a file: Node on Windows can die on a libuv assertion when stdout is a pipe.
    with out.open("w", encoding="utf-8") as handle:
        code = subprocess.call(cmd, stdout=handle, stderr=subprocess.STDOUT)
    print(out.read_text(encoding="utf-8"))
    return code


if __name__ == "__main__":
    raise SystemExit(main())
