# Promoted 2026-09-23 from bk-west-la-implants west-la-implants/workflows/01-content-intake/.tmp/scrapers/catalogue_assets.py
# (itself generalized from the bk-dr-nahlah 2026-07-30 pass). No client values: pass --site/--out.
"""Turn a raw download tree into a catalogue a designer can navigate.

Groups WordPress size variants (name-800x600.jpg + name.jpg -> one logical asset,
largest kept as master) and sorts into categories. Writes ASSETS.md (tables only -
the findings section is written by hand underneath) and asset-catalogue.csv.

Usage:
  python catalogue_assets.py --dir ../../03-graphic-resources/.tmp --site old-site.com
"""

from __future__ import annotations

import argparse
import csv
import re
from collections import defaultdict
from pathlib import Path

WP_SIZE_RE = re.compile(r"^(?P<stem>.+?)-\d{2,4}x\d{2,4}$")

PLUGIN_MARKERS = ("/wp-content/plugins/", "/wp-includes/", "/wp-content/themes/", "/_long/")
FONT_EXT = {".woff", ".woff2", ".ttf", ".eot", ".otf"}
VIDEO_EXT = {".mp4", ".webm", ".mov", ".m4v"}
DOC_EXT = {".pdf", ".doc", ".docx"}


def categorise(rel: str, stem: str) -> str:
    p = rel.lower()
    s = stem.lower()
    ext = Path(rel).suffix.lower()

    if ext in FONT_EXT:
        return "Webfonts (plugin-served, not brand fonts)"
    if any(m in "/" + p for m in PLUGIN_MARKERS):
        return "Plugin & theme chrome (ignore for rebuild)"
    if ext in DOC_EXT:
        return "Documents"
    if ext in VIDEO_EXT:
        return "Video (self-hosted)"
    if "logo" in s or "wordmark" in s or s.startswith(("wla", "west-la")):
        return "Brand marks"
    if any(k in s for k in ("carecredit", "care-credit", "lending", "proceed-finance", "alphaeon",
                            "aaid", "icoi", "abgd", "ada", "cda", "invisalign", "nobel", "straumann",
                            "yomi", "neocis", "award", "badge", "seal", "google", "yelp", "facebook",
                            "instagram", "youtube")):
        return "Partner, award & association logos"
    if "icon" in s or "favicon" in s:
        return "Service & UI icons"
    if any(k in s for k in ("before", "after", "case", "smile-gallery", "gallery", "ba-", "-ba")):
        return "Before / after cases"
    if any(k in s for k in ("dr_", "dr-", "doc_", "barrier", "team", "staff", "portrait", "headshot")):
        return "Doctor & team"
    if any(k in s for k in ("office", "facility", "operatory", "lobby", "exterior", "interior",
                            "building", "reception", "suite")):
        return "Facility"
    if any(k in s for k in ("patient", "testimonial", "review", "story")):
        return "Patient & testimonial"
    return "Other imagery"


ORDER = [
    "Brand marks",
    "Doctor & team",
    "Before / after cases",
    "Facility",
    "Patient & testimonial",
    "Service & UI icons",
    "Partner, award & association logos",
    "Video (self-hosted)",
    "Documents",
    "Other imagery",
    "Webfonts (plugin-served, not brand fonts)",
    "Plugin & theme chrome (ignore for rebuild)",
]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", required=True, help="the --out dir used by extract_assets.py")
    ap.add_argument("--site", required=True)
    args = ap.parse_args()

    here = Path(args.dir).resolve()
    dl = here / "downloads"
    files = [f for f in dl.rglob("*") if f.is_file()]

    groups: dict[tuple[str, str], list[Path]] = defaultdict(list)
    for f in files:
        m = WP_SIZE_RE.match(f.stem)
        stem = m.group("stem") if m else f.stem
        groups[(str(f.parent.relative_to(dl)), stem + f.suffix.lower())].append(f)

    cats: dict[str, list[dict]] = defaultdict(list)
    for (_folder, _key), variants in groups.items():
        master = max(variants, key=lambda p: p.stat().st_size)
        rel = str(master.relative_to(dl)).replace("\\", "/")
        m = WP_SIZE_RE.match(master.stem)
        stem = m.group("stem") if m else master.stem
        cats[categorise(rel, stem)].append({
            "master": rel, "variants": len(variants),
            "kb": master.stat().st_size // 1024, "stem": stem,
        })

    total_files = len(files)
    total_logical = sum(len(v) for v in cats.values())
    total_mb = sum(f.stat().st_size for f in files) / 1048576

    svgs = list((here / "inline-svg").glob("*.svg")) if (here / "inline-svg").exists() else []

    lines = [
        f"# Extracted Asset Catalogue - {args.site}",
        "",
        f"**{total_files} files downloaded** ({total_mb:.1f} MB), grouping to "
        f"**{total_logical} logical assets** once WordPress size variants "
        "(`name-800x600.jpg`) are folded into their originals. "
        f"**{len(svgs)} inline SVGs** were lifted out of the markup into `inline-svg/`.",
        "",
        "Files are in `downloads/`, mirroring the remote path. URL-level detail is in",
        "`asset-manifest.csv`; YouTube/Vimeo embeds are in `video-embeds.csv`.",
        "",
        "> Binaries are gitignored. This catalogue is committed so the asset set stays",
        "> auditable without the files present.",
        "",
    ]

    usable = 0
    for cat in ORDER:
        items = cats.get(cat)
        if not items:
            continue
        items.sort(key=lambda x: -x["kb"])
        skip = cat.startswith(("Plugin", "Webfonts"))
        if not skip:
            usable += len(items)
        lines += [f"## {cat} ({len(items)})", ""]
        if skip:
            lines += ["Not client-owned artwork; listed for completeness only.", "",
                      f"- {len(items)} files, {sum(i['kb'] for i in items) / 1024:.1f} MB", ""]
            continue
        lines += ["| Asset | Variants | Master size |", "| :--- | ---: | ---: |"]
        for it in items[:80]:
            lines.append(f"| `{it['master']}` | {it['variants']} | {it['kb']} KB |")
        if len(items) > 80:
            lines.append(f"| _...and {len(items) - 80} more_ | | |")
        lines.append("")

    lines += ["## Summary", "",
              f"- **{usable} logical client assets** worth reviewing for the rebuild",
              f"- **{total_files} raw files**, {total_mb:.1f} MB total", ""]

    (here / "ASSETS.md").write_text("\n".join(lines), encoding="utf-8")

    with (here / "asset-catalogue.csv").open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["category", "master_file", "variant_count", "master_kb"])
        for cat in ORDER:
            for it in sorted(cats.get(cat, []), key=lambda x: -x["kb"]):
                w.writerow([cat, it["master"], it["variants"], it["kb"]])

    for cat in ORDER:
        if cats.get(cat):
            print(f"{len(cats[cat]):5d}  {cat}")
    print(f"\n{total_files} files -> {total_logical} logical assets, {total_mb:.1f} MB")


if __name__ == "__main__":
    main()
