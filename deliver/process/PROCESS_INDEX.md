# Deliver Process Index

This folder contains the canonical post-contract delivery template library for the Deliver microsystem. Sales owns offer definition, proposal sending, discovery meeting, contract onboarding, and the Deliver handoff package. Deliver starts after signing, then uses the handoff package's normalized `selected_offer` value to initialize a client folder and choose the correct delivery path.

Each numbered module mirrors the standard workflow structure defined in [SYSTEM_RULES.md Section 2.1](../../SYSTEM_RULES.md): `.md` directive, `.py` executor, `TRIGGER_PROMPT.txt`, and a `.tmp/` artifact folder. Module `00` defines client-folder initialization. Modules `01` through `14` are reusable delivery execution templates; [OFFER_ROUTING.md](./OFFER_ROUTING.md) determines which execution modules are copied for each Sales offer.

> [!IMPORTANT]
> **Integrity Rule**: When a phase's logic, naming, output schema, or offer routing changes, update the relevant phase `.md`, this index, and [OFFER_ROUTING.md](./OFFER_ROUTING.md) in the same commit.

## Purpose
- Provide reusable, version-controlled delivery templates for every signed delivery engagement.
- Keep the public-facing process simple while preserving technical setup sections for future automation.
- Let Deliver begin from the Sales handoff package by creating a client-specific workspace, without repeating pre-contract sales discovery.
- Route each signed Sales offer into the correct delivery path.

## Usage
1. Confirm the client has signed and Sales has produced a handoff package.
2. Run the documented manual setup in [00-client-delivery-initialization.md](./00-client-delivery-initialization/00-client-delivery-initialization.md).
3. Read `selected_offer` from the handoff package and validate it against [OFFER_ROUTING.md](./OFFER_ROUTING.md).
4. Identify the required, optional, skipped, and adapted modules for that offer.
5. Copy only the required and scoped execution module folders into `deliver/[client-name]/workflows/` and keep the same internal structure.
6. Fill in the empty `.py` executor and `TRIGGER_PROMPT.txt` for that engagement when automation is needed.
7. Update the cloned `.md` files to reflect offer-specific adaptations, skipped phases, or client-specific deviations.

## Offer-to-Delivery Matrix

| Sales offer | Default start | Required delivery modules | Adapted or optional modules |
| :--- | :--- | :--- | :--- |
| Development from Scratch | `00-client-delivery-initialization` | `00`, then `01` -> `02` -> `03` -> `04` -> `05` -> `06` -> `07` -> `08` | `14` optional for static design previews, client review URLs, or Vercel-based delivery. |
| Figma to Webflow | `00-client-delivery-initialization` | `00`, then `09` -> optional `04` -> `05` -> `06` -> `07` -> `08` | `04` validates content/SEO only when scoped; `01` and `03` are skipped unless scoped; `14` optional for preview deployments. |
| Migration to Webflow | `00-client-delivery-initialization` | `00`, then `10` -> optional `01`/`02`/`03` -> `11` -> `12` -> `05` -> `06` -> `07` -> `08` | `01`, `02`, and `03` apply only for redesign, new IA, or new visual direction; `14` optional for static preview deployments. |
| Webflow Improvements & Updates | `00-client-delivery-initialization` | `00`, then `13` -> `05` -> `06` -> optional `07` -> adapted `08` | `01`-`04` apply only when the approved request needs planning, assets, design, content, or SEO; `14` optional for review URLs or standalone static delivery. |

Use [OFFER_ROUTING.md](./OFFER_ROUTING.md) as the source of truth for required handoff fields, completion criteria, and detailed routing rules.

## Process Modules

The current numbered folders are reusable templates. Module `00` is the setup workflow for turning a Sales handoff into a client folder. The full `01` through `08` sequence remains the default execution path for `Development from Scratch`; other offers assemble a subset or adapted version of these modules, including offer-specific modules `09` through `13` and optional static deployment module `14`.

| # | Phase | Directive |
| :---: | :--- | :--- |
| 00 | Client Delivery Initialization | [00-client-delivery-initialization.md](./00-client-delivery-initialization/00-client-delivery-initialization.md) |
| 01 | Wireframe | [01-wireframe.md](./01-wireframe/01-wireframe.md) |
| 02 | Graphic Resources | [02-graphic-resources.md](./02-graphic-resources/02-graphic-resources.md) |
| 03 | Design | [03-design.md](./03-design/03-design.md) |
| 04 | Content & SEO | [04-content-seo.md](./04-content-seo/04-content-seo.md) |
| 05 | Webflow Build | [05-webflow-build.md](./05-webflow-build/05-webflow-build.md) |
| 06 | QA | [06-qa.md](./06-qa/06-qa.md) |
| 07 | Launch | [07-launch.md](./07-launch/07-launch.md) |
| 08 | Handoff & Support | [08-handoff-support.md](./08-handoff-support/08-handoff-support.md) |
| 09 | Figma Review & Build Planning | [09-figma-review-build-planning.md](./09-figma-review-build-planning/09-figma-review-build-planning.md) |
| 10 | Migration Audit & Plan | [10-migration-audit-plan.md](./10-migration-audit-plan/10-migration-audit-plan.md) |
| 11 | Content Export & Import | [11-content-export-import.md](./11-content-export-import/11-content-export-import.md) |
| 12 | Migration SEO & Redirects | [12-migration-seo-redirects.md](./12-migration-seo-redirects/12-migration-seo-redirects.md) |
| 13 | Improvement Intake & Audit | [13-improvement-intake-audit.md](./13-improvement-intake-audit/13-improvement-intake-audit.md) |
| 14 | Vercel Deployment | [14-vercel-deployment.md](./14-vercel-deployment/14-vercel-deployment.md) |

## Standard Folder Shape (per phase)

```text
[NN-phase-name]/
|-- [NN-phase-name].md         Directive - defines intent, steps, artifacts.
|-- [NN-phase-name].py         Executor - empty in the process source; implemented per-client.
|-- TRIGGER_PROMPT.txt         Trigger prompt - empty in the process source; populated per-client.
`-- .tmp/                      Artifact storage - lightweight files committed; heavy media synced to VPS via rclone.
```

## Non-Copy Resources

Some process modules contain committed reference resources that are NOT copied to client folders during initialization. These resources are always referenced from their canonical location in `deliver/process/`.

| Module | Resource | Path | Rule |
|:---|:---|:---|:---|
| 03-design | Design reference library | `deliver/process/03-design/library/` | Read-only reference. Never copied to client folders. Contains ~75 HTML/CSS/JS/JSON/MD files for prototype generation. See `library/LIBRARY_INDEX.md`. |

## Version Control
- All changes to the delivery process and this index must follow the version control rules in [SYSTEM_RULES.md - Section 4](../../SYSTEM_RULES.md).
- **`.tmp/` folders**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. They exist in the process structure so cloned client workflows have a designated artifact path from day one. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming**: `deliver/process-<change>` for changes to this folder.
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
