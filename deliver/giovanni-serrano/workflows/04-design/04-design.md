# Workflow: 04 - Design (Giovanni Serrano)

## Client-Facing Overview
We turn the approved structure, brand direction, and selected design-system package into the first high-quality design draft used for review and later Webflow implementation.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the Python executor, technical logic, or design library of this workflow must be documented here immediately.

## Operational Purpose
Finalize Giovanni's Claude Design HTML/CSS/JS first-draft package from the initialized design-system materials and approved wireframes before the correction loop begins.

## Design-System Source
- Reusable process source: `deliver/process/design-system-library/`
- Initialized client package: `deliver/giovanni-serrano/workflows/00-client-delivery-initialization/.tmp/design-system/`
- Project-specific runtime outputs: `deliver/giovanni-serrano/workflows/04-design/.tmp/`

## Inputs From Sales / Previous Phase
- Approved wireframe validation outputs from `02-wireframe`
- Prepared graphic resources from `03-graphic-resources`
- Project context from `docs/project-overview.md`
- Initialized Giovanni design-system package from `00-client-delivery-initialization/.tmp/design-system/`

## Execution Steps
1. Review the approved IA, graphic resources, project overview, and initialized design-system package.
2. Merge the selected design direction with Giovanni's brand inputs into the project token set.
3. Produce the Claude Design first-draft package for Home and the shared Service template, authored in the **Webflow file structure** (see below).
4. Export the first draft into `04-design/.tmp/final-design/`.
5. Record component specifications, responsive behavior, screenshots, and review outputs.
6. Send the design draft into `05-design-revisions` for the approved correction loop.

## Authoring Structure — Centralized CSS, Per-Page HTML + JS

> [!IMPORTANT]
> Author the design the way Webflow is structured: **one centralized CSS file**
> shared by every page, plus **per-page HTML and per-page JS**. Do NOT give each
> page its own duplicated `<style>` block.

Required `04-design/.tmp/final-design/` layout:

- `site.css` — the single centralized stylesheet for the whole site: `:root`
  custom properties (defined once), base/element styles, shared component
  classes (nav, footer, `scene`, `reveal`, …), and each page's page-specific
  sections. This is the one source of truth for all styling.
- `<page>.html` — per-page **body markup only**, linking `site.css`
  (`<link rel="stylesheet" href="site.css">`) so the page still previews
  standalone, plus the page's own `<script src="<page>.js">` (or inline
  `<script>`).
- `<page>.js` — that page's JavaScript (reveal observers, accordions, etc.).

Why this matters for [07-webflow-build](../07-webflow-build/html-to-webflow-clipboard.md):
the converter **bakes** computed styles from this CSS into Webflow records. When
every page bakes from the *same* `site.css`, shared components resolve to
byte-identical records across pages, which is what prevents the cross-page class
collisions that per-page `<style>` blocks caused. 07 consumes `site.css` via
`--css` and each page's HTML via `--html`.

> [!NOTE]
> Keep per-element inline tokens **inline** (e.g. `style="--w: 100%"` on a
> compare-bar row). The clipboard paste cannot carry custom properties, so the
> 07 converter re-applies them at runtime from a generated JS snippet — they
> must stay as inline `style` attributes in the page HTML, not be hoisted into
> `site.css`.

## Offer-Specific Adaptations
- **Development from Scratch**: Required.
- **Figma to Webflow**: Not applicable.
- **Migration to Webflow**: Not applicable.
- **Webflow Improvements & Updates**: Not applicable.

## Project-Specific Notes
- Giovanni uses the Claude Design path.
- The approved page set is Home, Invest, Scale, and Develop.
- The shared Service template covers Invest, Scale, and Develop.

## Output Artifacts
- `deliver/giovanni-serrano/workflows/04-design/.tmp/style-direction.md`
- `deliver/giovanni-serrano/workflows/04-design/.tmp/design-tokens.json`
- `deliver/giovanni-serrano/workflows/04-design/.tmp/final-design/` — contains
  the centralized `site.css`, per-page `<page>.html`, and per-page `<page>.js`
  (see Authoring Structure above).
- `deliver/giovanni-serrano/workflows/04-design/.tmp/component-spec.json`
- `deliver/giovanni-serrano/workflows/04-design/.tmp/screenshots/`
- `deliver/giovanni-serrano/docs/design-draft-review.md`

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
- **`.tmp/` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming:** `deliver/giovanni-serrano-design-<change>`

## Infrastructure
- **Hosting:** Hostinger VPS
- **OS:** Ubuntu 24.04 LTS
