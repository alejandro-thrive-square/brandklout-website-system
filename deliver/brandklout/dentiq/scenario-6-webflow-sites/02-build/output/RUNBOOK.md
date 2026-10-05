# scenario-6-webflow-sites · 02-build · runbook

Newest run first. Each run: date, what was done (with the commit), what is next, and the gotchas.

## 2026-10-05 · office hours
- **Done:** `read-hours.mjs` (audit), `apply-hours.mjs` (writes + read-back). Footer component, `/contact` table label, Montrose and Hyde Park copy, and JSON-LD on 68 pages changed in the draft. `schema-before.json` is the rollback copy.
- **Next:** nothing in the draft.
- **Gotchas:** `set_text` inside the Footer component needs `scope_component_id`, or it reports success and changes nothing. `wf.mjs` used to add `site_id` to page-scoped actions (`get_page_content`), which failed with an empty error; fixed on main the same day. The `/lp/all-on-4` JSON-LD claimed Mon-Fri 9-5 (never true); now Tue-Fri 7-3.

## Version Control

Follows [SYSTEM_RULES.md §5](../../../../../../SYSTEM_RULES.md).
