# Workflow: 01 - Wireframe (Giovanni Serrano)

## Client-Facing Overview
The client already provided structured HTML wireframes for all 4 pages. This phase validates the information architecture against the project brief rather than creating new wireframes from scratch.

## Operational Purpose
Review and validate the client-provided HTML wireframes for completeness, IA consistency, and alignment with the Webflow Developer Brief. Flag any gaps before design begins.

## Inputs
- deliver/giovanni-serrano/workflows/01-wireframe/.tmp/client-handoff/index.html (Home wireframe)
- deliver/giovanni-serrano/workflows/01-wireframe/.tmp/client-handoff/invest.html (Invest wireframe)
- deliver/giovanni-serrano/workflows/01-wireframe/.tmp/client-handoff/scale.html (Scale wireframe)
- deliver/giovanni-serrano/workflows/01-wireframe/.tmp/client-handoff/develop.html (Develop wireframe)
- deliver/giovanni-serrano/workflows/01-wireframe/.tmp/client-handoff/WEBFLOW_DEVELOPER_BRIEF.md (detailed section breakdown)

## Execution Steps
1. Review all 4 HTML wireframes against the section order documented in the Webflow Developer Brief.
2. Validate sitemap: Home -> /invest -> /scale -> /develop.
3. Confirm shared components across pages: nav, footer, contact form, section eyebrow, card grid, process steps, sample card, CTA band, dark section, FAQ accordion, related teasers.
4. Mark CMS-bound regions: Testimonials section (Reviews), Case Studies (future), Blog/Insights (future).
5. Identify any IA gaps or structural questions for the client.
6. Document IA validation results and request client confirmation before design begins.

## Project-Specific Notes
- HTML wireframes are desktop-first and comprehensive — section-by-section breakdown is already intentional.
- Navigation anchor links preserved: #services, #about, #portfolio, #sample, #reviews, #contact.
- Contact form structure already defined with page-specific goal options.
- No new wireframes needed. This is a validation pass only.

## Output Artifacts
- deliver/giovanni-serrano/workflows/01-wireframe/.tmp/ia-validation-report.md
- deliver/giovanni-serrano/workflows/01-wireframe/.tmp/sitemap.json
- deliver/giovanni-serrano/docs/ia-approval.md (final, persisted)

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
- **.tmp/ folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming:** deliver/giovanni-serrano-wireframe-<change>

## Infrastructure
- **Hosting:** Hostinger VPS
- **OS:** Ubuntu 24.04 LTS
