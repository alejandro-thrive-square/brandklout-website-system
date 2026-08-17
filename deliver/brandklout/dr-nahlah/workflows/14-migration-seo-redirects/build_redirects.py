#!/usr/bin/env python3
"""Build the drnahlah.com WordPress -> Webflow 301 redirect map.

Sources
-------
1. `01-content-intake/.tmp/current-site-scrape/site-data.json` - the 78 URLs that were
   live on the WordPress site at migration time (33 pages, 43 posts, 2 category archives).
2. Wayback Machine CDX for `drnahlah.com/*` - legacy URLs from earlier site generations
   that were already gone before the scrape but still hold inbound links.
3. `data_pages_tool.list_pages` on Webflow site `6a6b84cc7fe55ddeabc0b314` - the 11
   live destination pages.

Rules
-----
* Webflow already 301s `/foo/` -> `/foo` natively, so every path is emitted WITHOUT a
  trailing slash and slash-only variants are never emitted.
* A path that exists unchanged on the new site is NEVER emitted (it would be a loop).
* Output is a two-column CSV matching Webflow's "Import 301 redirects" dialog.

Usage: python build_redirects.py
"""

from __future__ import annotations

import csv
import json
import urllib.parse
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT_DIR = HERE / ".tmp"
SCRAPE = (
    HERE.parent
    / "01-content-intake"
    / ".tmp"
    / "current-site-scrape"
    / "site-data.json"
)

# Every page that exists on the rebuilt Webflow site. Anything not in here is not a
# legal redirect destination.
LIVE_PAGES = {
    "/",
    "/meet-dr-nahlah",
    "/dental-implants",
    "/all-on-4",
    "/veneers",
    "/smile-makeover",
    "/implant-cost",
    "/sedation-dentistry",
    "/smile-gallery",
    "/patient-stories",
    "/contact",
}

# ---------------------------------------------------------------------------
# 1. The 33 WordPress pages that were live at migration time.
# ---------------------------------------------------------------------------
PAGES = {
    # Practice / people -> the one bio page that absorbed all of them
    "/about": "/meet-dr-nahlah",
    "/dr-esam-nahlah": "/meet-dr-nahlah",
    "/our-team": "/meet-dr-nahlah",
    "/our-dental-facility": "/meet-dr-nahlah",
    "/tysons-study-club": "/meet-dr-nahlah",
    # Implant services
    "/dental-implants": "/dental-implants",
    "/all-on-4": "/all-on-4",
    "/implant-supported-dentures": "/all-on-4",
    "/dental-implant-faq": "/dental-implants",
    "/dental-crowns-and-bridges": "/dental-implants",
    "/oral-surgery": "/dental-implants",
    "/dental-conditions": "/dental-implants",
    # Cosmetic
    "/cosmetic-dentistry": "/smile-makeover",
    "/veneers": "/veneers",
    "/smile-makeover": "/smile-makeover",
    "/teeth-whitening": "/smile-makeover",
    # Comfort / urgent
    "/sedation-dentistry": "/sedation-dentistry",
    "/emergency-dentistry": "/contact",
    # Money
    "/cost-of-dental-implants": "/implant-cost",
    "/financing": "/implant-cost",
    # Proof
    "/smile-gallery": "/smile-gallery",
    "/testimonials": "/patient-stories",
    "/video-gallery": "/patient-stories",
    # Contact / admin
    "/contact": "/contact",
    "/patient-center": "/contact",
    "/doctor-referral": "/contact",
    "/free-event": "/contact",
    # Funnels
    "/veneer-survey-thank-you": "/veneers",
    "/implant-survey-thank-you": "/dental-implants",
    # Blog hub
    "/blog": "/dental-implants",
    # Legal - no equivalent on the new site
    "/privacy-policy": "/",
    "/terms-conditions": "/",
}

# ---------------------------------------------------------------------------
# 2. The 43 WordPress blog posts. There is no CMS blog on the new site, so each post
#    goes to the service page that best matches its search intent.
# ---------------------------------------------------------------------------
POSTS = {
    "/after-my-dental-implants-are-placed-how-will-i-know-if-i-have-peri-implantitis": "/dental-implants",
    "/all-on-four-your-questions": "/all-on-4",
    "/are-dental-implants-worth-the-cost": "/implant-cost",
    "/are-there-advantages-to-replacing-my-missing-teeth-with-dental-implants-in-mclean-va": "/dental-implants",
    "/are-there-factors-that-determine-which-type-of-dental-implant-procedure-i-can-get-treated-with": "/dental-implants",
    "/are-there-side-effects-to-dental-implant-procedures": "/dental-implants",
    "/can-anything-be-done-if-i-am-not-an-immediate-candidate-for-dental-implants": "/dental-implants",
    "/can-i-have-a-customized-new-smile-with-full-mouth-dental-implants": "/all-on-4",
    "/can-i-upgrade-my-smile-from-traditional-dentures-to-implant-supported-dentures": "/all-on-4",
    "/complete-teeth-replacement-the-perks-of-dental-implants-explained": "/all-on-4",
    "/considering-getting-treated-with-all-on-4-dental-implants-in-mclean-va-this-is-why-you-should": "/all-on-4",
    "/deciphering-dental-implants-your-guide-to-implant-dentistry-in-mclean-va": "/dental-implants",
    "/dental-implants-everything-you-need-to-know": "/dental-implants",
    "/discover-the-promising-world-of-teeth-implants-in-mclean-va": "/dental-implants",
    "/discovering-the-benefits-and-process-of-snap-on-dentures-in-mclean-va": "/all-on-4",
    "/do-i-need-a-full-mouth-dental-implant-consultation": "/all-on-4",
    "/exploring-the-world-of-dental-implants-placements-in-mclean-va": "/dental-implants",
    "/exploring-your-options-for-replacing-a-missing-tooth-the-advantage-of-dental-implants": "/dental-implants",
    "/have-multiple-missing-teeth-you-should-get-treated-with-multiple-dental-implants": "/dental-implants",
    "/how-exactly-do-implant-supported-dentures-in-mclean-va-benefit-my-smile": "/all-on-4",
    "/how-many-missing-teeth-can-dental-implants-replace": "/dental-implants",
    "/implant-vs-implant-clearing-the-confusion-on-dental-implants": "/dental-implants",
    "/integrating-treatment-dental-practices-into-your-dental-implant-procedure": "/dental-implants",
    "/longevity-of-dental-implants-causes-and-fixes-for-damages": "/dental-implants",
    "/navigating-the-path-to-smile-restoration-unveiling-the-secrets-of-implants-of-teeth": "/dental-implants",
    "/navigating-the-world-of-dental-implant-surgery-in-mclean-va": "/dental-implants",
    "/navigating-the-world-of-dental-implants-an-experts-guide": "/dental-implants",
    "/porcelain-veneers-the-answers-to-your-questions": "/veneers",
    "/ready-to-learn-how-full-mouth-dental-implants-are-cost-effective": "/implant-cost",
    "/ready-to-learn-what-a-typical-full-mouth-dental-implant-procedure-looks-like": "/all-on-4",
    "/revamp-your-smile-understanding-the-basics-of-tooth-implants-in-mclean-va": "/dental-implants",
    "/revolutionize-your-smile-a-journey-through-whole-set-of-teeth-implants": "/all-on-4",
    "/revolutionize-your-smile-with-dental-implants-in-mclean-va": "/dental-implants",
    "/revolutionizing-dental-restoration-the-top-implant-techniques": "/dental-implants",
    "/should-i-upgrade-my-smile-from-traditional-dentures-to-all-on-4-dental-implants-in-mclean-va": "/all-on-4",
    "/should-sedation-dentistry-be-used-for-full-mouth-dental-implant-procedures": "/sedation-dentistry",
    "/uncover-the-lifespan-how-long-can-a-dental-implant-last": "/dental-implants",
    "/uncovering-the-mystery-the-in-depth-guide-to-dental-implants": "/dental-implants",
    "/unlock-the-benefits-of-dental-implants-your-best-teeth-replacement-option": "/dental-implants",
    "/unraveling-the-complexities-complications-in-implant-dentistry": "/dental-implants",
    "/unveiling-the-mystery-of-implant-dentistry-in-mclean-va": "/dental-implants",
    "/want-to-learn-how-to-take-care-of-your-dental-implants-here-is-how": "/dental-implants",
    "/your-comprehensive-guide-on-dental-implants-the-best-replacement-of-tooth-solution": "/dental-implants",
}

# ---------------------------------------------------------------------------
# 3. Legacy URLs found only in the Wayback archive - earlier site generations. These
#    were already dead before the 2026-07-30 scrape, but their inbound links are not.
# ---------------------------------------------------------------------------
LEGACY = {
    "/advances-in-prosthodontics-new-findings-best-practices-for-cosmetic-restorative-dentistry": "/meet-dr-nahlah",
    "/all-on-four": "/all-on-4",
    "/all-on-four-gallery": "/smile-gallery",
    "/are-dental-implants-cost-effective": "/implant-cost",
    "/are-dental-implants-permanent": "/dental-implants",
    "/book-online": "/contact",
    "/can-dental-implants-be-done-in-a-day": "/all-on-4",
    "/can-dental-implants-get-cavities": "/dental-implants",
    "/dental-bridges": "/dental-implants",
    "/dental-crowns": "/dental-implants",
    "/dental-implants-in-dc-all-on-four": "/all-on-4",
    "/dental-implants-in-dc-all-on-four-recovery-guide": "/all-on-4",
    "/dental-implants-in-dc-what-are-they-made-from": "/dental-implants",
    "/how-do-you-clean-dental-implants": "/dental-implants",
    "/lifespan-of-all-on-four-in-dc": "/all-on-4",
    "/oral-hygiene-topic-healthy-food-choices": "/",
    "/prosthodontics": "/meet-dr-nahlah",
    "/replace-lost-or-missing-teeth-with-dental-bridges": "/dental-implants",
    "/veneers-gallery": "/smile-gallery",
    "/what-are-dental-implants": "/dental-implants",
    "/what-are-dental-implants-used-for": "/dental-implants",
    "/what-are-veneers": "/veneers",
    "/what-do-i-need-to-do-before-my-dental-implant-procedure": "/dental-implants",
    "/what-is-the-difference-between-a-prosthodontist-and-a-regular-dentist": "/meet-dr-nahlah",
    "/what-is-the-process-for-an-all-on-four": "/all-on-4",
    "/what-kind-of-treatment-is-needed-for-failed-dental-implants": "/dental-implants",
    "/when-milk-doesnt-do-a-body-good-calcium-rich-alternatives-for-strong-teeth-and-bones": "/",
    "/who-is-a-good-candidate-for-dental-implants": "/dental-implants",
    "/will-i-be-without-teeth-for-any-amount-of-time": "/all-on-4",
}

# ---------------------------------------------------------------------------
# 4. WordPress structural URLs: category archives, blog pagination, author archives,
#    date archives, feeds. Wildcards use Webflow's `(.*)` / `%1` syntax.
#    Webflow matches exact paths before wildcards, so specific rules above win.
# ---------------------------------------------------------------------------
WP_STRUCTURE = {
    # Category archives (2 live at migration + 1 legacy) then a catch-all
    "/category/dental-implants": "/dental-implants",
    "/category/dental-care": "/dental-implants",
    "/category/dental-info-center": "/dental-implants",
    "/category/(.*)": "/dental-implants",
    # Blog pagination - both the pretty and the numeric form were in use
    "/blog/page/(.*)": "/dental-implants",
    "/blog/(.*)": "/dental-implants",
    # Author archives
    "/author/(.*)": "/meet-dr-nahlah",
    # Tag archives (Yoast exposed them even though none were indexed)
    "/tag/(.*)": "/dental-implants",
    # Feeds
    "/feed": "/",
    "/comments/feed": "/",
    "/feed/(.*)": "/",
    # WP REST + oEmbed endpoints that were publicly crawlable
    "/wp-json/(.*)": "/",
}

# Date archives: `/2017` ... `/2026` plus everything nested under them.
for _year in range(2017, 2027):
    WP_STRUCTURE[f"/{_year}"] = "/"
    WP_STRUCTURE[f"/{_year}/(.*)"] = "/"


def scraped_urls() -> dict[str, str]:
    """Return {path: kind} for the 78 URLs captured from the live WordPress site."""
    records = json.loads(SCRAPE.read_text(encoding="utf-8"))
    out = {}
    for rec in records:
        path = urllib.parse.urlsplit(rec["url"]).path.rstrip("/") or "/"
        out[path] = rec["kind"]
    return out


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    combined: dict[str, str] = {}
    source: dict[str, str] = {}
    for label, table in (
        ("page", PAGES),
        ("post", POSTS),
        ("legacy", LEGACY),
        ("wp-structure", WP_STRUCTURE),
    ):
        for old, new in table.items():
            if old in combined:
                raise SystemExit(f"duplicate old path across tables: {old}")
            combined[old] = new
            source[old] = label

    # --- validation -------------------------------------------------------
    errors = []
    for old, new in combined.items():
        if not old.startswith("/") or not new.startswith("/"):
            errors.append(f"path must start with '/': {old} -> {new}")
        if old.endswith("/") and old != "/":
            errors.append(f"trailing slash (Webflow strips these already): {old}")
        if new not in LIVE_PAGES:
            errors.append(f"destination is not a live page: {old} -> {new}")
        # `old == new` is legal in the tables above - those rows exist to document that
        # the slug survived the rebuild unchanged. They are dropped before writing the
        # CSV (see `rows` below), because emitting them would be a redirect loop.
        if old == new and old not in LIVE_PAGES:
            errors.append(f"self-redirect to a page that does not exist: {old}")
    if errors:
        raise SystemExit("VALIDATION FAILED\n  " + "\n  ".join(errors))

    # --- coverage against the real scrape ---------------------------------
    scraped = scraped_urls()
    unchanged = sorted(p for p in scraped if p in LIVE_PAGES)
    missing = sorted(p for p in scraped if p not in combined and p not in LIVE_PAGES)

    # Self-mapping rows are dropped: Webflow serves those paths directly.
    rows = sorted(
        (old, new) for old, new in combined.items() if old not in LIVE_PAGES
    )

    csv_path = OUT_DIR / "drnahlah-301-redirects.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        writer.writerow(["Old path", "Redirect to path"])
        writer.writerows(rows)

    audit_path = OUT_DIR / "drnahlah-301-redirects-audit.csv"
    with audit_path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        writer.writerow(["Old path", "Redirect to path", "Source", "Was live at migration"])
        for old, new in rows:
            writer.writerow([old, new, source[old], "yes" if old in scraped else "no"])

    print(f"wrote {csv_path}  ({len(rows)} redirects)")
    print(f"wrote {audit_path}")
    print()
    print(f"scraped URLs (live WordPress at migration): {len(scraped)}")
    print(f"  same path on the new site, no rule needed: {len(unchanged)}")
    print(f"  covered by a redirect rule:                {len(scraped) - len(unchanged) - len(missing)}")
    print(f"  UNCOVERED:                                 {len(missing)}")
    for path in missing:
        print(f"    ! {path}")
    print()
    from collections import Counter

    print("destinations:")
    for dest, count in Counter(new for _, new in rows).most_common():
        print(f"  {count:>3}  {dest}")


if __name__ == "__main__":
    main()
