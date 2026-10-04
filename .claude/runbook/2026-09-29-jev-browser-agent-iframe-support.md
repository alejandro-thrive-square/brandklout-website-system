# 2026-09-29 — Jev browser agent installed; cross-origin iframe support for Elfsight

## Done

- **Jev Ultrafast installed** at `~/tools/jev-ultrafast` (vendor clone, commit `1231850`, outside
  the repository). uv 0.12.20 is in `~/.local/bin`. The keys are under `[shared]` in the master
  `.env` and copied into the clone's `.env`. Chrome remote debugging is on. First task: the
  Wikipedia example in 5.7 s.
- **Our extension, now in `deliver/process/tools/jev-browser-agent/`:**
  - `jev_frames.py`: `FramedBrowser` reads out-of-process iframes and merges them into Jev's
    element table, clicks at page coordinates, and hints icon-only buttons.
  - `run_elfsight.py`: the runner (`--frames`, `--keep-open`, `--record`).
  - README (install, run, how it works, limits), plus a row in `PROCESS_INDEX.md`.
- **Verified on the Mason Park Kids widget (`d359c3c4`), read-only:**
  - Jev waited out the editor spinner, then clicked **Theme** inside the iframe (p = 1.0, 5.5 s).
    The frame's text afterwards showed the Theme panel.
  - A direct wrapper test clicked `button [search]` and typed `toddler`; the frame's input held it.
  - Every tab still showed **Published**, so no widget setting changed.
- The first run, without frames, created nothing (the account stayed at 21/50). The widget for
  Mason Park Kids was made through Claude in Chrome instead; see that client's runbook for
  2026-09-29.

## Next

- An end-to-end create run (`--frames`, from `/apps/google-reviews` to the install code) has
  **not** been done: each run makes a real widget on the shared account (22/50 used). Run it on
  the next client that actually needs a widget, not as a test.
- Nested frames and frame-local scrolling are not handled (see the README's limits).

## Gotchas

- **Cross-origin iframes are missing from `Page.getFrameTree` until something attaches to them.**
  Match `Target.getTargets` iframe targets on `parentFrameId` instead.
- **Icon-only buttons are all named "button"**, so Jev cannot choose between them and stops as
  BLOCKED. The hint (class, icon and nearest text words) fixed the search button.
- **`--record` screenshots can time out** (browser-harness allows 5 s) on a heavy background tab
  and abort the run. Recording is off by default now.
- **`browser-harness --doctor` never starts the daemon.** It reports FAIL until a real command runs.
- **Jev's model can add an unasked-for click after the goal is met.** In one run it cleared the
  search field it had just typed into. Name the stopping point, and verify the result yourself.
- **The runner used to leave its tab open.** Six stale editor tabs had to be closed over CDP. It
  now closes the tab unless `--keep-open` is passed.

## Version Control

Tracked on `main` with the system runbook; see SYSTEM_RULES.md §4.
