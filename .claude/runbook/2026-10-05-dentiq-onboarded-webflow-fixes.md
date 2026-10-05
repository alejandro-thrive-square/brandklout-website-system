# 2026-10-05 — Dentiq onboarded (Scenario 6) + two Webflow tooling fixes

## Done
- New client `dentiq` on `bk-dentiq` (Scenario 6). Registered in `deliver/docs/mcp-access.md`
  (site `6a5f81effe0aee1d204818dd`, `dentiq.dental` + `www.`), `CLIENTS.md`, and `clientFolder` in the
  Termly and Elfsight registries. Client work (office hours) is in the client runbook on `bk-dentiq`.
- `tools/webflow-build/wf.mjs`: no longer adds `site_id` to page-scoped Data API actions
  (`get_page_content`, `get_page_freeform_code`, `*_page_scripts`, ...); they failed with an empty error.
- `scenario-6-webflow-sites/02-build`: `set_text` inside a component needs `scope_component_id`;
  hours/address sweep includes the per-page JSON-LD field (`query_pages_schema_markup` /
  `bulk_update_pages_schema_markup`).

## Next
- Dentiq live publish awaits the user's go-ahead (pending edits on the site that are not ours).

## Gotchas
- Webflow's Page Settings schema field prints in `<head>` after the canonical; `get_page_freeform_code`
  returns empty for it. Read it with `query_pages_schema_markup`.

## Version Control
Follows [SYSTEM_RULES.md §5](../../SYSTEM_RULES.md).
