#!/usr/bin/env python3
"""Four-site benchmark summary for West LA Implants.

Reads the four `site-data.json` files produced by `scrape_site.py` and emits a
single site-level comparison row per site.

Usage (from the .tmp folder):

    python scrapers/compare_four.py --out gap-analysis/four-site-summary.csv

Columns are deliberately site-level only. Page-level evidence stays in
`page-inventory-*.csv`; the homepage-level comparison lives in
`gap-analysis/HOMEPAGE-GAP-ANALYSIS.md`.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import statistics
from pathlib import Path

HERE = Path(__file__).resolve().parent
TMP = HERE.parent

SITES = [
    ("West LA Implants (client)", "westlaimplants.com", TMP / "current-site-scrape" / "site-data.json"),
    ("Wilshire Oral Surgery", "wilshireoralsurgery.com", TMP / "competitor-scrape" / "wilshireoralsurgery" / "site-data.json"),
    ("Santa Monica Center for Oral Surgery", "santamonicaoms.com", TMP / "competitor-scrape" / "santamonicaoms" / "site-data.json"),
    ("Implant Center LA / Wilshire Smile Studio", "implantcenterlosangeles.com", TMP / "competitor-scrape" / "implantcenterlosangeles" / "site-data.json"),
]

# Westside / LA-basin neighbourhood tokens used to detect a service-area page.
NEIGHBORHOODS = [
    "brentwood", "century-city", "culver-city", "mar-vista", "palms",
    "santa-monica", "sawtelle", "west-los-angeles", "westwood", "beverly-hills",
    "west-hollywood", "pacific-palisades", "marina-del-rey", "venice",
]

# Service lines counted as "owned" when a designed (non-blog) page's URL, title
# or h1 names them.
SERVICE_LINES = {
    "dental implants": r"dental\s*-?\s*implant",
    "all-on-4 / full arch": r"all[\s-]*on[\s-]*(4|four|x)|full[\s-]*arch|full[\s-]*mouth",
    "implant-supported dentures / hybrid / zirconia": r"implant[\s-]*supported|hybrid|zirconia|denture",
    "bone grafting / sinus / ridge": r"bone[\s-]*graft|sinus|ridge[\s-]*aug",
    "wisdom teeth": r"wisdom",
    "sedation / anesthesia": r"sedation|anesthesia|anaesthesia",
    "cosmetic / veneers / whitening / Invisalign": r"cosmetic|veneer|lumineer|whiten|invisalign|smile[\s-]*makeover",
    "general dentistry": r"general[\s-]*dentist|periodont|hygien",
    "jaw surgery / TMJ / facial trauma / pathology": r"orthognathic|jaw[\s-]*surgery|tmj|facial[\s-]*trauma|patholog|biops",
    "robotic / technology imaging": r"robotic|yomi|cone[\s-]*beam|3d[\s-]*imaging|technolog",
    "financing / insurance / cost": r"financ|insurance|cost|afford|pricing|payment",
}

PRICE_RE = re.compile(r"\$\s?\d[\d,]*")
FAQ_RE = re.compile(r"frequently\s+asked|^faq\b|\bfaqs?\b", re.I)


def load(path: Path) -> list[dict]:
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)


def page_haystack(rec: dict) -> str:
    bits = [
        rec.get("url", ""),
        rec.get("slug", ""),
        (rec.get("seo") or {}).get("title_tag", ""),
        " ".join(rec.get("h1") or []),
    ]
    return " ".join(bits).lower()


def is_blog(rec: dict) -> bool:
    """A blog *post*. The blog index itself counts as a designed page, which is
    how `compare_content.py` counted it, so the numbers stay comparable with the
    existing CONTENT-GAP-ANALYSIS tables."""
    slug = (rec.get("slug") or "").lower()
    if slug in {"blog", "blogs"}:
        return False
    kind = (rec.get("kind") or "").lower()
    if kind in {"post", "blog", "article"}:
        return True
    url = (rec.get("url") or "").lower()
    return "/blog" in url or slug.startswith("blog-")


def is_archive(rec: dict) -> bool:
    url = (rec.get("url") or "").lower()
    slug = (rec.get("slug") or "").lower()
    return (
        "/category/" in url
        or "/author/" in url
        or "/tag/" in url
        or slug.startswith("category-")
        or slug.startswith("author-")
    )


def has_price(rec: dict) -> bool:
    """A published treatment price, not a credit limit or a phone number."""
    body = rec.get("body_markdown") or ""
    for m in PRICE_RE.finditer(body):
        # window around the figure, to screen out lender credit limits
        start = max(0, m.start() - 140)
        window = body[start:m.end() + 140].lower()
        if any(w in window for w in ("credit limit", "up to $", "loan", "borrow", "financing up")):
            continue
        return True
    return False


def has_faq(rec: dict) -> bool:
    for h in rec.get("headings") or []:
        if h.get("level") in {"h1", "h2", "h3"} and FAQ_RE.search(h.get("text") or ""):
            return True
    return False


def neighborhood_page(rec: dict) -> bool:
    if is_blog(rec) or is_archive(rec):
        return False
    url = (rec.get("url") or "").lower()
    slug = (rec.get("slug") or "").lower()
    target = url + " " + slug
    return any(n in target for n in NEIGHBORHOODS)


def summarise(label: str, domain: str, path: Path) -> dict:
    recs = load(path)
    designed = [r for r in recs if not is_blog(r) and not is_archive(r)]
    blogs = [r for r in recs if is_blog(r)]
    words = [int(r.get("word_count") or 0) for r in recs]
    home = next((r for r in recs if (r.get("slug") or "") == "home"), recs[0])

    services = []
    for name, pattern in SERVICE_LINES.items():
        rx = re.compile(pattern)
        hits = sum(1 for r in designed if rx.search(page_haystack(r)))
        if hits:
            services.append(name)

    jsonld_pages = sum(1 for r in recs if r.get("jsonld"))

    return {
        "site": label,
        "domain": domain,
        "urls_crawled": len(recs),
        "designed_pages": len(designed),
        "blog_posts": len(blogs),
        "archive_pages": len(recs) - len(designed) - len(blogs),
        "total_words": sum(words),
        "avg_words_per_page": round(statistics.mean(words)) if words else 0,
        "median_words_per_page": round(statistics.median(words)) if words else 0,
        "homepage_words": int(home.get("word_count") or 0),
        "homepage_images": int(home.get("image_count") or 0),
        "homepage_has_form": "yes" if home.get("forms") else "no",
        "neighborhood_pages": sum(1 for r in recs if neighborhood_page(r)),
        "service_lines_owned": len(services),
        "service_lines": "; ".join(services),
        "pages_with_published_price": sum(1 for r in recs if has_price(r)),
        "pages_with_faq_block": sum(1 for r in recs if has_faq(r)),
        "pages_with_jsonld": jsonld_pages,
        "distinct_images_sitewide": len({i.get("src") for r in recs for i in (r.get("images") or []) if i.get("src")}),
        "pages_with_a_form": sum(1 for r in recs if r.get("forms")),
        "phones_on_homepage": "; ".join(home.get("phones") or []),
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(TMP / "gap-analysis" / "four-site-summary.csv"))
    args = ap.parse_args()

    rows = [summarise(*s) for s in SITES]

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)

    for r in rows:
        print(f"--- {r['site']} ({r['domain']})")
        for k, v in r.items():
            if k in {"site", "domain"}:
                continue
            print(f"    {k}: {v}")
    print(f"\nwrote {out}")


if __name__ == "__main__":
    main()
