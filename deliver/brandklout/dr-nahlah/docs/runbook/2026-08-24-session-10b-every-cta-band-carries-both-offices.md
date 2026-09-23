## DONE 2026-08-24 (session 10b): every CTA band carries BOTH offices — DRAFT, seq 67

Follow-on from the split above, and the more consequential half of it.

**Every call-to-action on this site ended in ONE button, and all 24 of them pointed
at `https://flexbook.me/drnahlah` — the ALEXANDRIA calendar.** A reader who had spent
a page reading about the McLean office, then took that page's closing call to action,
booked Alexandria. Nothing on the page said so. That is 23 interior `.pk-cta` bands
plus the home page's `.iv-cta`.

The Webflow build fixed it by replacing the button with its two office cards
(`.location-cta` > `.of`), each carrying its own booking link. Both sites now match.

### What replaced what

| Was | Now |
|---|---|
| one `.btn-dark` + a `.cta-phones` row | `.cta-offices`: two `.ct-office` cards |
| home: a standalone `.iv-locs` strip ABOVE the band, and the button inside it | the strip is gone; the band carries the offices |

Each card: office name, full address, **new** and **current** patient numbers labelled
separately, Directions, and its own Flexbook link — Tysons `flexbook.me/DrNahlahTy/1`,
Alexandria `flexbook.me/drnahlah`. The `.cta-phones` row went because the cards carry
the same two numbers and, unlike the row, say which office and which kind of patient
each belongs to.

The home page's `.iv-locs` strip was **removed, not kept**: with the offices in the
band, leaving it showed both offices twice in a row. Webflow does not do that either.

### Two rules that had to move, not merely be added

- **`.iv-cta .btn { margin-top: 2rem }` had to BECOME `.iv-cta .cta-offices`.** It
  existed to space the one button that closed the home page. Left alone it now matches
  the "Book now" button *inside each card* and pushes both of them 2rem down within
  their own card. Adding the new rules without moving this one looks like it works
  until you look at the home page.
- **`.pk-cta .cta-in` is `90ch` in the Instatic registry and was `60ch` in this
  package.** Pre-existing DRIFT — someone widened it in the editor and the local build
  was never brought into step, so the live band and the local band have been laying
  out differently for a while. The local file is now aligned to the live value; the
  cards' own `max-width` does the real constraining either way.

### `.cta-offices` deliberately has no media query

`repeat(auto-fit, minmax(19rem, 1fr))`, one intrinsic rule. A breakpoint in the
Instatic registry is not one rule but a rule **plus** a condition entry **plus** a
per-rule `contextStyles` key whose emission order is load-bearing — see the three
cascade traps in `15-instatic-api-sync.md`, each of which shipped a regression. One
intrinsic rule cannot get that wrong. Measured 450px + 450px at 1440, stacked at 390.

### How it was pushed, and why not through MCP

`push-cta-offices.mjs`, **entirely over REST**. The MCP node tools need the Site
editor open in a browser and the bridge drops without warning; a 24-page edit through
it would strand pages half-built. The two cards are **deep-cloned from
`/contact-maclean`'s own `.ct-office` articles** under fresh nanoids, so the addresses
and booking links have one source rather than 24 hand-built copies, and the script
refuses to run if those source cards do not carry two DISTINCT Flexbook links.

```bash
# local first — this is the reference the push mirrors
cd deliver/brandklout/dr-nahlah/workflows/04-design/.tmp/site-src
node add-cta-offices.mjs --apply && node build-site.mjs
cd .. && node serve.mjs final-site 8902 &      # the gates need this
node site-test.mjs                              # 637/637
node interaction-test-gsap.mjs http://127.0.0.1:8902/index.html   # 62/64

cd ../../15-instatic-api-sync
node push-cta-offices.mjs --apply               # registry + 24 pages, idempotent
```

Verified on a fresh read: 24 pages each with exactly one `.cta-offices`, two
`.ct-office` cards, two distinct Flexbook links, and **zero** `.btn-dark`,
`.cta-phones` or `.iv-locs` left anywhere. Re-running reports "nothing to do".

### The gotcha that cost the most time

**`pages/*.body.html` are CRLF.** `add-cta-offices.mjs` was written against `\n`, so a
pattern anchored on `-->\n` silently failed to match `-->\r\n`. The home page was left
**half transformed** — the locations strip removed, the button still there — and the
run still reported success, because a *different* replacement in the same file had
fired and the file therefore differed from its input. Two lessons, both now in the
script: normalise line endings on the way in and restore them on the way out, and
**assert the post-condition** (`no .btn-dark survived`) rather than inferring success
from "the file changed".

Its `cutElement()` walks tag depth rather than matching `[\s\S]*?</div>`: `.iv-locs`
contains two `.iv-loc` children, so the lazy form closes on the first inner div and
leaves an unbalanced tree that still builds and still renders, wrongly.

### Still open

1. **NOT PUBLISHED.** Draft at `seq 67`. `POST /publish` bakes all 35 pages — audit
   before and after, per the rule above.
2. Nothing committed.
3. `.iv-locs` / `.iv-loc` / `.iv-row` / `.cta-phones` registry rules are now
   unreferenced and will be dropped by the publish-time tree shake. That is expected;
   they are left in place rather than deleted by hand.
4. `.tmp/backups/pre-cta-offices-*.json` is the draft as it stood before this step.
