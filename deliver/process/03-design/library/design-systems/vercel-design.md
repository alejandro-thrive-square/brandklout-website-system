# Vercel Design System Reference

> Philosophical guide for generating Vercel-inspired prototypes. Not a copy-paste template.

## Version Control

| Field       | Value      |
|-------------|------------|
| Version     | 1.0        |
| Created     | 2026-05-07 |
| Last Updated| 2026-05-07 |

---

## Visual Identity

Vercel represents **black-and-white mastery and technical authority**. The design system proves that extreme constraint breeds extraordinary clarity. Every element is stripped to its essence. The visual language says: "we are infrastructure -- reliable, fast, and invisible until you need us."

Key traits:
- Monochrome dominance with surgical precision
- Technical authority through restraint
- Typography-driven hierarchy; color is almost absent
- The design feels engineered, not decorated
- Confidence through simplicity -- nothing needs to justify its existence because nothing unnecessary exists

---

## Color Philosophy

### Signature Palette
- **Primary black**: Pure black (#000000) for backgrounds, text, and primary surfaces
- **Primary white**: Pure white (#FFFFFF) for text on dark, backgrounds in light mode
- **Gray scale**: Precisely defined steps (#111, #333, #666, #888, #999, #EDEDED, #FAFAFA)
- **Single accent**: Blue (#0070F3) for links, active states, and primary CTAs -- the only color in the system
- **Error state**: Red (#EE0000), used only for errors, never decoratively
- **Success state**: Green (#0070F3 to teal range), minimal usage

### Hierarchy Through Color
- **No gradients**: Flat colors only; gradients would undermine the minimal philosophy
- Black vs. white sections create dramatic contrast-based hierarchy
- Gray values do all the heavy lifting for secondary content, borders, and subtle differentiation
- The single blue accent becomes extremely powerful because it is the only chromatic color
- When blue appears, it commands attention precisely because the rest is monochrome

---

## Typography

### Font Strategy
- **Geist Sans**: Custom sans-serif with geometric precision, used for all UI and headings
- **Geist Mono**: Matching monospace font for code, terminal output, technical content
- **No serif**: The system is entirely sans-serif and monospace; serif would be incongruent
- The two-font system (sans + mono) is a core identity element

### Sizing and Rhythm
- Hero text: 48-72px, bold, tight letter-spacing (-0.02 to -0.04em)
- Section headings: 32-40px, semi-bold
- Sub-headings: 20-24px, medium weight
- Body: 16px, regular, comfortable line-height (1.6)
- Code and technical: 14px monospace, slightly reduced line-height
- Size contrast between headings and body is dramatic -- this creates hierarchy without color

---

## Layout Patterns

### Grid and Spacing
- **Centered content**: Max-width ~1100px, horizontally centered with generous side margins
- **Generous vertical rhythm**: Sections separated by 100-160px of space
- **Full-bleed sections**: Background color changes span full viewport width; content stays centered
- **Single-column dominance**: Most content flows in a single column; multi-column is rare and purposeful

### Section Architecture
- Alternating black/white (or dark gray/white) full-viewport sections
- Each section makes one point, shows one feature, or delivers one message
- Feature showcases: centered heading + description, then a contained visual (screenshot, code block, or diagram)
- Footer: clean, organized link columns on a dark background

### Technical Content Layout
- Code blocks are first-class citizens, not afterthoughts
- Terminal-style displays with dark backgrounds, monospace text, and syntax highlighting
- Deployment flow visualizations: linear, step-by-step, left-to-right or top-to-bottom
- Dashboard previews embedded in the page as proof of product capability

---

## Interaction Patterns

### Hover and Focus
- **Sharp**: Hover states are immediate, not gradual
- Background: subtle shift (dark to slightly lighter, or gray underline appears)
- Links: underline appears on hover (not always present by default)
- Cards: border becomes visible or brightens on hover
- No soft transitions on hover -- the response feels direct and mechanical

### Immediate Feedback
- Button clicks provide instant visual response
- Form submissions show immediate state change
- Deployments visualize real-time progress
- No unnecessary loading spinners; content appears or a skeleton is shown

### Navigation
- Top navigation bar: logo left, links center, CTA right
- Clean, no dropdown menus where possible; flat link structure
- Mobile: hamburger menu, but with the same minimalist interior
- Active states: subtle underline or weight change, not background fills

---

## Component Style

### Cards and Surfaces
- **Sharp corners or subtle radius**: 0px to 8px max; never pill-shaped
- Borders: 1px solid, gray (#333 on dark, #EDEDED on light), always visible and precise
- No shadows or extremely minimal shadows
- Cards feel like panels in a grid, not floating objects

### Buttons
- Primary: white text on black background (light mode) or black text on white (dark mode)
- Secondary: outlined with 1px border, transparent background
- Border-radius: 6-8px, consistent
- Height: 36-40px, compact
- The primary button in dark mode (white on black) is the most recognizable Vercel component

### Code Blocks
- Dark background (#000 or #111) regardless of page theme
- Monospace font (Geist Mono), syntax highlighting with muted colors
- Line numbers in subtle gray
- Copy button appears on hover
- Terminal-style blocks with prompt indicators ($)

### Borders and Dividers
- Borders are structural, not decorative
- 1px, consistent, part of the grid system
- Used to define cards, sections, and input fields
- Dashed borders for drop zones or placeholder areas

---

## Animation Approach

### Principles
- **Scroll-triggered**: Major animations are tied to scroll position
- **Reveal-based**: Content fades in or slides in as the user scrolls
- **Deployment-inspired**: Animations reference the deployment pipeline (building, deploying, live)
- Performance is non-negotiable; animations run on GPU-composited properties only

### Common Patterns
- **Fade-in sequences**: Elements appear in sequence as user scrolls (staggered by 50-100ms)
- **Scale transitions**: Content scales from 0.95 to 1.0 on reveal
- **Deployment animations**: Build steps appearing one by one, checkmarks confirming completion
- **Counter animations**: Numbers counting up to demonstrate metrics (speed, scale)
- **Globe/network visualizations**: Animated to show global infrastructure
- Easing: ease-out for reveals, linear for progress indicators

---

## When to Reference This System

Use Vercel's design philosophy when the client brief involves:

- **Developer platforms** and infrastructure tools
- **Technical products** where credibility and authority matter most
- **Minimal brands** that want to stand out through restraint
- **CLI or terminal-adjacent products** with web interfaces
- **Hosting, deployment, or DevOps** products
- **Any product** where the value proposition is speed, simplicity, or reliability
- **Brands that want a monochrome identity** as a differentiator

### Blending Notes
- Pair with Stripe's gradient for a single hero accent moment on an otherwise monochrome page
- Pair with Linear's dark component patterns for dashboard/app interiors
- The Geist typography system works well even when blending with other color philosophies
- Avoid mixing with Notion's warmth or Apple's color photography -- they break the monochrome discipline
