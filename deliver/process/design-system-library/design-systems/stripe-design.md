# Stripe Design System Reference

> Philosophical guide for generating Stripe-inspired prototypes. Not a copy-paste template.

## Version Control

| Field       | Value      |
|-------------|------------|
| Version     | 1.0        |
| Created     | 2026-05-07 |
| Last Updated| 2026-05-07 |

---

## Visual Identity

Stripe communicates **technical authority wrapped in approachability**. The overall impression is clean, precise, and confident without being cold. Every surface feels engineered yet inviting. The brand balances developer credibility with business sophistication -- a rare duality.

Key traits:
- Professional but never corporate
- Technical depth presented with visual clarity
- Gradient-rich surfaces that feel modern without being trendy
- Every element earns its place; nothing is decorative without purpose

---

## Color Philosophy

### Signature Palette
- **Primary gradients**: Purple-to-blue (#635BFF to #80B4FF), teal-to-green, warm orange-to-pink
- **Backgrounds**: Very light grays (#F6F9FC) or clean whites (#FFFFFF)
- **Text**: Near-black (#0A2540) for headings, medium gray (#425466) for body
- **Accent usage**: Gradients are reserved for hero elements, CTAs, and illustration; the rest of the UI stays restrained

### Hierarchy Through Color
- Background tints define content zones (alternating white and light gray sections)
- Color saturation increases toward interactive and focal elements
- Gradients draw the eye to the single most important element per section
- Status colors are muted and contextual, never garish

---

## Typography

### Font Strategy
- **Headings**: Large, bold, clean sans-serif (system fonts or custom cuts of fonts like Inter/Sohne)
- **Body**: Regular weight, generous line-height (1.5-1.7), optimized for readability
- **Code/Technical**: Monospace font for code snippets, slightly smaller size, used in-context alongside prose

### Sizing and Rhythm
- Hero headings: 48-64px, bold (600-700 weight)
- Section headings: 32-40px
- Sub-headings: 20-24px, medium weight
- Body: 16-18px
- Captions/labels: 13-14px
- Consistent vertical rhythm with a base unit of 8px

---

## Layout Patterns

### Grid and Spacing
- **Generous whitespace**: Sections breathe with 120-160px vertical padding
- **Asymmetric grids**: Not always 50/50 splits; content often weighted 60/40 or with offset positioning
- **Max content width**: ~1080-1200px centered, never edge-to-edge text
- **Code-alongside-design**: A defining Stripe pattern -- left side shows a concept or UI, right side shows the code/API that powers it

### Section Architecture
- Full-width sections with contained inner content
- Alternating background tones to separate sections without borders
- Feature grids: 2-3 column cards with icon, heading, and short description
- Hero sections: large heading + subtext + gradient illustration or product screenshot

---

## Interaction Patterns

### Hover and Focus
- Subtle background-color shifts on hover (cards lift slightly or gain a faint shadow)
- Links underline or shift color on hover, never both
- Buttons: slight scale or shadow increase, never jarring
- Code blocks: syntax highlighting with hover-to-copy functionality

### Transitions
- Duration: 150-250ms for micro-interactions, 300-500ms for section transitions
- Easing: ease-out or custom cubic-bezier for natural deceleration
- No bouncy or spring physics -- motion is controlled and deliberate

### Micro-interactions
- Tab switches with sliding indicator
- Toggle animations with smooth state transitions
- API response previews that update in real-time as parameters change
- Scroll-triggered fade-ins (subtle, not dramatic)

---

## Component Style

### Cards
- Light background (#FFFFFF) with subtle border (1px, very light gray) or faint shadow
- Rounded corners: 8-12px
- Internal padding: 24-32px
- No heavy drop shadows; elevation is implied, not dramatic

### Buttons
- Primary: gradient or solid brand color, white text, rounded (6-8px radius)
- Secondary: outlined or ghost style, brand color text
- Pill-shaped for tags and status badges
- Consistent 40-44px height for standard actions

### Inputs and Forms
- Rounded inputs (6-8px radius) with subtle border
- Focus state: brand-color ring, not browser default
- Inline validation with contextual messages
- Clean label placement (above input, not floating)

### Badges and Tags
- Pill-shaped with soft background tint of the relevant color
- Small, 12-13px text, medium weight
- Used sparingly for status, categories, or version labels

---

## Animation Approach

### Principles
- **Purposeful**: Every animation communicates something (state change, hierarchy, attention)
- **Subtle**: Users should feel the polish, not notice the animation
- **Performant**: CSS transforms and opacity only; no layout-triggering properties animate
- Animations enhance understanding, never delay the user

### Common Patterns
- Fade-in + slight translateY on scroll reveal (10-20px travel, 400-600ms)
- Tab content crossfade (200ms)
- Dashboard data transitions (number counting, chart drawing)
- Hero illustrations with gentle floating or parallax movement

---

## What Makes It Awwwards-Worthy

- **Pixel-level precision**: Spacing, alignment, and proportion are meticulous
- **Gradient craft**: Gradients feel custom and considered, not default CSS gradients
- **Content-as-design**: The actual product content (code snippets, API responses, dashboards) is styled as a design element
- **Consistent restraint**: Nothing is over-designed; the discipline to leave space empty is as important as what fills it
- **Cross-device polish**: Responsive behavior is not an afterthought; every breakpoint is intentional
- **Performance**: Pages load fast, animations run at 60fps, nothing jank

---

## When to Reference This System

Use Stripe's design philosophy when the client brief involves:

- **SaaS products** with complex features that need clear communication
- **Fintech or payments** platforms that must feel trustworthy and modern
- **Developer tools** where code and documentation are core to the experience
- **API-first companies** that need to show technical capability without alienating non-developers
- **B2B platforms** that want to feel premium without being stuffy
- **Any product** that values clarity, precision, and quiet confidence over flashy visuals

### Blending Notes
- Pair with Linear's dark mode patterns for dashboard states
- Pair with Apple's scroll-storytelling for product launch pages
- Avoid mixing with Notion's warmth -- the visual languages conflict at the type and color level
