# Tokens Delta

Compared with Webzite Design System v2.0, this redesign keeps the locked brand colors, Inter, JetBrains Mono, 1440px shell, 8px radius, and yellow/blue accent roles. Additions are scoped to the homepage art direction.

## Added Tokens

- `--wz-field-blue: #10182f` - a dark blue-black field for full-viewport section changes without importing the reference site's color world.
- `--wz-field-yellow: #201f14` - a near-black yellow-tinted field for the stats/proof moment while keeping yellow as the emphasis accent.
- `--wz-field-ink3: #0d0d10` - a deeper near-black for media wells and case-cover stages.
- `--wz-ease-ui: cubic-bezier(0.5, 1, 0.89, 1)` - short interaction and reveal ease matching the brief's requested editorial motion range.
- `--nav-h: 72px` - homepage-specific fixed navigation height used for scroll padding and sticky offsets.

## Changed Tokens

- `--wz-muted: rgba(255, 255, 255, 0.64)` - raised from v2.0's 0.6 for clearer paragraph contrast on tinted dark fields.
- `--wz-faint: rgba(255, 255, 255, 0.55)` - raised from v2.0's 0.38 for WCAG-safe mono labels and captions.

## Removed From This Package

- Ambient particle-canvas motion.
- Global texture overlay.
- Manual 300svh pinned hero progress custom property.

## Version Control

This artifact follows the root Webzite version control rules in [SYSTEM_RULES.md](../../../../../../SYSTEM_RULES.md). It is safe to commit with the lightweight redesign package when the race output is collected.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
