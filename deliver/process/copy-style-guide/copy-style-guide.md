# Workflow: Copy Style Guide (Variables + Styles)

## Client-Facing Overview
We set up a website's style guide by transferring an existing design system — colors, typography, spacing variables, and CSS classes with their responsive behavior — from one Webflow site to another in the same workspace. This lets an already-built site instantly inherit a proven, consistent style foundation (for example, from a Relume cloneable site) without rebuilding it by hand.

> [!IMPORTANT]
> **Integrity Rule**: Any change to this workflow's copy logic, MCP tool usage, conflict policy, or output schema must be documented here immediately, and the Supporting Workflows entry in [PROCESS_INDEX.md](../PROCESS_INDEX.md) must be updated in the same change.

## Operational Purpose
Read **all variable collections + variables** and **all styles** (base classes and combo classes, including responsive breakpoints and pseudo states) from a **source** Webflow site, and recreate them on a **target** Webflow site using the Webflow MCP. This is a non-sequential supporting workflow — invoke it whenever an existing site needs its design-system foundation seeded from another site in the same workspace, independent of the numbered delivery phases.

**Scope**: Variables and styles only. This workflow does **not** copy components, assets, pages, or CMS collections.

**Conflict policy**: **Source wins.** When the target already has a variable or style with the same name, overwrite it with the source value.

## Inputs
- A **source** Webflow site (the design-system source of truth, e.g. a Relume cloneable site).
- A **target** Webflow site (the already-created site that needs its style guide set up).
- Both sites accessible in the same authorized Webflow workspace.
- Webflow MCP runtime authentication confirmed via `/mcp`, with the Designer Bridge App available.
- When run for a specific engagement, the nearest `mcp-access.md` and its referenced profile in `mcp-servers/profiles/` (per [ACCESS_MODEL.md](../../../mcp-servers/ACCESS_MODEL.md) and [webflow/setup.md](../../../mcp-servers/webflow/setup.md)).

## Execution Steps

### Phase A — Identify Sites
1. Call `data_sites_tool` → `list_sites`. **Never assume site IDs.**
2. Ask the user to confirm which listed site is the **source** (e.g. the Relume clone) and which is the **target** (the existing site). Record both `siteId` values.
3. Designer Bridge App constraint: `variable_tool` and `style_tool` operate through the open Designer session. The **source** site must be open in the Designer to read it, and the **target** site must be open to write to it. Confirm the operator can switch the open site in the Designer between the read phase (B) and the write phases (C–D).

### Phase B — Read Source Design System
1. Open the **source** site in the Webflow Designer (Bridge App connected).
2. `variable_tool` → `get_variable_collections` (query `all`), then `get_variables` per collection with `include_all_modes: true`. Save `.tmp/source-variables.json`.
3. `style_tool` → `get_styles` (query `all`, `include_all_breakpoints: true`). Save `.tmp/source-styles.json`.

### Phase C — Recreate Variables on Target (source wins)
> Confirm the target `siteId` with the user before any write — this mutates a live site.
1. Switch the Designer to the **target** site. Read the target's existing collections with `get_variable_collections` so name collisions can be detected.
2. For each source collection: reuse the same-named target collection if it exists, else `create_variable_collection`.
3. Recreate any additional modes with `create_variable_mode`.
4. Create variables in dependency order: concrete values first, then **aliases** (variables whose source value referenced another variable) using `existing_variable_id` pointing at the already-mapped **target** variable.
5. On name collision, use `update_*_variable` instead of create (overwrite — source wins).
6. Build and save `.tmp/variable-id-map.json` mapping **source variable ID → target variable ID**. This map is required by Phase D because variable IDs differ per site.

### Phase D — Recreate Styles on Target (source wins)
1. With the Designer still on the **target** site, create base classes first, then combo classes via `parent_style_names`.
2. For each property: if the source value was a variable reference, set `variable_as_value` to the **target** variable ID resolved through `variable-id-map.json`; otherwise pass the literal `property_value`.
3. Apply responsive and state overrides with `update_style` per `breakpoint_id` (`xxl`, `xl`, `large`, `main`, `medium`, `small`, `tiny`) and `pseudo`, taken from the source breakpoint data.
4. On name collision, use `update_style` (overwrite — source wins).
5. Save `.tmp/style-map.json` mapping source class name path → target style name/ID.

### Phase E — Verify & Report
1. Re-read the target's variable collections + styles; confirm counts match the source.
2. Save `.tmp/copy-report.json`: counts created/updated/skipped, any unmapped variable references, and warnings.
3. Spot-check a few key classes in the target Designer (a heading, a button, a section) to confirm tokens and breakpoints resolve correctly.

## Output Artifacts
- `deliver/process/copy-style-guide/.tmp/source-variables.json` — source variable collections + variables (all modes)
- `deliver/process/copy-style-guide/.tmp/source-styles.json` — source styles (all breakpoints)
- `deliver/process/copy-style-guide/.tmp/variable-id-map.json` — source variable ID → target variable ID
- `deliver/process/copy-style-guide/.tmp/style-map.json` — source class name path → target style name/ID
- `deliver/process/copy-style-guide/.tmp/copy-report.json` — created/updated/skipped counts, unmapped references, warnings

When run inside a client engagement, mirror these paths under `deliver/[client-name]/workflows/copy-style-guide/.tmp/`.

## Technical Setup
- **Executor status**: Directive-driven (Claude follows the Phase A–E protocol via the Webflow MCP). The `.py` executor is an **offline** helper only — it diffs `source-*.json` against target reads and emits `copy-report.json`; it never mutates Webflow (`mutates_webflow: false`).
- **Active integrations**: Webflow MCP (`data_sites_tool`, `variable_tool`, `style_tool`).
- **MCP access & safeguards**:
  - This is a process **template**. When run for a specific engagement, read the nearest `mcp-access.md` and its referenced profile before any write.
  - Confirm Webflow runtime auth via `/mcp` and that both sites are in the authorized workspace before any write.
  - Writes mutate a live Webflow site — confirm the target `siteId` with the user before Phase C.
- **Data boundary**: Do not store Webflow credentials, OAuth tokens, or session values in workflow files or `.tmp/` artifacts.

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md - Section 4](../../../SYSTEM_RULES.md).
- **`.tmp/` folder**: Commit lightweight artifacts (the JSON maps and report) that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming**: `deliver/process-copy-style-guide-<change>`, or `deliver/[client-name]-copy-style-guide-<change>` once cloned into a client folder.
- **Commit discipline**: Atomic commits with descriptive messages. When this directive changes, update the [PROCESS_INDEX.md](../PROCESS_INDEX.md) Supporting Workflows entry in the same commit.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
