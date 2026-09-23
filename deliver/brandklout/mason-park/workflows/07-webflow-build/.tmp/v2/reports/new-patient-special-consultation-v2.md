# Build report — New Patient Special Consultation v2 (`new-patient-special-consultation-v2`)

Page id **6a834acd0129002247b0bdc7** · created 2026-08-17 · draft: **true** (verified) · site 6a60bdc0340e5f1784b4d553.
SEO title copied verbatim from original page 6a7f1882b7aaf05bf6f69c5d ("New Patient Special Consultation"); the original has **no** SEO description and none was invented.

This page is the FIRST of the twin pair. The `consult_*` class family created here is reused wholesale by
`invisalign-consultation-v2.md` — see that report for the (small) list of per-funnel differences.

## Sections built (top to bottom)

| # | Section | Marker / component | Notes |
|---|---|---|---|
| 0 | Sticky top bar | `lp_header` (tag `header`) | logo + phone only — the reference consultation header has **no CTA pill** (unlike the LPs), so the **LP Header component was deliberately NOT instanced**; its `lp_header*` classes are reused read-only instead |
| 1 | Dark hero | `section_consult_hero` (domId `quiz`) | eyebrow, star/rating pill, split h1 (accent span), lead para, doctor credibility chip + **LP Hero Form Card** instance in the overhanging card column |
| 2 | Patient stories / review wall | `section_consult_stories` | eyebrow, split h2, lead, rating panel + Write a Review, 3 native review cards, fine print |
| 3 | Dark closer / proof | `section_consult_proof` | giant outline watermark word, white eyebrow, big h2 with accent `<em>`, star rating pill |
| 4 | Footer | **LP Footer** component instance | brand, address, serving line, ©, legal disclaimer via prop |

Page skeleton (read back): `page-wrapper` > **Global Styles** instance (`f86f2f55-a6b5-a9dc-59f9-37a621e265f2`, FIRST child)
> `lp_header` (header) > `main-wrapper` (main) > 3 sections > **LP Footer** instance.
Every section follows `padding-global` > `container-large` > `padding-section-large` > content.

## Classes — 18 created, 24 reused (0 forks, 0 edits to `lp_*`/`confirm_*` definitions)

### Created (`consult_*` — shared by both twins)

**Section markers:** `section_consult_hero` (bg Neutral Dark, White text, `position:relative; z-index:2; overflow:visible` so the form card can overhang the next section), `section_consult_stories` (bg White), `section_consult_proof` (bg Neutral Dark, White, centered, `overflow:hidden`).

**Hero:** `consult_hero_grid` (grid, see grid table), `consult_hero_h1` (3.5rem / lh .95), `consult_hero_lead` (60ch, 1.1rem, White), `consult_hero_aside` (top hairline, flex chip row), `consult_hero_avatar` (3.5rem circle, cover), `consult_hero_name` (1.2rem/700, ls .03em), `consult_hero_role` (1rem), `consult_hero_card` (card column, `margin-bottom:-9rem` overhang → 0 @medium).

**Stories:** `consult_stories_lead` (70ch), `consult_reviews_panel` (Neutral Lightest, Radius Small, 1.25/1.5rem padding — frames the rating bar), `consult_stories_foot` (centered fine print, Neutral Darkest 40).

**Proof:** `consult_proof_watermark` (absolute, White 5, 13vw → 22vw @tiny, nowrap, `translateY(-50%)`), `consult_proof_inner` (`position:relative; z-index:2`), `consult_proof_h2` (3.375rem/400/1.08, capitalize), `consult_proof_badge-text` (uppercase 0.8rem/700).

All colour/radius values are bound to the Phase 1 variable layer (Neutral Dark, White, Neutral Lightest, Accent, Gold via `lp_stars`, White 5/20, Neutral Darkest 40, Radius Small). No hardcoded hex on this page.

### Reused, unmodified
`page-wrapper`, `main-wrapper`, `padding-global`, `container-large`, `padding-section-large`, `margin-bottom`/`margin-top` + `margin-xsmall`/`margin-small`/`margin-medium`, `heading-style-h2`, `text-weight-bold`, `button` + `is-ink`,
`lp_header`, `lp_header_container`, `lp_header_logo`, `lp_header_actions`, `lp_header_phone`, `lp_eyebrow` (+ `is-white`), `lp_stars`, `lp_hero_badge`, `lp_heading-accent`, `lp_reviews_bar`, `lp_reviews_score`, `lp_reviews_count`, `lp_reviews_grid`, `lp_review-card` (+`_text`, `_who`, `_when`).

### Components instanced (none created)
| Component | id | Props set |
|---|---|---|
| Global Styles | `f86f2f55-a6b5-a9dc-59f9-37a621e265f2` | — |
| LP Hero Form Card | `6b1624b8-c67b-714c-0d8e-6cc08d26bc44` | Title → "Start Your New Patient Consultation"; Description → the page's own hero line |
| LP Footer | `e7911d8c-426d-0f93-35df-816cb86cfaa8` | Legal Text left at default — the component's default string is **byte-identical** to this page's reference disclaimer |

## Grids + breakpoint definitions (READ BACK VERIFIED)

| Grid class | main | medium ≤991 | small ≤767 | tiny ≤478 |
|---|---|---|---|---|
| `consult_hero_grid` | `0.9fr 0.75fr`, gaps 4.5/2.5rem, `align-items:end` | `1fr`, gaps 2.375rem | – | – |
| `lp_reviews_grid` (reused) | `1fr 1fr 1fr`, 1.5rem | `1fr 1fr` | `1fr` | – |
| `consult_hero_card` (overhang, not a grid but breakpoint-critical) | `margin-bottom:-9rem` | `0px` | – | – |

Read back with `include_breakpoints:[main,medium,small,tiny]` after creation; values match the table.
As on the foundation build, `data_element_builder` exposes **no Grid element type**, so grid containers are Div Blocks whose class sets `display:grid` (CSS-identical to `w-layout-grid`).

## Substitution log (reference said X → v2 says Y → source of Y)

1. **Empty card** — the reference card is titled "Start Your **Implant** Consultation" and contains **zero form fields, no iframe, nothing** (no lead capture at all on the page) → **LP Hero Form Card** instance: native Webflow form "Smile Consultation Form" (First-Name*, Last-Name*, Phone* tel, Email* email, Message textarea, Submit), titled **"Start Your New Patient Consultation"** → BUILD-POLICY §"Forms — no custom code allowed" + funnel name.
2. **"Dr. Dave Cho" / "General Dentist"** in the hero chip → **"Dr. William Sung, DMD" / "General Dentist"** → `04-design/.tmp/new-patient-special/index.html` team section lists Dr. William Sung, DMD as a General Dentist. (Dr. Cho is a real Mason Park dentist, but the LPs and this funnel are built around Dr. Sung.)
3. **Chip portrait** `sir.png` with alt **"Dr. Chris Kim, Livewell Dental"** (another practice entirely) → asset `6a7be032c0ff6a0a2c4f63b2` (`DrWilliamSung-230x300-1.webp`), alt "Dr. William Sung, DMD, Mason Park Dental in Katy, TX" → asset manifest `raw/mp-assets.json`; 230×300 comfortably covers the 56 px chip (the foundation build could not use it for a 569 px bio slot).
4. **`tel:835:+12817698878`** (malformed, header) → **`tel:+12817698878`** → BUILD-POLICY §2.
5. **Elfsight Google-review widget** showing **4.9 (1,036)** and a carousel of reviews (third-party embed = custom code; the 4.9/1,036 figure is the Livewell-copied number) → native review wall: **5.0**, "320+ Google reviews", 3 verbatim Mason Park Google reviews (Gabriel Sanchez, Amber Choate, rizi nepomuceno) → `04-design/.tmp/new-patient-special/index.html` "The Proof". Identical to the foundation build's substitution #2 so the two pages agree. "Write a Review" points at the practice's Google Maps listing.
6. **Carousel dots / "Read more" affordance** dropped — the live carousel is custom JS; a static 3-up wall would make those controls false UI.
7. **"— the Mason park difference"** and **"real Mason park Dental patient"** (casing errors) → **"— The Mason Park Difference"**, **"real Mason Park Dental patient"** → practice name casing.
8. **Watermark word "implants · comfort · craft"** (implant copy on a general new-patient funnel) → **"smiles · comfort · craft"** → decorative ornament re-pointed at this funnel's own subject; no factual claim involved.
9. **`.landing-h2.accent` sage-green (#6e8a7c) accent** on "From Our Patients" → cyan Accent via `lp_heading-accent` → v2 design-system normalisation: #6e8a7c exists in no Mason Park token and every other v2 page renders heading accents in Accent cyan.
10. **Section widths** — the reference uses ad-hoc `min(1240px, 100% - 10vw)` shells and `clamp()` section padding → Relume `padding-global` / `container-large` (80rem) / `padding-section-large` (7rem) per BUILD-POLICY §Structure. Section heights therefore differ from the reference's 2187 px body by design (the reference card was empty; ours holds a 6-field form).

## Unreachable via API / deliberate deviations

- **No `noindex`.** The reference consultation pages lack the robots meta the other LPs have; adding it would require page-settings custom code, which is forbidden (PLAN.md rules). **Client-side follow-up for the orchestrator: set "Exclude this page from site search / add noindex" in Page Settings before these go live.**
- **Lead delivery not wired.** Site head still carries the `{{GHL_INBOUND_WEBHOOK_URL}}` placeholder — a pre-existing client blocker. Nothing was pointed at Livewell's LeadConnector sub-account (form id `6SUhknD0606Y66ZAgaZI`).
- **Card progress meter dropped.** The reference card head has a thin gold "quiz progress" rule (`qz-card__meter`, 9 % fill) driven by the dead quiz JS. Adding it inside the shared LP Hero Form Card would mean editing another build's component definition (forbidden), and a static 9 % progress bar on a plain form would be false UI. Dropped deliberately.
- **Radial gold hero glow dropped** (`qz-hero__glow`, a 62vw `radial-gradient` blob) — a purely decorative absolutely-positioned gradient; not reproduced.
- **Input placeholders** are unreachable at creation via the element tools (known trap) — inherited as-is from the shared form-card component.
- `set_settings` key **`attributes` is rejected on a DOM element at creation time** (new trap, see below) — `aria-hidden="true"` on the watermark was applied afterwards with `data_element_tool > set_attributes` and read back.
- Element snapshots not taken (Designer-bridge tool); build verified by full structural read-back. Phase 3 screenshot diff remains the visual gate.

## Verification

- Full tree read back at depth −1: order is Global Styles → header → main (hero, stories, proof) → LP Footer; `header`/`main`/`section` tags confirmed; hero carries `id="quiz"`.
- Grid classes read back at main/medium/small/tiny — match the table above.
- Stray builder placeholders swept: 3 × "Heading" strings found on the split headings and removed; re-query returns **0** "Heading" and **0** "Lorem ipsum".
- **HtmlEmbed count on the page: 0.** No page-settings custom code added.
- Every heading level ≥2 carries a class: `heading-style-h2` (stories) and the self-styling `consult_proof_h2` (proof).
- Page settings: **draft: true**. Nothing published. Originals (6a7f1882…, 6a7f18cd…) and all legacy `imp-*/qz-*/landing-*/ty-*/lw-*` styles untouched; no `lp_*` or `confirm_*` definition was modified.
