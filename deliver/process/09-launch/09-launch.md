# Workflow: 09 - Launch

## Client-Facing Overview
After QA is approved, we connect the domain, confirm hosting and SSL, publish the site, and run a final smoke test so the website goes live cleanly.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the Python executor or technical logic of this workflow must be documented here immediately.

## Operational Purpose
Move the QA-approved staging build to production with DNS, SSL, publishing, rollback awareness, and post-publish verification.
For improvement work, this module is used only when `15-improvement-intake-audit` defines publishing, DNS, or a production release as in scope.

## Inputs From Sales / Previous Phase
- Approved QA report with no open critical/high-priority launch blockers.
- Domain registrar access or client-assisted DNS change plan.
- Webflow project access, production domain, and launch timing approval.

## Execution Steps
1. Confirm QA approval, launch window, domain ownership, SSL readiness, and rollback plan.
2. Update DNS records and connect the custom domain in Webflow.
3. Publish to production.
4. Smoke test priority pages, sitemap, robots.txt, forms, and primary CTAs.

## Offer-Specific Adaptations
- **Development from Scratch**: Run the standard full launch sequence.
- **Figma to Webflow**: Run the standard launch sequence when production launch is included; otherwise store staging delivery approval.
- **Migration to Webflow**: Launch using the redirect and SEO requirements from `14-migration-seo-redirects`, plus source-platform cutover notes from `12-migration-audit-plan`.
- **Webflow Improvements & Updates**: Use only when `15-improvement-intake-audit` includes a publish or production release; otherwise document the staged or completed delivery in handoff/support.

## Technical Setup
- **Executor status**: Placeholder.
- **Future automation**: Verify DNS records, publish via Webflow API, run smoke tests, and store publish receipts.
- **Likely integrations**: Webflow API, DNS tools, registrar APIs, [Playwright Browser Tool](../../../manage/browser-tools/playwright-browser/playwright-browser.md).

## Output Artifacts
- `deliver/process/09-launch/.tmp/preflight/old-site-snapshot/`
- `deliver/process/09-launch/.tmp/dns-check.json`
- `deliver/process/09-launch/.tmp/publish-receipt.json`
- `deliver/process/09-launch/.tmp/post-publish-smoke-test.json`
- `deliver/process/09-launch/.tmp/post-launch-monitoring.md` (migration only)

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md - Section 4](../../../SYSTEM_RULES.md).
- **`.tmp/` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming**: `deliver/[client-name]-launch-<change>` once cloned into a client folder.
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
