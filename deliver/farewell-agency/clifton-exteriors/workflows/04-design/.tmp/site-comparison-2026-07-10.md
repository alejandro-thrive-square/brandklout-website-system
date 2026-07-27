# Clifton Exteriors — Live vs Staging Analysis

**Analyzed:** 2026-07-10
**Live reference:** `https://www.cliftonexteriors.com`
**Webflow staging:** `https://clifton-exteriors-lutum.webflow.io`

## Executive Summary

The live WordPress/Elementor site remains the content and information-architecture source. The Webflow staging site is the visual and component-system source. The local build combines them: verbatim client content and route coverage from the live site, with the navy/warm Webflow design language, reusable sections, mega-navigation, and dark footer from staging.

## Live Site Findings

- Platform and structure: WordPress/Elementor with a conventional nested desktop/mobile navigation.
- Primary service routes: Windows, Doors, Roofing, Siding, and Gutters.
- Supporting routes: Insurance Claims, Our Process, About Us, Portfolio, Media, Contact, Employment, Financing, Testimonials, Blog, Pricing, and service locations.
- The live site is the source for long-form service copy, FAQs, process steps, form field requirements, portfolio imagery, reviews, and legacy metadata.
- Navigation prioritizes Services, Insurance Claims, Our Process, About Us, phone contact, and Get a Quote.

## Webflow Staging Findings

- Platform and structure: Webflow with a Relume/Lumos-style `u-` utility system plus Client-First utilities.
- Visual tokens: blue `#243864`, red `#b02034`, warm `#eae1d5`, dark navy `#121c32`, light surface `#faf9f7`, and 1rem rounded section bands.
- Typography: Hanken Grotesk for body/display copy and Erode for serif accents and eyebrows.
- Navigation: custom two-panel mega-navigation. The Services panel contains five exterior services plus the process; the planning panel contains Pricing, Financing, Insurance Claims, and Get a Free Quote. The Company panel contains story, testimonials, portfolio, service areas, blog, and employment.
- Footer: dark navy section with service-area statement, phone/email/address, Get Quote CTA, three link columns, legal/social links, and the large light Clifton wordmark.
- Current staging shell assets:
  - Dark logo: `6a260cc3d597c8e6797e1f57_clifton-sharp.svg`
  - Light footer wordmark: `6a3b00bd1500e9ece1ed5b46_clifton-light.svg`
- The staging Home and Gutters pages already use the current mega-navigation. Contact and some secondary routes previously used an older navigation; the local build normalizes every route to the current shell.

## Local Build Result

- Entry point: `final-design/index.html`.
- Total route files: 20.
- Fifteen bespoke redesign prototypes were preserved.
- Five staging-derived routes were added for complete coverage: Home, Gutters, Contact, Privacy Policy, and Terms of Service.
- `site-shell.js` injects one shared navigation and footer into every route. This keeps the authored page bodies single-root for later Webflow conversion.
- `site-shell.css` provides desktop, tablet, and mobile behavior, including keyboard-accessible dropdown controls, mobile menu, active-route states, and reduced-motion handling.
- All 20 routes reference the shell once; the former staging nav/footer were removed from staging-derived snapshots.
- All local `.html` links resolve to existing files.

## Known Follow-Ups

- The staging Privacy Policy and Terms of Service pages currently contain the placeholder H1 “This is your headline.” The local snapshots preserve that staging state; approved legal headings/copy should replace it before launch.
- Many project images still hotlink the old WordPress host. They must be migrated to Webflow assets before the old host is retired.
- Visual browser QA remains required when an interactive browser surface is available, especially dropdown positioning, mobile navigation, and collisions with page-level CSS.

## Version Control

This artifact follows [SYSTEM_RULES.md — Section 4](../../../../../../SYSTEM_RULES.md). Commit lightweight HTML/CSS/JS/Markdown artifacts only; do not commit binary media or secrets.

## Infrastructure

- **Hosting:** Hostinger VPS
- **OS:** Ubuntu 24.04 LTS
