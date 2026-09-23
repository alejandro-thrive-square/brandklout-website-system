# Mason Park Dental — Webflow Site Audit (v2 rebuild pre-flight)

- **Site**: 6a60bdc0340e5f1784b4d553 (Mason Park Dental, Brandklout workspace)
- **Audited**: 2026-08-17, read-only via Data API MCP. Raw dumps in `raw/`.
- **Purpose**: decide what the 6 clean Client-First "v2" landing pages can reuse.

## Verdict table

| Foundation piece | Verdict | One-liner |
|---|---|---|
| Variables / design tokens | **ABSENT** | One default "Base collection", zero variables. Everything is hard-coded. |
| Client-First class system | **ADOPT (structure) / PARTIAL (theme)** | Full stock Relume Client-First v3 kit exists with real properties — but 100% unthemed (black buttons, no brand fonts/colors). |
| Style Guide page (6a7f58bc25329234377bb1cf) | **ADOPT** | Genuine Relume `rl-styleguide_*` style guide, draft, 1,869 elements, 263 classes. Created 2026-08-14. |
| Components | **ABSENT** | Only one component: "Global Styles" (Relume kit CSS-reset embed), instanced ONLY on the Style Guide page. No section/UI components. |

Bottom line: the Client-First **skeleton was already installed on 2026-08-14** (someone cloned the stock Relume kit — almost certainly the Brandklout "Kit Foundation V1" style guide). The v2 build does NOT need to create the class system from scratch, but it must (a) theme it to the Mason Park brand (Fraunces/Inter, teal #00738D/#00B4D8/#8FDCEC, ink #26292F — all currently only in custom-code CSS), (b) create the token/variable layer if we want one, and (c) put the Global Styles component on every new page (its resets currently reach only the Style Guide page).

## 1. Agent instructions

**None.** `search_instructions` returns 0 rules/skills on this site. No build conventions are stored on-site.

## 2. Style Guide draft page + Client-First class check

Page `style-guide` (id 6a7f58bc25329234377bb1cf), **draft: true**, created/updated 2026-08-14. Raw tree: `raw/mp-styleguide-tree.json` (1,869 elements).

It is the **stock Relume Client-First v3 style guide**: `page-wrapper > [Global Styles component, main-wrapper]` with rl-styleguide_* sections for typography, colors (color-scheme-1 only: white/black — untouched), spacing, buttons, forms, shadows, radii, icons, utilities. 263 distinct classes used (full list extractable from the raw tree); includes the complete kit: `heading-style-h1..h6`, `text-size-tiny..large`, `text-weight-*`, `text-style-*`, `text-align-*`, `padding-global`, `padding-section-small/medium/large`, `padding/margin-*` (all sizes + directions + spacer-*), `container-small/medium/large`, `max-width-*`, `button` (+ `is-secondary`, `is-text`, `is-small`, `is-icon`, `is-alternate`), `button-group`, `form_*` (input, field-wrapper, checkbox, radio, messages), `icon-embed-*`, `icon-height-*`, `icon-1x1-*`, `aspect-ratio-*`, `shadow-*`, `hide/hide-tablet/hide-mobile-*`, `z-index-*`, `overflow-*`, `pointer-events-*`, `layer`, `spacing-clean`, `text-rich-text`, `stylesystem_*`.

**Properties are real, but stock Relume defaults — zero brand theming:**
- `heading-style-h1`: 3.5rem / 1.2 / 700 (no font-family — inherits body)
- `text-size-medium`: 1.125rem; `padding-global`: 5% side padding; `container-large`: max-width 80rem
- `padding-section-medium`: 5rem block padding; `color-scheme-1`: background #fff, color black
- `button`: black bg, white text, 1px black border, no radius
- **`body` tag style is still the legacy converter's: Montserrat, #333, 14px/20px** — the Relume kit body typography was never set. New CF pages will inherit Montserrat 14px unless the body tag style or a wrapper is fixed.

`section_*` naming exists but only 8: `section_qz-hero/stories/proof` and `section_ty-hero/cta/expect/why/faq` — created for the quiz/thank-you work, not a full section library.

## 3. Variables

Raw: `raw/mp-variables.json`. One collection ("Base collection", id `collection-b608ba40-3013-3bab-56b8-e002dcb7980d`, single Base mode) with **zero variables**. The 2026-08-14 work added no token layer. All color/font decisions live in raw CSS (site head custom code + per-page parity patches) and in style properties.

## 4. The two consultation pages (2026-08-14)

Raw: `raw/mp-consultation-sample.json`. Both `invisalign-consultation` (6a7f18cd26274c520455c672) and `new-patient-special-consultation` (6a7f1882b7aaf05bf6f69c5d) are structurally identical quiz LPs.

- **How built**: native Webflow elements for the shell (Body > `page_quiz` > header / 3 sections / footer) — NOT converter numbered-class output, NOT clean Client-First. **The quiz form itself and the stories video wall are HtmlEmbeds** (steps, inputs, and video markup are invisible to Webflow editing).
- **Class vocabulary is a four-family patchwork**: `imp-*` header/nav (reused from the live invisalign LP), `qz-*` BEM (quiz UI), `landing-*` (hero typography/badges), `ty-*` footer (reused from thank-you pages), plus `lw-sec`/`lw-shell` — Livewell Dental shell classes.
- **Components**: none used.
- **Page-level custom code**: none (both empty) — the quiz JS presumably rides inside the embeds or is dead without it (not verified live).
- **Cross-client contamination (fix or avoid inheriting):** doctor portrait alt reads "Dr. Chris Kim, Livewell Dental" while the caption says "Dr. Dave Cho"; the INVISALIGN quiz card heading says "Start Your **Implant** Consultation"; both pages carry an "implants · comfort · craft" marquee; "Mason park Dental" lowercase typo in the stories disclaimer. These pages were evidently copied from the Livewell quiz build.

## 5. Components

One: **"Global Styles"** (id `f86f2f55-a6b5-a9dc-59f9-37a621e265f2`), 1 instance (on the Style Guide page). It is the Relume kit's CSS-reset embed. No other components exist — no navbars, footers, sections, or cards.

## 6. Assets

Raw manifest: `raw/mp-assets.json` — **592 assets** (id, displayName, originalFileName, contentType, size, hostedUrl, folderId). Mix: 328 jpeg, 128 png, 89 webp, 26 svg, 15 avif, 4 pdf, 1 mp3, 1 mp4. Includes the Mason Park logo (`6a7f58127dbb838f99750584`), doctor/office photography, and a large amount of **other-client material** (`lw-grey.*` Livewell, `jm-grey.*` case photos, generic stock) — do not assume every asset is Mason Park's; check names before reuse.

## 7. Styles overview

**824 styles total** (509 base classes + 315 combos). Raw dump saved by the tool run; families:

| Family | Base | Combos | What it is |
|---|---|---|---|
| Client-First / Relume kit (incl. rl-styleguide_*, stylesystem_*, form_*, section_*) | ~361 of total | most of the 285 "other" combos | The 2026-08-14 stock kit |
| `imp-*` | 95 | 16 | The LIVE invisalign + new-patient-special LPs (converter-ish numbered names: imp-p-2, imp-div-2, imp-h3-4…) |
| `ty-*` | 62 | 7 | Thank-you pages, hand-written BEM (ty-hero__h1, ty-cta__card…) |
| `qz-*` | 36 | 7 | Consultation quiz pages, hand-written BEM |
| `landing-*`, `lw-*`, `csm-*`, `service_*`, `story-*`, misc legacy ("Div Block 39", "Section 12", swiper/tabs/accordion leftovers) | rest | — | Pasted/copied odds and ends |

**Surprise: zero `inv-*` and zero `nps-*` styles remain.** The old converter class families named in the brief no longer exist as Webflow styles — the live LPs now use `imp-*`. The site-head CSS still targets `.inv-*`/`.nps-*`/`.ty-*` selectors heavily; a chunk of that block is dead unless those class attrs live inside embeds.

## 8. Custom code

- **Registered scripts**: none. **Applied site scripts**: none (404 = no block).
- **Site head (freeform, big)**: Google Fonts link (Fraunces + Inter); a **fluid rem engine** (`html{font-size:calc(...)}` recalculated per breakpoint — ALL rem values site-wide scale with viewport, including any new CF classes); `body{margin:0;overflow-x:clip;font-size:1.125rem;line-height:1.65}`; a large mobile/desktop font-size override wall targeting inv-/nps-/ty- selectors (mostly stale); mpd-armed/ready animation gating CSS; **GSAP 3.13 CDN (core, ScrollTrigger, ScrollToPlugin, SplitText)**; the `window.MPD` config object — tracking phone numbers per page-key, `WEBHOOK_URL: "{{GHL_INBOUND_WEBHOOK_URL}}"` **still an unreplaced placeholder** (lead forms fall back to "endpoint not yet connected. Please call…"), BOOKING_URL flexbook.me/masonpark/1, THANK_YOU_URL `/thank-you` (no such page — real slugs are /new-patient-thank-you and /invisalign-thank-you).
- **Site footer (freeform)**: the MPD runtime — phone-swap ([data-phone]), today's-hours, FAQ accordion, multi-step lead form validation + webhook POST + UTM capture, GSAP scroll effects (progress bar, chapter labels, offer rail, magnetic buttons, smooth anchors).
- **Page head code**: the 4 legacy LPs (invisalign, new-patient-special, both thank-yous) each carry an identical `mpd-parity` block: `noindex,nofollow` meta + parity CSS (brand colors #00738D/#00B4D8/#8FDCEC, Fraunces --display var, offer-rail styling) + a `.w-embed` unwrap script. Home, Style Guide, and both consultation pages have **no page-level code** — meaning the two consultation pages are currently **indexable** (no noindex) and get no parity CSS.

## Pages on site (8)

| Page | id | Slug | Status |
|---|---|---|---|
| Home | 6a60bdc3340e5f1784b4d5e3 | / | legacy |
| Invisalign | 6a75f467c7c9e1a0c133edd1 | /invisalign | live LP, imp-* classes, noindex |
| New Patient Special | 6a75f468bfddad669aaf8321 | /new-patient-special | live LP, noindex, touched 2026-08-17 |
| Thank You New Patient | 6a75f468c490cc1bb6fa6a8c | /new-patient-thank-you | ty-* classes, noindex |
| Thank You Invisalign | 6a7a4f3d7d446f7564911a62 | /invisalign-thank-you | ty-* classes, noindex |
| Invisalign Consultation | 6a7f18cd26274c520455c672 | /invisalign-consultation | 2026-08-14, quiz, NOT noindexed |
| New Patient Special Consultation | 6a7f1882b7aaf05bf6f69c5d | /new-patient-special-consultation | 2026-08-14, quiz, NOT noindexed |
| Style Guide | 6a7f58bc25329234377bb1cf | /style-guide | draft, Relume kit |

## Decisions the v2 build should make up front

1. **Reuse the installed Client-First kit** — don't recreate 361 classes. But theme it: body tag style (kill Montserrat 14px), heading font-family (Fraunces), button colors/radius, color-scheme-1 (+ add a dark scheme #26292F), and decide whether `padding-global`/containers match the v2 design widths.
2. **Create the variable layer** (colors/fonts/spacing) in the Base collection if v2 wants tokens — nothing exists.
3. **Decide the fate of the site-wide fluid rem engine + MPD runtime**: v2 pages will inherit both. Either build v2 to cooperate with them (rem-fluid aware, data-phone/data-lead-form hooks) or scope v2 pages away from them; removing them breaks the 4 legacy LPs.
4. **Wire the GHL webhook** — `{{GHL_INBOUND_WEBHOOK_URL}}` placeholder means no lead on any current form reaches a CRM.
5. **Componentize in v2** (nav, footer, section patterns) — nothing exists to inherit, so v2 sets the standard.
6. Fix or supersede the consultation pages' Livewell contamination and missing noindex if they stay live during the rebuild.
