## 2026-09-14 (night): "the heading is not right": the fluid root, softened (seq 23)

Reported (Alejandro, after the v16 publish): "Same heading problem as before". The first report, after
seq 19, was "The heading is not right on the Instatic published version", and it was then blamed on
the admin edits (Sang's and Sean's), which were dropped. It came back without them.

### Cause

The class system's fluid root, `html { font-size: clamp(100%, 100vw / 90, 160%) }` (seq 19 onwards):
exactly 16px up to 1440px, then every rem size grows with the screen. Sang's site does not grow. The
home hero h1 measured (headless Chrome, live vs Sang's `package-v16` served as he sent it):

| width | Sang | live, seq 22 | live, seq 23 |
| ---: | ---: | ---: | ---: |
| 1280 | 64px | 64px | 64px |
| 1536 | 72px | 76px | 72px |
| 1920 | 72px | **96px** | 76px |
| 2560 | 72px | **115px** | 82px |

At 1920 the whole hero was 1.33x and ran below the fold. Up to 1440 live and Sang's were identical,
which is why every gate stayed clean: they all measure at 1440 or narrower. The inline `font-size:
5rem` someone set on the hero h1 in the admin before seq 19 was most likely an attempt to fix this.
The sienna widget was ruled out: it freezes font sizes inline, but at the values the page already had.

### Done

- Alejandro chose **gentle scaling** (over matching Sang exactly, or capping headings only):
  `clamp(100%, 0.8071rem + 0.2143vw, 115%)`. 16px up to 1440, then a line to 18.4px (1.15x) at 2560,
  and no further. `class-system.mjs` `FLUID_ROOT`; directive, standing runbook and comments updated.
- Only `site-src/code.css` changed (registry, pages and the shipped payload are identical), so no
  re-ship: `push-site --apply --force` (live seq checked: 22) and publish, **seq 23**, 32 pages.

### Gates

- `class-parity` 1440, 1024, 768: all ok. At 390 the same 9 pages differ as since seq 21 (the phone
  breakpoint fold, intended).
- `verify-live` and `css-parity` FAIL none. `visual-diff index 1440`: 0.134%.
- `.tmp/heading-wide.mjs` gives the table above; `.tmp/heading-check.mjs` compares the h1 with and
  without the widget against the local build.

### Gotchas

- **The gates are blind above 1440.** A sizing change for big screens must be checked with
  `heading-wide.mjs` (or screenshots at 1920 and 2560) against Sang's own package.
- "The heading" here meant the home hero h1, but the root scales everything; judge the whole
  first screen at 1920, not one element.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
