## 2026-08-27 (session 20): BugHerd #13 reopened, #24 #25 new — PUBLISHED AND VERIFIED LIVE

Second review round. The client closed 8 pins, **reopened #13** with a design
direction, moved #21/#22/#23 to *doing* with comments, and filed **#24** and
**#25**. Draft reached shell seq 115, published at **2026-08-27T14:04:23Z**, and
`.tmp/verify-s20.mjs` asserts all of it against the LIVE bundle — 22 assertions,
all green. Snapshot before the publish:
`.tmp/backups/pre-publish-s20-{site,pages}.json`.

### Read the comment timestamps before believing a pin

`#21`, `#22` and `#23` carry "Can you attach the correct photo here please?" —
written at **13:21–13:23**, and session 19 published at **13:25:45**. The client
was looking at the pre-publish page. All three replacements were already live
when they wrote it; nothing needed doing. `#13`'s comment (13:40) and `#24`
(13:33) and `#25` (13:37) are genuine post-publish feedback.

`pull-bugherd.mjs` records `created_at` on every comment. Use it.

### #13, second pass — the cap is the real fix, and session 19's crop was half of it

> "the face is cut of on larger breakpoints so the solution is to have a max
> width on this section across the site. Should be larger than the global
> container or max width but on middle and smaller screens should be filling up
> the entire screen width."

They were right, and more precisely right than the first fix. `.mband`'s HEIGHT
caps at 34rem; its WIDTH never did. So `cover` cropped harder with every extra
pixel of viewport:

| viewport | band | ratio | source height visible |
|---|---|---|---|
| 1440 | 1425x544 | 2.62 | 57% |
| 1920 | 1905x612 | 3.11 | 48% |
| 2560 | 2545x680 | 3.74 | **36%** |

`object-position: 50% 0%` keeps the face in frame at all of those, but cannot
stop the photograph being magnified. `max-width: 1800px; margin-inline: auto`
holds the frame at ~2.65 however large the display gets — the 1440 proportion the
design was drawn at.

- **1800, not 1560.** `--maxw` is 1560; the band has to read as breaking out of
  the content column, so it is deliberately wider.
- **No breakpoint.** "fills the entire screen width on middle and smaller
  screens" is what a max-width already does. Between ~1800 and ~1900 there is a
  25–50px margin; looked at, and it reads as a deliberate inset, not a bug.
- **`mband-top` STAYS.** At the capped width the frame is 2.65:1 — essentially
  the 2.62:1 that cropped her face at the default `50% 50%` in the first place.
  Verified still applied on /patient-stories only.

Applies to all five `.mband` pages, which is what "across the site" asked for.
/all-on-4 checked at 2560: contained, better proportioned, nothing broken.

### #25 — `text-wrap: balance`, and why an injected-CSS trial lied

> "On this section the heading should be wrapped in a symmetrical way"

`.pk-cta h2 { max-width: 20ch }` decides where the CTA heading wraps, and on
/smile-makeover it orphaned one word: "See it before you commit to" / "it."
`text-wrap: balance` gives "See it before you" / "commit to it." at 1440, 1024
and 390.

**Injecting the rule with `.tmp/shot.mjs --css` showed no change at all, and that
was not the rule failing.** GSAP SplitText measures the natural line boxes at
boot and replaces them with one `div.wz-line` per line; by the time injected CSS
lands there is nothing left for the browser to re-balance. It has to be a real
registry rule. To trial one of these without publishing, undo the split first —
`h.textContent = h.getAttribute('aria-label')` — then apply the style; that is
what `--js` was added to `shot.mjs` for.

`.pk-cta` is on 23 pages and this lands on every CTA heading. Intended: the
client is describing how the heading style should behave.

### #24 — the face swap, and what the picture actually is

> "We shouldn't add doctors who are not Dr. Nahlah. Let's try to edit this photo
> with the Magnific AI Generation API so we can swap the face for the Dr.
> Nahlah."

Card 05 "Milling machine" held `26192.jpg`, a licensed stock model who read as a
member of staff. It now holds a composite: the same stock laboratory and the same
stock body with **Dr. Nahlah's face**, from his own headshot.

I pushed back once — a synthetic photograph of a real named clinician on a
medical site — and the user answered that Dr. Nahlah is their own client, his
likeness is already across the site, and the card is decorative. That is their
call to make and it was made; this note records what the image IS so nobody
downstream overstates it. **It is not a photograph of Dr. Nahlah at this
practice's milling machine.** The alt text is therefore about the WORK, not the
person — "A milling unit cutting a restoration in the practice's laboratory" —
because alt text is read aloud and should not assert what the picture cannot
support.

#### The framing lesson, which cost two wasted generation rounds

`POST /v1/ai/gemini-2-5-flash-image-preview` has **no aspect-ratio parameter**,
and *the model takes its output shape from the reference images, not from the
prompt.* With the portrait 1024x1280 headshot in the set it returned 896x1152
every single time, however firmly the prompt demanded "landscape 3:2, do not
output a portrait image". Cropping the headshot to a landscape face plate first
gave 1248x832 on the very next attempt.

Also earned:

- **Reference images must be inlined as base64.** Passing CMS URLs fails with
  `could not download image: the URL returned HTTP 403` — Cloudflare blocks
  Freepik's fetcher. It is a 400 on the POST, so no task is created and no quota
  is spent, but nothing is generated either.
- **One in three generations ignores the swap** and returns the original head.
  Generate 3 and look at them; do not trust a single result.
- The endpoint answers `x-freepik-api-key`; the docs say `x-magnific-api-key`.
  Both are sent.

### Tools added

- `push-css-tweaks.mjs [--apply] [--only <key>]` — declaration-level MERGES into
  style rules that already exist. Every job names the declarations it expects to
  find unchanged and the read-back asserts them one by one, because a wholesale
  `styles` replace drops five properties to add one, silently. Carries #13 and
  #25.
- `gen-card-face-swap.mjs [--n N]` — generation only, writes candidates to
  `.tmp/pin24/` and a contact sheet. Ledger per task id; nothing is uploaded.
- `push-milling-card.mjs [--file …] [--apply]` — uploads the chosen candidate and
  points card 05 at it.
- `.tmp/crop.mjs <src> <out.png> <w> <h> [sx sy sw sh]` — crop/resize in headless
  Chrome, no native image dependency. Two gotchas baked in: the page is
  NAVIGATED to the local origin serving the bytes (an `about:blank` page reading
  127.0.0.1 is cross-origin and taints the canvas, and `toDataURL` then throws
  SecurityError), and the content-type is sniffed from the magic bytes (Chrome
  refuses to decode an image served as `application/octet-stream`).
- `.tmp/shot.mjs` gained `--js`, which runs arbitrary script after load and
  before the screenshot. Used to swap image `src`s and to un-split a heading.
- `.tmp/verify-s20.mjs` — 22 assertions against the live site.

### Gotcha: the published stylesheet is PRETTY-PRINTED

`verify-s20.mjs` first reported nine failures against a site that was completely
correct, because the bundle is `.mband {\n  position: relative;\n  …` — spaces
before the brace, one declaration per line — and the regexes assumed minified
output. The apostrophe in alt text is escaped `&#x27;`, not `&#39;`. Extract a
block by string search and compare whitespace-stripped; do not regex the
selector, it gets mangled through the shell/Python/JS layers.

### Still open on the board

- **#14** (backlog, /patient-stories `#score`): "Add review widget here". Not
  started.
- **#21/#22/#23** are in *doing* on the board with stale comments; the work is
  live. Someone should close them.
- 43 post rows still share 14 featured images — `briefs/NOTES-posts.md`.
- `.pk-cta h2` is `20ch` live and `15ch` in `site-src`; `.mz-plain`/
  `.pk-card-fig-pad` figures hold different images in the two. **The static build
  has drifted from the CMS and is not a picture of the live site.**

### Re-verifying

```bash
node .tmp/verify-s19.mjs      # session 19's 17 assertions
node .tmp/verify-s20.mjs      # this session's 22
node push-css-tweaks.mjs      # dry: should say every declaration is in place
```
