# Project Overview — Grand Mission Dentistry

| Field | Value |
| :--- | :--- |
| **Client** | Grand Mission Dentistry |
| **Agency** | Brandklout (white-label partner; Webzite delivers, Brandklout owns the relationship) |
| **Source** | Asana — `BK Implementation - Grand Mission Dentistry` |
| **Asana parent task** | `1217040406855578` — [Landing Page - Grand Mission](https://app.asana.com/1/1210572425689866/task/1217040406855578) |
| **Scope** | 3 paid-traffic landing pages |
| **Due** | 2026-08-05 |
| **Started** | 2026-08-05 (folder created from Asana dispatch) |
| **Approver** | **Sang Huynh** — owner of both the `BK Implementation - Grand Mission Dentistry` project and `Success Daily Stand-Up`, Customer Success team. The "Sang" in the task note. He sets the review loop. |
| **Other contacts** | Trong Huynh, Jessica (project members) · Gauge Hill, Nayeli Ortega (task followers) |
| **Blocks** | `Finalize Account Transfer for Grand Mission` — Gauge Hill, due **2026-08-06**, still open. These pages are the blocker on that transfer. |
| **Live site** | **https://grandmissiondentistry.com** — already on Webflow (site `698111847e9608eb30ee21c6`, Relume-based) |

## Status

**All three pages built and verified locally (2026-08-06).** Content intake completed 2026-08-05 —
Asana attachments retrieved, the client's live site identified and scraped for brand and content, 48
real assets downloaded. All three coded packages are built to the motion standard, pass a
91-check behavioural verification, and are ready for Sang Huynh's review.

> [!IMPORTANT]
> **This work blocks an account transfer.** The parent task blocks `Finalize Account Transfer for
> Grand Mission` (Gauge Hill, due 2026-08-06, incomplete). The Implant and Cosmetic pages carry
> explicit section specs and a "as discussed by team, this is ready" sign-off from Nayeli Ortega on
> both — they are the priority. The parent brief has been rewritten three times and moved five
> times; **the current Asana description is authoritative**, nothing from earlier revisions applies.

Design packages, in `workflows/04-design/.tmp/` — see its
[README](../workflows/04-design/.tmp/README.md) for the full technique list:

| Package | Asana task | State |
| :--- | :--- | :--- |
| [`implant-landing-page/`](../workflows/04-design/.tmp/implant-landing-page/) | `1217133289235653` | All 7 spec sections + multi-step quiz. **Rebuilt to the motion standard 2026-08-06.** Signature: pinned horizontal solutions track. |
| [`cosmetic-landing-page/`](../workflows/04-design/.tmp/cosmetic-landing-page/) | `1217072657902270` | All 7 spec sections incl. sticky mobile bar. **Rebuilt to the motion standard 2026-08-06.** Signature: pinned 8-case patient ribbon. |
| [`thank-you-landing-page/`](../workflows/04-design/.tmp/thank-you-landing-page/) | `1217162605683014` | All 4 spec sections. **Rebuilt to the motion standard 2026-08-06.** Signature: the receipt stamp that draws itself. **Shared archetype** for Mason Park. |
| `verify.mjs` | — | Headless-Chrome behavioural suite: **91 checks**, screenshots in `verify-shots/`. `qa-viewports.mjs` adds real mobile viewport shots. |

Run `node verify.mjs` from `workflows/04-design/.tmp/` to re-check all three.

> [!NOTE]
> The first pass was reviewed as plain and templatised and did not pass. All three pages were
> **rebuilt in execution only** — section order and the verified real content carried
> over unchanged — against [DESIGN-STANDARD.md](../../docs/DESIGN-STANDARD.md): GSAP 3.13 with
> ScrollSmoother, SplitText line reveals, pinned horizontal sequences, scroll-scrubbed counters,
> clip-path wipes, magnetic and cursor-aware interaction, and reduced-motion guards throughout.

Intake artifacts, all in `workflows/01-content-intake/.tmp/`:

| Artifact | What it holds |
| :--- | :--- |
| [`content-intake-summary.md`](../workflows/01-content-intake/.tmp/content-intake-summary.md) | Practice facts, doctors, offers, real reviews, brand tokens, asset inventory |
| [`reference-briefs.md`](../workflows/01-content-intake/.tmp/reference-briefs.md) | Section-by-section wireframe briefs for both originals and all three reference URLs, plus a recommended section plan |
| [`open-questions.md`](../workflows/01-content-intake/.tmp/open-questions.md) | What intake answered, and the nine items still needing Brandklout or the client |
| `originals/` | The two original landing pages from the previous ad company |
| `assets/` | 48 downloaded images incl. logos, doctor portraits, 8 real patient photos (gitignored media) |

## Task manifest

| Task | GID | Spec from Asana |
| :--- | :--- | :--- |
| [Implant Landing Page](https://app.asana.com/1/1210572425689866/task/1217133289235653) | `1217133289235653` | 7 sections (below) + **lead form in GHL** |
| [Cosmetic Landing Page](https://app.asana.com/1/1210572425689866/task/1217072657902270) | `1217072657902270` | 7 sections (below) + **lead form in GHL** |
| [Thank you Landing Page](https://app.asana.com/1/1210572425689866/task/1217162605683014) | `1217162605683014` | 4 sections (below) |

### Implant Landing Page — section spec (verbatim from Asana)
1. Header & Hero Section
2. Solution Breakdown: Why Dental Implants?
3. Patient Eligibility & Preliminary Procedures Section
4. Insurance & Flexible Financing Matrix
5. Doctor Spotlight & Patient Testimonials
6. FAQ Section (Accordion Format)
7. Reviews

### Cosmetic Landing Page — section spec (verbatim from Asana)
1. Header & Hero Section
2. Meet the Cosmetic Doctors
3. Service Offerings Grid
4. Why Choose Grand Mission Dentistry
5. Social Proof & Real Patient Gallery
6. Sticky Mobile Bar
7. Reviews

### Thank you Landing Page — section spec (verbatim from Asana)
1. Immediate Status Banner
2. Fast-Track Immediate Call Box (High-Intent Prompt)
3. What to Expect (3-Step Timeline)
4. Practice Details & Location Map

This is the **same 4-section thank-you spec** as Mason Park. Build it once as a shared archetype —
see [ASANA-DISPATCH.md](../../docs/ASANA-DISPATCH.md).

## Reference material

House references cited on the parent task:
- https://start.smartarchesdental.com/?step=start
- https://novismilerogers.com/
- https://go.voitdental.com/ *(cited only for Grand Mission)*

**Attachments — retrieved 2026-08-05.** The parent task's *"originals from the other Ad company"*
are two GoHighLevel landing pages, now in `workflows/01-content-intake/.tmp/originals/`:
`gmd-implant-lp.html` (single-tooth implant, $3,499) and `gmd-cosmetic-lp.html`. They were built by
"Digital Presence Matters" and carry the client's real copy, offers, doctor bios, reviews and
imagery. Section-by-section breakdown in
[`reference-briefs.md`](../workflows/01-content-intake/.tmp/reference-briefs.md).

## Build target

**Webflow** (confirmed 2026-08-05). GHL is the lead destination only — the two tasks requiring a
"lead form in GHL" mean the form posts to GHL, not that the page is built there.

Sequence: build locally → review → Webflow. Local output goes to
`workflows/04-design/.tmp/<page-slug>/`, one self-contained HTML/CSS/JS package per page.

Reference URLs are **structure and content only** — screenshot, extract section order and copy
angles, then design original work. See
[ASANA-DISPATCH.md](../../docs/ASANA-DISPATCH.md#how-to-use-the-reference-urls--read-this-before-designing).

## Blocking unknowns

Full list with detail in
[`open-questions.md`](../workflows/01-content-intake/.tmp/open-questions.md). What actually blocks
work now:

1. **Which implant price is live** — the client's site says a single implant *"starts at $2,999"*;
   the original landing page sells *$3,499, extra $500 off paid in full*. Blocks the implant hero.
2. **Which financing partners are current** — live site names Cherry only; the originals name
   Alphaeon, LendingClub and CareCredit. Blocks the "Insurance & Flexible Financing Matrix" section.
3. **GHL lead form** — two tasks require the form to live in GoHighLevel and we hold **no GHL
   grant**. Either Brandklout supplies a per-page embed or we get a seat. The thank-you page is the
   form's redirect target, so all three pages are one flow.
4. **Build destination** — the live site is already Webflow, so these pages most likely belong on
   it, which needs a per-client Webflow grant that does not exist yet.
5. **Are these new designs or rebuilds of the attached originals?** Changes the amount of design
   work, not the commercial terms — Brandklout is a partner engagement, so per-page pricing does
   **not** apply here. See [ASANA-DISPATCH.md](../../docs/ASANA-DISPATCH.md).

**Content sourcing is not an unknown, it is a rule.** Testimonials, reviews, doctor bios and stats
must come from the client's real material — all of it is inventoried in
[`content-intake-summary.md`](../workflows/01-content-intake/.tmp/content-intake-summary.md).
**Never invent reviews, patient stories, or statistics for a real dental practice**; that is both a
credibility and a regulatory problem. See
[ASANA-DISPATCH.md](../../docs/ASANA-DISPATCH.md#how-to-use-the-reference-urls--read-this-before-designing).

## Routed workflows

| Phase | Status | Notes |
| :--- | :--- | :--- |
| `00-client-delivery-initialization` | This doc | No Sales handoff package exists; scope captured from Asana. |
| `01-content-intake` | **Done 2026-08-05** | Attachments, live-site scrape, brand tokens, 48 assets, reference briefs. |
| `04-design` | **Next** | Unblocked for the cosmetic and thank-you pages; the implant hero waits on the price answer. |
| `07-webflow-build` | **Blocked** | Client site is Webflow, but no per-client grant exists. |
| `08-qa` | Required | For every shipped page. |

Routing rules: [deliver/process/OFFER_ROUTING.md](../../../process/OFFER_ROUTING.md).

## Project structure

```
deliver/brandklout/grand-mission-dentistry/
├── docs/
│   ├── project-overview.md   # This file
│   └── mcp-access.md         # No grants yet — read before any platform action
└── workflows/
    └── 01-content-intake/.tmp/
        ├── content-intake-summary.md   # Practice facts, brand tokens, real proof
        ├── reference-briefs.md         # Wireframe briefs + recommended section plan
        ├── open-questions.md           # Answered vs still open
        ├── asana/tasks-raw.json        # Raw task + attachment metadata
        ├── originals/                  # The previous agency's two landing pages
        ├── live-site/                  # Home HTML + site CSS (brand token source)
        └── assets/                     # 48 images, gitignored, catalogue.json committed
```

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md). Commit docs and
lightweight `.tmp/` artifacts; never secrets or binary/media assets.
