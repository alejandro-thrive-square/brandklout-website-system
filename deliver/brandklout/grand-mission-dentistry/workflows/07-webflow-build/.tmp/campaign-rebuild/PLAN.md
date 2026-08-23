# Grand Mission campaign pages — native client-first rebuild

**Task**: rebuild 4 pages from `docs/grand-mission-campaigns/` natively in Webflow (site
`698111847e9608eb30ee21c6`), inside the **Ads Landing Pages** folder (`6a7f60323b62b4b8c03fb499`),
client-first/Relume style, NO custom code (no HtmlEmbed, no page-settings code), reusable
classes + components, assets uploaded, responsive equal to local.

## Sources (local truth)
- `deliver/brandklout/grand-mission-dentistry/docs/grand-mission-campaigns/`
  - `dental-implants/index.html`
  - `emergency-dentistry/index.html`
  - `consult/dental-implants/index.html` (consult page — representative variant)
  - `thank-you/dental-implants/index.html`
  - `assets/styles.css` (31KB, read in full — token system at top), `assets/images/*` (15 files)
- Local behaviors in `app.js` CANNOT be ported (no custom code): multi-step form, before/after
  slider drag, reveal-on-scroll, open-now status, dataLayer. See Divergences.

## Site facts (verified 2026-08-17)
- GM site **already carries the Relume/client-first kit** — same collection IDs as Kit
  Foundation V1 (`6a7a804cfed7e6e46272c6b0`). 2735 styles total, incl. `button`,
  `container-large` (80rem), `padding-global` (5%), `padding-section-large` (7/6/4rem),
  `heading-style-h1..h6`, `text-size-*`, `form_*`, `page-wrapper`, `main-wrapper`.
- Variables (Primitives `collection-0220e3ad-eb86-03ea-3026-8a5979301dd2`):
  - navy `brand/bleu 900` = `variable-082430ef-54c6-da46-1df1-6f43416b97f8` (#002241)
  - blue `brand/bleu 700` = `variable-0d6deade-46b8-3c60-cdab-5dddc296d8eb` (#04669c)
  - sky `brand/bleu 500` = `variable-45699325-3755-4277-cdab-268a35ea5fb5` (#abd6ff)
  - brown `brand/brown 800` = `variable-34c4d170-3b4c-2b35-833b-3e8d95b4962e` (#403830)
  - warm `brand/brown 500` = `variable-2d33d461-6540-146a-5aa1-005ca2f0dd4b` (#8c6946)
  - white `relume-variable--neutral-white`; White 5..60 opacity steps exist
  - fonts: `relume-variable--font-style-heading/body` = Montserrat Variablefont Wght
  - **TO CREATE** in Primitives: `brand/navy 950` #041a34, `brand/gold 500` #c98b46,
    `brand/sand` #fdf8ee, `brand/mist` #f3f8fb, `brand/ink` #20272b, `brand/muted` #5d6c7b,
    `brand/line` #dbe5ec, `brand/danger` #a9332c
- Existing pages in Ads Landing Pages folder are the OLD converter builds (`imp-*` classes,
  native "Header" section added 08-14): dental-implants `6a724b6977f9b0019d2a03f8`,
  cosmetic `6a723ad5534774f35f17d119`, dental-implants-consultation `6a7f297530c987406bc2100d`,
  cosmetic-consultation `6a7f28ebb879883a87ba3fc8`, dental-implants-thank-you
  `6a7a539d70073de244bf67a9`, cosmetic-thank-you `6a7268a862a728c1cd4df73b`. DO NOT EDIT.

## Page plan (create in folder, non-draft, publish to webflow.io staging only)
| local source | new slug (temp) | final slug after approval/swap |
| :--- | :--- | :--- |
| dental-implants/ | `new-dental-implants` | `dental-implants` (swap with old) |
| emergency-dentistry/ | `emergency-dentistry` | (final immediately — no collision) |
| consult/dental-implants/ | `new-dental-implants-consultation` | `dental-implants-consultation` |
| thank-you/dental-implants/ | `new-dental-implants-thank-you` | `dental-implants-thank-you` |

Slug swap of old pages is END-STATE work, only after visual verification; report first.

## Class architecture (client-first, campaign-scoped to avoid the 2735-style swamp)
Reuse site globals ONLY where values already match (page-wrapper, main-wrapper, hide-*,
text-align-center …); the campaign look is its own system, so create:
- **Utilities**: `container-campaign` (max-w 73.75rem, 100%, mx auto),
  `padding-global` reuse (5% ≈ close enough at 1440? NO — design is fixed 20px gutters;
  create `padding-campaign` p-l/r 1.25rem), `padding-section-campaign`
  (main 7.2rem, medium 4.95rem, small 4.6rem, tiny 4.6rem — resolved from
  clamp(4.75rem,8vw,8.5rem)), section bg combos: `is-navy`, `is-blue`, `is-sand`, `is-mist`.
- **Type**: `campaign-h1` (main 4.55rem→ clamp(2.45,5vw,4.9) @1440=4.5rem; medium 3.44rem;
  small 2.75rem via 11vw floor 2.3; tiny 2.3rem), `campaign-h2` (@1440 3.15rem; medium 2.42rem;
  small 2.1rem; tiny 1.85rem), letter-spacing -0.035em, lh 1.12, color navy;
  `campaign-eyebrow` (+ `is-light`), `campaign-lead`, `text-campaign-muted`.
- **Buttons**: `campaign-button` + combos `is-gold` `is-navy` `is-light` `is-outline-light`
  `is-small` `is-full`; `campaign-button-row`.
- **Components (Webflow Components, group "Campaign")**: `Campaign Announcement`,
  `Campaign Header`, `Campaign Footer`, `Campaign Mobile Bar` — with text/link props per
  house rule. Everything else = per-page elements with `campaign-<section>_<element>` classes:
  hero, proof-strip, offer, story, benefits, results (before/after static), journey, provider,
  video (Lightbox), reviews, faq (native Dropdown), closing-cta, consult-hero, consult-form
  (native Form, single-step — see Divergences), thank-hero, visit, next-steps.

## Divergences from local (forced by "no custom code")
1. Consult form is single-step native Webflow form (local: 2-step JS with progress bar);
   submit → Webflow native + redirect to matching thank-you page.
2. Before/after slider renders at static 50% split (no drag).
3. No reveal-on-scroll animation; content always visible (could later be Designer IX2).
4. Open-now pill shows static hours text, no live open/closed logic.
5. Thank-you first-name personalisation (URL param) not possible → generic headline.
6. No dataLayer events (tracking snippets are a launch-time task anyway, per README).

## Asset upload
DONE — 32 assets (15 images + 16 icon SVGs + 2 YouTube posters), IDs in `asset-map.json`.
S3 upload requires mapping Webflow's camelCased uploadDetails keys back to canonical AWS
field names (`xAmzAlgorithm` → `X-Amz-Algorithm`, `contentType` → `Content-Type`,
`successActionStatus` → `success_action_status`, `cacheControl` → `cache-control`).

## Verify
- `live_shots.mjs <staging-url> <out> [n] [width]` at 1440 + 390 vs local render;
  local preview via `python -m http.server` in docs/grand-mission-campaigns/.
- Webflow staging publish via publish_site publishToWebflowSubdomain only.

## Progress log
- 2026-08-17: ALL FOUR PAGES BUILT, VERIFIED ON STAGING, CHROME COMPONENTIZED.
  - 218 `campaign-*` styles created (styles-def.mjs + create-styles.mjs, resumable via
    styles-created.json). 8 brand tokens added to Primitives (IDs above in Site facts).
  - Pages built by build-{implants,emergency,consult,thankyou}.mjs → section roots in
    *-built.json. Post-passes: fix-texts.mjs (TextBlock copy via set_settings key "text"),
    eager-images.mjs, repair-structure.mjs (implants only).
  - Consult form: native Webflow Form, single-step, radios group "concern", redirect to
    the thank-you page; selects became free-text inputs (options not settable via API);
    placeholders not settable either ("Example Text" default remains — Designer polish).
  - Components "Campaign Announcement/Header/Footer/Mobile Bar" (group Campaign) with
    props: Offer Text/Note, CTA Label, CTA Link, Show CTA (header). Instances swapped in
    on emergency/consult/thankyou with per-page prop values (swap-chrome.mjs).
  - Verified: shots/final-*-{1440,390}.png vs local (shots/local-*); zero placeholder
    strings on any published page; document width = viewport at 390.

## GOTCHAS (hard-won, do not re-derive)
1. **set_style DROPS THE WHOLE LIST silently when two unrelated GLOBAL classes are
   stacked** (`['campaign-container','campaign-hero_grid']` → element ends up classless).
   Only `[base, its-combo, ...]` chains apply, and every exact chain must exist as a
   style record (3-deep combos like `.campaign-button.is-white.is-small` must be created
   explicitly with parent_style_names). Fix pattern: merge container props into the
   layout class (single class per element) — see repair-structure.mjs.
2. **element_builder set_text works on Heading/Paragraph but SILENTLY NO-OPS on
   TextBlock** (Block+String). Write copy after build via data_element_settings_tool
   set_settings key "text" (fix-texts.mjs zips schema order vs live depth-first order).
3. Style API accepts modern CSS verbatim: aspect-ratio, backdrop-filter, layered
   radial+linear background-image, box-shadow, letter-spacing em. `-webkit-font-smoothing`
   is REJECTED (create_style "internal error" — and the whole create fails).
4. Form limits via MCP: FormSelect options and input placeholder are NOT settable
   (placeholder is also a "reserved attribute"); success/error message text must be set
   on the inner Block, not the String. Radio: keys groupName/value/required. Button text
   key: buttonText. Form redirect/name: keys on the FormForm element.
5. transform_element_to_component degrades page-mode links to "#" (phone/url links
   survive). Bind link props (key "link") or rewrite after transforming.
6. FAQ accordion = DOM details/summary elements (no custom code needed);
   `list-style:none` on the summary hides the marker; first item gets attribute open.
7. Images: eager loading only via set_attributes loading=eager (no settings key).
   Element writes 429 after ~25 rapid calls — batch ≤10 and back off 65s.

## Open items (decisions / later)
- Slug swap old→new (needs approval; old pages untouched): dental-implants,
  dental-implants-consultation, dental-implants-thank-you. emergency-dentistry is final.
- exterior.webp in the source package is a personal hiking photo labelled "exterior" —
  reproduced faithfully on thank-you; flag to Brandklout/user.
- Divergences (no-custom-code): single-step form (no 2-step progress), static 50%
  before/after, no reveal animations, static hours text, no dataLayer, video links to
  YouTube instead of inline lightbox, no URL-param first-name personalisation.
- Per-campaign consult/thank-you variants (new-patients, full-mouth, veneers, emergency)
  can be page-duplicated + copy-edited now that everything is class/component driven.
- Publishing was webflow.io staging only; production publish untouched.
