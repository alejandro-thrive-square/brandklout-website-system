# Workflow: 03 - Discovery Meeting

## 1. Overview
This workflow owns the booked discovery meeting after a proposal has been sent and the lead is interested. It clarifies goals, constraints, scope, stakeholders, timeline, and decision criteria before contract onboarding begins.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the Python executor or technical logic of this workflow must be documented here immediately.

## 2. Sales Purpose
- Confirm the proposal is aligned with the client's actual business need.
- Understand the audience, positioning, competitors, website goals, and project constraints.
- Produce meeting notes and strategy inputs for contract onboarding and the eventual Deliver handoff.

## 3. Execution Steps

### Step 1: Book Meeting
- Confirm the lead accepted the proposal direction or requested a deeper conversation.
- Schedule the discovery meeting and save date, time, attendees, and channel.
- Prepare questions based on the selected offer and proposal assumptions.

### Step 2: Run Discovery
- Discuss business goals, audience, current pain points, desired outcomes, and success criteria.
- Confirm stakeholders, decision-makers, timeline, budget fit, and platform requirements.
- Review any existing website, Figma file, CMS, integrations, migration needs, or content gaps.

### Step 3: Capture Strategy Notes
- Summarize positioning, sitemap direction, content needs, SEO needs, technical requirements, and risks.
- Review 3-5 competitor or inspiration URLs when relevant.
- Save relevant scraped Markdown, meeting notes, and strategy notes in `.tmp/`.

### Step 4: Prepare Contract Inputs
- Confirm the right offer, final scope assumptions, exclusions, timeline, and next steps.
- Flag anything that must be resolved before contract onboarding.
- Hand the opportunity to `04-contract-onboarding`.

## 4. Technical Setup
- **Executor status**: Placeholder. Future automation can schedule meetings, scrape references, summarize transcripts, and create contract input packages.
- **Likely integrations**: Calendar, Gmail, CRM, sales page-to-Markdown scraper, OpenAI/Anthropic, SEO tools.
- **Data boundary**: Meeting artifacts can inform contract onboarding and delivery, and lightweight `.tmp/` artifacts may be committed when useful.

## 5. Output Artifacts
- `sales/process/03-discovery-meeting/.tmp/meeting-brief-[lead-id].md`
- `sales/process/03-discovery-meeting/.tmp/discovery-notes-[lead-id].md`
- `sales/process/03-discovery-meeting/.tmp/competitor-review-[lead-id].json`
- `sales/process/03-discovery-meeting/.tmp/contract-inputs-[lead-id].md`

## Version Control
- All changes to this workflow must follow the version control rules in [SYSTEM_RULES.md - Section 4](../../../SYSTEM_RULES.md).
- **`.tmp/` folder**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming**: `sales/discovery-meeting-<change>` for feature branches.
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
