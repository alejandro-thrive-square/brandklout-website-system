# Workflow: 02 - Wireframe

## Client-Facing Overview
We turn the approved content package into plain page layouts so everyone can see how the website will be structured before visual design begins. This phase organizes the message, sections, calls to action, and page flow.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the Python executor or technical logic of this workflow must be documented here immediately.

## Operational Purpose
Translate the approved content-intake package into a sitemap and low-fidelity HTML/CSS/JS wireframes that lock information architecture before pixel-level design begins. This module is required for full from-scratch projects and optional for other offers when the approved scope includes new information architecture or page structure.

## Inputs From Sales / Previous Phase
- Approved content-intake summary from `01-content-intake`.
- Sales handoff package from `sales/process/04-contract-onboarding`.
- Audience notes, offer fit, content priorities, and known constraints.

## Execution Steps
1. Confirm page list and template types from the approved content package.
2. Build a sitemap and low-fidelity HTML/CSS/JS wireframes for each unique template.
3. Mark CMS-bound regions and key conversion paths.
4. Send the wireframes to the client for revision.
5. Apply approved corrections, then store the final approved wireframe files before design begins.

## Offer-Specific Adaptations
- **Development from Scratch**: Required after `01-content-intake`.
- **Figma to Webflow**: Skipped unless the Figma file has unresolved IA gaps or the signed scope includes structural redesign.
- **Migration to Webflow**: Required only when the migration includes redesign, major navigation changes, or new page/template architecture.
- **Webflow Improvements & Updates**: Required only for scoped new pages, major new sections, or navigation/IA changes.

## Technical Setup
- **Executor status**: Placeholder.
- **Future automation**: Generate sitemap JSON, create HTML/CSS/JS wireframe packages, pull client comments, and record IA approval.
- **Likely integrations**: Browser tooling, ClickUp, OpenAI/Anthropic.

## Output Artifacts
- `deliver/[client-name]/workflows/02-wireframe/.tmp/sitemap.json`
- `deliver/[client-name]/workflows/02-wireframe/.tmp/wireframe-rationale.md`
- `deliver/[client-name]/workflows/02-wireframe/.tmp/wireframes/*.html`
- `deliver/[client-name]/workflows/02-wireframe/.tmp/client-feedback.json`
- `deliver/[client-name]/workflows/02-wireframe/.tmp/final-wireframes/`
- `deliver/[client-name]/docs/ia-approval.md` (final, persisted)

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md - Section 4](../../../SYSTEM_RULES.md).
- **`.tmp/` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming**: `deliver/[client-name]-wireframe-<change>` once cloned into a client folder.
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
