# Reference inventory — Alki House

Brand-authority preflight for `04-design`, done 2026-09-13. Every source that could carry design
direction, what it controls, and whether it is on disk in this worktree.

| Source | Where | Controls | On disk | Conflicts |
| :--- | :--- | :--- | :--- | :--- |
| Colour palette | `00-client-delivery-initialization/.tmp/client-handoff/Brand/Color Palette.png` | Identity: the four swatches | Yes (gitignored PNG) | None |
| Logo | `…/client-handoff/Brand/Alkihouse Logo.png` | Identity: mark, dark polarity | Yes; extracted to `site-src/assets/logo-mark.png` and `logo-mark-dark.png` | None |
| Style references (8) | `…/client-handoff/Style references/` | Layout and overall design only, per the brief | Yes (gitignored JPG/PNG) | Their palettes are ignored by instruction |
| Stock ledger | `…/client-handoff/Stock/products.csv` | Content: the whole catalogue | Yes (tracked CSV) | Internal costs and commissions in the file are NOT rendered anywhere |
| Brief | Chat, 2026-09-12 | Scope, CMS, imagery sources, font freedom | This runbook | None |
| Current site | none | — | — | No existing site or domain recorded |
| Asana | not yet recorded | — | — | GID still to be found |

Selected authority: palette PNG for colour, logo for polarity, ledger for content, brief for scope.

Fonts were not supplied; the brief allows a modern choice that can change later. Chosen:
Bricolage Grotesque / Manrope / JetBrains Mono (Google Fonts).

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../../SYSTEM_RULES.md).
