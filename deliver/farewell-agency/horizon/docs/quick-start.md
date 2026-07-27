# Horizon - Quick Start Guide

## Iterative Section Build Workflow

### Project Status
🟢 **Active**: Ready for iterative section builds

### Available Workflows

| Workflow | Purpose | When to Use |
|:--------|:--------|:------------|
| **04-design** | Create/update section designs | Starting a new section or revising existing |
| **07-webflow-build** | Build/publish to Webflow | When design is approved and ready to deploy |
| **08-qa** | Quality assurance & testing | Before client delivery or publish |
| **15-improvement-intake** | Track improvement requests | When client sends feedback or new requests |

### Quick Iteration Loop

For each new section or revision:

1. **Start with 04-design**
   - Read the directive: `workflows/04-design/04-design.md`
   - Create your section design (HTML/CSS/JS or Figma → code)
   - Store artifacts in `workflows/04-design/.tmp/`

2. **Review & Refine**
   - Test the section responsively (320px → 1920px)
   - Verify accessibility, SEO basics, performance
   - Iterate until approved

3. **Build (if using Webflow)**
   - Use `workflows/07-webflow-build/07-webflow-build.md`
   - Paste/publish sections to the live site
   - Store build artifacts in `.tmp/`

3a. **Optional: Make a Section CMS-Driven**
   - Use `workflows/07-webflow-build/cms-section-conversion.md`
   - Run `cms_section_planner.py` against the approved section HTML
   - Review `.tmp/cms-section-conversion/[section]/` before any Webflow changes

4. **QA Before Delivery**
   - Run through `workflows/08-qa/08-qa.md` checklist
   - Document test results

### Starting a New Section

Tell me what you want to build:
```
"Let's build a [Section Name] section with [brief description]"
```

Example:
- "Let's build a Hero section with a background image and CTA"
- "Let's build a Services grid showing 3 service cards"
- "Let's build a Contact form with validation"

### File Structure
```
deliver/farewell-agency/horizon/
├── docs/
│   ├── project-overview.md          # Project details
│   └── quick-start.md               # This file
└── workflows/
    ├── 04-design/
    │   ├── 04-design.md             # Design directive
    │   └── .tmp/                    # Design artifacts (HTML, CSS, images)
    ├── 07-webflow-build/
    │   ├── 07-webflow-build.md      # Webflow build directive
    │   └── .tmp/                    # Build artifacts
    ├── 08-qa/
    │   ├── 08-qa.md                 # QA checklist
    │   └── .tmp/                    # QA reports
    └── 15-improvement-intake-audit/
        ├── 15-improvement-intake-audit.md
        └── .tmp/                    # Request tracking
```

### Next Steps

Ready when you are—just tell me which section you want to start with!

## Version Control
This guide follows the root-level version control rules in [SYSTEM_RULES.md](../../../SYSTEM_RULES.md). Commit lightweight documentation and workflow artifacts only. Do not commit secrets or binary/media assets.

## Infrastructure
- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
