# CENTRA — Project Overview

> [!NOTE]
> **Pre-contract.** This Deliver workspace was opened early to produce a **wireframe up front as a sales value-add** for the inbound brief. No contract is signed yet. Full delivery (design → build → launch) begins only after signing, per [DELIVER_SYSTEM_RULES.md](../../DELIVER_SYSTEM_RULES.md). Sales tracking lives under [sales/noam-nizrad/](../../../sales/noam-nizrad/docs/prospect-overview.md).

## Client
- **Company:** CENTRA — *"Israel's leading company for the repair and installation of electrical & electronic products"* (official installer for Samsung). Field-service sub-brand: **EFFECTIVE ROBOTICS**.
- **Prospect contact:** Noam Nizrad.
- **Language / direction:** Hebrew, **RTL**.

## Scope (from brief)
- **4 pages:** Home (5 sections) + EFFECTIVE ROBOTICS + CENTRA Installations + Special / Government Projects.
- **Offer:** Development from Scratch (Figma design + Webflow build).
- **Pricing / timeline:** `4 × $400` = $1,600 | `4 × 2 days` = 8 days (per [PRICING_TIMELINE_RULES.md](../../../sales/PRICING_TIMELINE_RULES.md)).
- **Source brief & sitemap:** [sales/noam-nizrad/docs/sitemap.md](../../../sales/noam-nizrad/docs/sitemap.md).

## Custom components to scope (beyond standard blocks)
- Animated/interactive **exploded-device 3D hero** (chip + "fixing" hand) — client supplies 3D object after approval.
- **Warranty serial-number lookup** — needs backend/catalog connection.
- Animated **counters** + **moving logo gallery**.

## Pending client assets
- Hero 3D object, Israel coverage map image, section icons.
- Placeholder copy: 2 `X?` expertise cards (Installations), 2 project blurbs (Special Projects).

## Workflows instantiated
| # | Workflow | Status |
|---|---|---|
| 02 | [Wireframe](../workflows/02-wireframe/02-wireframe.md) | Active — pre-sale wireframe draft |
| 16 | [Vercel Deployment](../workflows/16-vercel-deployment/16-vercel-deployment.md) | ✅ Live — https://centra-two.vercel.app (project `centra`, webzite-studio team) |

## Version Control
- Follows the version control rules in [SYSTEM_RULES.md - Section 4](../../../SYSTEM_RULES.md).
- **Branch naming:** `deliver/centra-<change>`.
- **Commit discipline:** Atomic commits, one logical change per commit.

## Infrastructure
- **Hosting:** Hostinger VPS
- **OS:** Ubuntu 24.04 LTS
