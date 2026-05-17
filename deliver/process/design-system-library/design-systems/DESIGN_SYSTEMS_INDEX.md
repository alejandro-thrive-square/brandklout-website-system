# Design Systems Reference Index

> Master index for design system reference files. These are philosophical guides for Claude to consult when generating client prototypes.

## Version Control

| Field       | Value      |
|-------------|------------|
| Version     | 1.0        |
| Created     | 2026-05-07 |
| Last Updated| 2026-05-07 |

---

## Available Design System References

| # | File | System | Summary |
|---|------|--------|---------|
| 1 | [stripe-design.md](./stripe-design.md) | Stripe | Gradient-rich, technical yet approachable SaaS design with meticulous polish and code-alongside-design patterns. |
| 2 | [linear-design.md](./linear-design.md) | Linear | Dark-first, ultra-minimal, keyboard-centric design built for speed and developer-focused productivity tools. |
| 3 | [notion-design.md](./notion-design.md) | Notion | Warm, flexible, paper-like design with content-block architecture, playful illustrations, and inline editing patterns. |
| 4 | [vercel-design.md](./vercel-design.md) | Vercel | Black-and-white mastery with extreme constraint, technical authority, and a single-accent-color system. |
| 5 | [apple-design.md](./apple-design.md) | Apple | Premium, cinematic, product-hero-centric design with scroll-as-storytelling and full-viewport sections. |

---

## Comparison Table

| Dimension | Stripe | Linear | Notion | Vercel | Apple |
|-----------|--------|--------|--------|--------|-------|
| **Style** | Clean, gradient-rich, polished | Dark, ultra-minimal, fast | Warm, friendly, flexible | Monochrome, sharp, restrained | Premium, cinematic, focused |
| **Best For** | SaaS, fintech, API tools | Productivity, dev tools, dashboards | Knowledge tools, content, collaboration | Dev platforms, infrastructure, minimal brands | Premium products, hardware, luxury, launches |
| **Color Approach** | Purple/blue gradients, light backgrounds | Dark base (#191A23), subtle purple accents | Warm whites, soft pastels | Pure black + white, single blue accent | Product-defined color on neutral backgrounds |
| **Typography** | System/custom sans, large clear headings | Inter, tight letter-spacing, weight hierarchy | Serif/sans mix, readable, approachable | Geist Sans + Mono, dramatic size contrast | SF Pro, very large display text, bold contrast |
| **Layout Philosophy** | Generous whitespace, asymmetric grids | Minimal chrome, content-first density | Content-block modular, flexible widths | Centered single-column, full-bleed sections | Full-viewport per section, scroll narrative |
| **Animation** | Subtle, purposeful, performance-first | Fast, intentional, never decorative | Gentle, spring-like, organic | Scroll-triggered, fade-in sequences | Cinematic scroll-linked, product reveals |
| **Emotional Register** | Confident and inviting | Efficient and focused | Warm and personal | Authoritative and precise | Aspirational and premium |
| **Dark Mode** | Not core; light-first | Core identity | Supported with warm tones | Equally strong in both | Dark sections for drama, not full dark mode |

---

## How to Use These References

### Purpose
These files are **philosophical design guides**, not component libraries or copy-paste templates. They document the design thinking, patterns, and principles that make these systems distinctive. When generating a client prototype, Claude should internalize the relevant philosophy to make consistent design decisions across the entire output.

### Selection Process

1. **Read the client brief** and identify the product category, target audience, and desired emotional tone.
2. **Select a primary reference** that best matches the brief. Use the comparison table above to narrow down.
3. **Optionally select a secondary reference** to blend specific patterns (e.g., Apple's scroll animations on a Stripe-style page).
4. **Read the selected reference file(s)** before generating any design output.
5. **Apply the philosophy**, not specific pixel values. The reference tells you how to think about color, spacing, and interaction -- adapt those principles to the specific client's needs.

### Matching Heuristics

| Client Brief Signals | Primary Reference |
|-----------------------|-------------------|
| "SaaS", "fintech", "payments", "API", "developer-friendly" | Stripe |
| "dashboard", "productivity", "dark mode", "power users", "fast" | Linear |
| "knowledge base", "wiki", "content", "collaborative", "friendly", "personal" | Notion |
| "developer tool", "infrastructure", "minimal", "monochrome", "technical" | Vercel |
| "premium", "product launch", "luxury", "hardware", "cinematic", "showcase" | Apple |

### Blending Rules

- **Blend elements, not entire systems.** Pick a primary reference for the overall emotional tone and layout philosophy. Borrow specific patterns (animations, component styles, color treatments) from a secondary reference.
- **Respect emotional coherence.** Avoid combining systems with conflicting emotional registers (e.g., Notion's warmth + Vercel's stark coldness, or Linear's speed + Apple's slow cinematic scroll).
- **Common successful blends:**
  - Stripe base + Apple scroll animations (for SaaS product launches)
  - Linear base + Stripe gradient hero (for dark-mode SaaS landing pages)
  - Notion base + Linear command palette (for content tools that serve power users)
  - Vercel base + Stripe feature grid (for technical products with multiple features to explain)
- **The client's brand always takes priority.** If the client has established brand colors, fonts, or patterns, use those and let the reference guide only the structural and philosophical decisions.

### What These References Are NOT

- Not component specifications with exact pixel values (adapt the principles to the context)
- Not brand guidelines for these companies (they are our interpretations for prototyping purposes)
- Not exhaustive documentation of every pattern these companies use (they capture the core philosophy)
- Not substitutes for understanding the specific client's needs (always start from the brief, not from the reference)
