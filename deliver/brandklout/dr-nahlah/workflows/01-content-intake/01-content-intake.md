# Workflow: 01 - Content Intake

## Client-Facing Overview
We collect the business information, page content, proof points, offers, and brand inputs needed to plan the website correctly before wireframing begins.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the Python executor or technical logic of this workflow must be documented here immediately.

## Operational Purpose
Send, receive, and normalize the post-signing website-content questionnaire for projects where Deliver is responsible for building the site from scratch. This workflow is separate from Sales discovery: Sales qualifies the project and hands off scope; Deliver collects the detailed content needed to create the actual website.

## Inputs From Sales / Previous Phase
- Signed contract and approved scope.
- Sales handoff package from `sales/process/04-contract-onboarding`.
- Audience notes, offer fit, known content gaps, and any existing client documents.

## Execution Steps
1. Send the website-content questionnaire to the client.
2. Receive the completed questionnaire and any attached source material.
3. Normalize answers into structured page/content notes, open questions, and reusable copy blocks.
4. Confirm that the minimum content required for wireframing is present before passing the package to Wireframe.

## Client Adaptation — Dr. Nahlah (2026-07-30)

This is a rebuild of an existing, content-rich WordPress site, so intake started from
a **full scrape of the live site** rather than from a blank questionnaire. The
questionnaire still needs to be sent, but only to fill the gaps the scrape cannot
answer (brand decisions, new photography, consents, analytics access).

**Completed**: `scrape_site.py` crawled all 78 URLs in the Yoast sitemap index
(33 pages, 43 posts, 2 category archives; 0 failures) and produced per-page content
extracts, structured JSON, a 284-entry media manifest, and a findings list.

- Scrape artifacts and method: [.tmp/current-site-scrape/](./.tmp/current-site-scrape/)
- Inventory, business data, integrations, and defect list: [.tmp/current-site-scrape/current-site-inventory.md](./.tmp/current-site-scrape/current-site-inventory.md)
- Open questions feeding the questionnaire: [../../docs/project-overview.md](../../docs/project-overview.md)

**Re-run the scrape** (site is live and changing) with:
```bash
python .tmp/current-site-scrape/scrape_site.py
```

**Technical note**: this workstation sits behind a TLS-inspecting proxy whose CA is in
the Windows cert store but not in Python's bundled roots. `scrape_site.py` uses
`truststore` to read the OS trust store; without it every request fails with
`CERTIFICATE_VERIFY_FAILED`. Same root cause as the Vercel CLI needing
`NODE_OPTIONS=--use-system-ca` on this machine.

**Still outstanding for this phase**: send the gap-filling questionnaire, get answers
to the 10 open questions in `project-overview.md`, and decide whether the 284 current
media assets are re-used or replaced.

## Offer-Specific Adaptations
- **Development from Scratch**: Required before Wireframe.
- **Figma to Webflow**: Skipped unless the client also needs missing content gathered or rewritten.
- **Migration to Webflow**: Skipped unless redesign or new-page scope requires new content intake.
- **Webflow Improvements & Updates**: Optional when new pages, sections, or copy-heavy requests need structured intake.
- **AI Site with Claude, Vercel & Airtable**: Required unless the signed handoff already includes an approved content package sufficient for Claude wireframing.

## Technical Setup
- **Executor status**: Placeholder.
- **Future automation**: Generate/send questionnaires, parse returned documents, extract structured content blocks, and flag missing answers.
- **Likely integrations**: Google Docs/Drive, OpenAI/Anthropic, ClickUp.

## Output Artifacts
- `deliver/[client-name]/workflows/01-content-intake/.tmp/questionnaire-template.md`
- `deliver/[client-name]/workflows/01-content-intake/.tmp/client-response/`
- `deliver/[client-name]/workflows/01-content-intake/.tmp/content-intake-summary.md`
- `deliver/[client-name]/workflows/01-content-intake/.tmp/open-questions.md`
- `deliver/[client-name]/docs/content-intake-approval.md` (final, persisted)

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md - Section 4](../../../../../SYSTEM_RULES.md).
- **`.tmp/` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming**: `deliver/[client-name]-content-intake-<change>` once cloned into a client folder.
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
