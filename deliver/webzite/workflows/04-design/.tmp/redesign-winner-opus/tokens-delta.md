# Tokens Delta — "The Bottom Line" homepage redesign

Every token added or changed vs **Design System v2.0**
(`manage/brand-assets/design-system/css/webzite-design-system.css`).
No fonts added. No warm colors added. All new color is dark-brand or the
existing blue accent. Promote the winners back into the design system.

---

## Changed

| Token | v2.0 | This build | Rationale |
|---|---|---|---|
| `--wz-faint` | `rgba(255,255,255,0.38)` | `rgba(255,255,255,0.55)` | v2.0's 0.38 fails WCAG AA (≈3:1) for the small mono labels/captions this layout leans on. 0.55 measures ≈6:1 on `#111114`. Text-only use, so the lift is universal and safe. (Same fix the prior home revision adopted — keep it.) |

## Added — color fields (dark-brand variations + one bold accent)

| Token | Value | Rationale |
|---|---|---|
| `--wz-field-1` | `#111114` | Base ink color-field (alias of `--wz-ink`). Names the "field switch" system so section backgrounds read as intentional stops, not incidental. |
| `--wz-field-2` | `#17171d` | Raised ink field (a hair off `--wz-ink-2 #19191f`) for manifesto/services and client-voice. Gives an Isadora-style field switch using *only* dark-brand variation. |
| `--wz-field-deep` | `#0b1024` | **The one bold accent block** (stats/"the account"). A deep blue-black — in-palette (blue family, dark), distinct enough to read as a color-field switch, and dark enough that `--wz-yellow` count-ups stay far above AA (≈15:1) where yellow-on-`#466fff` would have failed. |
| `--wz-field-deep-glow` | `rgba(70,111,255,0.16)` | Blue radial glow layered over `--wz-field-deep` for depth — the existing brand blue at low alpha. |
| `--wz-line-2` | `rgba(255,255,255,0.08)` | A lighter hairline than `--wz-line (0.14)` for *interior* ledger sub-rows (line items within the pricing readout), so the outer rules stay dominant. |

## Added — motion

| Token | Value | Rationale |
|---|---|---|
| `--wz-ease-out` | `cubic-bezier(0.5,1,0.89,1)` | The brief's soft expo-out. Used for the hero "sum rule" draw and other art-directed accents, distinct from the sharper `--wz-ease` expo curve already in the system. |
| `--wz-reveal` | `900ms` | Canonical reveal/entrance duration — one knob for the reveal system and hero fade-ins. |
| `--wz-rise` | `1100ms` | Masked line-rise duration for the hero equation and the contact masthead. |

## Added — layout

| Token | Value | Rationale |
|---|---|---|
| `--wz-field-pad` | `clamp(96px, 13vw, 200px)` | Vertical rhythm *between* stacked color-fields — larger and more art-directed than the section padding baked into v2.0's `.section`, to give each full-field its own air (Isadora generous negative space). |

---

## Explicitly NOT changed / NOT added
- **No new fonts.** Inter (400–800) + JetBrains Mono only. No serif.
- **No warm colors.** Isadora's cream/purple/coral are absent; the only
  non-ink hues are the brand `--wz-blue`, `--wz-yellow`, `--wz-mist`,
  and `--wz-red` (reserved — used only as a low-alpha reel/case glow, never as UI).
- **Removed, not tokenized:** the `initDust` particle canvas, the `grain`
  overlay, and the `webzite-texture-noise.png` dependency — the ambient haze
  is gone entirely, so no atmosphere tokens carry over.

## Version Control

This document follows the root-level version control rules in [SYSTEM_RULES.md](/SYSTEM_RULES.md). Commit only non-secret, repo-friendly workflow context and artifacts.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
