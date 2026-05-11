# Design Token Schema

> Version: 1.0
> Last Updated: 2026-05-07
> Compatible With: Figma Variables API, Style Dictionary, Tokens Studio

---

## Overview

This document defines the canonical JSON schema for all design token files used across Webzite projects. Every token file in the `tokens/` directory must conform to this schema. The format is designed for direct import into Figma via the Variables API and for transformation via Style Dictionary into CSS custom properties, Tailwind configs, or platform-native formats.

---

## Schema Definition

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Webzite Design Token File",
  "type": "object",
  "required": ["meta", "colors", "typography", "spacing", "radius", "shadows", "transitions"],
  "properties": {
    "meta": {
      "type": "object",
      "required": ["name", "style", "version"],
      "properties": {
        "name":    { "type": "string", "description": "Human-readable brand/theme name" },
        "style":   { "type": "string", "enum": ["modern-saas", "corporate", "creative-agency", "minimal-portfolio", "bold-startup", "luxury", "custom"], "description": "Style archetype identifier" },
        "version": { "type": "string", "pattern": "^\\d+\\.\\d+$", "description": "Semantic version (major.minor)" },
        "description": { "type": "string", "description": "Optional brief description of the token set" },
        "author":  { "type": "string", "description": "Optional author or team" }
      }
    },
    "colors": {
      "type": "object",
      "required": ["primary", "secondary", "accent", "background", "surface", "text-primary", "text-secondary", "text-muted", "border", "success", "warning", "error"],
      "patternProperties": {
        "^[a-z][a-z0-9-]*$": {
          "type": "object",
          "required": ["value", "type"],
          "properties": {
            "value": { "type": "string", "pattern": "^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$" },
            "type":  { "type": "string", "const": "color" },
            "description": { "type": "string" }
          }
        }
      }
    },
    "typography": {
      "type": "object",
      "required": ["font-primary", "font-secondary", "scale"],
      "properties": {
        "font-primary": {
          "type": "object",
          "required": ["value", "type"],
          "properties": {
            "value": { "type": "string" },
            "type":  { "type": "string", "const": "fontFamily" },
            "weights": {
              "type": "array",
              "items": { "type": "integer" },
              "description": "Available font weights (e.g. [400, 500, 600, 700])"
            }
          }
        },
        "font-secondary": {
          "type": "object",
          "required": ["value", "type"],
          "properties": {
            "value": { "type": "string" },
            "type":  { "type": "string", "const": "fontFamily" }
          }
        },
        "font-mono": {
          "type": "object",
          "properties": {
            "value": { "type": "string" },
            "type":  { "type": "string", "const": "fontFamily" }
          }
        },
        "scale": {
          "type": "object",
          "required": ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "display"],
          "patternProperties": {
            ".*": {
              "type": "object",
              "required": ["value", "lineHeight"],
              "properties": {
                "value":         { "type": "string", "description": "Font size (e.g. '14px', '0.875rem')" },
                "lineHeight":    { "type": "string", "description": "Line height (e.g. '1.5', '24px')" },
                "letterSpacing": { "type": "string", "description": "Letter spacing (e.g. '-0.02em', 'normal')" },
                "fontWeight":    { "type": ["string", "integer"], "description": "Default weight for this scale step" }
              }
            }
          }
        }
      }
    },
    "spacing": {
      "type": "object",
      "required": ["unit", "scale"],
      "properties": {
        "unit": { "type": "integer", "description": "Base unit in pixels (typically 4 or 8)" },
        "scale": {
          "type": "object",
          "required": ["xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl"],
          "patternProperties": {
            ".*": {
              "type": "object",
              "required": ["value", "px"],
              "properties": {
                "value": { "type": "string", "description": "CSS value (e.g. '0.5rem')" },
                "px":    { "type": "integer", "description": "Pixel equivalent for reference" }
              }
            }
          }
        }
      }
    },
    "radius": {
      "type": "object",
      "required": ["sm", "md", "lg", "xl", "full"],
      "patternProperties": {
        ".*": {
          "type": "object",
          "required": ["value"],
          "properties": {
            "value": { "type": "string", "description": "CSS border-radius value" }
          }
        }
      }
    },
    "shadows": {
      "type": "object",
      "required": ["sm", "md", "lg", "xl"],
      "patternProperties": {
        ".*": {
          "type": "object",
          "required": ["value"],
          "properties": {
            "value": { "type": "string", "description": "CSS box-shadow value" }
          }
        }
      }
    },
    "transitions": {
      "type": "object",
      "required": ["fast", "base", "slow"],
      "patternProperties": {
        ".*": {
          "type": "object",
          "required": ["value"],
          "properties": {
            "value":    { "type": "string", "description": "CSS transition shorthand (e.g. 'all 150ms ease')" },
            "duration": { "type": "string", "description": "Duration only (e.g. '150ms')" },
            "easing":   { "type": "string", "description": "Easing function (e.g. 'cubic-bezier(0.4, 0, 0.2, 1)')" }
          }
        }
      }
    }
  }
}
```

---

## Figma Variables API Mapping

When importing tokens into Figma, the following mapping applies:

| Token Category | Figma Variable Type | Figma Collection |
|---|---|---|
| `colors.*` | `COLOR` | `Colors` |
| `typography.font-*` | `STRING` | `Typography` |
| `typography.scale.*` | `FLOAT` | `Typography` |
| `spacing.scale.*` | `FLOAT` | `Spacing` |
| `radius.*` | `FLOAT` | `Radius` |
| `shadows.*` | `STRING` | `Effects` |
| `transitions.*` | `STRING` | `Motion` |

### Import Workflow

1. Parse the token JSON file
2. Create Figma Variable Collections per category
3. Map each token to a Figma Variable with the appropriate type
4. For color tokens, convert hex to Figma RGBA format: `{ r: 0-1, g: 0-1, b: 0-1, a: 1 }`
5. Apply modes for light/dark theme variants if present

---

## CSS Custom Property Output

Tokens are transformed to CSS custom properties following this naming convention:

```
--{category}-{name}
```

Examples:
```css
--color-primary: #6366F1;
--color-text-primary: #F8FAFC;
--font-primary: 'Inter', sans-serif;
--font-size-base: 1rem;
--space-md: 1.5rem;
--radius-md: 8px;
--shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
--transition-base: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
```

---

## Creating a New Token File

1. Copy an existing token file as a starting point
2. Update the `meta` block with the new brand name, style archetype, and version
3. Replace all token values to match the brand
4. Validate the JSON against this schema
5. Test import into Figma via the Variables API
6. Place the file in `foundations/tokens/` with the naming convention `tokens-{style-name}.json`

---

## Validation

Run token files against this schema before committing. Any CI pipeline should include a JSON schema validation step for files matching `tokens-*.json`.

---

## Version Control

| Version | Date | Author | Change |
|---|---|---|---|
| 1.0 | 2026-05-07 | Webzite Studio | Initial schema definition |
