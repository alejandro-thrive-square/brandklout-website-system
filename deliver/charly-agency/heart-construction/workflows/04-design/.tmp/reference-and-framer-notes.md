# Heart Construction References & Framer Rebuild Notes

## New Client References

- `https://info.lasruinas.com`
- `https://www.myheartconstruction.com`

Screenshots captured with Playwright CLI:

- `screenshots/reference/lasruinas-desktop.png`
- `screenshots/reference/lasruinas-mobile.png`
- `screenshots/reference/heart-current-desktop.png`
- `screenshots/reference/heart-current-mobile.png`

HTML snapshots captured for reference only:

- `reference-lasruinas.html`
- `reference-current-heart.html`

## Reference Takeaways

### Las Ruinas

Use as an inspiration reference for:

- Warm editorial art direction.
- Immersive image-led hero sections.
- Small uppercase section labels.
- Large refined serif headlines.
- Calm spacing, soft neutrals, and brown/earth tones.
- Premium motion feel: understated, not gimmicky.
- Cards and content blocks that feel curated rather than generic.

Do not copy Las Ruinas content, membership structure, spa/bathhouse language, or business-specific claims.

### Current Heart Construction Squarespace Site

Use as the source for brand/visual continuity and migration awareness:

- Existing Heart Construction logo and project photography.
- Current cinematic custom-home imagery direction.
- Current brand feeling: elevated residential builder, Los Angeles, premium homes.
- Existing site sections and assets that may need migration into Framer.

Current-site content such as exact years, review quotes, or claims should be verified before final use if not already present in the approved questionnaire/email source files.

## Design Changes Made

The custom homes landing page has been updated to be more aligned with the references:

- Replaced the abstract blueprint-only hero with a photography-led hero using existing Heart site imagery.
- Kept floating clarity/communication notes as a lightweight interaction layer.
- Added a small visual project strip in the hero to echo the current site project-photography emphasis.
- Preserved the warm editorial tone inspired by Las Ruinas.
- Kept all lead-generation copy custom-home focused.

## Framer Rebuild Direction

This project is now assumed to rebuild the landing page/site in **Framer**, not Squarespace.

Recommended Framer implementation notes:

1. Build the Custom Homes landing page as the first route/page.
2. Recreate the HTML prototype sections as Framer components:
   - Header / Nav
   - Hero / Photo hero
   - Trust row
   - Custom home stakes cards
   - Pre-construction planning stack
   - Interactive process tabs
   - Custom home contexts grid
   - Proof/testimonial block
   - Service areas
   - Lead form / CTA
   - Footer
3. Use Framer interactions for:
   - Scroll reveal.
   - Sticky CTA.
   - Subtle parallax on hero imagery.
   - Hover states on cards/buttons.
   - Tabbed content variants for the project path.
4. Migrate/replace Squarespace-hosted assets with optimized Framer assets before final launch.
5. Confirm lead form destination, CRM/email routing, GA4, and PPC tracking before publishing.
6. Preserve SEO metadata from the current site where relevant, but update the first page around the custom homes keyword target.
7. Plan redirects if any Squarespace URLs are replaced or removed.

## Open Items Before Framer Production

- Confirm which current-site images are approved for reuse.
- Confirm logo asset/source file.
- Confirm phone number and form destination.
- Confirm whether current-site testimonials/reviews may be reused.
- Confirm if current claims such as years of experience are approved for the new page.
- Confirm Framer workspace/access and publish domain plan.

## Version Control

This artifact belongs to `deliver/charly-agency/heart-construction/workflows/04-design/.tmp/`. Follow the root repository and Deliver version control rules. Do not commit secrets, credentials, or heavy binary/media assets.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
