# Heart Construction Design Draft Review

## Draft Created

A custom-home-focused static landing page has been created for Heart Construction. This updates the first iteration so the first page is specifically the Custom Homes landing page and reflects the new direction to rebuild the current Squarespace site in Framer.

Primary files:

- `deliver/charly-agency/heart-construction/workflows/04-design/.tmp/final-design/index.html`
- `deliver/charly-agency/heart-construction/workflows/04-design/.tmp/final-design/styles.css`
- `deliver/charly-agency/heart-construction/workflows/04-design/.tmp/final-design/script.js`

Supporting artifacts:

- `deliver/charly-agency/heart-construction/workflows/04-design/.tmp/final-design/assets/` (current-site project and owner imagery copied into the prototype package)
- `deliver/charly-agency/heart-construction/workflows/04-design/.tmp/style-direction.md`
- `deliver/charly-agency/heart-construction/workflows/04-design/.tmp/design-tokens.json`
- `deliver/charly-agency/heart-construction/workflows/04-design/.tmp/prototype-manifest.json`
- `deliver/charly-agency/heart-construction/workflows/04-design/.tmp/component-spec.json`

## Source Integrity

The Heart Construction draft was checked against the approved source lock. Copy should only derive from:

- `Charly Agency Mail - Fwd_ Document shared with you_ _B2B Questionnaire - Heart Construction.md`
- `Charly Agency Mail - Fwd_ Next Steps & Project Details.md`

Do not borrow copy, positioning, content structure, or client-specific claims from any other workspace. The current draft keeps unverified data as placeholders, including the temporary phone number, form endpoint, photography approval, testimonials, and credentials.

## Design Direction

The draft uses a warm, premium, architectural direction intended to feel clear, calm, organized, and trustworthy. The message now leads with:

> Custom homes built with intention.

The page positions Heart Construction as a planning-led custom home partner for significant residential projects in Los Angeles. After receiving the extracted current-site assets, the hero now uses local project photography, the page includes a selected project photography gallery, and Jason/Asaf owner imagery was added with the user-provided integrity story copy to create a more human, relationship-driven landing page.

## Included Sections

1. Sticky navigation with scroll progress
2. Custom Homes hero with primary consultation CTA
3. Photography-led hero visual using local current-site project assets
4. Trust row
5. Custom home stakes / homeowner pain points
6. Pre-construction planning differentiator with layered cards
7. Owner-led human proof section featuring Jason and Asaf
8. Interactive project path tabs
9. Selected project photography gallery
10. Custom home contexts / related complex residential services
11. Real testimonial slider from the current Heart Construction Squarespace site
12. Greater Los Angeles service areas
13. FAQ / budget clarity section covering construction cost, staying on budget, cost drivers, and avoiding surprises
14. Custom home consultation lead form
15. Sticky CTA
16. Footer with launch requirements

## References and Framer Direction

Client references reviewed:

- `https://info.lasruinas.com`
- `https://www.myheartconstruction.com`

Reference notes, Markdown scrapes, and screenshots:

- `deliver/charly-agency/heart-construction/workflows/04-design/.tmp/reference-and-framer-notes.md`
- `deliver/charly-agency/heart-construction/workflows/04-design/.tmp/reference-markdown/heart-current-squarespace.md`
- `deliver/charly-agency/heart-construction/workflows/04-design/.tmp/reference-markdown/las-ruinas-reference.md`
- `deliver/charly-agency/heart-construction/workflows/04-design/.tmp/reference-markdown/scrape-summary.json`
- `deliver/charly-agency/heart-construction/workflows/04-design/.tmp/conversion-strategy-audit.md`
- `deliver/charly-agency/heart-construction/workflows/04-design/.tmp/screenshots/reference/`

Implementation target: **Framer rebuild**. The prototype should be treated as a high-fidelity direction for Framer sections/components and interactions, not a Squarespace build. The landing page strategy has been rewritten around a stronger conversion flow using the current Heart site as the key reference.

## Interaction Upgrades

- Scroll progress bar
- Reveal-on-scroll animation
- Photography-led hero with local current-site assets, floating notes, and project image strip
- Owner image feature with hover tilt and human trust copy
- Selected project photography gallery with editorial masonry layout
- Service-area layout with neighborhood tags placed around the section copy and subtle scroll parallax depth on desktop
- Enhanced numbered project path tabs with stronger active states
- FAQ accordion for budget and construction-cost objection handling
- Real testimonial slider with previous/next controls, dots, and adaptive card height based on quote length
- Pointer tilt on the hero visual
- Hover lift and shimmer states on cards/buttons
- Interactive project path tabs
- Sticky consultation CTA after initial scroll
- Reduced-motion support

## Playwright QA

Playwright smoke testing was added and run against the static design package.

Test artifact:

- `deliver/charly-agency/heart-construction/workflows/04-design/.tmp/playwright-smoke.js`
- `deliver/charly-agency/heart-construction/workflows/04-design/.tmp/playwright-report.json`

Validated:

- Desktop page load, title, core sections, scroll progress, and sticky CTA
- Interactive project path tabs
- Draft form placeholder-endpoint intercept
- Mobile nav open/close behavior
- Desktop and mobile screenshots via Playwright CLI

Result: all smoke tests passed with no console/page errors. The smoke suite was rerun after adding the local project gallery, owner image section, service-area layout refinements, two-column closing project cards, placeholder phone number, FAQ section, and tab underline removal; desktop/mobile screenshots were regenerated. During screenshot review, the reveal animation was adjusted so below-the-fold sections stay visible in full-page captures while still retaining subtle motion.

## Known Placeholders

The following must be replaced before launch:

- `{{FORM_ENDPOINT}}`
- Replace placeholder phone number `(323) 555-0198` with the confirmed business number
- Final client approval to reuse the current-site project photography and Jason/Asaf owner image in final Framer launch
- Confirmed approval to reuse the current-site testimonials in final Framer launch
- License/credential details, if used
- Any verified years in business, review counts, awards, or certifications

## Client Review Questions

1. Does the overall tone feel premium, clear, and aligned with Heart Construction?
2. Does the custom homes focus feel specific enough for the first landing page?
3. Which custom home neighborhoods should be prioritized in service-area messaging?
4. What real custom home photos, testimonials, and proof points can replace the placeholders?
5. What phone number and form/CRM destination should be connected?
6. Should direct scheduling be connected in addition to the form?

## Version Control

This document is part of the Heart Construction delivery workspace under `deliver/charly-agency/heart-construction/`. Follow the root repository version control rules in `SYSTEM_RULES.md` and the Deliver rules in `deliver/DELIVER_SYSTEM_RULES.md`. Do not commit secrets, `.env` files, credentials, or heavy binary/media assets.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
