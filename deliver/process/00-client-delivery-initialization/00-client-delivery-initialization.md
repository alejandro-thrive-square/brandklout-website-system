# Workflow: 00 - Client Delivery Initialization

## Client-Facing Overview
We set up the client delivery workspace after the contract is signed so the project has the right folders, workflow copies, and handoff context before execution begins.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the client folder structure, workflow-copying rules, or future executor logic must be documented here immediately.

## Operational Purpose
Convert a signed Sales handoff into a client-specific Deliver folder by copying the routed template workflows from `deliver/process/` into `deliver/[client-name]/workflows/`.

This is currently a documented manual structure process. The Python executor and trigger prompt remain empty placeholders until automation is intentionally added.

## Inputs From Sales / Previous Phase
- Signed contract and payment/setup readiness.
- Sales handoff package from `sales/process/04-contract-onboarding/.tmp/deliver-handoff-[client-id].md`.
- Normalized `selected_offer` value that matches `deliver/process/OFFER_ROUTING.md`.
- Client name, client ID, approved scope, timeline, access/setup items, selected design-system reference when applicable, and open questions.

## Execution Steps
1. Confirm the contract is signed and Deliver is allowed to start.
2. Read the Sales handoff package from `sales/process/04-contract-onboarding/.tmp/deliver-handoff-[client-id].md`.
3. Validate `selected_offer` against `deliver/process/OFFER_ROUTING.md`.
4. Create the client root folder: `deliver/[client-name]/`.
5. Create the required client subfolders:
   - `deliver/[client-name]/docs/`
   - `deliver/[client-name]/workflows/`
6. Identify the routed workflow modules for the selected offer.
7. Copy only the required and scoped module folders from `deliver/process/` into `deliver/[client-name]/workflows/`.
8. Preserve each copied workflow's internal structure: `.md` directive, `.py` executor, `TRIGGER_PROMPT.txt`, and `.tmp/`.
9. Create `deliver/[client-name]/workflows/00-client-delivery-initialization/.tmp/client-handoff/`.
10. Store the signed handoff package and all initial client-provided source material once in `00-client-delivery-initialization/.tmp/client-handoff/`.
11. When Deliver owns design creation or redesign, validate `selected_design_system_reference` and copy only that chosen package from `deliver/process/design-system-library/` into `00-client-delivery-initialization/.tmp/design-system/`.
12. Store later incoming files, generated files, extracted media, design outputs, and final workflow assets inside the `.tmp/` folder of the workflow that receives, produces, or uses them.
13. Update the copied workflow `.md` files only when client-specific scope, skipped modules, adapted behavior, asset locations, or open questions need to be documented.
14. Add `deliver/[client-name]/docs/project-overview.md` with the approved scope, selected offer, routed workflow list, timeline, setup items, selected design-system reference when applicable, workflow-owned asset locations, and open questions.
    - **Estimated duration**: compute from the handoff `pages_or_templates` count using the per-page formula in [PRICING_TIMELINE_RULES.md](../../../sales/PRICING_TIMELINE_RULES.md): `pages × 2 days` for full-build offers, `pages × 1 day` for Figma-to-Webflow. Surface this as the `timeline` field in `project-overview.md`. If the handoff `timeline` differs from the formula output, record both and flag the deviation in `open_questions`.

## Routing Rules
- `deliver/process/` is the canonical template library.
- `deliver/[client-name]/workflows/` contains client-specific workflow instances copied from the template library.
- `00-client-delivery-initialization` is not copied as an execution phase unless the client setup itself needs to be documented inside the client workspace.
- Offer execution order is defined by `deliver/process/OFFER_ROUTING.md`.
- Skipped modules should be noted in `project-overview.md` when their absence affects client expectations or delivery scope.

## Design-System Library
- **Source of truth**: `deliver/process/design-system-library/`.
- **Sales routing**: Discovery records the approved `selected_design_system_reference` from this library when Deliver owns design creation or redesign.
- **Initialization behavior**: Copy only the selected package into `deliver/[client-name]/workflows/00-client-delivery-initialization/.tmp/design-system/`.
- **Design workflow behavior**: `04-design` reads the initialized package from `00/.tmp/design-system/` and writes project-specific outputs to its own `.tmp/`.

## Technical Setup
- **Executor status**: Placeholder. No automated copying is implemented yet.
- **Future automation**: Read a handoff package, create the client folder tree, copy routed workflow folders, seed the selected design-system package when applicable, generate `project-overview.md`, and report missing required handoff fields.
- **Likely integrations**: CRM, ClickUp, Google Drive, OpenAI/Anthropic.
- **Data boundary**: Do not store credentials or secrets in client docs, workflow files, or `.tmp/` artifacts.
- **Asset boundary**: Do not create a client-level `assets/` folder by default. Initial client-provided files live once in `00-client-delivery-initialization/.tmp/client-handoff/`; the selected design-system reference lives in `00-client-delivery-initialization/.tmp/design-system/`; later files belong in the workflow `.tmp/` folder that receives, produces, or uses them. Persist heavy assets through VPS `rclone` sync.

## Output Artifacts
- `deliver/process/00-client-delivery-initialization/.tmp/routing-check.json`
- `deliver/process/00-client-delivery-initialization/.tmp/copied-workflows.json`
- `deliver/[client-name]/workflows/00-client-delivery-initialization/.tmp/client-handoff/`
- `deliver/[client-name]/workflows/00-client-delivery-initialization/.tmp/design-system/` (design-owned offers only)
- `deliver/[client-name]/docs/project-overview.md` (final, persisted)

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md - Section 4](../../../SYSTEM_RULES.md).
- **`.tmp/` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming**: `deliver/process-<change>` for changes to this template workflow.
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
