# Clifton Exteriors — Redesign-Flow Gap Analysis & Conclusions

Date: 2026-07-10. Inputs: `spike-results.md`, `component-catalog.md`, `oldsite-section-inventory.md`, `staging-section-inventory.md` (all in this folder).

## 1. Executive summary

- **Spike: FULL PASS.** Every step of the proposed flow (componentize → props → bind → insert instance on any page → per-instance overrides) works headlessly via the Data API MCP. The redistribute + content-update phases are fully automatable. See `spike-results.md`.
- **The component system already exists.** 47 components / 501 placed instances; Page Header ×19, CTA Band ×17, Reviews ×17, Footer ×23. The teammate's build IS the "paste once, redistribute components" model.
- **Therefore the real gap is not "sections to paste" — it's mostly configuration.** Of the old site's 24 unique section types, ~19 already have a component. The dominant remaining work is: prop passes on 19 prop-less components, filling placeholder props on 16 pages ("This is your headline"), swapping windows leftovers on the 4 service clones, rolling the mega-nav out to 14 pages, and importing old-site images as assets.
- **Genuinely missing sections to design + paste: 5 (+3 minor variants).** Small enough for ONE single-root paste onto the Components page.

## 2. Old-site type → staging component coverage matrix

| Old-site section type (instances) | Staging component | Status |
|---|---|---|
| hero-inner ×14 / hero-home | Section / Page Header (props ✓) / Section / Hero | ✅ exists — needs per-page prop values |
| financing-badges-band ×11 | Section / Financing Banner + Logo Strip | ✅ global, real content |
| service-split ×13 + mirror ×8 | Section / Feature Split (variants Images Left/Right ✓) | ✅ exists — needs instances + content |
| icon-benefits-3up ×8 | Section / Trust Bar / USP / Services Confidence | ✅ real content |
| icon-list-upgrades ×5 | Section / Windows Upgrades (props ✓) | ⚠️ windows-specific; generalize (item count varies 4–5) |
| gallery-grid ×10 | Section / Gallery / Services Portfolio | ⚠️ exists, but all placeholder images |
| pricing-tables-3up ×10 | Section / Pricing Cards / Services Pricing | ⚠️ exists; only windows data, ×5 duplicated on /pricing |
| process-teaser ×7 | Section / Process Steps (4-step) | ✅ real content |
| faq-accordion ×6 | Section / FAQ / Services FAQ | ⚠️ exists; only 3 window FAQs everywhere (counts vary 2–6 → CMS candidate, FAQs collection already exists) |
| reviews-widget ×16 | Section / Reviews (12 real cards) | ✅ real content |
| form-contact ×6 | Section / Contact / Services Contact | ✅ real form |
| cta-band ×16 | Section / CTA Band (props ✓, lorem defaults) | ✅ exists — needs per-page prop values |
| service-cards-5up | Home services carousels / Services Grid | ✅ built on home |
| blog-cards | Section / Blog List (CMS, 3 posts) | ⚠️ old site has 6 posts + thumbnails |
| video-embed-grid | Section / Video Grid | ⚠️ 3 empty boxes, no embeds |
| locations-* group | service-locations page (17-location grid, real) | ⚠️ partial; JS search/map + 18 city landing pages = scope decision |
| contact-details-map | direct-contact block on /contact-us | ⚠️ verify map embed |

## 3. MISSING sections — design, then ONE single-root paste

| # | Section | For page | Notes |
|---|---|---|---|
| M1 | `process-steps-detailed` — 10-step vertical numbered steps ("A Brand New Home In 10 Simple Steps") | /our-process | Staging only has the 4-step teaser |
| M2 | `insurance-claims-steps` — 9 numbered steps | /insurance-claims | Can be same component as M1 with count handled via extra-step visibility bools, or two variants |
| M3 | `form-insurance` — 24-field claim form (radio preferred-contact) | /insurance-claims | Variant of quote form |
| M4 | `form-employment` — job application form | /employment | Staging wrongly reuses quote form |
| M5 | `financing-partners` — partner logo + terms + external Apply Now (SVC Financial / GreenSky) | /financing | Old page copy is lorem-ridden → needs drafted copy (decision) |
| m6 | `hero-thankyou` variant — logo + blockquote + Google/Facebook review buttons | /testimonials | Could be a Page Header variant |
| m7 | `cta-band-dual` variant — 2 buttons (quote + call) | /service-locations | CTA Band variant, not a new section |
| m8 | `contact-details-map` — icon list + map embed | /contact-us, /employment | Only if missing after verify |

All should ship inside one single-root wrapper (per `feedback_new_page_single_paste_awwwards`), pasted onto the **Components page** (`/untitled`), then componentized + prop'd headlessly.

## 4. Non-paste work (headless MCP, no design needed)

1. **Props pass** — add + bind props on the prop-less, non-global section components that need per-page content: Gallery, Pricing Cards, FAQ, Video Grid, Rich Text (Trust Bar / Process Steps / Reviews / Logo Strip / Financing Banner are same-everywhere → skip per feedback rule "globals excepted").
2. **Defaults pass** — replace lorem defaults ("This is a heading", "This is your headline") with sensible real defaults.
3. **Redistribution + overrides** — per old-site structure map, ensure each page has the right instance sequence, then `set_component_instance_prop_values` per page (16 pages currently show placeholder hero/CTA).
4. **De-windows the service clones** — doors/roofing/siding/gutters: gallery heading/images, pricing values, FAQs (old site has real per-service content to port).
5. **Nav rollout** — replace old `navbar_` instances with the mega-nav component on 14 pages.
6. **Asset import** — old-site gallery/portfolio images → Webflow assets (S3 flow) → image props/instances.
7. **CMS** — FAQs per service via existing FAQs collection (solves count variance); blog posts import (6 posts + thumbnails); optionally 18 service-location city pages via existing Service Locations collection.

## 5. Risks confirmed / adjusted

- ✅ Redistribute + override: automatable (spike).
- ⚠️ Structural variance (FAQ 2–6 items, upgrades 4–5 items, gallery 6–9 images): solve with CMS (FAQs), or max-count + visibility-bool props, or per-service one-off components (teammate already chose one-offs for windows).
- ⚠️ Collection List subtrees still can't be componentized — keep CMS sections out of components.
- ⚠️ richText props can't bind to plain text settings — long multi-paragraph copy stays per-instance via `set_text` on the element, or as separate paragraphs.
- ⚠️ Published staging may lag Designer (windows/doors/roofing edited 2026-07-09) — re-verify the 4 service clones in Designer before patching.

## 6. Decisions needed (Alejandro)

1. **Financing + employment copy** — old pages are lorem/broken; 1:1 impossible. Draft new copy, or get client copy?
2. **Service-locations cluster** — rebuild JS search/map + 18 city landing pages (programmatic SEO), or keep the simpler 17-location grid?
3. **Roofing "10 Year" vs "Lifetime" warranty** — old-site inconsistency; which is correct?
4. **Delete `/zz-spike-test`** draft page in Designer (API can't delete pages), or keep as sandbox.

## 7. Proposed execution order

1. Alejandro decisions (§6) → 2. Design M1–M5 (+minor variants) → one single-root paste on Components page → 3. Componentize + props (headless) → 4. Props/defaults pass on existing components → 5. Asset import → 6. Redistribution + per-page overrides, page by page (service pages first: doors, roofing, siding, gutters) → 7. Nav rollout → 8. CMS (FAQs, blog) → 9. QA sweep + staging publish (with confirmation).

## Version Control

Lightweight analysis artifact for `07-webflow-build`; follows root-level rules in [SYSTEM_RULES.md](../../../../../../../SYSTEM_RULES.md). No secrets, no binaries.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
