# v2 rebuild — client-first / Relume rebuild of the 6 Grand Mission ads landing pages

Task source: user /loop directive 2026-08-18. Site: Grand Mission Dentistry
`698111847e9608eb30ee21c6` · staging https://grandmissiondentistry.webflow.io
Folder: **Ads Landing Pages** `6a7f60323b62b4b8c03fb499` (all six live pages sit inside it,
so their public path is `/ads-landing-pages/<slug>`).
Reference kit: Kit Foundation V1 `6a7a804cfed7e6e46272c6b0` (READ-ONLY — analyze, never modify).
Client-first reference build: Mason Park Dental v2 (`bk-mason-park` worktree,
`07-webflow-build/.tmp/v2/`) — the same task, already completed. Its PLAN / BUILD-POLICY /
QA-REPORT are the playbook; this plan is the Grand Mission instance of it.

## Target pages (existing → new v2 page)

| live page (the spec) | page id | v2 page to create | slug |
| :--- | :--- | :--- | :--- |
| Cosmetic Dentist | `6a723ad5534774f35f17d119` | Cosmetic Dentist v2 | `cosmetic-v2` |
| Cosmetic Consultation | `6a7f28ebb879883a87ba3fc8` | Cosmetic Consultation v2 | `cosmetic-consultation-v2` |
| Cosmetic Thank you | `6a7268a862a728c1cd4df73b` | Cosmetic Thank you v2 | `cosmetic-thank-you-v2` |
| Dental Implants | `6a724b6977f9b0019d2a03f8` | Dental Implants v2 | `dental-implants-v2` |
| Dental Implant Consultation | `6a7f297530c987406bc2100d` | Dental Implant Consultation v2 | `dental-implants-consultation-v2` |
| Dental Implants Thank You | `6a7a539d70073de244bf67a9` | Dental Implants Thank You v2 | `dental-implants-thank-you-v2` |

SEO titles to carry over verbatim (read from `get_page_metadata`, 2026-08-18):

| slug | SEO title |
| :--- | :--- |
| cosmetic | Cosmetic Dentist in Richmond, TX \| Grand Mission Dentistry |
| cosmetic-consultation | Cosmetic Consultation |
| cosmetic-thank-you | Thank you — your request is in \| Grand Mission Dentistry |
| dental-implants | Dental Implants in Richmond, TX \| Grand Mission Dentistry |
| dental-implants-consultation | Dental Implant Consultation |
| dental-implants-thank-you | Thank you — your implant request is in \| Grand Mission Dentistry |

## THE SPEC IS THE LIVE PAGE — there is no local HTML package for these six

Checked before planning (do not re-derive):

- `04-design/.tmp/{implant,cosmetic,thank-you}-landing-page/` is the **awwwards journey
  redesign** — different copy, GSAP pinned chapters, `gm-*` classes. NOT the source of these six.
- `docs/grand-mission-campaigns/` is the **new campaign package** (five campaigns ×
  landing/consult/thank-you), already rebuilt natively into the same folder as
  `new-dental-implants*` / `emergency-dentistry` (see `campaign-rebuild/PLAN.md`). Also not it.
- `01-content-intake/.tmp/originals/gmd-{cosmetic,implant}-lp.html` are the client's
  PRE-redesign pages ("Your Trusted Destination for…", "$3,499"). Not it either.
- Nothing in this repo or the sibling worktrees contains `imp-header-1`, `csm-ba__foot`,
  `landing-hero-h1` or `ty-hero__h1` — the classes these six pages are built from. They are a
  **Livewell Dental template** rebranded for Grand Mission: the same lineage Mason Park's six
  pages came from (`bk-livewell/.../04-design/.tmp/final-design/livewell-thank-you.html`
  carries the identical "Let's talk about…" hero).

So "the pages on Webflow need to be equal to the local version" is satisfied by capturing the
live pages LOCALLY first and building against that capture — exactly what Mason Park did for
the four of its six pages that also had no local design file. The capture set in
`08-qa/.tmp/v2-reference/<slug>/` **is** the local version.

## Rules (from the user, binding)

- NEW blank pages named "<Original Title> v2"; the originals are never written to.
- Client-first naming (finsweet.com/client-first) + Relume conventions as used by Kit
  Foundation V1 and by mason-park-dental.webflow.io/new-patient-special*.
- Reusable classes; variables for the token layer.
- **NO Webflow Components are to be CREATED in this pass** — the user's reference note says
  "don't build webflow components yet". Sections are built from shared classes and shaped so
  they can be componentized later without restructuring. The one exception is *instancing* the
  site's existing **Global Styles** component, which the Relume kit's spacing/hide system
  requires as the first child of `page-wrapper`; instancing is not creating.
- NO custom-code elements (HtmlEmbed) and NO page-settings custom code. The site-level head/
  footer code already installed predates this task — leave it, add nothing.
- Responsive parity with the reference at Webflow's canonical breakpoints.
- All assets uploaded/mapped; reuse existing site assets by id, never re-upload duplicates.
- Double-check grids — known weak spot; read every grid style back at every breakpoint.
- Verify on staging before calling any page done.

## Site state (measured 2026-08-18, do not re-derive)

- **2,959 styles** (1,712 global + 1,247 combo). The **Relume Client-First v3 kit is already
  installed and themed**: `page-wrapper`, `main-wrapper`, `container-large/medium/small`,
  `padding-global`, `padding-section-large/medium/small`, `heading-style-h1..h6`,
  `text-size-*`, `text-color-*`, `background-color-*`, `button`, `form_component` /
  `form_form` / `form_input` / `form_checkbox` / `form_radio`, the full `margin-*` / `padding-*`
  spacing pairs, `max-width-*`, `hide-*`. Reuse these before creating anything.
- **Variables exist in all four Relume collections** (unlike Mason Park, which had them
  stripped):
  - Primitives `collection-0220e3ad-eb86-03ea-3026-8a5979301dd2` — 40 vars: neutrals, the
    White / Neutral-Darkest opacity ladders, and `brand/*`: light `#fcfcfc`, bleu 900 `#002241`,
    bleu 700 `#04669c`, bleu 500 `#abd6ff`, brown 800 `#403830`, brown 500 `#8c6946`,
    puple `#6f4885`, navy 950 `#041a34`, gold 500 `#c98b46`, sand `#fdf8ee`, mist `#f3f8fb`,
    ink `#20272b`, muted `#5d6c7b`, line `#dbe5ec`, danger `#a9332c`.
  - Color Schemes `collection-139f4ef2-8521-8181-4a7f-fc90894e2d6f` — 5 (Scheme 1 only).
  - Typography `collection-3c6a4911-12c4-e415-7fe0-514cefa2d46d` — Heading/Body =
    Montserrat Variablefont Wght, taglines = Greatvibes.
  - UI Styles `collection-08964abb-b13c-a798-071a-663d82b7f0a6` — Radius 4/8/24/48, strokes.
- **49 components**, incl. `Global Styles` `ab488b17-f25a-fbf8-5f54-4a3955eb57e5` and the four
  `Campaign *` components from the August rebuild. None of them are for these six pages.
- **Legacy LP palette, read from the served stylesheet** (977 rules match `.imp-|.csm-|.ty-|
  .landing-|.qz-`) — the colours the v2 pages must hit:
  `#0b2c41` (dominant navy, 34 uses) · `#002241` (deep navy) · `#04669c` (blue) ·
  `#d3aa5a` (gold, 23) · `#abd6ff` (sky) · `#f6f3ee` (cream) · `#d8e0e4` / `#e7ecf1` (lines) ·
  `#376b7b` (slate) · `#fff`. Fonts: **Lato** (body/UI) and **Montserrat**.
  → Primitives is missing `#0b2c41`, `#d3aa5a`, `#f6f3ee`, `#d8e0e4`, `#e7ecf1`, `#376b7b`.
    Phase 1 adds them as `brand/lp-*` tokens rather than hardcoding hexes.
- The site head carries a shared inline layer from the awwwards build (`.ch[data-theme]`,
  `--tx`, `.lightbox`) that loads on every page. Do not touch it; confirm it does not bleed onto
  the v2 pages (none of its selectors are class names v2 will use).

## Phases

0. **RECON** — reference captures of all six live pages (`08-qa/.tmp/v2-reference/`), site
   audit (above), theme extraction. DONE-when: six capture dirs + this plan.
1. **FOUNDATION** — add the missing `brand/lp-*` Primitives tokens; confirm the kit classes the
   build leans on resolve to the right values at 1440/991/767/478.
2. **BUILD** — one page at a time via `data_element_builder` onto the v2 pages, shared classes
   only, three class families:
   - `lp_`      — both landing pages (Cosmetic Dentist / Dental Implants: near-identical skeletons)
   - `consult_` — both consultation pages
   - `confirm_` — both thank-you pages
   Build the first page of each pair fully, then build its twin reusing the family wholesale.
3. **QA** — flip the v2 pages `draft:false`, publish to webflow.io **staging only**, capture at
   1440/768/390 with the same harness, diff against `v2-reference/`, plus a legacy regression
   gate (re-capture the six originals and diff them against the same reference captures).

## State log

- 2026-08-18: Phase 0 started. Six target pages identified and confirmed by SEO metadata;
  established there is no local HTML package for them (see above); site audit done
  (`raw/gm-styles-all.jsonl`, `raw/gm-variables.jsonl`, `raw/gm-components.jsonl`,
  `raw/gm-style-names.txt`); reference capture harness adapted from Mason Park and running.
