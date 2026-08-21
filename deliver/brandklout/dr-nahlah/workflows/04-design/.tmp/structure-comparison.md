# Structure Comparison — Reference vs. Our Home Page

> **RESOLVED 2026-07-30** — four of the seven missing sections were built. v2 is now
> **9 chapters**. Remaining gaps: case-study carousel, award badges, secondary services
> list (all need client content). See "Status after the add-back" at the bottom.

Audit of what the reference home page actually contains versus what we built, and
why they diverged. Evidence: 16 viewport captures of the reference home in
`00-client-delivery-initialization/.tmp/design-system/lakenonadentist-reference/.audit/`.

## Reference home — actual section inventory (14 blocks)

| # | Section | What it does |
| :-- | :--- | :--- |
| 1 | Hero | Dark, full-bleed, headline + 2 CTAs |
| 2 | Award badges row | "Nation's Top 10% Lifetime Achievement" etc. |
| 3 | **Doctor bio** | Large portrait + 3 paragraphs + a **"Highlights:" credential bullet list** |
| 4 | **Before/After carousel** | 4-up grid of split cards, each with its own mini handle, arrows + "More Before and After" |
| 5 | **Case-study carousel** | Case photos with narrative descriptions, prev/next arrows |
| 6 | **Icon stat row** | 14k+ implants, 29+ years, 23,000 smiles, sedation, universities — gold illustrated icons |
| 7 | Services grid | 6 photo cards, "Learn More →" |
| 8 | Positioning statement | "Elevated, patient-first experience" |
| 9 | **Us vs. Other Clinics** | Two-column comparison table, gold vs. grey |
| 10 | Secondary services list | Text links with arrows + photo + "Explore All Services" |
| 11 | Video testimonial | "Hear from our patients" |
| 12 | **Google reviews grid** | Real review cards — avatar, stars, date, "Load More" |
| 13 | **Technology & amenities** | 4 photo cards: Relaxing Amenities, Advanced Technology, In-House Lab |
| 14 | Footer | |

## What we built (v2) — 7 chapters

| # | Chapter | Maps to reference |
| :-- | :--- | :--- |
| 00 | Arrival | ✅ #1 Hero |
| 01 | The Reality | ⚠️ **Invented** — no equivalent |
| 02 | The Difference | ◐ #6 stat row (no icons) + #8 positioning, merged |
| 03 | Transformation | ◐ #4 before/after — but one pinned scrub, not a 4-up carousel |
| 04 | The Path | ⚠️ **Invented** — their process lives on inner pages |
| 05 | The Proof | ◐ #11 video + a single quote — **missing #12 reviews grid** |
| 06 | The Invitation | ⚠️ **Invented** (two locations) + CTA |

## Gap: 7 reference sections we dropped

| Missing | Why it matters | Blocker to adding |
| :--- | :--- | :--- |
| **Us vs. Other Clinics** (#9) | Strongest conversion device on their page. Pure copy, no assets needed. | None — **should be added** |
| **Doctor bio + credentials** (#3) | Dr. Nahlah's authority *is* our whole argument. We currently give him one line over a video. | None — we have the portrait and bio copy from the scrape |
| **Google reviews grid** (#12) | We claim 4.9 but show one quote. Real reviews with names and dates are far stronger. | Needs a reviews feed/widget or exported review text |
| **Technology / in-house lab** (#13) | Directly supports the "surgery and restoration under one roof" claim we already make. | Needs 3–4 facility/lab photos we do not have |
| **Case-study carousel** (#5) | Narrative per case. Overlaps our scrubbed before/after. | Needs per-case written descriptions |
| **Award badges** (#2) | Fast credibility. | Needs badge artwork |
| **Secondary services list** (#10) | Depth without another grid. | None |

## Why the divergence happened — honestly

1. **The "journey" reframing is what broke it.** v1 tracked the reference reasonably
   closely. When the brief became "convert this into a journey", I reorganised around a
   narrative arc I authored — Reality → Difference → Transformation → Path — instead of
   keeping the reference's section inventory and adding motion to it. That was my
   judgement call and I should have flagged it rather than quietly restructuring.
2. **Motion budget crowded out content.** Two pinned chapters consume roughly 6
   viewports of scroll. I capped the page at 7 chapters to keep it a sane length, and
   dropped sections instead of including them — the wrong trade to make silently.
3. **Some gaps are genuine asset gaps** (reviews feed, badge artwork, amenity
   photography, per-case copy) — those are real and listed above.
4. **Three additions were deliberate and I would keep them.** The two-location block
   (Dr. Nahlah has two offices; the reference has one and no such section), the process
   chapter (their process is buried on inner pages, and "four visits not four years" is
   a strong objection-handler), and "The Reality" (names the visitor's situation before
   selling).

## Recommendation

Add back, in priority order — all fit the journey structure without breaking it:

1. **Us vs. Other Clinics** → new chapter, or inside 02 The Difference. Copy-only.
2. **Doctor bio + credential highlights** → expand chapter 05, or give the doctor his
   own chapter. We already have the cut-out portrait and the bio from the scrape.
3. **Google reviews grid** → chapter 05, replacing the single quote. Needs the feed.
4. **Technology / in-house lab** → chapter 04, after the process. Needs photography.

That would take v2 from 7 chapters to 9–10 and close the structural gap while keeping
the pinned set-pieces. Say the word and I will build it.

## Version Control
- Follows the version control rules in [SYSTEM_RULES.md - Section 4](../../../../SYSTEM_RULES.md).


## Status after the add-back (2026-07-30)

Four sections built. v2 went from 7 chapters to **9**, verified 61/61.

| Added | Chapter | Assets used | Content status |
| :--- | :--- | :--- | :--- |
| **Us vs. Other Clinics** | 02 The Difference | none needed | Written from the practice's own credentials — verifiable |
| **Doctor bio + credentials** | **03 The Specialist** (new) | existing cut-out portrait | 8 credentials taken verbatim from their `/dr-esam-nahlah/` page |
| **Technology / in-house lab** | **06 The Standard** (new) | `lab.jpg`, `xray.png`, `sedation.jpg`, `interior.jpg` — all real client photos | Real |
| **Google reviews grid** | 07 The Proof | `google.png` (their own asset) | ⚠️ **Placeholder copy** — needs the live feed |

**No stock imagery was needed.** The 911-asset extraction already contained a real photo
of the in-house lab bench with its surgical microscope (`advanced_tech_hero.jpg`), 3D
imaging, a sedation photo and a practice interior. Real client photography beats stock
for a real practice, so nothing was pulled from Freepik.

### Factual corrections made while building

Building the doctor chapter surfaced errors in my own earlier copy, corrected in v2:

| Was | Now | Source |
| :--- | :--- | :--- |
| "25+ Years" | "Since 2003" / 23 years | Their bio: "practicing dentist in California since 2003" |
| "practising in Northern Virginia since 1999" | "since 2013" | Their bio: "In 2013, he moved to Northern Virginia" |
| "10,000+ Implants Placed" (invented) | "12 Board Credentials" | Counted from their published credential list |
| "4.9 Average Rating" (invented) | "5.0 Average Patient Rating" | Their testimonials page: "average rating of 5 out of 5 stars" |
| "FACP — Fellow, American College of Prosthodontists" | "Diplomate, American Board of Prosthodontics" | Their bio names the ABP Diplomate award; FACP appeared only in title tags |

**All four homepage stats are now sourced from the practice's own published material.**
No invented numbers remain.

### Still outstanding

| Missing | Blocker |
| :--- | :--- |
| Google review text | Live Business Profile feed, or exported review text |
| Case-study carousel | Per-case written descriptions |
| Award badges | Badge artwork (their only "award" image is a stock trophy) |
| Secondary services list | None — low priority, can add on request |
