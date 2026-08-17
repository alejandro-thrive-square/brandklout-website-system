# Build report — New Patient Special v2 (`new-patient-special-v2`)

Page id **6a830c8ce42f10b98239b594** · created 2026-08-17 · draft: true (verified) · site 6a60bdc0340e5f1784b4d553.
SEO title/description copied verbatim from original page 6a75f468bfddad669aaf8321.
This is the FOUNDATION build: the shared `lp_*` family + 5 components below are what the invisalign v2 build reuses.

## Sections built (top to bottom)

| # | Section | Marker / component | Notes |
|---|---|---|---|
| 0 | Sticky top bar | **LP Header** component (`lp_header`) | logo + phone + `button is-small` CTA → `#form` |
| 1 | Dark hero | `section_lp_hero` (domId `top`) | eyebrow, star badge, split h1 (accent span), 2 paras, 3-item check list, button pair, serving line, **LP Hero Form Card** component |
| 2 | Stat band | **LP Stat Band** component (`section_lp_stats`) | 5 stats; stat 3 bound to props (differs per LP) |
| 3 | Journey chapter | `section_lp_journey` | centered h2, framed photo, Life Before/After cards, 4 quote cards, CTA |
| 4 | Difference + review wall | `section_lp_difference` | 4 info cards, rating bar + Write a Review, 3 native review cards, CTA |
| 5 | Doctor bio | `section_lp_doctor` | portrait + credential check list (bold-lead spans), pull quote, 4-photo team strip |
| 6 | Treatment pricing | `section_lp_treatments` | 3 price cards with image, rich copy, Ideal/Investment rows |
| 7 | Process | `section_lp_process` | 3 numbered step cards + full-width CTA + tall photo |
| 8 | Office tour | `section_lp_tour` | 3-column photo collage (5 images, 1/2/2) |
| 9 | FAQ | `section_lp_faq` | 7 native Webflow **Dropdown** accordions (no custom code) |
| 10 | Dark closer | **LP Closer** component (`section_lp_closer`) | copy via props; phone + hours fine print |
| 11 | Footer | **LP Footer** component (`section_lp_footer`, tag footer) | brand, address, serving, ©, legal prop |

**Skipped deliberately:** the hidden `imp-gallery` "Real Patients. Real Results." section — renders 0x0 on the reference and its images carry "Placeholder — replace with a consented Mason Park patient case" alts. Not rebuilt (per build directive).

Page skeleton: `page-wrapper` > **Global Styles** instance (`f86f2f55-a6b5-a9dc-59f9-37a621e265f2`, FIRST child) > `lp_header` (header) > `main-wrapper` (main) > sections.

## Classes — created 94 globals + 9 combos, ~26 kit classes reused

### Reuse manifest (`lp_*` family → purpose)

**Section markers** (`section_lp_*`): `hero` (S2 dark bg/white), `stats` (#2b2b2d band — no var exists for this hex), `journey` (empty), `difference` (bg Lightest), `doctor` (empty), `treatments` (bg Lightest), `process` (empty), `tour` (empty), `faq` (bg Lightest), `closer` (bg Neutral Dark, centered), `footer` (bg Ink, centered).

**Header**: `lp_header` (sticky/z-200/white/border-bottom), `lp_header_container` (flex space-between), `lp_header_logo` (3.4rem), `lp_header_actions` (flex gap), `lp_header_phone` (bold ink link; hidden @tiny).

**Text utilities**: `lp_eyebrow` (accent uppercase ls; combos `is-ink`, `is-white`), `lp_heading-accent` (accent italic span inside headings), `lp_text-muted` (Neutral Darker), `lp_text-on-dark` (Neutral Light), `lp_stars` (gold letterspaced stars).

**Hero**: `lp_hero_grid` (1.05fr/.95fr→1fr@991), `lp_hero_badge` (pill outline W30), `lp_hero_fineprint` (W60 small), `lp_check-list`/`lp_check-item`/`lp_check-icon` (accent circle ✓)/`lp_check-text` (shared by hero + doctor bullets).

**Form card**: `lp_form-card` (white, Radius Medium, big shadow, domId `form`), `lp_form-card_title`, `lp_form-card_desc`, `lp_form-card_submit` (Ink Navy full-width). Fields reuse kit `form_field-wrapper`/`form_field-label`/`form_input`(+`is-text-area`).

**Stats**: `lp_stats_grid` (5→4@991→2@767), `lp_stats_value`, `lp_stats_label`.

**Journey**: `lp_journey_media-frame` (dark frame 62rem), `lp_journey_image`, `lp_compare-grid` (2→1@767), `lp_ba-card` (+`is-dark`), `lp_ba-title`, `lp_ba-list`, `lp_ba-item`, `lp_ba-mark` (+`is-negative` #e08a7a ✕), `lp_quotes-grid` (4→2@991→1@478), `lp_quote-card` (+`_image` square, `_body`, `_step`, `_quote`, `_text`).

**Difference/reviews**: `lp_difference_grid` (4→2@991→1@478), `lp_info-card`, `lp_reviews_bar` (flex wrap space-between), `lp_reviews_score`, `lp_reviews_count`, `lp_reviews_grid` (3→2@991→1@767), `lp_review-card` (+`_text`, `_who`, `_when`).

**Doctor**: `lp_doctor_grid` (.9fr/1.1fr→1fr@991), `lp_doctor_image`, `lp_pull-quote` (3px left border italic), `lp_team-grid` (4→2@767), `lp_team-image` (square).

**Treatments**: `lp_treatments_grid` (3→1@991), `lp_price-card` (+`_image` 15rem cover, `_body` flex-grow, `_meta` mt-auto, `_row` bordered space-between, `_row-label`, `_row-value`).

**Process**: `lp_process_grid` (1.05fr/.95fr→1fr@991), `lp_step-list`, `lp_step-card` (+`_head`, `_number` accent circle, `_title`), `lp_process_image`.

**Tour**: `lp_tour_grid` (3→2@991→1@767), `lp_tour_column` (flex column masonry), `lp_tour_image`.

**FAQ**: `lp_faq_list`, `lp_faq_item` (on DropdownWrapper), `lp_faq_question` (on DropdownToggle), `lp_faq_icon` (static "+"), `lp_faq_answer` (on DropdownList, `position:static` so it pushes content = accordion), `lp_faq_answer-text`.

**Closer/footer**: `lp_closer_fine`, `lp_closer_phone-link`, `lp_footer_brand`, `lp_footer_line`, `lp_footer_legal`.

### Kit combos created (missing from Mason Park's kit copy)
`button.is-ink` (dark pill — Write a Review), `button.is-full` (100% width CTA), `button-group.is-center`, `max-width-large.align-center`, `heading-style-h2.text-color-white`.

### Kit classes reused (no forks)
page-wrapper, main-wrapper, padding-global, container-large, padding-section-large, padding-vertical(+padding-xlarge/padding-small), margin-bottom/margin-top (+xxsmall/xsmall/small/medium/large), text-align-center, max-width-large, align-center, heading-style-h2, heading-style-h6, text-color-white, text-weight-bold, button (+is-secondary, is-small), button-group, form_component, form_field-wrapper, form_field-label, form_input (+is-text-area).

## Grids + breakpoint definitions (READ BACK VERIFIED — see §Grid gate)

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

API limitation: `data_element_builder` has **no Grid element type**, so grid containers are Div Blocks whose class sets `display:grid` + template columns + gaps (CSS-identical to w-layout-grid; children auto-flow). Documented as a deviation from the "native Grid element" rule — unreachable headlessly.

## Components created (for the invisalign build: instance these, set props)

| Component | id | Props (id → default) |
|---|---|---|
| **LP Header** | `d23daa09-c890-5fac-e888-c19e36cc5ca5` | Phone Label `7a6d7392…d335` ("📞 (281) 769-8878"), Phone Link `98f653a4…e7d8` (tel +12817698878), CTA Label `c3ebe422…b432`, CTA Link `2bd544a8…cbb6` (#form) |
| **LP Stat Band** | `bedcc43c-dc48-2e2d-ab05-be9af3fd60f4` | Stat 3 Value `4fa98c2b…d03d` ("5.0" — invisalign sets "Invisalign®"), Stat 3 Label `9dd4bb75…01c5` ("Center Graduate") |
| **LP Hero Form Card** | `6b1624b8-c67b-714c-0d8e-6cc08d26bc44` | Title `918f384d…7d1e`, Description `887fbc56…e695`. Contains native form "Smile Consultation Form" (First-Name*, Last-Name*, Phone* tel, Email* email, Message textarea, Submit). Card root carries domId `form` |
| **LP Closer** | `3d69d420-9fb4-6ef8-2b1e-ef628d5815d6` | Eyebrow `e59f2b9a…6993`, Headline Line `eae8bb3f…f2b6`, Headline Accent `30527be5…9d36`, Paragraph `3d781994…07fd`, CTA Label `c23539be…15dd` |
| **LP Footer** | `e7911d8c-426d-0f93-35df-816cb86cfaa8` | Legal Text `891a777d…583d` (multiline) |

All props verified bound (text via settings key `text` on Paragraph/Heading/Link/DOM span inside defs; links via key `link`). Instance links are url/phone type (survive transform — verified, no `#` degradation).

## Substitution log (reference said X → v2 says Y → source)

1. LeadConnector iframe (Livewell form `6SUhknD0606Y66ZAgaZI`) → **native Webflow form** "Smile Consultation Form", same visible fields as the rendered iframe (First/Last/Phone/Email/message) → BUILD-POLICY forms rule. **Lead delivery is NOT wired** — the site head still carries the `{{GHL_INBOUND_WEBHOOK_URL}}` placeholder (pre-existing client blocker); nothing was pointed at Livewell's LeadConnector.
2. Elfsight Google-review widget (rating **4.9 (1,036)** and reviews naming "Dr. Nguyen"; third-party embed = custom code, and the 4.9/1,036 figure matches the Livewell-copied consultation pages) → native review wall: **5.0** ("Rated 5.0 by our patients on Google" — 04-design + the page's own SEO description) + "320+ Google reviews" (hero/stat-band claim) + 3 verbatim Mason Park Google reviews (Gabriel Sanchez, Amber Choate, rizi nepomuceno) → 04-design/.tmp/new-patient-special/index.html "The Proof" section. "Write a Review" links to the practice's Google Maps listing (01-content-intake).
3. `tel:835:+12817698878` (malformed, header/hero/closer) → `tel:+12817698878` → BUILD-POLICY §2.
4. Hero serving line "…Bear Creek & West Houston **& West Houston**" (copy bug) → single "& West Houston" → page's own footer line + 04-design.
5. Journey photo alt "Smile before treatment at **Livewell Dental**" → "Patient care at Mason Park Dental in Katy, TX" (photo is clinic care, not a smile) → BUILD-POLICY alt rule.
6. "← Drag to compare →" caption dropped — the live drag-compare is custom JS; v2 shows the static photo, so the caption would be false UI.
7. Doctor portrait: reference uses `dr-cho.jpg` under Dr. William Sung's bio with an EMPTY alt. Kept the same asset (policy: "prefer the same asset the new-patient-special page uses for this slot") with neutral alt "Doctor portrait at Mason Park Dental in Katy, TX". **FLAG for orchestrator**: filename says Dr. Dave Cho (a real Mason Park dentist per 04-design team section) while the copy is about Dr. Sung; the only Sung photos on the site are ≤300px (too soft for a 569px slot).
8. Treatment-card image alts (reference alts said "examination/cleaning/x-rays" but the images are treatment illustrations) → descriptive alts (bonding illustration / crown illustration / patient holding aligner).
9. "Book a Consultation" href `#` (all 6 occurrences) → `#form` (scrolls to the form card; card carries domId `form`).
10. Stat 3 kept verbatim "5.0 / Center Graduate" (matches capture; odd copy inherited from reference — invisalign shows "Invisalign® / Center Graduate", handled by props).

## Unreachable via API / degradations

- **Grid element type** not exposed by element_builder → display:grid classes on Div Blocks (see above).
- **Input placeholders** unreachable (known trap) — reference placeholders ("Enter your first name", "+1 (555) 000-0000", "your@email.com", "Type your message here") not set; add in Designer if wanted.
- **FAQ accordion** = native Webflow Dropdown (needs webflow.js — present on published pages). DropdownList set `position:static` so it pushes content down. The "+" icon is static (doesn't flip to "−" when open — would need custom code, disallowed).
- **h2–h6 tag styles** cannot be themed headlessly (Phase 1) → every heading level 2+ carries a class: `heading-style-h2` (section h2s), `heading-style-h6` (card h3s), or a fully-self-styling section class (`lp_form-card_title`, `lp_step-card_title` — size/weight/margins set in the class; font/color inherit from themed body).
- Element snapshots not taken (Designer-bridge tool; build verified by structural read-back). Phase 3 screenshot diff remains the visual gate.
- One 429 rate-limit hit during cleanup; all removals verified complete afterwards.

## Verification

- Full tree read back: all 12 blocks present in order; Global Styles instance is first child of page-wrapper.
- All grid classes read back at main+medium+small+tiny — definitions match the table above (see §Grid gate result in tree).
- Stray default strings ("Heading" ×7, lorem ipsum ×8) that element_builder injects into Heading/Paragraph elements built with span children were found and removed (page + closer component def swept clean; re-query returns 0).
- TextBlock set_text trap avoided entirely: no TextBlocks used — Paragraph/Heading (set_text at creation works) + DOM spans (settings key `text`).
- Page settings: draft **true**.
- NO HtmlEmbeds anywhere on the page (query returns 0). NO publish performed. Originals untouched.

## Gotcha for the invisalign build (new, learned here)

`data_element_builder` seeds Heading/Paragraph elements with their default placeholder String even when you pass `children` — every heading/paragraph built from spans gets a leading "Heading"/lorem String to delete afterwards. Sweep with `query_elements {type: String, text: "Heading"}` and `{text: "Lorem ipsum"}` before calling a page done. Also: `set_link` inside builder schemas drops url-type links about half the time — re-apply with element_tool set_link and read back.
