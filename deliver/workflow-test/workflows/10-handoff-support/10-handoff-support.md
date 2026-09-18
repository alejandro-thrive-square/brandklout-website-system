# Workflow: 10 - Handoff & Support

## Client-Facing Overview
After launch, we give the client the walkthrough, handoff materials, and support window they need to confidently manage the website. This includes 3 weeks of free support and a path for ongoing updates or new landing pages.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the Python executor or technical logic of this workflow must be documented here immediately.

## Operational Purpose
Close the project with documentation, ownership transfer, walkthrough materials, and post-launch support or subscription recommendations.
For smaller Webflow improvement requests, this module can be reduced to a delivery note, support summary, or retainer update using the release path from `15-improvement-intake-audit`.

## Inputs From Sales / Previous Phase
- Live production website and successful post-launch smoke test.
- Final platform structure, CMS/content notes, credentials transfer needs, and known maintenance recommendations.
- Any support terms promised in the signed agreement.

## Execution Steps
1. Record a walkthrough covering CMS editing, page settings, publishing, and basic maintenance.
2. Compile the handoff packet with access notes, support terms, update process, and ongoing-care recommendations.
3. Confirm the 3-week support window and define how new requests should be submitted.
4. Mark the project as delivered and transition ongoing work to the appropriate subscription or maintenance workflow.

## Offer-Specific Adaptations
- **Development from Scratch**: Provide the full walkthrough, handoff packet, ownership notes, and support window.
- **Figma to Webflow**: Include Webflow Editor training, CMS notes, interaction notes, and any deviations from the Figma file.
- **Migration to Webflow**: Include migrated CMS notes from `13-content-export-import`, redirect status from `14-migration-seo-redirects`, monitoring outcomes, source-platform cutover notes, and any post-launch watch items.
- **Webflow Improvements & Updates**: Provide a concise delivery note or retainer summary covering the approved `13` change list, QA checks, publish status, open risks, and next-request process.
- **AI Site with Claude, Vercel & Airtable**: Include Vercel deployment notes, Airtable editing scope, environment-variable name references, route/SEO caveats, and the support path for future code or content-model changes.

## Technical Setup
- **Executor status**: Placeholder.
- **Future automation**: Generate handoff packets, create walkthrough checklists, schedule support reminders, and open maintenance tasks.
- **Likely integrations**: Loom/Vimeo, ClickUp, Gmail, Webflow API, CRM.

## Output Artifacts
- `deliver/process/10-handoff-support/.tmp/handoff-checklist.json`
- `deliver/process/10-handoff-support/.tmp/support-window.md`
- `deliver/process/10-handoff-support/.tmp/delivery-note.md` (improvements only)
- `deliver/process/10-handoff-support/.tmp/migration-handoff-notes.md` (migration only)
- `deliver/[client-name]/docs/walkthrough.md` (final, persisted)
- `deliver/[client-name]/docs/handoff-packet.md` (final, persisted)

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md - Section 4](../../../../SYSTEM_RULES.md).
- **`.tmp/` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming**: `deliver/[client-name]-handoff-support-<change>` once cloned into a client folder.
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
