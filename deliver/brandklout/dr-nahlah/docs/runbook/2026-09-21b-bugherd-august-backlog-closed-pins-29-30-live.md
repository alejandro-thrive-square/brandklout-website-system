## 2026-09-21b: the August BugHerd backlog closed, #29 and #30 fixed — PUBLISHED AND VERIFIED LIVE

The board went from **17 open pins to 5**. Ten were already fixed and live and had
simply never been written back; two had never been picked up by anyone and were
built today; five stay open and are blocked on somebody other than us.

Published at **2026-09-21T18:0x** (seq 266, `do-publish.mjs`), gated live by
`22-instatic-api-sync/verify-pin29-30.mjs` — **55 live pages plus one article, all
green**. Re-run that script any time; it reads the published site only.

### The answer to "why are these still open", because it is the only interesting part

Sessions 19, 20 and 21 fixed #13, #14, #21–#28, verified every one against the live
HTML, and then said this in the runbook:

> The BugHerd board was NOT touched — the pins are still open there for whoever
> normally closes them.
> — `2026-08-27-session-19-…`

Nobody ever was that person. Closing the board was not part of the loop: each
session treated BugHerd as read-only input, wrote a runbook, and moved on. On
2 September all four of the still-open ones were bulk-assigned to Alejandro, which
is the only thing that touched them between 28 August and today.

**That changed on 2026-09-21.** `close-bugherd-*.mjs` writes comments and statuses
back over the API, and three of them now exist. **Write the board back at the end of
a review round — it is not somebody else's job.**

### Group 1 — ten pins, fixed in August, closed today

`close-bugherd-august-backlog-2026-09-21.mjs --apply`. Each got a comment saying
what the fix was and when it shipped, and every claim was re-checked against the
live site first rather than taken from the runbook:

| pin | live evidence checked today |
|---|---|
| 13 | `.mband { max-width:120rem; margin-inline:auto }` in the published stylesheet |
| 14 | `.pk-reviews` + the reputationhub embed on /patient-stories |
| 21/22/23 | facility cards serve `…-4529.jpg`, `…-22237.jpg`, `…-2622.jpg` |
| 24 | card 05 is `swap-2-0.png`, the Magnific face-swap |
| 25 | `text-wrap: balance` on `.pk-cta h2` |
| 26 | topic chips populated — Implants 16, Aftercare 11, All-on-4 8, … |
| 27 | 43 articles, no repeated image |
| 28 | `#specPortrait` is no longer `dr-and-yolanda.jpg` |

#21/#22/#23 were in `doing` rather than `todo`, and their comments are worth
reading if this ever recurs: the client wrote "can you attach the correct photo
here please?" at 13:21–13:23 and session 19 published at 13:25:45. They were
looking at the pre-publish page. **Read comment timestamps against publish
timestamps before believing a complaint.**

### Group 2 — #29 and #30, filed 31 August, never picked up

Three days after session 21, and the next work on this client was the plugin and
ads-landing streams, which came from a different brief. No runbook mentions
either pin. Both built today.

**#29 — /dental-conditions, "capitalize all words".** Ten `summary` labels in
`#conditions`, sentence case. `push-pin29-condition-caps.mjs`. The text is on a
`base.text` CHILD of each `summary` container, never on the summary itself.
Title case, so the two `or`s stay lowercase — flagged on the pin, one line to
reverse. Only the accordion labels; the prose headings on that page are sentence
case by design across the site and were left alone.

**#30 — the footer, "both location addresses and phone numbers".** Half of it was
already there: both new-patient numbers, neither street address.
`push-pin30-footer-addresses.mjs` rebuilds each list item as
`<b>name</b><div>street</div><div>city</div><a>phone</a>`, which is the idiom the
hours list above it already uses, and gives the list the `.foot-facts` class so it
inherits that column's colour and the brighter `b`.

- **The footer is NOT a shared component on this site.** Every page carries its own
  copy of the whole subtree under its own node ids. 38 of the 56 rows have it, so
  this was a 38-page write, 456 nodes added. One of the 38 is `post`, the entry
  template, which is how the change reached all 43 articles.
- Addresses are asserted against the contact pages before anything is written, so
  the footer cannot drift away from them.
- The 18 ads landing pages were NOT changed. They have their own footer, which
  already carried both addresses.

### Gotchas

- **A footer gate that keys on `<h4>Hours</h4>` reports the 18 ads pages as
  failures.** They have a different footer that already satisfies the pin. Assert on
  the addresses and the `tel:` hrefs inside the last `<footer>` element, which both
  footers have to satisfy, not on one footer's markup.
- **`props.tag === 'footer'` does not mean "the site footer".** The review-wall
  cards use `footer` as their own tag, and every ads page has a dark footer too.
  The shape that identifies the main footer is the `.foot-facts` list; the reliable
  gate is the rendered HTML, not the node tree.
- **The Alexandria number renders as (571) 583-4820 in a browser.** That is the GHL
  `number_pool.js` call-tracking swap doing its job — the served HTML and the
  `tel:` href are 253-7790. It swaps Alexandria and not McLean, which is a GHL pool
  setting nobody here has looked at. Do not file it as a footer bug.
- **`curl … | grep -o 'ct-office-grid.\{0,2400\}'` hangs.** Catastrophic
  backtracking on a big minified page; it ran past the 120s tool timeout. Slice the
  file in Node instead.
- **No puppeteer or playwright in this worktree.** The visual check was the Chrome
  MCP against the live site. Force `scrollBehavior:auto` and drive ScrollSmoother's
  own `scrollTo`, then let it settle ~2.6s.

### Still open, and why — all five blocked on somebody else

| pin | blocked on |
|---|---|
| 32 | the Continue step and "Preferred Method of Contact" live in the GHL form, not the page |
| 39 | answered; one wording discrepancy between /all-on-4 and /sedation-dentistry left for the client |
| 41, 42 | one filmed veneer patient; nothing in the 14-film library can stand in |
| 47 | a real five-year-warranty terms sheet from the practice |

### Files

- `05-design-revisions/close-bugherd-august-backlog-2026-09-21.mjs` — the ten
- `05-design-revisions/close-bugherd-29-30-2026-09-21.mjs` — the two
- `22-instatic-api-sync/push-pin29-condition-caps.mjs`
- `22-instatic-api-sync/push-pin30-footer-addresses.mjs`
- `22-instatic-api-sync/verify-pin29-30.mjs` — the live gate for both

### Version Control

Committed on `bk-dr-nahlah`. The local package was updated to match, so a rebuild
cannot undo either change: `partials/footer.html` carries the two office blocks and
`pages/dental-conditions.body.html` the title-case labels. `build-site.mjs` re-run,
55/55 pages, and both changes checked in `final-site/`.
