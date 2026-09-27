# Workflow: 05 - Design Revisions

## Client-Facing Overview
After the first design draft is reviewed, we apply the approved correction list, update the design files, and prepare the final design package for development.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the Python executor or technical logic of this workflow must be documented here immediately.

## Operational Purpose
Own the post-design client correction loop before production build work begins. This workflow receives client feedback, duplicates the approved working design package into a revisions workspace, applies the accepted changes, republishes review outputs, and records final approval.

## Inputs From Sales / Previous Phase
- First-draft design package from `04-design`.
- Required Figma link and Vercel review URL from `04-design`.
- Client correction documents, comments, or revision notes.

## Execution Steps
1. Receive the client correction document or exported comment set.
2. Normalize feedback into page- or component-specific revision notes.
3. Duplicate `04-design/.tmp/final-design/` into `05-design-revisions/.tmp/final-design/` as the editable revision workspace.
4. Apply approved revisions to the copied design package and update linked Figma outputs.
5. Republish the revised design to Vercel for verification.
6. Send the revised Figma and Vercel links for approval, then record the final approved package for the selected production build module.

## Offer-Specific Adaptations
- **Development from Scratch**: Required after Design and before Content & SEO/Webflow Build.
- **Figma to Webflow**: Skipped unless Deliver is also responsible for design correction work.
- **Migration to Webflow**: Required only when redesign work enters a client revision loop.
- **Webflow Improvements & Updates**: Optional for scoped redesign requests that need client signoff before implementation.
- **AI Site with Claude, Vercel & Airtable**: Required after the first Claude Design review and before `17-ai-site-build-airtable` finalizes the coded site package.

## Technical Setup
- **Executor status**: Placeholder.
- **Future automation**: Pull client comments, normalize revision notes, clone final-design packages, update deployment manifests, and record approval state.
- **Likely integrations**: Figma API/MCP, Google Docs/Drive, Vercel CLI, ClickUp.

## Output Artifacts
- `deliver/[client-name]/workflows/05-design-revisions/.tmp/client-feedback/`
- `deliver/[client-name]/workflows/05-design-revisions/.tmp/revision-manifest.json`
- `deliver/[client-name]/workflows/05-design-revisions/.tmp/final-design/`
- `deliver/[client-name]/workflows/05-design-revisions/.tmp/vercel-preview-url.txt`
- `deliver/[client-name]/docs/final-design-approval.md` (final, persisted)

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md - Section 4](../../../SYSTEM_RULES.md).
- **`.tmp/` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming**: `deliver/[client-name]-design-revisions-<change>` once cloned into a client folder.
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
