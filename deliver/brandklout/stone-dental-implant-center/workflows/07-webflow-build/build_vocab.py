#!/usr/bin/env python3
"""Build the shared-class vocabulary manifest from per-page payloads.

The whole-page converter invents per-page definitions: it bakes slightly
different concrete values for the SAME source class on different pages, so
Webflow (which reconciles pasted classes by name) is forced to fork a duplicate
(`scene-head-2`). This script reads the no-`--avoid` payloads for every page,
finds each SOURCE class used on >=2 pages, and decides ONE canonical definition:

  - identical across pages                         -> canonical (as-is)
  - differ only by which declarations are present / extra responsive variants,
    with NO property ever taking two different values (trivial drift)
                                                     -> canonical = order-preserving
                                                        UNION of all pages' decls
  - some property takes DIFFERENT values across pages (a real per-page theme
    difference, e.g. .subhero grid color)            -> 'pending', records every
                                                        page's value for a human call

Only SOURCE class names (from the HTML `class="..."` attributes) are considered.
Converter-generated auto-names (`div-33`, `section-2`, `p-5`) are excluded — those
are page-specific and get a deterministic page prefix in the converter instead.

Feeds `html_to_webflow.py`'s `--vocab`: for any class in `classes`, every page
emits the canonical definition, so Webflow merges by name with no duplicate.

Project-agnostic: pass a sources manifest (page name -> approved source HTML)
via --sources. Generate the no-`--avoid` raw payloads once per page with
html_to_webflow.py --split into RAW before running this.

Usage:
  python build_vocab.py --sources .tmp/build-sources.json
  python build_vocab.py --sources .tmp/build-sources.json --raw-dir .tmp/_raw \
      --out .tmp/style-vocabulary.json

Sources manifest shape:
  { "index": "../05-design-revisions/.tmp/final-design/index.html",
    "invest": "../05-design-revisions/.tmp/final-design/invest.html" }
"""
import argparse
import json
import os
import re
import sys

from bs4 import BeautifulSoup

import html_to_webflow as htw

# Default raw-payload dir; override with --raw-dir. One subfolder per page,
# each holding a no-`--avoid` paste_00_full-page.html produced by html_to_webflow.py.
DEFAULT_RAW = ".tmp/_raw"


def source_class_names(path: str) -> set:
    soup = BeautifulSoup(open(path, encoding="utf-8").read(), "html.parser")
    names: set = set()
    for el in soup.find_all(True):
        for c in (el.get("class") or []):
            names.add(c)
    return names


def load_styles(page: str, raw_dir: str) -> dict:
    """page payload -> {name: style_record}; names duplicated within one page
    (ambiguous) are dropped so they never seed a bad canonical."""
    fp = os.path.join(raw_dir, page, "paste_00_full-page.html")
    t = open(fp, encoding="utf-8").read()
    m = re.search(r'<script type="application/json"[^>]*>(.*?)</script>', t, re.S)
    styles = json.loads(m.group(1))["payload"]["styles"]
    by_name: dict = {}
    dup: set = set()
    for s in styles:
        n = s["name"]
        if n in by_name:
            dup.add(n)
        else:
            by_name[n] = s
    for n in dup:
        by_name.pop(n, None)
    return by_name


def union_ordered(decl_lists):
    """Order-preserving union of [(prop, val), ...] lists.
    Returns (ok, merged_pairs); ok=False if a prop appears with >1 value."""
    seen: dict = {}
    order: list = []
    for pairs in decl_lists:
        for k, v in pairs:
            if k in seen:
                if seen[k] != v:
                    return False, None
            else:
                seen[k] = v
                order.append(k)
    return True, [(k, seen[k]) for k in order]


def merge_variants(variant_dicts):
    """[{bp: {styleLess}}, ...] -> (ok, {bp: {styleLess}}) by per-bp union."""
    order: list = []
    perbp: dict = {}
    for vd in variant_dicts:
        for bp, obj in vd.items():
            if bp not in perbp:
                perbp[bp] = []
                order.append(bp)
            perbp[bp].append(htw._parse_decls(obj.get("styleLess", "")))
    out: dict = {}
    for bp in order:
        ok, merged = union_ordered(perbp[bp])
        if not ok:
            return False, None
        out[bp] = {"styleLess": htw._decls_to_styleless(merged)}
    return True, out


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--sources", required=True, metavar="JSON",
                    help="JSON manifest mapping page name -> approved source HTML path")
    ap.add_argument("--raw-dir", default=DEFAULT_RAW, metavar="DIR",
                    help=f"dir of no-avoid payloads, one subfolder per page (default: {DEFAULT_RAW})")
    ap.add_argument("--out", default=".tmp/style-vocabulary.json")
    args = ap.parse_args(argv)

    with open(args.sources, encoding="utf-8") as f:
        sources = json.load(f)
    if not isinstance(sources, dict) or not sources:
        sys.exit(f"--sources manifest must be a non-empty {{page: html_path}} object: {args.sources}")
    SOURCES = sources
    RAW = args.raw_dir

    source_names: set = set()
    for p, src in SOURCES.items():
        source_names |= source_class_names(src)

    data = {p: load_styles(p, RAW) for p in SOURCES}
    name_pages: dict = {}
    for p in SOURCES:
        for n in data[p]:
            if n in source_names:           # SOURCE classes only
                name_pages.setdefault(n, []).append(p)

    classes: dict = {}
    pending: dict = {}
    for n, pgs in sorted(name_pages.items()):
        if len(pgs) < 2:
            continue
        recs = [data[p][n] for p in pgs]
        combs = {r.get("comb", "") for r in recs}
        base_ok, base_merged = union_ordered(
            [htw._parse_decls(r.get("styleLess", "")) for r in recs])
        var_ok, var_merged = merge_variants([r.get("variants", {}) for r in recs])
        if len(combs) == 1 and base_ok and var_ok:
            classes[n] = {
                "comb": recs[0].get("comb", ""),
                "styleLess": htw._decls_to_styleless(base_merged),
                "variants": var_merged,
            }
        else:
            pending[n] = {"pages": {p: {
                "comb": data[p][n].get("comb", ""),
                "styleLess": data[p][n].get("styleLess", ""),
                "variants": data[p][n].get("variants", {}),
            } for p in pgs}}

    out = {"classes": classes, "pending": pending}
    os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=1)
    print(f"source class names across pages : {len(source_names)}")
    print(f"shared (>=2 pages) source classes: {len(name_pages)}")
    print(f"  RESOLVED canonical            : {len(classes)}")
    print(f"  PENDING (real value diffs)    : {len(pending)}")
    print(f"  pending names: {sorted(pending)}")
    print(f"-> {args.out}")


if __name__ == "__main__":
    main()
