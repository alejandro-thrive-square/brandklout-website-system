# Project Overview — company-1

## Engagement Summary
- **Client**: company-1
- **Selected offer**: `Figma to Webflow` ([offer-figma-to-webflow.md](../../../sales/process/01-define-offers/offers/offer-figma-to-webflow.md))
- **Sales handoff**: [deliver-handoff-company-1.md](../../../sales/process/04-contract-onboarding/.tmp/deliver-handoff-company-1.md)
- **Initialization**: Performed via `00-client-delivery-initialization` directive (manual scaffold).

## Approved Scope
_TBD — pull from Sales handoff once finalized. Capture pages, sections, Webflow features, CMS collections, interactions, breakpoints, and any out-of-scope exclusions._

## Timeline
_TBD — start date, milestone dates, target launch._

## Routed Workflow Modules
Per `deliver/process/OFFER_ROUTING.md` for `Figma to Webflow`:

| # | Module | Status | Notes |
|---|--------|--------|-------|
| 09 | `09-figma-review-build-planning` | Copied | Validates Figma completeness, breakpoints, CMS, components, fonts, assets, licensing before build. |
| 05 | `05-webflow-build` | Copied | Core development: scaffold CMS, build style system, build pages, publish to staging. |
| 06 | `06-qa` | Copied | Visual fidelity, responsiveness, SEO, forms, functionality, accessibility, Lighthouse. |
| 07 | `07-launch` | Copied | DNS, SSL, publish, smoke test. |
| 08 | `08-handoff-support` | Copied | Walkthrough video, handoff packet, 3-week support window. |

## Skipped Phases
| # | Module | Reason |
|---|--------|--------|
| 01 | `01-wireframe` | Figma design is complete; no IA changes scoped. |
| 02 | `02-graphic-resources` | Adapted to asset readiness check inside `09-figma-review-build-planning` (not copied as a standalone phase). |
| 03 | `03-design` | Figma design is complete; no design changes scoped. |

## Optional Phases
| # | Module | Trigger to Include |
|---|--------|--------------------|
| 04 | `04-content-seo` | Copy in if final copy, metadata, alt text, or CMS content readiness needs explicit validation beyond what `09` covers. |

## Setup Items
_TBD — Webflow workspace invite, Figma view access, domain registrar, DNS, analytics, custom font licensing._

## Open Questions
_TBD — resolve before kickoff._

## Folder Layout
- `docs/` — project documentation (this file, plus phase outputs like `qa-report.md`, `walkthrough.md`, `handoff-packet.md`).
- `workflows/` - copied workflow modules listed above. Each preserves `.md`, `.py`, `TRIGGER_PROMPT.txt`, and `.tmp/`; client assets live in the owning workflow `.tmp/` folder.

## Version Control
- All changes to this document must follow the version control rules in [SYSTEM_RULES.md](../../../SYSTEM_RULES.md).
- **Branch naming:** `deliver/company-1-<change>`.
- **Commit discipline:** Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting:** Hostinger VPS
- **OS:** Ubuntu 24.04 LTS
