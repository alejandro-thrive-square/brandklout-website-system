# Design Reference Library Index

This is the master index for the committed HTML/CSS/JS design reference library used by the 03-Design workflow phase. Claude reads this library to generate first-draft HTML/CSS/JS prototypes per client, which are then converted to Figma.

> [!IMPORTANT]
> This library lives permanently at `deliver/process/03-design/library/`. It is NEVER copied to client folders. All runtime outputs go to `deliver/[client-name]/workflows/03-design/.tmp/`.

## Style Taxonomy

| Style ID | Description | Token File | Best For |
|:---|:---|:---|:---|
| `modern-saas` | Clean, gradient-rich, technical yet approachable | `tokens-modern-saas.json` | SaaS products, developer tools, fintech |
| `corporate` | Navy/gold, serif accents, trustworthy | `tokens-corporate.json` | Enterprise, consulting, professional services |
| `creative-agency` | Dark backgrounds, neon accents, dramatic | `tokens-creative-agency.json` | Creative studios, agencies, portfolio brands |
| `minimal-portfolio` | Near-white, single accent, maximum whitespace | `tokens-minimal-portfolio.json` | Designers, photographers, personal brands |
| `bold-startup` | Bright corals/blues, playful, energetic | `tokens-bold-startup.json` | Startups, consumer apps, modern brands |
| `luxury` | Deep blacks, cream, gold, premium feel | `tokens-luxury.json` | High-end brands, fashion, premium products |

## Library Structure

```
library/
|-- LIBRARY_INDEX.md              <- You are here
|
|-- foundations/                   Design tokens, typography, spacing, color
|   |-- tokens/                   6 token JSON files + TOKEN_SCHEMA.md
|   |-- typography/               3 type scale CSS files + TYPOGRAPHY_GUIDE.md
|   |-- spacing/                  2 spacing CSS files + SPACING_GUIDE.md
|   |-- color/                    1 base color CSS + COLOR_GUIDE.md
|
|-- sections/                     ~31 self-contained section HTML files
|   |-- heroes/                   6 hero variants
|   |-- navigation/               4 navigation variants
|   |-- features/                 5 feature section variants
|   |-- testimonials/             3 testimonial variants
|   |-- pricing/                  2 pricing variants
|   |-- cta/                      3 call-to-action variants
|   |-- footers/                  3 footer variants
|   |-- content/                  5 content block variants
|   |-- SECTION_INDEX.md          Section catalog with style tags
|
|-- pages/                        10 full-page compositions
|   |-- PAGE_INDEX.md             Page catalog
|
|-- animations/                   10 reusable JS animation modules
|   |-- ANIMATION_INDEX.md        Animation catalog with dependency info
|
|-- styles/                       Shared CSS (reset, utilities, animations)
|   |-- STYLES_GUIDE.md           Usage guide
|
|-- design-systems/               5 brand design philosophy references
    |-- DESIGN_SYSTEMS_INDEX.md   Reference catalog
```

## Usage Rules

### For Claude (Prototype Generation)
1. Read this index to understand available resources.
2. Match the client brief to the closest **Style ID** from the taxonomy above.
3. Select a base token file from `foundations/tokens/`.
4. Merge client brand guidelines (colors, fonts, logo) into the token set.
5. Browse `sections/SECTION_INDEX.md` to pick section patterns that match the wireframe structure.
6. Browse `pages/PAGE_INDEX.md` for full-page composition references.
7. Apply animations from `animations/ANIMATION_INDEX.md` based on project needs.
8. If the client brief matches a known brand style, read the corresponding file in `design-systems/`.
9. Output assembled prototypes to the client's `.tmp/prototypes/` folder.

### HTML File Conventions
- Every section/page HTML file is **self-contained** with inline `<style>` and `<script>`.
- Each HTML file starts with a `<!-- METADATA -->` comment block:
  ```html
  <!-- METADATA
    @style: modern-saas
    @complexity: 3
    @animation-deps: gsap
    @responsive: true
    @description: Split hero with product image and CTA
  -->
  ```
- Placeholder images use `https://picsum.photos/WIDTH/HEIGHT?random=N`.
- Icons are inline SVGs (no external icon libraries).
- Animations use CDN-loaded GSAP, Anime.js, or Lottie (no npm/build step).
- Google Fonts loaded via CDN `<link>` tags.

### Token Conventions
- Token JSON files follow the schema in `foundations/tokens/TOKEN_SCHEMA.md`.
- Token structure is compatible with Figma Variables API for direct import.
- CSS custom properties in HTML files map to token keys: `--color-primary`, `--font-primary`, `--space-md`, etc.

### What This Library Is NOT
- Not a component library or framework (no imports, no build step).
- Not copied to client folders (always referenced from `deliver/process/03-design/library/`).
- Not a replacement for client-specific design decisions (it provides starting points, not final designs).

## Figma Conversion Compatibility
- **html.to.design**: Open any HTML file in a browser, use the html.to.design plugin to import into Figma.
- **Figma MCP API**: Use the Figma MCP tools to create designs programmatically, referencing library patterns.
- **Token import**: Use Figma Variables API to import token JSON files as Figma Variables.

## Version Control
- This library is committed to the repository.
- Changes follow [SYSTEM_RULES.md - Section 4](../../../../SYSTEM_RULES.md).
- Binary assets (images, videos) are NOT committed. The library uses CSS gradients, inline SVGs, and CDN placeholders.
