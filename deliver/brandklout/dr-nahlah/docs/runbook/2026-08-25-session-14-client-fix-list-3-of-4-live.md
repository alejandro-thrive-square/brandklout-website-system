## DONE 2026-08-25 (session 14): client fix list — 3 of 4 LIVE

Four items came in: favicon, mobile flicker on home chapters 04/05, review date
order, a "recognised" misspelling. Three are live and verified across all 77
published URLs; the flicker work is built and measured locally but NOT shipped.

### Live and verified

- **Favicon** — was `logo.png`, the 1024x309 WORDMARK, i.e. a gold smear in a
  16px tab. The client already had a proper one on the Webflow site; pulled the
  512x512 from `dr-nahlah.webflow.io` and uploaded it. `push-favicon.mjs`.
  All 77 pages now serve `/uploads/SeUCjBROuHcDic1KpO7jq-favicon-512.png`.
- **"recognised" -> "recognized"** — one visible instance (home Chapter 02 H2)
  plus one in the `seo-head.js` code asset (the /meet-dr-nahlah og:description;
  per-page descriptions only exist there on this platform). The H2 is live; the
  code-asset one is on the DRAFT, pending the next publish.
  `push-home-copy-fixes.mjs`, `fix-seo-head-spelling.mjs`.
- **Review dates month-first** — `18 Aug 2026` -> `Aug 18, 2026`, the six
  `.rv-card` nodes on the home page. Local `gen-reviews.mjs` `when()` updated to
  match so a regenerate does not undo it.

### SOMEONE ELSE IS WORKING IN THIS SITE — check before you publish

Three independent signals during this session, roughly 22:15-22:45Z:

1. A `.vimeo-video` class rule appeared in `site.styleRules` (order 7072, the
   highest on the site, not in the design package, referenced by no node).
2. The home page went 669 -> 670 nodes between two reads two minutes apart.
3. **Two publishes fired that I did not trigger** (22:22:24Z and 22:43:45Z).
   The second one shipped MY draft changes to production.

That last one is the thing to internalise: *their* publish shipped *my* work.
It happened to be complete and verified, so it was fine. It might not be next
time. Before writing to this draft, run `node insta-api.mjs status` and check
`lastPublishedAt`; if it has moved recently, someone is in the editor.

### NOT shipped: the mobile flicker fix

Chapters 04 (Transformation) and 05 (The Path) are the only two pinned
ScrollTrigger sections on the home page, which is exactly what the client
reported. Built and measured in `04-design/.tmp/site-src`, NOT pushed, because
it needs a style-registry write (see below) and the behaviour change needs a
client decision first.

What changed locally:

- `js/91-descender-rescue.js` — a `setInterval(sweep, 200)` ran **for the life
  of every page**, calling `getComputedStyle()` on 8 SplitText masks and writing
  `style.overflow` back: a forced style recalc 5x/second, for ever, long after
  the lines had landed. Now self-stopping, re-armed on `load` and `resize`.
  Visible in the live trace as `sweep site-DEBSF3FU.js:942`, 287ms.
- `sections/ch-path.js` + `css/35-ch-path.css` — touch devices get a CSS
  scroll-snap swipe instead of a pinned horizontal scrub. No pin, no
  `containerAnimation` triggers, no per-frame JS: 67 ScrollTriggers -> 58.
  Desktop is byte-for-byte the same experience (verified: still pins both
  `tPin` and `pathPin`, still greys the shots).
- `js/90-boot.js` — sets `.wz-fine` on `<html>` for a real hovering pointer, so
  the grayscale-reveal CSS can branch on a CLASS. Deliberately not
  `@media(hover:hover)`: Instatic stores non-viewport media queries as custom
  conditions emitted in raw `site.conditions` array order with none of the
  sorting viewport breakpoints get, which is a cascade bug waiting to happen.

**Measured, and read the caveat.** Main-thread work over an identical
synthesized touch scroll, 390x844, 6x CPU throttle
(`08-qa/.tmp/mobile-pin-profile.mjs`):

| | live (old) | local (new) |
|---|---|---|
| ch-05 total main-thread | 64,203ms | 33,636ms (-48%) |
| ch-05 JS (`FunctionCall`) | 10,109ms | 2,019ms (-80%) |
| ch-05 RasterTask count | 897 | 243 (-73%) |
| ch-04 total main-thread | 57,361ms | 28,869ms (-50%) |
| ch-04 RasterTask count | 1,128 | 615 (-45%) |

**The frame-time numbers do NOT replicate and should not be quoted.** An early
run showed ch-05 going p50 33.3ms -> 16.7ms and 67% -> 28% long frames. It does
not reproduce: on identical code, back-to-back runs of the SAME url gave 44.2%
and 61.6% long frames. Two reasons, both worth knowing:

1. A runaway `node -e` media-pagination loop (my own, backgrounded and
   forgotten) burned CPU from 18:08 until I killed it, which is most of the
   session. Every wall-clock number taken in that window is junk.
2. Even clean, `mobile-pin-diagnose.mjs` at 6x throttle is bimodal on this
   machine. **Use `mobile-pin-profile.mjs` (work done) for A/B, not
   `mobile-pin-diagnose.mjs` (wall clock).** Work counts are near-deterministic;
   frame times are not.

### The blocker for shipping it

`src/styles/site.css` is a code asset and is **disabled** — the live page loads
`reset`, `framework` and `style-<hash>.css` only, no `userStyles`. So all CSS is
in the `site.styleRules` registry and the new `.ch-path.is-swipe` rules have to
go in as **`kind: 'ambient'`** (a `class` rule referenced by no `node.classIds`
is tree-shaken at publish — see `15-instatic-api-sync.md`). Not written yet.
**Do not push the JS without the CSS**: `is-swipe` with no styles leaves the
track at `width:max-content` and the page scrolls sideways.

### Also found, not acted on

- **All 43 blog posts carry day-first `.bl-when` dates** (`14 May 2024`), the
  same pattern as the reviews. Client asked only about reviews; flagged, awaiting
  a decision.
- **~700ms of third-party JS** in the live ch-04 trace that is not in the local
  build: `Db normal?lang=auto` (524ms) and `v4513226cdae...` (212ms). Worth
  identifying before any further perf work — it is a bigger single cost than
  anything fixed above.
- **BugHerd**: CONNECTED 2026-08-26. Key is now `BUGHERD` in the repo-root
  `.env`; extractor is
  `deliver/brandklout/dr-nahlah/workflows/05-design-revisions/pull-bugherd.mjs`.
  Project is `537587` "Dr Nahlah". Six open pins exported to that workflow's
  `.tmp/bugherd/` (`feedback.md`, `tasks.json`, `media/`). None are applied yet.

### Gotchas earned this session

- **`PUT /site-document` needs `site` AND `shellBaseSeq` even for a page-only
  write.** Without them it answers a bare `400 {"error":"Invalid request body"}`,
  which reads like a malformed page payload and is not.
- **`POST /admin/api/cms/media` picks the extension from MAGIC BYTES**, not the
  filename, and Webflow serves its favicon PNG under a `.jpg` URL with
  `content-type: image/jpeg`. Read `publicPath` off the response; never build it.
- **Uploading one media asset bumps the shell seq by ~6** (variant generation).
  A seq jump is not by itself evidence of another editor.
- **Static HTML cannot tell you whether a runtime-built element exists.** I
  grepped for `.wz-line-mask`, found zero, and nearly deleted the descender
  rescue as dead code. SplitText builds those masks at runtime — there are 8.
  Probe the live DOM before calling anything dead.
- **`Input.synthesizeScrollGesture` silently moves nothing in `--headless=new`.**
  It reports no error and the page does not scroll, so the harness reports a
  beautiful 16.7ms p50 for a run that never happened. Use raw
  `Input.dispatchTouchEvent`, and assert the page actually travelled.
