# 2026-09-15 — BugHerd round two: the same 48 notes, checked in the reviewer's Safari

**Instance:** `https://staging.masonparkdental.com`. Production untouched. Asana untouched.
**Commit:** `1bf6ecee` (this file's own SHA follows in the docs commit).
**Verified live:** published 19:55:11Z, 57 pages, draft matches published. `verify-live.mjs`
clean on `/`, `/about-us`, `/our-doctors`, `/our-team`, `/patient-reviews` and
`/services/invisalign`: 200, fonts, GSAP and journey booted, 0 broken images, 0 overflow. Every
changed spot re-shot live in WebKit at 1512×735 (`.tmp/bugherd/sel-live2-webkit/`) and matches
the local render. BugHerd: 48 comments posted, 45 notes moved to done
(`replies-2026-09-15.json`).

## What changed on the board since 2026-09-10

Nothing written. `pull.mjs` fetched all 48 tasks by id with comments and attachments
(`.tmp/bugherd/tasks-2026-09-15.json`, screenshots in `screens-2026-09-15/`, gitignored);
`diff-rounds.mjs` against the 09-10 export (`diff-2026-09-15.txt`) found no new task, no
comment, no edited description, no status or column move. The 19:32–19:34Z touches on #1–#33,
by "BrandKlout Success" about five seconds apart, were the agency **assigning** those notes to
Alejandro (#34–#49 have no assignee). The 09-10 export did not record assignees, so the change
looked like nothing.

Two things the 09-10 round had missed, found by pulling each task whole:

- **Every note was filed in Safari 26.6.2 on a Mac at 1512×735** (#3 at 1512×652, #42–#49 at
  1523×735). 09-10 verified in Chrome at 1440. Every note was re-shot live in WebKit 18.2 at the
  reviewer's size (`shots-live-webkit/`, `sel-live-webkit/`) before deciding what still stood.
- **Six notes carry attachments** (#3, #5, #6, #15, #38, #42), all from 09-09/10, never fetched
  before. #3's shows the foot of the L in DENTAL cut off, which answered 09-10's "which browser".

## Disposition — by note number

**Still wrong after 09-10, fixed this round**
- **#3** Logo clipped in Safari. The artwork has two source pixels under DENTAL (under one CSS
  pixel at 181 px wide) and Safari composites the filtered, white logo on a layer cut at the
  box's fractional edge. `.navbar_logo` now has `padding-block: .3rem` inside a content-box, so
  the letters sit off that edge; header height unchanged (Invisalign's heights did not move).
  WebKit 18.2 renders the logo whole before and after, so it could not be proven in Safari 26:
  **left in todo with a question asking the reviewer to confirm in Safari.**
- **#6** The relay's closing sentence still hung alone above ~200 px of white (09-10 only
  trimmed padding). A photograph of the front counter (album 84, `checkin-counter`) now sits
  beside it in `.re-after`, captioned "The front counter, suite 104A". Done.
- **#21** The home band's huddle (album 134) was cropped to bowed heads under a shelf. It is now
  album 162 (`team-huddle-smile`), framed on the laughing woman in front. Done.
- **#45** Two halves, only one answered on 09-10. The pane still held the blue-shirt clinician
  jammed against its right edge — the same scene as the home stack's frame — and nine of the
  team page's fifteen photographs were also on the home page. Ten slots now use album frames
  used nowhere else, one scene per slot (`apply-2026-09-15.mjs`): arrival 80, sheet 13 / 21 /
  169 / 138 / 188 / 50 (plaques and pair-window kept), pane 91 (a portrait source), pair 181,
  off-duty band 48, invitation 206. Done.

**Verified live in WebKit at the reviewer's size, no change needed** — replied and moved to done:
#2, #4, #5, #7, #8, #10–#20, #22–#42, #44, #46–#49. #5's caption has room, #38's three
portraits match, #40's heads are whole, #42's columns share rows, #49's lede is live.

**Needs the agency, left in todo with a question**
- **#1** The photograph of Drs. Nguyen and Sung with their kids is not in the 212-frame album,
  the old site or Grand Mission's site. Asked them to send it.
- **#3** Asked for one look in Safari (above).
- **#43** The Canva team portraits. Asked for an export or view access.

## Gates

`check.mjs` 223/0; `prune-nav.mjs --check` every link resolves; `probe-hooks.mjs` clean on `/`
and `/our-team` (pass an absolute Windows path, `$(cd home && pwd -W)/index.html` — a relative
one becomes `file:///home/...`); `probe-heights.mjs` moved only home section 1 (the relay, the
approved #6 change) at every width, baseline re-saved, re-diff clean.

## The push

`backup-staging.masonparkdental.com-2026-09-15T19-11-43.json` first (57 pages, seq 76, taken
before any write; staging had not changed since the 09-10 publish). Then `push-2026-09-15.sh`,
the 09-10 order with every step's exit code checked and `RAILWAY_TOKEN` unset. Log in
`.tmp/bugherd/push-2026-09-15.log`.

## Gotchas

**`POST /admin/api/cms/publish` can answer 502 and still publish.** The last step,
`import-scripts.mjs --publish`, saved (seq 79) and then threw on a 502 from the proxy, so the
chain stopped with exit 1. `publishStatus()` showed `lastPublishedAt` 19:55:11Z,
`draftMatchesPublished: true`, 57/57, and the live pages carried the new frames. Read the
status before re-running anything; a 502 there is the gateway timing out, not the publish
failing.

**`import-album.mjs` used to delete `frame.mjs`'s frames.** It rebuilt the manifest from
`PICKS` alone, so a re-run dropped every `frame: "external"` entry — `dr-sung-standing` is on 33
pages. Fixed: it now carries them over. Check `node -e` for `dr-sung-standing` after any run.

**The BugHerd list endpoint and the 09-10 export both hide what matters.** Browser, viewport,
assignees and attachments only come from `tasks/<id>.json` and `tasks/<id>/attachments.json`.
Always pull by id; always read `requester_browser` before calling a note unreproducible.

**Photo framing by file, not slot.** `img[src*="mp-<key>-"]` survives the import's
`/uploads/<id>-mp-<key>-...` rename. Two crops needed a second pass after the first render (the
home band cut the face at the eyes; the team band showed only a mouth) — render every reframed
photo at the reviewer's size before pushing.

## Next

- The agency: the family photograph (#1), a look at the logo in Safari (#3), the Canva
  portraits (#43).
- Everything from the 404 run's list still stands: Privacy/Cookie policies, a form backend, the
  Amazon tag, the toothpaste chart, the per-page meta report, then promote staging.

## Version Control

Tracked with the client's runbook; see the repo's SYSTEM_RULES.md §4.
