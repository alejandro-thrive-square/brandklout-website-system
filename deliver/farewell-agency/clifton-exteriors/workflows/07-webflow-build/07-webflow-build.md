# Workflow: 07 - Webflow Build

## Client-Facing Overview
We build the approved design in Webflow with clean structure, responsive behavior, CMS setup, custom code, and the integrations needed for the website to work properly.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the Python executor or technical logic of this workflow must be documented here immediately.

> [!NOTE]
> Planned evolution: [TEMPLATE_LIBRARY_PLAN.md](./TEMPLATE_LIBRARY_PLAN.md) — Relume-based template library (one shared class system, 20–30 variable-themed templates) feeding the pasteable-components converter.

> [!NOTE]
> Scheduled fresh-session loop: [WEBFLOW_BUILD_LOOP.md](./WEBFLOW_BUILD_LOOP.md) defines the hourly one-page Webflow build loop, project states, locks, and the Giovanni Serrano first experiment.

## Operational Purpose
Reproduce the approved final design source in Webflow with CMS-first structure, token consistency, responsive coverage, and staging readiness. Valid approved sources include revised Claude Design HTML/CSS/JS packages and Figma designs.

## Inputs From Sales / Previous Phase
- Approved final design package from `05-design-revisions`.
- Final copy, metadata, alt text, and SEO decisions from `06-content-seo`.
- Required Webflow workspace access, integrations, CMS requirements, and tracking scripts.
- Approved scope and constraints from the Sales handoff.
- For Figma-to-Webflow: build plan from `11-figma-review-build-planning`.
- For migrations: migration plan from `12-migration-audit-plan`, content migration report from `13-content-export-import`, and SEO/redirect plan from `14-migration-seo-redirects`.
- For improvements: scoped implementation plan from `15-improvement-intake-audit`.

## Execution Steps
1. Create or open the Webflow project and scaffold CMS Collections.
2. Build the global style system before page components.
3. Build each page/template from the approved design and content.
4. Publish to staging and prepare a build manifest for QA.

## Offer-Specific Adaptations
- **Development from Scratch**: Build the approved full-site design source and CMS model after `01` through `06` are approved.
- **Figma to Webflow**: Build from the approved `11` build plan.
- **Migration to Webflow**: Build or rebuild the Webflow CMS architecture and pages using the outputs of `12`, `13`, and `14`.
- **Webflow Improvements & Updates**: Implement only the approved change list from `15`.

## Technical Setup
- **Executor status**: Directive-driven (Claude runs the HTML→Webflow converter).
- **Primary operating model — Clipboard Copy-Paste build**: Claude runs `html_to_webflow.py` to convert the approved HTML/CSS into Webflow's clipboard payload (`@webflow/XscpData`), emits a browser copy page, and pastes each section straight into the Designer. A cascade resolver bakes descendant/compound/state CSS into flat Webflow classes, resolves `:root` design tokens, materializes `::before`/`::after`, and applies the Webflow-specific CSS translation rules (gap→grid-gap, grid track defaults + ordering, `inset` expansion, etc.). This is faster and higher-fidelity than per-element MCP calls for full pages. **Full method + translation rules:** the workflow's `html-to-webflow-clipboard.md`.
- **Going-forward standard**: author designs (`04`/`05`) in **Client-First flat classes** (one semantic class per styled element, no descendant selectors) so the converter stays a clean 1:1 map and the Webflow project has tidy class names for handoff.
- **Self-contained section packaging (required)**: author and package HTML, CSS, and JS **per section**. Every pasteable component must carry, inside its section root, two Webflow Embed (HtmlEmbed) elements — one `<style>` embed holding all CSS the section needs beyond the shared class system, and one `<script>` embed holding all JS the section needs (omit the JS embed only if the section has no behavior). A pasted section must render and behave correctly on **any page with zero page-settings changes** (no per-page head/footer custom code), so sections can be moved freely between pages. Keep only true site-wide concerns (fonts, resets, design tokens) in global custom code; everything section-specific rides inside the section. Scope embedded CSS/JS to the section's root class and guard scripts against double-initialization (the same section may appear on multiple pages or twice in the Designer).
- **Fallback A — MCP Build Protocol**: the HTML Decomposition Pipeline below (native `element_builder` build). Use when CMS bindings/native Designer editing must be authored programmatically rather than pasted.
- **Fallback B**: manual developer build in Webflow Designer, referencing the Vercel preview side-by-side.
- **Available integrations**: Webflow MCP (`element_builder`, `style_tool`, `variable_tool`, `data_cms_tool`, `component_builder`, `whtml_builder`, `data_assets_tool`, `data_scripts_tool`, `de_page_tool`) — used by Fallback A and for CMS setup.

### Clifton Section-by-Section Packaging

The Clifton local full-site design uses page wrapper roots for coherent previews, but Webflow installation is packaged section-by-section:

1. Run `python build-section-components.py` from this workflow folder.
2. The batch builder calls `html_to_webflow.py --split --root "<section selector>"`; in split mode, every selector match becomes an independent paste page while cascade resolution still uses the complete source document.
3. Outputs live in `.tmp/section-components/<page>/paste_XX_<section>.html` and must be pasted in numeric order.
4. `.tmp/section-components/manifest.json` is the canonical page/component inventory and paste-order handoff.
5. Bespoke pages use inline design CSS. Home, Gutters, Contact, Privacy Policy, and Terms of Service are staging-derived snapshots and use `.tmp/section-components/staging.webflow.css`.
6. Every page is collision-checked against the existing Reviews, CTA, net-new-section payloads, and all previously generated page-section folders.
7. Do not use the older single-root whole-page payloads for this section-by-section installation.
8. If a long batch stops on QA, fix the source issue and resume with `python build-section-components.py --resume`; existing folders are reused only after they pass QA again.

---

## MCP Build Protocol — HTML Decomposition Pipeline

> **Why this protocol exists**: The Webflow MCP's `whtml_builder` creates HtmlEmbed blocks (code embeds), which look correct visually but are opaque — no CMS bindings, no Designer editing, no responsive breakpoint controls. Native Webflow elements via `element_builder` are the correct path. This protocol defines how Claude decomposes an approved HTML prototype into native Webflow elements.

### Phase 1: Site Setup & Token Extraction

1. Call `webflow_guide_tool` for current best practices.
2. Call `data_sites_tool` to list sites → confirm or create the target Webflow project.
3. Read the approved HTML from `05-design-revisions/.tmp/final-design/` (or `04-design/.tmp/final-design/` if no revisions exist).
4. Extract CSS custom properties from the `:root {}` block.
5. Call `variable_tool` to create Webflow variable collections:
   - **Colors**: every `--color-name` token (e.g., `--terra`, `--navy`, `--gold`, `--canvas`, `--bone`, `--ink`, and their opacity variants).
   - **Typography**: `--display`, `--body`, `--mono` font-family tokens.
   - **Spacing/sizing**: any token-based spacing values found in the prototype.
6. Save `07-webflow-build/.tmp/token-map.json` mapping CSS variable names → Webflow variable IDs.

### Phase 2: Style System Creation

1. Identify CSS class patterns from the HTML (`.hero`, `.scene`, `.card`, `nav.top`, etc.).
2. For each class, call `style_tool` to create a Webflow style with:
   - **Desktop** properties (the base CSS declarations).
   - **Tablet** overrides (from `@media (max-width: 1024px)` or similar).
   - **Mobile Landscape** overrides (from `@media (max-width: 768px)`).
   - **Mobile Portrait** overrides (from `@media (max-width: 480px)`).
3. Create combo classes for variants (e.g., `.scene.dark`, `.scene.bone`, `.hero-cta-row a.alt`).
4. Reference Webflow variables (from Phase 1) in style values wherever the HTML used `var(--token)`.
5. Save `07-webflow-build/.tmp/style-map.json` mapping CSS class names → Webflow style names/IDs.

### Phase 3: Asset Upload

1. Extract all image/media references from the HTML (`<img src>`, `background-image` URLs, inline SVGs).
2. Upload raster images (PNG, JPG, WebP) via `data_assets_tool`.
3. For inline SVGs, decide per case:
   - **Simple icons/logos** → upload as SVG asset, use Image element.
   - **Complex decorative SVGs** (architectural drawings, animated patterns) → keep as `whtml_builder` embed.
4. Save `07-webflow-build/.tmp/asset-map.json` mapping original paths → Webflow asset IDs.

### Phase 4: Page Structure Build

For each page in the approved design:

1. Call `de_page_tool` to create or navigate to the page.
2. Decompose the HTML into a Webflow element tree using this mapping:

   | HTML | Webflow `element_builder` type | Notes |
   |:---|:---|:---|
   | `<nav>` | DivBlock | Apply `position: fixed` via style |
   | `<section>` | Section | Webflow top-level section container |
   | `<div>` | DivBlock | General container |
   | `<h1>`–`<h6>` | Heading + `set_heading_level` | Match the heading level |
   | `<p>` | Paragraph | |
   | `<span>`, `<em>`, `<strong>` | DOM + `set_dom_config` | Inline text elements |
   | `<a>` (text link) | TextLink + `set_link` | |
   | `<a>` (wrapping block) | LinkBlock + `set_link` | |
   | `<button>` | Button | |
   | `<img>` | Image + `set_image_asset` | Reference asset IDs from Phase 3 |
   | `<form>` | Form + FormTextInput/FormButton/etc. | |
   | `<ul>/<ol>` | DivBlock with child DivBlocks | Webflow uses div-based list patterns |
   | `<video>` | Video | |

3. Build top-down, section by section: navbar → hero → each content section → footer.
4. For each element, set:
   - `set_style` → reference style names from Phase 2.
   - `set_text` → copy text content from the HTML.
   - `set_link` → copy `href` values.
   - `set_image_asset` → reference asset IDs from Phase 3.
   - `set_heading_level` → match `h1`–`h6` levels.
5. Build children recursively using the `children` array in `element_schema`.
6. After each major section, call `element_snapshot_tool` to visually verify the build.

### Phase 5: CMS & Dynamic Content

1. Identify repeating content patterns in the HTML (portfolio items, service cards, testimonials, team members).
2. Call `data_cms_tool` to create a Collection for each pattern, with fields matching the content shape (PlainText, RichText, Image, Link, etc.).
3. Populate Collection items with the content extracted from the HTML.
4. Replace the static elements with `CMSCollection` list/item elements, binding fields via `settings.binding`.

### Phase 6: Embeds & Custom Code (whtml_builder — targeted use only)

Use `whtml_builder` ONLY for elements that cannot be native Webflow elements:
- **Keyframe animations** (e.g., marquee `@keyframes scroll-left`).
- **Pseudo-element decorations** (`::before`/`::after` with gradients, decorative bars).
- **Complex inline SVG** (architectural drawings, animated patterns).
- **Third-party embeds** (calendars, widgets, external components).

For each embed, provide the HTML in the `html` parameter and extracted CSS in the `css` parameter. Never include `<style>` tags inside the HTML string.

Register site-level scripts via `data_scripts_tool` for:
- Google Fonts `<link>` tag.
- Analytics/tracking scripts.
- Any custom JS interactions from the prototype.

### Tool Decision Guide

| Pattern | Tool | Reason |
|:---|:---|:---|
| Section layouts, containers, grids | `element_builder` | Must be native for CMS/responsive |
| Headings, paragraphs, buttons, links | `element_builder` | Must be editable in Designer |
| Images | `element_builder` + `data_assets_tool` | Must be manageable assets |
| Navigation | `element_builder` | Must support Webflow interactions |
| Forms | `element_builder` (Form type) | Must use Webflow form handling |
| Marquee/scroll animations | `whtml_builder` | CSS keyframes, decorative only |
| Complex inline SVGs | `whtml_builder` | Cannot represent as native element |
| Grid-line background patterns | `whtml_builder` | CSS pseudo-element decoration |
| Gradient decorative bars | `whtml_builder` | `::before`/`::after` pseudo-elements |
| CMS-bound repeating content | `element_builder` + `data_cms_tool` | Dynamic content binding required |

## Redesign Flow — Component Redistribution Loop (validated 2026-07-10)

For redesign projects, page work is component-driven, not per-page pastes. The full loop was spike-verified headlessly (Data API MCP only, no Designer bridge) — see `.tmp/redesign-flow/spike-results.md`:

1. **Scrape old site** → per-page section inventory → dedupe into unique section types + variants (`.tmp/redesign-flow/oldsite-section-inventory.md` pattern).
2. **Diff vs component catalog** (`data_component_tool > get_all_components` with props/variants/instance counts) and the published staging state → list of genuinely MISSING sections only.
3. **Design missing sections** → ONE single-root paste onto the site's Components workshop page (never per-section pastes).
4. **Componentize headlessly**: `transform_element_to_component` → `create_prop` (batch) → find inner elements via `query_elements (scope_component_id)` → bind with `set_settings {binding: {source_type: prop}}` (text setting key is `text`).
5. **Redistribute**: per target page, `get_all_elements depth 0` for the Body id → `insert_component_instance` (pageId param controls the target page) → `set_component_instance_prop_values` per instance → verify with `get_component_instance_props (resolved_value: true)`.

Known limits: richText props can't bind to plain text settings (long copy = per-instance `set_text`); Collection List subtrees can't be componentized (keep CMS sections out of components); image prop defaults need Webflow asset IDs (S3 upload flow first); no page-delete via Data API; count-variant substructure (N cards/FAQs) = CMS collection or max-count + visibility bool props. Globals (nav/footer/same-everywhere bands) skip the props rule.

## Output Artifacts
- `deliver/[client-name]/workflows/07-webflow-build/.tmp/token-map.json` — CSS vars → Webflow variable IDs
- `deliver/[client-name]/workflows/07-webflow-build/.tmp/style-map.json` — CSS classes → Webflow style names/IDs
- `deliver/[client-name]/workflows/07-webflow-build/.tmp/asset-map.json` — image paths → Webflow asset IDs
- `deliver/[client-name]/workflows/07-webflow-build/.tmp/build-manifest.json` — full build log with element IDs, page IDs, CMS collection IDs
- `deliver/[client-name]/workflows/07-webflow-build/.tmp/visual-diff/` — staging vs preview comparison screenshots
- `deliver/[client-name]/workflows/07-webflow-build/.tmp/cms-import.json`
- `deliver/[client-name]/workflows/07-webflow-build/.tmp/change-manifest.json` (improvements only)

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md - Section 4](../../../SYSTEM_RULES.md).
- **`.tmp/` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming**: `deliver/[client-name]-webflow-build-<change>` once cloned into a client folder.
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
