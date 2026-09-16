# 2026-09-16 — BugHerd round three: a standalone adult site, readable motion, the team portraits

**Instance:** `https://staging.masonparkdental.com`. Production untouched.
**Commit:** `d967a971` (this file and the build, together).
**Verified live:** see "The push" below.

## What arrived

- **28 new notes, #50-#77**, filed 2026-09-15 20:26-21:22Z by "BrandKlout Success", Safari on a
  Mac at **1512x652** this time (not 735). Home, Services, Financing, Our Doctors.
- **Three reopened:** #1 (a screenshot of the Drive folder "Mason Park" shared with us), #43
  ("Canva access shared"), #3 (moved back to todo with no comment: the logo is still clipped).
- **The team portraits**: 13 staff + Dr. Cho, 750x750 PNG, same studio set, dropped by the user in
  `workflows/01-content-intake/.tmp/Mason Park -Team/` (gitignored). Names and roles are the file
  names (`team-2026-09-16.json`).
- **Drive works** (`scripts/drive.mjs` in the main checkout). "Mason Park" is a *shared drive*
  (`0AEGRwjQtecY9Uk9PVA`), not a folder: `search --folders` finds nothing, `roots` lists it.
  Pulled to `01-content-intake/.tmp/drive-2026-09-16/`: the family photographs
  (`CTP_TamNguyen2026-68/69.jpg`), a brand guide PDF, three front-desk phone photos.
- **#65 "see details inside the task in asana about the insurance":** the "Insurance and
  Financing" subtasks are all empty. The detail is a **comment by Jessica on "Complete Mason Park
  Pediatric" (`1215184637381803`), 2026-09-15:** "Insurance for Mason Park Pediatrics and Adults.
  We take all PPO's. Mason park takes Delta Dental and Medicaid". Found with the Asana MCP's
  `search_tasks` (scratch script); `asana-context.mjs mason-park` does not cover that task.

## Disposition — by note number

**Site-wide (one fix, every page)**
- **#50, #64 fill in faster / ADA.** `data-write`, the relay and the proof quote: the unwritten
  colour was .18/.22 alpha (~1.3:1). It is now `--jr-unwritten` .66 (~4.5:1 on paper, ~7:1 on ink),
  and the scrub runs `top 95%` → `top 55%` of the element (relay `top 92%` → `top 45%`, its copper
  tail `top 60%` → `top 35%`). `probe-hooks.mjs` updated to the new range.
- **#71, #77 heading disappears / big empty space; #64 too.** Root cause, measured in WebKit
  (`probe-fold.mjs`): opening a `details.el-fold` grows the page ~400px and ScrollTrigger only
  re-measures on window resize, so every trigger below fired early — chapter heads departed
  (opacity 0) while on screen. `journey.js` now refreshes ScrollTrigger when
  `documentElement.scrollHeight` actually changes (ResizeObserver on body + capture `toggle`).
- **#67, #75 colour/black-and-white.** Every `filter: grayscale(...)` on photographs removed (20
  rules); the map keeps its partial desaturation. Photographs are colour at rest everywhere.
- **#54, #55 hover unreadable.** `.ch .button::after` (the hover fill) sat at z-index 0 *over*
  the label, because labels are bare text nodes that `> *` never lifts. Fill is now z-index -1
  inside `isolation: isolate`. Every chapter button on the site.
- **#73, #74 photo grows on "read more".** `elevate.js holdSplit()`: on the summary's *click*
  (before the fold opens — `toggle` fires after layout has grown) the split's ink figure is held at
  its current height and made sticky under the header; closing releases it.
- **#3 logo (reopened).** `logo-rows.mjs`: the artwork touches all four edges of every logo file
  (bottom gap 0 px). `logo-pad.mjs` re-exported it with transparent margin inside the file,
  `mp-logo-nav-422x180.png`; the header `<img>` swapped on all 223 pages, CSS width scaled 406→422,
  the 09-15 `padding-block` hack removed. **Left in todo** asking for a look in Safari 26.

**Home (`#53` is the big one)** — "two stand alone sites ... let Mason Park focus on cosmetic and
general". The home page's two-practice story is rewritten around this practice, structure kept:
hero meta, relay statement/after/turn, "Under One Roof" → "The Practice" (h2, lede, figures 2
general dentists / 100 hours CE, aside, the versus table), the wall, range blurb, pair line,
people lede and band, FAQ (page + JSON-LD). Dr. Nguyen stays, named as **Mason Park Dental for
Kids**. #1 hero = the family photo (`family-nguyen-sung`, laid 118% wide from the left above 992
so the family sits right of the copy; title steps down to `--f-d2` above 992). #51 #52 #56 are
the agency's words verbatim.
**Services:** #61 title, #57 lede ends "in Katy, TX", #59/#58 map head, #60 count removed, #62
button → "Start with a checkup" (`/services/preventative-dentistry/`) and the finder leads with the
cleaning row (rows renumbered, its frame is the resting one), #63 Dr. Nguyen's HS-8 portrait on
the pediatric half; chapter "The Two Practices" → "Next Door".
**Financing:** #65 answer + table head. **#66 Cherry left in todo**: no practice Cherry link
exists anywhere we can read, and pay.withcherry.com 403s curl and times out headless Chrome.
**Doctors:** #68 headline, #69/#70 kickers (also the home cards), #72 role and "Where", #76 lede.
**Team:** #43 new chapter `#team` "The people you will meet" (data-chapter 3, which was free):
13 portraits grouped Hygienists / Dental assistants / Front office, sticky label column ≥992.
Dr. Cho's studio headshot is framed (`team-dr-dave-cho`) but not used.

Page edits are `apply-2026-09-16.mjs` (idempotent, re-run prints `0 change(s)`); replies are
`reply-2026-09-16.mjs` (29 to done, #3 and #66 stay in todo).

## Gates

`check.mjs` 223/0. `prune-nav.mjs --check` clean. `probe-hooks.mjs` clean on home, team, doctors,
financing, services, about, invisalign. `probe-heights.mjs --diff base` moved only
`home/index.html` (sections 0-2, 6: the approved copy), overflow 0 everywhere, Invisalign unmoved;
baseline re-saved. Every note re-shot locally in WebKit at 1512x652
(`shots-0916-local-webkit/`), plus hero at 390/1512/1920 and the hovers (`at/`).

## The push

Backup first: `backup-staging.masonparkdental.com-2026-09-16T15-31-55.json` (57 pages, 715
media, staging unchanged since the 09-15 publish). Then `push-2026-09-16.sh`, log
`.tmp/bugherd/push-2026-09-16.log`: every step exit 0, published 15:41:07Z, 57/57,
draft matches published. A second, scripts-only publish (`import-scripts.mjs --publish`,
`push-2026-09-16b.log`, 15:51:19Z) shipped the split-line fix (Gotchas).

`verify-live.mjs` clean on `/`, `/our-services`, `/financing`, `/our-doctors`, `/our-team`,
`/about-us`, `/services/invisalign` (200, GSAP booted, 0 broken images, 0 overflow). Every note
re-shot live in WebKit at 1512x652 (`shots-0916-live2-webkit/`); `probe-fold.mjs` live: portrait
held at 1044px, all headings opacity 1; `probe-split.mjs` live: no `.jr-line` left after the
reveals on four pages. **BugHerd:** 31 comments posted, 29 notes to done, #3 and #66 left in
todo with a question (`replies-2026-09-16.json`).

## Gotchas

- **Line splits froze before the live display face loaded.** Live only: the home hero broke as
  "Your Lifetime Partner / in / Dental Health" (SplitText measured with the fallback face, and
  Instatic's static Newsreader instance is wider). `journey.js` now **reverts every line split
  once its reveal completes**, and the generic `[data-split]` loop skips `.ar-title`, which
  `arrival()` splits itself (it was being split twice). Check a new long headline *live*.
- **Git Bash rewrites `/path` arguments** into `C:/Program Files/Git/path`: `verify-live.mjs
  $URL /about-us` requested `/C:/Program%20Files/Git/about-us` and 404'd. Prefix
  `MSYS_NO_PATHCONV=1`.

- **The phone hero showed the photo stack over its buttons, live, since 09-10.**
  `a.el-stack { display: block }` (the #2 fix) outranked `.el-stack { display: none }` below 992.
  Fixed with a matching `a.el-stack` rule in the media query. A "make it a link" fix can undo a
  breakpoint hide — check phones after changing an element's tag.
- **`toggle` on `<details>` fires after the layout change.** Measure on the summary's click.
- **Heredocs and `node -e` eat backslashes and apostrophes here** — a regex and an Edit both broke
  this run. Use the Write/Edit tools or a Python script with `chr(92)`.
- **The BugHerd window size changes between rounds** (735 → 652). Read `requester_browser_size`
  per task; `shot-tasks.mjs` does, and takes `TASKS=` for the export.
- **Local serving:** `.tmp/bugherd/serve.mjs` serves `home/` on :8089 for WebKit shots.

## Next

- Agency: Mason Park's Cherry link (#66); one look at the logo in Safari 26 (#3); whether
  Medicaid applies to the adult practice (#65 reply asks).
- #53 was applied to the home and services pages. About, New Patients and other inner pages may
  still say "two practices"; ask whether the agency wants the same pass there.
- Still open from before: Privacy/Cookie policies, a form backend, the Amazon tag, the
  toothpaste chart, the per-page meta report, then promote staging.

## Version Control

Tracked with the client's runbook; see the repo's SYSTEM_RULES.md §4.
