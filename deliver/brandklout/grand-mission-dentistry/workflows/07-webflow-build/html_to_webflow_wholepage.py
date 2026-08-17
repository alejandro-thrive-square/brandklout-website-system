#!/usr/bin/env python3
"""
Whole-page variant of html_to_webflow.py.

`html_to_webflow.py --split` writes one copy page PER top-level section so the
Designer never receives a single huge paste (one big paste is known to crash
it). This script does the OPPOSITE on purpose: it runs the SAME conversion
engine (same globally-consistent class naming, same `--avoid` namespace
collision handling against already-pasted pages), then MERGES every section
slice into ONE payload and writes a SINGLE copy page so the whole page can be
pasted in one movement.

This is an experiment. The split path exists because one whole-page paste can
crash the Designer; use this only when you explicitly want the one-paste flow
and have a Webflow backup to restore from.

It imports the real engine from html_to_webflow.py rather than copying it, so
the 2300-line core stays the single source of truth and this never drifts.

Usage mirrors the `--split` flow, but `--out` is a FOLDER (so the companion
artifacts land beside the copy page, exactly like a split folder):

  python html_to_webflow_wholepage.py \
    --html ../05-design-revisions/.tmp/final-design/index.html \
    --asset-base "https://<DEPLOYED_SITE_URL>" \
    --var-map .tmp/sell/webflow-variable-map.json \
    --avoid .tmp/index,.tmp/invest,.tmp/scale \
    --out .tmp/sell-wholepage

Then open .tmp/sell-wholepage/paste_00_full-page.html, click the button, and
paste once into the blank Webflow page.
"""
import argparse
import copy
import json
import os
import shutil

import html_to_webflow as htw


def merge_sections(sections):
    """Concatenate every section's nodes in order and union their styles/assets
    (deduped by identity, global order preserved) into one XscpData payload.

    build_sliced() filtered self.styles per section but kept the SAME dict
    objects across sections (shared utilities + any --avoid renames apply by
    reference), so deduping on _id rebuilds the full used-style set in the
    original global order — i.e. exactly what a single build() pass would emit,
    but with namespace-avoidance renames already baked in."""
    nodes: list = []
    styles: list = []
    assets: list = []
    seen_style: set = set()
    seen_asset: set = set()
    for _label, payload in sections:
        p = payload["payload"]
        nodes.extend(p["nodes"])
        for s in p["styles"]:
            if s["_id"] not in seen_style:
                seen_style.add(s["_id"])
                styles.append(s)
        for a in p["assets"]:
            aid = a.get("_id") or json.dumps(a, sort_keys=True)
            if aid not in seen_asset:
                seen_asset.add(aid)
                assets.append(a)
    return htw.WebflowBuilder._envelope(nodes, styles, assets)


def count_roots(nodes) -> int:
    """Top-level nodes — those never referenced as another node's child."""
    referenced = set()
    for nd in nodes:
        for c in nd.get("children", []):
            referenced.add(c)
    return sum(1 for nd in nodes if nd["_id"] not in referenced)


def wrap_single_root(payload, class_name: str = "page-wrapper"):
    """Nest every top-level section under ONE new Block, so the payload has a
    SINGLE root node — the structure Relume's whole-page captures use and the
    one the Designer ingests without crashing (our 16-root merge crashes; see
    the fixture analysis). The wrapper is a plain unstyled <div>, transparent to
    layout (block flow, no overflow/transform/contain — sticky and fixed
    descendants are unaffected) but it adds one nesting level inside Body."""
    p = payload["payload"]
    nodes = p["nodes"]
    referenced = set()
    for nd in nodes:
        for c in nd.get("children", []):
            referenced.add(c)
    root_ids = [nd["_id"] for nd in nodes if nd["_id"] not in referenced]

    # Build the wrapper's data block from scratch. Deep-copying the first Block's
    # data (the previous approach) dragged its `attr` along, so the wrapper
    # inherited `id="nav"` from the header — two elements then shared that id,
    # `document.getElementById('nav')` returned the unstyled wrapper, and the
    # nav's `.solid` scroll state was toggled onto the wrong element (so the nav
    # background never changed). Duplicate ids also break every other
    # getElementById hook on the page.
    data = htw.WebflowBuilder._common_data()
    data["tag"] = "div"

    # `classes` holds style **IDs**, not names. Passing the literal name emitted
    # a dangling reference: the Designer resolved it to nothing, so the wrapper
    # arrived unstyled and `page-wrapper` never existed as a class.
    classes = []
    if class_name:
        existing = next((s for s in p["styles"] if s.get("name") == class_name
                         and not s.get("comb")), None)
        if existing is None:
            existing = {
                "_id": htw.new_id(), "fake": False, "type": "class",
                "name": class_name, "namespace": "", "comb": "",
                "styleLess": "", "variants": {},
                "children": [], "origin": None, "selector": None,
            }
            p["styles"].append(existing)
        classes = [existing["_id"]]

    wrapper = {
        "_id": htw.new_id(),
        "type": "Block",
        "tag": "div",
        "classes": classes,
        "children": root_ids,
        "data": data,
    }
    p["nodes"] = [wrapper] + nodes
    return payload


def main(argv=None):
    ap = argparse.ArgumentParser(
        description="HTML+CSS -> ONE whole-page Webflow clipboard copy page")
    ap.add_argument("--html", required=True, help="HTML file")
    ap.add_argument("--css", help="CSS file (optional; <style> tags also work)")
    ap.add_argument("--no-resolve", action="store_true",
                    help="disable the cascade resolver (flat class mode)")
    ap.add_argument("--asset-base", dest="asset_base", default="",
                    help="base URL prepended to relative image src")
    ap.add_argument("--preserve-vars", action="store_true",
                    help="keep var(--token) references in styleLess (debugging)")
    ap.add_argument("--var-map",
                    help="JSON map: source CSS variable -> Webflow cssName/variableId")
    ap.add_argument("--out", required=True, metavar="DIR",
                    help="output FOLDER; receives paste_00_full-page.html plus "
                         "the same companion artifacts a split folder gets")
    ap.add_argument("--avoid", metavar="DIR[,DIR...]",
                    help="split folders of pages ALREADY pasted into the same "
                         "Webflow site; colliding auto-named classes are renamed")
    ap.add_argument("--avoid-suffix", default=None,
                    help="suffix for renamed colliding classes "
                         "(default: the --out folder name)")
    ap.add_argument("--wrap", action="store_true",
                    help="nest all sections under ONE page-wrapper Block so the "
                         "payload has a SINGLE root like Relume's whole-page "
                         "captures (the multi-root merge crashes the Designer). "
                         "Adds one wrapping <div> inside Body.")
    ap.add_argument("--wrap-class", default="page-wrapper",
                    help="class name for the --wrap wrapper (default page-wrapper; "
                         "pass empty string for an unclassed div)")
    ap.add_argument("--vocab", metavar="FILE",
                    help="shared-class vocabulary manifest (build_vocab.py output). "
                         "Shared SOURCE classes emit the canonical definition so "
                         "Webflow merges by name instead of forking duplicates. "
                         "Supersedes --avoid for cross-page consistency.")
    ap.add_argument("--page-prefix", metavar="NAME", default=None,
                    help="prefix for tag-derived AUTO-NAMES (`div`, `p`, ...) so "
                         "page-specific residual classes never collide across "
                         "pages (default: the --out folder name minus -wholepage). "
                         "Pass empty string to disable.")
    args = ap.parse_args(argv)

    with open(args.html, encoding="utf-8") as f:
        html = f.read()
    css = ""
    if args.css:
        with open(args.css, encoding="utf-8") as f:
            css = f.read()
    variable_entries = htw.load_variable_map_entries(args.var_map)
    variable_css_names = htw.load_variable_css_map(args.var_map)

    # shared-class-system mode: canonical vocab + per-page auto-name prefix
    vocab = None
    if args.vocab:
        with open(args.vocab, encoding="utf-8") as f:
            vocab = json.load(f).get("classes", {})
    if args.page_prefix is None:
        page_prefix = os.path.basename(os.path.normpath(args.out))
        if page_prefix.endswith("-wholepage"):
            page_prefix = page_prefix[:-len("-wholepage")]
    else:
        page_prefix = args.page_prefix

    os.makedirs(args.out, exist_ok=True)

    # --- same section build + namespace-avoidance as the --split path -------- #
    rename_map: dict = {}
    state_renames: dict = {}
    reserved: dict = {}
    js_protected: set = set()
    _state_tokens: set = set()
    extra_shared: set = set()
    if args.avoid:
        avoid_dirs = [d.strip() for d in args.avoid.split(",") if d.strip()]
        reserved = htw.load_reserved_styles(avoid_dirs)
        js_protected, _state_tokens = htw.protected_class_tokens(html)
        extra_shared = {n for n in js_protected if n in reserved}

    sections = htw.convert_sections(
        html, css, resolve=not args.no_resolve, asset_base=args.asset_base,
        preserve_vars=args.preserve_vars, variable_css_names=variable_css_names,
        extra_shared_utility_names=extra_shared,
        page_prefix=page_prefix, vocab=vocab)

    if args.avoid:
        suffix = args.avoid_suffix or os.path.basename(os.path.normpath(args.out))
        rename_map = htw.apply_namespace_avoidance(
            sections, reserved, js_protected, suffix)
        state_renames = {o: n for o, n in rename_map.items()
                         if o in _state_tokens}

    # --- merge every slice into ONE payload + ONE copy page ----------------- #
    payload = merge_sections(sections)
    if args.wrap:
        wrap_single_root(payload, args.wrap_class)
    copy_page = os.path.join(args.out, "paste_00_full-page.html")
    htw.write_copy_page(json.dumps(payload, separators=(",", ":")), copy_page)

    p = payload["payload"]
    roots = count_roots(p["nodes"])
    print(f"{'whole page':20}{len(p['nodes']):>6} nodes  "
          f"{len(p['styles'])} styles  {len(p['assets'])} assets  {roots} root(s)")
    print(f"  merged from {len(sections)} section(s) -> {copy_page}")
    if args.wrap:
        print(f"  wrapped under one '{args.wrap_class or '(unclassed)'}' Block "
              f"-> single root (Relume-style)")
    if rename_map:
        print(f"  renamed {len(rename_map)} colliding class(es) via --avoid")
    print("\nOpen the page, click the button, then paste ONCE into the blank "
          "Webflow page.")

    # --- companion artifacts, identical to a split folder ------------------- #
    htw.write_text_artifacts(html, args.out, state_renames, css=css)
    htw.write_variable_artifacts(htw.collect_css(html, css), args.out)
    if args.css:
        site_css_copy = os.path.join(args.out, "site.css")
        shutil.copy(args.css, site_css_copy)
        print(f"copied source CSS -> {site_css_copy}")

    binding_sections = sections
    if not args.preserve_vars:
        binding_sections = htw.convert_sections(
            html, css, resolve=not args.no_resolve, asset_base=args.asset_base,
            preserve_vars=True, variable_css_names=variable_css_names,
            extra_shared_utility_names=extra_shared,
            page_prefix=page_prefix, vocab=vocab)
        if rename_map:
            seen_ids = set()
            for _label, bpayload in binding_sections:
                for s in bpayload["payload"]["styles"]:
                    if id(s) not in seen_ids:
                        seen_ids.add(id(s))
                        if s["name"] in rename_map:
                            s["name"] = rename_map[s["name"]]
    htw.write_style_variable_bindings(
        binding_sections, args.out, variable_css_names, variable_entries)


if __name__ == "__main__":
    main()
