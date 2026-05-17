# Workflow: 00 - Client Delivery Initialization (Giovanni Serrano)

## Client-Facing Overview
We set up the client delivery workspace after the contract is signed so the project has the right folders, workflow copies, and handoff context before execution begins.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the client folder structure, workflow-copying rules, or future executor logic must be documented here immediately.

## Operational Purpose
Document the completed conversion of Giovanni Serrano's signed handoff into a client-specific Deliver workspace with the routed workflow set required for a Development from Scratch engagement.

## Project Context
- **Client:** Giovanni Serrano
- **Offer:** Development from Scratch
- **Approved scope:** 4 pages, 2 unique templates
- **Timeline:** 8 days using the canonical `pages x 2 days` rule
- **Selected design-system package:** Giovanni Serrano design-system package

## Execution Steps (Completed)
1. Confirmed the signed engagement and Deliver start.
2. Created `deliver/giovanni-serrano/docs/` and `deliver/giovanni-serrano/workflows/`.
3. Stored the initial client handoff once in `00-client-delivery-initialization/.tmp/client-handoff/`.
4. Seeded the selected design-system package in `00-client-delivery-initialization/.tmp/design-system/`.
5. Added `docs/project-overview.md`.
6. Instantiated the routed workflow set required for this project.

## Routing Validation
- `selected_offer`: `Development from Scratch` - valid.
- **Required delivery path:** `00 -> 01 -> 02 -> 03 -> 04 -> 05 -> 06 -> 07 -> 08 -> 09 -> 10`
- **Project-specific execution path:** `00 -> 02 -> 03 -> 04 -> 05 -> 06 -> 07 -> 08 -> 09 -> 10`
- **Skipped module:** `01-content-intake` because the client-provided materials already cover the initial intake need.
- **Adapted module:** `02-wireframe` because client-provided HTML wireframes require validation rather than net-new wireframing.
- **Adapted module:** `04-design` because the selected Claude Design package was already initialized before finalization.

## Asset Boundary
- Initial client-provided files live once in `00-client-delivery-initialization/.tmp/client-handoff/`.
- The selected design-system package lives in `00-client-delivery-initialization/.tmp/design-system/`.
- Later incoming files, generated files, and final workflow assets belong in the `.tmp/` folder of the workflow that receives, produces, or uses them.
- No client-level `assets/` folder is part of the current Deliver structure.

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
- **`.tmp/` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming:** `deliver/giovanni-serrano-init-<change>`

## Infrastructure
- **Hosting:** Hostinger VPS
- **OS:** Ubuntu 24.04 LTS
