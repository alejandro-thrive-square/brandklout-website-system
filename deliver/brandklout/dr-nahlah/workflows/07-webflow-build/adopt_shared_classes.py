#!/usr/bin/env python3
"""Make a page's shared classes adopt the definitions already live on the site.

This keeps one definition per class name, which is worth doing on its own merits:
a shared class SHOULD mean the same thing on every page, and per-page variation
belongs in the runtime-state CSS. The `a-after` case is the clearest example —
the nav underline baked `transform: scaleX(1)` on whichever page was current,
against `scaleX(0)` on the others. Adopting `scaleX(0)` is right, because the
head CSS raises it for the current page via an `aria-current` selector.

WHAT THIS DOES NOT DO: prevent Webflow from forking the class. That was the
original justification and it does not hold. On the finished 11-page build, 283
class instances forked with byte-identical definitions — agreement did not buy a
merge (see check_shared_classes.py for the measurements). Write head CSS as
`[class*="a-after"]` and hook JS on `data-*` so a fork is survivable; running
this script is hygiene, not protection.

Differences are still REPORTED, loudly, so a genuine per-page divergence is
visible rather than silently flattened. Review them; if one is real, rename the
class in that page's source instead of sharing it.

Usage:
  python adopt_shared_classes.py --baseline .tmp/light/final.json \
      [--baseline .tmp/p-about/final.json] --payload .tmp/p-x/final.json
"""
from __future__ import annotations

import argparse
import json
import pathlib


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--baseline", action="append", required=True)
    ap.add_argument("--payload", required=True)
    args = ap.parse_args()

    live: dict = {}
    for b in args.baseline:
        doc = json.loads(pathlib.Path(b).read_text(encoding="utf-8"))
        for s in doc["payload"]["styles"]:
            live.setdefault(s["name"], s)

    path = pathlib.Path(args.payload)
    doc = json.loads(path.read_text(encoding="utf-8"))

    adopted = []
    for s in doc["payload"]["styles"]:
        canon = live.get(s["name"])
        if not canon:
            continue
        before = s.get("styleLess") or ""
        after = canon.get("styleLess") or ""
        same_vars = json.dumps(s.get("variants") or {}, sort_keys=True) == \
            json.dumps(canon.get("variants") or {}, sort_keys=True)
        if before == after and same_vars:
            continue
        adopted.append((s["name"], before, after))
        s["styleLess"] = after
        s["variants"] = json.loads(json.dumps(canon.get("variants") or {}))

    path.write_text(json.dumps(doc), encoding="utf-8")
    print(f"adopted live definitions for {len(adopted)} shared class(es)")
    for name, before, after in adopted:
        print(f"  -- {name}")
        print(f"     was : {before[:110] or '(empty)'}")
        print(f"     now : {after[:110] or '(empty)'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
