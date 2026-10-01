# 2026-10-01 — Jev: deep perception, forbid list, and an offline benchmark

The user asked to make computer use with Jev work properly and to compare approaches.

## Done

- **Offline benchmark:** `deliver/process/tools/jev-browser-agent/bench/`. It has 8 fixtures, each
  reproducing a trap seen on Elfsight (cross-origin editor, shadow DOM, div template cards,
  icon-only buttons, Enter-only rename, echo row in the search dropdown, nested OOPIF), plus a full
  create-widget flow.
  - It runs in its own headless Chrome (port 9333, `BU_NAME=bench`), never the user's.
  - A run is scored by the events the fixture recorded, never by Jev's DONE.
- **`jev_deep.py` + `deep_snapshot.js`:**
  - Perception: frames at any depth, shadow roots, div cards, a `PRESS_ENTER` operation, and
    hover before click.
  - `forbid` patterns hide controls from the model.
  - `drive()` runs ordered steps with patience for BLOCKED and retries bad model replies.
- **`run_elfsight.py`** now uses `jev_deep` by default, with `--forbid` and `--patience`. It runs from
  the repository with `uv run --project ~/tools/jev-ultrafast`.
- **Results:**

  | Variant | Score |
  | :--- | :--- |
  | vanilla | 1/8 |
  | frames | 3/8 |
  | deep | 19/24 |
  | **guarded** (deep + steps + forbid) | **24/24** |

  Guarded's median run is 3.7 s; the full flow takes 15 s over 7 steps. Logs are in `bench/results/`.

## Next

- **Validate on real Elfsight, read-only:** open an existing widget, open Theme, search a word,
  stop. Do it first on a **dedicated automation Chrome profile** (port 9333, signed in to Elfsight
  once by the user), so the user's own tabs are never driven.
- **Only then** consider a real create run in place of `elfsight-reviews/elfsight_widget.py`.
  Each create spends one of the 50 Google Reviews slots.

## Gotchas

- **Without `--forbid`, Jev clicks the dropdown's `Search for "…"` echo row.** In the flow it then
  published a widget with no source and reported **DONE** (3/3 runs). A "do not" in the goal does
  not stop it. Hide the control.
- **Splitting the task into steps did not help without forbid.** Steps alone scored 5/8 on the
  first pass, below `deep`.
- **The browser-harness daemon can die after a hung model call.** A 120 s text-helper hang
  timed out every later run. `bench.py` now calls `ensure_daemon()` before each run and counts
  plumbing failures separately.
- **The text helper `inception/mercury-2.5` sometimes returns `{"text": null}`.** `drive()` retries once.
- **A dedicated profile through `BU_CDP_URL` avoids the "Allow remote debugging?" prompt.** That
  prompt blocked the first command of this session in the user's Chrome.

## Version Control

Tracked on `main` with the system runbook; see SYSTEM_RULES.md §4.
