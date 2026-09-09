# RUNBOOK - `bk-mason-park-kids`

The **standing** state of this project: what is true now, what is next, and the traps.
Dated run history is one file per run under [`runbook/`](./runbook/INDEX.md) — read the index,
then only the runs you need. Do not read them all.


**This worktree holds exactly one site: Mason Park Dental for Kids,
`pediatricdentistkatytx.com`, in `deliver/brandklout/mason-park-kids/`.** Nothing else. If a task
is about `bestdentistinkatytx.com` / `mason-park.up.railway.app`, it belongs one directory over in
`bk-mason-park` - stop and switch, do not do it here.

## Where the site is, as of 2026-09-09

**57 pages live and published at <https://mason-park-kids.up.railway.app>, all of them on the
same design as of 2026-09-09.** **LOCAL IS AHEAD OF LIVE** since the evening of 2026-09-09:
the image pass (`docs/runbook/2026-09-09-pictures-that-match-the-words.md`) is committed and
awaiting the client's review at `file://`; when approved, run the import in the README's order
(`upload-media` for 24 new keys, `import-styles` because `site.css` changed, `import-pages`,
publish, then the live gates). The public domain still does not point here; that host is the
review link. Every gate is clean: `check.mjs` 0 errors, `crop-all.mjs` 0 across 57 x 2 widths,
`audit-live.mjs` 57/57 at both 1440 and 390, and `crop-all.mjs --live` 0 against the
published site.

| | State |
| :--- | :--- |
| The **eleven core pages** | Designed, and the design is now identical on disk and published. `workflows/03-core-pages/` is the source. |
| The **blog** | **In shape, 2026-09-09 (evening), local only.** `/blog/` and nine sample articles built by `build-blog.mjs` from the 157 recovered posts; the rest are one `--all` away once the practice says which. |
| The **46 migrated pages** | **Redesigned, 2026-09-09.** All 57 pages now carry the same masthead and footer, the fluid type, the journey layer, at least one photograph and a ground that changes under the reader. They have local source for the first time: `.tmp/harvest-migrated.mjs` pulled their content down, a recipe in `.tmp/recipes/` says which blocks go where, and `.tmp/build-pages.mjs` wrote the files. **From here the files are the source** - edit a page's `<main>` in place, exactly like the eleven. |
| Head tags | Every page has a description, canonical, Open Graph and JSON-LD, written at publish by the two plugins in `deliver/process/19-instatic-seo`. |
| Type | Fraunces and Nunito, the VARIABLE files, self-hosted on both sides. The platform's static instances are still installed as the fallback. |

### The gates, and what each one is for

Run from `workflows/03-core-pages/.tmp/`. All of them are cheap; run them all.

| Command | Answers |
| :--- | :--- |
| `node check.mjs` | Do the assets resolve, the braces balance, the prose fit, the chrome match? |
| `node shot.mjs <page>` | What does it look like at four widths, and which font is really painted? |
| `node crop-all.mjs` / `--live` | Does any heading lose ink to a clipping ancestor? Walks `home/`, so it sweeps all 57. |
| `node shoot-all.mjs ../home <dir>` then LOOK | Does every chapter hold together? The per-page gates cannot see a figure hanging alone; this can. Pinned scenes show as empty ground here and are fine: `viewport-probe.mjs` for those. |
| `node hover-probe.mjs ../home/<page>/index.html` | Can you still read a button while hovering it? A crop of every variant, hovered. |
| `node nav-probe.mjs ../home/<page>/index.html` | Can the client click through the review from disk? Every internal link must resolve to a file, at every depth. |
| `python recompose-figures.py --dry-run` | Is every picture still where the plan puts it? 0 pages should change. |
| `node build-blog.mjs --list` | Which of the 157 posts are built, and the old-URL to new-URL map. `--all` builds every post; the overview links whatever is on disk. |
| `node build-pages.mjs --list` | Which pages have a recipe. **Order is `build-pages` then `stamp` then `check`, and it does not commute.** |
| `node diff-all.mjs` | Local against live, all eleven: head, structure, text, geometry. |
| `node audit-live.mjs` / `--width 390` | **All 57 routes**, not the eleven. |
| `node verify-live.mjs` / `--migrated` | The published pages, end to end. |
| `node probe-hooks.mjs <url>` | Do the scrubbed scenes actually do work? |

### The traps that have each cost a session

1. **Look at every Magnific face before you ship it.** It will return a
   convincing photograph of somebody who is not the person. Two of this
   practice's named staff came back as different people; `contact-sheet.py`
   is what caught it.
2. **`import-styles.mjs` ships `instatic/site.css`,** which `to-instatic.mjs`
   writes. Edit the stylesheet without re-exporting and it publishes the
   previous one silently.
3. **`abspath` before you open anything under the recovery mirror.** Windows
   applies MAX_PATH to the unresolved string, so a valid path fails as "no such
   file" from this worktree's root.
4. **A gate with a hard-coded page list watches only what is in the list.**
   `crop-all.mjs` carried the eleven as an array while 46 other pages drifted
   onto a different nav bar for a week, and `check.mjs` reported the chrome
   identical the whole time because the other pages had no local file to read.
   Every gate walks `home/` now. Keep it that way.
5. **A positioned pseudo-element paints over its parent's own text.** The button fill at
   `z-index: 0` hid every label on hover; `.button > *` cannot lift a bare text node. Fill at
   `z-index: -1` inside `isolation: isolate`. `hover-probe.mjs` is the gate.
6. **A transformed sibling paints on top.** `data-drift` and `data-wipe` put transforms
   on figures; anything meant to overlap one needs `position: relative` and a `z-index`,
   or the picture rides over the text (it did, on nineteen pages, for a week).
7. **The adult practice is not this practice.** Dr. William Sung, teeth
   whitening, implants, `bestdentistinkatytx.com`: all of it belongs to
   `bk-mason-park`. It arrived here through the 02 migration and was cleaned
   out of six pages on 2026-09-09. If you see his name on this site, it is a
   bug.

