# Project Overview — Legacy Dental Pasadena

| Field | Value |
| :--- | :--- |
| **Client** | Legacy Dental Pasadena (Dr. Sean Sunyoto, DDS) |
| **Agency** | Brandklout (white-label partner; Webzite delivers, Brandklout owns the relationship) |
| **Source** | Asana — `BK Implementation - Legacy Dental Pasadena` (`1212641204749217`) |
| **Asana parent task** | `1217611213174386` — [Legacy Landing Page Development (Invisalign)](https://app.asana.com/1/1210572425689866/project/1211830976769588/task/1217611213174386) |
| **Scope** | 3 pages in one funnel: Invisalign landing page → consultation page → thank-you page. See [page-flow.md](./page-flow.md) |
| **Due** | 2026-08-20 (all three), Final Signoff 2026-08-21 |
| **Started** | 2026-08-20 (client folder scaffolded from Asana dispatch) |
| **Live site** | https://legacydentalpasadena.com/ — **already Webflow**, site `68e12d861f12c7f04a762a8e` |
| **Staging** | https://legacy-dental.webflow.io (live, 200) |
| **Offer routing** | Closest to `Webflow Improvements & Updates` (new pages on an existing Webflow site). Route run as `01` → `04` → `07` → `08`, matching the Mason Park / Grand Mission LP-campaign precedent |
| **`process_baseline_commit`** | recorded at worktree dispatch — see `docs/runbook/` in `bk-legacy-dental` (that worktree has no runbook yet) |
| **Worktree** | `bk-legacy-dental` → this folder only |

## The brief, verbatim

The parent task carries one sentence and **no attachments** (confirmed empty, not merely unchecked,
by `asana-context.mjs` on 2026-08-20):

> We are moving from LSA for Dr. Sean and need to create an Invisalign landing page for his practice.

"LSA" is Google **Local Services Ads**. The practice is shifting paid spend off LSA, which sends
traffic to a Google-hosted profile, onto a channel that needs a landing page of its own. That is the
whole written brief; everything else below was researched, not given.

## Task tree

| Subtask | GID | Owner | Ours? |
| :--- | :--- | :--- | :--- |
| Landing Page | `1217658295652537` | Alejandro Milano | **Yes** |
| Consult | `1217658295652542` | Alejandro Milano | **Yes** |
| Thank you Page | `1217658295652547` | Alejandro Milano | **Yes** |
| Review Copywriting | `1217658295652552` | Gauge Hill | No |
| Update copywriting to make sure its true | `1217658322593896` | Gauge Hill | No |
| Connect tracking | `1217658322593903` | Gauge Hill | No |
| DNI Set Up for landing page (code insertion) | `1217658322593910` | Gauge Hill | No |
| Form creation and redirect to thank you page | `1217658612249899` | Gauge Hill | No |
| Final Signoff | `1217658612249906` | Gauge Hill | No |

> [!IMPORTANT]
> **Tracking, DNI and the form wiring are Gauge Hill's tasks, not ours.** Build the pages so those
> are *possible* — a real `<form>` with named fields, a phone number in a swappable element, a
> thank-you URL to redirect to — but do not insert a GTM container, a call-tracking number, or a
> form action. Leave documented seams and hand them over.

## Practice profile (read from the live site, 2026-08-20)

| Field | Value |
| :--- | :--- |
| Practice | Legacy Dental Pasadena |
| Doctor | Dr. Sean Sunyoto, DDS — UC Berkeley, University of the Pacific School of Dentistry; ICOI Fellowship 2022, Mastership 2024 |
| Second doctor | Dr. Justin Cho (page live). Dr. Nerisa Limansubroto and Dr. Rebecca Weightman exist as **draft** pages — not public, do not reference |
| Address | 1213 N. Lake Ave #1, Pasadena, CA 91104 |
| Phone | (626) 584-1800 |
| Hours | Mon–Fri 8 AM – 5 PM; Sat flexible; Sun closed. Clinical days Mon, Tue, Wed, Fri |
| Booking | `https://schedule.jarvisanalytics.com/frame?eoid=15391&elid=15000000000923` (Jarvis Analytics, embeddable frame) |
| History | On N. Lake Ave for four decades; taken over by Dr. Sunyoto in 2018 from Dr. Rodney Jones |
| Service areas named on site | South Pasadena, Arcadia, Altadena, San Marino, La Cañada Flintridge, Monrovia |

## Existing Invisalign offer page — the content source

**`https://legacydentalpasadena.com/invisalign-offer-pasadena` already exists and returns 200.**
Page id `69c7517d9a46fc9fe1bf1f7c`, at the site root, absent from `sitemap.xml`. Captured to
[`../workflows/01-content-intake/.tmp/existing/`](../workflows/01-content-intake/.tmp/existing/).

This is the single most valuable input in the engagement: it carries the practice's **real, current
offer mechanics**, which no amount of research would otherwise produce.

| Fact | Value |
| :--- | :--- |
| Headline price | **$3,379 all-inclusive**, after a $600 new-patient coupon |
| Market comparison used | "Many offices charge $5,500 to $7,500" |
| Deposit | $100, fully refundable, locks the discount; credited to the Data Collection appointment |
| Card surcharge | 3% on credit cards; none on debit, HSA, FSA |
| Option 1 | $3,379 paid in full at first appointment |
| Option 2 | $1,000 down + $248.25 bi-weekly for 6 months = $3,979 (in-office plan) |
| Option 3 | Cherry, ~$166/month, 0% interest for 24 months = $3,979 (soft credit check, not reported) |
| Option 4 | HFD, $89/paycheck twice monthly + $89 at signup. $4,314 if paid within a year, else 29.99% over 36 months = $6,445 |
| Insurance | Typical Invisalign reimbursement $1,000–$3,000; some plans cap orthodontic cover by age (often 18–21); practice files on the patient's behalf, payment sent to the patient |
| Credential | **2026 Invisalign Diamond Provider** (Align Technology top tier) |
| Treatment length | 6 to 18 months |
| Package inclusions | Consult + exam, digital X-rays and clinical photos, 3D scan and impressions, all office visits, complete aligner series, refinements, one free retainer set |
| Eligibility | New patients only; limited-time promotional pricing |
| Journey framing | Free Consultation → See Your New Smile (3D preview) → Start Your Treatment |
| FAQ | 6 questions, answered |

> [!WARNING]
> **The existing page's own numbers disagree, and that is a copy problem to hand over, not to
> silently "fix".** It claims "480+ 5-star Google Reviews" in one stat block and "4.9★ Ratings from
> 150+ Reviews" in the next; Yelp separately shows 184 reviews. Reproducing both on a new page
> reproduces the contradiction. Pick nothing — surface it to `Update copywriting to make sure its
> true` (`1217658322593896`, Gauge Hill) and use whichever figure Brandklout verifies. The same
> applies to "500+ Invisalign Cases Completed".
>
> **Resolved by evidence 2026-08-20, though the decision is still Gauge Hill's.** Google shows
> **5.0 stars across 486 reviews** for place `ChIJwzHEaifDwoARnQXBX95TD5s`, read from the practice's
> own Business profile through the Elfsight widget this very page runs. "480+" is right and slightly
> conservative; "150+" is stale. The recommendation is to print no fixed number at all and let the
> live widget speak, because the count keeps moving. Captured with 31 real reviews in
> [`google-reviews.json`](../workflows/01-content-intake/.tmp/reviews/google-reviews.json).
>
> Also: the existing page's CTA reads **"BOOK FREE CONSULATION"** — a live typo, twice. Do not carry
> it across.

## Existing Invisalign footprint on the site — read before choosing a slug

The site already ranks a wide Invisalign tree. A new page must not cannibalise it:

| URL | Kind |
| :--- | :--- |
| `/our-services/cosmetic-dentistry/invisalign` | Service page (indexed) |
| `/arcadia-dentist/arcadia-invisalign` | Geo page (indexed) |
| `/san-marino-dentist/san-marino-invisalign` | Geo page (indexed) |
| `/south-pasadena-dentist/south-pasadena-invisalign` | Geo page (indexed) |
| `/la-canada-dentist/la-canada-invisalign` | Geo page (indexed) |
| `/areas-we-serve/san-marino/invisalign` | Geo page (indexed) |
| `/invisalign-offer-pasadena` | **Paid-traffic offer LP** (live, not in sitemap) |
| `/invisalign-clear-aligners-pasadena` | **Draft**, titled "Invisalign Meta Ads" — 301s publicly |
| `/blog/invisalign-in-pasadena-clear-aligners-for-a-straighter-confident-smile` | Blog |

The draft "Invisalign Meta Ads" page shows the practice already thinks in **one LP per paid
channel**. That is the strongest available signal for how the new page should be positioned.

## Open questions — close these before `04-design` ships

> [!NOTE]
> Superseded 2026-08-20 by
> [`open-questions.md`](../workflows/01-content-intake/.tmp/open-questions.md), which carries the
> current state, the evidence, and a recommended answer for each. Questions 1 and 3 below are
> closed; 5 is answered in part (the practice already runs LeadConnector forms named per channel).
> The list below is kept for the reasoning that produced it.

1. ~~Is the new landing page a replacement for `/invisalign-offer-pasadena`?~~ **Closed
   2026-08-20: it is a NEW page alongside.** `/invisalign-offer-pasadena` stays live and untouched.
   The three new slugs are still to be chosen, and the site already ranks a wide Invisalign tree —
   see below.
2. **Which channel replaces LSA?** Google Search Ads, Performance Max, and Meta each imply different
   above-the-fold treatment and a different DNI setup. The existing draft is Meta-specific.
3. ~~What is the "Consult" page?~~ **Closed 2026-08-20.** It is its own page: the form plus a few
   testimonial videos, and little else. The full three-page funnel is specified in
   [page-flow.md](./page-flow.md).
4. **Is the $3,379 offer still current?** It is on the live page today, but it is described as
   limited-time and the whole campaign is being re-pointed. Confirm before printing it.
5. **Form destination.** Gauge Hill owns form creation, but the LP must contain the form. Webflow
   native form + redirect, or an embedded Jarvis scheduler, or both?
6. **Publishing.** See the hard warning in [mcp-access.md](./mcp-access.md) — this site serves a
   **live practice** and carries a **second brand's domains**.

## Routed workflows

Copied from `deliver/process/` at scaffold time. Route: `01` → `04` → `07` → `08`.

| Phase | Status | Notes |
| :--- | :--- | :--- |
| `00-client-delivery-initialization` | **Done** | This doc + `mcp-access.md`; folder scaffolded; site ID confirmed |
| `01-content-intake` | **Done** 2026-08-20 | 167 media files downloaded (41 MB), 9 videos inventoried, 31 real Google reviews captured, brand tokens read, forms and tracking identified. See [`content-intake-summary.md`](../workflows/01-content-intake/.tmp/content-intake-summary.md) and [`open-questions.md`](../workflows/01-content-intake/.tmp/open-questions.md) |
| `04-design` | Pending | Awwwards-grade, motion-led per [DESIGN-STANDARD.md](../../docs/DESIGN-STANDARD.md), benchmarked against Dr. Nahlah. Three chaptered journeys, not a stack of cards |
| `07-webflow-build` | Pending | Site already exists with a Client-First style guide (`68e12d871f12c7f04a762ae7`, draft). Build natively onto the site's existing class system rather than forking a new one |
| `08-qa` | Pending | Gate the **served** page under CDP at desktop and 390×844, not screenshots |

### Modules deliberately not copied

`02`, `03`, `05`, `06`, `09`, `10` and `11`–`17` are not routed. This is a three-page campaign
addition to a live site the client already owns and already publishes, not a build or a migration.
Pull a module in if the scope moves.

## Project structure

```
deliver/brandklout/legacy-dental-pasadena/
├── docs/
│   ├── project-overview.md   # This file
│   └── mcp-access.md         # Read before any platform action
└── workflows/
    ├── 00-client-delivery-initialization/
    ├── 01-content-intake/    # .tmp/asana-context/, .tmp/existing/
    ├── 04-design/
    ├── 07-webflow-build/
    └── 08-qa/
```

Client-provided material goes once into
`workflows/00-client-delivery-initialization/.tmp/client-handoff/`. Everything produced later lives
in the `.tmp/` of the workflow that produces it.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md). Documentation and
lightweight artifacts only; never secrets or binary/media assets.
