# Sales Process Index

This folder contains the canonical Sales process. It covers the core pre-contract sequence from offer definition through contract onboarding, plus the non-sequential supporting workflows (scrapers and brief analysis). All Sales workflow **templates** live here in `sales/process/`; per-prospect **instances** live at the Sales root (e.g. `sales/[prospect-name]/`).

> [!IMPORTANT]
> **Integrity Rule**: When a sales process phase, offer file, naming rule, or output artifact changes, update both the affected workflow `.md` file and this index in the same change.

## Purpose
- Keep the Sales process ordered, repeatable, and easy for agents to follow.
- Make offers the first source of truth before proposals are drafted.
- Ensure every signed client reaches Deliver with clear scope, setup requirements, and strategic context.

## Process Phases

| # | Phase | Directive |
| :---: | :--- | :--- |
| 00 | Prospect Intake | [00-prospect-intake.md](./00-prospect-intake/00-prospect-intake.md) |
| 01 | Define Offers | [01-define-offers.md](./01-define-offers/01-define-offers.md) |
| 02 | Send Proposal | [02-send-proposal.md](./02-send-proposal/02-send-proposal.md) |
| 03 | Discovery Meeting | [03-discovery-meeting.md](./03-discovery-meeting/03-discovery-meeting.md) |
| 04 | Contract Onboarding | [04-contract-onboarding.md](./04-contract-onboarding/04-contract-onboarding.md) |

## Supporting Workflows
Non-sequential tools that the process phases call as needed. They live flat inside `sales/process/` alongside the numbered phases (mirroring how `deliver/process/` holds non-numbered items such as `design-system-library`), but they are **not** part of the `00`→`04` sequence.

| Workflow | Directive |
| :--- | :--- |
| Analyze Brief | [analyze-brief/analyze-brief.md](./analyze-brief/analyze-brief.md) |
| Scrape Page to Markdown | [scrape-page-to-markdown/scrape-page-to-markdown.md](./scrape-page-to-markdown/scrape-page-to-markdown.md) |
| Scrape Upwork & Write Proposal | [scrape-upwork-sheets-write-proposal/scrape-upwork-sheets-write-proposal.md](./scrape-upwork-sheets-write-proposal/scrape-upwork-sheets-write-proposal.md) |

## Prospect Workspace Model
- `sales/process/` is the canonical **template** library (this index plus `00`–`04`).
- `sales/[prospect-name]/` is a per-prospect **instance** created by [00-prospect-intake](./00-prospect-intake/00-prospect-intake.md), mirroring the Deliver client model. It contains:
  - `docs/` — durable prospect context (`prospect-overview.md`, plus `mcp-access.md` when MCPs are used).
  - `workflows/` — copies of the per-prospect Sales workflows, adapted as the prospect progresses.
- Per-prospect workflows are always `02-send-proposal` → `03-discovery-meeting` → `04-contract-onboarding`.
- `01-define-offers` is **global** (the offer library is shared, owned by that workflow) and is **not** instantiated per prospect.
- Prospect folders use kebab-case names (e.g. `noam-nizrad`), matching the Deliver client convention. Deliver folders are created only after a signed contract.

## Offer Library
The canonical offer files live in `sales/process/01-define-offers/offers/` and are owned by the `01-define-offers` workflow.

- [Development from Scratch](./01-define-offers/offers/offer-development-from-scratch.md)
- [Figma to Webflow](./01-define-offers/offers/offer-figma-to-webflow.md)
- [Migration to Webflow](./01-define-offers/offers/offer-migration-to-webflow.md)
- [Webflow Improvements & Updates](./01-define-offers/offers/offer-webflow-improvements.md)
- [AI Site with Claude, Vercel & Airtable](./01-define-offers/offers/offer-ai-site-claude-vercel-airtable.md)

## Standard Folder Shape

```text
[NN-phase-name]/
|-- [NN-phase-name].md
|-- [NN-phase-name].py
|-- TRIGGER_PROMPT.txt
`-- .tmp/
```

## Version Control
- All changes to the sales process and this index must follow the version control rules in [SYSTEM_RULES.md - Section 4](../../SYSTEM_RULES.md).
- **`.tmp/` folders**: Commit lightweight artifacts that support review, replay, handoff, or agent continuity. They exist in the process structure so workflow artifacts have a designated path. Binary/media assets remain gitignored and synced to the VPS.
- **Branch naming**: `sales/process-<change>` for changes to this folder.
- **Commit discipline**: Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
