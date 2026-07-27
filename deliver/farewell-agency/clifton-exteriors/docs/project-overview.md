# Clifton Exteriors - Project Overview

## Client Information
- **Client Name**: Clifton Exteriors
- **Agency**: Farewell Agency
- **Project Start**: 2025-06-24
- **Status**: Active - finishing teammate's Webflow build

> [!NOTE]
> The project folder was originally misspelled `clinton-exteriors`; renamed to
> `clifton-exteriors` on 2026-07-06. The client is **Clifton** Exteriors.

## Project Type
**Redesign & Rebuild in Webflow**
- Rebuild the client's old website 1:1 in **content and section structure**, with improved design.
- A teammate already developed most of the Webflow site; we are finishing it.

## Key URLs
- **Old live site (content/structure reference)**: https://www.cliftonexteriors.com
- **Webflow staging (teammate's build)**: https://clifton-exteriors-lutum.webflow.io

## Platform & Method
- **Platform**: Webflow
- **Class system**: **Finsweet Client-First** — analyze the existing Webflow structure and match its conventions exactly (section_ wrappers, padding-global, container-*, text-style/heading-style utilities).
- **Section packaging**: every pasteable section carries two HtmlEmbed elements inside its root — one `<style>` embed and one `<script>` embed — so sections move between pages with zero Page-Settings changes (see `workflows/07-webflow-build/07-webflow-build.md`).

## Current Scope
1. **Improve the reviews section** (light redesign, keep content 1:1).
2. **Create a CTA section** (new).

## Project Structure
```
deliver/farewell-agency/clifton-exteriors/
├── docs/                      # Knowledge base, meeting notes, handoff docs
│   ├── project-overview.md    # This file
│   └── quick-start.md         # Iteration loop guide
└── workflows/
    ├── 04-design/             # Section designs (.tmp/ holds analysis + final-design/)
    ├── 07-webflow-build/      # HTML→Webflow pasteable conversion
    ├── 08-qa/                 # QA checklists
    └── 15-improvement-intake-audit/
```

## Brand Assets
- **Logo**: from old site (see `04-design/.tmp/oldsite-content.md`)
- **Colors / Typography**: follow the teammate's Webflow build tokens (see `04-design/.tmp/staging-analysis.md`)

## Notes
- Iterative section-by-section approach: design → review → build → QA.
- Content is copied 1:1 from the old site; only the design improves.

## Version Control
- **Branch**: `deliver/clifton-exteriors-setup`
- **Commit Pattern**: `deliver/clifton-<description>`

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
