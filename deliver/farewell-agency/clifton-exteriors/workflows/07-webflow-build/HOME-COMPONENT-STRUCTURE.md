# Clifton Exteriors — Home Page Component Structure (Webflow MCP Analysis)

Analyzed 2026-07-12 via the Webflow MCP Data API (headless — no Designer bridge needed). Updated same day with the in-depth nested-component model (§6) after it surfaced a live content bug on the gutters page.

- **Site**: Clifton Exteriors + LUTUM — `site_id: 6a234fcd5732d1f0a674156f`
- **Home page**: `page_id: 6a234fd15732d1f0a67415b2` (slug: root `/`)
- **Component library size**: 60 components site-wide
- Related: [.tmp/redesign-flow/component-catalog.md](./.tmp/redesign-flow/component-catalog.md) (full-site catalog from the redesign spike)
- **SOP**: the generalized, repeatable procedure distilled from this analysis lives in [SOP-COMPONENT-AUDIT.md](./SOP-COMPONENT-AUDIT.md) — use that when analyzing/auditing any component-built page; this file is its worked example.

## 1. Page-Level Tree

The home page is **fully componentized** — the only raw elements on the page are two wrapper divs. Every visible section is a component instance:

```
Body
└── Block .page-wrapper (div)
    ├── ⚙️ Global Styles                (ab488b17-…57e5)  [global embed]
    ├── 🧭 Navigation                   (e620f609-…ad9f)
    ├── Block .main-wrapper (main tag)
    │   ├── Section / Hero              (6a22b732-…cfa8)
    │   ├── Section / Services Grid     (1fc9a110-…8f36)
    │   ├── Section / Feature Split     (f00ec35a-…8528)  → "Insurance Claims Made Easy"
    │   ├── Section / USP               (00572739-…5829)  → "Feel Confident Working With Us"
    │   ├── Section / Portfolio         (d75459a2-…7ad1)
    │   ├── Section / About             (50fdc341-…38fd)
    │   ├── Section / Reviews           (e6d5df1a-…daa0)
    │   └── Section / CTA Band          (61069678-…4a66)  → "A Hassle Free Process"
    └── 🦶 Footer                       (61c0bd5f-…2921)
```

8 section components + 3 global components (Navigation, Footer, Global Styles). No loose sections.

## 2. Section-by-Section Detail

### Section / Hero — `6a22b732-2e2f-25aa-31b5-f388cd6ccfa8`
- 1 instance site-wide (home-only). 10 props: 3 variant, 3 textContent, 2 richText, 2 link.
- Props on home: Review Badge (star color + "5/5 from over 75 reviews"), Eyebrow (h1) "Windows, Roofing, Siding, Doors & Gutters In Northern Virginia", Main Heading (h2) "Transform your house…", two buttons (01 "Get Quote" → Contact Us page, 02 "Learn About Insurance Claims" → also linked to Contact Us page — **possible link miss, likely intended for Insurance Claims page**).
- Internal shell: `section.u-section.section_hero` → `.hero_video` (background `<video autoplay loop muted playsinline>` DOM element + `.home-hero_bg`) + Grid `.hero_container` → `.hero_left`.
- SEO note: eyebrow is the h1, main visual heading is the h2.

### Section / Services Grid — `1fc9a110-97d4-c133-8c63-8bc5dd558f36`
- 3 instances site-wide. The **heaviest prop surface in the library: 37 props** — 25 image props (5 images × 5 service cards), 8 richText, 1 textContent, 1 link, 2 variant.
- Cards: Windows, Doors, Roofing, Siding, Gutters — each card gets "Heading Text" + Image 1–5 (image props are asset IDs).
- Internal shell: `section.u-section.section_services` → Grid `.services_wrap` → `.services_sticky` (pinned intro column) + `.services_scroll` (scrolling card stack). Nests `Card / Services` (15 instances site-wide).
- Gotcha: the five per-card "Heading Text" props all share the same display name — disambiguate by propId when patching.

### Section / Feature Split — `f00ec35a-8a64-733b-d5ea-c74640188528`
- 7 instances site-wide — the workhorse content block. Only component on the home page with real variants: **Images Left / Images Right**.
- 9 props: heading content/style, richText content, 2 images, button link/text, 2 variant selectors.
- Home usage: "Insurance Claims Made Easy" → button "Learn More" → Insurance Claims page.
- Internal shell: `section.u-section.section_feature` → Grid `.feature_wrap` → `.feature_visual-wrap` + `.feature_text-wrap`.

### Section / USP — `00572739-b8a2-c690-86d7-7e90941b5829`
- 1 instance (home-only). 15 props (9 richText — heading, paragraph, 3 card titles + 3 card blurbs, badge text; 2 images; eyebrow star color; button style/link/text).
- Home usage: "Feel Confident Working With Us" + 3 cards (Lifetime Craftsmanship Warranty / 25+ Years Of Experience / Award-Winning), button → Our Process.
- Internal: `section.u-section.section_usp` → `.usp_component` → nests **Row / Heading for Section** + **Spacer - Rows** + Grid `.usp_list`.
- This is the clearest example of the **prop-forwarding pattern** (see §4): all header props are forwarded into the nested Row / Heading for Section via `sourceType: "prop"` bindings.
- Typo in prop name: "Card 02 Blrub".

### Section / Portfolio — `d75459a2-9920-1120-3920-24f3e56f7ad1`
- 1 instance (home-only). **Component name has a trailing space: `"Section / Portfolio "`** — matters for name-based lookups.
- 7 props (eyebrow, heading content/style, paragraph, button variant/link/text). Button → Portfolio page.
- Internal: `section.u-section.section_portfolio` → `.padding-global` header block + Spacer + `.portfolio_marquee` → `.draggable-marquee` with data attributes: `data-draggable-marquee-init`, `data-duration="20"`, `data-multiplier="35"`, `data-sensitivity="0.01"`, `data-direction="left"` (JS-driven draggable marquee).

### Section / About — `50fdc341-700c-73c3-187d-631b46da38fd`
- 1 instance (home-only). 9 props (heading style/content, richText content, button link/text, icon image + icon content "Rated Neighborhood Fave on NextDoor 4 years in a row", Image 2, 2 variants). Button → About Us page.
- Internal shell is **identical to Feature Split** (`section_feature` → `feature_wrap` → visual/text wraps) — it's a specialized fork of the same layout, not a variant of Feature Split.

### Section / Reviews — `e6d5df1a-1e49-e8e2-5e1c-7cc2aed9daa0`
- **19 instances site-wide** — the most-reused section in the library.
- Only 1 prop ("Heading Content", richText) and on home it still holds the default **"This is a heading"** — the visible header actually comes from the nested Google Review Badge, so the prop appears unused/vestigial on this page.
- Internal: `section.u-section.section_reviews` →
  - `.reviews-wall__header` → **Google Review Badge** instance ("5.0" / "Based on 55 Google reviews") + `.reviews-wall__badge-count`
  - `.reviews-wall__mask` (`data-wall-mask`) → `.reviews-wall__cols` (the review card wall)
  - `.reviews-wall__actions` → two hard-coded Google links (read reviews + write a review, both keyed to `placeid=ChIJQ6AF4YZFtokRkW4KDIt1r_M`)
  - 2 HtmlEmbeds (wall JS; second one carries `.hide`)
- Note the BEM-style `reviews-wall__*` classes — a different naming convention from the rest of the site (see §5).

### Section / CTA Band — `61069678-b55c-0d49-2ef4-5b94fbcd4a66`
- 15 instances site-wide — the standard page closer. 7 props (badge text, heading, paragraph text + **Paragraph Visibility boolean**, button style/link/text).
- Home usage: "A Hassle Free Process", button "Our Process" → Our Process page.
- Internal: `section.u-section.section_cta` → `.hero_video` (**reuses the hero's background-video classes** — same `<video>` DOM element pattern + `.cta_bg-cover` overlay) + `.cta_content` → nested **Row / Heading for Section** with all props forwarded.

## 3. Shared Atoms Used by These Sections

| Component | Group | Instances | Variants | Notes |
|---|---|---|---|---|
| Button | 04 UI Elements | 107 | Primary, Secondary | "Button Style" props on sections hold variant IDs (`"base"` = Primary, `20cba543-…` = Secondary) |
| Heading Text | 04 UI Elements | 79 | h1–h6, eyebrow | "Heading Style" props reference these variant IDs (e.g. `b0c8e90b-…`) |
| Paragraph Text | 04 UI Elements | 60 | Base | Has a visibility boolean prop |
| Review Badge | 04 UI Elements | 19 | Blue Star, Red Star, White Star | "Star Color" props hold variant IDs |
| Google Review Badge | 04 UI Elements | 19 | Base | Text 1 / Text 2 props |
| Row / Heading for Section | 02 Rows | 17 | Base | The standard section header (eyebrow + heading + paragraph + button); receives forwarded props |
| Spacer - Rows | 04 UI Elements | 2 | Large, Medium, Small | Variant-driven spacing |
| Card / Services | 03 Columns + Cards | 15 | Base | Used inside Services Grid |

Component groups site-wide: **01 Sections**, **02 Rows**, **03 Columns + Cards**, **04 UI Elements**, **05 Global** (emoji-prefixed group names in the Designer).

## 4. Key Architectural Patterns

1. **Fully componentized pages.** Pages are a flat list of section-component instances inside `.page-wrapper > .main-wrapper`. All content edits happen through instance props — no per-page raw elements.
2. **Prop forwarding.** Section components expose props at the top level and internally bind them into nested shared components (`Row / Heading for Section`, `Paragraph Text`, `Button`) via `{"sourceType": "prop", "propId": …}` bindings. To change home page copy, set the prop on the *section instance*; the binding chain delivers it down.
3. **Variant IDs as prop values.** Style-selector props (Button Style, Heading Style, Star Color, Spacer Variant) store variant IDs, not names. `"base"` = the base/first variant; other variants are opaque IDs (e.g. Secondary button = `20cba543-cf6e-97d3-e78f-24f4c5d44d52`, heading style `b0c8e90b-e1f9-cb13-10e5-4471fcf12994` recurs across sections). Get IDs from `get_component … includeVariants: true` before setting.
4. **Link props** use `{mode: "page", to: {pageId}}` — internal navigation is by page ID, not URL.
5. **Image props hold asset IDs** (e.g. Services Grid's 25 images). Swap via prop values with new asset IDs.
6. **Background video** is a raw `<video>` DOM element (autoplay/loop/muted/playsinline) in Hero and CTA Band — not a Webflow Background Video element; the CTA Band reuses the hero's `hero_video` / `home-hero_video` classes.
7. **JS-driven behaviors** ride on data attributes (`data-draggable-marquee-init` on Portfolio, `data-wall-mask` on Reviews) with logic in HtmlEmbeds / Global Styles / page code — moving or duplicating these sections keeps the behavior as long as the custom code ships with the page.

## 5. Quirks & Watch-outs

- `"Section / Portfolio "` has a **trailing space** in its name.
- Services Grid has **five identically-named "Heading Text" props** (one per card) — target by propId.
- Section / Reviews' single "Heading Content" prop still says "This is a heading" on the home instance; visible content is unaffected (vestigial prop).
- Prop-name typo: USP "Card 02 Blrub".
- Hero button 02 ("Learn About Insurance Claims") links to the **Contact Us** page id (`6a24690f…73a8`), same as button 01 — likely should point to Insurance Claims (`6a24690c…71b6`), which is what Feature Split's button correctly targets.
- Two class-naming dialects coexist: Relume-style utilities (`u-section`, `padding-global`, `max-width-large`) + `section_*`/`element_*` on most sections, vs BEM (`reviews-wall__*`) and `cx-btn` in the newer Reviews section.
- Almost everything is single-variant ("Base"); only Feature Split (Images Left/Right), Button, Heading Text, Review Badge, and Spacer carry real variants.

## 6. In Depth: Components Inside Components (Definitions vs Instances)

The single most important consequence of this architecture. Every section is a component whose **definition** nests further component instances (Row / Heading for Section → Heading Text, Paragraph Text, Button; Services Grid → Card / Services; USP → Row + Spacer + card grid). That nesting creates a three-layer content model:

```
Layer 1 — PAGE INSTANCE props        per page   ← the only per-page layer
Layer 2 — DEFINITION internals       shared     ← elements + nested instances, identical on every page
Layer 3 — NESTED INSTANCE props      shared     ← either forwarded (bound to a Layer-1 prop) or hardcoded
```

- **Layer 1** is what `get_all_elements` on a page shows: `ComponentInstance` nodes with `props[]`. Setting these (`set_component_instance_prop_values`) affects only that page.
- **Layer 2** is reached with `scope_component_id` on element tools. Text, images, attributes, and whole subtrees hardcoded here render identically on **every instance of that component, on every page**. Editing them is a cross-page change.
- **Layer 3**: a nested instance's prop either carries `{"sourceType": "prop", "propId": …}` (forwarded — receives the outer instance's per-page value) or a literal value (hardcoded into the definition — shared). Example from the home page: USP's nested Row / Heading for Section forwards 7 of its 8 props from USP's own props; its "Paragraph Visibility" is hardcoded `true`.

**Rule of thumb: per-page content must arrive through an unbroken forwarding chain from Layer 1. Anything page-specific found at Layer 2/3 is either a bug or a deliberately page-specific component (like the per-service FAQ duplicates).**

### Why this matters — the clone-leftover failure mode (proven on gutters, 2026-07-12)

When a component is duplicated to make a page-specific variant (FAQ Windows → FAQ Gutters/Roofing/Siding/Insurance), the **entire Layer-2 tree comes with it**. Renaming the component and updating Layer-1 props (eyebrow, heading) makes the page *look* updated while source-page content still renders from inside the definition:

- `Section / FAQ Gutters` (1 instance) shipped with 6 hardcoded accordion items — 4 correct gutters Q&A + **2 windows Q&A rendering live** on /gutters. Old-site inventory and the paste artifact both confirm 4 was correct → the 2 windows items were deleted from the definition.
- `Section / FAQ Siding` carries the same windows leftovers but with `visibility: false` — renders fine, clutter remains.
- `Section / FAQ Insurance` still carries them (visibility unverified — open item).
- `Section / FAQ Roofing` is clean.
- Same failure mode at Layer 1: the gutters page had 4 alt-text props still describing windows ("Bedroom windows", "Tall windows") — fixed same day.

### Audit recipe (headless)

1. **Layer 1**: `get_all_elements` (depth 3) on the page → scan every instance's `props[]` for source-page words, defaults ("This is a heading", lorem), and wrong links.
2. **Layers 2–3**: for each section component on the page, `get_all_elements` with `scope_component_id` + `depth: -1` → the oversized result lands in a saved file → grep offline for source-page terms (e.g. "window" on a gutters audit). One batched call covers a whole page's sections.
3. Check `visibility` on hits — `false` means it doesn't render (lower priority), `true` means it's live.
4. Before deleting anything from a definition, check `instanceCount` (a definition edit hits every instance) and confirm intended content against the old-site inventory / paste artifacts.

Targeted alternative to step 2: `query_elements` with `scope_component_id` + `element_filter.text` — catches element text but not nested-instance prop values, so prefer the full-tree grep for a real audit.

## Version Control

This document follows the root-level version control rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md). Regenerate by re-running the MCP analysis (data_pages_tool → data_element_tool get_all_elements → data_component_tool get_all_components) against the site/page IDs above whenever the home page structure changes.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
