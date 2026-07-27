# Webzite Studio Brand Assets

This folder is the canonical local/VPS-synced hub for Webzite Studio brand assets and the new design-system prototype for the next Webflow site.

## Structure

- `assets/logos/`: Webzite logo, mark, favicon, and webclip variants.
- `assets/brand/`: Brand board and color source images.
- `assets/3d/`: Core Webzite 3D marks and hero graphics.
- `assets/textures/`: Long texture and light noise image for atmospheric sections.
- `assets/motion/`: Lottie headline rotation source files.
- `assets/work-covers/`: Curated case-study cover assets for design exploration.
- `assets/testimonials/`: Avatar assets for proof/testimonial modules.
- `assets/pricing/`: 3D visuals for package or service cards.
- `design-system/`: Static HTML/CSS/JS design-system reference.

## Source Notes

The first pass used:

- Local archive: `C:\Users\pc\Documents\Webzite Studio\Interno\Growth\Our Website`
- Live site: `https://www.webzite.studio`
- Public Upwork URL: `https://www.upwork.com/freelancers/alejandromilano`

Upwork returned a public anti-bot challenge during this scrape, so no private session data or authenticated scraping was used. The design-system copy uses only the public profile link plus the 4.5-star signal already exposed on the Webzite site.

## Design Direction

The design system (v2.0) is an editorial specimen document, not a website mock. It is high-contrast, premium, and motion-led:

- Neutral ink/paper foundation with Webzite yellow, blue, and red accents; usage-proportion and WCAG contrast pairs documented in section 02.
- Seven numbered sections: 01 Logo (clearspace, minimum sizes, misuse), 02 Color, 03 Typography (Inter specimen + token scale), 04 Space & Grid (4px lattice, radii, breakpoints), 05 Motion (easing curves, durations), 06 Components (button state matrix, form fields, tags, case-module anatomy, proof rail), 07 Imagery.
- Interactive tooling: press `G` for a 12-column grid overlay, click any token to copy it, hover easing cards to run the curve, scrollspy index rail, and scroll progress bar.
- Ambient dust canvas and grain overlay for depth, with a full reduced-motion fallback.

Open `design-system/index.html` directly in a browser to review the current prototype. Google Fonts (Inter + JetBrains Mono) load over the network with system-font fallbacks offline.

## Version Control

This folder follows the root-level version control rules in [SYSTEM_RULES.md](../../SYSTEM_RULES.md). Binary/media assets in this folder are ignored by Git and must remain synced through the VPS asset workflow. HTML, CSS, JS, JSON, and Markdown design-system files may be committed when useful.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
