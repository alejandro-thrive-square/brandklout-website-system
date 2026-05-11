# Workflow: 01 - Define Offers

## 1. Overview
This workflow keeps the Sales offer library clear, current, and ready to use before any proposal is written. The canonical offer files live in `sales/process/01-define-offers/offers/` (this workflow owns them); this workflow also defines how agents choose and apply those offers.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the offer structure, offer files, or technical logic of this workflow must be documented here immediately.

## 2. Sales Purpose
- Make sure proposals are built from approved offers instead of improvised scope.
- Help agents choose the right offer before writing to a lead.
- Keep pricing, timelines, deliverables, risks, and client requirements consistent.

## 3. Execution Steps

### Step 1: Review Available Offers
- Read the canonical offer files in `sales/process/01-define-offers/offers/`.
- Match the lead request against the closest offer type.
- If no offer fits, flag the opportunity for manual scope review before proposal writing.

### Step 2: Confirm Offer Fit
- Identify whether the lead needs development from scratch, Figma to Webflow, migration to Webflow, or Webflow improvements.
- Record the normalized `selected_offer` value using the canonical offer title exactly as it should appear in the Deliver handoff.
- Capture any add-ons, exclusions, or constraints that should be mentioned in the proposal.
- Confirm which materials the client must provide.

### Step 3: Prepare Proposal Inputs
- Extract the relevant scope, timeline, pricing model, differentiators, and risks.
- Save the selected offer notes for the proposal workflow.
- Preserve the `selected_offer` value so Contract Onboarding can pass it into Deliver routing without renaming it.
- Do not change offer terms for a single lead unless the offer file is intentionally updated.

### Step 4: Maintain Offer Library
- Update files in `sales/process/01-define-offers/offers/` when service positioning, deliverables, pricing logic, or risk handling changes.
- Keep every offer file aligned with the Sales and Deliver process boundaries.
- Make sure each offer file includes Version Control and Infrastructure sections.

## 4. Technical Setup
- **Executor status**: Placeholder. Future automation can score offer fit, generate proposal inputs, and flag missing offer coverage.
- **Likely integrations**: CRM, Google Sheets, OpenAI/Anthropic, sales page-to-Markdown scraper.
- **Data boundary**: Offer files are version-controlled; lead-specific notes belong in `.tmp/`.

## 5. Output Artifacts
- `sales/process/01-define-offers/.tmp/selected-offer-[lead-id].json`
- `sales/process/01-define-offers/.tmp/offer-fit-notes-[lead-id].md`

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md - Section 4](../../../SYSTEM_RULES.md).
- **`.tmp/` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming**: `sales/define-offers-<change>` for feature branches.
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
