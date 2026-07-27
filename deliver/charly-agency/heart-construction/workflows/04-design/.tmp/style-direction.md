# Heart Construction Style Direction

## Source Lock

All copy and positioning for this draft must come only from the two approved Heart Construction Markdown files in the project root:

- `Charly Agency Mail - Fwd_ Document shared with you_ _B2B Questionnaire - Heart Construction.md`
- `Charly Agency Mail - Fwd_ Next Steps & Project Details.md`

Other client workspaces, PDFs, and external assumptions are not approved sources for this project.

## Direction

The current iteration is a custom homes landing page, per client direction. It uses a warm, premium, architectural style that feels calm, organized, and human. The goal is to differentiate Heart Construction from commodity contractor websites by emphasizing custom home planning, trust, communication, and high-value residential expertise.

## Reference-Informed Direction

The client provided `https://info.lasruinas.com` and the current Squarespace site at `https://www.myheartconstruction.com`. The custom homes page now blends:

- Las Ruinas-inspired editorial warmth, large serif headlines, generous spacing, and restrained premium motion.
- Current Heart Construction visual continuity through existing project photography and an image-led hero.
- Framer-first interaction thinking, since the rebuild target is Framer rather than Squarespace.

## Interaction Direction

This iteration elevates the wireframe with lightweight front-end interactions that should map cleanly to Framer:

- Scroll progress bar.
- Reveal-on-scroll sections.
- Photography-led hero with local current-site assets, floating notes, and mini project strip.
- Owner-led human proof section featuring Jason and Asaf with the user-provided integrity story copy.
- Selected project photography gallery before service context cards, with two smaller closing cards instead of one oversized full-row card.
- Centered service-area section with neighborhood tags orbiting the copy and subtle scroll parallax depth.
- Budget FAQ accordion addressing cost, budget control, cost drivers, and avoiding surprises.
- Pointer tilt/parallax on the hero and owner visuals for desktop-capable devices.
- Hover lift/shimmer states on CTAs and cards.
- Interactive project-path tabs via component variants in Framer, with numbered states but no gradient underline.
- Sticky consultation CTA after initial scroll.
- Reduced-motion support for accessibility.

## Visual Principles

- Warm neutrals instead of cold corporate blues.
- Editorial typography for a premium residential feel.
- Spacious layout to signal confidence and clarity.
- Structured cards and timelines to communicate organization.
- Local current-site project photography should lead visual proof; textures and linework stay secondary.
- CTAs are direct but not aggressive.

## Copy Principles

- Lead with `Build With Intention.`
- Explain Heart Construction as a guide through complex residential projects.
- Emphasize pre-construction planning as the key differentiator.
- Speak to homeowner anxieties: budget, timeline, communication, coordination, and choosing the right contractor.
- Avoid small handyman/repair positioning.

## Asset Assumptions

Current-site project photography and the Jason/Asaf owner image have been copied into `final-design/assets/` for the static prototype. A temporary phone number `(323) 555-0198` is shown until the business number is confirmed. Final Framer launch still needs client approval to reuse those images, plus confirmed testimonials, license/credential details, booking link, confirmed phone number, and form endpoint. Placeholder tokens are included in the code where client-provided details should be added.

## Version Control

This artifact belongs to `deliver/charly-agency/heart-construction/workflows/04-design/.tmp/`. Follow the root repository and Deliver version control rules. Do not commit secrets, credentials, or heavy binary/media assets.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
