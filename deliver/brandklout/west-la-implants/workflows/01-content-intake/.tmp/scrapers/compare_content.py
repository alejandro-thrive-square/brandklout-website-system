"""Content-gap evidence builder: client site vs one competitor.

Consumes two site-data.json files produced by scrape_site.py and emits the tables a
gap analysis is written from. It does not draw the conclusions; it produces the
evidence so the conclusions are checkable.

Outputs (into --out):
  page-inventory-<label>.csv   every page: url, kind, title tag, H1, words, schema, images, forms
  topic-matrix.csv             taxonomy topic x [client pages, competitor pages] with word counts
  heading-terms.csv            term frequency across H1/H2/H3, both sites side by side
  blog-topics.csv              post titles and dates for both sites
  trust-signals.csv            presence/absence of conversion and trust elements per site
  gap-data.json                everything above, structured

Usage:
  python compare_content.py \
     --client  ../current-site-scrape/site-data.json  --client-label westlaimplants \
     --competitor ../competitor-scrape/wilshireoralsurgery/site-data.json --competitor-label wilshireoralsurgery \
     --out ../gap-analysis
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse

# Topic taxonomy for an implant-led dental practice. Each topic is a list of
# match phrases; a page counts for the topic if any phrase appears in its URL,
# title tag or heading outline. Phrases are lowercase and matched as substrings.
TAXONOMY: dict[str, list[str]] = {
    # -- core implant service line
    "Dental implants (hub)": ["dental implant", "implant dentistry", "tooth implant"],
    "Single tooth implant": ["single tooth implant", "single dental implant", "single implant"],
    "Multiple / bridge implants": ["implant bridge", "implant-supported bridge", "multiple teeth implant",
                                   "zirconia fixed bridge", "fixed bridge"],
    "All-on-4 / full arch": ["all-on-4", "all on 4", "all-on-four", "all-on-x", "all on x",
                             "full arch", "full-arch", "full mouth", "teeth in a day", "same day teeth"],
    "Implant-supported dentures": ["implant supported denture", "implant-supported denture",
                                   "overdenture", "snap-in denture", "hybrid fixed", "fixed detachable"],
    "Mini implants": ["mini implant"],
    "Zygomatic / pterygoid implants": ["zygomatic", "pterygoid", "subperiosteal"],
    "Guided / robotic implant surgery": ["yomi", "robotic", "guided surgery", "computer-guided",
                                         "3d guided", "digital implant"],
    "Implant cost / pricing": ["implant cost", "cost of dental implant", "how much do dental implants",
                               "implant price", "affordable implant"],
    "Implant FAQ": ["implant faq", "implant questions"],
    "What to expect / recovery": ["what to expect", "expectations", "recovery", "aftercare",
                                  "healing", "post-op", "post op"],
    "Failing / failed implants": ["failing implant", "failed implant", "implant failure",
                                  "peri-implantitis", "implant removal", "revision"],
    "Implant maintenance": ["implant care", "caring for", "maintenance", "cleaning your implant"],
    # -- surgical adjuncts
    "Bone grafting": ["bone graft", "bone grafting"],
    "Sinus lift / augmentation": ["sinus lift", "sinus augmentation"],
    "Ridge augmentation / preservation": ["ridge augmentation", "ridge preservation", "socket preservation"],
    "Bone loss": ["bone loss", "jawbone loss", "bone resorption"],
    "Tooth extraction": ["extraction", "tooth removal", "extract"],
    "Wisdom teeth": ["wisdom teeth", "wisdom tooth", "third molar"],
    "Periodontics / gum disease": ["periodont", "gum disease", "gingivitis", "gum graft", "scaling and root"],
    "Missing teeth": ["missing teeth", "missing tooth", "tooth loss"],
    "Loose dentures": ["loose denture", "ill-fitting denture", "denture problems"],
    "Jaw / corrective surgery": ["orthognathic", "jaw surgery", "tmj", "facial trauma", "biopsy",
                                 "oral pathology", "frenectomy", "apicoectomy", "impacted"],
    # -- cosmetic and general
    "Porcelain veneers / Lumineers": ["veneer", "lumineer"],
    "Smile makeover": ["smile makeover", "smile design"],
    "Invisalign / ortho": ["invisalign", "clear aligner", "orthodont", "braces"],
    "Teeth whitening": ["whitening", "teeth bleaching"],
    "Crowns / bridges (conventional)": ["dental crown", "porcelain crown", "dental bridge"],
    "Root canal / endo": ["root canal", "endodont"],
    "General / preventive dentistry": ["general dentistry", "preventive", "cleaning", "checkup",
                                       "family dentistry", "restorative dentistry"],
    "Emergency dentistry": ["emergency"],
    "Sedation / anesthesia": ["sedation", "anesthesia", "iv sedation", "nitrous", "sleep dentistry"],
    # -- practice and trust
    "Meet the doctor": ["meet dr", "meet the doctor", "about dr", "our doctor", "dr."],
    "Meet the team / staff": ["our team", "meet the team", "our staff"],
    "Office / facility tour": ["our office", "facility", "office tour", "our practice"],
    "Patient reviews / testimonials": ["testimonial", "review", "patient stories", "what our patients"],
    "Before and after gallery": ["gallery", "before and after", "smile gallery", "case study", "cases"],
    "Video library": ["video"],
    "Financing / insurance / payment": ["financing", "insurance", "payment", "affordable", "care credit"],
    "New patient info / forms": ["new patient", "patient information", "patient forms", "first visit",
                                 "patient resources"],
    "Contact / directions": ["contact", "directions", "location", "hours"],
    "Book / schedule / consultation": ["schedule", "book", "appointment", "consultation", "free consult"],
    "Technology": ["technology", "cbct", "cone beam", "3d imaging", "digital scan", "intraoral scanner"],
    "Safety / sterilization": ["safety", "steriliz", "infection control"],
    "Blog / education hub": ["blog", "news", "article"],
    "Areas served / local landing pages": ["areas we serve", "near ", " ca ", "serving", "neighborhood"],
    "Referring doctors": ["referring", "refer a patient", "for doctors", "professional referral"],
    "FAQ (general)": ["faq", "frequently asked"],
    "Español / multilingual": ["espanol", "español", "spanish"],
}

STOP = set("""a an and are as at be but by for from has have how in into is it its of on or that the
their they this to was were what when where which who will with your you our we us can do does not
about more most other than then there these those over under after before best top get new near
los angeles ca california dental dentist dentistry teeth tooth patients patient care treatment
services service page home site com www https http""".split())


def load(path: str) -> list[dict]:
    recs = json.loads(Path(path).read_text(encoding="utf-8"))
    return [r for r in recs if "error" not in r]


def owner_index(rec: dict) -> str:
    """What makes a page ABOUT a topic: its URL, its title tag, its H1.
    Deliberately excludes h3-h6 - dental themes repeat the whole nav and footer
    as headings, which made every page look like a "Contact" page."""
    parts = [rec.get("url", ""), rec.get("seo", {}).get("title_tag", "")]
    parts += rec.get("h1", [])
    return " ".join(parts).lower()


def section_index(rec: dict) -> str:
    """Topic covered as a SECTION of some other page: H2 level."""
    return " ".join(h["text"] for h in rec.get("headings", []) if h["level"] == "h2").lower()


def body_index(rec: dict) -> str:
    return (rec.get("body_markdown", "") or "").lower()


def topic_hits(recs: list[dict]) -> dict[str, list[dict]]:
    """Pages whose URL/title/H1 make them about the topic."""
    out: dict[str, list[dict]] = {t: [] for t in TAXONOMY}
    for rec in recs:
        idx = owner_index(rec)
        for topic, phrases in TAXONOMY.items():
            if any(p in idx for p in phrases):
                out[topic].append(rec)
    return out


def topic_sections(recs: list[dict]) -> dict[str, int]:
    """Pages that give the topic an H2 section without being about it."""
    out = {t: 0 for t in TAXONOMY}
    for rec in recs:
        owner = owner_index(rec)
        sect = section_index(rec)
        for topic, phrases in TAXONOMY.items():
            if any(p in sect for p in phrases) and not any(p in owner for p in phrases):
                out[topic] += 1
    return out


def topic_mentions(recs: list[dict]) -> dict[str, int]:
    """Body-copy mentions, so a topic covered only in passing is distinguishable
    from a topic that owns a page."""
    counts = {t: 0 for t in TAXONOMY}
    for rec in recs:
        body = body_index(rec)
        for topic, phrases in TAXONOMY.items():
            counts[topic] += sum(body.count(p) for p in phrases)
    return counts


def heading_terms(recs: list[dict], top: int = 200) -> Counter:
    c: Counter = Counter()
    for rec in recs:
        for h in rec.get("headings", []):
            if h["level"] not in ("h1", "h2", "h3"):
                continue
            for w in re.findall(r"[a-z][a-z'-]{2,}", h["text"].lower()):
                if w not in STOP:
                    c[w] += 1
    return c


TRUST_CHECKS: dict[str, list[str]] = {
    "Online booking / scheduling CTA": ["book online", "schedule online", "request appointment",
                                        "book appointment", "schedule a consultation", "book now"],
    "Phone number in page copy": [],  # handled from rec["phones"]
    "Contact form on page": [],       # handled from rec["forms"]
    "Patient reviews on site": ["review", "testimonial", "star", "google review", "yelp"],
    "Before / after imagery": ["before and after", "before & after", "smile gallery"],
    "Financing / payment plans": ["financing", "care credit", "payment plan", "monthly payment"],
    "Insurance information": ["insurance", "ppo", "in-network"],
    "Pricing stated on site": ["cost", "price", "$"],
    "Free consultation offer": ["free consultation", "complimentary consultation", "no-cost consult"],
    "Video content": ["youtube", "watch video", "video library", "play video"],
    "FAQ blocks": ["frequently asked", "faq"],
    "Team / doctor bios": ["meet dr", "our team", "meet the team", "board certified", "dds", "dmd"],
    "Technology page or copy": ["cbct", "cone beam", "3d imaging", "intraoral scanner", "digital impression"],
    "Emergency / same-day availability": ["same day", "same-day", "emergency", "walk-in"],
    "Multilingual copy": ["espanol", "español", "hablamos"],
    "Referring-doctor section": ["referring doctor", "refer a patient", "for referring"],
    "Local / areas-served pages": ["areas we serve", "serving ", "neighborhood"],
    "Accessibility statement": ["accessibility"],
    "LocalBusiness / Dentist schema": [],  # handled from jsonld_types
    "FAQPage schema": [],
    "Review / AggregateRating schema": [],
    "VideoObject schema": [],
}


def trust_row(recs: list[dict]) -> dict[str, str]:
    all_body = " ".join(body_index(r) for r in recs)
    all_schema = {t.lower() for r in recs for t in r.get("jsonld_types", [])}
    out: dict[str, str] = {}
    for label, phrases in TRUST_CHECKS.items():
        if label == "Phone number in page copy":
            n = sum(1 for r in recs if r.get("phones"))
            out[label] = f"yes ({n} pages)" if n else "no"
        elif label == "Contact form on page":
            n = sum(1 for r in recs if r.get("forms"))
            out[label] = f"yes ({n} pages)" if n else "no"
        elif label.endswith("schema"):
            key = {"LocalBusiness / Dentist schema": ("localbusiness", "dentist", "medicalbusiness",
                                                      "dentalclinic", "physician"),
                   "FAQPage schema": ("faqpage",),
                   "Review / AggregateRating schema": ("review", "aggregaterating"),
                   "VideoObject schema": ("videoobject",)}[label]
            hit = sorted(t for t in all_schema if any(k in t for k in key))
            out[label] = ", ".join(hit) if hit else "no"
        else:
            n = sum(1 for p in phrases if p in all_body)
            pages = sum(1 for r in recs if any(p in body_index(r) for p in phrases))
            out[label] = f"yes ({pages} pages)" if n else "no"
    return out


def write_inventory(recs: list[dict], path: Path) -> None:
    with path.open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["url", "path", "kind", "title_tag", "meta_description", "h1",
                    "word_count", "h2_count", "image_count", "form_count", "schema_types",
                    "published", "modified"])
        for r in sorted(recs, key=lambda x: (x.get("kind", ""), x.get("url", ""))):
            w.writerow([
                r["url"], urlparse(r["url"]).path, r.get("kind", ""),
                r["seo"]["title_tag"], r["seo"]["meta_description"],
                " | ".join(r.get("h1", [])), r.get("word_count", 0),
                sum(1 for h in r.get("headings", []) if h["level"] == "h2"),
                r.get("image_count", 0), len(r.get("forms", [])),
                ", ".join(r.get("jsonld_types", [])),
                r["seo"].get("article_published", ""), r["seo"].get("article_modified", ""),
            ])


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--client", required=True)
    ap.add_argument("--client-label", default="client")
    ap.add_argument("--competitor", required=True)
    ap.add_argument("--competitor-label", default="competitor")
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    out = Path(args.out).resolve()
    out.mkdir(parents=True, exist_ok=True)

    a = load(args.client)
    b = load(args.competitor)
    la, lb = args.client_label, args.competitor_label
    print(f"{la}: {len(a)} pages | {lb}: {len(b)} pages")

    write_inventory(a, out / f"page-inventory-{la}.csv")
    write_inventory(b, out / f"page-inventory-{lb}.csv")

    ta, tb = topic_hits(a), topic_hits(b)
    sa, sb = topic_sections(a), topic_sections(b)
    ma, mb = topic_mentions(a), topic_mentions(b)
    with (out / "topic-matrix.csv").open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["topic", f"{la}_pages", f"{la}_words", f"{la}_h2_sections", f"{la}_body_mentions",
                    f"{lb}_pages", f"{lb}_words", f"{lb}_h2_sections", f"{lb}_body_mentions",
                    "verdict", f"{la}_urls", f"{lb}_urls"])
        for topic in TAXONOMY:
            pa, pb = ta[topic], tb[topic]
            wa = sum(r.get("word_count", 0) for r in pa)
            wb = sum(r.get("word_count", 0) for r in pb)
            if pa and not pb:
                verdict = "client only"
            elif pb and not pa:
                verdict = "GAP - competitor only"
            elif not pa and not pb:
                verdict = "neither"
            elif wb > wa * 1.6:
                verdict = "competitor deeper"
            elif wa > wb * 1.6:
                verdict = "client deeper"
            else:
                verdict = "both"
            w.writerow([topic, len(pa), wa, sa[topic], ma[topic],
                        len(pb), wb, sb[topic], mb[topic], verdict,
                        " | ".join(urlparse(r["url"]).path for r in pa[:8]),
                        " | ".join(urlparse(r["url"]).path for r in pb[:8])])

    ha, hb = heading_terms(a), heading_terms(b)
    with (out / "heading-terms.csv").open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["term", f"{la}_count", f"{lb}_count", "delta"])
        for term in sorted(set(ha) | set(hb), key=lambda t: -(ha[t] + hb[t]))[:400]:
            w.writerow([term, ha[term], hb[term], hb[term] - ha[term]])

    with (out / "blog-topics.csv").open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["site", "kind", "title_tag", "h1", "url", "word_count", "published", "modified"])
        for label, recs in ((la, a), (lb, b)):
            for r in recs:
                if r.get("kind") not in ("post", "blog") and "/blog" not in r["url"]:
                    continue
                w.writerow([label, r.get("kind", ""), r["seo"]["title_tag"],
                            " | ".join(r.get("h1", [])), r["url"], r.get("word_count", 0),
                            r["seo"].get("article_published", ""), r["seo"].get("article_modified", "")])

    ra, rb = trust_row(a), trust_row(b)
    with (out / "trust-signals.csv").open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["signal", la, lb])
        for k in TRUST_CHECKS:
            w.writerow([k, ra[k], rb[k]])

    summary = {
        "client": {"label": la, "pages": len(a),
                   "total_words": sum(r.get("word_count", 0) for r in a),
                   "median_words": sorted(r.get("word_count", 0) for r in a)[len(a) // 2] if a else 0,
                   "kinds": dict(Counter(r.get("kind", "") for r in a))},
        "competitor": {"label": lb, "pages": len(b),
                       "total_words": sum(r.get("word_count", 0) for r in b),
                       "median_words": sorted(r.get("word_count", 0) for r in b)[len(b) // 2] if b else 0,
                       "kinds": dict(Counter(r.get("kind", "") for r in b))},
        "topics": {t: {"client_pages": len(ta[t]), "competitor_pages": len(tb[t]),
                       "client_words": sum(r.get("word_count", 0) for r in ta[t]),
                       "competitor_words": sum(r.get("word_count", 0) for r in tb[t])}
                   for t in TAXONOMY},
        "trust": {la: ra, lb: rb},
    }
    (out / "gap-data.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(f"Wrote evidence tables to {out}")


if __name__ == "__main__":
    main()
