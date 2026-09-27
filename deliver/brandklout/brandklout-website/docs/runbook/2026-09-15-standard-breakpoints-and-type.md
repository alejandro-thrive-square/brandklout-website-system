## 2026-09-15: standard breakpoints and the house type scale (seq 26)

Reported (Alejandro): "why you keep creating too much mobile breakpoints?", then "Fix it, no matter
the new versions we should be using the standardize font scaling and regular breakpoints", then "go
ahead, push it when the check passes".

### Why it kept happening

`class-system.mjs` derived the editor breakpoints from Sang's own media-query widths (17 of them:
1190 … 360), folding two together only where no common device sat in between, to stay pixel-identical
to his file. That left 7 breakpoints (four at or below 800), and every package that brought a new
width (v16: 900, 680, 600) published it as an extra condition until someone added it to `BP_MAP`.

### Done (commit `9c59b724`; build artifacts in the commit after it)

- **Breakpoints, always the standard four**: Laptop 1279, Tablet 991, Mobile landscape 767, Mobile
  portrait 479. `snapQuery` snaps every width in Sang's CSS to the nearest standard boundary as it is
  read (max-width to a breakpoint; min-width to the first width above one, 1439/1919 also open),
  never across 1440, so no future width can add a breakpoint or condition. `BP_MAP` is gone.
  Folds of note: ≤1050 -> ≤991, ≤1150/≤1190 -> ≤1279, ≤620/≤600/≤520 -> ≤479, ≤900 -> ≤991,
  min-width 1600 -> 1920. `agency/code.css`'s Calendly heights moved to 991/479 with them.
- **Type, the house standard** (`deliver/process/04-design/fluid-root.md`): the house fluid root
  (`scripts/fluid-root.mjs`: 12px at 320, 16px 479–1440, 18px at 1920, 20px at 2400) replaces the
  gentle seq 23 root (1.15x at 2560), and every font-size is a plain rem per breakpoint, no clamp().
  Each selector's cascade is read at 1440 / 1024 / 768 / 600 (so Sang's size holds there exactly);
  below 479 text holds its 360 size and display type (≥28px) follows the root down. 433 cascades
  converted; `!important` is honoured; 3 runtime rules set only above a width keep their structure
  (the one clamp among them frozen at 1440).
- New gate `standard-check.mjs`; `class-parity.mjs` now only has to be identical at 1440.
- Live: 7 conditions, all on standard boundaries (992, 768–991, 992–1279, 1920, plus reduced motion,
  print and a height query).

### Gates

- Local: `class-parity 1440` all identical (32 pages); `fluid-root.mjs --check` on a relative copy of
  `class-site/assets/site.css`: Problems none; `standard-check` 288/288 ok (9 widths × 32 pages: house
  root, no sideways scroll, nothing out of the viewport, no heading overflow beyond Sang's own), and
  96/96 at 1440/390/360 after the final rebuild.
- Backups before the push: tag `brandklout-website-live-seq25` (c67cb3a6), API snapshot
  `.tmp/backup-2026-09-15-seq25/`, container DB `/app/storage/backups/cms-2026-09-15-seq25-pre-standard.db`
  (130MB). Seq checked 25 twice. Shipped (0 warnings), pushed (saved seq 26), published 32 pages.
- Live: breakpoints 1279/991/767/479; `verify-live` and `css-parity` FAIL none; `visual-diff index`
  0.133% at 1440, 0.270% at 390; `resize-check` root 16 -> 13.76 -> 18px and h1 72 -> 41.8 -> 81px at
  1440 / 390 / 1920, following each resize, no inline sizes.

### Visible changes (tell Sang)

- Above 1440 everything is 12.5% larger at 1920 (hero h1 81px vs his 72px) and 25% at 2400.
- On phones below 479 headings, buttons and spacing are slightly smaller (hero h1 36–38px at
  360–390 vs his 38–45); body text holds its size.
- 992–1050 now shows the desktop rules (was Sang's ≤1050 layout); 1151–1279 shows his ≤1150 layout;
  480–620 shows the tablet-portrait layout instead of his phone one. `standard-check` found no
  overflow from any of it.

### Gotchas

- `fluid-root.mjs --check .tmp/site/class-site` reports "missing" on every page: the pages link
  `/assets/site.css`, which it cannot resolve. Check a copy linked relatively.
- `standard-check.mjs` over 9 widths takes ~20 min; do not rebuild `class-site` while it runs.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
