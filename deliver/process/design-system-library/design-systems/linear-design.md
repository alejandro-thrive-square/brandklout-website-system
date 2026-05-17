# Linear Design System Reference

> Philosophical guide for generating Linear-inspired prototypes. Not a copy-paste template.

## Version Control

| Field       | Value      |
|-------------|------------|
| Version     | 1.0        |
| Created     | 2026-05-07 |
| Last Updated| 2026-05-07 |

---

## Visual Identity

Linear represents the **pinnacle of dark-first, developer-focused UI**. The experience is ultra-clean, fast, and unapologetically minimal. It feels like software built by engineers who deeply care about design -- every pixel serves a function.

Key traits:
- Dark-first -- light mode exists but dark is the soul of the brand
- Dense information display without feeling cluttered
- Speed is a design value, not just a performance metric
- The UI disappears; the content and workflow are everything

---

## Color Philosophy

### Signature Palette
- **Primary background**: Deep dark (#191A23 or similar near-black with a hint of blue/purple)
- **Surface layers**: Slightly lighter dark shades (#1E1F2B, #252736) for cards, modals, dropdowns
- **Text primary**: White or near-white (#E8E8ED) for headings and key content
- **Text secondary**: Muted gray (#7C7D8A) for descriptions, metadata
- **Accent**: Subtle purple (#8B5CF6) or blue for active states, links, and focus indicators
- **Status colors**: Muted versions of green, yellow, red, blue -- never neon, always desaturated

### Hierarchy Through Color
- Layered dark surfaces create depth without borders
- Accent color is used sparingly -- when something is purple, it matters
- Monochromatic hierarchy: importance is communicated through brightness, not hue variety
- Background gradients are extremely subtle (radial, faint purple glow behind hero text)

---

## Typography

### Font Strategy
- **Primary**: Inter, or a custom geometric sans-serif with similar characteristics
- **Monospace**: For IDs, technical references, keyboard shortcuts
- **No serif fonts**: The entire system is sans-serif, reinforcing the technical identity

### Sizing and Rhythm
- Tight letter-spacing (-0.01 to -0.03em on headings) for a refined, compact feel
- Headings: 28-40px, semi-bold to bold (600-700)
- Body: 14-15px, regular weight, generous line-height
- Labels and metadata: 12-13px, medium weight, often uppercase with wide letter-spacing
- Weight hierarchy is critical: bold headings, medium sub-headings, regular body, light metadata

---

## Layout Patterns

### Grid and Spacing
- **Minimal chrome**: Navigation is thin, toolbars are compact, content gets maximum space
- **Content-first**: The working area dominates the viewport (often 70-80% of screen width)
- **Sidebar navigation**: Thin left sidebar with icon + text, collapsible
- **Keyboard-centric feel**: Layout suggests efficiency; everything is reachable without excessive mouse movement

### Section Architecture
- List views with tight row spacing (36-40px row height)
- Panel-based layouts: main content + optional detail panel on the right
- Modals are centered, minimal, with sharp focus (background dims significantly)
- Settings and configuration use vertical stacked forms with clear section dividers

### Information Density
- High information density managed through consistent spacing and type hierarchy
- No unnecessary padding or decorative spacing
- Data tables with compact rows, clear column alignment, and sort indicators

---

## Interaction Patterns

### Hover and Focus
- Hover: subtle background lighten on rows and interactive elements (+5-8% brightness)
- Selected state: slightly brighter background + left accent border or highlight
- Focus rings: thin, purple/blue, high contrast against dark backgrounds
- Cursor changes are immediate and precise

### Keyboard Shortcuts and Command Palette
- **Command palette (Cmd+K)**: Central to the interaction model
- Visual hints for keyboard shortcuts displayed inline next to menu items
- Shortcut badges: small, muted, monospace text (e.g., "Ctrl+N" in a rounded badge)
- Power users should feel the interface was built for them

### Transitions
- **Fast**: 100-200ms for most interactions; nothing lingers
- Easing: ease-out with very short duration; the impression is "instant"
- Panel slides: 150-200ms
- Dropdown/popover appear: 100-150ms fade + slight scale
- No decorative transitions -- motion exists only to orient the user

---

## Component Style

### Cards and Surfaces
- Minimal or no borders; surfaces are differentiated by background shade
- When borders exist: 1px, very subtle (#2A2B3D or similar, barely visible)
- Border-radius: 6-8px, consistent across all surfaces
- No drop shadows on dark backgrounds; depth is created through color layering

### Glass Morphism Hints
- Occasional backdrop-blur on overlays and floating elements
- Translucent backgrounds (rgba with 0.8-0.9 opacity) for modals and command palettes
- Used sparingly -- just enough to create depth, never as a stylistic statement

### Buttons
- Primary: solid accent color, small (32-36px height), tight padding
- Secondary: ghost/outline style with subtle border
- Destructive: muted red, never bright
- Icon buttons: small, no background until hover

### Dividers
- Subtle horizontal lines (#2A2B3D) between sections
- Used instead of card containers to separate content groups
- Thin (1px), never heavy

---

## Animation Approach

### Principles
- **Fast**: Speed is the primary animation value
- **Intentional**: Every animation serves navigation or state communication
- **Never decorative**: No loading animations that exist just to look good
- Page transitions feel like instant switches, not journeys

### Common Patterns
- List item reorder: smooth 150ms translateY
- Panel open/close: 200ms slide with ease-out
- Status changes: color crossfade (100ms)
- Skeleton loading: subtle pulse animation for async content
- Notification toasts: slide in from edge, auto-dismiss

---

## When to Reference This System

Use Linear's design philosophy when the client brief involves:

- **Productivity tools** where speed and efficiency are core values
- **Developer tools** and internal platforms
- **B2B SaaS dashboards** with high information density
- **Project management** or workflow tools
- **Any product** targeting power users who value keyboard navigation
- **Dark-mode-first** products where the dark theme is the primary experience

### Blending Notes
- Pair with Stripe's gradient accents for marketing pages (Linear's dark + Stripe's gradients work well for landing pages)
- Pair with Vercel's typography scale for technical documentation sections
- Avoid mixing with Notion's warmth or Apple's scroll theatrics -- they contradict Linear's speed-first philosophy
