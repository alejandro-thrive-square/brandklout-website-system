#!/usr/bin/env python3
"""
build_payloads.py — convert every packaged section into a Webflow clipboard
payload and a copy page, and collect the asset manifest the MCP pass needs.

`--no-resolve` is not an optimisation here, it is the whole point. In the
default (cascade-resolving) mode the converter derives Webflow class
definitions from the CSS it can see, and drops class attributes it found no
CSS for — which for these sections means most of them, because all the CSS
lives in the section's own <style data-embed>. Measured on implants/anatomy:
8 of 24 classes survived, so the anatomy steps, the chapter tag and the h2
would have pasted with no class to match and no styling at all.

In flat mode every class survives, every emitted style is EMPTY, and the
embedded stylesheet is the only thing painting the section. That is the
correct shape for this build:

  * nothing forks the client's existing classes (all names are `<pfx>-`),
  * nothing lands in the style panel for the client to accidentally "fix",
  * and the clamp()/calc(var())/svh/aspect-ratio the design is built on
    survives verbatim instead of being flattened into what the panel can hold.

  python build_payloads.py [--asset-base URL]
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SECTIONS = HERE / ".tmp" / "sections"
PAYLOAD = HERE / ".tmp" / "payload"
CONVERTER = HERE / "html_to_webflow.py"

PREFIX = {"implants": "imp", "aox": "aox", "veneers": "vnr",
          "emergency": "emg", "dentist-near-me": "dnm", "next-door": "nxd"}


INDEX_TMPL = """<!doctype html>
<meta charset="utf-8"><title>{page} — paste into Webflow</title>
<style>
 body{{font:15px/1.6 system-ui,sans-serif;margin:0;padding:2.5rem;background:#0e1219;color:#e8eef5}}
 h1{{font-size:1.4rem;margin:0 0 .4rem}} p{{color:#9fb0c4;max-width:70ch}}
 ol{{padding-left:1.4rem;max-width:70ch}} li{{margin:.55rem 0}}
 a{{color:#03c5ec}} code{{background:#1a2130;padding:.15rem .4rem;border-radius:4px}}
 .warn{{border-left:3px solid #fb8e28;padding:.6rem 1rem;background:rgba(251,142,40,.08);
        border-radius:0 8px 8px 0;margin:1.4rem 0;max-width:70ch}}
</style>
<h1>{page} — {n} pasteable sections</h1>
<p>Paste them in this order onto the target page in the Webflow Designer. Each one is
self-contained: it carries its own scoped CSS and JS inside the section, so it needs no
page-settings changes and cannot affect anything else on the page.</p>
<div class="warn"><strong>Paste into a scratch page first.</strong> Every class is namespaced
<code>{pfx}-</code> so it cannot merge with the client's existing classes, but the clipboard
format is reverse-engineered and a scratch page costs nothing.</div>
<ol>
{items}
</ol>
<p>Images still point at bare filenames. Upload the assets listed in
<code>assets.json</code> and re-run with <code>--asset-base</code>, or remap them after
pasting with the Webflow MCP.</p>
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--asset-base", default="")
    a = ap.parse_args()

    report, assets_all = [], {}
    for page in sorted(p.name for p in SECTIONS.iterdir() if p.is_dir()):
        manifest = json.loads((SECTIONS / page / "manifest.json").read_text(encoding="utf-8"))
        outdir = PAYLOAD / page
        outdir.mkdir(parents=True, exist_ok=True)
        # ---- the deliverable: ONE whole-page payload, single root ----------
        # --wrap nests everything under one page-wrapper Block. A MULTI-root
        # payload is what crashes the Designer; size is not the problem. This
        # is why the page ships as one paste rather than eleven.
        page_src = SECTIONS / page / "page.html"
        if a.asset_base:
            h = page_src.read_text(encoding="utf-8")
            h = re.sub(r'src="(?!https?://)([^"]+)"',
                       lambda m: f'src="{a.asset_base.rstrip("/")}/{m.group(1)}"', h)
            page_src = outdir / "_page.src.html"
            page_src.write_text(h, encoding="utf-8")

        whole = outdir / "whole"
        r = subprocess.run(
            [sys.executable, str(HERE / "html_to_webflow_wholepage.py"),
             "--html", str(page_src), "--page-prefix", PREFIX[page],
             "--no-resolve", "--wrap", "--wrap-class", f"{PREFIX[page]}-page",
             "--out", str(whole)],
            capture_output=True, text=True)
        if r.returncode != 0:
            print(f"  ! {page} WHOLE PAGE: {(r.stderr or r.stdout).strip()[-400:]}")
        else:
            print(f"  {page:<15} whole-page payload ok")

        items = []
        for entry in manifest:
            src = SECTIONS / page / f"{entry['section']}.html"
            if a.asset_base:
                html = src.read_text(encoding="utf-8")
                html = re.sub(r'src="(?!https?://)([^"]+)"',
                              lambda m: f'src="{a.asset_base.rstrip("/")}/{m.group(1)}"', html)
                src = outdir / f"_{entry['section']}.src.html"
                src.write_text(html, encoding="utf-8")

            jsonf = outdir / f"{entry['section']}.json"
            copyf = outdir / f"{entry['section']}.html"
            r = subprocess.run(
                [sys.executable, str(CONVERTER), "--html", str(src),
                 "--page-prefix", PREFIX[page], "--no-resolve",
                 "--out", str(jsonf), "--copy-page", str(copyf)],
                capture_output=True, text=True)
            if r.returncode != 0:
                print(f"  ! {page}/{entry['section']}: {r.stderr.strip()[:200]}")
                continue

            data = json.loads(jsonf.read_text(encoding="utf-8"))["payload"]
            # `<pfx>-br-line` is the converter's own class for rendering a <br>
            # as a block span. It is generated, not designed, it is one
            # `display:block`, and the section cannot render line breaks
            # without it — so it is the one permitted non-empty style. Anything
            # else means CSS escaped into the style panel.
            styled = [s["name"] for s in data["styles"]
                      if (s.get("styleLess") or "").strip()
                      and not s["name"].endswith("-br-line")]
            embeds = sum(1 for n in data["nodes"] if n.get("type") == "HtmlEmbed")
            row = {"page": page, "section": entry["section"], "root": entry["rootClass"],
                   "nodes": len(data["nodes"]), "styles": len(data["styles"]),
                   "nonEmptyStyles": styled, "embeds": embeds,
                   "bytes": jsonf.stat().st_size, "assets": entry["assets"]}
            report.append(row)
            for x in entry["assets"]:
                assets_all.setdefault(x, []).append(f"{page}/{entry['section']}")
            items.append(f'  <li><a href="{entry["section"]}.html" target="_blank">'
                         f'{entry["section"]}</a> &mdash; <code>.{entry["rootClass"]}</code>, '
                         f'{len(data["nodes"])} nodes, {embeds} embeds</li>')

        (outdir / "index.html").write_text(
            INDEX_TMPL.format(page=page, n=len(items), pfx=PREFIX[page],
                              items="\n".join(items)), encoding="utf-8")
        print(f"{page:<17} {len(items)} payloads")

    PAYLOAD.mkdir(parents=True, exist_ok=True)
    (PAYLOAD / "report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    (PAYLOAD / "assets.json").write_text(
        json.dumps({"note": "Upload each of these to the Webflow site, then re-run "
                            "build_payloads.py --asset-base <cdn-url>, or remap after "
                            "paste with the MCP asset tools.",
                    "assets": {k: sorted(set(v)) for k, v in sorted(assets_all.items())}},
                   indent=2), encoding="utf-8")

    dirty = [r for r in report if r["nonEmptyStyles"]]
    print(f"\n{len(report)} payloads -> {PAYLOAD}")
    print(f"unique assets to upload : {len(assets_all)}")
    print(f"sections emitting styles: {len(dirty)}  (must be 0 — the CSS belongs in the embed)")
    for r in dirty[:8]:
        print(f"  ! {r['page']}/{r['section']}: {r['nonEmptyStyles'][:6]}")
    return 1 if dirty else 0


if __name__ == "__main__":
    sys.exit(main())
