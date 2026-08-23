# Project Overview: workflow-test

> [!WARNING]
> **Internal test project.** This is not a client engagement. It exists to exercise
> the Deliver process pipeline (routing, folder structure, workflow templates,
> executors). No contract, no Sales handoff, no billable scope.

## Summary

| Field | Value |
| :--- | :--- |
| Client | workflow-test (internal) |
| Selected offer | Development from Scratch (chosen as the fullest default path for testing) |
| Status | Initialized 2026-07-28 |
| Handoff source | Synthetic — see `workflows/00-client-delivery-initialization/.tmp/client-handoff/deliver-handoff-workflow-test.md` |
| Timeline | N/A — `pages_or_templates` is TBD; formula is `pages × 2 days` per [PRICING_TIMELINE_RULES.md](../../../sales/PRICING_TIMELINE_RULES.md) |

## Approved Scope
Internal validation of the Deliver microsystem: instantiate a client workspace from
`deliver/process/`, run selected phase workflows against test inputs, and surface any
gaps in directives, executors, or routing docs.

## Routed Workflow Modules
Full `Development from Scratch` path per [OFFER_ROUTING.md](../../process/OFFER_ROUTING.md):

| # | Module | Status |
| :---: | :--- | :--- |
| 00 | client-delivery-initialization | Done (this setup) |
| 01 | content-intake | Copied, not started |
| 02 | wireframe | Copied, not started |
| 03 | graphic-resources | Copied, not started |
| 04 | design | Copied, not started |
| 05 | design-revisions | Copied, not started |
| 06 | content-seo | Copied, not started |
| 07 | webflow-build | Copied whole with converter toolchain (per process rule); `webflow-build.config.json` not yet configured |
| 08 | qa | Copied, not started |
| 09 | launch | Copied, not started |
| 10 | handoff-support | Copied, not started |

Skipped modules: `11`–`17` (not part of the Development from Scratch route).

## Deviations From Standard Initialization
- **No Sales handoff exists.** A synthetic handoff was authored directly in
  `00/.tmp/client-handoff/` and marked as such. Routing validation was run against it.
- **No design-system reference seeded.** `00/.tmp/design-system/` was not created
  because no `selected_design_system_reference` exists. Seed it from
  `deliver/process/design-system-library/` before any `04-design` test run.
- **No `docs/mcp-access.md`.** No MCP usage is scoped yet. If a test exercises the
  Webflow MCP (e.g. a `07-webflow-build` run against a real site), add
  `docs/mcp-access.md` first per [ACCESS_MODEL.md](../../../mcp-servers/ACCESS_MODEL.md).

## Workflow-Owned Asset Locations
- Initial (synthetic) handoff: `workflows/00-client-delivery-initialization/.tmp/client-handoff/`
- Per-phase artifacts: each module's own `.tmp/` folder.

## Open Questions
- Which phases should the test exercise end-to-end, and with what test inputs?
- How many test pages should `pages_or_templates` assume?
- Should a design-system reference be seeded for a design-phase test?
- Should this project be deleted after the test, or kept as a reference instantiation?

## Version Control
- Follows [SYSTEM_RULES.md - Section 4](../../../SYSTEM_RULES.md).
- **Branch naming**: `deliver/workflow-test-<change>`.
- Lightweight `.tmp/` artifacts may be committed; never commit secrets or heavy media.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
