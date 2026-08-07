# Workflow: 07 - Webflow Build

## Client-Facing Overview
We build the approved design in Webflow with clean structure, responsive behavior, CMS setup, custom code, and the integrations needed for the website to work properly.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the Python executor, the converter toolchain, or technical logic of this workflow must be documented here and in [html-to-webflow-clipboard.md](./html-to-webflow-clipboard.md) immediately.

> [!NOTE]
> This is the **canonical template**. It is cloned into
> `deliver/[client-name]/workflows/07-webflow-build/` per engagement. Fill in
> `webflow-build.config.json`, replace `[client-name]`/`<DEPLOYED_SITE_URL>`
> placeholders, and record deviations in a `## Project Notes` section. The
> converter + diagnostics scripts ship inside this folder so each project is
> self-contained.

> [!NOTE]
> Planned evolution: [TEMPLATE_LIBRARY_PLAN.md](./TEMPLATE_LIBRARY_PLAN.md) — Relume-based template library (one shared class system, 20–30 variable-themed templates) feeding the pasteable-components converter.
> Scheduled fresh-session loop: [WEBFLOW_BUILD_LOOP.md](./WEBFLOW_BUILD_LOOP.md) — the hourly one-page Webflow build loop.

## Operational Purpose
Reproduce the approved final design source in Webflow with CMS-first structure, token consistency, responsive coverage, and staging readiness. Valid approved sources include revised Claude Design HTML/CSS/JS packages and Figma designs.

## Inputs From Sales / Previous Phase
- Approved final design package from `05-design-revisions` (fall back to `04-design/.tmp/final-design/` if no revisions exist).
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
- **Executor status**: The `07-webflow-build.py` executor is a **config-driven orchestrator** that reads `webflow-build.config.json` and drives the converter (`html_to_webflow.py`) + diagnostics (`wf_tools.py`). It wraps the directives below; the converter is the engine.
- **Primary operating model — Clipboard Copy-Paste build**: Claude runs `html_to_webflow.py` to convert the approved HTML/CSS into Webflow's clipboard payload (`@webflow/XscpData`), emits a browser copy page, and pastes each section straight into the Designer. A cascade resolver bakes descendant/compound/state CSS into flat Webflow classes, resolves `:root` design tokens, materializes `::before`/`::after`, and applies the Webflow-specific CSS translation rules (gap→grid-gap, grid track defaults + ordering, `inset` expansion, etc.). This is faster and higher-fidelity than per-element MCP calls for full pages. **Full method + translation rules + Build→Paste→Verify protocol:** [html-to-webflow-clipboard.md](./html-to-webflow-clipboard.md).
- **Going-forward standard**: author designs (`04`/`05`) in **Client-First flat classes** (one semantic class per styled element, no descendant selectors) so the converter stays a clean 1:1 map and the Webflow project has tidy class names for handoff.
- **Self-contained section packaging (required)**: author and package HTML, CSS, and JS **per section**. Every pasteable component must carry, inside its section root, two Webflow Embed (HtmlEmbed) elements — one `<style>` embed holding all CSS the section needs beyond the shared class system, and one `<script>` embed holding all JS the section needs (omit the JS embed only if the section has no behavior). A pasted section must render and behave correctly on **any page with zero page-settings changes** (no per-page head/footer custom code), so sections can be moved freely between pages. Keep only true site-wide concerns (fonts, resets, design tokens) in global custom code; everything section-specific rides inside the section. Scope embedded CSS/JS to the section's root class and guard scripts against double-initialization (the same section may appear on multiple pages or twice in the Designer).
- **Fallback A — MCP Build Protocol**: the HTML Decomposition Pipeline below (native `element_builder` build). Use when CMS bindings/native Designer editing must be authored programmatically rather than pasted.
- **Fallback B**: manual developer build in Webflow Designer, referencing the Vercel preview side-by-side.
- **Available integrations**: Webflow MCP (`element_builder`, `style_tool`, `variable_tool`, `data_cms_tool`, `component_builder`, `whtml_builder`, `data_assets_tool`, `data_scripts_tool`, `de_page_tool`) — used by Fallback A, for CMS setup, and for post-paste variable binding.

### Toolchain (ships with this folder)

| File | Role |
|:---|:---|
| [html_to_webflow.py](html_to_webflow.py) | Core converter — HTML+CSS → Webflow clipboard JSON (`--split` / `--copy-page`). |
| [html_to_webflow_wholepage.py](html_to_webflow_wholepage.py) | Experimental whole-page (single-paste) variant; imports the core engine. |
| [wf_tools.py](wf_tools.py) | Diagnostics multitool (`qa`, `collisions`, `inspect`, `expect`, `audit-diff`, `compare`). |
| [build_vocab.py](build_vocab.py) | Multi-page shared-class vocabulary (`--sources <json>`). |
| [gen_install_pages.py](gen_install_pages.py) / [gen_code_helpers.py](gen_code_helpers.py) | Clipboard-helper pages for head/footer custom code. |
| [verify.mjs](verify.mjs) | Token-light Playwright design-vs-staging diff. |
| [html-to-webflow-clipboard.md](html-to-webflow-clipboard.md) | Full method directive (the load-bearing knowledge). |
| [07-webflow-build.py](07-webflow-build.py) | Config-driven orchestrator (`webflow-build.config.json`). |
| [tests/](tests) | Converter regression tests (`python -m unittest discover -s tests`). |

### Config-driven orchestrator

Fill in `webflow-build.config.json` once per project:

```json
{
  "asset_base": "https://[client-name].vercel.app",
  "css": "../04-design/.tmp/final-design/site.css",
  "design_dir": "../05-design-revisions/.tmp/final-design",
  "var_map_seed": ".tmp/webflow-variable-map.json",
  "pages": {
    "index": "../05-design-revisions/.tmp/final-design/index.html",
    "about": "../05-design-revisions/.tmp/final-design/about.html"
  }
}
```

Then:

```bash
python 07-webflow-build.py init-config     # scaffold the config + .tmp/
python 07-webflow-build.py build-page <page>
python 07-webflow-build.py vocab            # multi-page shared-class system
python 07-webflow-build.py qa <page>
```

Raw converter access (always available):

```bash
python html_to_webflow.py --html "../05-design-revisions/.tmp/final-design/[page].html" \
  --css ../04-design/.tmp/final-design/site.css \
  --asset-base "<DEPLOYED_SITE_URL>" \
  --var-map .tmp/[page]/webflow-variable-map.json \
  --page-prefix [slug] \
  --split .tmp/[page]
python wf_tools.py qa .tmp/[page]
```

> [!IMPORTANT]
> **`--page-prefix` is required when pasting into a site you did not build**
> (added 2026-07-28). Without it the payload can carry classes named literally
> `p`, `div`, `span`, `a`, `h3` — and Webflow merges classes by NAME site-wide,
> so those either collide with the client's own classes or litter their project.
> The flag namespaces tag-derived auto-names only (`p` → `vnr-p`); source class
> names and JS hook tokens are untouched. The converter engine always supported
> this; only the CLI flag was missing, so any payload generated before that date
> should be re-checked. Full detail and the verification snippet:
> [html-to-webflow-clipboard.md](./html-to-webflow-clipboard.md) §Tag-derived auto-names.

---

## MCP Build Protocol — HTML Decomposition Pipeline

> **Why this protocol exists**: The Webflow MCP's `whtml_builder` creates HtmlEmbed blocks (code embeds), which look correct visually but are opaque — no CMS bindings, no Designer editing, no responsive breakpoint controls. Native Webflow elements via `element_builder` are the correct path. This protocol defines how Claude decomposes an approved HTML prototype into native Webflow elements. Use only when the clipboard paste model is unsuitable.

### Phase 1: Site Setup & Token Extraction

1. Call `webflow_guide_tool` for current best practices.
2. Call `data_sites_tool` to list sites → confirm or create the target Webflow project.
3. Read the approved HTML from `05-design-revisions/.tmp/final-design/` (or `04-design/.tmp/final-design/` if no revisions exist).
4. Extract CSS custom properties from the `:root {}` block.
5. Call `variable_tool` to create Webflow variable collections:
   - **Colors**: every `--color-name` token (and opacity variants).
   - **Typography**: `--display`, `--body`, `--mono` font-family tokens.
   - **Spacing/sizing**: any token-based spacing values found in the prototype.
6. Save `07-webflow-build/.tmp/token-map.json` mapping CSS variable names → Webflow variable IDs.

### Phase 2: Style System Creation

1. Identify CSS class patterns from the HTML.
2. For each class, call `style_tool` to create a Webflow style with:
   - **Desktop** properties (the base CSS declarations).
   - **Tablet** overrides (from `@media (max-width: 1024px)` or similar).
   - **Mobile Landscape** overrides (from `@media (max-width: 768px)`).
   - **Mobile Portrait** overrides (from `@media (max-width: 480px)`).
3. Create combo classes for variants.
4. Reference Webflow variables (from Phase 1) in style values wherever the HTML used `var(--token)`.
5. Save `07-webflow-build/.tmp/style-map.json` mapping CSS class names → Webflow style names/IDs.

### Phase 3: Asset Upload

1. Extract all image/media references from the HTML (`<img src>`, `background-image` URLs, inline SVGs).
2. Upload raster images (PNG, JPG, WebP) via `data_assets_tool`.
3. For inline SVGs, decide per case: simple icons/logos → upload as SVG asset; complex decorative SVGs → keep as `whtml_builder` embed.
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
4. For each element, set: `set_style`, `set_text`, `set_link`, `set_image_asset`, `set_heading_level`.
5. Build children recursively using the `children` array in `element_schema`.
6. After each major section, call `element_snapshot_tool` to visually verify the build.

### Phase 5: CMS & Dynamic Content

1. Identify repeating content patterns in the HTML (portfolio items, service cards, testimonials, team members).
2. Call `data_cms_tool` to create a Collection for each pattern, with fields matching the content shape.
3. Populate Collection items with the content extracted from the HTML.
4. Replace the static elements with `CMSCollection` list/item elements, binding fields via `settings.binding`.

### Phase 6: Embeds & Custom Code (whtml_builder — targeted use only)

Use `whtml_builder` ONLY for elements that cannot be native Webflow elements:
- **Keyframe animations**, **Pseudo-element decorations**, **Complex inline SVG**, **Third-party embeds**.

Register site-level scripts via `data_scripts_tool` for Google Fonts, analytics/tracking, and custom JS.

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
- `deliver/[client-name]/workflows/07-webflow-build/.tmp/<page>/paste_*.html` — generated section paste components
- `deliver/[client-name]/workflows/07-webflow-build/.tmp/<page>/webflow-custom-code.js` + `animation-manifest.json` — page JS and hook manifest
- `deliver/[client-name]/workflows/07-webflow-build/.tmp/<page>/webflow-runtime-states.css` — runtime-state CSS for the head
- `deliver/[client-name]/workflows/07-webflow-build/.tmp/<page>/webflow-variable-{import,map}.json` and `webflow-style-variable-bindings.json` — variable artifacts
- `deliver/[client-name]/workflows/07-webflow-build/.tmp/<page>/site.css` — copy of source CSS
- `deliver/[client-name]/workflows/07-webflow-build/.tmp/build-manifest.json` — full build log with element IDs, page IDs, CMS collection IDs (MCP path)
- `deliver/[client-name]/workflows/07-webflow-build/.tmp/visual-diff/` — staging vs preview comparison screenshots
- `deliver/[client-name]/workflows/07-webflow-build/.tmp/cms-import.json`
- `deliver/[client-name]/workflows/07-webflow-build/.tmp/change-manifest.json` (improvements only)

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md - Section 4](../../../SYSTEM_RULES.md).
- **`.tmp/` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming**: `deliver/[client-name]-webflow-build-<change>` once cloned into a client folder.
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.
- **Toolchain**: The converter and diagnostics scripts are committed as part of this template so cloned client workflows are self-contained. Keep them in sync with this folder when the canonical tooling evolves.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
