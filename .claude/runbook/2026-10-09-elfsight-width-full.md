# 2026-10-09 — Elfsight in-section standard: Width = Full Width

From Mason Park (bk-mason-park, `docs/runbook/2026-10-09-home-feedback-badges-photos.md`): the client
asked for the reviews box to fill its section. Widget `e30c1531` had Width = custom 1280px (the
editor's default), so it sat centred in a 1525px section with a gap on each side.

## Done
- `tools/elfsight-reviews`:
  - README: the standard table has a Width row, **Full Width** (the editor's name for `widgetWidth.auto`).
  - `codex-instruction.txt`: step (1) sets it.
  - `check-widget.mjs`: prints a PROBLEM while the width is a custom pixel value.
- Mason Park's widget was set through Codex (`codex_cu.mjs`, one small brief) and the gate passes
  with `--render`. Five cards across at 1736 instead of four.

## Next
- The other clients' widgets probably still have the 1280px default. Run
  `check-widget.mjs <id>` per row of `review-widgets.json` and fix the ones that print the
  width PROBLEM.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../SYSTEM_RULES.md).
