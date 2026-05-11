# Workflow: 08 - Handoff & Support (Giovanni Serrano)

## Client-Facing Overview
After launch, we give Gio the walkthrough, handoff materials, and 3-week support window to confidently manage the website.

## Operational Purpose
Close the project with documentation, ownership transfer, walkthrough materials, and post-launch support.

## Inputs
- Live production website (giovanniserrano.com).
- Successful post-launch smoke test.
- Final Webflow structure and CMS notes.

## Execution Steps
1. Record a walkthrough covering:
   - CMS editing (Testimonials collection population)
   - Page settings and publishing
   - Basic maintenance (images, copy updates)
   - Contact form notification setup
2. Compile handoff packet:
   - Access notes and credential transfer
   - Support terms (3-week window)
   - Future CMS population guide (Testimonials, Case Studies, Blog)
   - Update process for new requests
3. Confirm 3-week support window and define request submission process.
4. Mark project as delivered.

## Project-Specific Notes
- Gio prefers concise, specific questions and gives short directive answers.
- Reach out directly: giovanni@giovanniserrano.com or 619.617.8584.
- Future CMS collections (Testimonials, Case Studies, Blog) are scaffolded but empty — handoff should include population guidance.

## Output Artifacts
- deliver/giovanni-serrano/workflows/08-handoff-support/.tmp/handoff-checklist.json
- deliver/giovanni-serrano/workflows/08-handoff-support/.tmp/support-window.md
- deliver/giovanni-serrano/docs/walkthrough.md (final, persisted)
- deliver/giovanni-serrano/docs/handoff-packet.md (final, persisted)

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
- **.tmp/ folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming:** deliver/giovanni-serrano-handoff-support-<change>

## Infrastructure
- **Hosting:** Hostinger VPS
- **OS:** Ubuntu 24.04 LTS
