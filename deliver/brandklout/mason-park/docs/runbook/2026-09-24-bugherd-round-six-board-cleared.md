# 2026-09-24 — BugHerd round six: the last twelve notes, and the board is clear

Round five left twelve notes in todo, all waiting on the agency: eight whose attachment BugHerd had
stored as an empty file, two whose attachment repeated a photo already on the same page, the Safari
logo (#3) and the Cherry link (#66). A fresh pull showed nothing had moved: no new notes, no new
comments, and the eight files were still 0 bytes, with or without the API key. We were asked to
resolve them anyway, so we chose the photos ourselves and closed all twelve. **BugHerd now has 251
notes, all done.**

## Done

Implementation commit: see the commit that carries this file.

Everything below is in `workflows/09-static-rebuild/.tmp/bugherd/`. Pull: `tasks-2026-09-24.json`
(untracked, like the earlier exports), digest `open-2026-09-24.txt`.

### Six photographs, chosen for their copy

Plan: `plan-2026-09-24/G-open.json`. Cut with `frames-2026-09-24.mjs` and placed with
`apply-2026-09-24.mjs` (copies of the 09-23 pair with the plan folder moved). All are licensed Freepik
stock (the `MAGNIFIC` key, `plan-2026-09-23/stock/search.mjs`). The originals are
`plan-2026-09-23/stock/r6-*.jpg`, gitignored media.

| Note | Slot | Now | Freepik id |
| :--- | :--- | :--- | :--- |
| #112 | Home, range arc 1, Hygiene and Gum Care thumbnail (was the sterilizer) | a hygienist's hand, mirror and scaler at the teeth | 160579464 |
| #125 | Patient Reviews hero (was the mother and teenage daughter at the desk) | a patient laughing in the chair, **mirrored** so she sits right of the headline | 83035989 |
| #178 | Mouth guards, "What grinding costs if you leave it" (was the corridor) | teeth worn down and broken at the edges | 45270861 |
| #185 | Fluoride, step 01 "Oral examination" (was the handheld x-ray) | a dentist checking an older man's teeth with a mirror | 17387834 |
| #202 | Implant restorations, "It looks and feels like a tooth" (was two of the team laughing) | an implant crown on a model beside natural teeth | 379414475 |
| #252 | TMJ, card 01 "Jaw pain or tenderness" (was the front desk) | a woman pressing her hand to her jaw | 43849049 |

#182, #195, #228 and #235 already had stand-ins from 09-23 (`fill-*` in `plan-2026-09-23/F-fill.json`),
checked on staging and kept.

### #66, Cherry

The practice's Cherry page is **`https://pay.withcherry.com/grand-mission-dentistry`**. It is the
Grand Mission Dentistry account; its location list includes *Mason Park Dental, 21830 Kingsland Blvd
Ste 104A, Katy* (Cherry location id 48579). The old Mason Park site used the same slug in its Cherry
widget and its home page link (seen in the Wayback copy of `bestdentistinkatytx.com/financing/`).
Financing now links the Cherry column heading and has an "Apply with Cherry" button in the "How it
starts" cell, which tells patients to choose Mason Park Dental as their location. CSS: the round-six
block at the foot of `site.css`.

### #3, the logo

`logo-webkit-2026-09-24.mjs` rendered staging in WebKit at 1512×735 (the reviewer's), 1440 and 1920,
at 2x, at the top of the page and with the header stuck: the logo box is whole every time, with no
clipping ancestor. Closed with a note to reopen it with a screenshot if Safari 26 still cuts it.

## Verified

Local: `check.mjs` **0 errors on 229 pages**. `sweep-live-2026-09-21.mjs` and `sweep-390-2026-09-23.mjs`
over the 7 changed pages, 0 problems. Section shots of the reviews hero and the financing table at 1440
and 390 look right.

Staging: backup `backup-staging.masonparkdental.com-2026-09-24T21-29-12.json` first (63 pages, 1301
media, shell seq 114, draft == published). No row had been written since round five's publish, and
`drift-2026-09-23.mjs` showed only the six planned swaps. `push-2026-09-24.sh` ran every step with
exit 0. After it, drift reported **0 of 34 pages differ**, all six `mp-r6-*` frames and both Cherry
links are served, and the sweep is clean except for a `/favicon.ico` 404 that Chrome requests on its own.

Board: 12 comments posted and 12 notes moved to done (`reply-2026-09-24.mjs`). A recount shows 0 in
todo, backlog, doing and feedback.

## Gotchas

- **A practice's Cherry link can live under a sister practice.** Guessed slugs
  (`pay.withcherry.com/masonparkdental`) redirect to `/not-found`, and `curl` only gets the app shell.
  The slug was in the old site's Cherry widget config (`variables.slug`) in the Wayback copy. The
  location list only shows when the page is rendered: `cherry-locations.mjs` reads it from the JSON the
  app fetches.
- **Playwright's `getByText(...).click()` fails on Radix pickers.** The trigger button covers the
  label; click `button[aria-haspopup=dialog]` instead.
- **`.cp-matrix td a` outranks `.button`.** A button inside the matrix gets the inline-link underline
  and ink colour unless it has its own higher-specificity rule (`a.button.cp-apply`).
- **The bash heredoc Chrome path again.** `C:\\Program Files\\...` lost its backslashes; use forward
  slashes in new scripts.

## Next

- Nothing is open on BugHerd. If the agency sends the photos they meant for the empty notes, each
  goes in the same way: a plan entry with a new key, `frames-2026-09-24.mjs`, `apply-2026-09-24.mjs`.
- Flag for the agency if they ask: #125's hero and #202's implant crown are stock; the crown looks
  like a render.
- **Production is unchanged.** This round is staging only.

## Version Control

This run file follows the runbook rules in [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
