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

- 2026-08-18: Phase 2 — **six of the twelve cosmetic-v2 sections are built**: shell, header,
  hero, journey, difference, specialist, options. All read back with their `lp_` classes, and
  the five embedded videos carry their YouTube sources. 134 classes now exist
  (114 generated + 20 hand-authored).

  **Content is sourced from `tree-1440.json`, not `outline.json`.** The outline is extracted
  from the saved `page.html` with no CSS or JS, so anything the live page reorders or injects
  comes out wrong — the Swiper-driven options cards lost a spec label there, and the specialist
  credentials paired against the wrong strings (the `<strong>` lead-in renders first but sits
  LAST in the DOM). `lib.mjs` gained `tree()` / `byClass()` / `all()` for this.

  **THE VIDEO TRAP, and it is not guessable.** `data_element_builder` offers both `Video` and
  `YouTubeVideo`; the obvious one is wrong. A **`YouTubeVideo` element's `video` setting cannot
  be written** — every value shape answers `Invalid value for setting "video": expected video`
  — while the identical write on a plain **`Video`** succeeds, and the reference pages use
  `Video` too. The builder has NO setter for the source at creation either (`set_video`,
  `set_youtube_video` and friends are accepted and silently ignored, like every unknown key).
  So: build `Video`, then write `{src, title}` with `data_element_settings_tool` key `video`
  + `static_video`. `videos.mjs` does the swap and the write, and reads every one back.

  Divergences logged so far: the before/after slider renders at a fixed 50% split (the drag is
  JS), so the "Drag to compare" hint became a static caption; the options row is a plain
  responsive grid rather than Swiper; the hero card holds a real native form where the
  reference has an empty LeadConnector embed; and the form fields carry visible labels because
  `placeholder` is unreachable.

- 2026-08-18: Phase 2 — the MEASUREMENT was wrong in three ways and all three are fixed. This
  cost a run but every one of them would have shipped as a visible defect:
  1. **Lazy images were measured before they loaded.** The chapter banner came back 46px tall
     (real: 236px) and the doctor photo strip came back 0x0 (real: 281x187). `measure.mjs` and
     `tree.mjs` now walk the whole page, wait for every `<img>` to report `complete`, and
     return to the top before measuring.
  2. **The parameterised class filter had a regex-escaping bug.** In a JS string `"\s"`
     collapses to a literal `s`, so `(^|\s)` became `(^|s)` and every element whose matching
     prefix was not the FIRST class on the attribute was silently dropped — the hero CTA
     (`vnr-a lw-btn lw-btn--gold`) was the one that showed it. The filter now defaults to
     matching every class (190 chains instead of 110), which also recovered the header, the
     "how it works" band, the FAQ chrome and the whole options section (`service_item*`).
  3. **Images were carrying baked pixel heights.** A measured `height` on an image is the USED
     value of `height: auto` — it differs at every width, so seven breakpoints of pixels give a
     layout that is right at exactly seven widths and wrong between them. A `media` class is
     now RATIO-driven: the design's own `aspect-ratio` where it declares one, otherwise the
     ratio of the measured box, plus `width: 100%`.

  `update-styles.mjs` applies changed definitions to classes that already exist. Two API facts
  shape it: **re-asserting a value the style already holds answers "[Conflict] … style block
  store" and aborts the whole call**, and **there is no way to READ a class's stored
  properties** (`query_styles` ignores its filter and returns every style as metadata only). So
  a conflict is treated as "already correct", not an error: the class is tried as one batch and
  falls back to one property per call. Clearing a property needs an EMPTY string — `"auto"` is
  rejected and there is no `remove_properties` action in this MCP build. 8 image classes updated.

- 2026-08-18: Phase 2 STARTED — cosmetic-v2 shell, header and hero are built and their classes
  read back correct (`section_lp_hero` / `lp_container` / `lp_hero_grid` / `lp_hero_content` /
  `lp_form_card`, and `section_lp_header` / `lp_header_bar` / `lp_header_inner`). Section
  elements report as `type: "Block"` with `settings.tag: "section"` — that is a real `<section>`,
  not a div. 19 hand-authored classes were added on top of the 99 generated ones
  (`styles-def.manual.mjs`): the header stack, the "how it works" section, the FAQ accordion
  chrome and the hero form fields. Ids in `built/cosmetic-v2.json`.

  **API facts learned this session, each one a failed call first:**
  1. `type: "Form"` does NOT create an empty wrapper — it creates a COMPLETE Webflow form
     (FormWrapper > FormForm with two LABELLED text inputs and a submit button, plus the
     success and error messages). A Text Field cannot be a child of the wrapper
     ("Text Field can only be placed in a Form"), so a form is built empty and then ADJUSTED.
  2. On `data_element_tool`, `remove_element` / `set_style` / `set_text` / `set_attributes`
     take **`id`**, while `query_elements` takes **`element_id`**. Same tool, different key.
  3. Form input settings keys are `name` / `required` / `type` / `attributes` / `domId`.
     **`placeholder` is a RESERVED attribute name** and is rejected — it cannot be set through
     the API at all. (An earlier note in this file claimed the opposite; it was wrong.)
  4. **`set_settings` reports ACTION-level success while individual OPERATIONS fail.** The
     truth is in `result[].data[].applied_keys` / `.error`. One bad key discards its WHOLE
     operation — a batch carrying the reserved `placeholder` attribute wrote nothing at all and
     still answered `"Applied 1 operation(s)"`. That is why three form fields kept Webflow's
     default names through two runs. `lib.mjs`'s `call()` now inspects those per-operation
     results and throws.
  5. Unknown action names and argument shapes are cheapest to discover by sending a bogus
     action or key and reading the Zod union error.

  Hero form now reads back correct: First name/text, Phone/tel, Email/email, all required,
  submit "Request My Consultation", form name + redirect to the v2 thank-you page. Because the
  placeholder is unreachable, the fields need visible labels rather than placeholder text —
  queued as the first build step of the next section pass.

- 2026-08-18: Phase 1 DONE — the `lp_` class system exists on the site. `measure.mjs` renders
  each live reference page at 1920/1440/1280/1100/991/767/478 and dumps the computed styles of
  every legacy class chain (`v2-reference/<slug>/styles.json`, 110 chains on the landing pages,
  sentinel-guarded). `gen-styles.mjs` carries a hand-authored NAME MAP (legacy chain -> the
  client-first class that replaces it, plus the property set that class owns) and reads the
  VALUES straight out of those measurements — so nothing is transcribed by hand. `push-styles.mjs`
  created all **99** classes (89 globals + 10 `is-*` combos), read back present on the site,
  zero name collisions against the 1,712 existing globals. Six `brand/lp-*` Primitives tokens
  carry the palette; every colour in the generated definitions binds to a variable.

  Breakpoint mapping: 1100 -> **main** (covers 992-1279) · 1280 -> large · 1440 -> xl ·
  991 -> medium · 767 -> small · 478 -> tiny.

  **1920 is measured but deliberately NOT emitted.** The reference's own type multiplier
  misfires there — `.imp-h2` computes 46px at 1440 and **21px** at 1920 — so xl carries every
  width from 1440 up rather than reproducing that.

  Three measurement artifacts the generator now corrects, each of which would have shipped as a
  defect: `margin-left/right: auto` computes as a PX number on a centred box (320px at 1920), so
  horizontal margins are never copied; only the top/left border edges were sampled, so a border
  is expanded to all four sides with an explicit `style: solid`; and an authored `add` value now
  wins at every breakpoint instead of being overridden by the measurement at that width.

- 2026-08-18: Phase 0 started. Six target pages identified and confirmed by SEO metadata;
  established there is no local HTML package for them (see above); site audit done
  (`raw/gm-styles-all.jsonl`, `raw/gm-variables.jsonl`, `raw/gm-components.jsonl`,
  `raw/gm-style-names.txt`); reference capture harness adapted from Mason Park and running.
