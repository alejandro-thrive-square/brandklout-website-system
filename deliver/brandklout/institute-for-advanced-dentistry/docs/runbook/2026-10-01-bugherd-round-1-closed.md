# 2026-10-01 — BugHerd round 1 closed on the board

Alejandro: "Let's resolve the BugHerd comments." Project `542527` held the 42 round-1 notes of
2026-09-23 (all on the home page), still `todo`: they had been fixed and published on 2026-09-23 but
never moved or answered ([round-1 run](2026-09-23-bugherd-round-1.md)). Since then the home was rebuilt
from the new site source and the review rotator became the live Elfsight widget, so every note was
re-verified on the published staging home (seq 12) before anything was closed.

## Done

- **Fetched every task in full** (`scenario-0-new-site/03-design-build/output/bugherd/fetch.mjs`: task by
  id, comments, attachments; out `bugherd/2026-10-01/tasks.json` + screenshots, gitignored with the images).
- **Re-verified at the reviewer's 1512x735** (`bugherd/verify-r1.mjs`): 34 automated checks pass; the copy
  checks first read FAIL only because `innerText` returns CSS-uppercased text, confirmed present in the
  published HTML. Looked at the crops for 11/14/15 (faces clear of the cards) and 20 (both ears).
  Note 4: the hero film plays from load without a scroll in Playwright WebKit (not proof for the
  reviewer's Safari; the reply asks them to re-check). Note 40: GoHighLevel's `enableSaveExitConfirmation`
  is now **off** on form `cxtQ5q29TfUr3cYlMmDB` (`check-ghl-form.mjs`: off, quiet).
- **Replied on all 42 and moved 40 to done** (`bugherd/resolve.mjs`, every reply with its scope per
  `deliver/docs/BUGHERD.md`). Read back: board `done 40, todo 2`.

## Open (left `todo`, each with a reply)

- **#33 auto-rotating reviews.** The rotator is now the live Google reviews widget (Elfsight app
  `7febe92d-…`, shared agency account). It has arrows and dots but does not autoplay (same first review for
  33 s, `bugherd/probe-reviews.mjs`). Autoplay is a widget setting in Elfsight (it pauses on hover);
  the registry says never to edit widgets from here. Decide, then flip it in Elfsight.
- **#38 procedure field on the form.** The GoHighLevel form has first/last name, phone, email and the
  hidden consent fields only. A "procedure interested in" dropdown must be added in GoHighLevel.
- The replies also ask the practice to confirm: Friday to Sunday closed, office languages beyond
  English/French/Dutch, the FAQ answers (sedation, cost), and to re-check the film in their Safari (#4).

## Gotchas

- Any check that reads `innerText` sees `text-transform: uppercase`: compare against `textContent` or the
  published HTML.
- The Elfsight widget renders in a shadow root; read it by walking `shadowRoot`s.
- BugHerd replies post as the API key's owner, and every assignee gets the notification.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md). Ids only; the API key stays in `.env`.
