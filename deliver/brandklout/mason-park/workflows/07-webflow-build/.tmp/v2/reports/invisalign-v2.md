# Build report — Invisalign v2 (`invisalign-v2`)

Page id **6a834bd6e2d926262c031aeb** · created 2026-08-17 · draft: **true** (verified after build) · site 6a60bdc0340e5f1784b4d553.
SEO title/description copied verbatim from original page 6a75f467c7c9e1a0c133edd1.
Twin of the foundation build (New Patient Special v2, `6a830c8ce42f10b98239b594`) — **zero new classes, zero new components**. Nothing was published; the original pages, the legacy `imp-*/qz-*/landing-*/ty-*/lw-*` styles, the nps v2 page and the 5 shared `LP *` component definitions were left untouched.

## Sections built (top to bottom)

| # | Section | Marker / component | Notes |
|---|---|---|---|
| 0 | Sticky top bar | **LP Header** instance | all 4 props already default to this page's values — no overrides needed |
| 1 | Dark hero | `section_lp_hero` (domId `top`, verified) | eyebrow, star badge, 3-span h1 (accent on "Nobody", no `<br>`), 2 paras, 3 check items, button pair, serving line, **LP Hero Form Card** instance |
| 2 | Stat band | **LP Stat Band** instance | Stat 3 → "Invisalign®" / "Center Graduate" |
| 3 | Journey chapter | `section_lp_journey` | eyebrow + centred h2, framed photo, Life Before/After (5+5), 4 quote cards, CTA |
| 4 | Difference + review wall | `section_lp_difference` | 4 info cards, rating bar + Write a Review, 3 native review cards, CTA |
| 5 | Doctor bio | `section_lp_doctor` | portrait + 4 bold-lead credentials, pull quote, 4-photo team strip |
| 6 | Treatment options | `section_lp_treatments` | 3 price cards (image + copy + Ideal/Investment rows) |
| 7 | Process | `section_lp_process` | 3 numbered step cards + full-width CTA + tall photo |
| 8 | Office tour | `section_lp_tour` | 3-column collage (5 images, 1/2/2) |
| 9 | FAQ | `section_lp_faq` | 7 native Webflow Dropdown accordions |
| 10 | Dark closer | **LP Closer** instance | copy via props |
| 11 | Footer | **LP Footer** instance | legal disclaimer via prop |

**Skipped deliberately:** the hidden `imp-gallery` "Real Patients. Real Results." section — 0×0 on the reference, its 6 images all carry "Placeholder — replace with a consented Mason Park patient case" alts. Same call as the nps v2 build.

Page skeleton read back in order: `page-wrapper` > **Global Styles** instance (FIRST child) > **LP Header** > `main-wrapper` (tag `main`) > hero > stat band > journey > difference > doctor > treatments > process > tour > faq > **LP Closer** > **LP Footer**. Identical to the twin.

## Classes — 0 created, ~55 reused

**No `inv_*` class was needed.** Every section on this page is structurally identical to its nps v2 twin, so the whole build reuses the shared families:

- `lp_*` (shared LP family, built by the nps v2 foundation): `section_lp_{hero,journey,difference,doctor,treatments,process,tour,faq}`, `lp_eyebrow`(+`is-ink`), `lp_heading-accent`, `lp_text-muted`, `lp_text-on-dark`, `lp_stars`, `lp_hero_grid`, `lp_hero_badge`, `lp_hero_fineprint`, `lp_check-list/-item/-icon/-text`, `lp_journey_media-frame`, `lp_journey_image`, `lp_compare-grid`, `lp_ba-card`(+`is-dark`), `lp_ba-title`, `lp_ba-list`, `lp_ba-item`, `lp_ba-mark`(+`is-negative`), `lp_quotes-grid`, `lp_quote-card`(+`_image/_body/_step/_quote/_text`), `lp_difference_grid`, `lp_info-card`, `lp_reviews_bar/_score/_count/_grid`, `lp_review-card`(+`_text/_who/_when`), `lp_doctor_grid`, `lp_doctor_image`, `lp_pull-quote`, `lp_team-grid`, `lp_team-image`, `lp_treatments_grid`, `lp_price-card`(+`_image/_body/_meta/_row/_row-label/_row-value`), `lp_process_grid`, `lp_step-list`, `lp_step-card`(+`_head/_number/_title`), `lp_process_image`, `lp_tour_grid`, `lp_tour_column`, `lp_tour_image`, `lp_faq_list/_item/_question/_icon/_answer/_answer-text`.
- Kit globals/combos: `page-wrapper`, `main-wrapper`, `padding-global`, `container-large`, `padding-section-large`, `padding-vertical`+`padding-xlarge`, `margin-bottom`/`margin-top` (+`xxsmall/xsmall/small/medium/large`), `text-align-center`, `max-width-large`(+`align-center`), `heading-style-h2`, `heading-style-h6`, `text-color-white`, `text-weight-bold`, `button`(+`is-secondary`, `is-ink`, `is-full`), `button-group`(+`is-center`).

No `lp_*` definition was edited. No class was forked.

## Component instances + prop values set

| Instance | Component id | Props |
|---|---|---|
| LP Header | `d23daa09-…5ca5` | none overridden — defaults ("📞 (281) 769-8878", tel `+12817698878`, "Book a Consultation", `#form`) already equal this page's reference values |
| LP Hero Form Card | `6b1624b8-…6c44` | none overridden — reference Title/Description are byte-identical to the component defaults ("Start Your Smile Consultation" / "Tell us what you would like to change about your smile…") |
| LP Stat Band | `bedcc43c-…60f4` | Stat 3 Value → **"Invisalign®"**, Stat 3 Label → "Center Graduate" |
| LP Closer | `3d69d420-…15d6` | Eyebrow "Limited Consultation Availability", Headline Line **"Stop Waiting On A Smile"**, Headline Accent **"You Could Start This Month"**, Paragraph (reference text), CTA Label "Book a Consultation" |
| LP Footer | `e7911d8c-…faa8` | Legal Text → the Invisalign disclaimer ("…anatomy and treatment plan… Candidacy for Invisalign is determined at a clinical examination…") |

All prop writes read back with the set values.

## Grid gate — all 11 grids read back at main/medium/small/tiny

Every grid class is shared with the twin; none was created or edited here. Read-back confirms the reference collapses:

| Grid class | base | medium ≤991 | small ≤767 | tiny ≤478 |
|---|---|---|---|---|
| lp_hero_grid | 1.05fr .95fr, 4/3rem | 1fr | – | – |
| lp_stats_grid | 5×1fr, 2/1.5rem | 4×1fr | 2×1fr, 1.5/1.25rem | – |
| lp_compare-grid | 1fr 1fr, 2/1.5rem | – | 1fr | – |
| lp_quotes-grid | 4×1fr, 1.5rem | 2×1fr | – | 1fr |
| lp_difference_grid | 4×1fr, 1.5rem | 2×1fr | – | 1fr |
| lp_reviews_grid | 3×1fr, 1.5rem | 2×1fr | 1fr | – |
| lp_doctor_grid | .9fr 1.1fr, 4/3rem | 1fr, rg 2.5rem | rg 2rem | – |
| lp_team-grid | 4×1fr, 1.5rem | – | 2×1fr | – |
| lp_treatments_grid | 3×1fr, 2rem | 1fr | – | – |
| lp_process_grid | 1.05fr .95fr, 4/3rem | 1fr | – | – |
| lp_tour_grid | 3×1fr, 1.5rem | 2×1fr | 1fr | – |

(Inherited deviation: `data_element_builder` exposes no Grid element type, so grid containers are Div Blocks whose class sets `display:grid` — CSS-identical to `w-layout-grid`.)

## Substitution log (reference said X → v2 says Y → source of Y)

1. **LeadConnector iframe** (Livewell form `6SUhknD0606Y66ZAgaZI`, title "Livewell Dental Google Cosmetic - Landing") → **LP Hero Form Card** instance (native Webflow form "Smile Consultation Form") → BUILD-POLICY forms rule. **Lead delivery is still NOT wired** — the site head carries the `{{GHL_INBOUND_WEBHOOK_URL}}` placeholder (pre-existing client blocker); nothing points at Livewell.
2. **Elfsight Google-review widget** (renders "4.9 (1,036)" and reviews attributed to "Patient story — Peter O./Kathy R./Dominic P.") → native review wall: **5.0**, "320+ Google reviews", and 3 verbatim Mason Park Google reviews (**Gabriel Sanchez**, **Alli Chun**, **Kristian Ball**) → `04-design/.tmp/invisalign/index.html` "The Proof" section, which is this page's approved design source. "Write a Review" → the practice's Google Maps listing (same URL as the twin).
   *Note:* the Alli Chun review names "Gen and Dr. Cho". It is a genuine Mason Park patient review naming real practice staff, not Livewell leakage, so it was kept verbatim rather than invented around.
3. **`tel:835:+12817698878`** (malformed, header + hero) → `tel:+12817698878` → BUILD-POLICY §2. The header instance inherits the corrected component default; the hero "Call (281) 769-8878" button was built with `linkType: phone`.
4. Hero serving line "…Bear Creek & West Houston **& West Houston**" (duplicated fragment) → single "& West Houston" → page's own footer line + 04-design.
5. **Journey intro was an internal placeholder note** — "PLACEHOLDER — this section needs a real Mason Park Invisalign case with the patient's written consent. Do not publish…" → replaced with approved Mason Park Invisalign copy: "The question worth answering is not whether to straighten them. It is what it actually involves, what it actually costs, and whether you are a candidate at all — which takes one free appointment to find out." → `04-design/.tmp/invisalign/index.html` ("The Hesitation").
6. Journey photo alt "Placeholder image - replace with a real Mason Park patient after photo" (asset `6a7be0286af3eb417405e8cd`) → asset kept, alt → "Patient consultation at Mason Park Dental in Katy, TX" → BUILD-POLICY alt rule (describe the asset actually shown).
7. **Doctor portrait renders as an empty white box on the reference** — the markup is `<div class="story-vert w-video w-embed"></div>`, an empty video embed with no asset at all. Filled with **`6a7be01910f2318504cfa0aa`** (Action-7), alt "Dr. William Sung, DMD treating a patient at Mason Park Dental in Katy, TX" → the reference page's own alt for that asset identifies the subject as Dr. Sung, and it is full-resolution (the 569×854 slot needs it).
   *Why not the obvious candidates:* `dr-sung.webp` (`6a75f6f59d16ef209fb2def2`, the local design's portrait) is only **230×300** — measured, would upscale ~2.8× and look soft; `Dr.-William-Sung.webp` (`6a7be031c2af3a51be5a93bb`) is the same size class. The twin's `dr-cho.jpg` was rejected because this page's copy is explicitly about Dr. Sung.
8. Team strip slot 2 would then have duplicated the portrait, so it was re-filled with **`6a7be018adeb1150525b5b1e`** (Action-5-1), alt "Patient care at Mason Park Dental in Katy, TX" → the same asset the nps v2 team strip uses in that slot. Strip is now: Dr. William Sung headshot (264px — a size the small asset supports), Action-5-1, Action-13, Action-19.
9. **Process photo renders as an empty white box on the reference** (same empty `w-video w-embed`) → **`6a7be01944e4e802bb806792`** (Action-13), alt "Patient care at Mason Park Dental in Katy, TX" → BUILD-POLICY "prefer the same asset the new-patient-special page uses for the same slot".
10. **Credential 4 was an internal placeholder** — "National Clinical Educator / — PLACEHOLDER: add a verified Dr. Sung credential here" → replaced with **"10+ years of dental experience - and 100+ hours of continuing education every year"** → `04-design/.tmp/invisalign/index.html` (The Provider). The twin's "trusted to train other dentists…" line was NOT reused: it originates from the Livewell-cloned reference and is not corroborated by any Mason Park source in this repo.
11. **Treatment card 2 copy contradicted its own title** — "Invisalign Comprehensive / *Personalized porcelain* for a more comprehensive change in shape, color, proportion, or symmetry" (veneer copy under an aligner tier) → "Aligners are custom-designed to your dental structure for alignment, comfort and effectiveness throughout." (verbatim) → `04-design/.tmp/invisalign/index.html` ("Personalised treatment plans").
12. Treatment card 1 alt "Invisalign Express for minor crowding at Mason Park Dental" (a claim, not a description, on a card titled "Whitening & Bonding") → "Clear aligner tray held up beside a straightened smile" → BUILD-POLICY alt rule.
13. "Book a Consultation" href `#` (all 6 reference occurrences) → `#form` — 4 page-level buttons plus the header and closer CTAs, which inherit `#form` from their component defaults. The form card root carries domId `form`.
14. Journey eyebrow "One Patient's Real Smile Transformation" is present on the reference (`imp-section-label`) and **is** built here; the nps v2 twin omitted it. Flagged below.

**Kept verbatim despite being imperfect adaptations** (reference content, no cross-client leakage, no verified replacement available): quote card 04 "Master-crafted porcelain, shaded and shaped…" and process step 3 "Master-crafted porcelain or refined bonding…" — both read as veneer copy on an aligner funnel. Worth a copy pass by the client, but inventing replacements would breach the no-invention rule.

## Flags for the orchestrator

- **Footer legal links missing.** The invisalign reference footer carries a line the nps reference does not: `Privacy Policy` (→ `…/6a7be0536588ef69bd70edbb_Patient_Privacy_Policy.pdf`) · `Terms of Service` (href `#`). The shared **LP Footer** component has no elements or props for it, and adding them would change what the finished nps v2 page renders — so it was **not** added. Recommended fix: extend LP Footer with a legal-links row plus a boolean "Show Legal Links" prop defaulting to `false`, then set it `true` on this instance only. Not done here per the "do not modify the twin" constraint.
- **Journey eyebrow divergence.** "One Patient's Real Smile Transformation" exists on both reference pages but was dropped by the nps v2 build; it is built here. Either add it to nps v2 or drop it here so the twins stay identical.
- **Doctor credential conflict (unresolved, content-side).** The LP reference claims "UCSF DDS & AEGD trained"; `04-design/.tmp/invisalign` says "Dental degree from Tufts University, Boston". Both v2 LPs currently carry the UCSF line (twin consistency). The client should confirm which is true before publish.
- **Twin's stray-string sweep vs. link read-back.** `get_all_elements` reports `settings.link` as absent for `#`-anchor links even when the link is stored — the four `#form` CTAs here read back correctly via `get_settings key:"link"` (`{"mode":"url","to":"#form"}`). The nps v2 report's claim that "`set_link` drops url-type links about half the time" is likely this same false negative; the nps CTAs are probably fine and worth re-checking with `get_settings` rather than the tree read.

## Unreachable via API / degradations (all inherited from the foundation build)

- **Grid element type** not exposed by `data_element_builder` → `display:grid` classes on Div Blocks.
- **Form field placeholders** unreachable (component-internal, known trap) — reference placeholders not set.
- **FAQ accordion** = native Webflow Dropdown (needs `webflow.js`, present on published pages); `DropdownList` is `position:static` so it pushes content down. The "+" icon is static and does not flip to "−" (would need custom code, disallowed).
- **h2–h6 tag styles** cannot be themed headlessly → every heading level 2+ carries a class. Verified: 7× `heading-style-h2`, 7× `heading-style-h6`, 3× `lp_step-card_title` (self-styling), plus the single h1 on the themed `h1` tag with `text-color-white`. **18 headings, 0 unclassed.**
- Element snapshots not taken (Designer-bridge tool). Phase 3 screenshot diff remains the visual gate.
- Two 429 rate-limit hits during read-back; all retried and completed.

## Verification

- Full tree read back after build: 12 blocks in order, Global Styles instance is the first child of `page-wrapper`, `main-wrapper` tag = `main`, hero domId = `top`.
- Element census: 173 Blocks, 88 Paragraphs, 61 DOM, 19 Images, 18 Headings, 7 Dropdown accordions, 6 Links, 6 ComponentInstances. **0 HtmlEmbeds** (query returns 0).
- Stray builder defaults swept: 7× String "Heading" and 4× lorem-ipsum removed; re-query returns 0. Dropdown defaults ("Dropdown", "Link 1/2/3") and their Icon elements removed — 0 remain.
- All 4 `#form` CTA links, the `tel:+12817698878` hero button and the Google Maps review link confirmed by per-element `get_settings`.
- All 11 grid classes read back at main/medium/small/tiny (table above).
- Page settings after build: **draft: true**. No publish performed. Originals, legacy styles, nps v2 and Asana untouched.
