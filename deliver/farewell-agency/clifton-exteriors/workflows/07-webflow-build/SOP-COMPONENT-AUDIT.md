# SOP — Webflow Component Structure Analysis & Page Audit (Headless MCP)

## Purpose
Repeatable procedure for (a) analyzing how a Webflow page is composed from components and (b) auditing/fixing a component-built page for content leaks — wrong props, defaults, and clone leftovers hiding inside component definitions. Runs entirely through the Webflow MCP Data API: no Designer bridge, no browser.

Derived from the Clifton Exteriors home-page analysis + gutters-page audit (2026-07-12), which this SOP uses as its worked example. Case-study detail: [HOME-COMPONENT-STRUCTURE.md](./HOME-COMPONENT-STRUCTURE.md).

## When to Use
- After cloning/scaffolding a page from another page's components (highest-value moment — clone leftovers are the proven failure mode).
- Before publishing any component-built page.
- When onboarding to an unfamiliar component-built site (run Phases 0–2 only, as pure analysis).
- As the verification pass after agents mass-edit instance props.

## Core Model (read first)
Component-built pages have a **three-layer content model**. Only Layer 1 is per-page:

| Layer | What | Scope | Read with | Write with |
|---|---|---|---|---|
| 1 | Page-instance props | **per page** | `get_all_elements` on the page | `set_component_instance_prop_values` |
| 2 | Definition internals (elements + nested instances) | shared by ALL instances on ALL pages | `get_all_elements` + `scope_component_id` | `set_text` / `remove_element` / etc. + `scope_component_id` |
| 3 | Nested-instance props inside a definition | shared; either **forwarded** (`{"sourceType":"prop","propId":…}` → receives Layer-1 value) or **hardcoded** | same as Layer 2 | same as Layer 2 |

**Rule: per-page content must arrive through an unbroken forwarding chain from Layer 1.** Page-specific content found at Layer 2/3 is either a bug or a deliberately page-specific duplicate component (e.g. per-service FAQ components).

## Procedure

### Phase 0 — Setup
1. Call `webflow_guide_tool` once per session (required by the MCP server).
2. Resolve IDs: `data_sites_tool > list_sites` → `data_pages_tool > list_pages`. Never assume a site ID.
3. Define the **leak vocabulary**: the source-page terms that must NOT appear on the target page (e.g. auditing a gutters page cloned from windows → grep terms: `window`, plus source-specific nouns like `vinyl`, `pane`). Also always scan for defaults: `This is a heading`, `Lorem ipsum`.

### Phase 1 — Map the page (Layer 1)
4. `data_element_tool > get_all_elements` (depth 3) on the target page. Expected shape: `page-wrapper > [Global Styles, Navigation, main-wrapper > section instances, Footer]`.
5. Record every `ComponentInstance` with its component ID and full `props[]`. Scan props for: leak vocabulary, defaults, wrong alt texts, and links pointing at the wrong page (compare `{mode:"page"|"url"}` targets against intent).

### Phase 2 — Map the library (analysis runs only; skip for a pure audit)
6. `data_component_tool > get_all_components` with `includeProps/includeVariants/includeInstanceCount`. Output exceeds the token cap → it lands in a saved tool-result file → parse offline (Python/jq), never in-context.
7. Record per component: group, ID, instance count, prop counts by type, variants. Note single-variant vs real-variant components and shared atoms.

### Phase 3 — Sweep inside definitions (Layers 2–3)
8. For every section component used on the page: one **batched** `get_all_elements` call, one action per component, each with `scope_component_id` + `depth: -1`. Oversized output → saved file → **grep offline** for the leak vocabulary across `textContent`, settings (alt text), attributes, and nested-instance prop values.
   - Don't rely on `query_elements` + `element_filter.text` alone — it misses nested-instance prop values.
9. For each hit, record: section, element ID, whether it's Layer 2 text or a Layer 3 hardcoded prop, and its `visibility` (`false` = doesn't render, lower priority; `true` = live bug).
10. While walking nested instances, classify each prop as forwarded vs hardcoded — hardcoded page-specific values are findings even without a vocabulary hit.

### Phase 4 — Fix
11. **Layer 1 fixes** (safe, page-scoped): `set_component_instance_prop_values` on the page instance. Batch multiple sections in one call.
12. **Layer 2/3 fixes** (cross-page): BEFORE editing, check the component's `instanceCount`.
    - `instanceCount == 1` → definition edits only affect that one page; proceed.
    - `instanceCount > 1` → the edit hits every page. Verify the change is universally correct, or duplicate the component first (`duplicate_component`) and swap the instance.
13. **Confirm intent before deleting content** from a definition: check the paste artifacts (`.tmp/section-components/page-*/paste_*.html` payloads) and/or the old-site inventory (`.tmp/redesign-flow/oldsite-section-inventory.md`). Only delete when a source of truth confirms the correct item count/content.
14. Value-type gotchas: textContent/altText props → `type:"string"`; CTA-style Heading/Paragraph props are often richText → `rich_text_inner_text`; button-link props on this site reject `link_mode:"page"` → use `url` + path; style-selector props take **variant IDs** (`"base"` or a UUID), never names.

### Phase 5 — Verify
15. Re-query what you changed: `query_elements` scoped to the edited definition (count items, confirm text), or re-read instance props. Do not trust write responses alone for deletions.
16. If visual verification is needed: headless Playwright screenshots against public staging (see 08-qa `shoot.mjs` pattern) — reveals need auto-scroll, and only on a focused tab.

### Phase 6 — Document & hand off
17. Write/update the page's analysis doc (pattern: [HOME-COMPONENT-STRUCTURE.md](./HOME-COMPONENT-STRUCTURE.md)) and log open items (e.g. leaks found in components on OTHER pages during the sweep).
18. Update project memory/state with: what was fixed, what was deliberately left (hidden leftovers, vestigial defaults), and open items.
19. **Never publish without explicit user OK.** All Data API writes land in the Designer draft.

## Known Failure Modes (checklist)
- [ ] **Clone leftovers in definitions** — duplicated components carry the source page's full Layer-2 tree; renamed component + updated Layer-1 props ≠ done. (FAQ Gutters shipped 2 live windows Q&A.)
- [ ] **Alt-text props left on source-page values** ("Bedroom windows" on a gutters page).
- [ ] **Hidden-not-deleted leftovers** — `visibility:false` items render fine but resurface on the next clone. Prefer delete when a source of truth confirms.
- [ ] **Vestigial defaults** ("This is a heading", lorem) on props whose bound element never renders — harmless, but verify they truly don't render before ignoring.
- [ ] **Links copied from a sibling button** (home hero button 02 → Contact Us instead of Insurance Claims).
- [ ] **Name-lookup traps**: trailing spaces in component names; duplicate prop display names (target by propId); `create_prop` with an existing name silently creates a `" 2"` duplicate.

## Version Control
This directive follows the root-level version control rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md). Update this SOP whenever an audit reveals a new failure mode, tool gotcha, or a better sweep technique (Directive Improvement Loop). Companion artifacts: [HOME-COMPONENT-STRUCTURE.md](./HOME-COMPONENT-STRUCTURE.md) (worked example), `home-component-structure.html` (visual summary).

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
