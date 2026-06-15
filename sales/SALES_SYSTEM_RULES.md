# Sales Microsystem: Rules & Objectives

The Sales Microsystem is responsible for the pre-contract client lifecycle: defining offers, sending proposals, booking and running discovery meetings, completing contract onboarding, and preparing the handoff package that lets Deliver start after signing.

> [!IMPORTANT]
> **Microsystem Documentation Rule**: Whenever an update is made to the Sales logic, scripts, or workflows, this markdown file and all relevant workflow files within the `sales/` directory **MUST** be updated to reflect the changes.

## 1. Mission Statement
To automate the discovery, qualification, proposal, and contract-readiness process for high-quality leads, ensuring the agency maintains a full pipeline and that every signed client arrives in Deliver with clear scope and strategic context.

## 2. Key Integrations
| Tool/API | Usage |
| :--- | :--- |
| **Apify** | Scraping job posts from Upwork, LinkedIn, and other platforms. |
| **Google Sheets** | Central database for lead tracking, proposal status, and sales process notes. |
| **OpenAI / Anthropic** | Generating personalized proposals, discovery summaries, and handoff packages. |
| **Gmail API** | Sending follow-ups and notifications. |
| **CRM (e.g., HubSpot)** | Storing client data, qualification status, deal stages, and contract readiness. |

### 2.1 MCP Access
Sales MCP usage is usually `prospect` or `workflow` scoped. Before using any MCP in a Sales workflow, agents must read [../mcp-servers/ACCESS_MODEL.md](../mcp-servers/ACCESS_MODEL.md), the closest applicable `mcp-access.md` when one exists, and the referenced profile in `mcp-servers/profiles/`.

Sales workflows that analyze public websites, public job posts, or public listings should follow [prospect-audit.md](../mcp-servers/profiles/prospect-audit.md). Workflows that use CRM, email, proposal, contract, private-session, or authenticated platform MCPs must include a workflow-level `mcp-access.md`. Sending messages, changing CRM stages, submitting proposals, using private sessions, or touching contract/payment systems requires explicit confirmation unless the workflow directive already grants that exact action.

## 3. Core Sales Process
0. **Prospect Intake**: Qualify the lead, create the per-prospect workspace, ingest and analyze any brief, and select a candidate offer.
1. **Define Offers**: Keep the approved service offers current and choose the right offer for each lead.
2. **Send Proposal**: Write and send a personalized proposal based on the selected offer and lead context.
3. **Discovery Meeting**: Book and run the meeting to clarify goals, scope, constraints, and strategy.
4. **Contract Onboarding**: Confirm final scope, contract/payment readiness, setup items, and the Deliver handoff package.

### 3.1 Prospect Workspace Model
Sales mirrors the Deliver per-client model:
- `sales/process/` holds the canonical **templates** (`00-prospect-intake` plus `01`–`04`).
- `sales/[prospect-name]/` is a per-prospect **instance** created by [00-prospect-intake](./process/00-prospect-intake/00-prospect-intake.md), containing `docs/` (durable context such as `prospect-overview.md`) and `workflows/` (copies of `02`/`03`/`04`, adapted as the prospect progresses).
- `01-define-offers` stays **global** and is not copied per prospect. The Deliver client folder is created only after a signed contract.
- Prospect names are kebab-case (e.g. `noam-nizrad`), matching the Deliver client convention.

## 4. Supporting Workflows
- **Lead Scraping**: Periodically scanning for new opportunities.
- **Page-to-Markdown Scraping**: Converting public prospect, competitor, and reference pages into Markdown for agent context and sales analysis.
- **Brief Analysis**: Converting a client-provided brief (Google Slides / PDF deck) into a concise Markdown analysis token-efficiently. See [analyze-brief](./process/analyze-brief/analyze-brief.md).
- **Lead Nurturing**: Automated follow-up sequences for cold or lukewarm leads.

## 5. Global Sales Constraints
- **Personalization**: Proposals must never sound generic. Always reference specific details from the job post, client site, discovery notes, or strategy research.
- **Frequency**: Scraping should be optimized to avoid rate limits (e.g., every 2-4 hours).
- **Quality Gate**: Leads must be qualified against the "Agency Ideal Client Profile" (ICP) before being added to the CRM.
- **Contract Boundary**: Deliver does not start until the contract is signed and Sales has prepared the handoff package.

### 5.1 Pricing & Timeline Constants
All proposals, offer files, and contract scopes must quote per the canonical rates and formulas in [PRICING_TIMELINE_RULES.md](./PRICING_TIMELINE_RULES.md). Never hard-code different numbers in proposal templates or offer files — link to the canonical doc instead.

Quote formula reminder:
- `Cost = pages × $400` (design + development)
- `Duration = pages × 2 days`
- Dev-only engagements (Figma to Webflow): `Cost = pages × $200`, `Duration = pages × 1 day`

## 6. Sales Process Workflows
- Index: [process/PROCESS_INDEX.md](./process/PROCESS_INDEX.md)
- [Prospect Intake](./process/00-prospect-intake/00-prospect-intake.md)
- [Define Offers](./process/01-define-offers/01-define-offers.md)
- [Send Proposal](./process/02-send-proposal/02-send-proposal.md)
- [Discovery Meeting](./process/03-discovery-meeting/03-discovery-meeting.md)
- [Contract Onboarding](./process/04-contract-onboarding/04-contract-onboarding.md)

## 7. Offer Library
The canonical offer files live in `sales/process/01-define-offers/offers/` and are owned by the [Define Offers](./process/01-define-offers/01-define-offers.md) workflow.

- [Development from Scratch](./process/01-define-offers/offers/offer-development-from-scratch.md) - Client has no design or development. Full design + Webflow build.
- [Figma to Webflow](./process/01-define-offers/offers/offer-figma-to-webflow.md) - Client has a finished Figma design. Development only.
- [Migration to Webflow](./process/01-define-offers/offers/offer-migration-to-webflow.md) - WordPress/Shopify to Webflow, including CMS content migration.
- [Webflow Improvements & Updates](./process/01-define-offers/offers/offer-webflow-improvements.md) - Changes, fixes, and additions to an existing Webflow site.
- [AI Site with Claude, Vercel & Airtable](./process/01-define-offers/offers/offer-ai-site-claude-vercel-airtable.md) - AI-assisted coded website route with Claude design/build iterations, Vercel deployment, and scoped Airtable-backed content.

## 8. Supporting Workflow Links
- [Scrape Upwork & Write Proposal](./process/scrape-upwork-sheets-write-proposal/scrape-upwork-sheets-write-proposal.md)
- [Scrape Page to Markdown](./process/scrape-page-to-markdown/scrape-page-to-markdown.md)
- [Analyze Brief](./process/analyze-brief/analyze-brief.md)

## Version Control
- This microsystem is part of a **GitHub repository**. All changes must follow the version control rules defined in [SYSTEM_RULES.md - Section 4](../SYSTEM_RULES.md).
- **Never commit**: `.env` files, secrets, or binary/media assets. Lightweight `.tmp/` artifacts may be committed when useful; heavy assets remain on the VPS.
- **Branch naming**: `sales/<description>` (e.g., `sales/process-restructure`).
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
