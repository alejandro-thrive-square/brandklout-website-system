# 2026-10-01 — BugHerd round two: 125 pins closed on the board, #7 and #95 left open

## What was asked

> close the resolved pins

## Done

The board (project **539158**) had no new pins since round two (last update 2026-09-30 22:46). Each of
the 127 open tasks got a reply; 125 were set to `done`. Every reply names the staging URL of the
pinned page, the scope (`site-wide, …` for the shared-component pins listed in the
[round-two run](./2026-10-01-bugherd-round-two-on-staging.md), otherwise `this page only`), and that
production follows with the next promotion. The board now reads 129 done, 2 todo.

Left open, each with a reply:

- **#7**: GoHighLevel's "Submission in progress" prompt. The fix is in GHL (turn save-and-exit off on
  form `Nzf3xQVLhgMlABuVMxCN`).
- **#95**: it has no attachment. It was applied the same way as #96/#97 (the mirror photo on the Face
  band), and the reply asks the agency to confirm.

## Not done

Production promotion: the decisions in the round-two run still stand (patient consent, the
steps-photo embroidery, the Google widget layout).

## Gotchas

- API v2: reply with `POST projects/{p}/tasks/{id}/comments.json` `{comment:{text}}`, close with
  `PUT projects/{p}/tasks/{id}.json` `{task:{status:"done"}}`. Use the global task id, not the
  local `#n`. The task's page is `site` + `url`.
- The closing replies say "on staging", so the pins are done on the board while production still
  serves the pre-round site. Don't read a closed pin as live.

## Version Control

Tracked. Committed on `bk-stone`; not pushed, not merged.
