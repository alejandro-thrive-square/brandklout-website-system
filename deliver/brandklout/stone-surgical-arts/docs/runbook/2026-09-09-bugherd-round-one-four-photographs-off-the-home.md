# 2026-09-09, afternoon — The first BugHerd round applied: four photographs off the home page

## What was asked

> Can you access BugHerd and see the changes that I just suggested?

Yes — and that is the first useful thing this run established. **BugHerd was removed from the
build this morning, and the board is still fully readable from here.** The removal took away the
on-page sidebar; the client pins through the browser extension, and the board is read over the API.
The `BUGHERD` key in `~/.webzite/.env` is a personal **API** key (not the public board key), used as
HTTP Basic `<key>:x`. Stone is project **539158**. The mechanics are now written into
[trap 29](../../workflows/21-instatic-upload/21-instatic-upload.md).

Four tasks were open, all pinned on `/` by the client at 12:48–12:56 UTC, all `todo`:

| # | id | Asked | Element under the pin |
| :-- | :-- | :--- | :--- |
| 1 | 31030130 | "We need to remove this photo" | `.arrival_component figure.arrival_inset img` — `dr-stone-desk.webp` |
| 2 | 31030234 | "Let's remove this photo" | `.strip_component figure.strip_tile.is-wide.is-up img` — `ssa-front-desk.webp` |
| 3 | 31030241 | "Let's remove this photo" | `.strip_component figure.strip_tile.is-square img` — `ssa-reception-pair.webp` |
| 4 | 31030246 | "Let's just have the first photo of Dr. Stone only. We don't need to switch photos. That animation, I don't think it's good for UX." | `.surgeon_component figure.surgeon_frames img:nth-of-type(2)` — `dr-stone-portrait.webp` |

Item 4 is the only one that is not a deletion: it is a decision about a **behaviour**. The section
cross-faded three portraits as the reader moved through the three steps. The client asked for one
portrait and no swap.

## Done

Four edits, all confined to the home page. **No image file was deleted** — every one of the four is
still placed on another page (`about`, `book`, `team`, `treatments`, `meet-the-doctor`), so the
library is untouched and only the home-page instances came out.

- `pages/home.body.html` — the whole `figure.arrival_inset` (photo **and** its caption plate) out of
  the hero; two `figure.strip_tile` out of the practice strip, leaving eight; two of the three
  `.surgeon_frames` images out, leaving `dr-stone-standing.webp` carrying its `.is-active`.
- `js/12-elevate.js` — `surgeon()` no longer touches the frames. It still lights the step in the
  reader's eyeline and dims the others, which is a separate effect the client did not object to.
  The comment above it records the request verbatim so the next reader does not "restore" the
  cross-fade as a missing feature.
- `css/52-elevate.css`, `css/58-breathe.css` — the `.arrival_inset*` rules removed (four base rules,
  two in the 991px query, a width override and one entry in a shared hover list). Nothing else
  referenced them; `.arrival_inset` now appears nowhere in the repository.

Gates, all clean:

- `build-site.mjs` — 52 pages. `site.css` 251.2KB, `site.js` 56.5KB.
- `audit.mjs` — `FAIL none`, `WARN none`. `check-copy.mjs` — clean.
- `journey-test.mjs` — **47/47**, including "no console errors with motion on", which is the one
  that would have caught `surgeon()` reaching for frames that no longer exist.
- Full pipeline, because the markup and the CSS both moved: `build-import-input.mjs` → `ship.sh`
  (52 pages, **`"warnings": 0` on all 52**) → `push-site.mjs --apply --force` → `publish()`
  `{"publishedPages":52}`.
- `verify-live.mjs` — 52 routes, 183 URLs, **596** asset references (601 before; the five fewer are
  the removed photographs' `srcset` entries), 8 retired routes gone, 52/52 distinct titles,
  `FAIL none`.
- `compare-live.mjs` over all 52 pages — **one finding, on `index`, and it is the tool racing
  itself**: `is-current` sat on a different `.surgeon_step` locally than live. Re-running
  `compare-live.mjs index` gave **no differences**. See the gotcha below before treating it as real.
- Live check on the published home page: `arrival_inset` gone, zero references to any of the four
  photographs, 8 `strip_tile`, 1 `surgeon_frames` image; and `surgeon_frames img` gone from the
  live bundle, which is how you know the JS shipped (see the 2026-09-09 key-swap run for why
  `/assets/site.js` is not the file to read).

## Gotchas

- **The BugHerd list endpoint does not tell you what was pinned.** `tasks.json` gives the
  description and nothing else useful — no `url`, no `selector_info`, no `screenshot_url`. You have
  to fetch each task on its own to get the CSS path and the `<img src>` under the pin, and that is
  the only thing that reliably identifies the element: three of these four descriptions are the
  same sentence.
- **The single-task endpoint takes the global `id`, not the `local_task_id` the board shows.**
  `projects/539158/tasks/1.json` is a flat `404`, which reads as "no API access to tasks";
  `projects/539158/tasks/31030130.json` is that same task #1 and returns everything.
- **`git checkout -- <file>` rewrites LF to CRLF in this worktree** (`core.autocrlf=true`), and the
  build tools all write LF. A file restored that way diffs as *every line changed*. Normalise after
  any checkout, or you will commit a whole-file rewrite around a four-line edit. Line endings are
  already mixed across `site-src/` — `52-elevate.css` is LF, `58-breathe.css` is CRLF — so a regex
  that hardcodes `
` silently matches nothing in half the files. Write `
?
`.
- **`String.replace(a, b)` eats `$$` in the replacement string.** Patching `12-elevate.js` through
  a string replacement turned `$$(".surgeon_step", root)` into `$(".surgeon_step", root)` — valid
  syntax, `node --check` passes, and `steps.length` is then `undefined` so the function returns
  early and the steps never light. This codebase uses `$`/`$$` throughout, so **always pass a
  function** as the replacement: `s.replace(old, () => neu)`.
- **The shared API client was listed in sparse-checkout but deleted on disk**, and neither
  `git sparse-checkout add` nor `reapply` brought it back — git had it as a working-tree deletion.
  `git restore -- deliver/brandklout/dr-nahlah/workflows/15-instatic-api-sync` is the fix. Check
  `git status` for stray ` D` lines afterwards; there was one unrelated file
  (`dr-nahlah/workflows/testimonials-text.txt`) in the same state, which would have been committed
  as a deletion by a `git commit -a`.
- **A scratch Railway link dir has to be made fresh each time**; nothing in the repo is linked.
  `railway link -p b3cae5d8-5f45-4e5c-8bfb-03113bb45327 -s "Stone Surgical Arts" -e production` in
  a temp directory, then `RAILWAY_LINK_DIR` at it. `check-link.mjs` runs first inside `ship.sh` and
  confirmed it serves `stone-surgical-arts-production.up.railway.app`.
- **`compare-live.mjs` reports a false `is-* classes` finding on `index`, and it is a race.**
  `is-current` on the home page comes only from `.surgeon_step` (the only `is-current` owner on that
  page), set by an IntersectionObserver with `rootMargin: -40% 0px -40%`. Which of the three steps
  is in that band depends on exactly where the capture's scroll settled, so the local and live
  captures can legitimately disagree by one step. **Re-run the single page before investigating**
  — `compare-live.mjs index` came back clean. Nothing else on the page can carry `is-current`, so
  a finding naming any other class here is real.
- **`compare-live.mjs` on 52 pages runs well past ten minutes.** Give it its own `COMPARE_PORT` and
  a background slot rather than a foreground timeout.

## Next

- The remaining three BugHerd tasks in this round are done and the board is the client's to close;
  the four were left in `todo` rather than moved to `done` by API, since the reviewer decides when
  a pin is satisfied.
- The journal (39 articles) still has had no client review pass.
- The standing "Next" item asking for a `pg.close()` in `compare-live.mjs` is **done** — `capture()`
  closes both pages in a `finally`, so `--shots` survives a full run. Removed from `RUNBOOK.md`.

## Version Control

Tracked. Committed with the work it describes.
