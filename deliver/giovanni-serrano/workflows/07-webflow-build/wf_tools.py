"""Webflow build diagnostics — one tool, scenario subcommands.

Usage:
  python wf_tools.py qa .tmp/<page> [--against .tmp/<other>,...]
      Payload QA (directive section B) for one page's split folder, plus the
      cross-page collision check when --against lists other built pages.

  python wf_tools.py collisions .tmp/<pageA> .tmp/<pageB> [...]
      Report class names that exist in more than one page's payloads with
      DIFFERENT definitions (Webflow merges by name site-wide; the first
      pasted definition wins, silently breaking later pages).

  python wf_tools.py inspect <paste_file.html|.tmp/<page>> [--name X] [--id Y] [--text T]
      Dump style records and node summaries from payloads. Filter by class
      name, element id, or text content.

  python wf_tools.py expect "<source.html>" --out .tmp/<page>-expect.json
      Build a live-verification expectations file from the approved source
      (section ids, hook counts, reveal counts) and print a browser audit
      JS snippet that returns the live counterparts as JSON.

  python wf_tools.py audit-diff .tmp/<page>-expect.json live.json
      Diff expectations against a saved browser audit result.
"""
import argparse
import glob
import json
import os
import re
import sys


# --------------------------------------------------------------------------- #
# Shared payload helpers
# --------------------------------------------------------------------------- #

def load_payloads(path: str) -> dict:
    """{filename: payload} from a paste_*.html file or a split folder."""
    if os.path.isdir(path):
        files = sorted(glob.glob(os.path.join(path, "paste_*.html")))
    else:
        files = [path]
    assert files, f"no paste files found at {path}"
    out = {}
    for fp in files:
        with open(fp, encoding="utf-8") as f:
            m = re.search(r'<script type="application/json"[^>]*>(.*?)</script>',
                          f.read(), re.S)
        out[os.path.basename(fp)] = json.loads(m.group(1))
    return out


def style_signature(style: dict) -> str:
    return (style.get("styleLess", "") +
            json.dumps(style.get("variants", {}), sort_keys=True))


def page_class_signatures(split_dir: str) -> dict:
    """name -> {signature: [files]} across one page's payloads."""
    sigs: dict = {}
    for fname, p in load_payloads(split_dir).items():
        for s in p["payload"]["styles"]:
            sigs.setdefault(s["name"], {}).setdefault(
                style_signature(s), []).append(fname)
    return sigs


# --------------------------------------------------------------------------- #
# qa — directive section B payload checks
# --------------------------------------------------------------------------- #

def cmd_qa(args) -> int:
    split_dir = os.path.abspath(args.dir)
    tmp = os.path.dirname(split_dir)
    payloads = load_payloads(split_dir)
    fail = 0

    bad = []
    for name, p in payloads.items():
        for n in p["payload"]["nodes"]:
            if isinstance(n.get("v"), str) and ("\\2014" in n["v"] or "\\20 " in n["v"]):
                bad.append((name, n["v"][:60]))
    print(f"[1] literal CSS escapes in text nodes: {len(bad)}")
    for b in bad[:10]:
        print("    ", b)
    fail += bool(bad)

    sigs = {}
    for name, p in payloads.items():
        for s in p["payload"]["styles"]:
            key = (s["name"], s.get("comb", ""))
            sigs.setdefault(key, {}).setdefault(
                style_signature(s), []).append(name)
    conflicts = {k: v for k, v in sigs.items() if len(v) > 1}
    print(f"[2] cross-file class conflicts: {len(conflicts)}")
    for k, v in list(conflicts.items())[:10]:
        print("    ", k, "->", {sig[:40]: fs[:3] for sig, fs in v.items()})
    fail += bool(conflicts)

    with open(os.path.join(tmp, "animation-manifest.json"), encoding="utf-8") as f:
        manifest = json.load(f)
    all_ids, all_classes = set(), set()
    for p in payloads.values():
        cls_by_id = {s["_id"]: s["name"] for s in p["payload"]["styles"]}
        for n in p["payload"]["nodes"]:
            data = n.get("data", {})
            if data.get("attr", {}).get("id"):
                all_ids.add(data["attr"]["id"])
            for a in data.get("xattr", []):
                if a.get("name") == "id":
                    all_ids.add(a.get("value"))
            for cid in n.get("classes", []):
                if cid in cls_by_id:
                    all_classes.add(cls_by_id[cid])
            v = n.get("v") or ""
            if isinstance(v, str):
                for m2 in re.finditer(r'id="([^"]+)"', v):
                    all_ids.add(m2.group(1))
                for m2 in re.finditer(r'class="([^"]+)"', v):
                    all_classes.update(m2.group(1).split())
    # Only ids and class tokens the custom code QUERIES must exist verbatim.
    # manifest["classes"] is the full source inventory and is informational.
    missing = []
    for sel in manifest.get("querySelectors", []):
        for t in re.findall(r"#([\w-]+)", sel):
            if t not in all_ids:
                missing.append(("id", t, sel))
        for t in re.findall(r"\.([\w-]+)", sel):
            if t not in all_classes:
                missing.append(("class", t, sel))
    for i in manifest.get("ids", []):
        if i not in all_ids:
            missing.append(("id", i, "(manifest ids)"))
    missing = sorted(set(missing))
    print(f"[3] missing JS hooks: {len(missing)}")
    for m3 in missing[:20]:
        print("    ", m3)
    fail += bool(missing)

    bad_roots = []
    for name, p in payloads.items():
        styles_by_id = {s["_id"]: s for s in p["payload"]["styles"]}
        children = set()
        for n in p["payload"]["nodes"]:
            children.update(n.get("children", []))
        roots = [n for n in p["payload"]["nodes"]
                 if n["_id"] not in children and n.get("type") not in ("Text",)]
        for r in roots:
            cls = r.get("classes", [])
            if cls and cls[0] in styles_by_id:
                if "overflow" in styles_by_id[cls[0]].get("styleLess", ""):
                    bad_roots.append((name, styles_by_id[cls[0]]["name"]))
    print(f"[4] section roots with overflow on first class: {len(bad_roots)}")
    for b in bad_roots:
        print("    ", b)
    fail += bool(bad_roots)

    forms = []
    for name, p in payloads.items():
        for n in p["payload"]["nodes"]:
            if n.get("type") == "HtmlEmbed":
                v = n.get("v", "")
                if "<form" in v.lower():
                    forms.append((name, len(v),
                                  v.lstrip().lower().startswith("<style")))
    print(f"[5] form embeds: {len(forms)}")
    for name, ln, has_style in forms:
        ok = has_style and ln < 10000
        print(f"     {name}: {ln} chars, style prefix={has_style} -> "
              f"{'OK' if ok else 'FAIL'}")
        fail += not ok

    if args.against:
        dirs = [d.strip() for d in args.against.split(",") if d.strip()]
        accept = {a.strip() for a in (args.accept or "").split(",") if a.strip()}
        n_coll = _report_collisions([split_dir] + dirs, label="[6]",
                                    accept=accept)
        fail += bool(n_coll)
    else:
        print("[6] cross-page collisions: skipped (no --against). Pass the "
              "split folders of every page already pasted into the same site.")

    print("\nRESULT:", "FAIL" if fail else "ALL CHECKS PASSED")
    return 1 if fail else 0


# --------------------------------------------------------------------------- #
# collisions — cross-page merge-by-name audit
# --------------------------------------------------------------------------- #

def _report_collisions(dirs: list, label: str = "", accept: set = frozenset()) -> int:
    per_page = {d: page_class_signatures(d) for d in dirs}
    names: dict = {}
    for d, sigs in per_page.items():
        for name, sigmap in sigs.items():
            names.setdefault(name, {})[d] = set(sigmap)
    collisions = {}
    accepted = []
    for name, by_dir in names.items():
        if len(by_dir) < 2:
            continue
        all_sigs = set().union(*by_dir.values())
        if len(all_sigs) > 1:
            if name in accept:
                accepted.append(name)
            else:
                collisions[name] = by_dir
    if accepted:
        print(f"{label} accepted (reviewed-benign) collisions: "
              + ", ".join(sorted(accepted)))
    print(f"{label} cross-page collisions (same class name, different "
          f"definition): {len(collisions)}")
    for name in sorted(collisions)[:40]:
        pages = ", ".join(os.path.basename(os.path.normpath(d))
                          for d in collisions[name])
        print(f"     {name}  ({pages})")
    if len(collisions) > 40:
        print(f"     ... and {len(collisions) - 40} more")
    if collisions:
        print("     -> regenerate the newer page with --avoid pointing at the "
              "older pages' split folders.")
    return len(collisions)


def cmd_collisions(args) -> int:
    accept = {a.strip() for a in (args.accept or "").split(",") if a.strip()}
    return 1 if _report_collisions(args.dirs, accept=accept) else 0


# --------------------------------------------------------------------------- #
# inspect — payload explorer
# --------------------------------------------------------------------------- #

def cmd_inspect(args) -> int:
    payloads = load_payloads(args.path)
    for fname, p in payloads.items():
        styles = {s["_id"]: s for s in p["payload"]["styles"]}
        hits = []
        for n in p["payload"]["nodes"]:
            cls = [styles[c]["name"] for c in n.get("classes", []) if c in styles]
            nid = n.get("data", {}).get("attr", {}).get("id", "")
            text = n.get("v") if isinstance(n.get("v"), str) else ""
            if args.name and args.name not in cls:
                continue
            if args.id and args.id != nid:
                continue
            if args.text and args.text not in text:
                continue
            if not (args.name or args.id or args.text) and n.get("type") == "Text":
                continue
            hits.append((n.get("tag"), n.get("type"), nid, cls,
                         (text or "")[:50]))
        if hits:
            print(f"--- {fname} ({len(hits)} nodes)")
            for h in hits[: args.limit]:
                print("   ", h)
        if args.name:
            for s in p["payload"]["styles"]:
                if s["name"] == args.name:
                    print(f"    style '{s['name']}' comb='{s.get('comb','')}' "
                          f"styleLess: {s.get('styleLess','')[:200]}")
                    for bp, v in (s.get("variants") or {}).items():
                        print(f"      [{bp}] {v.get('styleLess','')[:160]}")
    return 0


# --------------------------------------------------------------------------- #
# expect / audit-diff — live verification without ad-hoc scripts
# --------------------------------------------------------------------------- #

AUDIT_JS = """(() => {
  const E = %s;  // expectations
  const live = { visibility: document.visibilityState, focus: document.hasFocus(),
                 warnings: [] };
  if (document.visibilityState !== 'visible')
    live.warnings.push('TAB NOT VISIBLE: transitions/IntersectionObserver are frozen; reveal results are meaningless');
  live.sectionIds = [...document.querySelectorAll('section')].map(s => s.id || '(none)');
  live.missingIds = E.ids.filter(i => !document.getElementById(i));
  live.hookCounts = Object.fromEntries(E.hookSelectors.map(s => {
    try { return [s, document.querySelectorAll(s).length]; } catch (e) { return [s, 'BAD SELECTOR']; }
  }));
  live.reveals = {
    total: document.querySelectorAll('.reveal, .reveal-stagger').length,
    revealed: document.querySelectorAll('.reveal.in, .reveal-stagger.in').length,
    stuckInViewport: [...document.querySelectorAll('.reveal, .reveal-stagger')]
      .filter(el => { const r = el.getBoundingClientRect();
        return r.top < innerHeight && r.bottom > 0 && getComputedStyle(el).opacity === '0'; })
      .map(el => el.className).slice(0, 10)
  };
  const stylesTxt = [...document.querySelectorAll('style')].map(s => s.textContent || '');
  live.headCss = {
    fontImport: stylesTxt.some(s => s.indexOf('fonts.googleapis') !== -1),
    revealBoost: stylesTxt.some(s => s.indexOf('.in.in.in') !== -1),
    keyframes: stylesTxt.some(s => s.indexOf('@keyframes') !== -1),
    bodyOverflowX: getComputedStyle(document.body).overflowX,
    htmlOverflowX: getComputedStyle(document.documentElement).overflowX
  };
  live.probes = Object.fromEntries(Object.entries(E.probes || {}).map(([sel, props]) => {
    const el = document.querySelector(sel);
    if (!el) return [sel, 'MISSING'];
    const cs = getComputedStyle(el);
    return [sel, Object.fromEntries(props.map(p => [p, cs.getPropertyValue(p)]))];
  }));
  return JSON.stringify(live, null, 1);
})()"""

DEFAULT_PROBES = {
    "section.scene": ["padding-top", "background-color"],
    ".scene-head .sub": ["font-family", "font-style", "font-size"],
    ".reveal": ["opacity", "transform"],
}


def cmd_expect(args) -> int:
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import html_to_webflow as conv
    from bs4 import BeautifulSoup
    with open(args.source, encoding="utf-8") as f:
        html = f.read()
    _code, manifest = conv.extract_custom_code(html)
    soup = BeautifulSoup(html, "html.parser")
    expectations = {
        "source": os.path.abspath(args.source),
        "ids": manifest.get("ids", []),
        "hookSelectors": [s for s in manifest.get("querySelectors", [])
                          if not s.startswith("a[")],
        "sectionIds": [s.get("id") or "(none)"
                       for s in soup.find_all("section")],
        "revealCount": len(soup.select(".reveal, .reveal-stagger")),
        "probes": DEFAULT_PROBES,
    }
    out = args.out or (os.path.splitext(args.source)[0] + "-expect.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(expectations, f, indent=1)
    print(f"wrote {out}")
    print("\nRun this in the LIVE page's console (tab must be focused and "
          "visible), save the JSON it returns, then run audit-diff:\n")
    print(AUDIT_JS % json.dumps(expectations))
    return 0


def cmd_audit_diff(args) -> int:
    with open(args.expect, encoding="utf-8") as f:
        E = json.load(f)
    with open(args.live, encoding="utf-8") as f:
        L = json.load(f)
    fail = 0
    for w in L.get("warnings", []):
        print("WARNING:", w)
    if L.get("missingIds"):
        print(f"[ids] missing in live DOM: {L['missingIds']}")
        fail += 1
    exp_sections = [s for s in E["sectionIds"]]
    live_sections = L.get("sectionIds", [])
    if [s for s in exp_sections if s != "(none)"] != \
       [s for s in live_sections if s != "(none)"]:
        print(f"[sections] expected ids {exp_sections}")
        print(f"           live ids     {live_sections}")
        fail += 1
    for sel, n in (L.get("hookCounts") or {}).items():
        if n == 0 or n == "BAD SELECTOR":
            print(f"[hooks] '{sel}' -> {n}")
            fail += 1
    rv = L.get("reveals", {})
    if rv.get("total", 0) != E.get("revealCount"):
        print(f"[reveals] count live={rv.get('total')} "
              f"expected={E.get('revealCount')}")
        fail += 1
    if rv.get("stuckInViewport"):
        print(f"[reveals] stuck at opacity 0 in viewport: "
              f"{rv['stuckInViewport']}")
        fail += 1
    hc = L.get("headCss", {})
    for k in ("fontImport", "revealBoost", "keyframes"):
        if not hc.get(k):
            print(f"[headCss] {k} missing")
            fail += 1
    if hc.get("htmlOverflowX") not in (None, "visible"):
        print(f"[headCss] html overflow-x={hc['htmlOverflowX']} "
              f"(kills position:sticky page-wide; must be visible)")
        fail += 1
    for sel, vals in (L.get("probes") or {}).items():
        if vals == "MISSING":
            print(f"[probe] {sel}: MISSING")
            fail += 1
    print("\nRESULT:", "FAIL" if fail else "ALL CHECKS PASSED")
    return 1 if fail else 0


# --------------------------------------------------------------------------- #

def main(argv=None) -> int:
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("qa", help="payload QA for one page's split folder")
    p.add_argument("dir")
    p.add_argument("--against", help="comma-separated split folders of pages "
                                     "already pasted into the same site")
    p.add_argument("--accept", help="comma-separated class names whose "
                                    "cross-page collision was reviewed and "
                                    "is benign (identical intended values)")
    p.set_defaults(fn=cmd_qa)

    p = sub.add_parser("collisions", help="cross-page class collision audit")
    p.add_argument("dirs", nargs="+")
    p.add_argument("--accept", help="comma-separated reviewed-benign names")
    p.set_defaults(fn=cmd_collisions)

    p = sub.add_parser("inspect", help="explore payload nodes/styles")
    p.add_argument("path")
    p.add_argument("--name", help="filter by class name (also dumps the style)")
    p.add_argument("--id", help="filter by element id")
    p.add_argument("--text", help="filter by text content")
    p.add_argument("--limit", type=int, default=30)
    p.set_defaults(fn=cmd_inspect)

    p = sub.add_parser("expect", help="expectations + browser audit JS from source")
    p.add_argument("source")
    p.add_argument("--out")
    p.set_defaults(fn=cmd_expect)

    p = sub.add_parser("audit-diff", help="diff expectations vs live audit JSON")
    p.add_argument("expect")
    p.add_argument("live")
    p.set_defaults(fn=cmd_audit_diff)

    args = ap.parse_args(argv)
    return args.fn(args)


if __name__ == "__main__":
    sys.exit(main())
