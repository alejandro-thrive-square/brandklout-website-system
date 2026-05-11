# Giovanni Serrano — Project Overview

## Selected Offer
**Development from Scratch** — Full design + Webflow build

## Approved Scope
- **4 pages total:** Home (index) + 3 service sub-pages (Invest, Scale, Develop)
- **2 unique Figma designs:** Home page + Service page template (Invest, Scale, Develop share structure)
- Client provided HTML wireframes (desktop-first) as information architecture source
- Client provided brand guidelines v4.0 (colors, typography, voice)
- Cloud design used to produce improved design system + 2 homepage variants (A/B)

## Project Details
| Field | Value |
|---|---|
| Client | Giovanni Serrano |
| Domain | giovanniserrano.com |
| Industry | Multifamily real estate investment & development (San Diego) |
| Pages | 4 (1 home, 3 service templates) |
| Design deliverable | 2 Figma pages (home + service template) |
| Offer | Development from Scratch |
| Pricing | 4 pages x $400 = $1,600 |
| Timeline | 4 pages x 2 days = 8 days |

## Routed Workflows
| # | Workflow | Status | Notes |
|---|----------|--------|-------|
| 00 | Client Delivery Initialization | Complete | This document |
| 01 | Wireframe | Adapted | Client provided HTML wireframes; IA validation only |
| 02 | Graphic Resources | Required | Process brand guidelines, extract assets |
| 03 | Design | Required | Cloud design variants already created; formalize in Figma |
| 04 | Content & SEO | Required | Copy locked in HTML; needs metadata, schema, alt text |
| 05 | Webflow Build | Required | Full build from approved designs |
| 06 | QA | Required | Full-site QA |
| 07 | Launch | Required | DNS, SSL, publish |
| 08 | Handoff & Support | Required | Editor training, 3-week support |

## Asset Locations
- **Client handoff:** deliver/giovanni-serrano/workflows/01-wireframe/.tmp/client-handoff/
  - index.html, invest.html, scale.html, develop.html (HTML wireframes)
  - giovanni_brand_guidelines_v4.pdf (brand guidelines)
  - WEBFLOW_DEVELOPER_BRIEF.md (detailed build brief)
- **Graphic resources:** deliver/giovanni-serrano/workflows/02-graphic-resources/.tmp/
  - asset-inventory.json, asset-direction.md, missing-assets.md
  - extracted Gio photo, logo files, source/licensing notes
- **Design system and variants:** deliver/giovanni-serrano/workflows/03-design/.tmp/
  - Giovanni Serrano - Design System.html (main design system)
  - design-system.html (alternate design system)
  - scroll-cinema.html (scroll animation variant)
  - variant-a.html (homepage variant A)
  - variant-b.html (homepage variant B)
  - service-template-invest.html, service-template-scale.html, service-template-develop.html
  - canvas/design-canvas.jsx (canvas component)

## Setup Items Needed
- [ ] Webflow workspace access
- [ ] Domain registrar access (DNS configuration)
- [ ] Gio's photo asset (currently base64-embedded in HTML — extract and upload)
- [ ] Logo files (if any beyond wordmark)
- [ ] Client sign-off on homepage variant selection (A or B)

## Open Questions
- Which homepage variant does the client prefer — A or B?
- Does Gio have additional photos beyond the one embedded in the About section?
- Any preference on CMS timing for Testimonials (currently placeholder)?

## Version Control
- All changes to this document must follow the version control rules in [SYSTEM_RULES.md](../../../SYSTEM_RULES.md).
- **Branch naming:** deliver/giovanni-serrano-<change>
- **Commit discipline:** Atomic commits with descriptive messages. One logical change per commit.

## Infrastructure
- **Hosting:** Hostinger VPS
- **OS:** Ubuntu 24.04 LTS
