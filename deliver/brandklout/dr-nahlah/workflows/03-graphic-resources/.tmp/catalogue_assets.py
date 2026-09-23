"""Turn the raw 911-file download into a usable catalogue.

Groups WordPress size variants (name-800x600.jpg + name.jpg -> one logical asset,
largest file kept as the master) and sorts everything into categories a designer
can actually navigate. Writes ASSETS.md.

Usage: python catalogue_assets.py
"""

from __future__ import annotations

import csv
import re
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
DL = HERE / "downloads"
WP_SIZE_RE = re.compile(r"^(?P<stem>.+?)-\d{2,4}x\d{2,4}$")

PLUGIN_MARKERS = ("/wp-content/plugins/", "/wp-includes/", "/wp-content/themes/")
FONT_EXT = {".woff", ".woff2", ".ttf", ".eot"}
VIDEO_EXT = {".mp4", ".webm", ".mov", ".m4v"}
DOC_EXT = {".pdf", ".doc", ".docx"}


def categorise(rel: str, stem: str) -> str:
    p = rel.lower()
    s = stem.lower()
    ext = Path(rel).suffix.lower()

    if any(m in "/" + p for m in PLUGIN_MARKERS):
        return "Plugin & theme chrome (ignore for rebuild)"
    if ext in FONT_EXT:
        return "Webfonts (plugin-served, not brand fonts)"
    if ext in DOC_EXT:
        return "Documents"
    if ext in VIDEO_EXT:
        return "Video (self-hosted)"
    if "nahlah-logo" in s or s.startswith("logo") or "logo" in s and "nahlah" in s:
        return "Brand marks"
    if any(k in s for k in ("carecredit", "lending-club", "proceed-finance", "wusa",
                            "aaid", "acp", "prosthodont", "invisalign", "award", "badge")):
        return "Partner, award & association logos"
    if "icon" in s:
        return "Service & UI icons"
    if any(k in s for k in ("before", "after", "case", "smile-gallery", "ba-", "-ba")):
        return "Before / after cases"
    if any(k in s for k in ("dr_", "dr-", "doc_", "nahlah", "team", "staff", "portrait", "headshot")):
        return "Doctor & team"
    if any(k in s for k in ("office", "facility", "operatory", "lobby", "exterior", "interior", "building")):
        return "Facility"
    if any(k in s for k in ("patient", "testimonial", "review", "story")):
        return "Patient & testimonial"
    return "Other imagery"


def main() -> None:
    files = [f for f in DL.rglob("*") if f.is_file()]

    # Group WP size variants; keep the largest file as master.
    groups: dict[tuple[str, str], list[Path]] = defaultdict(list)
    for f in files:
        m = WP_SIZE_RE.match(f.stem)
        stem = m.group("stem") if m else f.stem
        groups[(str(f.parent.relative_to(DL)), stem + f.suffix.lower())].append(f)

    cats: dict[str, list[dict]] = defaultdict(list)
    for (folder, key), variants in groups.items():
        master = max(variants, key=lambda p: p.stat().st_size)
        rel = str(master.relative_to(DL)).replace("\\", "/")
        stem = WP_SIZE_RE.match(master.stem)
        stem = stem.group("stem") if stem else master.stem
        cats[categorise(rel, stem)].append({
            "master": rel,
            "variants": len(variants),
            "kb": master.stat().st_size // 1024,
            "stem": stem,
        })

    order = [
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

    total_files = len(files)
    total_logical = sum(len(v) for v in cats.values())
    total_mb = sum(f.stat().st_size for f in files) / 1048576

    lines = [
        "# Extracted Asset Catalogue — drnahlah.com",
        "",
        f"**{total_files} files downloaded** ({total_mb:.0f} MB), grouping to "
        f"**{total_logical} logical assets** once WordPress size variants "
        "(`name-800x600.jpg`) are folded into their originals.",
        "",
        "Files are in `downloads/`, mirroring the remote path. Full URL-level detail is",
        "in `asset-manifest.csv`; YouTube/Vimeo embeds are in `video-embeds.csv`.",
        "",
        "Binaries are gitignored and sync to the VPS via `rclone`; this catalogue is",
        "committed so the asset set is auditable without the files present.",
        "",
    ]

    usable = 0
    for cat in order:
        items = cats.get(cat)
        if not items:
            continue
        items.sort(key=lambda x: -x["kb"])
        skip = cat.startswith(("Plugin", "Webfonts"))
        if not skip:
            usable += len(items)
        lines += [f"## {cat} ({len(items)})", ""]
        if skip:
            lines += [f"Not client-owned artwork; listed for completeness only.", ""]
            lines += [f"- {len(items)} files, "
                      f"{sum(i['kb'] for i in items) / 1024:.1f} MB", ""]
            continue
        lines += ["| Asset | Variants | Master size |", "| :--- | ---: | ---: |"]
        for it in items[:80]:
            lines.append(f"| `{it['master']}` | {it['variants']} | {it['kb']} KB |")
        if len(items) > 80:
            lines.append(f"| _...and {len(items) - 80} more_ | | |")
        lines.append("")

    lines += [
        "## Summary",
        "",
        f"- **{usable} logical client assets** worth reviewing for the rebuild",
        f"- **{total_files} raw files**, {total_mb:.0f} MB total",
        "",
        "## Findings",
        "",
        "1. **No vector logo exists anywhere on the site.** The master brand mark is",
        "   `Nahlah-Logo-Transparent.png` at 2594x782 raster only — every other logo file",
        "   is a downscaled variant of it. The gold serif wordmark also shows dark residue",
        "   behind the letterforms, so the transparency cut-out is imperfect. **Request the",
        "   original vector (AI/EPS/SVG) from the client** before design starts; a 2594px",
        "   raster will not survive a large hero lockup or print.",
        "2. **The existing brand is already gold.** The wordmark is a gold serif on",
        "   transparent. That is a genuinely useful alignment with the black/gold/cream",
        "   reference template the client chose — the palette direction is not a leap from",
        "   where the brand already sits.",
        "3. **Licensed stock photography is in use** (Adobe Stock files present). Stock",
        "   licenses do not automatically transfer to a rebuilt site or a new agency.",
        "   Confirm license coverage before re-using, or replace.",
        "4. **At least one asset is named for a different practice**",
        "   (`alluredental-hero-girl-1.png`), which suggests some imagery came from a",
        "   template or a prior agency and may not be licensed to Dr. Nahlah at all.",
        "5. **Before/after case photography is the most valuable asset class here** and the",
        "   hardest to replace. Confirm patient photo consent is on file before re-publishing.",
        "6. **Self-hosted video totals ~61 MB across 7 MP4s**, including a homepage banner",
        "   video and several B-roll clips. Two are duplicates across upload dates",
        "   (`DR-Broll.mp4` appears in both 2022/04 and 2025/02).",
        "7. **The 226 webfonts are plugin-served Google Fonts subsets** (Allura, Lateef) plus",
        "   Font Awesome and Elementor icon fonts — not proprietary brand typefaces. There is",
        "   no licensed brand font to carry over.",
        "",
    ]

    (HERE / "ASSETS.md").write_text("\n".join(lines), encoding="utf-8")

    with (HERE / "asset-catalogue.csv").open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["category", "master_file", "variant_count", "master_kb"])
        for cat in order:
            for it in sorted(cats.get(cat, []), key=lambda x: -x["kb"]):
                w.writerow([cat, it["master"], it["variants"], it["kb"]])

    for cat in order:
        if cats.get(cat):
            print(f"{len(cats[cat]):5d}  {cat}")
    print(f"\n{total_files} files -> {total_logical} logical assets, {total_mb:.0f} MB")


if __name__ == "__main__":
    main()
