# Workflow: 09 - Launch (Giovanni Serrano)

## Client-Facing Overview
After QA is approved, we connect the domain, confirm hosting and SSL, publish the site, and run a final smoke test so the website goes live cleanly.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the Python executor or technical logic of this workflow must be documented here immediately.

## Operational Purpose
Move Giovanni's QA-approved staging build to production with DNS, SSL, publishing, rollback awareness, and post-publish verification.

## Inputs From Sales / Previous Phase
- Approved QA report with no open critical/high launch blockers
- Domain registrar access for `giovanniserrano.com`
- Webflow project access and launch timing approval

## Execution Steps
1. Confirm QA approval, launch window, domain ownership, SSL readiness, and rollback plan.
2. Update DNS records and connect `giovanniserrano.com` in Webflow.
3. Publish to production.
4. Smoke test priority pages, sitemap, robots.txt, forms, and primary CTAs.

## Offer-Specific Adaptations
- **Development from Scratch**: Standard full launch sequence.
- **Figma to Webflow**: Not applicable.
- **Migration to Webflow**: Not applicable.
- **Webflow Improvements & Updates**: Not applicable.

## Output Artifacts
- `deliver/giovanni-serrano/workflows/09-launch/.tmp/dns-check.json`
- `deliver/giovanni-serrano/workflows/09-launch/.tmp/publish-receipt.json`
- `deliver/giovanni-serrano/workflows/09-launch/.tmp/post-publish-smoke-test.json`

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
- **`.tmp/` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming:** `deliver/giovanni-serrano-launch-<change>`

## Infrastructure
- **Hosting:** Hostinger VPS
- **OS:** Ubuntu 24.04 LTS
