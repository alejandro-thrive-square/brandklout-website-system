#!/usr/bin/env python3
"""Report which shared classes diverge between a payload and the ones already live.

READ THIS FIRST — this script does NOT prevent forking, and it was originally
written on the belief that it could.

The belief was: Webflow reconciles a pasted class by NAME, so an identical
definition merges cleanly and only a differing one forks to `btn 2`. Making
definitions agree would therefore keep `.btn` selectors working.

Measured on the finished 11-page Dr. Nahlah build, that is false. 283 forked
class instances are live and **none of them had a differing definition** — the
payloads were byte-identical page to page, and the forked rules are byte-identical
to their originals in the published CSS (`.nav-right` == `.nav-right-2`,
`.eyebrow` == `.eyebrow-2`, `.pk-head` == `.pk-head-2`). On this whole-page paste
path a name already taken on the site forks no matter what. Only the first paste
gets the name.

So the real defence is not agreement, it is TOLERANCE:

  * head CSS -> `[class*="a-after"]`, never `.a-after` (same specificity)
  * JS hooks -> `data-*` attributes, never class names
  * verify   -> computed-style probe on the live page; the class the browser
                actually matched is the only proof (a grep cannot see a fork)

What this script is still good for: showing where two pages genuinely disagree
about a shared class, which is a real design smell worth knowing about before
pasting. Treat its output as information, not as a green light.

THE BASELINE IS THE WHOLE GATE. This check is only as good as the list of live
pages it compares against, and on the Dr. Nahlah build that is exactly what went
wrong: pages 3-11 were each passed `--baseline` for Home and About only, so a
class those two never defined — `pk-head`, `pg-hero`, `a-after` — forked between
the other nine without the gate ever seeing it. A hand-typed baseline is a
promise to remember; nobody keeps it for nine pages.

So the baseline now comes from `.tmp/live-manifest.json`, and the gate FAILS
CLOSED when that file is missing rather than checking against nothing. Record
each page the moment it goes live:

  python check_shared_classes.py --record --slug veneers \\
      --page-id 6a71... --payload .tmp/p-veneers/resolved.json

Definitions are compared post-`resolve_wholepage.mjs`, because the baseline is
post-resolve too; comparing a raw payload against a resolved one reports every
clamp() as a difference and tells you nothing.

Auto-generated names (`nahlah-div-5`, `about-p-2`) are page-scoped by
`--page-prefix` and cannot collide, so only SOURCE class names matter here.

Usage:
  python check_shared_classes.py --payload .tmp/p-veneers/resolved.json
  python check_shared_classes.py --payload ... --baseline extra.json   # additive
  python check_shared_classes.py --record --slug veneers --page-id ... --payload ...

Exit 1 if any class would fork.
"""
from __future__ import annotations

import argparse
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent
DEFAULT_MANIFEST = ROOT / ".tmp" / "live-manifest.json"


def styles(path: pathlib.Path) -> dict:
    doc = json.loads(path.read_text(encoding="utf-8"))
    return {s["name"]: s for s in doc["payload"]["styles"]}


def load_manifest(path: pathlib.Path) -> dict:
    if not path.exists():
        print(
            f"FAIL-CLOSED: no manifest at {path}\n"
            "The baseline is what makes this gate meaningful, and an absent manifest\n"
            "would silently check the payload against nothing — reporting 'clean' for a\n"
            "page that forks every shared class. Create the manifest, or pass explicit\n"
            "--baseline paths if you genuinely mean to check against a subset.",
            file=sys.stderr,
        )
        raise SystemExit(2)
    return json.loads(path.read_text(encoding="utf-8"))


def record(manifest_path: pathlib.Path, slug: str, page_id: str, payload: str) -> int:
    doc = load_manifest(manifest_path)
    entries = doc["live"]
    for e in entries:
        if e["slug"] == slug:
            e.update(page_id=page_id, payload=payload)
            break
    else:
        entries.append({"slug": slug, "page_id": page_id, "payload": payload})
    manifest_path.write_text(json.dumps(doc, indent=2) + "\n", encoding="utf-8")
    print(f"recorded {slug} -> manifest now lists {len(entries)} live page(s)")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--payload", required=True, help="the page about to be pasted")
    ap.add_argument("--manifest", default=str(DEFAULT_MANIFEST),
                    help="JSON list of payloads already live (default: .tmp/live-manifest.json)")
    ap.add_argument("--baseline", action="append", default=[],
                    help="extra payload(s) to treat as live, on top of the manifest")
    ap.add_argument("--no-manifest", action="store_true",
                    help="use only --baseline; requires at least one")
    ap.add_argument("--record", action="store_true",
                    help="append/update this page in the manifest instead of checking")
    ap.add_argument("--slug", help="with --record")
    ap.add_argument("--page-id", help="with --record")
    args = ap.parse_args()

    manifest_path = pathlib.Path(args.manifest)

    if args.record:
        if not (args.slug and args.page_id):
            print("--record needs --slug and --page-id", file=sys.stderr)
            return 2
        return record(manifest_path, args.slug, args.page_id, args.payload)

    payload_path = pathlib.Path(args.payload)
    sources: list[tuple[str, pathlib.Path]] = []

    if args.no_manifest:
        if not args.baseline:
            print("--no-manifest requires at least one --baseline", file=sys.stderr)
            return 2
    else:
        doc = load_manifest(manifest_path)
        for e in doc["live"]:
            p = (ROOT / e["payload"]) if not pathlib.Path(e["payload"]).is_absolute() \
                else pathlib.Path(e["payload"])
            # A manifest entry whose payload has gone missing is a hole in the
            # baseline, which is the failure this gate exists to prevent.
            if not p.exists():
                print(f"FAIL-CLOSED: manifest lists {e['slug']} but {p} is missing",
                      file=sys.stderr)
                return 2
            # Skip the page against itself. Match on the containing directory,
            # not the filename: the manifest holds `final.json` (what was pasted)
            # while a re-check is usually run on that page's `resolved.json`, so
            # comparing paths would fail to notice they are the same page.
            if p.parent.resolve() == payload_path.parent.resolve():
                continue
            sources.append((e["slug"], p))

    for b in args.baseline:
        sources.append(("(explicit)", pathlib.Path(b)))

    if not sources:
        print("no baseline pages — nothing is live yet, so nothing can fork")
        return 0

    live: dict = {}
    owner: dict = {}
    for slug, p in sources:
        for name, style in styles(p).items():
            if name not in live:
                live[name] = style
                owner[name] = slug

    incoming = styles(payload_path)
    shared = sorted(set(live) & set(incoming))
    forks = [n for n in shared
             if (live[n].get("styleLess") or "") != (incoming[n].get("styleLess") or "")]

    print(f"baseline pages   : {len(sources)}  ({', '.join(s for s, _ in sources)})")
    print(f"baseline classes : {len(live)}")
    print(f"incoming classes : {len(incoming)}")
    print(f"shared names     : {len(shared)}  (reuse — merges by name)")
    print(f"WOULD FORK       : {len(forks)}")
    for n in forks:
        print(f"  -- {n}   (live definition from: {owner[n]})")
        print(f"     live    : {(live[n].get('styleLess') or '')[:100] or '(empty)'}")
        print(f"     incoming: {(incoming[n].get('styleLess') or '')[:100] or '(empty)'}")
    if forks:
        print("\nResolve before pasting: run adopt_shared_classes.py to take the live "
              "definitions, rename the incoming class in the source, or accept the fork "
              "knowingly. Pasting as-is silently creates '<name> 2' and breaks every "
              "selector that targets the original.", file=sys.stderr)
        return 1
    print("\nclean — every shared name merges by definition")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
