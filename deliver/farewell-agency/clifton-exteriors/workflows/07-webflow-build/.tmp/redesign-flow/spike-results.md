# Redesign-Flow Spike Results — Headless Component Pipeline

Date: 2026-07-10 · Site: Clifton Exteriors (`6a234fcd5732d1f0a674156f`) · All via **Data API MCP, no Designer bridge, no open Designer session.**

## Verdict: FULL PASS — every step of the proposed flow works headlessly

| # | Step | Tool / action | Result |
|---|------|---------------|--------|
| 1 | Build element tree on a page | `data_element_builder` (nested children, text set atomically) | ✅ |
| 2 | Convert element → component | `data_component_tool > transform_element_to_component` | ✅ (replace=true swaps original for instance) |
| 3 | Create props | `data_component_tool > create_prop` (textContent ×2, batched) | ✅ |
| 4 | Bind element settings → props inside component def | `data_element_tool > set_settings` with `binding {source_type: prop}` + `scope_component_id` | ✅ (setting key for text is `text`) |
| 5 | Create a new page | `data_pages_tool > create_page` (draft) | ✅ |
| 6 | Insert component instance on ANOTHER page | `data_component_tool > insert_component_instance` (parent = target page body, pageId param controls target page despite "current active page" wording) | ✅ |
| 7 | Per-instance prop overrides | `data_component_tool > set_component_instance_prop_values` | ✅ |
| 8 | Verify resolved values | `get_component_instance_props (resolved_value: true)` | ✅ overrides read back correctly |

Cleanup: both spike instances removed, `ZZ Spike Test` component unregistered. **Leftover:** draft page `/zz-spike-test` (`6a50ef55795710079b02e543`) — the Data API has no delete-page action; delete it in the Designer, or keep it as a permanent redistribution sandbox.

## Key learnings

- **The redistribute step is fully automatable**: create instances on any page + override text/link/image/number/boolean props per instance without the Designer bridge.
- `insert_component_instance` needs a concrete `parent_element_id` — get the target page's Body id first (`get_all_elements depth 0`).
- Prop binding discovery loop: `query_elements (scope_component_id)` → `get_settings/get_bindable_sources` → `set_settings (binding)`.
- Batched actions run sequentially in one call — the whole per-section componentization can be few calls.
- Known limits still apply: `richText` props can't bind to a plain `text` setting; Collection List subtrees can't be transformed to components; image prop defaults need Webflow asset IDs.

## Site discovery (changes the plan!)

The site ALREADY has a mature component library: **47 components, 501 placed instances** (see `component-catalog.md`).
- 34 are `Section /` library components; 28 have props; 5 use variants (e.g. Feature Split: Images Left/Right; Heading Text: h1–h6/eyebrow; Button: Primary/Secondary; Review Badge; Spacer).
- Globals: Nav, Footer, Global Styles, Financing Banner, Services Navigation List.
- The `Components` workshop page (`6a24feba5fb5517249f4b629`, /untitled) is the existing library page — new sections should be pasted/created THERE and componentized in place.
- 19 components have NO props yet (Trust Bar, Process Steps, FAQ, Reviews, Gallery, Pricing Cards, Contact, Video Grid, Locations Directory, Blog List, Rich Text, Hero Video…) → props pass needed.
- Several prop defaults are lorem/placeholder ("This is a heading") → defaults pass needed.

## Version Control

This document follows the root-level version control rules in [SYSTEM_RULES.md](/SYSTEM_RULES.md). Commit only non-secret, repo-friendly workflow context and artifacts.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
