# Build report — Thank You New Patient v2 (`new-patient-thank-you-v2`)

Page id **6a834a8bf4cdf54280e41e08** · created 2026-08-17 · draft: **true** (verified) · site 6a60bdc0340e5f1784b4d553.
SEO title/description copied verbatim from original page 6a75f468c490cc1bb6fa6a8c.
This is the FIRST of the two thank-you twins: it created the whole `confirm_*` family and the 4 new
components that `invisalign-thank-you-v2` reuses. **Nothing was published.** Originals untouched.

## Sections built (top to bottom)

| # | Section | Marker / component | Notes |
|---|---|---|---|
| 0 | Sticky top bar | **Confirm Header** component (`confirm_header`, tag `header`) | logo + phone only — the reference thank-you bar has NO CTA pill, so LP Header could not be reused |
| 1 | Light hero | `section_confirm_hero` | doctor avatar chip, candidacy badge, h1, lead, Call button, ★★★★★ + review count, fine print |
| 2 | What happens next | `section_confirm_expect` | centered head + 2-col grid (3 numbered call steps ⟷ 3-item "Before you come in" list) + green reassurance banner |
| 3 | Why Mason Park Dental | **Confirm Why Band** component (`section_confirm_why`) | 3 cards: Experience / Personalized Care / Clear Costs |
| 4 | FAQ | `section_confirm_faq` | 7 × **Confirm FAQ Item** component (native Webflow **Dropdown**, no custom code) |
| 5 | Dark closer + contact | **Confirm CTA Band** component (`section_confirm_cta`) | h2 with accent span, paragraph (prop), Call button, stars, fine print, divider, Call/Visit/Hours 3-col grid |
| 6 | Footer | **LP Footer** component instance (reused from build 1) | brand, Katy address, serving line, ©, legal prop |

Page skeleton: `page-wrapper` > **Global Styles** instance (`f86f2f55-…`, FIRST child) > **Confirm Header**
instance > `main-wrapper` (tag `main`) > sections > **LP Footer** instance.
Section pattern everywhere: `section_confirm_*` > `padding-global` > `container-large` >
`padding-section-large` (hero + CTA use `padding-section-medium`).

## Classes — 41 globals + 4 combos created, 20 kit classes reused

### `confirm_*` reuse manifest (both thank-you pages share every one of these)

**Section markers**: `section_confirm_hero` (pale gradient, centered), `section_confirm_expect`,
`section_confirm_why`, `section_confirm_faq`, `section_confirm_cta` (all White bg).

**Header**: `confirm_header` (sticky/z-200/white/border-bottom), `confirm_header_container`
(flex space-between, max-width 80rem), `confirm_header_logo` (3.4rem → 2.8rem @767),
`confirm_header_phone` (bold ink, 0.8rem @478).

**Typography / shared**: `confirm_hero_title` (h1, 2.6/2.2/1.9rem), `confirm_section_title`
(h2, 2/1.75/1.5rem), `confirm_cta_title` (h2 white, 2/1.75/1.5rem), `confirm_heading-accent`
(Accent italic span), `confirm_eyebrow` (+ combo `is-accent`), `confirm_body-text`,
`confirm_fineprint`, `confirm_strong`.

**Hero**: `confirm_hero_avatar` (56px circle, white ring, shadow), `confirm_badge` (white pill,
Radius Large var), `confirm_hero_lead` (also used as the section lead), `confirm_rating`,
`confirm_stars` (Gold), `confirm_rating_label` (+ combo `is-on-dark`).

**Expect**: `confirm_expect_grid`, `confirm_col-title` (+ combo `is-accent`), `confirm_steps`
(left rule), `confirm_step`, `confirm_step_number` (Ink-Navy circle), `confirm_step_title`,
`confirm_prep-list`, `confirm_prep-item`, `confirm_prep-mark` (Accent-ring ✓), `confirm_prep_title`,
`confirm_banner` (#e6f4ea), `confirm_banner_text`.

**Why**: `confirm_why_grid`, `confirm_card`, `confirm_card_icon`, `confirm_card_title`.

**FAQ**: `confirm_faq_list`, `confirm_faq_item` (DropdownWrapper), `confirm_faq_question`
(DropdownToggle), `confirm_faq_icon` (static "+"), `confirm_faq_answer` (DropdownList,
`position:static` so it pushes content = accordion).

**CTA**: `confirm_cta_card` (Neutral Darkest, Radius Medium), `confirm_cta_text`,
`confirm_cta_divider` (White-15 rule), `confirm_cta_fine`, `confirm_contact_grid`,
`confirm_contact_label` (Accent), `confirm_contact_text`, `confirm_contact_link`.

Every colour/radius binds to a Phase-1 variable. Two literal hexes were used where no variable
exists: the hero gradient `#eaf4f7 → #ffffff` and the reassurance banner `#e6f4ea` (same
justification as build 1's `#2b2b2d` stat band).

### Kit classes reused (no forks)
page-wrapper, main-wrapper, padding-global, container-large, padding-section-large,
padding-section-medium, margin-bottom (+margin-xsmall/small/medium/xlarge/xxlarge), margin-top
(+margin-xlarge), text-align-center, button, text-color-white.

### `lp_*` / `consult_*` classes
**Read-only.** None edited. No `lp_*` class was applied to these pages except through the reused
**LP Footer** component instance.

## Grids + breakpoint definitions (READ-BACK VERIFIED)

| Grid class | base | medium ≤991 | small ≤767 | tiny ≤478 |
|---|---|---|---|---|
| `confirm_expect_grid` | 1fr 1fr, 4/3rem | col-gap 2.5rem | **1fr**, row-gap 2.5rem | – |
| `confirm_why_grid` | 3×1fr, 1.5rem | **1fr** | – | – |
| `confirm_contact_grid` | 3×1fr, 2rem | **1fr** | – | – |
| `confirm_steps` | 1 col, row-gap 2rem, left rule | – | – | – |
| `confirm_prep-list` | 1 col, row-gap 1.35rem | – | – | – |
| `confirm_faq_list` | 1 col, row-gap .9rem, max-w 52rem | – | – | – |
| `confirm_step` / `confirm_prep-item` | auto 1fr, gap .9rem | – | – | – |

Collapses match the capture set: at 768 the expect section is still 2 columns while Why and the
contact block are already 1 column; at 390 everything is single-column.
API limitation carried over from build 1: `data_element_builder` exposes **no Grid element type**,
so grid containers are Div Blocks whose class sets `display:grid` (CSS-identical to w-layout-grid).

## Components created (reused by the invisalign twin)

| Component | id | Props (id → default) |
|---|---|---|
| **Confirm Header** | `8e687ba9-5350-1155-5893-15d5c942f5f2` | Phone Label `d2b2a9a0…676a` ("📞 (281) 769-8878"), Phone Link `4a68b67a…1188` (phone +12817698878) |
| **Confirm Why Band** | `996eb083-fef4-c13a-528f-3f0dd399f78c` | none — identical on both pages |
| **Confirm FAQ Item** | `852b1498-65c3-d1f4-84aa-5dfae80f936f` | Question `117d3f38…7a66`, Answer `339a71b5…62ec` (multiline) |
| **Confirm CTA Band** | `c973beb4-15be-8d77-8263-0a5d26d52b4b` | Paragraph `116a2a95…9c4f` (multiline), CTA Label `3b4b8ef7…cb49` |

All bindings written with `set_settings` key `text` / `link` and verified by read-back. Group
"Thank You". **LP Footer** (`e7911d8c-…`) reused unchanged; its Legal Text prop is left at the
default here because the reference footer legal on this page IS the new-patient-special wording.

## Substitution log (reference said X → v2 says Y → source of Y)

1. Phone **(703) 844-2975** (hero button, closer button, closer Call column — Livewell's Virginia
   number) → **(281) 769-8878** / `tel:+12817698878` → 04-design/.tmp/thank-you/index.html and
   01-content-intake/.tmp/client-site/special-offers.
2. Malformed header link `tel:835:+12817698878` → proper phone link `+12817698878` → BUILD-POLICY §2.
3. Address **"9027 Silverbrook Rd Ste. F / Fairfax Station, VA 22039"** (+ its Google-Maps href) →
   **21830 Kingsland Blvd #104A, Katy, TX 77450**, linked to the practice's own Maps place URL →
   04-design thank-you Chapter 05 (CLIENT-SPECIFIC block).
4. Hours **"Mon & Tue 8am–5pm / Wed & Thu 8am–4pm / Fri 8am–1pm"** (Livewell's) → **Mon & Wed
   9am to 6pm / Tue & Thu 8am to 5pm / Fri – Sun Closed** → client site special-offers page
   ("OFFICE HOURS") + 04-design thank-you hours table.
5. Phrase **"a 3D scan at our Fairfax Station practice"** (call step 3) → **"…at our Katy practice
   on Kingsland Blvd"**, and the step re-pointed at the actual funnel: *"Your $189 first visit —
   a comprehensive exam, digital x-rays, a cleaning and a written treatment plan"* → 04-design
   new-patient-special "What It Covers".
6. Call step 1 **"Dr. Cho reviews which path fits, from a single implant through to a full arch"**
   (implant copy on a new-patient funnel) → *"we confirm what your first visit needs to cover, from
   a routine check through to something that is bothering you right now"* → 04-design
   new-patient-special "The Visit".
7. Whole right-hand column **"⚠ What can happen if treatment is delayed"** (4 implant fear items:
   bone loss, teeth shifting, gum disease, costlier procedures) → **"✦ Before you come in"** with
   the 3 sourced preparation items (insurance card / a treatment plan from elsewhere / your
   questions) → 04-design thank-you **Chapter 03 "The Preparation"** verbatim. The reference column
   is implant-specific scare copy that fits neither Mason Park funnel; the design's own chapter is
   the direct replacement and occupies the same slot.
8. Section lead **"…and why acting now matters"** → **"…and how to be ready for your visit"** —
   follows from #7 (there is no urgency column any more).
9. Hero lead **"…get your complimentary on the calendar"** (broken sentence, missing noun) →
   **"…get your $189 first visit on the calendar"** → 04-design new-patient-special offer.
10. Hero badge **"You may be a candidate for implants"** → **"✦ You may be a candidate for the $189
    new patient special"** → the funnel this page serves (04-design new-patient-special;
    "Available to new patients of Mason Park Dental of Katy").
11. **Why-card "Experience"** kept its verified claim ("Dr. Cho obtained his dental degree from
    Tufts University" — confirmed word-for-word on the client's own /our-doctors page) and gained
    Dr. Sung's AGD Fellowship line from the same page.
12. **Why-card "Personalized Care"** ("3D guided planning with CBCT imaging… a lab partnership that
    means the finished teeth are designed with the same hands that placed the implants" — implant
    copy) → the practice's own team statement + Dr. Cho's oral-sedation experience → 04-design
    thank-you Chapter 04 lead + client site /our-doctors.
13. **Why-card "Clear Costs"** ("New teeth are a significant investment… grafting or extractions
    quoted upfront") → the practice's own transparency + insurance wording → 04-design
    new-patient-special "The Catch" and "The Invitation".
14. **7-item implant FAQ, including "a complete single implant… typically runs $1,900 to $2,800 at
    Mason Park Dental"** → **7 new-patient FAQs** built only from repo facts: what the $189 covers;
    nothing else to pay on the day; what happens at the visit; insurance + dental savings plan;
    Cherry 0% APR / no hard credit check; free second opinion; $129 child exam with Dr. Tam Nguyen
    → 04-design new-patient-special (What It Covers / The Catch / The Visit / The Invitation /
    other new-patient offers). **The $1,900–$2,800 pricing was NOT carried over** — it is not a
    Mason Park price and appears nowhere in the repo.
15. Avatar chip image `sir.png` with alt **"Dr. Chris Kim, Livewell Dental"** → asset
    `6a75f6f477131cf728cb0074` (`dr-cho.jpg`, the Mason Park design package's own portrait) with alt
    **"Dr. Dave Cho, general dentist at Mason Park Dental in Katy, TX"** → 04-design shared/img +
    client site /our-doctors.
16. Closer paragraph **"…complimentary consultation with Dr. Cho scheduled today"** → **"…get your
    $189 new patient visit scheduled today"** → the funnel's own offer.
17. **Map**: the reference has **no map embed** (`embeds: []` in content.json — the address is a
    plain text link to Google Maps), so no embed had to be replaced. v2 keeps the same pattern: a
    styled address block whose text links to Mason Park's Google Maps place URL. Had a map existed,
    an embed would have been forbidden by BUILD-POLICY and a static image or styled block used.

Facts deliberately **kept verbatim** from the reference because they are Mason Park's own:
"320+ five star reviews", "★★★★★", "A quick two minute call to talk through your options.",
"No cost, no obligation." banner, h1 "Let's Talk About Your New Smile", h2 "We Are Dedicated To
Getting You Your New Smile", "Why Mason Park Dental?", "Any Questions Before You Call?",
"Ready to take *the next step*?", and the footer's Katy address / serving line / © / legal block.

## Unreachable via API / deviations

- **No Grid element type** in `data_element_builder` → display:grid Div Blocks (as build 1).
- **h2–h6 tag styles cannot be themed headlessly** (Phase 1) → every heading level 2+ carries a
  fully self-styling class (`confirm_section_title`, `confirm_cta_title`, `confirm_step_title`,
  `confirm_prep_title`, `confirm_card_title`). h1 uses the themed tag + `confirm_hero_title`.
- **FAQ accordion** = native Webflow Dropdown (needs webflow.js, present on published pages).
  DropdownList is `position:static` so it pushes content down. The "+" glyph is static — it does
  not flip to "−" when open, which would need custom code (disallowed).
- **No lead capture on this page** — the reference thank-you pages have no form
  (`forms: []`), so nothing had to be rebuilt natively and the GHL webhook blocker does not apply.
- Element snapshots not taken (Designer-bridge tool); build verified by structural read-back.
  Phase 3 screenshot diff remains the visual gate.

## Verification

- Full tree read back: Global Styles instance is the first child of `page-wrapper`; block order is
  header → hero → expect → why → faq → cta → footer.
- All 7 `confirm_*` layout classes read back at main/medium/small/tiny — definitions match the
  grid table above.
- Placeholder sweep: `String "Heading"` → 0, `String "Lorem ipsum"` → 0, `String "Dropdown"` → 0.
- **HtmlEmbed query returns 0.** No page-level custom code added.
- Duplicate sweep after the partial-build repair (see gotcha): 1 × expect grid, 1 × steps list,
  1 × prep list, 1 × banner, 7 × FAQ instances, 3 × step titles — all correct.
- Page settings: draft **true**, SEO matches the original.
- No publish performed. Originals and `lp_*`/`consult_*` styles untouched.

## Gotcha for the next build (NEW — cost ~20 minutes here)

`data_element_builder` reports **`partial_success` with a misleading scope**. When `set_style`
names a class stack that is not an existing combo chain (e.g. `["text-align-center","margin-bottom",
"margin-xxlarge"]` — the pair `.margin-bottom.margin-xxlarge` exists but the 3-class chain does
not), the tool logs *"One or more styles not found"* and returns **no `child_results` for that
node — but it still creates the whole subtree underneath it**. Re-building those children then
silently DUPLICATES them. Rules learned:

1. Never stack more than one existing combo pair on one element. Wrap instead:
   `div.margin-bottom.margin-xxlarge > div.text-align-center > …`.
2. After ANY `partial_success`, read the failing node's subtree back **before** rebuilding — assume
   the children exist.
3. Build-1's placeholder trap is confirmed and applies to `DOM`-span children too: every Paragraph
   or Heading given `children` is seeded with a "Lorem ipsum" / "Heading" String that must be
   removed afterwards.
