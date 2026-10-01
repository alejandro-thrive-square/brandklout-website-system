# Jev browser agent

**Division of labour:** Jev handles the computer-use step, clicking through a vendor dashboard
(for example, creating an Elfsight widget and reading its install code). Opus builds the result
into the site. Jev is TypeSafe's "system one" model driven by Browser Use's
[jev-ultrafast](https://github.com/browser-use/jev-ultrafast). It chooses an operation and a
target element from an indexed table, in about 0.2 s per step.

This folder holds **our extension, not the vendor code**:

| File | Job |
| :--- | :--- |
| `jev_frames.py` | `FramedBrowser`: cross-origin iframe support plus hints for icon-only buttons. `jev_frames.install()` swaps it into `jev_ultrafast.Agent`; no vendor file is patched. |
| `run_elfsight.py` | Runs one goal (or an ordered list of goals), logs every action, pulls any `elfsight-app-<id>` install code off the final page, and closes its tab. |

## Install (once per machine)

```bash
# uv: powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
export PATH="$HOME/.local/bin:$PATH"
git clone https://github.com/browser-use/jev-ultrafast ~/tools/jev-ultrafast   # tested at 1231850
cd ~/tools/jev-ultrafast && uv sync
cp "<repo>/deliver/process/tools/jev-browser-agent/"*.py .
```

- **Keys:** put `TYPESAFE_API_KEY` and `TEXT_MODEL_API_KEY` (OpenRouter), plus `TYPESAFE_MODEL`,
  `TEXT_MODEL_BASE_URL`, `TEXT_MODEL` and `TEXT_MODEL_REASONING`, under `[shared]` in
  `~/.webzite/.env`. `env-sync` does not reach the clone. Copy those six lines into the clone's
  own `.env` (it is gitignored) without printing them.
- **Chrome:** turn on `chrome://inspect/#remote-debugging`. `uv run browser-harness --doctor`
  never starts the daemon, so it reports FAIL until a real command runs, for example
  `echo 'print(page_info())' | uv run browser-harness`. That first command raises Chrome's
  "Allow remote debugging?" prompt.

## Run

```bash
uv run --env-file .env python run_elfsight.py --frames \
  --url https://dash.elfsight.com/apps/google-reviews \
  --goal "Create a new Google Reviews widget ..." --goal "..." --out <scratch dir>
```

- **Always pass `--frames` for Elfsight.** Its widget editor is a cross-origin iframe. Without the
  flag, Jev sees only the host page's "Close" button, and it looped Create / Close 12 times
  (2026-09-29).
- `--keep-open` leaves the tab open for inspection. `--record` saves a JPEG per step, but a
  screenshot of a heavy background tab can hit browser-harness's 5 s timeout and abort the run.
- Write goals the way the page words things, and name the stopping point ("then stop as DONE").
  Name what must not happen ("do not click Publish / Close / Upgrade"). A DONE is a claim, not
  proof: check the outcome yourself, the way `run_elfsight.py` reads the install code back.

## How `jev_frames.py` works

- **Finding frames.** An out-of-process iframe is *not* in `Page.getFrameTree` until something
  attaches to it. `Target.getTargets` does list it, with `parentFrameId` naming the owner tab.
  Its box comes from `DOM.getFrameOwner` plus `DOM.getBoxModel`.
- **One table.** Each visible frame is read with Jev's own `snapshot.js`. Frame *k*'s node ids are
  offset by *k* × 1,000,000, and its rects by the iframe's position on the page.
- **Acting.** The node is resolved and hit-tested inside its own document. The click is a real
  mouse event at page coordinates on the top-level session. Typing follows focus into the frame.
- **Icon-only buttons** (named just "button") get a hint built from their class and icon names and
  the nearest short text, for example `button [search]`. Words only, never selectors.

## Limits

- Frames nested inside other frames are not read (only frames owned by the tab's own frames).
- Scrolling is a wheel event at a fixed point on the page, not aimed at a frame's own scroller.
- Every create run on Elfsight makes a real widget on the shared agency account (Google Reviews
  plan: 50 widgets). Test on an existing widget with a read-only goal first.
- Jev's model can add an unasked-for click after reaching the goal. Verified 2026-09-29: it
  cleared a search field it had just typed into.

## Version Control

Follows the root rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md) §4. Only our two Python
files are tracked here. The vendor clone lives outside the repository, in `~/tools/jev-ultrafast`,
and its `.env` is never committed.
