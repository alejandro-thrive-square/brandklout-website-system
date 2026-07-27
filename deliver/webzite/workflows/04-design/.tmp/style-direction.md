# Style Direction — Webzite Studio Home (Redesign)

Date: 2026-07-17 (first draft) · **Revised 2026-07-18 (Revision 2 — Isadora layout & motion)**

> **Alternative r3 (2026-07-18): scroll-film edition — `.tmp/scroll-film/`.** Built with the
> `scroll-film-studio` skill (Lane A pure-code, GSAP + Lenis): the hero becomes a 4-chapter
> pinned film — the equation solves itself (Strategy / + Experience / + Function / = Profit)
> — then dissolves into the same proof content. Brand system, copy, pricing, and quotes are
> identical to r2; only the hero architecture differs. See `scroll-film/README.md`. r2
> (`final-design/`) remains the primary package; r3 is a candidate pending user pick.
Path: Claude Design (coded HTML/CSS/JS package)
Scope: Home page only (per project-overview stop point — design HTML, no Webflow paste).

## Revision 2 (2026-07-18) — Isadora layout & animation system

Layout and motion re-staged on the language of isadoradigitalagency.com, analyzed frame-by-frame
from `manage/browser-tools/playwright-browser/.tmp/style-capture-isadora-final` (spec: 29 contact
sheets + DOM/CSS/JS evidence). **Brand style untouched** — all `--wz-*` tokens, fonts (Inter /
JetBrains Mono), dust + grain atmosphere, and copy decisions (canonical pricing, honest
proof, studio-of-one) carry over verbatim. What changed:

> **Type correction (2026-07-18, post-r2):** r2 initially shipped Isadora's serif display voice
> (Fraunces via a new `--wz-serif` token) on all headings/statements. Reverted on review — the
> brand system is a strict two-font stack (Inter + JetBrains Mono). Display type now uses the
> brand scale: Inter 800 for display headings (hero, `sec-head h2`, contact), 700 for
> sub-display (service rows, case names, stats, rates), 600 for large statements. Fraunces and
> all italic accents removed (no italic cuts are loaded); `em` accents are color-only (yellow).

1. **One continuous scroll-morphing canvas** (Isadora signature #1): body background is JS-lerped
   between token stops only — ink → ink+26% blue (theater) → ink+24% red (manifesto) → ink-2
   (case studies) → ink. A single blurred orb (blue core / red edge / mist halo, `blur(64px)`)
   wanders the whole page through 7 waypoints. Vanilla rAF loop, no GSAP.
2. **Hero → pinned theater**: the equation renders as one centered serif display statement
   (`Strategy + Experience + Function` / `= Profit`); a 300svh sticky stage scrubs the text out
   at -108svh while a browser-chrome "case reel" card (approved 3D brand renders crossfading,
   pause control fades in near pin end — WCAG 2.2.2) expands from a 46vw bottom peek to a
   center-locked ~90vw theater. Expansion completes at 82% of the runway for a center dwell.
   Curtain-up load: staged fades + masked title-line rise (fade-only boot so it can't fight the
   pin transforms — transform-based boot caused a specificity bug, r1).
3. **Manifesto + service rows** replace the cap-card grid: serif statement, then Design/Build/Grow
   as hairline rows (square accent bullet, serif heading, mono meta line) with a sticky image
   well that swaps renders per hovered/focused row.
4. **Case studies = offset editorial grid** (58% landscape / 32% portrait alternating, art-directed
   column offsets) replacing the index rows; hover = inner image scale(1.1) + yellow underline
   draw. Renders remain honest stand-ins, noted inline.
5. **Statement + stats**: word-fill prose (underlined keyword links) + 2×2 slow serif count-ups
   in yellow (3.2s), replacing the metrics strip in the hero.
6. **Client voice = hairline ruled quote table** (2×2, shared 1px borders, no shadows; 4th cell is
   the 4.5★ Upwork rating link). Auto-rotation removed — all three verified quotes always visible.
7. **Nav compresses** 68→56px and solidifies on scroll; contact is a serif closing statement with
   eyebrow micro-columns. Paper band dropped — light relief now comes from the bg morph (all stops
   keep white-text AA contrast, unlike Isadora's coral-on-white-text moment).

Reduced motion: scene loop, pin, reel, boot, and fills all fall back to a static, fully-visible
ink-canvas page. Verified via headless CDP renders (desktop/mobile/reduced + scroll-through +
pin-runway frames in `.tmp/screenshots/isadora-r1|r2/`).

## Source of truth

Built directly on **Design System v2.0** (`manage/brand-assets/design-system/`), the editorial specimen document. Tokens are inherited **verbatim** — no new hex values, spacing steps, or easing curves were introduced (see `design-tokens.json`). The home page is the first application of that vocabulary to a real marketing surface.

## Positioning executed

Per the locked decision **studio-of-one (hybrid)**:
- **"We" for the work, a named face for the relationship.** Copy uses "we"/"a studio-of-one" for the practice and surfaces Alejandro as the accountable partner in the thesis and contact sections. This resolves the live site's freelancer/Studio contradiction flagged in intake.
- The hero lede was rewritten from the old first-person freelancer line ("I'm a freelancer helping companies…") to a studio-of-one statement that keeps the accountability signal ("one senior partner, accountable end to end").

## Concept

The old site's strongest idea — **"Strategy + Experience + Functionality = Profit"** — was weakly executed as four stacked words. The redesign makes it the literal centerpiece: the hero renders the thesis as an **arithmetic equation** (`Strategy + Experience + Function = Profit`), with the result in brand yellow. It doubles as the site's argument: a website is only worth building when it adds up to profit. The thesis section restates it in plain language ("A pretty site is a cost. A profitable one is an asset.").

## Visual language

- **Dark-first editorial.** `--wz-ink` canvas, Inter 800 display type, JetBrains Mono labels, hairline `--wz-line` rules, generous 4px-lattice spacing.
- **Accent discipline.** Yellow is the single action/emphasis accent (CTAs, result word, active states, section numbers). Blue appears only as ambient depth (radial gradients behind proof/footer) and one proof-tag variant. Red is reserved (unused on home — kept for error states per the system).
- **Atmosphere.** The design system's pointer-reactive dust canvas (`initDust`, verbatim) plus the grain overlay and scroll-progress bar carry over unchanged.

## Sections (top → bottom)

1. **Hero** — the equation, studio-of-one lede, dual CTA, credibility metric strip.
2. **Marquee** — capability keywords, brand-yellow bullets.
3. **Thesis** — the profit argument in prose.
4. **Selected work** — an editorial *index* (not a grid), one row per project, with a cursor-following preview card. This answers intake's "portfolio should become a central proof system, not a grid."
5. **Capabilities** — Design / Build / Grow, the whole-build story for a studio-of-one.
6. **Client voice** — the three verified Upwork testimonials on the design system's proof-rail pattern.
7. **Engagement** — transparent per-page pricing with a live cost/timeline calculator (see Pricing decision).
8. **Contact** — single conversion path (book a call / email / Upwork).
9. **Footer** — wordmark lockup, correct year, honest nav.

## Motion

Awwwards-caliber but restrained, all from the system's spec:
- Masked line reveal on the hero equation (900ms `--wz-ease`), staggered.
- Scroll reveals on section content (780ms), IntersectionObserver-driven.
- Cursor-follow work preview (lerped, pointer-fine only).
- Marquee, magnetic-feeling nav underlines, testimonial auto-rotate.
- **Progressive enhancement:** all `[data-reveal]` content is visible by default; the hidden start state only applies once JS adds an `html.js` flag, so a failed or slow script never blanks the page.
- **Full `prefers-reduced-motion` fallback** — dust/grain removed, all reveals resolved instantly, verified via reduced-motion render.

## Key content decisions vs. the old site

- **Pricing:** the old public packages ($400 / $1,500 / $3,000+) contradict the canonical [PRICING_TIMELINE_RULES.md](../../../../../sales/PRICING_TIMELINE_RULES.md) ($200/page design + $200/page dev; 5 pages = $2,000, not $1,500) and were flagged unresolved in `open-questions.md`. The redesign publishes only the **canonical per-page rate** with a worked calculator, not the stale packages. Confirm before any public launch.
- **Proof honesty:** work-row tags use only facts present in the site inventory (Mused PageSpeed 100 desktop, Ivy RX 80 posts / 160 URLs, Verde WordPress migration 30/30, industries, locations). No invented conversion percentages. The repeated/contradictory "One page website" and "Convertions increased" result bullets from the old CMS were dropped.
- **Debt fixed:** no placeholder nav text, one consistent nav/footer, single 2026 copyright, no Upwork-ToS "Terms" link, corrected copy (`portfolio`, `WordPress`, `Webflow`), single canonical "Book a call" path.

## Assets

Only **approved** brand-kit assets used (`design-tokens.json` asset list): logos, mark, favicon, noise texture, and the three 3D brand marks. Per the asset rules, **no media from the live site** and no old-site `work-covers`/hero/avatars. Testimonial avatars are rendered as monogram chips; work-hover previews use the approved 3D brand marks as honest abstract stand-ins with an explicit "fresh case covers in production" note. Fresh cover art is a follow-up.

## Deferred (per locked decisions / out of scope here)

- 3D scroll frame-sequence hero (deferred enhancement pass).
- Figma conversion (Phase 2A step 9) and Vercel review deploy (step 10) — not run in this environment; next actions.
- Webflow target undecided — package ships as portable design HTML.

## Version Control

This document follows the root-level version control rules in [SYSTEM_RULES.md](/SYSTEM_RULES.md). Commit only non-secret, repo-friendly workflow context and artifacts.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
