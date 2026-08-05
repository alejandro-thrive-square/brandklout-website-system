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

**Intake complete, build in progress.** Client site found and scraped 2026-08-05; brand, doctors,
services and real reviews extracted; the six reference URLs captured.

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
| **Rating** | 4.8 / 1,270 reviews (Birdeye); 77 reviews on Yelp |

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
5. **Timeline/pricing** per
   [PRICING_TIMELINE_RULES.md](../../../../sales/PRICING_TIMELINE_RULES.md). Six pages is the
   largest engagement in this batch and the due date is the same as everyone else's — flag the
   capacity conflict to Brandklout rather than silently slipping.

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
6. **The Asana attachments ("originals from the other Ad company") were never downloaded.** They
   were noted on Grand Mission and Mason Park; if equivalents exist for Arvada they would settle
   questions 1–3 immediately.
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
9. **Which rating should the pages show?** Three real figures exist: 4.8/1,270 (Birdeye), 4.8/931
   (the client's own published figure), 77 reviews (Yelp). **Assumption used:** 4.8 from 931, because
   the practice publishes it themselves.

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

**Three near-identical pages, deliberately.** "Dentist Near Me", "Next Door" and Mason Park's "New
Patient Special" cite the same reference and are one archetype. They are built as three pages
sharing a section vocabulary but differing in **targeting and lead beat** — `dentist-near-me` is
search-intent ("open now", "near me", distances), `next-door` is neighbourhood-proximity (the Arvada
community, "voted a neighborhood favorite" framing, local landmarks). That is normal and correct for
paid search vs. paid social, but it is worth confirming — see Open Question 4.

## Deliverables

All six pages are built and QA'd. **Open `workflows/04-design/.tmp/index.html` to review them** —
it is a contact sheet linking all six with previews and the three questions that need answering.

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

Shared across all six: `_shared/brand.css` (tokens + components), `_shared/brand.js` (behaviour),
`_shared/assets/` (42 client-owned images, gitignored, re-fetchable via `fetch-assets.mjs`).

**No stock imagery is used anywhere.** Every image is the client's own. Every review is real and
attributed. No statistic, testimonial or price on these pages was invented.

## Routed workflows

| Phase | Status | Notes |
| :--- | :--- | :--- |
| `00-client-delivery-initialization` | Done | Scope captured from Asana; no Sales handoff exists. |
| `01-content-intake` | **Done 2026-08-05** | Site found and scraped; brand, doctors, offers, reviews and 42 assets extracted; 9 references captured (1 blocked). |
| `02-wireframe` | Skipped, deliberately | The reference captures plus the derived section vocabulary served as the wireframe; going straight to coded pages was cheaper than an intermediate artifact for a set this repetitive. |
| `04-design` | **Done 2026-08-05** | Six self-contained HTML/CSS/JS packages. |
| `08-qa` | **Done 2026-08-05** | 238/238 functional checks pass. [QA report](../workflows/08-qa/.tmp/qa-report.md). |
| `05-design-revisions` | **Next** | Awaiting Brandklout review and the answers to the Open Questions. |
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
    │   ├── index.html                 # Review contact sheet — START HERE
    │   ├── _shared/                   # brand.css, brand.js, preview.mjs, assets/
    │   └── <page-slug>/index.html     # The six pages
    └── 08-qa/.tmp/
        ├── qa.mjs                     # Driven functional test
        ├── qa-report.md
        └── qa-results.json
```

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
