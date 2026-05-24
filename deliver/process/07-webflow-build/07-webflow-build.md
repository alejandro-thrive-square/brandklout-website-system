# Workflow: 07 - Webflow Build

## Client-Facing Overview
We build the approved design in Webflow with clean structure, responsive behavior, CMS setup, custom code, and the integrations needed for the website to work properly.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the Python executor or technical logic of this workflow must be documented here immediately.

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
- **Executor status**: Directive-driven (Claude follows the MCP Build Protocol below).
- **Primary operating model**: MCP-assisted build using the HTML Decomposition Pipeline. Claude reads the approved HTML prototype, decomposes it into native Webflow elements via `element_builder`, and reserves `whtml_builder` only for non-native edge cases (animations, SVGs, pseudo-element decorations).
- **Fallback**: Manual developer build in Webflow Designer, referencing the Vercel preview side-by-side.
- **Active integrations**: Webflow MCP (`element_builder`, `style_tool`, `variable_tool`, `data_cms_tool`, `component_builder`, `whtml_builder`, `data_assets_tool`, `data_scripts_tool`, `de_page_tool`).

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
