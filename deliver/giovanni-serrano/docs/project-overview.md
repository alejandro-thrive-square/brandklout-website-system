# Giovanni Serrano - Project Overview

## Selected Offer
**Development from Scratch** - Full design + Webflow build

## Approved Scope
- **4 pages total:** Home + 3 service pages: Invest, Scale, Develop
- **2 unique design templates:** Home page + shared Service page template
- **Design path:** Claude Design HTML/CSS/JS package
- Client-provided HTML wireframes serve as the approved IA source.
- Client-provided brand guidelines v4.0 and Webflow developer brief seed the design and build work.

## Project Details
| Field | Value |
|---|---|
| Client | Giovanni Serrano |
| Domain | giovanniserrano.com |
| Industry | Multifamily real estate investment and development |
| Pages | 4 |
| Templates | 2 |
| Offer | Development from Scratch |
| Pricing | 4 pages x $400 = $1,600 |
| Timeline | 4 pages x 2 days = 8 days |
| Selected design system reference | Giovanni Serrano design-system package |

## Routed Workflows
| # | Workflow | Status | Notes |
|---|---|---|---|
| 00 | Client Delivery Initialization | Complete | Client workspace, handoff package, and routed workflow set created |
| 01 | Content Intake | Skipped | Existing client materials already cover the initial intake need |
| 02 | Wireframe | Adapted | Validate client-provided HTML wireframes instead of creating new ones |
| 03 | Graphic Resources | Required | Prepare brand and visual assets |
| 04 | Design | Required | Use Claude Design path and initialized design-system package |
| 05 | Design Revisions | Required | Apply approved correction list before development |
| 06 | Content & SEO | Required | Finalize metadata, schema, alt text, and locked copy package |
| 07 | Webflow Build | Required | Build approved designs in Webflow |
| 08 | QA | Required | Full-site QA |
| 09 | Launch | Required | DNS, SSL, publish, smoke test |
| 10 | Handoff & Support | Required | Walkthrough, packet, 3-week support window |

## Asset Locations
- **Initial client handoff:** `deliver/giovanni-serrano/workflows/00-client-delivery-initialization/.tmp/client-handoff/`
  - HTML wireframes: `index.html`, `invest.html`, `scale.html`, `develop.html`
  - `WEBFLOW_DEVELOPER_BRIEF.md`
- **Selected design-system package:** `deliver/giovanni-serrano/workflows/00-client-delivery-initialization/.tmp/design-system/`
- **Graphic resources:** `deliver/giovanni-serrano/workflows/03-graphic-resources/.tmp/`
- **First-draft design outputs:** `deliver/giovanni-serrano/workflows/04-design/.tmp/`
- **Authoritative client correction notes and revised design package:** `deliver/giovanni-serrano/workflows/05-design-revisions/.tmp/`

## Setup Items Needed
- [ ] Webflow workspace access
- [ ] Domain registrar access
- [ ] Final client approval of revised design package

## Open Questions
- Are additional approved photography assets available beyond the current supplied source material?
- When should Testimonials be populated in CMS if real testimonials are not ready before launch?

## Version Control
- All changes to this document must follow the version control rules in [SYSTEM_RULES.md](../../../SYSTEM_RULES.md).
- **Branch naming:** `deliver/giovanni-serrano-<change>`
- **Commit discipline:** Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting:** Hostinger VPS
- **OS:** Ubuntu 24.04 LTS
