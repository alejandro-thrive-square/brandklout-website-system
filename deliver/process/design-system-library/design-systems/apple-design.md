# Apple Design System Reference

> Philosophical guide for generating Apple-inspired web prototypes. Not a copy-paste template.

## Version Control

| Field       | Value      |
|-------------|------------|
| Version     | 1.0        |
| Created     | 2026-05-07 |
| Last Updated| 2026-05-07 |

---

## Visual Identity

Apple's web presence is **premium, focused, and product-hero-centric**. The website exists to serve the product -- not to demonstrate UI cleverness. Every design decision makes the product look more desirable. The page itself is a stage, and the product is the performer.

Key traits:
- The product is always the hero; UI is invisible
- Cinematic quality -- pages feel like watching a product film
- Extreme focus: one idea per viewport, no competing messages
- Premium through restraint: what is left out is as important as what is included
- Scroll is the primary interaction; the page is a linear narrative

---

## Color Philosophy

### Signature Palette
- **Backgrounds**: Clean white (#FBFBFD) for light sections, deep black (#000000) for dramatic sections
- **Text on light**: Near-black (#1D1D1F) for headings, gray (#86868B) for body and descriptions
- **Text on dark**: White (#F5F5F7) for headings, lighter gray (#A1A1A6) for body
- **Product colors**: The product itself introduces color (iPhone in blue, MacBook in silver, etc.)
- **Accent blue**: (#0066CC) for links and CTAs, used minimally

### Hierarchy Through Color
- **Dramatic section alternation**: White sections and black sections create cinematic rhythm
- The product's own color palette defines the page's feel -- a gold iPhone page feels warm, a midnight MacBook page feels deep
- Backgrounds are solid and clean; never patterned or textured
- Color photography against neutral backgrounds lets the product be the color source
- CTAs are text-links ("Learn more" / "Buy") in blue, not large colored buttons

---

## Typography

### Font Strategy
- **SF Pro Display**: (or system equivalent) for all headings and body text
- **Large display text**: The defining typographic choice -- headings are enormous and bold
- **No monospace**: Technical details are presented in sans-serif, keeping the premium feel
- **No serif**: The system is fully sans-serif, clean and modern

### Sizing and Rhythm
- **Hero headlines**: 56-96px, bold (700-800 weight), often a single short sentence
- **Sub-headlines**: 28-48px, semi-bold, used to elaborate on the hero statement
- **Body descriptions**: 19-21px, regular weight, often gray rather than black
- **Navigation**: 12-14px, compact, not competing with content
- **Bold weight contrast**: Headlines are very bold; body text is regular or light. The contrast is extreme.
- Letter-spacing: tight on large headings (-0.01 to -0.03em), normal on body

---

## Layout Patterns

### Full-Viewport Sections
- **Each section = one screen**: Content is designed to fill a viewport, creating a slideshow effect
- Sections are tall (often 100vh or close to it)
- Very few elements per section: typically one heading, one sub-heading, one image
- This forces absolute clarity about what each section communicates

### Scroll-as-Storytelling
- The page reads like a story: problem, product, feature, feature, feature, call to action
- Each scroll reveals the next chapter
- The user's scroll position controls the narrative pace
- No sidebar navigation; the journey is linear and intentional

### Content Centering
- Text is almost always center-aligned in hero sections
- Product images are centered or given full-bleed treatment
- Max content width for text: ~700-800px (narrower than typical web, focusing the eye)
- Product images can extend beyond text width for visual impact

### Navigation
- Thin, fixed top navigation bar with translucent blur background
- Compact: logo, product links, search, bag -- nothing else
- Navigation recedes in importance; it exists for wayfinding, not engagement
- Sub-navigation (product page tabs) appears below the main nav on product detail pages

---

## Interaction Patterns

### Scroll-Triggered Animations
- **Core interaction model**: Scroll position drives the majority of animations
- Product images rotate, scale, explode, and assemble as the user scrolls
- Text fades in and out based on scroll position
- Specs and features are revealed sequentially through scroll

### Sticky Elements
- Product images stick in the center while descriptive text scrolls past
- Navigation bar remains fixed at the top with backdrop blur
- Comparative data (specs tables) sometimes stick during scroll-through sections

### Parallax Product Shots
- Product moves at a different rate than the background or text
- Creates depth and a sense of physical presence
- Product rotates or shifts perspective slightly on scroll
- Multiple product angles are revealed through scroll progression

### Minimal Interactive UI
- Almost no buttons, toggles, or interactive widgets on product pages
- CTAs are text links ("Learn more >" and "Buy >")
- Color/size selectors on buy pages are the exception -- clean, minimal circular or rectangular swatches
- The page is a viewing experience, not an interactive application

---

## Component Style

### Minimal UI Chrome
- **The product is the interface**: No cards, no badges, no decorative components
- Spec comparisons: clean tables with ample row spacing, no visible borders except subtle gray lines
- Feature lists: icon + short text, spaced generously, never cramped
- Buy CTAs: filled rounded-rect buttons (blue fill, 10-12px radius), compact

### Navigation Components
- Top nav: translucent with backdrop-blur, 44-48px height
- Nav links: small, medium weight, generous horizontal spacing
- Active state: minimal (bold weight or subtle underline)
- Mega-menus (when used): clean grid layouts, product images + names, no visual noise

### Image and Media Treatment
- Product photography: high-resolution, studio-lit, on clean backgrounds
- Lifestyle photography: cinematic, aspirational, shallow depth of field
- Video: autoplay, muted, looped product demos embedded seamlessly
- Images are never contained in cards or bordered frames; they exist on the page itself

### Spec Display
- Two-column or three-column comparison layouts
- Clean icons representing each spec category
- Numbers are large; labels are small
- Ample vertical spacing between spec rows

---

## Animation Approach

### Principles
- **Scroll-linked**: Animations are driven by scroll position, not timers or intersection observers alone
- **Cinematic**: Animations have the quality of a product video, not UI feedback
- **Product reveals**: Animations serve to dramatically present the product
- **Scale and perspective**: Products zoom in, rotate, and shift in 3D space

### Common Patterns
- **Product zoom**: Camera pushes in from full device to detail (screen, chip, material)
- **Exploded view**: Product components separate to show internal engineering
- **Text reveal**: Headings fade in or slide up as scroll reaches their section (20-30px travel)
- **Number counters**: Performance stats count up dramatically (battery hours, processing speed)
- **Color transitions**: Page background smoothly transitions from light to dark between sections
- **Parallax layers**: Product, text, and background move at different scroll speeds

### Performance
- Animations use CSS transforms and opacity exclusively
- Images are optimized and lazy-loaded
- Scroll handlers are throttled or use requestAnimationFrame
- The experience must be butter-smooth; jank destroys the premium feel

---

## When to Reference This System

Use Apple's design philosophy when the client brief involves:

- **Premium consumer products** that need to be showcased dramatically
- **Hardware companies** presenting physical products online
- **Luxury brands** where the aspirational feel matters more than feature lists
- **Product launch pages** designed to build excitement and desire
- **Any product** where the visual/physical design of the product is the primary selling point
- **Brands that want cinematic web experiences** with scroll-driven storytelling
- **High-end services** that want to communicate premium positioning

### Blending Notes
- Pair with Stripe's feature explanation patterns when the product also has a software/platform side
- Pair with Vercel's monochrome discipline for the non-product-hero parts of the page
- Apple's scroll animation techniques can be applied to any design system's content
- Avoid mixing with Notion's warmth on the same page -- Apple's premium and Notion's friendly are different emotional registers
- Avoid mixing with Linear's information density -- Apple shows one thing at a time, Linear shows many
