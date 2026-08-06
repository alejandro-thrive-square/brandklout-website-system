# Mason Park Dental — journey packages

Source Asana parent task GID: `1217040406855582`

Three landing pages, rebuilt 2026-08-06 as **narrative journeys** rather than
stacks of coloured bands, against
[DESIGN-STANDARD.md](../../../../docs/DESIGN-STANDARD.md) — specifically the
"Journey architecture — chapters, not bands" section.

| Page | Chapters | Scroll-driven | Full path |
| :--- | :--- | :--- | :--- |
| Invisalign<sup>&reg;</sup> — $1,000 off | 7 | 3 | `workflows/04-design/.tmp/invisalign/index.html` |
| $189 New Patient Special | 7 | 3 | `workflows/04-design/.tmp/new-patient-special/index.html` |
| Thank you | 4 | 2 | `workflows/04-design/.tmp/thank-you/index.html` |

Open any `index.html` directly — the packages run from `file://` with no build
step and no network beyond webfonts and the map embed.

## One source, no duplicates

The previous round kept a copy of `mpd.css` / `mpd.js` / `img/` in every page's
`assets/`, so a fix had to be made three times or it silently diverged. Those
copies are gone. There is now exactly one of everything:

```
.tmp/
  _vendor/gsap/      GSAP 3.13 — vendored so the packages run offline and
                     headless verification is deterministic
  shared/
    mpd.css          tokens, reset, primitives, persistent journey UI
    mpd.js           BOOTSTRAP — client constants + the chapter queue (<head>)
    mpd-flush.js     FLUSH — plugins, conversion layer, journey wiring (</body>)
    img/             the client's own photography and marks
    fetch-assets.mjs re-downloads img/ from the live site (they are gitignored)
    fetch-gsap.mjs   re-downloads _vendor/gsap/ (also gitignored)
  invisalign/index.html
  new-patient-special/index.html
  thank-you/index.html
```

Pages reference `../shared/…` and `../_vendor/…`. Each chapter still carries its
own `<style>` and `<script>` inside the page, so a chapter lifts into Webflow as
one self-contained embed.

## The chapter arcs

Section classes are named for the **story beat**, never the background colour —
`.ch-hesitation`, `.ch-inclusion`, `.ch-proof`. `data-chapter` /
`data-chapter-name` drive the header readout.

**Invisalign** — 00 Arrival · 01 The Hesitation · 02 What It Corrects ·
03 The Inclusion · 04 The Provider · 05 The Proof · 06 The Invitation

**New Patient Special** — 00 Arrival · 01 The Catch · 02 What It Covers ·
03 The Visit · 04 The Team · 05 The Proof · 06 The Invitation

**Thank you** — 00 Received · 01 The Fast Track · 02 What Happens Next ·
03 Where To Find Us

FAQ, financing and insurance are folded **into** the beat that answers the
objection rather than sitting in bands of their own: Invisalign's price ladder,
Cherry and insurance all live inside The Inclusion; the FAQ sits inside The
Invitation.

### Where scroll does the work

Each of these is pinned and **scrubbed** — the content's state is a continuous
function of scroll position, not a class toggled once:

| Page | Chapter | Mechanism |
| :--- | :--- | :--- |
| Invisalign | 01 The Hesitation | Pinned statement, read word by word |
| Invisalign | 02 What It Corrects | Pinned horizontal journey, progress bar on `self.progress` |
| Invisalign | 03 The Inclusion | **Signature.** One pin drives the fee from $4,800 → $3,800 → $3,300 while the four inclusions check off |
| New Patient | 01 The Catch | Pinned statement, read word by word |
| New Patient | 02 What It Covers | **Signature.** $517 → $189, saving counting up, four inclusions checking off |
| New Patient | 03 The Visit | Pinned timeline drawing through the three steps |
| Thank you | 02 What Happens Next | Pinned timeline drawing through the three steps |
| Thank you | 03 Where To Find Us | Pinned map un-cropping while the week deals in |

There is **no `IntersectionObserver`** anywhere in the runtime. An observer can
only say "this is visible now"; it cannot express *how far through* a chapter
you are, which is what every scrubbed moment depends on.

### Continuity devices

Reading-progress bar on the header edge (real document progress), a chapter
readout (`03 · The Inclusion`) from 1000px up, chapter tags in every beat, and
`data-theme` shifts across the arc rather than two alternating tints.

## Deliberate deviations from the standard

**1. The thank-you page has 4 chapters, not 6–8, and 2 scroll-driven chapters,
not 3.** It therefore FAILS `journey-audit.mjs` on those two criteria. This is
intentional and was directed: the rebuild brief states *"the thank-you page is
short by nature — 3-4 chapters is fine there, but it still gets a real arrival
and at least one scroll-driven moment."* Asana specifies **four** sections for
this page and the chapters map to them one for one. Padding it to six would mean
inventing beats for a real practice, and pinning the call box would bury the one
action a post-conversion visitor might still take. Every other gate criterion
passes. **Flagged for a decision rather than quietly worked around.**

**2. No ScrollSmoother.** The reference uses it; this build does not. It stopped
driving the page a few seconds after load (`gsap.ticker` frozen while `rAF` ran
on), and the standard itself warns it breaks the full-page captures the
responsive pass depends on. It is a technique in the reference, not a
requirement in the Definition of done. Native scrolling with ScrollTrigger gives
the same pinned, scrubbed chapters with none of the fragility.

## The bug worth remembering

**A manual `ScrollTrigger.refresh()` racing SplitText's post-font re-split
silently deleted every pin on the page.**

The refresh threw inside `_swapPinOut` ("node to be removed is no longer a child
of this node") and aborted half-done — with the pins already reverted. Pin
spacing never came back, so on the thank-you page a 5929px document collapsed to
3436px and the last two chapters became **physically unreachable by scrolling**.
Wrapping the refresh in try/catch made it worse: the page then failed in total
silence.

Two things hid it:
- a scrub test that moves the page by calling the scroll API directly still
  passes, because it never needs the document to be long enough;
- a screenshot cannot show you a chapter you can't scroll to.

It was only caught by dispatching **real wheel input** and watching the scroll
position stop advancing. The fix is in `mpd-flush.js`: wait for webfonts, build
the journey once, and never refresh during startup.

## Content integrity

Copy, offers, prices, doctor names, credentials and reviews are carried over
**unchanged** from the previous round; the rebuild changed how the pages are
built, not what they say. Everything traces to the client's own material in
[content-intake-summary.md](../../01-content-intake/.tmp/content-intake-summary.md).
Nothing about a real practice is invented.

**Per-page call tracking stays distinct** — `(281) 767-8698` on Invisalign,
`(281) 688-1610` on the New Patient Special, the public `(281) 769-8878`
elsewhere. The thank-you page inherits the originating campaign's number through
`?src=`, validated against the `TRACKING` keys so an arbitrary `?src=` cannot
inject a number. See Open Question 1 in
[project-overview.md](../../../docs/project-overview.md) — **both tracking
numbers must be dialled before any spend.**

## Forms

Both landing pages post to `MPD.WEBHOOK_URL`, still `{{GHL_INBOUND_WEBHOOK_URL}}`.
Until it is supplied the form says plainly that the endpoint is not connected and
offers the phone number. It never fakes a success.

## Restoring the gitignored dependencies

A fresh checkout has neither the images nor GSAP. Without them the pages still
render as complete, readable HTML — they just lose their photography and all
motion. Restore both:

```bash
node shared/fetch-assets.mjs   # 14 client images -> shared/img/
node shared/fetch-gsap.mjs     # GSAP 3.13        -> _vendor/gsap/
```

`fetch-assets.mjs` warms a browser session past the client's SiteGround bot wall
first, then fetches the assets same-origin — a plain `curl` gets a 202 challenge
page instead. `fetch-gsap.mjs` pulls the exact version the packages were
verified against and refuses to write a CDN error page over a real file.

## Verification

Both gates live in [`../../08-qa/.tmp/`](../../08-qa/.tmp/) and must be re-run
after any change:

```bash
node ../../08-qa/.tmp/scrub-proof.mjs [page-slug]   # motion, per page
node ../../08-qa/.tmp/screens.mjs     [page-slug]   # responsive, per page
node ../../../../scripts/journey-audit.mjs <page-dir>
```

Run them **one page at a time**. The full sweep exceeds the 10-minute foreground
limit, and a backgrounded run dies without flushing its output *and* orphans its
Chrome instances.

Last run, 2026-08-06:

| Gate | Invisalign | New Patient | Thank you |
| :--- | :--- | :--- | :--- |
| `journey-audit.mjs` | PASS | PASS | FAIL (documented above) |
| `scrub-proof.mjs` | 20/20 | 20/20 | 17/17 |
| `screens.mjs` | 18/18 | 18/18 | 18/18 |

Screenshots at 360 / 390 / 768 / 1024 / 1440 / 1920 are in
`../../08-qa/.tmp/screenshots/<page-slug>/<width>.png` (gitignored — regenerate
with `screens.mjs`).

### Reading the screenshots

Two artefacts in those images are the capture, not the page, and both were
checked before being dismissed:

- **The sticky call bar appears mid-page** at 360/390. A fixed element renders
  once at its viewport position in a full-page capture. At 1440, where the bar
  is hidden, the same region is clean.
- **The map is an empty grey box.** The embed loads correctly (HTTP 200, iframe
  577×758, child frame present); cross-origin iframes just do not composite into
  `captureBeyondViewport`.

## Not done

- Nothing has been sent to Webflow. That needs local approval **and** a
  per-client Webflow grant that does not exist yet — see
  [mcp-access.md](../../../docs/mcp-access.md).
- No conversion tracking tag is installed. The previous agency's GTM container
  is theirs and must not be reused; the practice's own drops into the marked
  slot on the thank-you page.
- Nothing has been written to Asana.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../../SYSTEM_RULES.md).
