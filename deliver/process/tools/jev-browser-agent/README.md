# Jev browser agent

**Division of labour:** Jev handles the computer-use step, clicking through a vendor dashboard
(for example, creating an Elfsight widget and reading its install code). Opus writes the steps,
checks the outcome, and builds the result into the site. Jev is TypeSafe's "system one" model,
driven by Browser Use's [jev-ultrafast](https://github.com/browser-use/jev-ultrafast). It picks an
operation and a target element from an indexed table, in about 0.2 s per step.

This folder holds **our extension, not the vendor code**:

| File | Job |
| :--- | :--- |
| `jev_deep.py` + `deep_snapshot.js` | **Use this.** `DeepBrowser` reads out-of-process iframes at any depth, open shadow roots, same-origin iframes, role-less click targets (div cards), and icon-only buttons (hinted). It offers `PRESS_ENTER` while a text field has focus, hovers before clicking, and hides `forbid` matches from the model. `drive()` runs ordered steps on one tab with patience for loading screens. |
| `jev_frames.py` | The 2026-09-29 one-level iframe reader. Superseded by `jev_deep`; kept for comparison (`--frames`). |
| `run_elfsight.py` | Runs a task as ordered `--goal` steps with `--forbid` patterns, logs every action, pulls any `elfsight-app-<id>` install code, and closes its tab. |
| `bench/` | An offline benchmark: 8 fixtures that reproduce the traps of real dashboards, a two-origin fixture server, and `bench.py`, which scores every run by what the page recorded. |

## The recipe (benchmarked 2026-10-01)

| Variant | What it is | Score |
| :--- | :--- | :--- |
| vanilla | Jev as shipped | 1/8 |
| frames | plus `jev_frames` | 3/8 |
| deep | `jev_deep`, one whole-task goal | 19/24 |
| steps | deep, task split into steps | 5/8 (first pass) |
| **guarded** | **deep + steps + `--forbid`** | **24/24** (×3), 8/8 first pass |

Runs that failed for plumbing reasons (daemon timeouts) are excluded; the raw logs are in
`bench/results/`. Guarded's median run is 3.7 s, and the full create flow takes 15 s over 7 steps.

1. **Perception is the first wall.** Vendor Jev sees only the host page's "Close" in Elfsight's
   editor (the 12× Create/Close loop), and no template cards (they are plain divs). It also sees
   nothing inside nested frames or shadow roots, and has no way to press Enter.
2. **Forbid is what makes it safe.** Every variant without `--forbid` fell for the search dropdown's
   echo row (`Search for "…"`), which resets the search. Worse, `deep` then **published a widget
   with no source and reported DONE**, 3 runs out of 3. Writing a "do not" in the goal is not
   enough; hide the control. Typical patterns: `^close$`, `^upgrade$`, `^search for `, `delete|trash`.
3. **Steps alone do not help.** They only pay off together with forbid. Each step names its own
   stopping point ("… Stop when Connected shows it").
4. **Patience:** Jev picks BLOCKED over WAIT on loading screens, so `drive()` retries BLOCKED twice
   after 1.5 s. A malformed model or text-helper reply is retried once.
5. **Guards in `drive()`:** 4 identical actions in a row return `loop`, and 8 WAITs in a row
   return `stalled`. The text helper alone sees the whole task (`--task`) as its only source of
   values, so it never types a page's placeholder example.
6. **Overlays are read first.** Modals, dropdowns and popovers sit at the end of the DOM, and a
   long preview would otherwise use up the 6000-character text budget (Elfsight's search results).
7. **A DONE is a claim, not proof.** Check the outcome yourself (install code read back, then
   `elfsight-reviews/elfsight_render.py`).

## Install (once per machine)

```bash
# uv: powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
export PATH="$HOME/.local/bin:$PATH"
git clone https://github.com/browser-use/jev-ultrafast ~/tools/jev-ultrafast   # tested at 1231850
cd ~/tools/jev-ultrafast && uv sync
```

- **Keys:** put `TYPESAFE_API_KEY` and `TEXT_MODEL_API_KEY` (OpenRouter), plus `TYPESAFE_MODEL`,
  `TEXT_MODEL_BASE_URL`, `TEXT_MODEL` and `TEXT_MODEL_REASONING`, under `[shared]` in
  `~/.webzite/.env`. `env-sync` does not reach the clone. Copy those six lines into the clone's
  own `.env` (it is gitignored) without printing them.
- The scripts here run from the repository with `uv run --project ~/tools/jev-ultrafast`; nothing
  needs to be copied into the clone any more.

## Which Chrome

- **Dedicated automation profile (preferred).** Launch a Chrome with
  `--remote-debugging-port=9333 --user-data-dir=<dir>`, sign in to the vendor once, then set
  `BU_NAME=auto BU_CDP_URL=http://127.0.0.1:9333`. There is no "Allow remote debugging?" prompt,
  and the agent never touches the user's tabs (on 2026-09-30, automation in the user's own window closed Chrome twice).
- **The user's own Chrome:** needs `chrome://inspect/#remote-debugging` on, and Chrome asks
  "Allow remote debugging?" after every restart. `uv run browser-harness --doctor` never starts the
  daemon; a real command does (`echo 'print(page_info())' | uv run browser-harness`).

## Run

```bash
cd deliver/process/tools/jev-browser-agent
uv run --project ~/tools/jev-ultrafast --env-file ~/tools/jev-ultrafast/.env python run_elfsight.py \
  --url https://dash.elfsight.com/apps/google-reviews --out <scratch dir> \
  --forbid '^close$' --forbid '^upgrade$' --forbid '^search for ' --forbid 'viewport selector' \
  --task "Connect <Name, address> as the Google source, name it '<Client> - Google Reviews', publish" \
  --goal "Click Create widget. Stop when the templates are shown." \
  --goal "Choose the Carousel template. Stop when a source search field is visible." \
  --goal "..."
```

- Write steps the way the page words things, and give each one a stopping point.
- `--keep-open` leaves the tab open. `--record` saves a JPEG per step, but a screenshot of a heavy
  background tab can hit browser-harness's 5 s timeout.
- **Every create run on Elfsight makes a real widget** on the shared account (Google Reviews plan:
  50 widgets). Test with a read-only goal on an existing widget first. The deterministic
  `elfsight-reviews/elfsight_widget.py` remains the proven creator.

## Benchmark

```bash
cd deliver/process/tools/jev-browser-agent/bench
uv run --project ~/tools/jev-ultrafast --env-file ~/tools/jev-ultrafast/.env python bench.py \
  [--variants vanilla,frames,deep,steps,guarded] [--tasks iframe,flow] [--repeats 3]
uv run --project ~/tools/jev-ultrafast python inspect_table.py --browser deep --wait 3 flow   # no model calls
```

- It starts its own headless Chrome (port 9333, throwaway profile, `BU_NAME=bench`) and the fixture
  server (127.0.0.1:8801 and localhost:8802: two sites, so iframes run out of process). It costs
  about one TypeSafe call per step.
- Fixtures: `iframe` (cross-origin editor), `shadow`, `divcards`, `icons`, `enter` (commits on
  Enter only), `echo` (echo row plus a hidden live region), `nested` (an OOPIF inside an OOPIF),
  and `flow` (all of them in one create-widget run). When a new dashboard trap shows up, add a
  fixture for it before changing `jev_deep`.

## How `jev_deep` works

- **Frames:** `Target.getTargets` lists each out-of-process iframe with its `parentFrameId`. The
  owner box is looked up in the *parent's* session (`DOM.getFrameOwner` + `DOM.getBoxModel`), so
  nesting works. Frame *k*'s node ids are offset by *k* × 1,000,000, and its rects by the frame's
  page position, clipped to what its ancestors show.
- **Inside a document**, `deep_snapshot.js` walks open shadow roots and same-origin iframes.
  Hit-testing descends through both, so occlusion checks still hold.
- **Text** puts the frames first (the editor is where the work is), and skips `aria-live` regions,
  which only repeat the results.

## Limits

- Closed shadow roots, canvas, uploads, pop-up tabs, and frame-local scrolling are not handled.
- The text helper (`inception/mercury-2.5`) sometimes returns no value; `drive()` retries once.
- Benchmarked on fixtures. On real Elfsight, a read-only run is verified (2026-10-01: Theme, then Layout, in 2 actions and 11.5 s, preview text read); a create run is not yet. Before trusting it on a new vendor, run a read-only goal there first.

## Version Control

Follows the root rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md) §4. Our scripts, fixtures
and benchmark logs are tracked here. The vendor clone lives outside the repository, in
`~/tools/jev-ultrafast`, and its `.env` is never committed.
