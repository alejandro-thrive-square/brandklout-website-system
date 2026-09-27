# Shared context — BugHerd round 2 (pins #8–#11)

You are one of FOUR agents working the same worktree at the same time:

    C:/Users/ACER/orca/workspaces/Brandklout Website System/bk-dr-nahlah
    branch bk-dr-nahlah @ 42a911f

Each of us owns exactly one BugHerd pin. Yours is named in your own brief.
Read this file first, then your brief.

## Read before you touch anything

1. `.claude/RUNBOOK.md` — long, but the top ~700 lines are the last ten sessions
   on this site. Skim for your pin's area. It is the only real memory here.
2. `deliver/brandklout/dr-nahlah/workflows/15-instatic-api-sync/15-instatic-api-sync.md`
   — the API/registry contract. Everything on this site ships through it.
3. `deliver/brandklout/dr-nahlah/workflows/05-design-revisions/.tmp/bugherd/feedback.md`
   — the full board, all 10 pins, with the pinned CSS selector and screenshot
   path for each. Screenshots are in `.tmp/bugherd/media/`. LOOK AT YOURS.

## Hard rules for this round

- **DRAFT ONLY. DO NOT PUBLISH.** The draft already carries two other sessions'
  unpublished work (the seq-98 article layout, and the client's hand-applied
  Vimeo breakpoint edits). A publish ships everyone's, including the three other
  agents running right now. Nobody publishes until the human says so.
- **DO NOT COMMIT.** The human will give the commit instruction after all four
  of us are finished. Leave your work in the working tree.
- **We share one optimistic-concurrency counter.** `PUT /site-document` is gated
  on `shellBaseSeq` + per-page `baseSeqs`. Three other agents are writing to the
  same document. So: re-read the document and take a FRESH seq immediately
  before every write, keep the read→write window as small as you can, and on a
  409 re-read and retry rather than forcing. A seq that jumped since your last
  read is one of us, not corruption — do not "repair" it.
- **Verify by reading back**, subtree-scoped, never by grepping the whole page
  (drawer + footer live in the same node tree and will inflate every count).
- Write your patch as a named, re-runnable `.mjs` beside the others in
  `15-instatic-api-sync/`, in the house style: assert the match count, assert the
  byte delta, read back, refuse on anything unexpected.

## Two site-wide traps that have already cost sessions

- **`position: sticky` is inert on this site.** ScrollSmoother puts everything
  inside `#smooth-wrapper{position:fixed;overflow:hidden}`. If your design needs
  sticky, it needs a ScrollTrigger pin instead.
- **`src/scripts/seo-head.js` rewrites the `<head>` at runtime** and outranks the
  publisher. Never diagnose a head tag from `curl` — read the live DOM after
  scripts run.
- The `mobile` breakpoint on this site is `(max-width: 375px)` and misses every
  phone wider than an SE. If you mean "single column", target the base rule or
  an existing condition. `site.conditions` is already sorted — REUSE a condition,
  never invent one.

## When you finish

Append a dated section to `.claude/RUNBOOK.md` for your pin: what you changed,
what you verified, and the gotchas you earned. Write it for someone with no
memory of your session. Then set your card comment:

    orca worktree set --worktree active --comment "<pin> done, draft-only" --json

Then stop. Do not pick up another pin — the other three are owned.
