# Horizon - Project Overview

## Client Information
- **Client Name**: Horizon
- **Agency**: Farewell Agency
- **Project Start**: 2026-07-02
- **Status**: Active Development

## Project Type
**New Site Build / Section Development**
- Adding new sections to existing Webflow site
- Iterative form and content development

## Platform
- **Primary Platform**: Webflow

## Project Structure
```
deliver/farewell-agency/horizon/
├── docs/                      # Knowledge base, meeting notes, handoff docs
│   ├── project-overview.md    # This file
│   └── mcp-access.md         # MCP permissions and access rules (when needed)
└── workflows/                 # Project-specific automations
    └── (workflow modules)     # Form and section workflows
```

## Active Workflows
| Workflow | Purpose | Status |
|:--------|:--------|:-------|
| **04-design** | Create/update section designs | Ready |
| **07-webflow-build** | Build/publish to Webflow | Ready |
| **08-qa** | Quality assurance & testing | Ready |
| **15-improvement-intake** | Track improvement requests | Ready |

## Brand Assets
- **Logo**: TBD
- **Colors**: TBD
- **Typography**: TBD
- **Imagery Style**: TBD

## Webflow Site Details
- **Site Name**: Horizon
- **Site ID**: TBD
- **Workspace**: Farewell Agency

## Notes
- Project initialized for adding new form sections
- Each section will follow design → review → build → QA cycle
- **2026-07-02**: Generated 6 pasteable home-page sections (Projects, Why Choose Us,
  Testimonials, FAQ, CTA, Footer) recreated from the old site
  (horizonbuildingcorp.com) in the new site's hybrid client-first class system.
  Source: `workflows/04-design/.tmp/new-sections/`; pasteables + guide:
  `workflows/07-webflow-build/.tmp/new-sections/README-PASTE.md`.
- **2026-07-02 (v2)**: Awwwards-style dynamic edition of the same 6 sections
  (`-aw` class suffix, coexists with v1): cursor-preview project index, sticky
  stacking cards, dual marquees, GSAP reveals/parallax, monumental footer
  wordmark. Source: `workflows/04-design/.tmp/new-sections-awwwards/`; pasteables:
  `workflows/07-webflow-build/.tmp/new-sections-awwwards/README-PASTE.md`
  (requires runtime-states CSS in head + custom-code JS before `</body>`).
- **2026-07-02 (CMS experiment)**: Added an experimental static-section-to-CMS
  extension for `07-webflow-build`. It generates reviewable CMS collection,
  import, and binding plans before any Webflow mutation. Directive:
  `workflows/07-webflow-build/cms-section-conversion.md`; planner:
  `workflows/07-webflow-build/cms_section_planner.py`; artifacts:
  `workflows/07-webflow-build/.tmp/cms-section-conversion/`.

## Webflow Site Details (updated)
- **Staging**: https://horizon-build.webflow.io (site ID `6a1f7d0be8345316ba21999c`)
- **Old client site**: https://www.horizonbuildingcorp.com (Webflow, site ID `675b24600dce6f2388670f18`)

## Version Control
- **Branch**: `deliver/horizon-setup`
- **Commit Pattern**: `deliver/horizon-<description>`

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
