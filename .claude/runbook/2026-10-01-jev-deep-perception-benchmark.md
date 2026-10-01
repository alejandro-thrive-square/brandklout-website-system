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

- **Validated on real Elfsight, read-only, in the user's own Chrome** (the user chose it over the
  automation profile). It ran in a background tab on the Mason Park Kids widget (`d359c3c4`), with
  seven `--forbid` patterns (publish, close, upgrade, delete, duplicate, save, install/share).
  - The two steps (Theme, then Layout) took 2 actions in 11.5 s, and each click had p = 1.0.
  - The final text shows the Layout panel. It also shows the live review preview
    (4.9, 97 reviews), which sits in a nested frame and was unreadable before.

- **Restore widget via Jev, same day.** The user asked Jev to create it. It finished the existing
  draft `393dc878` rather than making a second widget. The first three runs exposed four bugs,
  each now fixed, with a fixture trap in `flow` so the bench catches it:
  - An icon-only button had no hint. It was Elfsight's preview toggle, `ViewportSelector__…`, and
    Jev clicked it 10×. Hints now fall back to the component name in the class.
  - The text helper typed the page's placeholder example ("Brooklyn Museum…"). The step it was
    on held no value. The helper alone now gets the whole task as its only source of values.
    Giving the whole task to the decision model instead made it skip steps (Publish before Enter).
  - Same-action loops and endless WAITs had no guard. `drive()` now returns `loop` after 4
    identical actions and `stalled` after 8 waits.
  - Search results were invisible. Elfsight renders them in a `ModalNest` at the end of the
    document, past the 6000-character text budget (the review preview eats it). Overlays are now
    read first.
  - Bench after the fixes: guarded 16/16.
- **Outcome: Restore has no Google Business listing.** Jev searched by name, which returned only
  other Las Vegas practices, and by address, which returned "8945 W Russell Rd #320" with no rating
  or reviews. Nothing was connected; the boot API still shows `url: ""`. The registry note is updated.

## Next

- **Restore:** once the client has a Google Business Profile (or its Maps share link), run Jev on
  draft `393dc878`: search, connect the result with a rating, name it
  "Restore Dental Implant Studio - Google Reviews", Enter, Publish.
- A first full create by Jev is still unproven on real Elfsight. Each create spends one of the
  50 Google Reviews slots; `elfsight-reviews/elfsight_widget.py` stays the proven creator until then.

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
