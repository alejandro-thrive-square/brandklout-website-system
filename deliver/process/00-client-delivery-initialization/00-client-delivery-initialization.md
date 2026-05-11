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
- Client name, client ID, approved scope, timeline, access/setup items, and open questions.

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
9. Store client handoff files, source materials, generated files, extracted media, design outputs, and final workflow assets inside the `.tmp/` folder of the workflow that owns or uses them.
10. Update the copied workflow `.md` files only when client-specific scope, skipped modules, adapted behavior, asset locations, or open questions need to be documented.
11. Add `deliver/[client-name]/docs/project-overview.md` with the approved scope, selected offer, routed workflow list, timeline, setup items, workflow-owned asset locations, and open questions.
    - **Estimated duration**: compute from the handoff `pages_or_templates` count using the per-page formula in [PRICING_TIMELINE_RULES.md](../../../sales/PRICING_TIMELINE_RULES.md): `pages × 2 days` for full-build offers, `pages × 1 day` for Figma-to-Webflow. Surface this as the `timeline` field in `project-overview.md`. If the handoff `timeline` differs from the formula output, record both and flag the deviation in `open_questions`.

## Routing Rules
- `deliver/process/` is the canonical template library.
- `deliver/[client-name]/workflows/` contains client-specific workflow instances copied from the template library.
- `00-client-delivery-initialization` is not copied as an execution phase unless the client setup itself needs to be documented inside the client workspace.
- Offer execution order is defined by `deliver/process/OFFER_ROUTING.md`.
- Skipped modules should be noted in `project-overview.md` when their absence affects client expectations or delivery scope.

## Non-Copy Resources
Some process modules contain committed reference resources that must NOT be copied to client folders. These are always referenced from their canonical location in `deliver/process/`.

- **`deliver/process/03-design/library/`**: The design reference library (~75 HTML/CSS/JS/JSON/MD files) is a read-only resource used during Phase 2 of the 03-Design workflow to generate client prototypes. It is never duplicated into client folders. All prototype outputs go to `deliver/[client-name]/workflows/03-design/.tmp/`.

## Technical Setup
- **Executor status**: Placeholder. No automated copying is implemented yet.
- **Future automation**: Read a handoff package, create the client folder tree, copy routed workflow folders, generate `project-overview.md`, and report missing required handoff fields.
- **Likely integrations**: CRM, ClickUp, Google Drive, OpenAI/Anthropic.
- **Data boundary**: Do not store credentials or secrets in client docs, workflow files, or `.tmp/` artifacts.
- **Asset boundary**: Do not create a client-level `assets/` folder by default. Client project assets belong in the owning workflow `.tmp/` folder and persist through VPS `rclone` sync.

## Output Artifacts
- `deliver/process/00-client-delivery-initialization/.tmp/routing-check.json`
- `deliver/process/00-client-delivery-initialization/.tmp/copied-workflows.json`
- `deliver/[client-name]/docs/project-overview.md` (final, persisted)

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md - Section 4](../../../SYSTEM_RULES.md).
- **`.tmp/` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming**: `deliver/process-<change>` for changes to this template workflow.
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
