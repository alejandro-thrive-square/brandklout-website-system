# Clifton Exteriors — Staging Homepage Analysis

**Source**: `https://clifton-exteriors-lutum.webflow.io` (published 2026-07-02)
**Files analyzed**: `staging.html` (homepage, 669 KB) and `staging.css` (compiled Webflow stylesheet, 183 KB, 9,401 lines), downloaded to the session scratchpad (`scratchpad/clifton/`). A pretty-printed body (`body_pretty.html`, 5,446 lines) was generated there for the line references used below.
**Purpose**: reference so we can finish the build in the teammate's exact style (site slug "lutum" = a Relume-derived template).

---

## 1. Section inventory (top of body → footer)

All homepage sections are direct children of `body > .page-wrapper`. Nav sits before `<main class="main-wrapper">`; footer sits after it. **No section carries an `id`** — the only IDs on the page are Webflow grid-node IDs (`w-node-…`).

| # | Wrapper element + exact classes | Content (one line) |
|---|---|---|
| 0 | `div.page-wrapper` → `div.global-styles.hide` | CSS-only embeds: Client-First style overrides + Relume color-scheme remapping (see §7) |
| 1 | `div.mega-nav.w-nav` (attrs: `data-menu-wrap`, `data-menu-open="closed"`, `role="banner"`) | Custom GSAP mega-nav: logo, "Services" + "Company" dropdown panels (`mega-nav__dropdown-panel`), "Get Quote" button, burger |
| 2 | `section.u-section.section_hero` | Full-bleed background video (`hero_video` > `home-hero_bg` gradient + `video.home-hero_video`), grid `hero_container` with rating badge, eyebrow `<h1>`, display `<h2>` (italic `<em>` accent), primary + secondary buttons |
| 3 | `section.u-section.section_services` | Grid `services_wrap` with sticky intro column (`services_sticky`, price-match copy, Get Quote button) + `services_scroll` of 5 `services_card`s, each containing a native **Webflow slider** (`slider-preview.w-slider`) of project photos and an `<h3>` service name |
| 4 | `section.u-section.section_feature` (variant attr `data-wf--section-feature-split--variant="images-left"`) | Split feature "Insurance Claims Made Easy": `feature_wrap` grid, video + 2 imgs left (`feature_visual-wrap`), text + Learn More button right (`feature_text-wrap`) |
| 5 | `section.u-section.section_usp` | Dark navy rounded panel: `usp_component` header ("Feel Confident Working With Us", white-star badge, secondary button), `u-spacer` (medium), grid `usp_list` of 3 `usp_item` cards (with `usp_shine` hover layer) + 2 `usp_img-wrap` photos |
| 6 | `section.u-section.section_portfolio` | Centered header inside `padding-global > .max-width-large.align-center.text-align-center` (blue-star badge, `<h2>`, "View Our Full Portfolio" button), `u-spacer` (large), then `portfolio_marquee` — a CMS-fed draggable image marquee (`draggable-marquee`, `data-draggable-marquee-init`) |
| 7 | `section.u-section.section_feature` (2nd instance, no variant attr) | "About Clifton Exteriors" split: video + Nextdoor-award image/eyebrow left, story text + Learn More right (mirrors #4's classes exactly) |
| 8 | `section.u-section.section_cta` | **Dedicated CTA band** "A Hassle Free Process": bg video + `cta_bg-cover` dark overlay, centered `cta_content` (rating badge, `<h2>`, paragraph, secondary "Our Process" button) |
| 9 | `section.u-section.section_reviews` | Google-reviews slider (`testimonial-lines` custom GSAP component, 69 CMS items) — full detail in §5 |
| 10 | `div.u-section.section_footer` (a `div`, not `section`/`footer`) | Custom footer `cx-foot__inner`: brand blurb + phone/email/address + Get Quote button, 3 link columns (`cx-foot__cols`), divider, legal/social row, large logo (`cx-foot_logo`) |

Notes:
- Sections 2–9 live inside `main.main-wrapper`; nav (1) and footer (10) are outside it.
- The two `section_feature` instances share identical classes; column mirroring at ≤991px is done with grid-node `order: -9999` overrides (`#w-node-_50fdc341…`, `#w-node-_5c532e19…`).
- There is **no contact/form section on the homepage** (zero `<form>` / `.w-form` elements); every CTA links to `/contact-us`.

---

## 2. Client-First conventions used (and where the build diverges)

**Verdict: loosely Client-First.** The project contains the full Finsweet Client-First v2 boilerplate (the `.global-styles.hide` embed, containers, spacing utilities, `padding-section-*` classes all exist in the stylesheet), but the *page markup* is primarily built on a Relume/Lumos-style **`u-` utility-component system driven by Webflow component variants** (`data-wf--…--variant` attributes + auto-generated `w-variant-…` classes). New sections should copy the `u-` pattern, not textbook Client-First.

### 2a. Patterns actually used in the homepage markup (copy these)

- **Section wrapper**: `u-section` + `section_[name]` on the same element — real examples: `section_hero`, `section_services`, `section_feature`, `section_usp`, `section_portfolio`, `section_cta`, `section_reviews`, `section_footer` (plus `section_navbar` defined in CSS).
  ```css
  .u-section {
    width: 100%;
    max-width: var(--_spacing-styles---site-settings--max-width); /* 80rem */
    margin: var(--_spacing-styles---site-settings--column-spacing) auto; /* 2rem auto */
    padding: var(--_spacing-styles---padding-section--large) 5%;  /* 7rem 5% */
    background-color: #0000;
  }
  ```
  This is the key structural idiom: **each section is a max-width-80rem, self-centering block with 5% side padding and 2rem vertical margin between sections** — there is no `page-padding`/`padding-global > container-large` nesting in most sections (only `section_portfolio` uses `padding-global`). Dark sections get rounded corners via `border-radius: var(--_spacing-styles---radius--small)` (1rem) — see `section_usp`, `section_cta`.
- **Dark section recipe** (used by `section_usp`, `section_cta`, `section_footer`, `section_hero`): set `background-color: var(--_primitives---neutral-colors--neutral-dark)` and re-point the scheme variables locally on the section class:
  ```css
  --color-scheme-1--background: var(--_primitives---neutral-colors--neutral-dark);
  --color-scheme-1--text: var(--_primitives---neutral-colors--neutral-lightest);
  --color-scheme-1--border: var(--_primitives---neutral-colors--neutral-lightest);
  --color-scheme-1--accent: var(--_primitives---neutral-colors--neutral-lightest);
  ```
  All child text (`u-heading`, `u-paragraph`) flips to light automatically. **Reuse this exact mechanism for any new dark band.**
- **Headings**: every heading is a rich-text div `u-heading … w-richtext` carrying a component-variant class; the semantic tag inside varies freely (the build is sloppy about h-levels):
  - Display/H1 style (4.5rem): `class="u-heading w-richtext"` + `data-wf--heading-text--heading-style="h1"`
  - H2 style (3rem): `class="u-heading w-variant-b0c8e90b-e1f9-cb13-10e5-4471fcf12994 w-richtext"` + `data-wf--heading-text--heading-style="h2"`
  - H3 style (1.75rem): `class="u-heading w-variant-febb8deb-488d-b025-4124-d86e2ee53517 w-richtext"` + `data-wf--heading-text--heading-style="h3"`
  - Eyebrow (1.125rem, Erode accent serif): `class="u-heading w-variant-a83a661f-1fb1-308d-41f9-976a02ee9c4d w-richtext"` + `data-wf--heading-text--heading-style="eyebrow"` (named classes `.u-heading.h1`, `.u-heading.eyebrow` also exist with identical definitions)
  - *Italic accent*: `<em>` inside any `u-heading` switches to the accent font — `.u-heading em { font-family: var(--_primitives---font-families--accent); font-weight: 400; }` (hero: "*you're proud to come home to.*")
- **Body copy**: `class="u-paragraph w-richtext"` (1.125rem / 1.5).
- **Header cluster**: `u-header-group` (centered flex column) wrapping `u-rating-component` (star badge pill) + eyebrow + heading; `u-eyebrow-tag` for left-aligned star+eyebrow rows.
- **Rating badge**: `div.u-rating-component` (variant attr `data-wf--review-badge--variant="red-star" | "white-star" | "blue-star"`) > `div.icon_wrap` > `svg.icon_star` (star color variants: `w-variant-6d68e921-c095-6466-3f20-fec1a87e2807` = brand red, `w-variant-9a3eb0cf-911d-4d50-eedb-39985cb7cce2` = neutral; no variant class = brand blue) + eyebrow text "5/5 from over 75 reviews". Pill CSS: `backdrop-filter: blur(50px); background-color: #dadada33; border-radius: 24px; padding: 4px 12px 4px 4px; color: var(--…brand-colors--blue)`.
- **Spacers**: `div.u-spacer` (height 7rem) with variants — `w-variant-12098a40-f145-edd6-c789-d60d1f6099a9` = medium 5rem (attr `data-wf--spacer---rows--variant="medium"`), `w-variant-06d8ef08-0003-5d8a-70dc-e744bc5edc52` = small 3rem; classic CF `spacer-small`, `spacer-large`, etc. also exist in CSS.
- **Buttons**: `button_primary` (+ secondary variant class) wrapped in `div.button-group` — full detail §4.
- **Grids**: native Webflow grids `w-layout-grid` + semantic class (`hero_container`, `services_wrap`, `feature_wrap`, `usp_list`).
- **Bespoke components** use BEM-ish double-underscore names: `mega-nav__bar-link`, `testimonial-lines__item`, `draggable-marquee__list`, `cx-foot__col`.

### 2b. Client-First v2 classes present in CSS (available, but barely used in markup)

Quoted verbatim from `staging.css` so they can be reused exactly:
- Containers: `.container-large` (max-width 80rem), `.container-medium` (64rem), `.container-small` (48rem) — all auto-centered; `.max-width-large` (48rem), `.max-width-small` (30rem), `.max-width-xxlarge` (80rem), `.max-width-full`.
- Global padding: `.padding-global { padding-left: 5%; padding-right: 5%; }` — used once on the homepage (portfolio header).
- Section padding utilities: `.padding-section-small` (3rem), `.padding-section-medium` (5rem → 4rem @991 → 3rem @479), `.padding-section-large` (7rem → 6rem @991 → 4rem @479).
- Spacing utilities: full CF ladder — `.margin-tiny` (.25rem), `.margin-xxsmall` (.5rem), `.margin-xsmall` (1rem), `.margin-small` (1.5rem), `.margin-medium` (2rem), `.margin-large` (3rem) + directional strippers `.margin-bottom`, `.margin-vertical`, `.padding-…` (the `!important` reset pattern from the CF embed). Real usage on the page: `div.margin-bottom.margin-large` (reviews heading), `div.margin-vertical.margin-xsmall` (USP dividers).
- Text/heading styles: `.heading-style-h3/h4/h5`, `.text-size-large`, `.text-style-nowrap`, `.text-style-2lines/3lines`, `.text-align-center`, `.align-center` exist in CSS; homepage markup uses the `u-heading` variants instead.
- Misc CF helpers in the hidden embed: `.hide`, `.hide-tablet`, `.hide-mobile-landscape`, `.hide-mobile`, `.pointer-events-off/on`, `.spacing-clean`, `.div-square`, `.truncate-width`.

**Rule of thumb for new work**: build sections as `u-section section_x` blocks composed of `u-header-group` / `u-heading` / `u-paragraph` / `button-group` / `u-spacer`, use CF `margin-*`/`padding-*` utilities for one-off spacing, and double-underscore BEM names for bespoke sub-components.

---

## 3. Design tokens

### 3a. Colors (from `:root`, staging.css lines 2098–2150)

| Token (CSS variable) | Value | Role |
|---|---|---|
| `--_primitives---neutral-colors--brand-colors--blue` | `#243864` | **Primary brand navy** — buttons, star badges, icon accents |
| `--_primitives---neutral-colors--brand-colors--red` | `#b02034` | **Brand red** — hero star, review stars |
| `--_primitives---neutral-colors--brand-colors--warm` | `#eae1d5` | Warm beige accent |
| `--_primitives---neutral-colors--neutral-dark` | `#121c32` | Dark section/footer background (also hard-coded on `.cx-foot`) |
| `--_primitives---neutral-colors--neutral-darker` | `#0c1321` | Darker navy |
| `--_primitives---neutral-colors--neutral-darkest` | `#060911` | Body text / near-black |
| `--_primitives---neutral-colors--neutral-light` | `#f6f4ef` | **Page background** (via `--color-scheme-1--background`) |
| `--_primitives---neutral-colors--neutral-lighter` | `#f9f8f4` | Alt light |
| `--_primitives---neutral-colors--neutral-lightest` | `#faf9f7` | Light text on dark / button label |
| `--_primitives---neutral-colors--neutral` | `#d6d6d6` | Borders (`--color-scheme-1--border`) |
| Scheme aliases | `--color-scheme-1--background/text/border/foreground/accent` | Point at the primitives; **dark sections re-map these locally** (§2a) |
| Leftover Relume/"field-manual" vars (unused on homepage) | `--_field-manual---signal` `#b3402a`, `---ink` `#1d2733`, `---field` `#e8e5dc`, `---ink-line` `#1d27332e` | Deleted-template residue — ignore |
| Notable hard-coded values | `#dadada33` (rating pill bg), `#faf9f733` (secondary button bg), `#121c32bf` (CTA overlay), `#cdd3df` (footer text), `#9aa3b5` (footer muted), `#0003` (testimonial arrow-button border) | |

### 3b. Fonts (@font-face, all self-hosted variable TTFs)

| Family (exact CSS name) | Weights | Use |
|---|---|---|
| `Hankengrotesk Variablefont Wght` | 100–900 | **Headings AND body** — `--_primitives---font-families--headings` and `--body` both point here |
| `Erode Variable` | 300–700 | **Accent serif** — `--_primitives---font-families--accent`; eyebrows, italic `<em>` inside headings, footer wordmark |
| `Plusjakartasans Variablefont Wght` (+ italic) | 200–800 | Loaded; only referenced by a deleted variable — effectively unused |
| `Instrumentsans Variablefont Wdth Wght` | 400–700 | Loaded, unused on homepage |
| `Newsreader Variablefont Opsz Wght` | 200–800 | Loaded, unused |
| `Fraunces Variablefont Soft Wonk Opsz Wght` | 100–900 | Loaded, unused |

Body base: `1.125rem / 1.5`, weight 400, letter-spacing `.01em` (all via `--_typography---font-styles--*` custom properties).

### 3c. Type scale (u-heading variants; weight 400 throughout — the display face is *not* bolded)

| Style | Desktop | ≤991px | ≤479px | Line-height / tracking |
|---|---|---|---|---|
| Display / `h1` variant | 4.5rem | 3.25rem | 2.5rem | 1 / −.01em |
| `h2` variant (`w-variant-b0c8e90b…`) | 3rem | 3rem | capped 2.5rem | 1 / −.02em |
| `h3` variant (`w-variant-febb8deb…`) | 1.75rem | — | — | 1.2 / −.01em |
| Eyebrow (`w-variant-a83a661f…`) | 1.125rem, Erode, wt 500 | 1.125rem | 1.125rem | 1 / .04em |
| Legacy `.heading-style-h3/h4/h5` | 2.25–3rem | steps down | 2 / 1.5 / 1.25rem | — |

### 3d. Radius, borders, shadows

- `--_spacing-styles---radius--small: 1rem` — **dark section corners** (`section_usp`, `section_cta`; hero gets `0 0 1rem 1rem`).
- `--_spacing-styles---radius--medium: 2rem` — **buttons** (pill look at button height).
- `--_spacing-styles---radius--large: 500px` — full pill; also `24px` on `u-rating-component`, `100vw`/`100em` circles for `icon_wrap` and testimonial avatars.
- Strokes: `--_spacing-styles---stroke--border-width: .5px`, `--divider-width: 1px`.
- **No box-shadows anywhere in the design language** — depth comes from dark navy panels, blur (`backdrop-filter: blur(50px)` on rating pills, `blur(20px)` on secondary buttons) and gradient scrims (`.home-hero_bg`, `.cta_bg-cover`: `linear-gradient(180deg, #3d403c, transparent 50%, #060911)`).

### 3e. Section vertical rhythm

- Tokens: `--_spacing-styles---padding-section--large: 7rem`, `--medium: 5rem`, `--small: 3rem` (**constant at all breakpoints** — the `:root` block is never overridden in media queries).
- `.u-section` default: `padding: 7rem 5%` + `margin: 2rem auto`. `section_reviews` drops to `padding-section--small` (3rem) top/bottom at ≤767px and ≤479px via explicit rules.
- CF utility classes shrink responsively instead: `padding-section-large` 7→6→4rem, `-medium` 5→4→3rem, `-small` 3→2rem (desktop → 991px → 479px).
- Layout constants: `--_spacing-styles---site-settings--max-width: 80rem`, `--column-spacing: 2rem`.
- Breakpoints: 991px / 767px / 479px (standard Webflow).

---

## 4. Button / link component

One component serves both variants: **`button_primary`** (a Webflow component with a `secondary` variant). It has a two-tile slide-up hover animation driven by Webflow IX on the component (`data-w-id`s), not CSS `:hover`.

### Exact markup (copy verbatim — primary)

```html
<a href="/contact-us" data-wf--button--variant="primary" class="button_primary w-inline-block">
  <div class="button-animation-hide">
    <div class="button-animation-wrap">
      <div class="button-content-tile">
        <div>Get Quote</div>
        <div class="button-arrow w-embed">
          <svg width="7" height="10" viewBox="0 0 7 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 9L5 5L1 1" stroke="currentColor" stroke-width="2"/>
          </svg>
        </div>
      </div>
      <div class="button-content-tile bottom-tile">
        <div>Get Quote</div>
        <div class="button-arrow w-embed">
          <svg width="7" height="10" viewBox="0 0 7 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 9L5 5L1 1" stroke="currentColor" stroke-width="2"/>
          </svg>
        </div>
      </div>
    </div>
  </div>
</a>
```

**Secondary variant** = identical markup with `data-wf--button--variant="secondary"` and class `button_primary w-variant-20cba543-cf6e-97d3-e78f-24f4c5d44d52 w-inline-block` (used for "Learn About Insurance Claims", "Our Process", footer "Get Quote").

### CSS

```css
.button_primary {
  border-radius: var(--_spacing-styles---radius--medium);              /* 2rem */
  background-color: var(--_primitives---neutral-colors--brand-colors--blue);  /* #243864 */
  font-family: var(--_typography---font-styles--font-family);
  color: var(--_primitives---neutral-colors--neutral-lightest);        /* #faf9f7 */
  text-align: center;
  cursor: pointer;
  justify-content: center;
  align-items: center;
  padding: .625rem 1.5rem;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5;
  text-decoration: none;
  transition: background-color .2s, color .2s;
  display: flex;
  overflow: hidden;
}
/* secondary variant — translucent "glass", works on light or dark */
.button_primary:where(.w-variant-20cba543-cf6e-97d3-e78f-24f4c5d44d52) {
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  color: var(--color-scheme-1--text);   /* flips with the section scheme */
  background-color: #faf9f733;
}
/* animation scaffolding */
.button-animation-hide { height: 1.5rem; overflow: hidden; }
.button-animation-hide.small { height: 20px; }
.button-content-tile { grid-column-gap: 8px; grid-row-gap: 8px;
  justify-content: flex-start; align-items: center; display: flex; }
.button-arrow { justify-content: center; align-items: center; display: flex; }
/* mobile (≤479px): animation disabled, arrow hidden */
@media screen and (max-width: 479px) {
  .button-animation-hide { height: auto; }
  .button-animation-wrap { height: 20px; }
  .button-content-tile.bottom-tile, .button-arrow { display: none; }
}
```

**Hover behavior**: `.button-animation-wrap` holds two stacked `.button-content-tile`s (identical label + 7×10 chevron). On hover a Webflow interaction slides the wrap up one line inside the 1.5rem clipping `.button-animation-hide`, revealing `bottom-tile` (classic text roll-up). There is **no `.button_primary:hover` rule in CSS** — if pasting the component the interaction travels with it; if recreating manually, animate `translateY(-50%)` on `.button-animation-wrap` (~0.3s ease). Buttons sit in `div.button-group` (flex row with gap; hero shows primary + secondary side by side).

---

## 5. Reviews / testimonials section (CRITICAL)

### 5.1 How it currently works

- Wrapper: `section.u-section.section_reviews` (light background — it does *not* use the dark scheme). Contents:
  1. `div.margin-bottom.margin-large` > `u-heading` (h2-size variant) containing **an `<h1>`**: "Reviews From Our Satisfied Clients" (semantic bug — second h1 on the page).
  2. `div.testimonial-lines` with `data-testimonial-wrap data-autoplay="true" data-autoplay-duration="5000"` — a **fully custom GSAP slider**, *not* a Webflow Slider component:
     - Left column `review_btns_wrap` (33.33% width): prev/next `testimonial-lines__button`s (2.5em square, 1px `#0003` border, `.25em` radius, hover `opacity: .6`) with arrow SVGs.
     - Right column `testimonial-lines__main`: counter "`1 / 5`" (`testimonial-lines__count` — the "5" is a static placeholder that JS rewrites to the real total, 69), then `testimonial-lines__collection.w-dyn-list` — a **Webflow CMS collection of 69 Google reviews** (`testimonial-lines__item.w-dyn-item`).
     - Each item: `review_wrap` > `review_icon_wrap` (five hard-coded `icon_wrap > svg.icon_star` stars, colored brand red `#b02034` via `.review_icon_wrap`) + `<h3 data-testimonial-text class="testimonial-lines__h">` review body; then `testimonial-lines__item-details` = 3em circular avatar (`…item-visual` > `…item-img`, Google profile photos) + name + relative date ("2 months ago") in `testimonial-lines__p` / `.is--faded`.
  3. After the list: a primary `button_primary` "Read all reviews" linking out to a Google search results URL (`target="_blank"`).
  4. Two `w-embed`s at the end of the section: the `initLineRevealTestimonials()` script and CSS overrides (both reproduced below / in §5.3).
- **Mechanics** (GSAP + SplitText + ScrollTrigger): all 69 items are stacked in one grid cell (`grid-area: 1/1`; inactive = `opacity: 0; visibility: hidden`). One item visible at a time. Transitions split text into masked lines that roll out/in (`yPercent ±110`, `power4.inOut`, staggered) while the avatar does a `clip-path: circle()` iris reveal. Autoplay every 5 s (paused when the section is out of view via ScrollTrigger; reset after manual navigation). Left/right arrow keys navigate globally. Review bodies clamp to 3 lines with an injected "Read more"/"Read less" toggle (`.review-readmore`, extra lines animate in on expand). `prefers-reduced-motion` falls back to simple fades.

### 5.2 Visual weaknesses (what to improve when finishing the build)

1. **One review at a time out of 69** — at 5 s per slide a visitor needs ~6 minutes to see them all; no sense of volume/social-proof density on screen (no multi-card layout, no wall of logos/avatars, no aggregate rating block).
2. **Left third of the section is nearly empty on desktop**: `review_btns_wrap` is 33.33% wide but only holds two 2.5em buttons — a large dead zone beside the content.
3. **Flat, card-less presentation**: plain text on the page background; no card surface, border or contrast band, so the section visually melts between the dark CTA above and the dark footer below.
4. **Layout shift**: the container is `min-height: 40vh` (patched from a fixed `height: 40vh` by the embedded CSS); long reviews and "Read more" expansion grow/shrink the page and bounce the footer. Mobile uses 50–55vh min-heights.
5. **Hard-coded five red stars** per item (not CMS-bound to an actual rating value), and the red slightly clashes with the blue-star badges used elsewhere; no Google logo/attribution despite Google avatars and the outbound Google link.
6. **Static placeholder counter** ("1 / 5" in markup) and review dates frozen at CMS-import time ("2 days ago").
7. **Semantics/SEO**: `<h1>` for the section heading and each review body is an `<h3>` — 69 h3s of paragraph text.
8. **"Read all reviews" links to a brittle Google search URL** full of session parameters (`sca_esv…&ved=…`) that will eventually break.

### 5.3 ALL CSS rules for classes inside the section (from staging.css)

```css
/* ---- section wrapper ---- */
.u-section.section_reviews { overflow: hidden; }
@media screen and (max-width: 767px) {
  .u-section.section_reviews {
    padding-top: var(--_spacing-styles---padding-section--small);   /* 3rem */
    padding-bottom: var(--_spacing-styles---padding-section--small);
  }
}
@media screen and (max-width: 479px) {
  .u-section.section_reviews {
    padding-top: var(--_spacing-styles---padding-section--small);
    padding-bottom: var(--_spacing-styles---padding-section--small);
  }
}
/* heading spacer utilities (Client-First) */
.margin-bottom { margin-top: 0rem !important; margin-right: 0rem !important; margin-left: 0rem !important; } /* global embed */
.margin-large { margin: 3rem; }

/* ---- slider frame ---- */
.testimonial-lines {
  grid-column-gap: 1.25em; grid-row-gap: 1.25em;
  flex-flow: wrap; justify-content: flex-start; align-items: flex-start; display: flex;
}
.testimonial-lines__controls {
  grid-column-gap: 1em; grid-row-gap: 1em; flex-flow: row;
  justify-content: flex-start; align-items: flex-start; width: 100%; display: flex;
}
.testimonial-lines__button {
  background-color: #0000; border: 1px solid #0003; border-radius: .25em;
  justify-content: center; align-items: center;
  width: 2.5em; height: 2.5em; padding: 0; display: flex;
}
.testimonial-lines__button:hover { opacity: .6; }
.testimonial-lines__arrow { width: .75em; }
.testimonial-lines__main {
  grid-column-gap: 3em; grid-row-gap: 3em; flex-flow: column; flex: 1;
  justify-content: flex-start; align-items: flex-start; height: 40vh; display: flex;
}
.testimonial-lines__main-details {
  grid-column-gap: 1.5em; grid-row-gap: 1.5em; flex-flow: row; flex: none;
  justify-content: flex-start; align-items: flex-start; display: flex;
}
.testimonial-lines__p { margin-bottom: 0; font-size: 1.25em; line-height: 1.2; }
.testimonial-lines__p.is--faded { opacity: .5; flex: none; padding-top: .65rem; }
.testimonial-lines__count { width: 2ch; display: inline-block; }
.testimonial-lines__collection { width: 100%; }
.testimonial-lines__list { width: 100%; display: grid; position: relative; }
.testimonial-lines__item {
  grid-column-gap: 4em; grid-row-gap: 4em;
  opacity: 0; visibility: hidden; flex-flow: column;
  grid-area: 1 / 1;                     /* all 69 items stacked in one cell */
  justify-content: flex-start; align-items: flex-start;
  width: 100%; display: flex; position: relative;
}
.testimonial-lines__item.is--active { opacity: 100; visibility: visible; }
.testimonial-lines__h {
  width: 100%;
  color: var(--color-scheme-1--text);
  font-size: 1.25rem;
  line-height: var(--_typography---font-styles--line-height);
  font-weight: var(--_typography---font-styles--font-weight);
  letter-spacing: var(--_typography---font-styles--letter-spacing);
  --_typography---font-styles--font-family: var(--_primitives---font-families--headings);
  --_typography---font-styles--font-size: 1.75rem;
  --_typography---font-styles--line-height: 1.2;
  --_typography---font-styles--font-weight: 400;
  --_typography---font-styles--letter-spacing: -.01em;
  --_typography---font-styles--margin-top: .5rem;
  margin-top: 0; margin-bottom: 0;
}
.testimonial-lines__item-details {
  grid-column-gap: 1.25em; grid-row-gap: 1.25em; flex-flow: row;
  justify-content: flex-start; align-items: center; display: flex;
}
.testimonial-lines__item-visual {
  aspect-ratio: 1; border-radius: 100em; width: 3em; overflow: hidden;
}
.testimonial-lines__item-img { object-fit: cover; width: 100%; height: 100%; }

/* ---- review-specific helpers ---- */
.review_btns_wrap {
  grid-column-gap: 1rem; grid-row-gap: 1rem; flex-flow: column;
  width: 33.33%; display: flex;
}
.review_icon_wrap {
  grid-column-gap: .5rem; grid-row-gap: .5rem;
  color: var(--_primitives---neutral-colors--brand-colors--red);  /* #b02034 stars */
  display: flex;
}
.review_wrap { grid-column-gap: 2rem; grid-row-gap: 2rem; flex-flow: column; display: flex; }
.icon_wrap {
  background-color: #30354000; border-radius: 100vw;
  justify-content: center; align-items: center;
  width: 2rem; height: 2rem; display: flex;
}
.icon_star { width: 1.5rem; }

/* ---- responsive ---- */
@media screen and (max-width: 991px) {
  .testimonial-lines__p.is--faded { justify-content: flex-start; align-items: flex-start; display: flex; }
}
@media screen and (max-width: 767px) {
  .testimonial-lines { grid-column-gap: 2em; grid-row-gap: 2em; }
  .testimonial-lines__controls { order: 9999; width: 100%; }   /* arrows drop below content */
  .testimonial-lines__main { grid-column-gap: 3em; grid-row-gap: 3em; }
  .testimonial-lines__p { font-size: 1em; }
  .testimonial-lines__item { grid-column-gap: 2em; grid-row-gap: 2em; }
  .testimonial-lines__h { font-size: 2em; }
  .testimonial-lines__item-visual { width: 3.5em; }
  .review_btns_wrap { width: 100%; }
}
@media screen and (max-width: 479px) {
  .testimonial-lines { flex-flow: column; }
  .testimonial-lines__main { grid-column-gap: 1.5rem; grid-row-gap: 1.5rem; flex: 0 auto; height: 40vh; }
  .testimonial-lines__h { font-size: 1.5rem; }
  .testimonial-lines__item-details { margin-top: 0; }
  .review_btns_wrap { width: 100%; }
}
```

**Plus the CSS embedded inside the section itself** (a `w-embed` at the end of the section — overrides the compiled rules above at runtime):

```css
.text-line-mask { padding-bottom: 0.2em; margin-bottom: -0.2em; }  /* SplitText mask descender fix */

.testimonial-lines__main {
  min-height: 40vh;          /* was height:40vh — min-height lets it grow when expanded */
  height: auto;
  display: flex; flex-direction: column;
}
.testimonial-lines__collection { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
.testimonial-lines__list { flex: 1 1 auto; min-height: 0; grid-template-rows: 1fr; }
.testimonial-lines__item { display: flex; flex-direction: column; overflow: visible; max-height: none; }
.testimonial-lines__item-details { margin-top: auto; }   /* avatar+name pinned to bottom */
.review-readmore {
  display: block; text-align: left; margin-top: 0.5em; padding: 0; border: 0;
  background: none; font: inherit; font-weight: 600; color: inherit;
  cursor: pointer; text-decoration: none;
}
.review-readmore:hover { opacity: 0.7; }
@media (max-width: 767px) { .testimonial-lines__main { min-height: 55vh; } }
@media (max-width: 478px) { .testimonial-lines__main { min-height: 50vh; } }
```

### 5.4 Complete outerHTML of the reviews section

Pretty-printed from the published page (lines 1835–5339 of the formatted body; includes all 69 CMS review items, the "Read all reviews" button, the full `initLineRevealTestimonials()` script and the style embeds). **One transformation for readability**: the identical 70×66 star `<path>` `d` attribute (repeated 340+ times, ~1.5 KB each — 80% of the section's raw bytes) is collapsed to `d="[STAR_PATH]"`. The single canonical value to substitute back is:

```
M34.9963 6.16752e-05C34.7143 0.00246168 34.4383 0.0807517 34.1973 0.226522C33.9573 0.372292 33.7623 0.580032 33.6323 0.827452L23.4433 20.1932L1.28131 24.0484C1.00131 24.0976 0.739293 24.2224 0.525293 24.409C0.311293 24.5957 0.154299 24.837 0.0692995 25.1064C-0.0147005 25.3759 -0.0227037 25.6631 0.0472963 25.9366C0.117296 26.21 0.262303 26.4591 0.466303 26.6565C0.466303 26.6565 15.8003 38.9 17.0003 40.5C18.5003 42.5 12.7973 64.2128 12.7973 64.2128C12.7533 64.4942 12.7883 64.7822 12.9003 65.0448C13.0113 65.3073 13.1953 65.534 13.4293 65.6995C13.6633 65.865 13.9393 65.9627 14.2273 65.9819C14.5143 66.001 14.8013 65.9406 15.0563 65.8077L35.0053 55.3963L54.9513 65.8227C55.2053 65.9554 55.4923 66.0156 55.7793 65.9966C56.0663 65.9776 56.3423 65.8801 56.5763 65.715C56.8103 65.5499 56.9933 65.3237 57.1053 65.0616C57.2173 64.7996 57.2533 64.5119 57.2093 64.2308L52.5003 40.5L69.5313 26.6685C69.7363 26.4712 69.8823 26.2219 69.9523 25.948C70.0233 25.6742 70.0153 25.3864 69.9313 25.1164C69.8473 24.8464 69.6893 24.6046 69.4743 24.4178C69.2603 24.2309 68.9973 24.1062 68.7163 24.0574L46.5693 20.1932L36.3873 0.827452C36.2553 0.575972 36.0553 0.365552 35.8093 0.219512C35.5643 0.0734817 35.2823 -0.00247832 34.9963 6.16752e-05Z
```

A full standalone copy also exists at `scratchpad/clifton/reviews_section_dedup.html` (169 KB).

```html
<section class="u-section section_reviews">
  <div class="margin-bottom margin-large">
    <div data-wf--heading-text--heading-style="h2" class="u-heading w-variant-b0c8e90b-e1f9-cb13-10e5-4471fcf12994 w-richtext">
      <h1>Reviews From Our Satisfied Clients</h1>
    </div>
  </div>
  <div data-autoplay-duration="5000" data-testimonial-wrap="" data-autoplay="true" class="testimonial-lines">
    <div class="review_btns_wrap">
      <div class="testimonial-lines__controls">
        <button data-prev="" aria-label="previous testimonial" class="testimonial-lines__button">
          <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 12 12" fill="none" class="testimonial-lines__arrow">
            <path d="M5.26512 12L6.43721 10.7746L1.48837 5.28169V6.71831L6.45581 1.22535L5.28372 0L-2.21369e-07 6L5.26512 12ZM12 6.97183V5.02817H1.30232V6.97183H12Z" fill="currentColor">
          </path>
        </svg>
      </button>
      <button data-next="" aria-label="next testimonial" class="testimonial-lines__button">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 12 12" fill="none" class="testimonial-lines__arrow">
          <path d="M6.73488 12L5.56279 10.7746L10.5116 5.28169V6.71831L5.54419 1.22535L6.71628 0L12 6L6.73488 12ZM0 6.97183V5.02817H10.6977V6.97183H0Z" fill="currentColor">
        </path>
      </svg>
    </button>
  </div>
</div>
<div class="testimonial-lines__main">
  <div class="testimonial-lines__main-details">
    <p class="testimonial-lines__p is--faded">
      <span data-current="" class="testimonial-lines__count">1</span> / <span data-total=""> 5</span>
    </p>
  </div>
  <div class="testimonial-lines__collection w-dyn-list">
    <div role="list" data-testimonial-list="" class="testimonial-lines__list w-dyn-items">
      <div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
        <div class="review_wrap">
          <div class="review_icon_wrap">
            <div class="icon_wrap">
              <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
                <path d="[STAR_PATH]" fill="currentColor">
              </path>
            </svg>
          </div>
          <div class="icon_wrap">
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
              <path d="[STAR_PATH]" fill="currentColor">
            </path>
          </svg>
        </div>
        <div class="icon_wrap">
          <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
            <path d="[STAR_PATH]" fill="currentColor">
          </path>
        </svg>
      </div>
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Second time using Clifton exteriors (first for our windows and now exterior doors). They are so knowledgeable and easy to work with. Very prompt and everything looks great!</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c8423e097bd11a8ee2651_ALV-UjUYBjS3aVo5KNsS0V9g1_V8u8VVwibpEZIg6qVZWeZ9IMwkI75Gkg%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Monica Massaro</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">2 months ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">They were great. I had a storm door and sliding door installed and they are so nice.   They showed up on time and did a great job with the installation. Highly recommend</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c8423e097bd11a8ee263c_ACg8ocIaO7dJ-y8NpDEq_TTVu8ffg7e73m7ChDA2F-iXOBPv82keIw%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Melissa baker</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">a month ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">I had Clifton Exteriors replace a sliding glass door with a regular door and a picture window. I am extremely pleased with the result, it looks and functions exactly as it should. The door was set in a very sturdy frame and I expect it to last a lifetime. They were professional, did the work on time and finished in a timely manner. Highly recommend!</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c8423e097bd11a8ee263f_ACg8ocI-TdeXeGkBKSKtnRIIk-uPPxDmD4A1033ey9BkMksYZbIiuw%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Kirsti Rogers</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">2 days ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Great customer service. Professional, fast.</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c8423e097bd11a8ee2645_ACg8ocID2Z0CdgEhWY7s_TfrVMyUV_u7wY18Mkjbmlik9rJou2-DPw%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Art DesLauriers</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">Edited a year ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Great work, looks great, like a miracle!</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c8423e097bd11a8ee264b_ACg8ocLMI3a6eNsJgo7z5BJEaxkZBU0dUvfSdj1NTeY9lh6d6LDPzA%3Dw144-h144-p-rp-mo-ba12-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">John O&#x27;Neill</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">a year ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Professional and easy to work with.  Highly recommended</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c8423e097bd11a8ee2648_ACg8ocLNh3STtKOHy7QAxADDgNUp00-Uv4S_M8xzxOzjab3fATwLmQ%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Brad Harrell</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">10 months ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Professional, great communication, high-quality work, (NoVA) local, and good price.</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c8423e097bd11a8ee264e_ALV-UjX-FnsjwXw962i2dupH9kFPdQpO8PXfQFAHNGEcLTvDuyDR5KL8%3Dw144-h144-p-rp-mo-ba12-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Seth Hunter</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">a year ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">They were prompt and professional and were kind enough to do a small job a bit outside of their normal efforts.  I will use them again.</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c8423e097bd11a8ee2638_ACg8ocKpn82WTofEURHlaMOlzFv9ROx1y99KEYH8gzleMrRUA-K2ng%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">R. W. Hicks</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">2 years ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Excellent, reliable service with very reasonable prices.  The owner oversees all of the work.</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c841f1005c102edbe969a_ALV-UjU7vyTAPqgNkI4CWdRhQZCha0MgesOQZHcCr1GjpS5n6JpH99RD%3Dw144-h144-p-rp-mo-ba12-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Tricia O&#x27;GRADY</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">2 years ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Great window replacement project.  Thank you for the hassle free experience.</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c841f1005c102edbe9688_ACg8ocI4ooG2yf0EOcc_8ug6vZZ9Hv4lwWhMmQgwdd6enVqLasyScw%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Hongjun Xu</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">a year ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">From beginning sales to the actual installation, it was an awesome experience. Professional at all times and constant communication was much appreciated. Thank you!</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c841f1005c102edbe96a0_ALV-UjW3CsBNNwzw8O4cjLIpdtXa8hu4GRQNs9L9FbeJzhSYlBNlmEoW%3Dw144-h144-p-rp-mo-ba12-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">John Skoglund</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">2 years ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Amazing company and did a phenomenal job on my doors! I would recommend them highly if you&#x27;re considering any work on your house.</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c8414fe14579ee1d3d7df_ACg8ocK8PKpq01SGEJvK1aAhnVHqBbmXXEBLSTiKrp4RLrUlmfnZEQ%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Leah Roberts</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">2 years ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Excellent work! Definitely will use again.</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c841f1005c102edbe96a6_ACg8ocJtnzHGJXQChggA_7_ndIJWcQiWtTuArbirQ_iSy8bn6ub_sA%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Lisa Yu</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">4 months ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">The guys from Clifton Exteriors are wonderful, they did a very nice job of installing our windows, cleaned everything up and were very reasonably priced.  Thanks Chris and the installers</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c841f1005c102edbe9685_ACg8ocKkvaI1PW-XctsC0errwudtp9F51DpXnnlyd11Ja8b4uQLHZQ%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">john Snyder</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">5 years ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Clifton exteriors did an excellent job of replacing my gutters and gutter guards. They were on time and very professional. Would highly recommend.</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c841f1005c102edbe9674_ACg8ocKs61F57gaBkubLz8IP-bep4mtVA3j6dN1fXVwdHSPh5bXRXQ%3Dw144-h144-p-rp-mo-ba12-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Kenneth Wilhelm</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">3 years ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Chris was very responsive, thorough and fair  in his pricing. We’ll definitely continue to use   Clifton Exteriors for our home.</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c841f1005c102edbe967f_ACg8ocKcdIx46-2SASbGQPXWR_PVo1QDCAHwSaZ5rArPnWY_HqrCUw%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Nicola Porter</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">3 years ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Chris was super quick to reply and scheduled the job promptly.  The workers did a great job.  Highly recommend!</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c841f1005c102edbe96ac_ACg8ocIOUrPWPd5n8kadziL1tOZqE9viSRczGCPaeQeyrlrzreRs_Q%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Hien Nguyen</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">a year ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Chris and his team provided a quality sliding door at an excellent price. They go out of their way to make sure that you are completely satisfied with the product and installation. I will be sure to use them in the future when we replace our windows and French door. You won&#x27;t get this kind of customer service or price from any of the larger companies.</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c841f1005c102edbe967b_ACg8ocKCocCxkmTsVwAAVz6QWIL9aoaKsgKNIJzigOYb4canrUGMcA%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Jared Clark</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">4 years ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">I recently had Clifton Exteriors install new windows in my townhouse.  From start to finish it was an extremely smooth experience.  I will definitely use them again when the need arises.</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c841f1005c102edbe9697_ALV-UjVT66D80FFFQuFPxz_H1_dHzi05PINxIf89hzz7q_BFPy5FWrSJ%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Wendy Ergler</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">2 years ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Clifton Exteriors did an amazing job. They replaced all of the windows in the house. They have the hardest working crew I&#x27;ve ever seen. Everyone was polite as well.
  I&#x27;m thrilled with the new windows. What a difference they make.</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c841e1005c102edbe9670_ACg8ocIxfbOHFYAxAKvbRJFdnvh7aHkOf8LBprOW0CyGSlT1Sm2SkA%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Janet Eackloff</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">5 years ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Chris and his company are awesome! They were a pleasure work with and got our insurance to cover everything. We even got skylights added and they make our back porch look so much more modern. A+++ company.</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c841f1005c102edbe9694_ALV-UjWFb4ILMTKZpnB2Frcea9oREb1-hiCgYE1TRc49as_DmQ8FJMr0%3Dw144-h144-p-rp-mo-ba12-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Andrew Chanthaphone</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">2 years ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">The guys during Installation were so efficient and neat. They provided a very prompt and thorough installation, and made sure to answer all my questions. They did a remarkable job, very detailed, and finished in 1 day. Chris and Mike also did a great job following up and visiting, making sure they are present and available to answer all questions or concerns on all the job level. Highly recommended</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c841f1005c102edbe9691_ALV-UjWeoGSaOwo6FLWWS6Pjrjz37LYbgX3wnSEwIBKJF5JA2sFK8lY%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Bernard Assily</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">2 years ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">We got bids from 5 companies and this small, local, veteran-owned business came out on top. The salesman was responsive, thorough, patient with our tons of questions, and had good questions for us to help us through the process.  The owner was very involved and came by in person to evaluate some technical questions/issues with our windows. They put the time in, with their installer coming out too, to make sure the windows we wanted would fit, with no surprises.   There were 3 outstanding things that got our business: 1. The salesman and the owner came over several times in person to evaluate the existing window set up. They wanted to be sure they COULD fit the windows and were more concerned about that than just &quot;making the sale.&quot;  2. They gave us references - and addresses so we could go look at their work and even talk to former customers - that was  SO helpful .  We actually had other companies say &quot;No, we don&#x27;t give out references&quot; -- really ?  That was a no-go.  and the clincher was 3. The salesman explained that 1 - they don&#x27;t require a downpayment - they trust us when we commit to purchase and 2. we don&#x27;t pay until we&#x27;re satisfied.  THAT was extraordinary. If they are that confident in their work that they were willing to put their money where their mouth was, that&#x27;s good old fashioned, high quality, reliable, trustworthy businessmen. Rare these days.  We&#x27;ve had so many bad experiences with contractors - our driveway was half torn out and THEN the paver came and demanded 2X the estimate, painters who no-show, etc - these guys are different, they take pride in their word as well as their work.  The installation was speedy, they were so efficient, worked carefully around our interior and exterior, cleaned up and made sure everything was in order before they left.  The windows are absolutely beautiful. Our only regret?  Not doing this years ago !</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c841f1005c102edbe96a9_ACg8ocJC-OIRFrjC4Ys5Bk0DHIGW7kEwUxF05hvzzbA3DbvuxTQuog%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">D C</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">3 years ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Chris and his team did a great job with window replacement through our entire house. They were communicative, timely, and performed quality work.</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c841f1005c102edbe968b_ACg8ocImpY5r5Pj3tp1v-NevWso6zhDjDS29OMqeSM97mAdCIujRKA%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Alexander Mandeville</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">a year ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Clifton Exteriors replaced 2 sliding patio doors in my house. From the first appointment when Mike came to do the assessment, I was completely comfortable. He was very thorough and covered all questions. The installers were on time and even though some adjustments had to be made, they finished in just a few hours. I would not hesitate to use them again!
  Thank you to Mike and Chris for such a nice experience!</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c841f1005c102edbe96a3_ALV-UjVv2IDIy0jg5835MWP09wFvPCWc3UYj41c6ruLoCcCx2v_qJqxs%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Patricia Adams</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">4 years ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">My experience with this company was stellar. The customer service, products, and quality of the installation all 5 stars. Extremely pleased with Mike who has a great eye for aesthetics and is very detailed. His recommendations were within our budget and exceeded our expectations. The entire process was worry free and Mike was there to answer questions every step of the way. Highly recommended. The windows elevated the look of our property, the difference is astonishing!</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c841f1005c102edbe9682_ACg8ocLo3eJwVANIvPO_v2l4zVcWxcATbCqHPIWMX2-8ktTx9uyReA%3Dw144-h144-p-rp-mo-ba12-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">GG MIA</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">2 years ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">The personal and professional service received from Clifton Exteriors was fantastic.  They kept me informed each step of the process and the work was completed on time as scheduled.  They did a fantastic job.  I highly recommend them.</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c841f1005c102edbe969d_ALV-UjUy5k3Xna1lGOsyv35yO7t_CnGkX5GMTeUbQVrmBOL0A2zDheiO%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Peggy Bell</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">2 years ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Clifton Exteriors was responsive, easy to work with, and provided very accurate timelines.  Their installation team was prompt, efficient and did excellent work.  I am very satisfied with their work.</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c841f1005c102edbe968e_ALV-UjXVr36PnjGFbclVAD6axeh2PY85Ihg9P0cphUYRgPPjRhBAg1Vi%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Jeff Dohse</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">2 years ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Chris, Mike, Rene and Han were great to work with. Very responsive, and kept me informed every step of the way. Installers were fast and professional. Love my new French Door and Garage door. Han is the BEST!</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c841a74d637350a28720b_ALV-UjWpeS2SqdfuCOiG4lE6VbTgvWTuCxDoldOAkkAcZNxIkn_pI0ig%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">ellenpward</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">Edited a year ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Clifton Exteriors wrapped all our exterior wood trim with PVC coil, replaced our gutters and installed a new front door.  Chris and his team are fantastic to work with and take pride in doing things &quot;the right way&quot;.  Their attention to detail in what was a large-scope job was wonderful.  I&#x27;m a local realtor and see a lot of jobs done &quot;the wrong way&quot; so am pretty critical when it comes to workmanship.  Clifton Exteriors is top-notch and I would definitely use them again and will continue to recommend Chris and the team to clients, friends and neighbors for sure!  Thank you for helping us make our Clifton home more beautiful!</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c841a74d637350a28720e_ALV-UjWWanLr6WOVEAbQ-iffPyRcktGiLLdkdO3ba9iW6SAuNIjmgh-0%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Jennifir Birtwhistle</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">4 years ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Clifton Exteriors replaced my roof, gutters, gutter guards, downspouts, and capped all windows damaged from a hail storm. Called Chris on short notice to meet with my insurance adjuster, he showed up, and got me approved for the previously listed replaced items. From there he kept me in the loop for each phase of the work. It was done timely, with quality and professionalism, with no issues. No pressure during the entire project, to include no upfront payment demands. All projects should be this easy.</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c841a74d637350a2871f6_ACg8ocLVKwVXKxj48r4mfuYXZdXwqhbAI-tMPlQPhByJjYGmxac-Bg%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Simon Markovich</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">2 years ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">We used Clifton Exteriors, LLC recently for a new roof for our townhouse and from start to finish the process was a breeze.  Chris was a professional to deal with and was always responsive whenever I had a question or needed more information.  The price was very reasonable and the work was done in a timely fashion as promised.   The workers were very neat and tidy as well.  I recommend Clifton Exteriors, LLC highly.</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c841a74d637350a287211_ALV-UjWsbGx2l-zAOTkr-5z0pNOB1bCrcn9FSxxcj7xmWNaxxJkrVyIH3w%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Elissa Woodall</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">5 years ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Chris and his team replaced our siding, trim capping and exterior door this past winter and did an amazing job. Chris walked me through the process of replacing the door and siding, answered all of my questions as well. His team was on time to the job, finished in a timely manner, and cleaned up great after the job was complete. If you need any work done on your house, I couldn’t recommend another company to work with.</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c841a74d637350a2871fc_ACg8ocIKRUYotprr765KHAi-pDRyHIsJUJPuSHZf5MogD-B1SP8taQ%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">David Jablonski</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">2 years ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Clifton Exteriors just completed the installation of our old, hail-damaged roof, and we are thrilled with the results!
  The crew was prompt and professional, and when they finished there was no trace of anyone having completed major exterior work.
  This is the second time we have engaged Clifton Exteriors for renovations to our home. In 2020, they replaced the soffits and flashing, as well as wrapped our front porch structures. This gave us confidence to call Chris McNulty at Clifton Exteriors once again to upgrade our home.</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c841a74d637350a287217_ALV-UjU1H7-uO5XJnG6UjWcUzIeVe5YhP02bvRmRrx63TSimm-SVJrGQ%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Joseph Murphy</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">2 years ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Contacted Clifton Exteriors after finding a leak in our roof. The team responded same-day, walked me through their process and discussed potential solutions. Appointment was scheduled for the very next day and they completed the repair within an hour. Super responsive, very professional and reasonably priced. Would highly recommend Chris, Mike and the team at Clifton.</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c841a74d637350a28721d_ALV-UjX6FLB6WzwNV6Ku8dycGy0RQUPjbg8M--5ihsoE4JKnQT3qSMVP%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Steven Nelson</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">3 years ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Clifton Exteriors replaced my front door and side lights and I couldn’t be happier!  Excellent communication and the work is superb!  Highly recommend them for your home project - such an excellent contractor is very hard to find!</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c841a74d637350a2871f3_ACg8ocLE2r1XQ-iD9pSwt5ck1WtjSt-VdQXn2pG6GC0R9vV-cdPHUA%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Gail Hogan</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">a year ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">We had our French door from our kitchen to our deck redone and Clifton Exteriors did a wonderful job. The door is beautiful and the guys that worked on it were professional and so nice.  And a big shout out to Mike Sullivan who was so easy to work with.</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c841a74d637350a2871ff_ACg8ocLOpvsxVApCMUWBFKR7xxQet-IjLbd_OlyDhVwTb0v1eBYcujs%3Dw144-h144-p-rp-mo-ba12-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">TechSavvy Hero</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">2 years ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Had a great experience with Clifton Exteriors. Worked with Chris and ended up having 39 windows installed. Pricing was competitive compared to other quotes I received. Once windows arrived team was able to come out abd do full installation in 1 day. Windows look beautiful and have not come across any issues.</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c841974d637350a2871e2_ACg8ocJRcqR9TB9Gwe5hKqAYEOeQRkdiT53S-nHzTYtRA0pdgYgjnycg%3Dw144-h144-p-rp-mo-ba12-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Brian Wood</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">3 years ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Clifton exteriors installed all new windows at my daughters condo last year. What a great job they did! So I just got them to install a beautiful storm door at my house. They are so professional, prompt, have fair prices and are veteran owned. Highly recommend this company!</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c841a74d637350a287208_ALV-UjUGHiNnNMVt-1V2MSC5GWHMfRxlwu0_xAlzx6dMDl_oLkUv6ZYm%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Jennifer Burson</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">2 years ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Our 2nd experience with Clifton Exteriors, and just as good, if not better, than our 1st! Added a deck — FINALLY! — to our 30 year old house. Absolutely beautiful! Decided on Trex materials which was a good choice. The crew, led by Chris, Mark and David, was excellent! They were reliable and VERY conscientious. We love the final result!</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c841a74d637350a2871f9_ACg8ocJLY6qSpMGbe2TscrL4IQ70w-1XwOx09oxapjHstoERH_GD2Q%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Barbara Corcoran</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">Edited a year ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Great experience. This is the second time I have used Clifton Exteriors (first time was in mid 2024). Needed a quick repair on the rear rake board of my roof (this time on the left side of the house), where the aluminum cover got ripped off due to high winds. Chris sent over some of his workers on 24 Dec and as the last time, they did a great job and repaired it quickly.</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c841974d637350a2871e9_ACg8ocIVQTdJ0AXmWrCOUrW6_11yF1FVI23CBzdSYUyeQujDCbViyQ%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">T Niazi</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">Edited 5 months ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Our review is as the neighbor of someone who hired Clifton Exteriors.  We reached out to Clifton after being disgruntled by staff driving over our front lawn.  To be fair to Clifton - property lines are not obviously marked, and we suspect our neighbors never took the time to share information with their contractors.  Regardless the owner, Chris, immediately called back, came out in person to investigate and remedied the situation after we came to an agreement in person.  We commend Chris for his proactive approach -- we can tell he is committed and takes ownership of his jobs and crew seriously.</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c841974d637350a2871df_ACg8ocJyBZsdo6aNt1_PkQiuxBtiJh3YE137m8-NtxMoNklKHfoJEA%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Simmi &amp; Sim Sran</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">a year ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Updated! We just re-hired Clifton Exteriors to replace our windows and they did a fantastic job. The crew arrived EARLY and finished a whole-house replacement by mid-afternoon. They also left the windows and our house sparkling clean—it was like the new windows magically appeared!
  *****
  We had a really great experience with our recent front door replacement and new shutters. We experienced a significant delay due to COVID-related supply chain issues, but they communicated with us every step of the way, were committed to making sure everything was done quickly and to our satisfaction when the door arrived, and we&#x27;re delighted with the refreshed exterior of our home.</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c841a74d637350a28721a_ALV-UjX3lFjtFXyQTl6qgWF4UtgBQ4Kpq2W71DXwHt8vLs1k4R2LzZX97A%3Dw144-h144-p-rp-mo-ba12-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Angela Brown</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">Edited 2 years ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Great experience with Mike and Chris.  Mike was very knowledgeable and no pressure.  Offered me various options for my budget and needs. The crew worked efficiently and clean up was thorough.  Got a new roof, windows, siding and gutters.  Trust the reviews these guys are fantastic! Chris is a very proactive owner and made sure the job got completed on schedule and on budget.  Will be doing doors next.</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c841a74d637350a287202_ALV-UjWOHjwhZaTfIiNM-opAWz0AeYwzb7Z4YxbN9ZOWcavPKNso3L96%3Dw144-h144-p-rp-mo-ba12-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">uscray</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">2 years ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Chris worked with me to navigate the process of submitting a claim to my home insurance, and my insurer ended up covering the replacement of my roof. The team at Clifton Exteriors was professional and detail-oriented. I&#x27;m very please with the work the did and would recommend them to others without reservation!</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c841a74d637350a2871f0_ACg8ocKRt-cVb-RBNtsySlptOjvJ8BAUz1uc7T8h5_C7YsPWcemw2A%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Erik Matson</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">2 years ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Clifton Exteriors  did the siding for our house renovation earlier this year. We looked into numerous companies, solicited quite a few bids, and we are sure glad that we used Clifton exteriors in the end. Chris worked with us to find a cheaper alternative to pricey Hardie plank that wouldn’t break the bank but also wouldn’t compromise quality. His team was prompt, responsive, and worked quickly and efficiently to get the project completed. We are in love with our siding and the job they did - we only wish we had found them sooner to do more exterior projects for us!</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c841a74d637350a2871ed_ACg8ocLAK3--yh_aQWVRKw5FpTTmiP01z2EKq1RyhfA-RTzKDrQbuQ%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Kristie Kendall</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">2 years ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Finding a quality company providing home improvements is always a bit of a gamble.  Happily, after considerable searching, Clifton Exteriors far exceeded our expectations!
  We hired the company to install oversized gutters and new downspouts.  Our home is surrounded by tall trees and for that reason we also sought a means to keep our gutters clear of leaves and other detritus.
  Working with Clifton Exteriors was extremely easy.  Their estimate aligned with other estimates, but the contract we received was among the most professionally generated  contracts we&#x27;ve ever seen compared to previous jobs with other companies. The contract was extremely detailed and outlined everything we could expect.
  It took approximately 1 1/2 - 2 weeks to get onto their schedule, but once we had a date, owner Chris McNulty kept us well informed with respect to start time and other details.  When they had to postpone the job, Chris was very flexible to reschedule our work date.
  The crew that came to our home was courteous, highly professional, and worked non stop to complete the job in approximately three hours.  Cleanup was outstanding, to include ensuring the contents of our old gutters was not left behind.
  Clifton Exteriors installs the Bulldog gutter guard.  The system does not include a mesh screen that can become clogged from shingle dust and other debris.  We won&#x27;t know if it solves our leaf problem for quite some time, but we&#x27;re optimistic it will do the trick.
  Clifton Exteriors is a local company and we will definitely call them when future work on our home is required.  Excellent company and very easy to work with - professional, responsive, and quick to answer all of your questions!!</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c841a74d637350a287205_ALV-UjWG5osI3cGgmsBLvGF0lo79mpY2PYMyAfweyTSCcJwLCqw74MI%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Ed ED</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">2 years ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Chris and his team are OUTSTANDING! We replaced windows, wrapped the whole house trim, and replaced the gutters + gutter guards. The work was completed in a timely and orderly manner. Chris was very responsive to questions and provided routine updates on the project. Staff were polite, clean, and very hard working. They were able to stay on schedule and within budget. Would highly recommend, we could not be happier with how the work turned out.</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c841a74d637350a287214_ALV-UjWTEZETt0jgHMHjjXpnvenBkgc-3XZkqaifWEJMN4RXLaa6eSiu%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Evan Del Duke</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">2 years ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">This review is a bit late but I made sure not to forget to come back to write it. We had our work done late April 2023.
  Chris and Clifton Exteriors 100% exceeded our expectations in every way.
  From the moment I submitted the quote for a request until the final inspection was done, everything was done with incredible professionalism and the workmanship was excellent.
  We had windows and siding replaced and trim work done around some door frames, the trim being something Chris suggested and we are so happy he did. It gave the project the perfect finishing touch and he was the only one to suggest doing it for the best outcome.
  Chris provided many options and colors for the windows and siding and all of the materials were high quality.
  The estimate provided was very detailed with every item and price listed in an organized way, it was the best laid out estimate we received (we had 5 estimates done) and it was easy to read.
  The crew that did the installation were meticulous and very clean and when they were finished there wasn’t a single piece of trash or debris left behind. The foreman and Chris were always available to assist us in any way and communication was timely.
  Christ definitely stands by his work and will make sure all his customers are happy with the final result.
  I would very highly recommend Clifton Exteriors for any work you may need. You will not be disappointed.</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c8414fe14579ee1d3d7d9_ACg8ocKkYEQZzeID3VWb20uIYelr4CduJwB5VEieprsMlIqf5bBz-Q%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Veronica Garcia</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">2 years ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">CE replaced the windows and siding on my house.  The crews were so meticulous.  No problems.  No excuses.  No mysterious disappearances, all of which are common with most contractors.  It was so refreshing to deal with a company that values excellence.  And, they cleaned up the mess!</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c8414fe14579ee1d3d7e5_ACg8ocK4vkNd0DG_GWcJZr3-q3zuRtCh81lBUeRyNxP9JGKLWsvIxg%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Ann Callaway</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">2 years ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Clifton Exteriors installed a new roof on my home and I couldn&#x27;t be happier with the results. Not only does the roof look beautiful, but Clifton Exteriors is a wonderful company to work with. Mike and Chris kept me informed throughout the entire process and made sure to let me know of the various issues they came across during installation through texts, calls, and even pictures. I wouldn&#x27;t hesitate to use Clifton Exteriors again in the future for additional projects as well as recommend them to others.</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c8414fe14579ee1d3d7d6_ACg8ocIL12h-jXKSYDVuMi8lqQe-B7oc936JzWOo9PzNtaderddI1YFx%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Laura Danner</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">2 years ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Clifton Exteriors replaced my roof.  From the first contact they were professional, responsive and ready to advise and assist.  They were flexible in scheduling around other work being done by another contractor.  The team that did the installation arrived on time and completed the work professionally and competently.  When finished, the area around the house was thoroughly cleaned up...I couldn&#x27;t find a single nail or piece of scrap.  The roof recommended by Clifton Exteriors came out looking even better than expected.  Chris was easy to work with and kept an eye on the work as it was being completed. I would definitely use this company for any future exterior upgrades.</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c8414fe14579ee1d3d7ff_ALV-UjUsBuIYOkpjoUl2BSZcr8Uzdk4f7WU_Zv2KcgrtLaHQTFRfjaI%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Jim Ackert</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">3 years ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">We&#x27;ve used Clifton Exteriors for multiple projects around the exterior of our house and will continue to use them for any future projects. We&#x27;ve gotten windows, siding, roofing, trim, and gutters replaced and each time the crew was prompt, courteous, and cleaned up thoroughly once they were finished. There was full transparency and honesty with cost, and no unexpected bills came our way.
  The owner, Chris McNulty, was attentive and involved at every step of the process. He also helped a great deal with the insurance claims we made for the relevant jobs. We&#x27;re always happy to support a local business, but in this case we got the best customer service experience I could&#x27;ve imagined. I would highly recommend that you use Clifton Exteriors for your next exterior home project. I know that we will.</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c8414fe14579ee1d3d7fc_ALV-UjWn7VTriWsLEwhOfthW5elBCeXBx2KpcKI7IN2lGtxfQ2dD4hOv%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Ben Shuman</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">a year ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Clifton Exteriors did a great job replacing the gutters and downspouts on my garage.  I was very impressed with the quality of the work and my communications with the owner.  He was very responsive to phone calls and he scheduled the work quickly.  I highly recommend Clifton Exteriors!!!</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c8414fe14579ee1d3d7df_ACg8ocK8PKpq01SGEJvK1aAhnVHqBbmXXEBLSTiKrp4RLrUlmfnZEQ%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Lisa K.</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">a year ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">We had all of our windows replaced in the South Riding area. Selected Clifton Exteriors to support local business and based on reviews along with some friends who have used. Great experience from the start with Mike waking us through the process and options. The installation crew was on time, efficient and clean. The owner (Chris) and Mike were easy to reach throughout. Really happy with the work and I know they are only a call away if we run into an issue.</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c8414fe14579ee1d3d805_ALV-UjUllO6xJkHKbeUnMdeSbBxrWmxQafpvwi3EhkTfN8fy-SmyZBxk%3Dw144-h144-p-rp-mo-ba12-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Jay Conklin</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">a year ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">The team at Clifton Exteriors did an excellent job replacing our roof. Starting with our first interaction with Mike, and continuing with the hands-on involvement of Chris the owner, we feel like received a superior product on the promised schedule at a fair price. We would recommend this company!</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c8414fe14579ee1d3d7f0_ALV-UjV4qccFTcamIv7DY2ghmOE6tp3F-ND7COuOPHNM9hLUmxAYBJpk%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Andy Cassells</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">a year ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Replaced the roof, skylights and gutters. Clifton Exteriors did an Outstanding job at a competitive price.  The crews were professional, friendly and considerate of our property. We had one issue with the shade of a skylight…Chris came out immediately and insured the manufacturer address the problem.  Never had a concern about contacting Mike or Chris on scheduling changes or just asking questions.</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c8414fe14579ee1d3d7d3_ACg8ocIvdmBy7pdZjUDn1x6PaD9KCM4s7z0cSCL48MBlgsX6Ug36-A%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Peter Cocolis</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">11 months ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Highly recommend Clifton Exteriors for their quality of work, customer service, efficiency, and price point. They installed us a new roof, gutters, doors, and windows and managed to get each project done within a day. So happy we came across this business. Will use again for other exterior work!</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c8414fe14579ee1d3d7f3_ALV-UjXc6BI161I54jMDjehohWyS7RVK6EjRlFCsNdwEDI1JJHcp3cY%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Alison Broadbent</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">5 years ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">I have a hard time hiring contractors to work on my home, because I&#x27;ve had a few experiences where I felt quality was lacking.  I&#x27;ve worked with Clifton Exteriors on two occasions.
  The first project was the installation of a new sliding door for my deck.  It was a great experience throughout the process.  Chris recommended a ProVia door, which we&#x27;re very happy with it.   It&#x27;s very well built and has a number of high end features without being prohibitively expensive.
  The second project was new trimwork, fascia, soffit, garage door capping, and gutters.   Our house looks great!
  Like many people in Fairfax County, our house is 40 years old now and needs some upgrades.  The team at Clifton did a fabulous job matching the color and finish of new trimwork to the sheet metal around it.  That&#x27;s very difficult to do well.  Installation was efficient and methodical.   They team worked quickly, but they were not &quot;rushing&quot; and took their time to do quality work.  Would heartily recommend them for your exterior project.</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c8414fe14579ee1d3d7f6_ALV-UjUh6GVrEjUumCWUtdjLq8pMa-1N76Ii4fyga5EJPzqHEbmztxzJmg%3Dw144-h144-p-rp-mo-ba12-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">N Goodall</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">Edited 8 months ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Definitely recommend!  Had wind damage to the porch. Not a big job - one that other companies might not accept. Chris and his team got back to me right away, stayed in touch, and did a great job. Will definitely use them again.</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c8414fe14579ee1d3d7dc_ACg8ocLdAOuM0gQi10CJTVrUn_93Zp7Fh1zRaacvTblKiHD0dOiW2A%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Norman Fuss</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">2 months ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">I am so glad to have selected Clifton Exteriors for my gutter replacement needs. Their proposal was the most competitive from my final selection of 3 providers. Best part was the warranty. The quality of materials and work was outstanding. The crew came back immediately to address / tweak the install after i provided my feedback post a heavy downpour.
  Top notch and highly recommended.</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c8414fe14579ee1d3d802_ALV-UjXxKGGj0oivz0MI5NbvpDEvY1_PCgt-BDME4r7dJkXMxH5QSCLK%3Dw144-h144-p-rp-mo-ba12-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Rohit Sinha</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">10 months ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Definitely recommend!  Had minor wind damage to the porch fascia board and cladding. Team quickly came out, kept in contact, and did a great job - all for a small-ish repair. Local company and everyone I felt with was friendly and professional. Will use again!</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c8414fe14579ee1d3d7e2_ACg8ocKfI_28PAnrIZiLiCmBIOwfXHRtlkQs4ecyiOdNLDIWXMfSoA%3Dw144-h144-p-rp-mo-ba12-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Carolyn Fuss</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">2 months ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Clifton Exterior offered a fair price on the windows and very responsive with communication. They did not try to upsell or were pushy. I really like this aspect of the company and their staff. In addition, the crew did a great job cleaning up after the window installation, I appreciate their efforts. I highly recommend Clifton Exteriors.</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c8414fe14579ee1d3d7cd_ACg8ocLD1-22h6fufRpYuzxYzlwANUKjTAFGHddewreKeWPzXhqUWA%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Helen H. Nguyen</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">9 months ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">We recently had our siding, gutters and windows replaced by Clifton Exteriors, and the experience exceeded our expectations from start to finish. The team was professional, communicative, and clearly took pride in their work.
  From the initial consultation to project completion, everything was handled with care and attention to detail. The crew arrived on time each day, kept the work area clean, and completed the job within the estimated timeline. They were also respectful of our property, which we really appreciated.
  The quality of the materials and workmanship is top-notch—our home looks brand new! The new siding gives the house a fresh, modern appearance, and the windows have already made a noticeable difference in both noise reduction and energy efficiency.
  If you’re looking for a reliable, skilled company for exterior home improvements, we highly recommend Clifton Exteriors. Their team made what could have been a stressful renovation process smooth and even enjoyable.</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c8414fe14579ee1d3d7ed_ACg8ocLqgmiQ2LcEQHxbSYZ2rqyzKGXdsknCtbeWrbrsQWDSUvTuB340%3Dw144-h144-p-rp-mo-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">LB Thomas</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">10 months ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">Clifton Exteriors were very responsive and professional to deal with.  Chris and Mike were very easy to work with and cared about our complete satisfaction.  We had a new front door and storm door installed along with rotted trim replacement and wrapping and all new gutters installed.  The instillation crews were very polite professional and did an outstanding job.  Everything looks really good, and we were pleased with the work that was done.</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c8411fe14579ee1d3d7b3_ACg8ocKyslQEdT41Mc-VxECKfCw5kabZw7taencGe52OOPNHr3ZXVg%3Dw144-h144-p-rp-mo-ba12-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Michael St. Peter</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">2 years ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">We needed our side door and storm door replaced. Michael worked with me remotely and asked A LOT of questions (which is good). He educated me on door quality and little custom tweaks that would be expensive or not. The installer came out to measure before order and noted that we needed a custom door because of our interior carpet, which was fine. Ordered and door came in faster than they thought. It was a custom door. Installer started the job early at 730am and he was done and tested the door 5 hours later. It is perfect. Door opens perfectly and does not get caught on the carpet. So easy to open and great quality. Exactly what we expected. I will call them when I need more exterior work done. Really happy!</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c8414fe14579ee1d3d7ea_ALV-UjUnGjl0WDGs1Ukkujxk7LK4K0jAYqqu3mHYInIFCyorr3RpSWZNyA%3Dw144-h144-p-rp-mo-ba12-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">David Benson</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">a year ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">If you’re looking to install an egress window, I highly recommend Clifton Exteriors. Renee, Kenny, and Chris were professional, courteous, and dedicated throughout the entire process. They were extremely respectful of our time and home. They maintained clear communication, worked efficiently, and ensured everything was kept clean and orderly through completion of the project.
  The permit process in Manassas Park was a little more challenging than expected, with requirements differing from other localities they typically work with. However, they navigated every hurdle and got the job done... and did it exceptionally well. We opted for a custom 6x6 pressure-treated wood well, and the craftsmanship is excellent. Despite the complexities, they delivered quality work and ensured everything met local code/requirements.</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c8414fe14579ee1d3d7d0_ACg8ocIfAtLKZGocGwq9o3TobbQ8rJXI7AtYinzH09GQ0TTnlgTKxg%3Dw144-h144-p-rp-mo-ba12-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">RYAN BAUGHMAN</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">a year ago</p>
  </div>
</div>
</div>
<div role="listitem" data-testimonial-item="" class="testimonial-lines__item w-dyn-item">
  <div class="review_wrap">
    <div class="review_icon_wrap">
      <div class="icon_wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
          <path d="[STAR_PATH]" fill="currentColor">
        </path>
      </svg>
    </div>
    <div class="icon_wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
        <path d="[STAR_PATH]" fill="currentColor">
      </path>
    </svg>
  </div>
  <div class="icon_wrap">
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
      <path d="[STAR_PATH]" fill="currentColor">
    </path>
  </svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
<div class="icon_wrap">
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 70 66" fill="none" class="icon_star">
    <path d="[STAR_PATH]" fill="currentColor">
  </path>
</svg>
</div>
</div>
<h3 data-testimonial-text="" class="testimonial-lines__h">We had a great experience with Clifton Exteriors and highly recommend them for window installation. We replaced all of our windows in our home (20ish) and they completed it in a single day. They are fair with pricing and were patient with us while we worked through different styles, details, etc.</h3>
</div>
<div class="testimonial-lines__item-details">
  <div data-testimonial-img="" class="testimonial-lines__item-visual">
    <img loading="lazy" src="https://cdn.prod.website-files.com/6a2468810d9a413b2da74a07/6a3c8414fe14579ee1d3d7f9_ALV-UjVHKCXkzIPnjmICMLFvnq686YGHIbCYQTTc5cgfKHG5BBonpgDW6w%3Dw144-h144-p-rp-mo-ba12-br100.png" alt="" class="testimonial-lines__item-img"/>
  </div>
  <div>
    <p data-testimonial-split="" class="testimonial-lines__p">Alison Fenn</p>
    <p data-testimonial-split="" class="testimonial-lines__p is--faded">8 months ago</p>
  </div>
</div>
</div>
</div>
</div>
<div>
  <a href="https://www.google.com/search?sca_esv=978d1d595132fe41&amp;sxsrf=APpeQnsmYHb98-UOHqoSvmbn_AaXaoRnoQ:1783017564070&amp;si=APenkKm7iecQ4G6P-TsbSMFKIQtv3EFIqRAFw-i8uEbk55Z-_72Uo8MXSQfFGV0Ud0Jt7Wzom-KMBrEFPTGnWanLeTWsQK7BYg_r6rIdQj2LniaaQfQ0N7xu3yq4UJMk89NZ2B8rpnDlPEKKb03VM4kfNy8gehPjCg%3D%3D&amp;q=Clifton+Exteriors+Reviews&amp;sa=X&amp;ved=2ahUKEwjG-aKE0rSVAxXMFDQIHSUzFS4Q0bkNegQILhAI&amp;biw=2380&amp;bih=1363&amp;dpr=1#" data-wf--button--variant="primary" target="_blank" class="button_primary w-inline-block">
    <div class="button-animation-hide">
      <div class="button-animation-wrap">
        <div class="button-content-tile">
          <div>Read all reviews</div>
          <div class="button-arrow w-embed">
            <svg width="7" height="10" viewBox="0 0 7 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 9L5 5L1 1" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
        </div>
        <div class="button-content-tile bottom-tile">
          <div>Read all reviews</div>
          <div class="button-arrow w-embed">
            <svg width="7" height="10" viewBox="0 0 7 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 9L5 5L1 1" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  </a>
</div>
</div>
<div class="w-embed w-script">
  <script>
    function initLineRevealTestimonials() {
    const wraps = document.querySelectorAll('[data-testimonial-wrap]');
    if (!wraps.length) return;
    const imageClipHidden = 'circle(0% at 50% 50%)';
    const imageClipVisible = 'circle(50% at 50% 50%)';
    const CLAMP_LINES = 3; // review body lines shown before "Read more"
    wraps.forEach((wrap) => {
    const list = wrap.querySelector('[data-testimonial-list]');
    if (!list) return;
    const items = Array.from(list.querySelectorAll('[data-testimonial-item]'));
    if (!items.length) return;
    const btnPrev = wrap.querySelector('[data-prev]');
    const btnNext = wrap.querySelector('[data-next]');
    const elCurrent = wrap.querySelector('[data-current]');
    const elTotal = wrap.querySelector('[data-total]');
    if (elTotal) elTotal.textContent = String(items.length);
    let activeIndex = items.findIndex((el) => el.classList.contains('is--active'));
    if (activeIndex < 0) activeIndex = 0;
    let isAnimating = false;
    let reduceMotion = false;
    const autoplayEnabled = wrap.getAttribute('data-autoplay') === 'true';
    const autoplayDuration = parseInt(wrap.getAttribute('data-autoplay-duration'), 10) || 4000;
    let autoplayCall = null;
    let isInView = true;
    const slides = items.map((item) => ({
    item,
    image: item.querySelector('[data-testimonial-img]'),
    textEl: item.querySelector('[data-testimonial-text]'), // review body that gets clamped
    expanded: false,
    textInstance: null,
    readMoreBtn: null,
    splitTargets: [item.querySelector('[data-testimonial-text]'), ...item.querySelectorAll('[data-testimonial-split]')].filter(Boolean),
    splitInstances: [],
    getLines() {
    return this.splitInstances.flatMap((instance) => instance.lines);
    },
    }));
    // ----- Read more -----
    function lineRow(line, container) {
    // walk up to the direct child of the text container (the per-line mask/wrapper)
    let row = line;
    while (row.parentElement && row.parentElement !== container) row = row.parentElement;
    return row;
    }
    function applyClamp(slide, bodyLines) {
    const lines = bodyLines || (slide.textInstance ? slide.textInstance.lines : []);
    const needsClamp = lines.length > CLAMP_LINES;
    if (slide.readMoreBtn) {
    slide.readMoreBtn.style.display = needsClamp ? 'inline-block' : 'none';
    slide.readMoreBtn.textContent = slide.expanded ? 'Read less' : 'Read more';
    }
    lines.forEach((line, i) => {
    const row = lineRow(line, slide.textEl);
    const hide = needsClamp && !slide.expanded && i >= CLAMP_LINES;
    row.style.display = hide ? 'none' : '';
    });
    }
    function toggleReadMore(slide) {
    slide.expanded = !slide.expanded;
    applyClamp(slide);
    if (slide.expanded && !reduceMotion && slide.textInstance) {
    const extra = slide.textInstance.lines.slice(CLAMP_LINES);
    gsap.fromTo(extra, { yPercent: 110 }, { yPercent: 0, duration: 0.5, ease: 'power4.out', stagger: { amount: 0.2 } });
    }
    }
    // one Read more button per slide, inserted right after the review body
    slides.forEach((slide) => {
    if (!slide.textEl) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'review-readmore';
    btn.textContent = 'Read more';
    btn.style.display = 'none';
    btn.addEventListener('click', () => toggleReadMore(slide));
    slide.textEl.insertAdjacentElement('afterend', btn);
    slide.readMoreBtn = btn;
    });
    // ----- end Read more -----
    function setSlideState(slideIndex, isActive) {
    const { item } = slides[slideIndex];
    item.classList.toggle('is--active', isActive);
    item.setAttribute('aria-hidden', String(!isActive));
    gsap.set(item, {
    autoAlpha: isActive ? 1 : 0,
    pointerEvents: isActive ? 'auto' : 'none',
    });
    }
    function updateCounter() {
    if (elCurrent) elCurrent.textContent = String(activeIndex + 1);
    }
    function startAutoplay() {
    if (!autoplayEnabled) return;
    if (autoplayCall) autoplayCall.kill();
    autoplayCall = gsap.delayedCall(autoplayDuration / 1000, () => {
    if (!isInView || isAnimating) {
    startAutoplay();
    return;
    }
    goTo((activeIndex + 1) % slides.length);
    startAutoplay();
    });
    }
    function pauseAutoplay() {
    if (autoplayCall) autoplayCall.pause();
    }
    function resumeAutoplay() {
    if (!autoplayEnabled) return;
    if (!autoplayCall) startAutoplay();
    else autoplayCall.resume();
    }
    function resetAutoplay() {
    if (!autoplayEnabled) return;
    startAutoplay();
    }
    slides.forEach((_, i) => setSlideState(i, i === activeIndex));
    updateCounter();
    gsap.matchMedia().add({ reduce: '(prefers-reduced-motion: reduce)' }, (context) => {
    reduceMotion = context.conditions.reduce;
    });
    slides.forEach((slide, slideIndex) => {
    slide.splitInstances = slide.splitTargets.map((el) =>
    SplitText.create(el, {
    type: 'lines',
    mask: 'lines',
    linesClass: 'text-line',
    autoSplit: true,
    onSplit(self) {
    // clamp the body every (re)split, before the motion early-return
    if (el === slide.textEl) {
    slide.textInstance = self;
    applyClamp(slide, self.lines);
    }
    if (reduceMotion) return;
    const isActive = slideIndex === activeIndex;
    gsap.set(self.lines, { yPercent: isActive ? 0 : 110 });
    if (slide.image) {
    gsap.set(slide.image, {
    clipPath: isActive ? imageClipVisible : imageClipHidden,
    });
    }
    },
    }),
    );
    });
    function goTo(nextIndex) {
    if (isAnimating || nextIndex === activeIndex) return;
    isAnimating = true;
    const outgoingSlide = slides[activeIndex];
    const incomingSlide = slides[nextIndex];
    // every newly shown review starts collapsed
    incomingSlide.expanded = false;
    applyClamp(incomingSlide);
    const tl = gsap.timeline({
    onComplete: () => {
    setSlideState(activeIndex, false);
    setSlideState(nextIndex, true);
    activeIndex = nextIndex;
    updateCounter();
    isAnimating = false;
    // reset the one we left so it's collapsed next time
    outgoingSlide.expanded = false;
    applyClamp(outgoingSlide);
    },
    });
    if (reduceMotion) {
    tl.to(outgoingSlide.item, { autoAlpha: 0, duration: 0.4, ease: 'power2' }, 0)
    .fromTo(incomingSlide.item, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: 'power2' }, 0);
    return;
    }
    const outgoingLines = outgoingSlide.getLines();
    const incomingLines = incomingSlide.getLines();
    gsap.set(incomingSlide.item, { autoAlpha: 1, pointerEvents: 'auto' });
    gsap.set(incomingLines, { yPercent: 110 });
    if (outgoingSlide.image) gsap.set(outgoingSlide.image, { clipPath: imageClipVisible });
    tl.to(outgoingLines, { yPercent: -110, duration: 0.6, ease: 'power4.inOut', stagger: { amount: 0.25 } }, 0);
    if (outgoingSlide.image) {
    tl.to(outgoingSlide.image, { clipPath: imageClipHidden, duration: 0.6, ease: 'power4.inOut' }, 0);
    }
    tl.to(incomingLines, { yPercent: 0, duration: 0.7, ease: 'power4.inOut', stagger: { amount: 0.4 } }, '>-=0.3');
    if (incomingSlide.image) {
    tl.fromTo(incomingSlide.image, { clipPath: imageClipHidden }, { clipPath: imageClipVisible, duration: 0.75, ease: 'power4.inOut' }, '<');
    }
    tl.set(outgoingSlide.item, { autoAlpha: 0 }, '>');
    }
    startAutoplay();
    if (btnNext) {
    btnNext.addEventListener('click', () => {
    resetAutoplay();
    goTo((activeIndex + 1) % slides.length);
    });
    }
    if (btnPrev) {
    btnPrev.addEventListener('click', () => {
    resetAutoplay();
    goTo((activeIndex - 1 + slides.length) % slides.length);
    });
    }
    function onKeyDown(e) {
    if (!isInView) return;
    const t = e.target;
    const isTypingTarget = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
    if (isTypingTarget) return;
    if (e.key === 'ArrowRight') {
    e.preventDefault();
    resetAutoplay();
    goTo((activeIndex + 1) % slides.length);
    }
    if (e.key === 'ArrowLeft') {
    e.preventDefault();
    resetAutoplay();
    goTo((activeIndex - 1 + slides.length) % slides.length);
    }
    }
    window.addEventListener('keydown', onKeyDown);
    ScrollTrigger.create({
    trigger: wrap,
    start: 'top bottom',
    end: 'bottom top',
    onEnter: () => { isInView = true; resumeAutoplay(); },
    onEnterBack: () => { isInView = true; resumeAutoplay(); },
    onLeave: () => { isInView = false; pauseAutoplay(); },
    onLeaveBack: () => { isInView = false; pauseAutoplay(); },
    });
    });
    }
    document.addEventListener('DOMContentLoaded', () => {
    initLineRevealTestimonials();
    });
  </script>
</div>
<div class="w-embed">
  <style>
    .text-line-mask {
    padding-bottom: 0.2em;
    margin-bottom: -0.2em;
    }
  </style>
  <style>
    .testimonial-lines__main {
    min-height: 40vh;          /* was height:40vh — min-height lets it grow when expanded */
    height: auto;
    display: flex;
    flex-direction: column;
    }
    .testimonial-lines__collection {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    }
    /* single stacking row that fills the collection and grows with content */
    .testimonial-lines__list {
    flex: 1 1 auto;
    min-height: 0;
    grid-template-rows: 1fr;   /* was minmax(0,1fr) — now allowed to grow instead of scroll */
    }
    .testimonial-lines__item {
    display: flex;
    flex-direction: column;
    overflow: visible;         /* removes the old scroll */
    max-height: none;
    }
    /* reviewer image + name: always visible, pinned to the bottom */
    .testimonial-lines__item-details {
    margin-top: auto;
    }
    /* Read more toggle */
    .review-readmore {
    display: block;            /* was inline-block — lets it align left in a centered container */
    text-align: left;
    margin-top: 0.5em;
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    font-weight: 600;          /* semi bold */
    color: inherit;
    cursor: pointer;
    text-decoration: none;     /* no underline */
    }
    .review-readmore:hover { opacity: 0.7; }
    /* Mobile: smaller section */
    @media (max-width: 767px) { .testimonial-lines__main { min-height: 55vh; } }
    @media (max-width: 478px) { .testimonial-lines__main { min-height: 50vh; } }
  </style>
</div>
</div>
</section>
```

---

## 6. CTA section (yes — it exists) and contact/form structure

**The homepage has a dedicated CTA band**: `section.u-section.section_cta` ("A Hassle Free Process"), separate from the hero and the footer. Structure:

```html
<section class="u-section section_cta">
  <video class="home-hero_video home-hero_video" autoplay loop muted playsinline preload="auto">
    <source src="https://www.cliftonexteriors.com/wp-content/uploads/2024/10/Website-Front-Page-Video-No-logo-1.mp4" type="video/mp4"/>
  </video>
  <div class="hero_video">
    <div class="cta_bg-cover"></div>
  </div>
  <div class="cta_content">
    <div class="u-header-group">
      <div data-wf--review-badge--variant="blue-star" class="u-rating-component"> …star + "5/5 from over 75 reviews"… </div>
    </div>
    <div data-wf--heading-text--heading-style="h1" class="u-heading w-richtext"><h2>A Hassle Free Process</h2></div>
    <div class="u-paragraph w-richtext"><p>We have crafted a process that keeps your vision …</p></div>
    <div class="button-group">
      <a href="/our-process" data-wf--button--variant="secondary"
         class="button_primary w-variant-20cba543-cf6e-97d3-e78f-24f4c5d44d52 w-inline-block">…Our Process…</a>
    </div>
  </div>
</section>
```

Key CSS:

```css
.u-section.section_cta {
  border-radius: var(--_spacing-styles---radius--small);   /* 1rem */
  /* dark scheme remap — background #121c32, text #faf9f7 (see §2a) */
  overflow: hidden;
}
.cta_bg-cover {
  z-index: 1;
  background-color: #121c32bf;   /* navy at 75% over the video */
  background-image: linear-gradient(180deg, #3d403c, var(--_primitives---neutral-colors--transparent) 50%, var(--_primitives---neutral-colors--neutral-darkest));
  position: absolute; inset: 0;
}
.cta_content { padding-left: 5%; padding-right: 5%; }  /* needs z-index above the cover via source order */
```

So the CTA recipe = **rounded dark video band with scrim + centered `u-header-group` + secondary glass button**. A second, unused CTA style also exists in CSS (`.cta_wrapper` / `.cta_text` / `.cta_button-row` — flat `#1d2733` box, `padding: 4rem 2rem`, centered) left over from the template.

**Contact/form section**: none on the homepage — there are zero `<form>`/`.w-form` elements. "Contact" is handled by (a) every button linking to `/contact-us`, and (b) the footer contact block: `cx-foot__contact` > `a.cx-foot__clink` (tel: `(571) 249-1480`, mailto: `info@cliftonexteriors.com`) + `div.cx-foot__addr` (12644 Chapel Rd #104, Clifton, VA 20124) + a secondary `button_primary` "Get Quote". **A new CTA section should therefore match `section_cta`** (dark navy, radius 1rem, `u-header-group`, glass secondary or navy primary button) — not a form pattern.

Footer core CSS for reference: `.cx-foot { color: #cdd3df; background-color: #121c32; padding: 5rem 0 2.5rem; font-family: Hankengrotesk…; }`, `.cx-foot__inner { max-width: 80rem; margin: auto; padding: 0 5%; }`, columns collapse at ≤767px.

---

## 7. Custom code (non-standard-Webflow)

**Head**
1. `<style>` — global `* { -webkit-font-smoothing: antialiased; … }` font-smoothing snippet.
2. Webflow-generated `html.w-mod-js:not(.w-mod-ix3) .usp_shine { visibility: hidden !important; }` (IX3 pre-hide for the USP shine element) — standard runtime, listed for completeness.

**Body — `.global-styles.hide` embeds (CSS only)**
3. Finsweet **Client-First v2 boilerplate** style embed (inherit-color resets, focus-visible outline `#4d65ff`, richtext margin trims, `.hide-*` classes, margin/padding directional strippers, `.no-scrollbar`).
4. **Relume color-schemes embed**: `.color-scheme-2` … `.color-scheme-10` remap `--color-scheme-1--*` vars; also re-skins Webflow slider dots (`.w-slider-dot` uses scheme text color at 0.2/1.0 opacity, with `!important` overrides for `.w-slider-nav-invert`).

**Body — component scripts**
5. **Mega-nav** (`w-script` inside the nav wrapper, ~500 lines): `initMegaNavDirectionalHover()` — GSAP-driven mega menu: directional hover intent (120/150 ms enter/leave timers), morphing dropdown background (`[data-dropdown-bg]`), staggered panel fades (`[data-menu-fade]`), backdrop, burger-line morph and slide-in mobile panels with back button; breakpoint at 991px. Companion `<style>` embed sets `--nav-height: 4em` and `.wf-design-mode` helpers so panels stay editable in the Designer.
6. **Testimonials** (`w-script` at the end of `section_reviews`): `initLineRevealTestimonials()` — full source reproduced in §5.4; GSAP SplitText line-reveal slider with autoplay, ScrollTrigger visibility pause, keyboard nav, and injected Read-more clamp. Companion `<style>` embed (§5.3).
7. **Footer scripts**: GSAP 3.15.0 + ScrollTrigger + Observer + SplitText from the Webflow CDN, then inline `gsap.registerPlugin(ScrollTrigger,Observer,SplitText);`, then an uploaded site asset `navdropdowntoggle-1.0.0.js`. Note: the portfolio marquee is attribute-driven (`data-draggable-marquee-init`, `data-direction="left"`, `data-duration="20"`, `data-multiplier="35"`, `data-sensitivity="0.01"`) and its init code is **not** embedded in the homepage HTML — it lives in that uploaded JS file (or site-wide custom code), so remember it when adding marquees to new pages.
8. **Hero/feature/CTA videos are hotlinked from the old WordPress site** (`https://www.cliftonexteriors.com/wp-content/uploads/2024/10/Website-Front-Page-Video-No-logo-1.mp4` — same file used 4×). This is a fragility to fix before launch (old host dies → hero goes black).

Standard Webflow runtime otherwise: jQuery 3.5.1, `webflow.schunk.*.js`, `webflow.[hash].js`.

---

## 8. Other pages (from nav + footer links)

**Mega-nav "Services" panel** (`/windows`, `/doors`, `/roofing`, `/siding`, `/gutters` under "Expertise"; `/our-process` ("Out 10-Step Method" — typo for "Our"), `/pricing`, `/portfolio` under "The Process"; `/financing`, `/insurance-claims`, `/contact-us` under "Project Process").

**Mega-nav "Company" panel**: `/about-us` (×2 — "Our story" and "Meet the team" both point there), `/testimonials`, `/service-locations`, `/blog`, `/employment`, plus a promo card → `/contact-us`.

**Footer columns**:
- Services: `/windows`, `/doors`, `/roofing`, `/siding`, `/gutters`
- Company: `/about-us`, `/our-process`, `/portfolio`, `/service-locations`, `/employment`
- Resources: `/pricing`, `/financing`, `/insurance-claims`, `/testimonials`, `/blog`
- Legal: `/privacy-policy`, `/terms-of-service`
- Social (external): Facebook, Instagram, Yelp, YouTube

**Unique internal pages (17)**: `/` home, `/windows`, `/doors`, `/roofing`, `/siding`, `/gutters`, `/our-process`, `/pricing`, `/portfolio`, `/financing`, `/insurance-claims`, `/contact-us`, `/about-us`, `/testimonials`, `/service-locations`, `/blog`, `/employment` (+ `/privacy-policy`, `/terms-of-service`). Existence unverified — this is the intended sitemap per the nav; some may 404 on staging.

---

## Version Control

Workflow artifact for `deliver/farewell-agency/clifton-exteriors/workflows/04-design`. Lightweight `.tmp/` analysis file — commit is optional per [SYSTEM_RULES.md](../../../../../../SYSTEM_RULES.md); regenerate by re-downloading the staging homepage and re-running the analysis if the teammate publishes changes.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
