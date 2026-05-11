# Typography Guide

> Version: 1.0
> Last Updated: 2026-05-07

---

## Overview

This directory contains three type scale systems, each designed for a different category of project. All scales use CSS custom properties and fluid typography via `clamp()` for seamless responsiveness from 375px to 1440px+ viewports.

---

## Type Scales

### 1. Modern (`type-scale-modern.css`)

**Font:** Inter (sans-serif)
**Best for:** SaaS products, tech companies, startups, dashboards, developer tools landing pages

**Characteristics:**
- Clean geometric sans-serif throughout
- Tight, efficient spacing -- optimized for information density
- Moderate display sizes -- professional, not dramatic
- Negative letter-spacing on headings for modern feel
- Uppercase overline treatment for labels

**When to use:**
- Client is a SaaS or tech company
- UI-heavy projects with lots of interface text
- Anything that needs to feel "modern and clean"
- Token files: `tokens-modern-saas.json`, `tokens-bold-startup.json`

---

### 2. Editorial (`type-scale-editorial.css`)

**Font:** Playfair Display (headings) + Source Serif 4 (body)
**Best for:** Luxury brands, editorial sites, content-heavy publications, high-end portfolios

**Characteristics:**
- Serif body text for long-form readability
- Dramatic display sizes (up to 6.5rem) for visual impact
- Includes italic display variant for editorial flair
- Pull-quote styling and drop-cap support
- Sans-serif used only for small UI elements (labels, overlines)

**When to use:**
- Client is a luxury, fashion, or lifestyle brand
- Content-heavy sites (magazines, blogs, portfolios)
- Anything that needs to feel editorial or premium
- Token files: `tokens-luxury.json`, `tokens-corporate.json`

---

### 3. Technical (`type-scale-technical.css`)

**Font:** Inter (body) + JetBrains Mono (code/accents)
**Best for:** Developer documentation, technical products, data dashboards, API references

**Characteristics:**
- Slightly smaller base sizes for information density
- Dedicated code sizing scale (monospace renders wider, needs adjustment)
- Terminal-style and keyboard shortcut classes
- Tab-size configuration for code blocks
- Heading sizes stay restrained -- clarity over drama

**When to use:**
- Client is developer-focused or documentation-heavy
- Projects with inline code, terminal output, or data tables
- Anything that needs a "technical" or "engineering" feel
- Token files: `tokens-modern-saas.json` (with mono override)

---

## How to Apply

### Step 1: Link the CSS

Include one type scale file in your project's `<head>`:

```html
<link rel="stylesheet" href="foundations/typography/type-scale-modern.css">
```

### Step 2: Use Custom Properties

Apply font sizes via CSS custom properties anywhere in your stylesheets:

```css
h1 {
  font-size: var(--font-size-5xl);
  line-height: var(--line-height-5xl);
  letter-spacing: var(--letter-spacing-5xl);
  font-weight: var(--font-weight-bold);
}

p {
  font-size: var(--font-size-base);
  line-height: var(--line-height-base);
  font-family: var(--font-primary);
}
```

### Step 3: Or Use Semantic Classes

Apply pre-built classes directly to HTML elements:

```html
<h1 class="heading-1">Page Title</h1>
<p class="text-body">Body paragraph text.</p>
<span class="text-overline">Section Label</span>
<p class="text-body-lg">Lead paragraph with larger text.</p>
```

### Step 4: Override Per-Project

Override any variable at the `:root` level to customize:

```css
:root {
  --font-primary: 'Satoshi', sans-serif;
  --font-size-display: clamp(3rem, 2.5rem + 4vw, 5.5rem);
}
```

---

## Scale Reference Table

| Token | Modern | Editorial | Technical |
|---|---|---|---|
| `--font-size-xs` | 0.75rem | 0.75rem | 0.75rem |
| `--font-size-sm` | 0.875rem | 0.875rem | 0.8125rem |
| `--font-size-base` | 1rem | 1.0625rem | 0.9375rem |
| `--font-size-lg` | 1.125rem | 1.25rem | 1.0625rem |
| `--font-size-xl` | 1.25rem | 1.5rem | 1.1875rem |
| `--font-size-2xl` | 1.5rem | 1.875rem | 1.5rem |
| `--font-size-3xl` | 1.875rem | 2.5rem | 1.875rem |
| `--font-size-4xl` | 2.25rem | 3.25rem | 2.25rem |
| `--font-size-5xl` | 3rem | 4.5rem | 2.75rem |
| `--font-size-display` | 3.75rem | 6.5rem | 3.5rem |

*Values shown are the max (desktop) size from each clamp() function.*

---

## Version Control

| Version | Date | Author | Change |
|---|---|---|---|
| 1.0 | 2026-05-07 | Webzite Studio | Initial guide with 3 type scales |
