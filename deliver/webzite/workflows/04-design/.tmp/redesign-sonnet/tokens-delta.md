# Tokens delta — vs Design System v2.0

Every color, spacing step, radius, and font family is v2.0 verbatim. The
additions below are new color-field shades and one new motion easing, all
needed to translate Isadora's "stacked full-viewport color-field sections"
composition into the dark Webzite palette without touching the brand's core
tokens. No fonts and no warm/cream/purple colors were added — see BRIEF §2/§6.

## New color tokens

| Token | Value | Rationale |
| :--- | :--- | :--- |
| `--wz-ink-amber` | `#171510` | Third dark field for "Selected work" — `--wz-ink` mixed toward `--wz-yellow` at low value, so the section reads as a distinct field without leaving the ink family. Paired with a `radial-gradient(…, rgba(255,236,70,.08), transparent)` overlay for depth (see `.field-amber`). |
| `--wz-ink-cobalt` | `#0f121a` | Fourth dark field for "Statement + stats" — `--wz-ink` mixed toward `--wz-blue` at low value. Paired with a `radial-gradient(…, rgba(70,111,255,.16), transparent)` overlay (see `.field-blue`). |
| `--wz-line-on-yellow` | `rgba(17,17,20,.16)` | Hairline/border color for content sitting on the new `.field-accent` (solid `--wz-yellow`) block — `--wz-line`'s white-alpha equivalent doesn't read on a light field, so this is `--wz-ink` at the same alpha the brand already uses for hairlines. |
| `--wz-muted-on-yellow` | `rgba(17,17,20,.66)` | `--wz-muted` equivalent for ink-on-yellow text; computed contrast ~5.7:1 against `#ffec46` (WCAG AA body text needs 4.5:1). |
| `--wz-faint-on-yellow` | `rgba(17,17,20,.62)` | `--wz-faint` equivalent for ink-on-yellow small/mono text; computed contrast ~5.0:1 — deliberately higher alpha than `--wz-muted-on-yellow`'s dark-field counterpart (`--wz-faint` is *lower* alpha than `--wz-muted` on ink) because small mono labels need the full 4.5:1, not the 3:1 large-text minimum. |

`.calc-cost` uses `--wz-yellow` everywhere except inside `.field-accent`,
where it's overridden to a one-off `#7a5f00` — yellow text has no contrast
against the yellow accent block, so that override is a darkened gold that
still reads as "the money number" and clears AA (computed ~5.0:1 on `#ffec46`).

## New motion token

| Token | Value | Rationale |
| :--- | :--- | :--- |
| `--wz-ease-out` | `cubic-bezier(0.5, 1, 0.89, 1)` | BRIEF §4 specifies this curve alongside the existing `--wz-ease` (expo-out, `cubic-bezier(.19,1,.22,1)`) for reveals in the `.35s`–`.8s` range. Reserved for CSS-only micro-interactions (hover states); the JS reveal timeline uses GSAP's built-in `expo.out`, which is the same shape as `--wz-ease`, since GSAP core doesn't accept arbitrary cubic-beziers without the CustomEase plugin (kept out to avoid one more CDN dependency for a purely cosmetic difference).

## Removed from the prior package (not tokens, but load-bearing for this delta)

- `--scene-bg`, `--orb-x`, `--orb-y`, `--orb-s`, `--hp` — all were JS-driven
  custom properties feeding the `initDust` canvas, the wandering orb, and the
  manual-lerp pinned-hero progress. None of that exists in this build (see
  NOTES.md); the color-field system above replaces the orb/morph for
  section-to-section variation, and the hero no longer pins.

## Version Control

This document follows the root-level version control rules in [SYSTEM_RULES.md](/SYSTEM_RULES.md). Commit only non-secret, repo-friendly workflow context and artifacts.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
