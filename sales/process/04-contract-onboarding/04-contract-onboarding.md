# Workflow: 04 - Contract Onboarding

## 1. Overview
This workflow converts an approved proposal and discovery meeting into a signed engagement. It confirms scope, contract terms, payment/setup steps, and the handoff package Deliver needs to select the correct post-contract delivery path.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the Python executor or technical logic of this workflow must be documented here immediately.

## 2. Sales Purpose
- Finalize scope, timeline, offer fit, assumptions, exclusions, and payment terms.
- Guide the client through contract acceptance and upfront payment.
- Prepare a clean Deliver handoff so post-contract execution starts without repeating discovery.

## 3. Execution Steps

### Step 1: Confirm Final Scope
- Review proposal, discovery notes, selected offer, package details, pages, integrations, and technical constraints.
- Confirm what is included, what is excluded, and what would require a change order.
- Capture final decision-makers and client points of contact.

### Step 2: Prepare Contract
- Create or update the contract with approved scope, timeline, deliverables, payment terms, revision limits, and assumptions.
- Include any platform-specific steps, such as Upwork contract acceptance when applicable.
- Confirm upfront payment requirements before Deliver begins.

### Step 3: Onboard Contract
- Send the contract and track signature/payment status.
- Collect non-secret setup items needed for delivery planning, such as Figma links, Webflow workspace invite, brand assets, domain contact, or content documents.
- Do not store credentials or secrets in repo artifacts.

### Step 4: Deliver Handoff
- Produce a handoff package containing goals, approved scope, normalized `selected_offer`, sitemap direction, audience notes, timeline, constraints, assets, selected design-system reference when applicable, and open questions.
- Include the shared Deliver routing fields: `selected_offer`, `approved_scope`, `timeline`, `pages_or_templates`, `content_status`, `assets_status`, `platform_access_needed`, `launch_or_delivery_expectation`, `selected_design_system_reference`, and `open_questions`.
- For migration offers, also include `source_platform`, `existing_site_url`, `content_volume`, `redirect_required`, and `redesign_scope`.
- For Webflow improvement offers, also include `request_type`, `change_list`, `priority`, `existing_webflow_access`, and `engagement_model`.
- For AI Claude/Vercel/Airtable site offers, also include `runtime_stack`, `airtable_scope`, `dynamic_content_types`, `vercel_launch_expectation`, and `seo_rendering_expectation`.
- Confirm the contract is signed before creating the Deliver client folder.
- Deliver uses `deliver/process/OFFER_ROUTING.md` to select the correct path from this handoff package.

## 4. Technical Setup
- **Executor status**: Placeholder. Future automation can generate contracts, update CRM status, request setup assets, and assemble Deliver handoff packages.
- **Likely integrations**: CRM, Upwork, Gmail, ClickUp, Google Drive, OpenAI/Anthropic.
- **Data boundary**: Contract artifacts may reference business terms, but secrets and credentials must stay out of version-controlled files.

## 5. Output Artifacts
- `sales/process/04-contract-onboarding/.tmp/final-scope-[lead-id].md`
- `sales/process/04-contract-onboarding/.tmp/contract-checklist-[lead-id].json`
- `sales/process/04-contract-onboarding/.tmp/setup-items-[lead-id].md`
- `sales/process/04-contract-onboarding/.tmp/deliver-handoff-[client-id].md`

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md - Section 4](../../../SYSTEM_RULES.md).
- **`.tmp/` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming**: `sales/contract-onboarding-<change>` for feature branches.
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
