# Livewell Dental — Home Page Brief (client comments + verification)

- **Source**: all **191** Designer comment threads pulled 2026-07-27 via `webflow-livewell-dental` MCP
  (`data_comments_tool`, 2 pages of 100 + 91, all IDs unique). Full set archived in `client-comments.json`.
- **Home page** (`pageId 69d03fdbe999e9907724a69a`): **76 threads — 63 resolved, 13 open.**
- **Verification**: every open item was checked against the live published HTML before being listed here.
  Resolved threads spot-check as genuinely implemented (e.g. #71's approved H2 is live verbatim), so the
  open set is a real backlog, not stale noise.
- **Voices**: Dr. Chris Kim (practice owner, 131 threads site-wide), Trong Huynh (35), Oussama Akkaoui (24),
  Jessica Acosta (1). Comment window: 2026-04-06 → 2026-07-07.

Home is by far the most-discussed page on the site — 76 of 191 threads. Next is About Dr Chris (23),
Technology (21), Livewell Difference (14), Meet the Team (14).

---

## The headline item: the client says the page has no story

**Thread `6a4111b3d8e9fcc8a06c85b5` — Dr. Chris, 2026-06-28, OPEN.** This is the practice owner, and it is
the most important thing in the entire comment set:

> **SO WEIRD.** […] It goes everywhere back and forth? Is this a strategy? Before it was purposeful and
> simple […] Now there is no cohesive flow story.

He lists what he sees, and it matches the live page **exactly** — I extracted the current section order
from published HTML and mapped it against his complaint:

| # | Live section (from published HTML) | His note |
| :--- | :--- | :--- |
| 1 | Hero — "TOP-RATED DENTIST IN FAIRFAX" | |
| 2 | Meet Dr. Chris Kim | "Dr. Chris" |
| 3 | Personalized Dentistry That Makes a Difference (3 services) | "Services" |
| 4 | One Personalized Plan. A Life-Changing Result | "Patient highlight" |
| 5 | Meet the Livewell Team | "Meet the livewell team" |
| 6 | A Better Standard of Dental Care (6 pillars) | "Livewell Difference — **poor reflection, AND without a button to take you there**" |
| 7 | What Dentistry Feels Like Here | "Another patient highlight" |
| 8 | The Care You Need. All in One Place. + Dr. Chris quote | "**back to Dr. Chris**" |
| 9 | Real Patients. Real Results. | "reviews / patient before afters" |
| 10 | Comprehensive Dental Care in Fairfax Station (4 categories) | "**services**" (second time) |
| 11 | Hear From Our Patients | "then more testimonials in video format" |
| 12 | A Space Designed for Your Comfort | "livewell space **WITHOUT button** to take you to that website" |
| 13 | Follow Us on Instagram | "Instagram." |
| — | *footer* | "**xxx NO CTA**" |

**Confirmed:** services appear twice (§3 and §10), Dr. Chris appears twice (§2 and §8), patient
highlights appear twice (§4 and §7), testimonials appear twice (§9 and §11), and the page ends on an
Instagram feed straight into the footer. There are booking CTAs in the nav and hero
(`Request An Appointment`, `Book Now`, `BOOK AN APPOINTMENT` → `/contact-us`), but **no closing
conversion section** — after 13 sections of scroll the page just stops.

**His proposed structure**, verbatim:

```
WHY livewell dental
About me
Livewell Difference
Which problem do we solve
Patient testimonial (strong video)
Proof via results before/afters
Promotions
Dental services
CTA
```

That is a clean problem→proof→offer narrative and it is the client's own brief. It should drive the home
page work — the remaining open items are mostly details that sit inside it.

---

## Open items, triaged against the live page

### Still valid — act on these

| # | Thread | Item | Verified state |
| :--- | :--- | :--- | :--- |
| 41 / 43 / 76 | `6a3ac7487dc8a41d0fd0d32e`, `6a3ac7cb2c1a8428b0a8646d`, `6a4d39876b8392d7e813dc80` | **Wrong hero video** — "outdated", "specific to dCOE page not home page". Dr. Chris proposes a replacement (Google Drive link) and suggests a photo here plus a separate hero-video section. | **Confirmed live.** Home has exactly one video: Vimeo `1212769907` via embedly. **Three separate people flagged it** (Dr. Chris twice, Jessica Acosta on 2026-07-07 — the most recent comment on the site). Highest-consensus item in the set. |
| 59 | `6a3bcf0ebf1ca742e2adfae1` | "Sounds like we are trying to be everything to everyone… I want to be known as **Cosmetic + Reconstruction + Implant** focused office." | **Confirmed live** — "The Care You Need. All in One Place." still present. This is a positioning decision, not a copy tweak. |
| 25 / 58 | `69d56e407c5dfb243f7d53bd`, `6a3bced2ee0a8e572b6aabc5` | "Fairfax Station is really small city" — wants Northern Virginia / DMV / at least Fairfax, **if SEO allows**. | **Partially done.** H1 already reads "TOP-RATED DENTIST IN FAIRFAX", but "Comprehensive Dental Care in **Fairfax Station**" is still live, as is the `<title>`. Needs an SEO call, not a blind find-replace — see below. |
| 18 | `69d56dbb0b88f963e325c595` | "This logo gets wrapped when the size is resized." | Needs a responsive visual check across breakpoints — not verifiable from HTML alone. |
| 33 | `69e9daee7d9e2bce9a8af967` | "We need to adjust the header to match this section." | Ambiguous without the Designer element context; resolve on a walkthrough. |

### Appear already fixed — close the threads

| # | Thread | Item | Verified state |
| :--- | :--- | :--- | :--- |
| 51 | `6a3acc50a5577292adbeac4a` | "'Here for the Long Run' — just weird. Please change" | **Not present** in published HTML. Done, thread left open. |
| 46 | `6a3ac810adb76432ee004477` | "Do not use acronym, what is GP to patients?" | No standalone "GP" in published copy. Done, thread left open. |

### Superseded — do not action

| # | Thread | Item | Why |
| :--- | :--- | :--- | :--- |
| 44 / 45 | `6a3ac7ec3e205613a7d81c90`, `6a3ac7f964e7cc7f29ffad44` | Partial rewrites of the AGD / ICOI credential lines, dated **2026-06-23**. | Dr. Chris issued a **complete approved credentials block on 2026-06-26** (thread #73, resolved) and that text is live verbatim. The 06-23 fragments are earlier drafts of the same lines. Confirm with him, then close. |

---

## The Fairfax Station question needs an SEO decision, not a preference call

Dr. Chris raises it twice and both times hedges with "if not related to SEO strategy" / "keep if intentional
for SEO". He is right to hedge, and the data says be careful:

- The **entire site's on-page SEO is built on "Fairfax Station"** — it appears in titles, meta descriptions,
  and `Dentist` + `PostalAddress` schema across ~50 pages.
- The two local-SEO landing pages that *were* built for nearby towns (`/city-pages/dentist-lorton-va`,
  `/city-pages/dentist-newington-forest-va`) are **completely blank** — 0 words, no H1 (see
  `existing-site-audit.md`). So the intended geographic expansion play exists as URLs but was never built.

The right answer is probably **both**: keep "Fairfax Station" where it earns local rankings (title tags,
schema, footer NAP) and broaden the *human-facing* headline copy to Northern Virginia / DMV — then actually
build the city pages to catch the surrounding towns. That is a scoped recommendation to put to Brandklout,
not something to change unilaterally.

---

## What the comments do *not* cover — and should

The client feedback is almost entirely design, copy, and media. None of the 76 home threads mention the
technical defects found in the crawl. On the home page specifically:

- **40 of 85 images have no alt text** (47%) — ADA exposure for a healthcare provider
- The home page is the **only** page on the site with an `og:image`, so it is the one page that shares
  correctly — worth noting as the pattern to replicate, not a home-page defect
- Elfsight reviews widget + Vimeo embedly + Google Maps all load on this page; Trong already flagged load
  speed once (#35, "is it me or the home page load slow? we might need to stop the video from autoplaying")

These belong in the same work order — the client won't ask for them, but they are part of "needs a lot of work."

---

## Recommended next step

The home page needs a **restructure to Dr. Chris's narrative**, not another round of section-level tweaks.
Nine of the 13 open items are content details that would be resolved *inside* a restructure; fixing them on
the current section order means doing the work twice.

Proposed: build the home page against his 9-section flow as a Claude coded design package (`04-design`),
review on a Vercel URL, then rebuild in Webflow. That also closes the wrong-video item, the double-services
and double-Dr.-Chris repetition, the missing Livewell Difference and Livewell Space buttons, and the
missing closing CTA in one pass.

### Decisions needed from Brandklout / Dr. Chris
1. **Is the home restructure in scope**, or are we only clearing the 13 open comments in place?
2. **"Promotions"** appears in his desired flow but exists nowhere on the site — is there an offer to feature?
3. **The replacement hero video** — three Google Drive links are referenced across the open threads; we need
   the actual files, plus a decision on photo-vs-video in that slot (#43 proposes both).
4. **Positioning (#59)** — confirm "Cosmetic + Reconstruction + Implant focused" as the home page's stated
   promise, which changes headline copy and the service ordering.
5. **Fairfax Station vs. Northern Virginia** — confirm the split recommended above before any copy change.

## Version Control
Follows [SYSTEM_RULES.md - Section 4](../../../../../SYSTEM_RULES.md). `client-comments.json` is committed
as a lightweight replayable artifact. Comment content includes client names and emails — it stays in the
private repo and must not be published to any client-facing surface.
