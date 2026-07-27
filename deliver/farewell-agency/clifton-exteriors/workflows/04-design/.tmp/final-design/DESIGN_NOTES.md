# Clifton Exteriors — Section Designs: Reviews (improved) + Final CTA (new) + Windows page (rebuild)

**Date**: 2026-07-06 (converted to pasteable payloads same day); windows page added 2026-07-07
**Inputs**: [staging-analysis.md](../staging-analysis.md) (teammate's Webflow build conventions), [oldsite-content.md](../oldsite-content.md) (1:1 content reference), [windows-page-content.md](../windows-page-content.md) (verbatim /windows/ content).

## Files

| File | What it is |
|:---|:---|
| `section-reviews.html` | Improved reviews section — replaces the current one-at-a-time GSAP slider |
| `section-cta-quote.html` | NEW final CTA band ("Add To The Curb Appeal Of Your Home") — the old site's closing CTA, missing from the staging build |
| `page-windows.html` | FULL /windows page rebuild — content/structure 1:1 from cliftonexteriors.com/windows/, redesigned in the staging homepage system (see §Windows page below) |
| `_preview-base.css` | **Preview-only scaffold** (body font/background + tokens). Never pasted; not a converter input. |

Open either HTML file in a browser to review.

**Pasteable payloads (generated, QA-passed)**:
`../../07-webflow-build/.tmp/section-reviews/paste_01_section_reviews-v2.html`
`../../07-webflow-build/.tmp/section-cta-quote/paste_01_section_cta-quote.html`

## Packaging (per the directive rule in 07-webflow-build.md)

Each section root ends with **two HtmlEmbeds** (authored as `<style data-embed>`
/ `<script data-embed>`; the converter ships them in-place):
1. **CSS embed** — runtime-only rules: JS-applied reveal states, ancestor-hover
   button roll-up chains, `mask-image`, `line-clamp`, reduced-motion guards.
2. **JS embed** — the section's full script: IIFE, double-init guarded,
   `prefers-reduced-motion` aware, zero dependencies (no GSAP).

**All static styling is baked into native, Designer-editable Webflow classes**
(class styles travel with in-Designer copy/paste anyway). Result: either
section works on **any page with zero Page-Settings changes** — the converter
emitted **no `webflow-custom-code.js` and no runtime-states head CSS** for
these sections.

## Class-system decisions

- **Naming follows the build's idiom** (staging-analysis §2): `section_x`
  roots, BEM `__` sub-components (`reviews-wall__*`, `review-card__*`,
  `cta-quote__*`), `is--` modifiers, dark-band recipe (navy `#121c32`,
  1rem radius, gradient scrims), no box-shadows.
- **The payload deliberately reuses NONE of the teammate's class names**
  (no `u-section`, `u-heading`, `button_primary`…). Clipboard payloads carry
  concrete values while the project's classes use Designer variable bindings —
  same-name paste would fork `-2` copies and pollute the project (Horizon
  precedent: rename for foreign builds). Buttons are a visually identical
  bespoke clone (`cx-btn` family), byte-identical across both payloads
  (verified: clean merge, 0 cross-payload collisions).
- Optional post-paste polish in the Designer: swap `cx-btn` links for the
  native `button_primary` component to regain variable bindings + its IX
  hover (the embed CSS hover is scoped per section and won't conflict).

## Reviews section — what was improved (vs staging §5.2 weaknesses)

| Weakness in current build | Fix |
|:---|:---|
| 1 review at a time out of 69 (no proof density) | 12-review wall, 3 auto-scrolling marquee columns (up/down/up, different speeds), pause on hover/focus |
| Empty left third (33% column with 2 arrows) | No arrows; full-width wall |
| Flat, card-less, melts into page | Cards: `#faf9f7` surface, `.5px #d6d6d6` border, 1rem radius (site's no-shadow depth language) |
| `min-height: 40vh` layout bounce | Fixed-height masked wall (42/38/32rem by breakpoint), gradient fade top/bottom — zero layout shift |
| Hard-coded stars, no Google attribution | Aggregate badge: Google "G" + **5.0** + stars + "Based on 55 Google reviews" |
| Static "1 / 5" counter, frozen dates | No counter; dates dropped ("Google review" source line instead) |
| `<h1>` heading + 69 `<h3>` review bodies | Proper `<h2>`; reviews are `<figure>/<blockquote>` |
| Brittle Google-search "Read all reviews" URL | Stable `search.google.com/local/reviews?placeid=ChIJQ6AF4YZFtokRkW4KDIt1r_M` + a write-review link |

Content: 12 verbatim 5-star Google reviews curated from the old site's 45
(mix of services and lengths). Long reviews clamp at 6 lines. Avatars are
initials on brand navy (Google profile photos can't be hotlinked reliably).
Each 5-star row is a single SVG (one embed per card, not five).

## CTA section — content 1:1 from the old site

- H2: "Add To The **Curb Appeal** Of Your Home" (Erode italic accent)
- Support line: the old site's price-match guarantee
- Primary "Get A Quote" → `/contact-us`; glass secondary "Call (571) 249-1480" → `tel:`
- White-star rating badge "5/5 from over 75 reviews"
- **No background video** (the build's `section_cta` hotlinks its video from
  the old WordPress host — fragile); depth via the gradient-scrim language
- Reveal: JS-applied staggered fade-up — content is never CSS-hidden

## Windows page (added 2026-07-07)

**Task**: rebuild `cliftonexteriors.com/windows/` — content + structure 1:1,
design per the staging homepage system. Source `page-windows.html`; payload in
`../../07-webflow-build/.tmp/page-windows/paste_01_page_windows.html` —
**ONE whole-page paste** (all sections wrapped in the single `.page_windows`
root; multi-root merges crash the Designer — Giovanni precedent). QA-passed
with `--against` section-reviews + section-cta-quote: **0 collisions** —
`cx-btn` defs merge cleanly.

**Standard (2026-07-07, per Alejandro)**: new-from-scratch pages always ship as
one single-root paste, and 2-3 sections get awwwards-style motion. Here:
- **Hero**: masked word-by-word roll-up on the display H2 (JS-split spans,
  SplitText-style, `.win-hero__w-mask/.win-hero__w`) + slow 9s Ken-Burns zoom
  on the bg photo.
- **Portfolio**: replaced the static 3×3 grid with a **draggable
  dual-direction marquee** (2 rows drifting opposite ways, rAF-driven,
  pause on hover, pointer drag, IO-gated to the viewport) — same language as
  the home page's portfolio marquee. Reduced-motion → static scrollable rows.
- **Process band**: oversized scrolling type backdrop ("A Hassle Free Process
  — Get A Quote —", 10rem, 5% opacity, CSS keyframes −50% loop, two
  identical halves for a seamless wrap).

**Sections** (roots `section_win-*`, in paste order): hero (dark band, bg photo
+ scrim, rating pill, H1-as-eyebrow + display H2, trust-badge chips) →
financing (warm `#eae1d5` panel, split) → invite (split feature, image right)
→ upgrades (4 icon cards) → curb (split feature, image left) → portfolio
(draggable 2-row marquee of the old page's 9 gallery photos, hover zoom) → confidence (dark
panel: "Feel Confident" header + 3 credential cards) → pricing (3 tier cards,
Deluxe featured dark) → process (dark CTA band) → FAQ (6-item accordion,
`div role="button"` triggers — native `<button>` falls back to HtmlEmbed in the
converter and loses its class styles) → **[reviews: paste the existing
`section_reviews-v2` payload here]** → contact (heading/copy 1:1 + interim
"Get Your Quote" button) → sunshine closing (warm panel + service-area line).

**Decisions / deviations from the live page**:
- Hero H1 typo "Virgina" on the live site → corrected to "Virginia"; the curb
  paragraph's missing space ("façade.High-quality") → split into two paragraphs.
- Eyebrow labels (Financing Available / Our Work / FAQ …) are additive design
  elements per the home page's eyebrow+heading idiom; all body copy is verbatim.
- **Images hotlink the old WordPress host** (same fragility caveat as the
  build's CTA video) — re-upload to Webflow assets and relink post-paste.
  Hero bg uses `DL_Resizer1.webp`, invite visual `DL_Resizer5.webp` (not in the
  old gallery); swap in the Designer if unsuitable.
- **Contact form is NOT in the payload** (converter has no native-form
  mapping): paste keeps heading + copy + an interim button linking `/contact-us`;
  add the site's native quote-form component in the Designer, then delete the
  interim button.
- Reveal pattern per section: JS-applied `.win-pre`/`.win-in` (content never
  CSS-hidden), IO-gated, reduced-motion aware — same model as the CTA section.

**Regenerate**:
```bash
cd deliver/farewell-agency/clifton-exteriors/workflows/07-webflow-build
python html_to_webflow.py --html "../04-design/.tmp/final-design/page-windows.html" \
  --split .tmp/page-windows --avoid .tmp/section-reviews,.tmp/section-cta-quote
python wf_tools.py qa .tmp/page-windows --against .tmp/section-reviews,.tmp/section-cta-quote
```

**Paste**: create the Windows page in the Designer (nav + footer are site-wide
components), paste `paste_01_page_windows.html` ONCE onto the page body, then
paste the existing reviews payload (`section-reviews/paste_01_section_reviews-v2.html`)
and drag it between the FAQ and contact sections inside the `.page_windows`
root. Same procedure/gotchas as below (throwaway-page first, no `-2` classes,
verify on a focused tab — the marquees and word reveal freeze on background
tabs).

## Paste procedure (Claude-in-Chrome or Kernel; see 07 directive)

1. Open each `paste_01_*.html` copy page in the logged-in Chrome, click Copy.
2. **First paste onto a throwaway test page** in the Designer; confirm in the
   Style panel that no `-2` classes appeared, embeds render, layout is right.
3. Homepage: paste `section_reviews-v2` after the existing `section_reviews`,
   verify side by side, then delete the old slider section. Paste
   `section_cta-quote` between the reviews section and the footer.
4. No Page-Settings or Site-Settings changes needed for either section.
5. Publish to staging → verify on a **focused** tab (background tabs freeze
   IntersectionObserver/rAF: marquee + reveal will look broken otherwise).
6. Regenerate anytime with:
   ```bash
   cd deliver/farewell-agency/clifton-exteriors/workflows/07-webflow-build
   python html_to_webflow.py --html "../04-design/.tmp/final-design/section-reviews.html"  --split .tmp/section-reviews
   python html_to_webflow.py --html "../04-design/.tmp/final-design/section-cta-quote.html" --split .tmp/section-cta-quote
   python wf_tools.py qa .tmp/section-reviews
   python wf_tools.py qa .tmp/section-cta-quote --against .tmp/section-reviews
   ```

## Doors + Roofing pages (added 2026-07-08)

**Task**: rebuild `cliftonexteriors.com/doors/` and `/roofing/` — same model as
the windows page (content 1:1, one single-root paste each, awwwards motion), plus
the new **component-reuse rule**: sections that structurally match the existing
`Section / Windows *` components are pasted only as placeholders and then replaced
with component instances via MCP (props re-set per page).

- Sources: `page-doors.html`, `page-roofing.html` — shared classes byte-identical
  to `page-windows.html` (QA: 0 cross-page collisions vs windows/reviews/CTA).
  New classes only: `page_doors`, `page_roofing`, `win-hero__sub` (roofing hero
  support lines), `win-invite__copy-3` (3-paragraph feature splits),
  `win-upg__grid.is--five` (doors' five upgrades).
- Payloads + per-page component-replacement manifests + full runbook:
  `../../07-webflow-build/.tmp/DOORS-ROOFING-RUNBOOK.md` (single source of truth
  for the paste + MCP pass; content deviations logged there).
- Component-reuse split (why a section stays pasted): hero H2 isn't a prop;
  feature-1 splits have 3 paragraphs vs 2 props; doors upgrades = 5 cards vs 4
  props; roofing pricing = 3 bullets/tier vs 2 props; FAQ items are static in the
  component; closing heading is static. Everything else → component instance.
- All prop images are Webflow assets (8 new uploads 2026-07-08; ids in manifests).
- Discovery: the windows page on Webflow is fully componentized
  (`page-wrapper > main-wrapper > Section / Windows * instances`) and **never got
  the reviews wall** — the runbook's step 4 fixes reviews on all three pages
  (paste once → `Section / Reviews Wall` component → insert instances).

## Version Control
- Follows [SYSTEM_RULES.md - Section 4](../../../../../../SYSTEM_RULES.md); lightweight `.tmp/` artifacts committed for continuity.

## Net-new sections batch (2026-07-10, Phase B of redesign flow)

`sections-new.html` — 7 sections in ONE single-root paste (`.nx-batch` wrapper; removed after componentization). Payload: `../../07-webflow-build/.tmp/sections-new/paste_01_sections_new.html` (377 nodes / 77 styles, QA ALL PASS vs windows/doors/roofing/reviews/cta payloads).

| Root class | Section | Destination page(s) |
|:---|:---|:---|
| `section_steps` | 10-step numbered process timeline (sticky intro, scroll-progress line, Erode numerals) | /our-process (+9-step insurance duplicate in Phase C) |
| `section_form-panel` | Dark form shell — native Webflow form built headlessly into `.form-panel__slot` in Phase C | /insurance-claims, /employment |
| `section_fin-partners` | Financing benefits trio + SVC/GreenSky partner cards | /financing |
| `section_media-grid` | 2×2 click-to-load YouTube grid (thumbs set by JS — nothing dropped on paste) | /media |
| `section_thankyou` | Thank-you hero (logo, blockquote, Google/Facebook review buttons) | /testimonials |
| `section_contact-direct` | Contact rows + lazy Google Map (iframe built by JS) | /contact-us, /employment |
| `section_badge-wall` | 13-tile cert-logo marquee (img srcs empty; assets bound in Phase C) | /about-us |

Conventions: same packaging (per-section `<style data-embed>`/`<script data-embed>`), cx-btn byte-identical, `nx-*` shared editorial atoms. Converter gotchas learned: do NOT reuse a combo modifier (`is--light`) with different defs on different bases — one def wins and the rest spill into element-named classes (`div`, `p`); no structural pseudos (`:last-child`) — use explicit `is--last`.

Content: 1:1 old site except GreenSky card body (old was lorem — DRAFTED, marked in markup, client to approve) and the "hassel" typo fixed. Old-site FA step icons replaced by numerals by design.

## Portfolio page handoff (2026-07-10)

`page-portfolio.html` is complete and has been converted to a single-root Webflow clipboard payload:

`../../07-webflow-build/.tmp/page-portfolio/paste_01_page_portfolio.html`

- Converter result: 303 nodes in one `.page_portfolio` root.
- Gallery coverage: Windows 15 images, Doors 12, Roofing 8, Siding 18, Gutters 11 (64 project images total). Every image has an `alt` attribute.
- The page also carries the hero image and five trust-badge images, for 71 image references total. All currently point to the old WordPress asset host and must be uploaded/rebound in Webflow before the page is considered production-ready.
- Collision avoidance renamed `win-port__marquee` to `win-port__marquee-page-portfolio`; behavior is unaffected because the scripts bind through `data-win-port`, `data-port-row`, and `data-port-track` hooks rather than that class name.
- `wf_tools.py qa` passed all checks against the existing windows, doors, roofing, reviews, CTA, and net-new-section payloads: zero cross-page collisions and zero missing JS hooks.
- Reviews remain intentionally separate. Insert the existing Reviews Wall component between the Gutters gallery and the closing Sunshine section when assembling the page in Webflow.

## Section-by-section paste packages (2026-07-10)

All 20 local routes now have independently pasteable Webflow section payloads under:

`../../07-webflow-build/.tmp/section-components/<page>/`

- Total: **138 section payloads across 20 pages**.
- Each `paste_XX_<section>.html` contains one section root and must be installed in numeric order from the page folder.
- Canonical inventory and node counts: `../../07-webflow-build/.tmp/section-components/manifest.json`.
- All page folders passed `wf_tools.py qa` against the existing Reviews, CTA, net-new-section packages, and every previously generated page folder: zero cross-file style conflicts, zero missing JS hooks, and zero unsafe root-overflow/sticky combinations.
- Form controls that the clipboard converter cannot represent natively remain targeted HtmlEmbeds. Rebuild Contact, Employment, and Insurance forms as native Webflow forms during the installation/componentization pass.
- Sticky fix: `.section_form-panel` no longer clips overflow because that disabled its sticky text column. The decorative `.form-panel__glow` now inherits the section radius instead, preserving the rounded visual boundary without creating a sticky-breaking overflow ancestor.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
