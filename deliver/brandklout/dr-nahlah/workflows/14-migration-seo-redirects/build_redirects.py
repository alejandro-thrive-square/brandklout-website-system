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
# WHICH SITE IS THIS MAP FOR?
#
# It matters now, and it did not before. The old URLs live on drnahlah.com. Until
# 2026-08-19 every destination existed on the Webflow build there, so the question
# never came up. It does now: the 43 blog posts were migrated into the INSTATIC
# `posts` collection, and the four per-entity legal pages and the video library
# were built in the local package, so those destinations exist on Instatic and NOT
# on Webflow.
#
# So this map is only valid for whichever platform ends up serving drnahlah.com.
# Point it at Webflow today and 47 rules land on 404s. Flagged rather than
# silently emitted: `--target webflow` still works and will fail validation,
# naming exactly which destinations are missing, which is the useful answer.
TARGET = "instatic"
for _a in __import__("sys").argv[1:]:
    if _a.startswith("--target"):
        TARGET = _a.split("=", 1)[1] if "=" in _a else __import__("sys").argv[__import__("sys").argv.index(_a) + 1]

WEBFLOW_PAGES = {
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

# The 31 pages of the local package, which is what Instatic serves, plus every
# migrated post at its own route.
INSTATIC_PAGES = {
    "/",
    "/about",
    "/all-on-4",
    "/contact",
    "/cosmetic-dentistry",
    "/crowns-and-bridges",
    "/dental-conditions",
    "/dental-implant-faq",
    "/dental-implants",
    "/doctor-referral",
    "/emergency-dentistry",
    "/financing",
    "/implant-cost",
    "/implant-supported-dentures",
    "/meet-dr-nahlah",
    "/oral-surgery",
    "/our-facility",
    "/our-team",
    "/patient-center",
    "/patient-stories",
    "/privacy-policy-alexandria",
    "/privacy-policy-maclean",
    "/sedation-dentistry",
    "/smile-gallery",
    "/smile-makeover",
    "/teeth-whitening",
    "/terms-of-service-alexandria",
    "/terms-of-service-maclean",
    "/thank-you",
    "/veneers",
    "/video-library",
    "/posts",
} | {f"/posts/{q['slug']}" for q in [{"slug": "unlock-the-benefits-of-dental-implants-your-best-teeth-replacement-option"}, {"slug": "your-comprehensive-guide-on-dental-implants-the-best-replacement-of-tooth-solution"}, {"slug": "uncovering-the-mystery-the-in-depth-guide-to-dental-implants"}, {"slug": "uncover-the-lifespan-how-long-can-a-dental-implant-last"}, {"slug": "unveiling-the-mystery-of-implant-dentistry-in-mclean-va"}, {"slug": "exploring-the-world-of-dental-implants-placements-in-mclean-va"}, {"slug": "deciphering-dental-implants-your-guide-to-implant-dentistry-in-mclean-va"}, {"slug": "discover-the-promising-world-of-teeth-implants-in-mclean-va"}, {"slug": "navigating-the-world-of-dental-implant-surgery-in-mclean-va"}, {"slug": "integrating-treatment-dental-practices-into-your-dental-implant-procedure"}, {"slug": "revolutionize-your-smile-with-dental-implants-in-mclean-va"}, {"slug": "navigating-the-path-to-smile-restoration-unveiling-the-secrets-of-implants-of-teeth"}, {"slug": "unraveling-the-complexities-complications-in-implant-dentistry"}, {"slug": "complete-teeth-replacement-the-perks-of-dental-implants-explained"}, {"slug": "revamp-your-smile-understanding-the-basics-of-tooth-implants-in-mclean-va"}, {"slug": "longevity-of-dental-implants-causes-and-fixes-for-damages"}, {"slug": "navigating-the-world-of-dental-implants-an-experts-guide"}, {"slug": "exploring-your-options-for-replacing-a-missing-tooth-the-advantage-of-dental-implants"}, {"slug": "discovering-the-benefits-and-process-of-snap-on-dentures-in-mclean-va"}, {"slug": "implant-vs-implant-clearing-the-confusion-on-dental-implants"}, {"slug": "are-dental-implants-worth-the-cost"}, {"slug": "revolutionize-your-smile-a-journey-through-whole-set-of-teeth-implants"}, {"slug": "revolutionizing-dental-restoration-the-top-implant-techniques"}, {"slug": "want-to-learn-how-to-take-care-of-your-dental-implants-here-is-how"}, {"slug": "can-anything-be-done-if-i-am-not-an-immediate-candidate-for-dental-implants"}, {"slug": "are-there-side-effects-to-dental-implant-procedures"}, {"slug": "should-i-upgrade-my-smile-from-traditional-dentures-to-all-on-4-dental-implants-in-mclean-va"}, {"slug": "ready-to-learn-how-full-mouth-dental-implants-are-cost-effective"}, {"slug": "how-many-missing-teeth-can-dental-implants-replace"}, {"slug": "can-i-upgrade-my-smile-from-traditional-dentures-to-implant-supported-dentures"}, {"slug": "considering-getting-treated-with-all-on-4-dental-implants-in-mclean-va-this-is-why-you-should"}, {"slug": "can-i-have-a-customized-new-smile-with-full-mouth-dental-implants"}, {"slug": "ready-to-learn-what-a-typical-full-mouth-dental-implant-procedure-looks-like"}, {"slug": "do-i-need-a-full-mouth-dental-implant-consultation"}, {"slug": "how-exactly-do-implant-supported-dentures-in-mclean-va-benefit-my-smile"}, {"slug": "after-my-dental-implants-are-placed-how-will-i-know-if-i-have-peri-implantitis"}, {"slug": "have-multiple-missing-teeth-you-should-get-treated-with-multiple-dental-implants"}, {"slug": "should-sedation-dentistry-be-used-for-full-mouth-dental-implant-procedures"}, {"slug": "are-there-advantages-to-replacing-my-missing-teeth-with-dental-implants-in-mclean-va"}, {"slug": "are-there-factors-that-determine-which-type-of-dental-implant-procedure-i-can-get-treated-with"}, {"slug": "porcelain-veneers-the-answers-to-your-questions"}, {"slug": "dental-implants-everything-you-need-to-know"}, {"slug": "all-on-four-your-questions"}]}

LIVE_PAGES = WEBFLOW_PAGES if TARGET == "webflow" else INSTATIC_PAGES


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
# 2. The 43 WordPress blog posts. As of 2026-08-19 they are no longer mapped to a
#    service page by intent: every one was migrated into the Instatic `posts`
#    collection with its original slug, so each old URL now has a REAL 1:1
#    destination at /posts/<slug>. That keeps the page a visitor asked for, and
#    keeps the ranking signal on the content that earned it, which an
#    intent-based redirect to /dental-implants throws away.
#    Generated from 13-content-export-import/.tmp/posts.json.
# ---------------------------------------------------------------------------
POSTS = {
    "/after-my-dental-implants-are-placed-how-will-i-know-if-i-have-peri-implantitis": "/posts/after-my-dental-implants-are-placed-how-will-i-know-if-i-have-peri-implantitis",
    "/all-on-four-your-questions": "/posts/all-on-four-your-questions",
    "/are-dental-implants-worth-the-cost": "/posts/are-dental-implants-worth-the-cost",
    "/are-there-advantages-to-replacing-my-missing-teeth-with-dental-implants-in-mclean-va": "/posts/are-there-advantages-to-replacing-my-missing-teeth-with-dental-implants-in-mclean-va",
    "/are-there-factors-that-determine-which-type-of-dental-implant-procedure-i-can-get-treated-with": "/posts/are-there-factors-that-determine-which-type-of-dental-implant-procedure-i-can-get-treated-with",
    "/are-there-side-effects-to-dental-implant-procedures": "/posts/are-there-side-effects-to-dental-implant-procedures",
    "/can-anything-be-done-if-i-am-not-an-immediate-candidate-for-dental-implants": "/posts/can-anything-be-done-if-i-am-not-an-immediate-candidate-for-dental-implants",
    "/can-i-have-a-customized-new-smile-with-full-mouth-dental-implants": "/posts/can-i-have-a-customized-new-smile-with-full-mouth-dental-implants",
    "/can-i-upgrade-my-smile-from-traditional-dentures-to-implant-supported-dentures": "/posts/can-i-upgrade-my-smile-from-traditional-dentures-to-implant-supported-dentures",
    "/complete-teeth-replacement-the-perks-of-dental-implants-explained": "/posts/complete-teeth-replacement-the-perks-of-dental-implants-explained",
    "/considering-getting-treated-with-all-on-4-dental-implants-in-mclean-va-this-is-why-you-should": "/posts/considering-getting-treated-with-all-on-4-dental-implants-in-mclean-va-this-is-why-you-should",
    "/deciphering-dental-implants-your-guide-to-implant-dentistry-in-mclean-va": "/posts/deciphering-dental-implants-your-guide-to-implant-dentistry-in-mclean-va",
    "/dental-implants-everything-you-need-to-know": "/posts/dental-implants-everything-you-need-to-know",
    "/discover-the-promising-world-of-teeth-implants-in-mclean-va": "/posts/discover-the-promising-world-of-teeth-implants-in-mclean-va",
    "/discovering-the-benefits-and-process-of-snap-on-dentures-in-mclean-va": "/posts/discovering-the-benefits-and-process-of-snap-on-dentures-in-mclean-va",
    "/do-i-need-a-full-mouth-dental-implant-consultation": "/posts/do-i-need-a-full-mouth-dental-implant-consultation",
    "/exploring-the-world-of-dental-implants-placements-in-mclean-va": "/posts/exploring-the-world-of-dental-implants-placements-in-mclean-va",
    "/exploring-your-options-for-replacing-a-missing-tooth-the-advantage-of-dental-implants": "/posts/exploring-your-options-for-replacing-a-missing-tooth-the-advantage-of-dental-implants",
    "/have-multiple-missing-teeth-you-should-get-treated-with-multiple-dental-implants": "/posts/have-multiple-missing-teeth-you-should-get-treated-with-multiple-dental-implants",
    "/how-exactly-do-implant-supported-dentures-in-mclean-va-benefit-my-smile": "/posts/how-exactly-do-implant-supported-dentures-in-mclean-va-benefit-my-smile",
    "/how-many-missing-teeth-can-dental-implants-replace": "/posts/how-many-missing-teeth-can-dental-implants-replace",
    "/implant-vs-implant-clearing-the-confusion-on-dental-implants": "/posts/implant-vs-implant-clearing-the-confusion-on-dental-implants",
    "/integrating-treatment-dental-practices-into-your-dental-implant-procedure": "/posts/integrating-treatment-dental-practices-into-your-dental-implant-procedure",
    "/longevity-of-dental-implants-causes-and-fixes-for-damages": "/posts/longevity-of-dental-implants-causes-and-fixes-for-damages",
    "/navigating-the-path-to-smile-restoration-unveiling-the-secrets-of-implants-of-teeth": "/posts/navigating-the-path-to-smile-restoration-unveiling-the-secrets-of-implants-of-teeth",
    "/navigating-the-world-of-dental-implant-surgery-in-mclean-va": "/posts/navigating-the-world-of-dental-implant-surgery-in-mclean-va",
    "/navigating-the-world-of-dental-implants-an-experts-guide": "/posts/navigating-the-world-of-dental-implants-an-experts-guide",
    "/porcelain-veneers-the-answers-to-your-questions": "/posts/porcelain-veneers-the-answers-to-your-questions",
    "/ready-to-learn-how-full-mouth-dental-implants-are-cost-effective": "/posts/ready-to-learn-how-full-mouth-dental-implants-are-cost-effective",
    "/ready-to-learn-what-a-typical-full-mouth-dental-implant-procedure-looks-like": "/posts/ready-to-learn-what-a-typical-full-mouth-dental-implant-procedure-looks-like",
    "/revamp-your-smile-understanding-the-basics-of-tooth-implants-in-mclean-va": "/posts/revamp-your-smile-understanding-the-basics-of-tooth-implants-in-mclean-va",
    "/revolutionize-your-smile-a-journey-through-whole-set-of-teeth-implants": "/posts/revolutionize-your-smile-a-journey-through-whole-set-of-teeth-implants",
    "/revolutionize-your-smile-with-dental-implants-in-mclean-va": "/posts/revolutionize-your-smile-with-dental-implants-in-mclean-va",
    "/revolutionizing-dental-restoration-the-top-implant-techniques": "/posts/revolutionizing-dental-restoration-the-top-implant-techniques",
    "/should-i-upgrade-my-smile-from-traditional-dentures-to-all-on-4-dental-implants-in-mclean-va": "/posts/should-i-upgrade-my-smile-from-traditional-dentures-to-all-on-4-dental-implants-in-mclean-va",
    "/should-sedation-dentistry-be-used-for-full-mouth-dental-implant-procedures": "/posts/should-sedation-dentistry-be-used-for-full-mouth-dental-implant-procedures",
    "/uncover-the-lifespan-how-long-can-a-dental-implant-last": "/posts/uncover-the-lifespan-how-long-can-a-dental-implant-last",
    "/uncovering-the-mystery-the-in-depth-guide-to-dental-implants": "/posts/uncovering-the-mystery-the-in-depth-guide-to-dental-implants",
    "/unlock-the-benefits-of-dental-implants-your-best-teeth-replacement-option": "/posts/unlock-the-benefits-of-dental-implants-your-best-teeth-replacement-option",
    "/unraveling-the-complexities-complications-in-implant-dentistry": "/posts/unraveling-the-complexities-complications-in-implant-dentistry",
    "/unveiling-the-mystery-of-implant-dentistry-in-mclean-va": "/posts/unveiling-the-mystery-of-implant-dentistry-in-mclean-va",
    "/want-to-learn-how-to-take-care-of-your-dental-implants-here-is-how": "/posts/want-to-learn-how-to-take-care-of-your-dental-implants-here-is-how",
    "/your-comprehensive-guide-on-dental-implants-the-best-replacement-of-tooth-solution": "/posts/your-comprehensive-guide-on-dental-implants-the-best-replacement-of-tooth-solution",
}

# 3. Legacy URLs found only in the Wayback archive - earlier site generations. These
#    were already dead before the 2026-07-30 scrape, but their inbound links are not.
# ---------------------------------------------------------------------------
# The client's counsel rewrote both legal documents on the Webflow build,
# per entity, so the single old page of each kind now has a McLean and an
# Alexandria version. The old slugs point at the McLean pair, that being the
# primary office. /video-gallery was rebuilt and renamed.
SUPERSEDED = {
    "/terms-conditions": "/terms-of-service-maclean",
    "/privacy-policy": "/privacy-policy-maclean",
    "/video-gallery": "/video-library",
    "/blog": "/posts",
}

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
