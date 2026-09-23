# Project Overview — Arvada Dental Center & Implants

| Field | Value |
| :--- | :--- |
| **Client** | Arvada Dental Center & Implants |
| **Agency** | Brandklout (white-label partner; Webzite delivers, Brandklout owns the relationship) |
| **Source** | Asana — `BK Implementation - Arvada Dental Center & Implants` |
| **Asana parent task** | `1217040406855586` — [Landing Page Needs - Arvada](https://app.asana.com/1/1210572425689866/task/1217040406855586) |
| **Scope** | 6 paid-traffic landing pages — the largest of the current Brandklout batch |
| **Due** | 2026-08-05 |
| **Started** | 2026-08-05 (folder created from Asana dispatch) |

## Status

**Six pages built, rebuilt as journeys, and verified — awaiting Brandklout review.**
Client site found and scraped 2026-08-05; brand, doctors, services and real reviews extracted; the
six reference URLs captured. Pages built 2026-08-05 and **re-architected 2026-08-06** after the
client rejected round 1 as "a plain card website design" — see
[Page architecture](#revised-2026-08-06--chapters-not-bands). Verification:
[QA report](../workflows/08-qa/.tmp/qa-report.md).

## Client facts (scraped 2026-08-05 from the live site)

| Field | Value |
| :--- | :--- |
| **Website** | https://arvadadentalcenter.com |
| **Address** | 6695 Wadsworth Blvd, Arvada, CO 80003 |
| **Main phone** | (303) 421-7611 |
| **Tracking phone** | (720) 419-3699 *(the number in the site header — a call-tracking line)* |
| **Email** | info@arvadadentalcenter.com |
| **Hours** | Monday–Friday, 8:00am–5:00pm (closed weekends) |
| **Founder** | Dr. Gregory Bennett, DDS — University of Iowa, 2001 |
| **Associates** | Dr. Meghan Holub, Dr. John McShane, Dr. Suzanna McAninley |
| **Positioning** | "World-Class Dental Care With Small-Town Appeal"; "Top Rated Implant Dentist Arvada, CO" |
| **Rating** | **Unverified — do not publish a figure.** See Open Question 9; the aggregate in the source material is an estimate. |

Brand tokens read off the live CSS — navy `#242A3A`, cyan `#03C5EC`, amber `#FB8E28`, slate
`#5C6B80`, deep blue `#0E2F60`; type is Cinzel (display) / Montserrat (UI) / Open Sans (body). A
Colorado mountain-ridge motif recurs across their section dividers. Full detail and the source
evidence are in
[`workflows/01-content-intake/.tmp/content-intake-summary.md`](../workflows/01-content-intake/.tmp/content-intake-summary.md).

> [!NOTE]
> The site runs on SiteGround behind an **sgcaptcha bot challenge**, which defeats plain `curl` and
> `WebFetch` — both return a 202 interstitial. Everything here was captured with headless Chrome
> over CDP via
> [`workflows/01-content-intake/.tmp/capture.mjs`](../workflows/01-content-intake/.tmp/capture.mjs),
> which waits the challenge out. **Their images are challenged too**, so hotlinking client assets
> into a page does not work — assets have to be pulled through a browser session and served
> locally.

## Task manifest

Six subtasks, each carrying a single inspiration URL and no written section spec — unlike Grand
Mission, which specifies sections explicitly. **The page structure here has to be derived**, either
from the inspiration links or by reusing the archetypes defined for the other clients.

| Task | GID | Inspiration reference |
| :--- | :--- | :--- |
| [Implants Landing Page](https://app.asana.com/1/1210572425689866/task/1217162344633760) | `1217162344633760` | `smile.dentalimplantsgps.com/dental-implants/ppc/` |
| [AOX Landing Page](https://app.asana.com/1/1210572425689866/task/1217162344633761) | `1217162344633761` | `yjoms.com/about-full-arch/` |
| [Porcelain Veneers Page](https://app.asana.com/1/1210572425689866/task/1217133289235649) | `1217133289235649` | `avenue.dental/services/veneers/`, `drpaulomalley.com/services/ultra-thin-veneers/` |
| [Emergency Dentistry Landing Page](https://app.asana.com/1/1210572425689866/task/1217162344633758) | `1217162344633758` | `smilecenter.com/treatments/emergency-dentistry` |
| [Dentist Near Me Landing Page](https://app.asana.com/1/1210572425689866/task/1217162344633759) | `1217162344633759` | `greenspotcrossingsdentistry.com/lp/59-nps/` |
| [Next Door Landing Page](https://app.asana.com/1/1210572425689866/task/1217133289235650) | `1217133289235650` | `sites.leadconnectorhq.com/preview/fhJtcZQi3uNr35Y2kKYC`, `greenspotcrossingsdentistry.com/lp/59-nps/` |

Notes on this set:

- **"Next Door" and "Dentist Near Me" cite the same `greenspotcrossingsdentistry` new-patient-special
  reference**, and "Next Door" additionally cites the same GHL preview as Mason Park's *New Patient
  Special*. These three pages are probably one archetype with different targeting. **Confirm what
  distinguishes them before building three near-identical pages** — or confirm that near-identical
  is the intent, which is normal for paid-search landing pages.
- **"AOX"** = All-on-X full-arch implants. Distinct offer from the general Implants page; the
  `yjoms.com` reference is a full-arch page.
- The parent task also carries a veneers reference (`drpaulomalley.com`) at the top level.

## Reference material

House references cited on the parent task:
- https://start.smartarchesdental.com/?step=start
- https://novismilerogers.com/
- https://www.drpaulomalley.com/services/ultra-thin-veneers/ *(veneers-specific)*
- https://smilecenter.com/

## Build target

**Webflow** (confirmed 2026-08-05). The GHL-hosted reference is a *structure* reference, not the
platform.

Sequence: build locally → review → Webflow. Local output goes to
`workflows/04-design/.tmp/<page-slug>/`, one self-contained HTML/CSS/JS package per page.

Reference URLs are **structure and content only** — screenshot, extract section order and copy
angles, then design original work. That matters most here: six pages with no written specs means
the captures *are* the brief, and six pages that all ape their references will read as six
templates. See
[ASANA-DISPATCH.md](../../docs/ASANA-DISPATCH.md#how-to-use-the-reference-urls--read-this-before-designing).

## Blocking unknowns

1. ~~**No client website URL recorded.**~~ **RESOLVED 2026-08-05** — `arvadadentalcenter.com`,
   found by public search, not supplied by Asana. See Client facts above.
2. ~~**No section specs.**~~ **RESOLVED 2026-08-05** — structure is derived per reference capture
   and normalised onto a shared section vocabulary. See [Page architecture](#page-architecture).
3. ~~**Are "Next Door", "Dentist Near Me" and "New Patient Special" one page or three?**~~
   **DECIDED 2026-08-05** — built as three pages off one archetype with different targeting. See
   [Page architecture](#page-architecture); still worth confirming with Brandklout.
4. **Content sourcing.** Real reviews, doctor names, and credentials only — **never invent
   testimonials or statistics for a real practice**. Sources used are listed in
   `01-content-intake/.tmp/content-intake-summary.md`.
5. **Capacity.** Six pages is the largest scope in this batch and the due date is the same as
   everyone else's. Flag the sequencing conflict to Brandklout rather than silently slipping.

> [!NOTE]
> **Commercial terms are out of scope for this folder.** Brandklout is a partner engagement, not a
> per-page client, so PRICING_TIMELINE_RULES.md (in the `webzite-agentic-workflow` repository) does
> **not** apply to anything under `deliver/brandklout/`. Page count and scope matter here only for
> sequencing and capacity — never for cost. Do not compute or record a rate, quote or cost in this
> folder.
>
> Dollar figures that *do* appear in these artifacts are **the dental practice's own published
> patient-facing prices** — their $109 new-patient special and their full-arch figure. Those are
> landing-page content for the end patient and are unrelated to Webzite's commercial terms.

## Open Questions — for Brandklout

Raised 2026-08-05 during intake. None of these blocked the build; each was resolved with a stated
assumption that needs confirming before the pages go live.

1. **The client's own site publishes two different full-arch prices.**
   `cost-of-dental-implants/` headlines **"Fixed Full Upper Or Lower Implants Just $18,795"** and
   then says, on the same page, *"such amazing pricing, **$14,999**, for fixed upper or lower dental
   implants"*. **Assumption used:** `$18,795`, because it is the headline figure. Every price on the
   built pages sits in a single `data-price` element, so correcting it is a one-line change per
   page. **This needs confirming before the pages take paid traffic** — a wrong headline price on an
   ad landing page is a chargeback conversation.

   *Offers themselves turned out not to be missing.* The practice publishes a **$109 New Patient
   Special** (exam, digital X-rays, OralID cancer screening; new patients, 18+, restrictions apply)
   and a **free consultation** for implants and cosmetic cases. Those are used as-published. Veneers
   and Emergency have no offer of their own, so those pages run the free consultation in a labelled
   `data-offer` block — nothing was invented.
2. **Which phone number should the paid-traffic pages use?** The site header runs a call-tracking
   line `(720) 419-3699` while the main line is `(303) 421-7611`. Paid pages usually want their own
   tracking number. **Assumption used:** main line `(303) 421-7611`, marked in one place per page so
   it is a one-line swap.
3. **Where do form submissions go?** GoHighLevel is the presumed lead destination for the batch but
   no endpoint, form ID, or location ID was supplied. **Assumption used:** forms are wired to a
   documented no-op handler with the payload shape logged; swapping in a GHL endpoint is a
   single-function change.
4. **Are "Next Door", "Dentist Near Me" and "New Patient Special" genuinely three separate pages?**
   They cite the same reference. Built as three, sharing one archetype and differing in targeting
   and copy angle — confirm that is the intent rather than one page.
5. **Is the practice's "Next Door" page meant to target the Nextdoor ad platform?** Read as
   neighbourhood-proximity targeting. Confirm.
6. ~~**The Asana attachments were never downloaded.**~~ **CLOSED 2026-08-06** — they arrived in
   `01-content-intake/.tmp/asana-context/` mid-build: `index_1.html` (the previous vendor's veneers
   page), `schema-snippet.html` and `README-notes.md`. They did not settle questions 1–3, but they
   did explain where all three fabrications came from. See [The previous vendor's
   page](#the-previous-vendors-page-index_1html) below.
7. **Do any of the four associate dentists need to appear on these pages?** Only Dr. Bennett leads
   the implant and cosmetic pages, since the practice's own implant marketing is built entirely
   around him ("Work **exclusively** with Dr. Gregory Bennett"). Dr. McAninley and the team appear on
   the general-dentistry pages.
8. **One reference could not be retrieved.** `greenspotcrossingsdentistry.com/lp/59-nps/`, cited by
   *both* the Dentist Near Me and Next Door tasks, returns a hard Cloudflare `403` — a WAF block, not
   a JS challenge, so a real browser does not get past it either, and the `/lp/` path is not in the
   Wayback Machine. The GHL preview cited alongside it (a `$189` new-patient-special page) is the
   same archetype and was used as the structural brief instead. **A screenshot or PDF from
   Brandklout would close this.**
9. **What is the practice's real review rating and count?** ~~Three figures exist…~~
   **REOPENED 2026-08-06.** Brandklout advised the "4.8 / 1,000+ reviews" aggregate carried in the
   source material is **an estimate, not a real number**. Every aggregate rating, review count and
   star glyph has been **removed from all six pages**. Individually attributed reviews stay — each is
   a named person's published words, quoted verbatim, with no score attached. **Supply a verified
   figure and its source if you want a rating back on these pages.**
10. **Which finance partners does the practice actually work with?** The six names in the source
    material (Cherry, Sunbit, PatientFi, Proceed Finance, LendingClub, CareCredit) were flagged by
    Brandklout as **assumed and unconfirmed**, so all of them are removed, along with the
    "pre-qualify without affecting your credit score" line — that is a regulated consumer-finance
    claim which depends on which lender is in place. The pages now say only that monthly payment
    plans exist and the patient coordinator will go through the options.
    *Worth knowing:* those names were read off the client's own live `insurance-and-financing/` page
    during the scrape, not invented here. That is evidence, not confirmation — and it is a plausible
    origin for the original assumption. **Confirm with the practice directly.**
11. **Which imagery does the practice hold rights to, and is there any consented patient
    photography?** Brandklout advised the before/after photos in the source material are **stock
    placeholders, not consented patient photography**. None were used on any page, and nothing on
    these pages is captioned or framed as a patient, a result, or a before/after. But several images
    that *are* used are evidently licensed stock the practice already runs (the emergency pain shot,
    the veneers lifestyle shot). **Confirm rights before launch**, and supply consented patient
    photography if before/after proof is wanted — it is the strongest asset these pages currently
    lack.

12. **Clinical sign-off on the veneer durability figures.** The comparison table on the veneers page
    carries "around 4–8 years" for composite and "10–20+ years with proper care" for porcelain,
    taken from the previous vendor's page. They are presented as general material characteristics
    with an explicit "not a guarantee" note, not as a promise by this practice — but they come from
    an author with three confirmed fabrications, so **Dr. Bennett should sign them off** or supply
    his own figures.

> [!IMPORTANT]
> **Three fabrications inherited from the source material, purged 2026-08-06.** Questions 9, 10 and
> 11 above all originate from the same place: the rating aggregate, the before/after photography and
> the finance partner names were **carried forward as facts when they were not**. All three are now
> treated as gaps, and `08-qa/.tmp/content-gate.mjs` fails the build if any of them reappears on any
> page. That guard survived the 2026-08-06 architecture rebuild unchanged — it is the check with
> real-world consequences for a real practice.

## The previous vendor's page (`index_1.html`)

The Asana attachments arrived in `01-content-intake/.tmp/asana-context/` on 2026-08-06, after the
six pages were built. They are the previous ad company's **porcelain veneers** page plus its schema
block and a build README.

**Their README is the origin of all three fabrications, and admits each one in writing:**

| Their note | What it means |
| :--- | :--- |
| *"I used **4.8★ / 1,000+ reviews** as a defensible placeholder"* | The rating was never real. It is also embedded as an `aggregateRating` in their JSON-LD — fabricated review markup, which is a Google structured-data policy violation and can cost the practice its rich results. |
| *"the before/after slider currently uses **stock placeholder images**"* | Six Unsplash URLs, presented as patient cases. |
| *"I referenced **CareCredit/Sunbit as common industry examples** per your brief"* | Invented partner names. |

Two further things their README asserts that should **not** be inherited:

- *"the site only says '10+ lending partners,' not specific brand names"* — **our scrape contradicts
  this.** The client's live `insurance-and-financing/` page does list six named partners. The vendor
  most likely never got past the site's bot challenge. Either way, unconfirmed until the practice
  says so.
- Monthly financing figures of **$105 / $185 / $230** for 4, 8 and 10 veneers. Same provenance as
  everything else on this list. Not used; now guarded against.

**What we took from it, per the "structure and content only" rule:** its section spec. Two sections
it had that our veneers page lacked have been added — a **composite-vs-porcelain comparison table**
and a **technology section** (CEREC, digital panoramic X-rays, Waterlase, IV sedation, all
corroborated by the client's own site) — plus one FAQ, on porcelain versus composite bonding. A
`Dentist` and `FAQPage` JSON-LD block was added too, **deliberately without `aggregateRating`**.

**What we did not take:** its visual design. Their page is Tailwind-via-CDN with emoji icons, a
teal/navy/gold palette the author admits was guessed because they could not extract the real brand
colours, a before/after slider, and a testimonial carousel. Ours is an original design on brand
tokens sampled from the live site. The one section of theirs that cannot be reproduced honestly —
the before/after slider — is **deliberately absent** rather than filled with stock, and is Open
Question 11.

## Page architecture

Decided 2026-08-05 from the reference captures. Full derivation in
[`reference-structure-notes.md`](../workflows/01-content-intake/.tmp/reference-structure-notes.md).

Every reference in the batch, stripped of styling, runs the same nine beats: **hero → qualifier →
offer → mechanism → proof → doctor → process → FAQ → close**. All six pages use that spine. What
varies is **which beat leads** and **how loud the offer is**, because a visitor in tooth pain and a
visitor considering an $18,795 full-arch case are at opposite ends of the deliberation spectrum.

| Page | Slug | Leads with | Conversion mechanism | Offer treatment |
| :--- | :--- | :--- | :--- | :--- |
| Implants | `implants` | "in one day" promise | Stepped qualifier | Price mid-page, after value |
| AOX (All-on-X) | `aox` | Life-in-dentures pain | Stepped qualifier | Comparison table, then price |
| Porcelain Veneers | `veneers` | Craft and candour | Smile evaluation | No number; two-visit timeline |
| Emergency | `emergency` | Symptom triage | Call-first, live open/closed | No number; same-day access |
| Dentist Near Me | `dentist-near-me` | $109 special as H1 | Single fast form | Loudest — the H1 |
| Next Door | `next-door` | Neighbour proximity | Single fast form | Loudest — the H1 |

### Revised 2026-08-06 — chapters, not bands

The nine-beat spine above still describes **what each page says**, and every word of it survived the
rebuild. What changed is **how it is composed**. Round 1 rendered those beats as a vertical stack of
coloured bands (`band-base`, `band-paper`, `band-summit`) each holding a grid of cards; the client
read that, correctly, as a plain card site. Each page is now **6–8 named chapters** in an order that
cannot be shuffled, with at least three chapters per page where scroll position *is* the interaction.

| Page | Chapters | Scroll-driven chapters (pinned + scrubbed) | Signature moment |
| :--- | :--- | :--- | :--- |
| `implants` | 8 | 01 The Gap · 02 The Anatomy · 05 The Path | An implant assembles itself — post, abutment, crown |
| `aox` | 8 | 01 The Verdict · 03 The Four · 04 The Day | Four implants seat into the arch, one per scroll segment |
| `veneers` | 8 | 01 The Mirror · 03 The Design · 04 The Method | Shade, shape and proportion resolve in turn |
| `emergency` | 7 | 01 Right Now · 02 The First Minutes · 04 When You Arrive | The dial sweeps and each instruction lights |
| `dentist-near-me` | 7 | 01 The Search · 02 The Offer · 04 The Practice | The visit itemises itself and the price lands |
| `next-door` | 7 | 01 Twenty-Two Years · 03 The Whole Household · 04 The Voices | The years run forward from 2003 |

FAQ, financing and insurance are folded **into** the chapter that answers the objection rather than
sitting in bands of their own. The three signature moments that wanted a before/after are SVG
illustrations captioned as such — there is no consented patient photography for this practice, and
inventing it was never an option (see the note under Open Questions).

**Three near-identical pages, deliberately.** "Dentist Near Me", "Next Door" and Mason Park's "New
Patient Special" cite the same reference and are one archetype. They are built as three pages
sharing a section vocabulary but differing in **targeting and lead beat** — `dentist-near-me` is
search-intent ("open now", "near me", distances), `next-door` is neighbourhood-proximity (the Arvada
community, "voted a neighborhood favorite" framing, local landmarks). That is normal and correct for
paid search vs. paid social, but it is worth confirming — see Open Question 4.

## Deliverables

All six pages are built, rebuilt as journeys, and QA'd. **Open `workflows/04-design/.tmp/index.html`
to review them** — it links all six with their chapter arcs, and states the three questions that need
answering.

> [!TIP]
> **Scroll slowly through the pinned chapters.** They are scrubbed: the page holds still and the
> scene plays at whatever pace you scroll, forwards or backwards. Scrolling past quickly is the one
> way to miss the point of the rebuild.

Full paths:

| Page | Package |
| :--- | :--- |
| Implants | `deliver/brandklout/arvada-dental-center/workflows/04-design/.tmp/implants/index.html` |
| AOX (All-on-X) | `deliver/brandklout/arvada-dental-center/workflows/04-design/.tmp/aox/index.html` |
| Porcelain Veneers | `deliver/brandklout/arvada-dental-center/workflows/04-design/.tmp/veneers/index.html` |
| Emergency Dentistry | `deliver/brandklout/arvada-dental-center/workflows/04-design/.tmp/emergency/index.html` |
| Dentist Near Me | `deliver/brandklout/arvada-dental-center/workflows/04-design/.tmp/dentist-near-me/index.html` |
| Next Door | `deliver/brandklout/arvada-dental-center/workflows/04-design/.tmp/next-door/index.html` |
| Review index | `deliver/brandklout/arvada-dental-center/workflows/04-design/.tmp/index.html` |

Shared across all six: `_shared/journey.css` (tokens, `data-theme` layer, components),
`_shared/journey.js` (the WZ bootstrap), `_shared/journey-boot.js` (plugin registration, smoother,
global UI and behaviour), `_shared/vendor/gsap/` (GSAP 3.13, vendored so the packages run offline and
verification is deterministic), and `_shared/assets/` (42 client-owned images, gitignored,
re-fetchable via `fetch-assets.mjs`).

**Motion** (re-architected 2026-08-06): every page is 6–8 named chapters, each carrying its own
`<style>` and `<script>` so it can be lifted into Webflow as one self-contained embed. Three chapters
per page are **pinned and scrubbed** — scroll position *is* the interaction, not a trigger for one.
Continuity comes from a reading-progress bar, a chapter readout in the nav, and `data-theme` shifts
across the arc. Each chapter arrives *and* departs. `prefers-reduced-motion` removes movement without
removing content, and every pinned scene has a real fallback rather than a dead `100svh` box.

This replaced a shared `brand.css` + `brand.js` built entirely from `IntersectionObserver`. That was
not a refactor: an observer cannot express *how far through* a scene you are, so the previous
architecture could not produce a scrubbed moment at all. Detail:
[QA report](../workflows/08-qa/.tmp/qa-report.md).

> [!NOTE]
> **Verify these pages in a focused tab.** Background tabs throttle `requestAnimationFrame` and
> freeze CSS transitions and timers, so motion that works fine reads as broken. `scrub-proof.mjs` and
> `shots.mjs` both force focus emulation; if you check by hand, keep the tab in front.

**Every image is client-hosted**, pulled from `arvadadentalcenter.com` rather than a stock library.
That is *not* the same as saying none of it is stock — several are evidently licensed images the
practice already runs, and rights need confirming before launch (Open Question 11). Nothing on these
pages is captioned or framed as a patient, a result, or a before/after.

**Every review is real, named and quoted verbatim, with no score attached.** No testimonial or price
on these pages was invented, and the three figures that *were* inherited as facts rather than
verified — the rating aggregate, the before/after photography and the finance partner names — have
been removed. See the note under Open Questions.

## Routed workflows

| Phase | Status | Notes |
| :--- | :--- | :--- |
| `00-client-delivery-initialization` | Done | Scope captured from Asana; no Sales handoff exists. |
| `01-content-intake` | **Done 2026-08-05** | Site found and scraped; brand, doctors, offers, reviews and 42 assets extracted; 9 references captured (1 blocked). |
| `02-wireframe` | Skipped, deliberately | The reference captures plus the derived section vocabulary served as the wireframe; going straight to coded pages was cheaper than an intermediate artifact for a set this repetitive. |
| `04-design` | **Rebuilt 2026-08-06** | Six self-contained HTML/CSS/JS packages, re-architected as journeys — see below. |
| `05-design-revisions` | **Round 1 applied 2026-08-06; round 2 next** | Client rejected round 1 as "a plain card website design" and asked for an interactive journey closer to the Dr. Nahlah build. Rebuilt the architecture rather than patching it; content carried over unchanged. Awaiting review of the rebuild. |
| `08-qa` | **Done 2026-08-06** | Journey gate 6/6, scrub proof 18/18 pinned chapters, content gate 192/192, six-breakpoint captures. [QA report](../workflows/08-qa/.tmp/qa-report.md). |
| `07-webflow-build` | Blocked | Needs local approval **and** a Webflow grant, which does not exist for this client. |

Routing rules: [deliver/process/OFFER_ROUTING.md](../../../process/OFFER_ROUTING.md).

## Project structure

```
deliver/brandklout/arvada-dental-center/
├── docs/
│   ├── project-overview.md            # This file
│   └── mcp-access.md                  # Records the live site; still no platform grants
└── workflows/
    ├── 01-content-intake/.tmp/
    │   ├── capture.mjs                # CDP scraper; waits out the sgcaptcha challenge
    │   ├── fetch-assets.mjs           # Pulls client imagery off the network log
    │   ├── content-intake-summary.md  # Every sourced fact, with its source
    │   ├── reference-structure-notes.md
    │   ├── client-site/               # 16 pages: meta.json + full-page PNGs
    │   └── reference-captures/        # 9 references, desktop + mobile
    ├── 04-design/.tmp/
    │   ├── index.html                 # Review index — START HERE
    │   ├── _shared/                   # journey.css/.js, journey-boot.js, vendor/gsap/, assets/
    │   └── <page-slug>/index.html     # The six pages, 6-8 chapters each
    └── 08-qa/.tmp/
        ├── content-gate.mjs           # Static: fabrications, journey integrity, conversion
        ├── scrub-proof.mjs            # Driven: is the motion scrubbed or merely triggered
        ├── shots.mjs                  # Six breakpoints + overflow + interaction
        ├── screenshots/<slug>/        # <width>.png, plus motion/<width>.png
        ├── qa-report.md
        ├── scrub-proof.json
        └── shots-report.json
```

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
