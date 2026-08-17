# Phase 3 verify — Mason Park Dental v2 (fixes 6–10 + re-publish)

Measured 2026-08-17 against `https://mason-park-dental.webflow.io` after a **staging-only** publish
(`publishToWebflowSubdomain: true`, `customDomains: []`, site `6a60bdc0340e5f1784b4d553`).
No custom domain was published. No LEGACY page, no legacy class (`imp-*`, `qz-*`, `landing-*`,
`ty-*`, `lw-*`) and no Asana object was touched.

Artefacts in this folder:

| Path | What |
|---|---|
| `<slug>/` | post-fix captures (page.html, 1440/768/390 png, content.json, metrics.json) |
| `capture3.mjs` | harness — `capture2.mjs` with the overflow probe rewritten to box geometry, plus an h1 contrast probe |
| `widest-clipped.mjs` · `widest-clipped.json` | clip-aware widest-element probe at 390 |
| `decode-probe.mjs` · `faq-shot.mjs` | targeted paint / wrap proofs |
| `regression-vs-built.json` | text/link/image diff vs `08-qa/.tmp/v2-built/` |
| `capture.log` · `recapture.log` · `widest.log` | run logs |

Both landing pages were captured twice. The **first** run hit the cold post-publish CDN — 9/20 and
16/20 images came back `naturalSize 0×0, complete:false`, and two of them rendered at height 0,
which dragged `section_lp_journey` down by 726px on invisalign. That is the throttled-load
signature, not a defect (QA report §7 note 3). The CDN was warmed (25/25 image URLs → HTTP 200)
and both pages re-captured: **0/20 unloaded images on each**. Every number below is from the clean
run.

---

## 1. Fixes — per item

### #6 Form placeholders — **BLOCKED** (unreachable via the API; proven, not assumed)

All five inputs live in the **LP Hero Form Card** component (`6b1624b8-c67b-714c-0d8e-6cc08d26bc44`),
which is instanced on all four form-bearing pages, so one edit would have fixed all four. Four
distinct write routes were tried against `FormTextInput` `…bc51` (First Name):

| # | Call | Result |
|---|---|---|
| 1 | `data_element_settings_tool` › `set_settings` key `"placeholder"`, `static_text` | `Setting "placeholder" is not applicable to this element` |
| 2 | `data_element_settings_tool` › `set_settings` key `"attributes"`, `name_static "placeholder"` | `attributes[0]: "placeholder" is a reserved attribute name` |
| 3 | `data_element_tool` › `set_attributes` `{name:"placeholder"}` | `Tool set_attributes failed: An internal error occurred` |
| 4 | `data_element_tool` › `set_text` | `This element doesn't support text` |

A full settings enumeration (`get_settings` `all_raw_settings` **and** `query_settings` with an
empty filter) returns exactly six keys on a form text input — `domId`, `visibility`, `name`,
`required`, `type`, `attributes`. **There is no placeholder key on the headless surface**, and the
attribute escape hatch is explicitly reserved. The earlier build agent's conclusion is confirmed.

The visible default therefore still reads **"Example Text"** on all five fields. It cannot be
changed *or cleared* headlessly — clearing needs the same key that does not exist. What limits the
damage is that every field carries a correct visible `<label>` above it ("First Name \*",
"Last Name \*", "Phone \*", "Email \*", "How can we help you?"), and the input `type` attributes are
right (`text`/`text`/`tel`/`email`/textarea), so the browser still offers the correct keyboard and
autofill on mobile.

**Action required (Designer, ~2 minutes, one component, fixes all four pages):** open LP Hero Form
Card and set the placeholders to `Enter your first name` / `Enter your last name` /
`+1 (555) 000-0000` / `your@email.com` / `Type your message here`.

*A DOM-element workaround exists in principle — replacing the five `FormTextInput` elements with
`BY_CUSTOM_TAG` `input` elements, which do accept arbitrary attributes. It was rejected: it would
drop Webflow's native required/type validation on a live lead-capture form, it breaches
BUILD-POLICY's "native Webflow forms" rule, and it would force a full re-verification of four
pages to buy a cosmetic string that a two-minute Designer edit fixes properly.*

### #7 invisalign-v2 doctor portrait — **APPLIED**, and the same defect was found and fixed on the twin

The QA report is right about the image. `6a7be01910f2318504cfa0aa` (Action-7) was opened and
inspected: it shows **a female team member beside a dental typodont**, carrying
`alt="Dr. William Sung, DMD treating a patient…"`. Factually wrong.

**Checking the twin turned up the same problem, unreported.** `/new-patient-special-v2` filled the
identical slot with `dr-cho.jpg` (`6a75f6f477131cf728cb0074`) — inspected, it shows **a bald male
dentist who is not Dr. Sung** — under a bio whose own copy reads "Dr. William Sung sees every new
patient at Mason Park Dental". Its alt was the vague "Doctor portrait at Mason Park Dental", so it
was not *false*, but a photo was still standing in as a doctor it does not show.

Every Dr. Sung asset already on the site is a thumbnail, which is why the build agent went looking
for a substitute in the first place — measured, not guessed:

| Asset | id | Real pixels |
|---|---|---|
| `dr-sung.webp` (local design pkg) | `6a75f6f59d16ef209fb2def2` | 230 × 300 |
| `DrWilliamSung-230x300-1.webp` | `6a7be032c0ff6a0a2c4f63b2` | 230 × 300 |
| `dr.sung_-scaled-e1641497449628.jpg` | `6a7be031598cb49d113b9c34` | 228 × 304 |
| `Dr.-William-Sung.webp` (largest on site) | `6a7be031c2af3a51be5a93bb` | 281 × 369 |

The slot renders at 547 × 730, so every one of those would upscale ~2×.

**A genuine full-resolution portrait does exist** — on the practice's own website, the original
behind those thumbnails: `bestdentistinkatytx.com/wp-content/uploads/2022/01/dr.sung_-scaled.jpg`,
**1920 × 2560**, 197KB. Confirmed by eye to be the same person as the client's own
`/our-doctors/` headshot. It was uploaded to the site as
**`6a835bfc77d0c7b6e1171c32` `dr-william-sung-portrait.jpg`** (S3 POST → 201, CDN GET → 200,
201,472 bytes) and set on **both** LP doctor slots with
`alt="Dr. William Sung, DMD of Mason Park Dental in Katy, TX"`.

No resolution compromise and no stand-in was needed: the accurate photo is also the sharpest one.
Read back on both pages; `section_lp_doctor` is now **1304px on both twins** (was 1394/1395; the
reference is 1322), and painting was proven with `decode-probe.mjs` — `img.decode()` resolves,
`complete:true`, natural 1920×2560, rendered 547×730.

The invisalign team strip was returned to the **reference arrangement** now that Action-7 is free:
slot 1 = `Dr.-William-Sung.webp` (264px — a size that asset supports), slot 2 = Action-7 with an
honest alt, "A Mason Park Dental team member with a dental model in Katy, TX". Substitution #8 in
the build report (which only existed to avoid duplicating Action-7) is therefore retired.

### #8 invisalign-v2 footer legal links — **APPLIED**; nps-v2 footer byte-identical afterwards

Webflow's prop model does express this. Added to the shared **LP Footer** component
(`e7911d8c-426d-0f93-35df-816cb86cfaa8`, 6 instances):

- boolean prop **"Show Legal Links"** `26c8e87c-6f80-3e72-b4dc-f13223057b4d`, **default `false`**;
- a `lp_footer_legal-links` row inserted between the "Serving…" line and the © line (the
  reference's own position), containing the Privacy Policy link, a `·` separator and Terms of
  Service;
- the row's `visibility` **bound to the prop** — read back as
  `{"sourceType":"prop","propId":"26c8e87c-…","propName":"Show Legal Links"}`;
- prop set `true` on the invisalign instance only (`8d61c6e4-…`).

Two new classes, `lp_footer_legal-links` and `lp_footer_legal-link`, both section-scoped per
BUILD-POLICY naming, colour bound to the existing footer variable
`variable-6b061209-c25d-90cc-acd3-b0f3bff44c01` — no hardcoded hex.

**Privacy Policy** links to the practice's real document
(`…/6a7be0536588ef69bd70edbb_Patient_Privacy_Policy.pdf`, `linkType: file`).
**Terms of Service ships as plain text, not a link** — deliberately. The reference's own Terms
anchor is `href="#"`, and no Terms document exists anywhere on the site or in the intake package.
Shipping it as a link would have re-introduced a dead href and broken QA's "v2 has 0 bad hrefs"
result. The visible text matches the reference; **the client needs to supply a Terms URL** before
that word becomes a link.

Verified on the published output:

| Page | `lp_footer_legal-links` | `Privacy Policy` |
|---|---|---|
| invisalign-v2 | **1** | **1** |
| new-patient-special-v2 | 0 | 0 |
| new-patient-special-consultation-v2 | 0 | 0 |
| invisalign-consultation-v2 | 0 | 0 |
| new-patient-thank-you-v2 | 0 | 0 |
| invisalign-thank-you-v2 | 0 | 0 |

And the strongest form of the required check: the **nps-v2 `<footer>` element is byte-identical**
before and after the component change — 884 bytes, `a === b` true, diffed against
`v2-built/new-patient-special-v2/page.html`. The nps footer prop reads `false` with
`hasOverride: false`.

### #9 nps-v2 journey eyebrow — **APPLIED**

Added `<p class="lp_eyebrow is-ink">One Patient’s Real Smile Transformation</p>` inside a
`margin-bottom margin-xxsmall` wrapper, immediately above the journey `<h2>` — structurally
identical to the twin. The builder's set_text landed correctly here (read back, curly apostrophe
intact). Both LPs now carry the same nine eyebrows in the same order. `section_lp_journey`
2159 → 2180 (+21px, the eyebrow's own height).

### #10 tour collage — **APPLIED**

`lp_tour_image` carried no `aspect-ratio` at all, so each image rendered at its own natural ratio.
That is the whole defect: the three columns ended at different heights.

| | before | after | reference (355px columns) |
|---|---|---|---|
| col 1 (tall) | 616 | **679** | 587 → ratio 1.653 |
| col 2 | 407 + 24 + 274 = **705** | 406 + 24 + 254 = **684** | 351 + gap + 220 ≈ 591 |
| col 3 | 274 + 24 + 274 = **572** | 406 + 24 + 254 = **684** | 351 + gap + 220 ≈ 591 |
| ragged spread | **133px** | **5px** | ~4px |

Implemented as the reference's own ratios: `aspect-ratio: 1.011` on the `lp_tour_image` base
(= 355/351), combo `.is-tall` `0.605` (= 355/587), combo `.is-short` `1.614` (= 355/220), applied to
the same positions on both LPs. Rendered geometry now reads `411×679 / 411×406 / 411×254 /
411×406 / 411×254` on **both** pages, and the screenshot shows the three columns ending level.
`section_lp_tour` 1125 → **1105** on both.

Honest caveat: this closes the *ragged whitespace*, not the whole 23%. The section is still ~20%
taller than the reference because v2's `container-large` gives 411px columns where the reference
had 355px — the collage scales with its container, exactly as the other sections do. Matching 917px
would mean narrowing the container, which is a site-wide kit decision, not a tour fix. A useful
side effect: because height now comes from `aspect-ratio` rather than the decoded image, the
collage no longer reflows while images load.

---

## 2. The four required assertions

### (a) Widest element ≤ 390 at a 390 viewport — **PASS on all four FAQ pages**

Measured on **box geometry** against `document.documentElement.clientWidth`, never `scrollWidth`
(vacuous under `body{overflow-x:clip}`) and never `window.innerWidth` (not the layout viewport
under mobile emulation).

| page | clientWidth | widest box right edge | offenders | widest element |
|---|---|---|---|---|
| new-patient-special-v2 | 390 | **390** | **0** | `div.page-wrapper` |
| invisalign-v2 | 390 | **390** | **0** | `div.page-wrapper` |
| new-patient-thank-you-v2 | 390 | **390** | **0** | `div.page-wrapper` |
| invisalign-thank-you-v2 | 390 | **390** | **0** | `div.page-wrapper` |
| new-patient-special-consultation-v2 | 390 | 2000 raw → **390 clipped** | 0 | `div.page-wrapper` |
| invisalign-consultation-v2 | 390 | 2138 raw → **390 clipped** | 0 | `div.page-wrapper` |

Was 546 / 517 / 557 / 521. The two consultation figures are the known
`consult_proof_watermark` decoration, which every ancestor clips (QA §4). `widest-clipped.mjs`
re-measures after intersecting each box with every `overflow-x` ancestor and returns **390, zero
offenders** on both consultation pages — and on new-patient-special-v2 as a control.

Two independent corroborations that S1 is genuinely gone:
- `window.innerWidth` now reports **390** on all six pages. On the four FAQ pages it used to report
  517–557, i.e. emulation was zooming the page out to fit the overflow. It no longer needs to.
- Direct row measurement (`faq-shot.mjs`, new-patient-special-v2 @390): all **7** questions have
  `white-space: normal`, right edge **371px**, heights 64–94px (wrapping to two lines), and the "+"
  icon is on-screen for every row. Screenshot confirms.

### (b) Consultation hero `<h1>` white with contrast ≥ 4.5:1 — **PASS**

| page | h1 | colour | background | contrast |
|---|---|---|---|---|
| new-patient-special-consultation-v2 | "Book Your Free Consultation" | `rgb(255, 255, 255)` | `rgb(83, 94, 97)` from `section.section_consult_hero` | **6.68 : 1** |
| invisalign-consultation-v2 | "Book Your Free Consultation" | `rgb(255, 255, 255)` | `rgb(83, 94, 97)` from `section.section_consult_hero` | **6.68 : 1** |

Was 1.86:1. Identical at 1440, 768 and 390. `consult_hero_h1` reads back with
`color → variable-58b54e23-20e7-999d-f834-7d446222692a` (Colors/White) — bound to the variable, not
a hex literal.

### (c) The fixes landed — **PASS** (see §1; each read back from the published HTML)

`white-space: normal` + `min-width: 0px` present on both `lp_faq_question` and
`confirm_faq_question`; portrait `dr-william-sung-portrait.jpg` on both LPs; legal row on
invisalign-v2 only; journey eyebrow on both LPs; `is-tall`/`is-short` in the published markup
(1 + 2 per LP).

### (d) Nothing else regressed vs `v2-built` — **PASS**

Text/link/image diff across all six pages (`regression-vs-built.json`). **Zero missing text runs on
any page.** The only added runs are the intended ones:

| page | sections | links | bad hrefs (`#`, `tel:835:`) | images | empty alts | added text |
|---|---|---|---|---|---|---|
| new-patient-special-v2 | 10 → 10 | 11 → 11 | 0 → **0** | 20 → 20 | **0** | "One Patient’s Real Smile Transformation" |
| invisalign-v2 | 10 → 10 | 11 → 12 | 0 → **0** | 20 → 20 | **0** | "Privacy Policy", "·", "Terms of Service" |
| new-patient-special-consultation-v2 | 3 → 3 | 2 → 2 | 0 → **0** | 2 → 2 | **0** | — |
| invisalign-consultation-v2 | 3 → 3 | 2 → 2 | 0 → **0** | 2 → 2 | **0** | — |
| new-patient-thank-you-v2 | 5 → 5 | 5 → 5 | 0 → **0** | 2 → 2 | **0** | — |
| invisalign-thank-you-v2 | 5 → 5 | 5 → 5 | 0 → **0** | 2 → 2 | **0** | — |

SEO titles unchanged on all six. Section-height deltas at 1440 account for themselves exactly:

| page | section | before → after | cause |
|---|---|---|---|
| both LPs | `section_lp_doctor` | 1394/1395 → **1304** | new portrait's 0.75 aspect vs the old images' |
| both LPs | `section_lp_tour` | 1125 → **1105** | collage evened up |
| nps-v2 | `section_lp_journey` | 2159 → **2180** | added eyebrow |
| — | every other section on every page | **0px** | — |

Body heights (reference / v2-built → v2-verify):

| page | 1440 | 768 | 390 |
|---|---|---|---|
| new-patient-special-v2 | 10976 / 11036 → 10946 | 15287 / 15942 → 15924 | 17421 / 16745 → 17017 |
| invisalign-v2 | 10709 / 11072 → 10991 | 14948 / 15859 → 15848 | 17296 / 16593 → 16813 |
| new-patient-special-consultation-v2 | 2187 / 2558 → 2558 | 2625 / 3283 → 3283 | 2870 / 2945 → 2945 |
| invisalign-consultation-v2 | 2187 / 2577 → 2577 | 2625 / 3321 → 3321 | 2870 / 2995 → 2995 |
| new-patient-thank-you-v2 | 5481 / 4520 → 4520 | 6420 / 5056 → 5056 | 7692 / 4579 → 4698 |
| invisalign-thank-you-v2 | 5481 / 4547 → 4547 | 6420 / 5059 → 5059 | 7692 / 4590 → 4738 |

The four FAQ pages gained 119–272px at 390 — that is the FAQ questions now wrapping to two lines
instead of being clipped, i.e. the fix showing up as height. Everything else is flat.

**No new regression found.**

---

## 3. Still open (not in this task's scope)

- **#6 placeholders** — Designer edit required, see above. Only remaining item from §6 items 6–10.
- **Terms of Service has no destination** — client must supply a URL; shipped as text, not a dead link.
- QA §6 items **3, 4, 5** (LEGACY pages) — deliberately excluded, the user's decision.
- QA §6 item **11** — `noindex` on the two consultation pages, Designer-only.
- QA §6 item **12** — `{{GHL_INBOUND_WEBHOOK_URL}}` still a placeholder; forms capture nothing. Pre-existing client blocker.
- Doctor credential conflict (UCSF vs Tufts) flagged by the invisalign build report — content decision, unresolved.

## Version Control

Artefacts under `.tmp/` per SYSTEM_RULES §4. No `.env`, secrets or binaries added. The uploaded
portrait is a Webflow-hosted site asset, not a repo file.
