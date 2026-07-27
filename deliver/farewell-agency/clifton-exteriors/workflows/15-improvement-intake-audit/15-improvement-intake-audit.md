# Workflow: 15 - Improvement Intake & Audit

## Client-Facing Overview
We review the requested Webflow updates, inspect the current site structure, confirm risks and priorities, and define the delivery or release path before making changes.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the Python executor or technical logic of this workflow must be documented here immediately.

## Operational Purpose
Convert Webflow improvement requests into a scoped implementation plan that avoids unnecessary full-site phases while still protecting existing site behavior.

## Inputs From Sales / Previous Phase
- Signed contract or approved support request.
- Sales handoff package with `selected_offer` set to `Webflow Improvements & Updates`.
- `request_type`, `change_list`, `priority`, `existing_webflow_access`, `engagement_model`, affected URLs, screenshots, Looms, or task-board notes.

## Execution Steps
1. Normalize the approved change list and identify affected pages, CMS collections, components, forms, custom code, and integrations.
2. Audit the existing Webflow structure for implementation risks, naming patterns, dependencies, backups, and regression surface.
3. Confirm whether the request needs design, content/SEO, asset, launch, or handoff modules.
4. Define the release path: staging-only delivery, Webflow publish, scheduled production release, or retainer-cycle update.
5. Produce a scoped implementation plan before `07-webflow-build` begins.

## Technical Setup
- **Executor status**: Placeholder.
- **Future automation**: Parse task-board requests, inspect Webflow project structure, generate change manifests, and create QA checklists.
- **Likely integrations**: Webflow API, ClickUp, Gmail, Loom/Vimeo, OpenAI/Anthropic.

## Output Artifacts
- `deliver/process/15-improvement-intake-audit/.tmp/change-list.json`
- `deliver/process/15-improvement-intake-audit/.tmp/existing-site-audit.md`
- `deliver/process/15-improvement-intake-audit/.tmp/release-plan.md`

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md - Section 4](../../../SYSTEM_RULES.md).
- **`.tmp` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming**: `deliver/[client-name]-improvement-intake-<change>` once cloned into a client folder.
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
