# Noam Nizrad - Prospect Overview

## Status
**Brief received / pre-proposal.** Inbound brief delivered as a Google Slides presentation. Not yet qualified into a sent proposal; no contract.

## Candidate Offer
**Development from Scratch** - full Figma design + Webflow build, from zero.
- Canonical offer: [offer-development-from-scratch.md](../../process/01-define-offers/offers/offer-development-from-scratch.md)
- This is a *candidate* selection, confirmed during proposal/discovery and finalized at contract onboarding.

## Scope Estimate
| Field | Value |
|---|---|
| Prospect | Noam Nizrad |
| Lead source | Inbound brief (Google Slides) |
| Candidate offer | Development from Scratch |
| Pages | **4** — Home + 3 inner pages (see [sitemap.md](sitemap.md)) |
| Pricing | `4 × $400` = **$1,600** (per [PRICING_TIMELINE_RULES.md](../../PRICING_TIMELINE_RULES.md)) — confirm at proposal |
| Timeline | `4 × 2 days` = **8 days** (per [PRICING_TIMELINE_RULES.md](../../PRICING_TIMELINE_RULES.md)) — confirm at proposal |

## Per-Prospect Workflows
Instances under `workflows/`, pointing to the canonical templates in `sales/process/`:
| # | Workflow | Status |
|---|---|---|
| 00 | [Prospect Intake](../workflows/00-prospect-intake/00-prospect-intake.md) | Active — awaiting brief assets |
| 02 | [Send Proposal](../workflows/02-send-proposal/02-send-proposal.md) | Pending brief analysis |
| 03 | [Discovery Meeting](../workflows/03-discovery-meeting/03-discovery-meeting.md) | Pending |
| 04 | [Contract Onboarding](../workflows/04-contract-onboarding/04-contract-onboarding.md) | Pending |

`01-define-offers` is global and not instantiated here.

## Asset Locations
- **Brief drop-zone:** `workflows/00-prospect-intake/.tmp/brief/` — Plain Text export + flagged slide PNGs.
- **Brief analysis output:** `workflows/00-prospect-intake/.tmp/brief-analysis-noam-nizrad.md` (produced by [analyze-brief](../../process/analyze-brief/analyze-brief.md)).

## Open Questions
- ~~How many pages / templates?~~ **Resolved: 4 pages** (Home + 3 inner) — see [sitemap.md](sitemap.md).
- Client-supplied assets pending: hero 3D device + animation, Israel coverage map, several icons. Delivery dates?
- Two non-standard components to scope: animated exploded-device hero + warranty serial-number lookup (backend/catalog connection).
- Is content ready, or does the client need copywriting? (Inner Page 2 has 2 `X?` placeholders; Inner Page 3 has 2 placeholder blurbs.)
- Which design-system reference fits the brand direction?
- Client's timeline / launch expectation?
- Confirmed design tool = Figma, build platform = Webflow?

## Version Control
- All changes to this document must follow the version control rules in [SYSTEM_RULES.md](../../../SYSTEM_RULES.md).
- **Branch naming:** `sales/noam-nizrad-<change>`
- **Commit discipline:** Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting:** Hostinger VPS
- **OS:** Ubuntu 24.04 LTS
