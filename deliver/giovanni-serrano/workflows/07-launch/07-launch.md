# Workflow: 07 - Launch (Giovanni Serrano)

## Client-Facing Overview
After QA approval, we connect the domain, confirm SSL, publish the site, and run a final smoke test.

## Operational Purpose
Move the QA-approved staging build to production with DNS, SSL, publishing, and post-publish verification.

## Inputs
- Approved QA report with no open critical/high-priority blockers.
- Domain registrar access for giovanniserrano.com.
- Webflow project access and launch timing approval.

## Execution Steps
1. Confirm QA approval, launch window, domain ownership, SSL readiness.
2. Update DNS records and connect giovanniserrano.com in Webflow.
3. Publish to production.
4. Smoke test priority pages:
   - Home: nav, hero, services cards, contact form
   - Invest: full page, FAQ accordion, form with correct goal options
   - Scale: full page, form with correct goal options
   - Develop: full page, form with correct goal options
5. Verify sitemap.xml, robots.txt, and schema markup.
6. Confirm SSL active and HTTPS redirect working.

## Output Artifacts
- deliver/giovanni-serrano/workflows/07-launch/.tmp/dns-check.json
- deliver/giovanni-serrano/workflows/07-launch/.tmp/publish-receipt.json
- deliver/giovanni-serrano/workflows/07-launch/.tmp/post-publish-smoke-test.json

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
- **.tmp/ folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming:** deliver/giovanni-serrano-launch-<change>

## Infrastructure
- **Hosting:** Hostinger VPS
- **OS:** Ubuntu 24.04 LTS
