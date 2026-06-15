# Workflow: 00 - Prospect Intake

## 1. Overview
This workflow turns an inbound lead or client-provided brief into a structured per-prospect workspace **before** proposal writing begins. It is the Sales-side analog of Deliver's [00-client-delivery-initialization](../../../deliver/process/00-client-delivery-initialization/00-client-delivery-initialization.md): it creates `sales/[prospect-name]/` and instantiates the per-prospect Sales workflows from the canonical templates in `sales/process/`.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the prospect-folder structure, workflow-instantiation rules, or future executor logic must be documented here and in [PROCESS_INDEX.md](../PROCESS_INDEX.md) immediately.

## 2. Sales Purpose
- Qualify the lead against the Agency Ideal Client Profile (ICP) before investing in a proposal.
- Give every prospect's brief, analysis, and proposal-in-progress a single, consistent home.
- Select a **candidate offer** from the global offer library so scope, pricing, and timeline can be estimated early.
- Prepare clean inputs for `02-send-proposal`.

## 3. Prospect Workspace Model
- `sales/process/` is the canonical **template** library (this workflow plus `01`–`04`).
- `sales/[prospect-name]/` is a per-prospect **instance** with two subfolders:
  - `docs/` — durable prospect context (`prospect-overview.md`, and `mcp-access.md` when MCPs are used).
  - `workflows/` — copies of the per-prospect Sales workflows, adapted as the prospect progresses.
- Per-prospect workflows are always `02-send-proposal` → `03-discovery-meeting` → `04-contract-onboarding`.
- `01-define-offers` stays **global** (the offer library is shared and owned by that workflow); it is **not** copied into prospect folders.
- Use kebab-case prospect names (e.g. `noam-nizrad`), matching the Deliver client convention.

## 4. Inputs
- Lead source (Upwork job post, referral, inbound email, scraped listing).
- Any client-provided brief (Google Slides / PDF deck, document, or reference site).
- ICP qualification result.

## 5. Execution Steps

### Step 1: Qualify the Lead
- Score the lead against the ICP in [SALES_SYSTEM_RULES.md](../../SALES_SYSTEM_RULES.md).
- Stop here if the lead is out of profile; record why.

### Step 2: Create the Prospect Workspace
- Create `sales/[prospect-name]/docs/` and `sales/[prospect-name]/workflows/`.

### Step 3: Ingest the Brief
- Create the brief drop-zone: `sales/[prospect-name]/workflows/00-prospect-intake/.tmp/brief/`.
- Store the client-provided brief assets there once (e.g. the deck's Plain Text export and any flagged slide images).
- Run the [analyze-brief](../analyze-brief/analyze-brief.md) supporting workflow against that drop-zone to produce `brief-analysis-[prospect].md` token-efficiently.

### Step 4: Select a Candidate Offer
- Map the brief to one offer from `sales/process/01-define-offers/offers/`.
- Record it as a **candidate** `selected_offer`; it is confirmed during proposal and discovery, finalized at `04-contract-onboarding`.

### Step 5: Instantiate Per-Prospect Workflows
- Copy `02-send-proposal`, `03-discovery-meeting`, and `04-contract-onboarding` from `sales/process/` into `sales/[prospect-name]/workflows/`.
- Preserve each workflow's internal shape: `.md` directive, `.py` executor, `TRIGGER_PROMPT.txt`, and `.tmp/`.

### Step 6: Write the Prospect Overview
- Create `sales/[prospect-name]/docs/prospect-overview.md` with: prospect name, lead source, status, candidate offer, scope estimate, pricing/timeline (per [PRICING_TIMELINE_RULES.md](../../PRICING_TIMELINE_RULES.md): `pages × $400`, `pages × 2 days`; dev-only `pages × $200`, `pages × 1 day`), brief-asset locations, and open questions.
- Leave page count and final scope as TBD until the brief analysis resolves them.

## 6. Routing Note
- This workflow is pre-contract. Deliver does **not** start, and `deliver/[prospect-name]/` is **not** created, until the contract is signed and `04-contract-onboarding` has produced the handoff package.

## 7. Technical Setup
- **Executor status**: Placeholder. Future automation can qualify leads, scaffold the prospect workspace, copy workflow templates, invoke brief analysis, and generate `prospect-overview.md`.
- **Likely integrations**: Google Sheets/CRM, Gmail, OpenAI/Anthropic, the page-to-Markdown scraper, and `analyze-brief`.
- **Data boundary**: Do not store credentials or secrets in prospect docs, workflow files, or `.tmp/` artifacts.

## 8. Output Artifacts
- `sales/[prospect-name]/docs/prospect-overview.md`
- `sales/[prospect-name]/workflows/00-prospect-intake/.tmp/brief/` (client-provided brief assets)
- `sales/[prospect-name]/workflows/00-prospect-intake/.tmp/brief-analysis-[prospect].md`
- Instantiated `02`/`03`/`04` workflow folders under `sales/[prospect-name]/workflows/`

## 9. Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md - Section 4](../../../SYSTEM_RULES.md).
- **`.tmp/` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming**: `sales/prospect-intake-<change>` for feature branches.
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.

## 10. Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
