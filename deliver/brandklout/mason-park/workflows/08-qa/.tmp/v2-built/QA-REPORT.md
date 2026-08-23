# Phase 3 QA — Mason Park Dental v2 rebuild

Measured 2026-08-17 against `https://mason-park-dental.webflow.io` after the staging publish
(Last Published: Mon Aug 17 2026 18:15:48 UTC). Read-only: plain GETs + headless Chrome. No
Webflow API writes, no publish.

Artefacts:

| Path | What |
|---|---|
| `08-qa/.tmp/v2-built/<slug>/` | v2 captures (page.html, 1440/768/390 png, content.json, metrics.json) |
| `08-qa/.tmp/v2-legacy-after/<slug>/` | legacy originals re-captured after the publish |
| `08-qa/.tmp/capture2.mjs` | harness (adapted from `v2-reference/capture.mjs`, original untouched) |
| `08-qa/.tmp/parity-v2.json` · `regression.json` | machine diffs |
| `08-qa/.tmp/sheets/` | filmstrips used for the visual pass |
| `08-qa/.tmp/probe.mjs` · `probe2.mjs` · `faq-probe.mjs` · `widest.mjs` | follow-up probes |

All 12 captures were clean on the first pass — no throttled loads, no retries, no 0x0 images,
no ~1000px bodies.

---

## 1. Verdict table

| v2 page | Verdict | Blocking defect |
|---|---|---|
| `/new-patient-special-v2` | **FAIL** | S1 — FAQ rows overflow the 390px viewport |
| `/invisalign-v2` | **FAIL** | S1 — same |
| `/new-patient-special-consultation-v2` | **FAIL** | S2 — hero `<h1>` renders at 1.86:1 contrast |
| `/invisalign-consultation-v2` | **FAIL** | S2 — same |
| `/new-patient-thank-you-v2` | **FAIL** | S1 — same |
| `/invisalign-thank-you-v2` | **FAIL** | S1 — same |

Read the table with its context: **the builds themselves are in very good shape.** Structure,
grids, breakpoint collapses, content correction, links, forms, assets and desktop/tablet layout
all pass on all six pages, and every text difference against the reference maps to a logged
substitution. Six FAILs come from exactly **two shared-class CSS bugs** (S1 on `*_faq_question`,
S2 on `consult_hero_h1`). Both are one-property fixes. Nothing needs rebuilding.

Desktop (1440) and tablet (768) alone would be PASS-with-notes on all six.

---

## 2. Body height parity (v2 vs reference)

| Page | 1440 | 768 | 390 |
|---|---|---|---|
| new-patient-special | 10976 → 11036 (+0.5%) | 15287 → 15942 (+4.3%) | 17421 → 16745 (−3.9%) |
| invisalign | 10709 → 11072 (+3.4%) | 14948 → 15859 (+6.1%) | 17296 → 16593 (−4.1%) |
| new-patient-special-consultation | 2187 → 2558 (+17.0%) | 2625 → 3283 (+25.1%) | 2870 → 2945 (+2.6%) |
| invisalign-consultation | 2187 → 2577 (+17.8%) | 2625 → 3321 (+26.5%) | 2870 → 2995 (+4.4%) |
| new-patient-thank-you | 5481 → 4520 (−17.5%) | 6420 → 5056 (−21.2%) | 7692 → 4579 (−40.5%) |
| invisalign-thank-you | 5481 → 4547 (−17.0%) | 6420 → 5059 (−21.2%) | 7692 → 4590 (−40.3%) |

**Both large deltas are explained and are not defects:**

- *Consultation +17/+25%.* The reference's white card is **empty** (no form, no iframe, nothing in
  the DOM). v2 puts a real 6-field form in it. Logged substitution #1/#10. The hero section alone
  goes 602 → 911px. Expected.
- *Thank-you −17/−21/−40%.* The reference's FAQ accordion renders **permanently expanded** — all
  seven answers visible, section height 1968px. v2's native Webflow Dropdown collapses correctly:
  940px. That single section is ~1030px of the ~960px total delta at 1440, and at 390 the
  reference's expanded answers wrap into many more lines, which is the whole −40%. v2 is behaving
  *better* than the reference here.

Everything else is within ±6%.

### Section-by-section (1440)

| new-patient-special | ref | v2 | | invisalign | ref | v2 |
|---|---|---|---|---|---|---|
| hero (+stat band) | 1010 | 959+101 | | hero (+stat band) | 1010 | 959+101 |
| journey (+CTA block) | 2220+683 | 2159 | | journey (+CTA block) | 2208+683 | 2290 |
| difference/reviews | 1204 | 1127 | | difference/reviews | 1204 | 1127 |
| doctor | 1322 | 1394 | | doctor | 1322 | 1395 |
| treatments | 1176 | 1124 | | treatments | 998 | 1029 |
| process | 1060 | 1090 | | process | 1060 | 1090 |
| gallery (hidden, 0x0) | 0 | *skipped* | | gallery (hidden, 0x0) | 0 | *skipped* |
| office tour | 917 | 1125 | | office tour | 917 | 1125 |
| FAQ | 1082 | 952 | | FAQ | 1082 | 952 |
| closer | 501 | 594 | | closer | 407 | 594 |

Section counts 11 → 10 on both LPs: the missing one is the deliberately skipped hidden
`imp-gallery` ("Real Patients. Real Results.", 0x0 on the reference). Intended, logged.

No section collapsed, exploded, or went missing. Largest single delta is the office tour at +23%
(cosmetic, see S6).

---

## 3. Unexplained differences, ranked

### S1 — BLOCKING · FAQ rows overflow the mobile viewport (4 pages)
`lp_faq_question` / `confirm_faq_question` (on the `.w-dropdown-toggle`) inherit Webflow's
`white-space: nowrap`, so a long question cannot wrap. Measured on `/new-patient-special-v2`
at a 390px viewport (`document.documentElement.clientWidth = 390`):

| element | right edge | overflow |
|---|---|---|
| question text div | 522px | +132px |
| `lp_faq_icon` ("+") | 546px | +156px |

`body { overflow-x: clip }` (site head CSS) removes the scrollbar, so `scrollWidth` reports no
overflow — the check has to be done on box geometry, which is why the harness's own
`scrollWidth <= innerWidth` assertion passed vacuously on every page. The visible consequence on a
phone: **the tail of every FAQ question and the entire "+" icon are clipped off-screen.**

Widest measured content per page at a 390 viewport — the tell is that the two pages with **no FAQ
section measure exactly 390**:

| page | content width @390 |
|---|---|
| new-patient-special-v2 | 546 |
| invisalign-v2 | 517 |
| new-patient-thank-you-v2 | 557 |
| invisalign-thank-you-v2 | 521 |
| new-patient-special-consultation-v2 | **390** (no FAQ) |
| invisalign-consultation-v2 | **390** (no FAQ) |
| all six *legacy* originals | **390** |

Fix: `white-space: normal` on `lp_faq_question` and `confirm_faq_question` (add `min-width: 0` on
the grid item if the track still refuses to shrink).

*Confidence: high on the geometry (measured, reproducible, mechanism identified and consistent
with the FAQ/no-FAQ split). One secondary detail is uncertain:* headless mobile emulation also
reports `window.innerWidth = 546`, i.e. it zooms the page out to fit. A real device honouring
`initial-scale=1` would instead clip. Either way the row does not fit; **what would settle it is
opening the page on a real phone.** The fix is the same in both cases.

### S2 — BLOCKING · Consultation hero `<h1>` is near-invisible (2 pages)
`consult_hero_h1` sets no colour, so the heading inherits the Phase-1-rebound **h1 tag colour
`#2e3634`** and renders it on the dark hero `rgb(83,94,97)`:

```
H1 "Book Your Free Consultation"
   color rgb(46,54,52) on bg rgb(83,94,97)  ->  contrast 1.86:1
   span "Free Consultation" rgb(0,189,224)  ->  contrast 2.98:1
```

1.86:1 against a 3:1 (large text) requirement. The reference renders this headline in white. On
screen the words "Book Your" are effectively gone; only the cyan half reads. Visible at 1440, 768
and 390.

This is the exact risk Phase 1 flagged when it rebound the `h1` tag style. The LP heroes are
unaffected because their `h1` also carries `text-color-white`.

Fix: add `text-color-white` to the consultation hero `h1`, or set `color: White` on
`consult_hero_h1`. Do **not** revert the h1 tag rebind (see §5).

### S3 — MEDIUM · Form inputs ship Webflow's default placeholder
All five fields on all four form-bearing v2 pages render the literal placeholder **"Example
Text"** (read from the served DOM, not inferred):

```
field   text  "Example Text"   field-3 tel   "Example Text"
field-2 text  "Example Text"   field-4 email "Example Text"
field-5 textarea "Example Text"
```

The build reports say placeholders were "unreachable at creation, not set" — but Webflow's
*default* placeholder string is "Example Text", so unset means visibly wrong, not blank. The
reference form showed "Enter your first name", "+1 (555) 000-0000", "your@email.com", "Type your
message here". Set these in the Designer.

### S4 — MEDIUM · `/invisalign-v2` doctor-bio portrait does not depict the doctor
Under the heading "The Dentist Katy Families Trust With Their Smiles", the portrait slot is filled
with asset `6a7be01910f2318504cfa0aa` (Action-7), which shows a **female team member beside a
dental typodont**, carrying `alt="Dr. William Sung, DMD treating a patient at Mason Park Dental in
Katy, TX"`. The twin page uses an actual doctor portrait in the same slot.

This is logged as substitution #7 and the reference slot was an empty white box, so v2 is an
improvement — but the image/copy/alt mismatch is client-visible and the alt is factually wrong.
Either swap the asset or rewrite the alt.

### S5 — MEDIUM · `/invisalign-v2` footer dropped the Privacy Policy and Terms links
The reference `/invisalign` footer carries `Privacy Policy` (→ the practice's
`…_Patient_Privacy_Policy.pdf`) and `Terms of Service`. The shared **LP Footer** component has no
slot for them and the build agent correctly declined to edit the twin's component. Both links are
absent from v2. The Privacy Policy link is arguably a compliance item on a lead-capture page.

Fix as the build report recommends: add a legal-links row to LP Footer behind a "Show Legal Links"
boolean prop defaulting `false`, set `true` on this instance only.

### S6 — LOW · Cosmetic differences (no action required unless the client notices)
- **Journey eyebrow twin drift.** "One Patient's Real Smile Transformation" exists on both
  reference LPs and on `/invisalign-v2`, but was dropped by `/new-patient-special-v2`. Pick one.
- **Office-tour collage** is 23% taller in v2 (917 → 1125) with looser, more ragged masonry —
  different image aspect ratios in the three columns leave uneven whitespace.
- **FAQ heading line break lost**: reference wraps "Everything Patients Ask / Before Booking" over
  two lines; v2 renders one text node on one line.
- **CTA count**: reference has 8 "Book a Consultation" links per LP, v2 has 6. One is the skipped
  hidden gallery's CTA; the other (`div-block-41`) is now `display:none` on the legacy page too
  (see §5), so it was visible in the reference and is not in v2.
- **Accent cyan `#00bde0`** measures 2.98:1 on the dark sections and 2.24:1 on white — below 3:1
  for large text. Inherited from the reference brand treatment, not a v2 regression, but worth
  raising with the client.

---

## 4. Checks that PASSED (with the evidence, so nobody re-runs them)

| Check | Result |
|---|---|
| **Text diff** | Every missing/added text run on all six pages maps to a logged substitution. The thank-you pages' 47 missing / 40 added runs are exactly the Livewell leakage removal: (703) 844-2975, 9027 Silverbrook Rd / Fairfax Station VA, Livewell hours, the implant "treatment delayed" scare column, and the 7-item implant FAQ with $1,900–$2,800 pricing — all gone, all replaced with sourced Mason Park content. **Zero unexplained copy.** |
| Case-only diffs | "Designed for your face" → "Designed For Your Face" etc. are text-node changes only; both render identically under `text-transform: capitalize`. Not visible. |
| **Links** | Reference had 11 bad hrefs per LP (`#`, `tel:835:+…`); **v2 has 0**. All v2 hrefs resolve to `#top`, `#form`, `tel:+12817698878`, or the practice's Google Maps place URL. Malformed `tel:835:` gone everywhere. |
| **Images** | 0 broken. 20 images per LP, 2 per short page, **none** at 0x0, none with a failed src, **none with an empty alt**. The 4–6 images the harness flagged were `img.complete === false` (decode not finished at extraction) with full natural dimensions — they paint correctly in every screenshot. Capture artifact. |
| **The reference's two broken `/invisalign` images** (doctor portrait + process photo, empty `w-video w-embed` boxes) are filled on v2. |
| **Forms** | All four form pages render a native `Email Form` with 6 fields, all visibly sized (514×47 inputs, 514×180 textarea, 514×58 submit at 1440; 485×47 on consultation). Required flags set on 4/5. Thank-you pages have no form — matches the reference. |
| LeadConnector iframe | Present on both reference LPs, **absent from v2** (embeds `[]`). Intended — no cross-client form. Lead delivery still blocked on the client's `{{GHL_INBOUND_WEBHOOK_URL}}` placeholder. |
| **FAQ accordion works** | Verified with real CDP input events on `/new-patient-thank-you-v2`: click → `w--open` on toggle and list, `aria-expanded="true"`, list `display:block`, height 0 → 100px, answer visible. *An earlier synthetic `element.click()` reported "does not open" — that was a probe artifact, not a defect.* |
| Watermark overflow | `consult_proof_watermark` extends to 4364px but every ancestor clips it (`overflow:hidden` on `section_consult_proof`). Intended decoration, not overflow. |
| SEO titles | All six v2 titles byte-identical to their originals. |
| Breakpoint collapses | Verified visually at 768 and 390: hero → 1 col, stat band 5→2, difference 4→2→1, reviews 3→2→1, treatments →1, tour 3→2→1, doctor →1, expect 2→1, why 3→1, contact 3→1. All match the build reports' grid tables. |

---

## 5. LEGACY REGRESSION GATE — **FAIL** (but not for the reason the gate was built to catch)

Legacy body heights are all within ±1.2% of the pre-change reference (largest: consultation @768,
+32px). No layout regression. **But two visible regressions and a set of unlogged content edits
did ship.**

### R1 — `.imp-section-label` is now `display: none` (4 legacy pages)
Measured on `/new-patient-thank-you`:

```
span.imp-section-label "what happens next"   display:none  rect 0x0
span.imp-section-label "why people chose us" display:none  rect 0x0
span.imp-section-label "before you call"     display:none  rect 0x0
```

Confirmed in the screenshots. Section eyebrows that render in `v2-reference/` are gone in
`v2-legacy-after/`:

| page | eyebrows lost |
|---|---|
| `/new-patient-thank-you`, `/invisalign-thank-you` | WHAT HAPPENS NEXT · WHY PEOPLE CHOSE US · BEFORE YOU CALL |
| `/new-patient-special`, `/invisalign` | — THE MASON PARK DIFFERENCE · — YOUR COMPREHENSIVE OPTIONS · BEFORE YOU BOOK · LIMITED CONSULTATION AVAILABILITY |

A `div.div-block-41` wrapping a "Book a Consultation" button is also `display:none` on the LPs now.

### R2 — bare `<span>` lost its block display on the thank-you CTA address
`<a class="ty-cta__fact-link">9027 Silverbrook Rd Ste. F<span>Fairfax Station, VA 22039</span></a>`
— the span used to break to its own line and now renders inline, so the address reads
**"9027 Silverbrook Rd Ste. FFairfax Station, VA 22039"**. Visible in
`v2-legacy-after/new-patient-thank-you/1440.png`.

### R3 — the originals were content-edited, not just restyled
`page.html` differs between the Aug-14 reference and the Aug-17 publish by more than the CSS/JS
hashes. Real markup and copy changes on the **original** pages:

- **Em dashes stripped or mangled** across `/new-patient-special` and `/invisalign`:
  `"sets the plan himself — without handing you off"` → `"…himself without handing you off"`;
  `"PLACEHOLDER — this section needs"` → `"PLACEHOLDER ---- this section needs"`;
  `"personally — from the digital scan"` → `"personally from the digital scan"`.
- `<p class="landing-p1">` → `<p>` (class removed).
- `<div class="code-embed-9 …">` → `<div class="google-reviews …">` (class renamed).
- `<strong>Dental Crowns</strong>` → `Dental Crowns<br/>` inside an `<h3>`.
- On `/invisalign`, the two empty `<div class="story-vert w-video w-embed">` boxes were **replaced
  with real `<img>` tags** (`dr-cho.jpg`, `Action-13-scaled.jpg`), plus a new
  `<div class="imp-hero-copy block">`.

The last one is an improvement, but PLAN.md's state log records that "the original pages were NOT
structurally touched — their lastUpdated bumps are site-wide style edits, not content edits."
**That is falsified.** Someone (most plausibly a build agent, given the UTF-8-shaped em-dash
damage) edited the originals in the Designer, and this publish shipped it.

### Should `theme-rollback.json` be applied? — **No.**
The Phase-1 rebind is not the cause. On the legacy thank-you page the `h1` still computes
`rgb(11,44,65)` (the legacy navy) and body copy `rgba(16,24,32,…)` — the legacy page classes
override the tag styles, so Phase 1's body/h1 colour, margin and font-size changes have **no
visible effect on the legacy pages at all**. Reverting them would not restore a single eyebrow.
Fix `.imp-section-label` (and the bare `span`) directly instead, and separately decide whether to
revert the R3 copy edits.

*Confidence: high on R1 (computed `display:none`, corroborated by both screenshots and the text
diff) and R3 (byte-level HTML diff). R2 is high on the symptom; the exact rule that lost is not
pinned — inspecting the published stylesheet for the `.ty-cta__fact-link span` / bare-`span` rule
would settle it.*

---

## 6. Prioritised fix list

| # | Sev | Page(s) | Element / class | Fix |
|---|---|---|---|---|
| 1 | **Blocker** | nps-v2, inv-v2, both thank-you-v2 | `lp_faq_question`, `confirm_faq_question` (on `.w-dropdown-toggle`) | `white-space: normal` (add `min-width: 0` on the grid item if needed). Re-verify at 390 that the widest element ≤ 390. |
| 2 | **Blocker** | both consultation-v2 | hero `<h1>` / `consult_hero_h1` | Add `text-color-white`, or set `color: White` on `consult_hero_h1`. Target ≥ 4.5:1 (currently 1.86:1). |
| 3 | High | LEGACY nps, inv, both thank-you | `.imp-section-label` | Remove the `display:none`; restore the eyebrow style. This is a live-site regression on the client's existing pages. |
| 4 | High | LEGACY both thank-you | bare `<span>` inside `.ty-cta__fact-link` | Restore `display:block` so the address breaks over two lines ("Ste. FFairfax Station" today). |
| 5 | High | LEGACY nps, inv | page copy | Decide whether to revert the R3 edits (em dashes, `landing-p1`, `<strong>`→`<br>`). Keep the `/invisalign` image fills. |
| 6 | Medium | 4 form pages | `field`, `field-2`…`field-5` in **LP Hero Form Card** | Replace the "Example Text" placeholders with the reference strings (Designer — unreachable via the API). |
| 7 | Medium | inv-v2 | doctor-bio `lp_doctor_image` (asset `6a7be01910f2318504cfa0aa`) | Swap for a real Dr. Sung portrait, or rewrite the alt to describe the person actually shown. |
| 8 | Medium | inv-v2 | **LP Footer** component | Add a legal-links row (Privacy Policy PDF + Terms) behind a `Show Legal Links` boolean prop, default `false`, `true` on this instance. |
| 9 | Low | nps-v2 | `section_lp_journey` eyebrow | Add "One Patient's Real Smile Transformation" (or drop it from inv-v2) so the twins match. |
| 10 | Low | both LP-v2 | `lp_tour_grid` / `lp_tour_image` | Even up the collage aspect ratios; the section runs 23% taller than the reference with ragged whitespace. |
| 11 | Info | both consultation-v2 | page settings | `noindex` still not set (page-settings custom code is forbidden headlessly). Set in the Designer before go-live. |
| 12 | Info | site head | `{{GHL_INBOUND_WEBHOOK_URL}}` | Pre-existing client blocker; forms capture nothing until it is filled in. |

---

## 7. Measurement notes — things that look like defects and are not

Recorded because earlier sessions on this project shipped four phantom defects.

1. **`document.scrollWidth <= window.innerWidth` is a vacuous test on this site.**
   `body { overflow-x: clip }` in the site head CSS means `scrollWidth` can never exceed the
   viewport, no matter how far content overflows. Real overflow must be found by walking box
   geometry against `document.documentElement.clientWidth`. The v2 metrics.json overflow entries
   pass for this reason and should not be read as an all-clear.
2. **`window.innerWidth` is not the layout viewport in mobile emulation.** At a 390 device width
   the four FAQ pages report `innerWidth` 517–557 while `documentElement.clientWidth` stays 390.
   That gap *is* the overflow signal, but it also means the `390.png` captures for those pages are
   517–557 CSS px wide, not 390 — do not measure mobile layout off them.
3. **`img.complete === false` is not a broken image.** All 10 flagged images had full natural
   dimensions and painted correctly.
4. **The extractor's `vis()` only checks the text node's parent**, not its ancestors. Hidden
   subtrees (the reference's `imp-gallery`, Webflow's form success/error blocks, closed dropdown
   answers) appear in `content.json` as visible text. Never treat their presence/absence as proof.
5. **A synthetic `element.click()` does not open a Webflow Dropdown.** Use
   `Input.dispatchMouseEvent`. The FAQ works.
6. **Comparing screenshots at different display scales invents typography defects.** The thank-you
   `<h1>` looked 27% smaller than the reference until both were viewed at 1:1 — it is the same
   size, just in a narrower max-width container so it wraps to two lines.
7. **The reference thank-you FAQ is stuck open**, which is why v2's page is 40% shorter at 390.
   Height deltas against a broken reference are not defects.
