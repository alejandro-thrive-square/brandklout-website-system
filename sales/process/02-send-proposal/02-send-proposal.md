# Workflow: 02 - Send Proposal

## 1. Overview
This workflow turns a qualified lead and selected offer into a clear proposal. It is the first active outbound step in the core Sales process after the offer has been defined.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the Python executor or technical logic of this workflow must be documented here immediately.

## 2. Sales Purpose
- Select the best offer for the lead and translate it into a personalized proposal.
- Explain scope, value, timeline, assumptions, and next step clearly.
- Track whether the lead replied, booked a discovery meeting, requested changes, or went cold.

## 3. Execution Steps

### Step 1: Gather Proposal Inputs
- Read the selected offer notes from `01-define-offers`.
- Review the lead source, job post, client website, scraped page content, and any prior conversation.
- Identify the most relevant pain points and desired outcomes.

### Step 2: Draft Proposal
- Select the matching template from `upwork-proposals/` based on the identified offer.
- Swap `[VIDEO_URL]` with a Loom video recorded specifically for the job post or client site.
- Customize the six key points if the default ones do not match the client's situation.
- Swap case study URLs if a more relevant project example is available.
- Tailor the worked example in the pricing & timeline block to the client's likely page count when it is known from the job post (e.g. swap "5 pages" for "8 pages"). Keep the per-page rates and durations exactly as written — they come from [PRICING_TIMELINE_RULES.md](../../PRICING_TIMELINE_RULES.md) and must not be edited inline.
- Do not rewrite the template structure — keep emoji placement and section order identical.

### Step 3: Send Proposal
- Send through the active lead channel, such as Upwork, email, CRM, or another approved inbox.
- Save the sent proposal text and timestamp in `.tmp/`.
- Do not include unsupported promises or scope outside the selected offer.

### Step 4: Track Response
- Mark the proposal as sent, replied, meeting booked, revision requested, won, lost, or nurture.
- If the client is interested, move to `03-discovery-meeting`.
- If the proposal needs changes, return to offer fit before resending.

## 4. Upwork Proposal Templates

Templates live in `upwork-proposals/`. One file per offer type. Each file contains a small metadata block at the top (offer name, when to use, what to swap) followed by plain-text proposal body ready to copy-paste into Upwork.

| File | Offer |
| :--- | :--- |
| `upwork-proposal-figma-to-webflow.md` | Client has a Figma file, needs Webflow development only |
| `upwork-proposal-development-from-scratch.md` | Client needs design + development from zero |
| `upwork-proposal-migration-to-webflow.md` | Client is on WordPress or Shopify and wants to migrate |
| `upwork-proposal-webflow-improvements.md` | Client has a live Webflow site and needs updates or fixes |

**Rules:**
- Never change the emoji placement or section order between proposals.
- `[VIDEO_URL]` must always be replaced before sending. Recording a Loom is mandatory.
- Case study URLs are defaults. Swap them when a more relevant example exists.
- Pricing and timeline numbers in each proposal are sourced from [PRICING_TIMELINE_RULES.md](../../PRICING_TIMELINE_RULES.md). Do not edit per-page rates or durations inline — update the rules file and the proposal templates together.
- Do not add markdown formatting to the proposal body — Upwork renders it as plain text.

## 5. Portfolio Content

Detailed case study data for each portfolio project lives in `portfolio-content/`. Use these files to select the most relevant case study when swapping the default case study URL in a proposal.

| File | Project | Industry | Scope |
| :--- | :--- | :--- | :--- |
| `projects_ivy-rx.md` | Ivy RX | Telehealth / Medical care | Figma to Webflow, 30 pages, Shopify migration, SEO |
| `projects_amble.md` | Amble | Telehealth / Medical care | Figma to Webflow, 30 pages |
| `projects_valiant.md` | Valiant | iGaming / Finance Marketing | Figma to Webflow, 100 page CMS site |
| `projects_mused-agency.md` | Mused Agency | Design agency | Figma to Webflow, 30 pages, site migration |
| `projects_3d-sellers.md` | 3D Sellers | SaaS (eBay tools) | Rebuild 160 page site, speed optimization |
| `projects_wealth-group.md` | Wealth Group | Crypto | Figma to Webflow, 10 pages |
| `projects_verde-energy-group.md` | Verde Energy Group | Renewable energy | Figma to Webflow, 10 pages, WordPress migration |
| `projects_commenting-ai.md` | Commenting AI | SaaS (AI automation) | Design + build, 1 page, 3D assets |
| `projects_video3.md` | Video Three | Video editing agency | Design + build, 7 pages, Lottie/3D |
| `projects_enjoy-marketing.md` | Enjoy Marketing | Marketing agency | Build 7 pages, SEO |
| `projects_michael-sjosten.md` | Michael Sjosten | Film director portfolio | Design + build, 3 pages, complex animations |
| `projects_excellent-facets.md` | Excellent Facets | Diamond supplier | Build 12 pages, third-party integrations |

The `portfolio-links.md` file contains quick-reference links (live website, Figma design, Webflow read-only, PageSpeed) for all projects.

**Selection rules:**
- Pick the 2-3 projects most relevant to the lead's industry, scope, or project size.
- Each project file contains a description, project scope, deliverables, results, and tools used.
- Use the live website URL from `portfolio-links.md` when inserting a case study link into a proposal.

## 6. Technical Setup
- **Executor status**: Placeholder. Future automation can draft proposals, write to Google Sheets/CRM, send email, and update status.
- **Likely integrations**: OpenAI/Anthropic, Gmail API, Upwork, Google Sheets, CRM.
- **Data boundary**: Do not store secrets or credentials in generated artifacts.

## 7. Output Artifacts
- `sales/process/02-send-proposal/.tmp/proposal-draft-[lead-id].md`
- `sales/process/02-send-proposal/.tmp/proposal-sent-[lead-id].md`
- `sales/process/02-send-proposal/.tmp/proposal-status-[lead-id].json`

## 8. Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md - Section 4](../../../SYSTEM_RULES.md).
- **`.tmp/` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming**: `sales/send-proposal-<change>` for feature branches.
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.

## 9. Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
