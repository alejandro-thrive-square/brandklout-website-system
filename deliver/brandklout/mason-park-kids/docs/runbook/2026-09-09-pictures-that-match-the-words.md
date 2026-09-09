# 2026-09-09 (evening) — PICTURES THAT MATCH THE WORDS, AND NO FIGURE LEFT DANGLING

The client, this evening:

> We need to make a design upgrade to the site with better image selections that match the
> content they are attached to. There are a few sections throughout the site that are very
> unorganized and look very strange. Let's make it locally first so I can review the upgrade.

**Local only.** Nothing was published. The Instatic import has not run; see Next.

## How it was found

Every per-page gate was clean, and had been clean when the morning's work shipped. What found
the faults was `.tmp/shoot-all.mjs`: one full-page capture of all 57 pages, read in order like a
parent would. Two mechanical faults and one selection problem.

### 1. The overlap panel painted under its photograph — nineteen pages

On Invisalign, comprehensive, mouth guards, the toothpaste chart and fifteen more, the
"why here" card's bullets were half hidden behind the picture. The panel is designed to sit ON
the picture (`.sw-overlap`, columns 1-8 and 7-13 of the same row). `data-drift` puts a
transform on the figure, and a transformed element paints in the positioned layer, above any
sibling that is neither positioned nor transformed. The DOM order that used to settle it does
not apply once one of the two is transformed. One line in `site.css`:
`.sw-overlap_panel { position: relative; z-index: 1; }`.

### 2. Sixteen figures were dangling — nine core pages

`add-figures.mjs` (2026-09-08) appended every chapter photograph as its own `.wrap` AFTER the
chapter body: "the dullest possible insertion". A band under a full-width body is fine. A
plate or an inset under a one-column body (the three promises on financing, the price list on
services) hung alone at the foot of the chapter with nothing beside it; under a centred
statement (the reviews' opening word, about's pay-it-forward) it sat off to one side. That is
what "unorganized" meant.

`.tmp/recompose-figures.py` is the fix, one file, every change in its `PLAN`:

| Fix | Where |
| :--- | :--- |
| **beside** the column (`.ch-withfig`, plate sticky) | financing#rule (piggy bank), services#offers (the front desk) |
| **band** under a full-width body | financing#ways, new-patients#questions, our-doctors#measure and #voices, reviews#word, thank-you#next, savings#join |
| **dropped**, the chapter already had photographs | about#forward and #word, services#finder, new-patients#before, reviews#write, thank-you#meanwhile, savings#inside |

### 3. The pictures did not match the words

- **`waiting`** — a 290px crop of a wall with an orchid — was the invitation photograph on 45
  pages and the hero on five, captioned as the waiting room. Gone from every page.
- **`st-case`**, searched as "a clear case on a shelf" so the appliance never appeared, came
  back as a food container and stood for aligners on four pages. **`st-floss` and `st-tube`**
  are both electric toothbrushes. A laptop and a sunlit curtain illustrated intra-oral scanners
  and lasers. A toddler in a chair opened the Invisalign page. **`highfive`**, a stock frame of
  a dentist who does not work here, sat in the overlap of four treatment pages next to
  "Dr. Nguyen will custom-fit...".

## Where the new pictures came from

**Nine of the practice's own, from the client's "MARKETING PHOTOS" album** (`get-album.mjs`):
the front desk (four frames), the waiting-room sofa with the check-in tablet, a toddler at the
gumball machine (two), a boy at the product shelf (two). The album was shot for the family
practice down the hall, but the about page says it in its own words: *same building, same
front desk*. Only the shared front of house was taken. Nothing clinical from that album is on
this site, and every caption says "shared with the family practice" where a stranger's face
could otherwise read as Anabel, Gia or Kebra. **This is a client decision to confirm** — see
Open questions.

**Fourteen bought from Magnific**, each chosen by eye from a twelve-candidate sheet
(`probe-stock.mjs`) and pinned by `id` in `get-stock.mjs`: `st-aligner`, `st-guard`, `st-gap`,
`st-asleep`, `st-phone`, `st-video`, `st-paste`, `st-flossbox`, `st-crown`, `st-bottle`,
`st-piggy`, `st-story`, `st-wave`, `st-milk`. Two chosen ids were disabled on the download
endpoint and were re-chosen from the same sheet. The stock policy is unchanged with one line
made explicit: the OBJECT of a treatment (an aligner in its case, a guard in its case) is an
object and may appear; a procedure, an instrument in a mouth, a chair, a result may not.

## Gotchas

1. **A transformed sibling paints over a later one.** Grid order and DOM order both said the
   panel was on top; `data-drift`'s transform said otherwise, on nineteen pages, for a week.
   Anything that overlaps a `data-drift` or `data-wipe` element needs `position: relative`
   and a `z-index`.
2. **Per-page gates cannot see composition.** `check.mjs`, `shot.mjs` and `crop-all.mjs` all
   passed the dangling plates, because none of them asks "is there something beside this?".
   `shoot-all.mjs` plus your eyes is the gate for that. Run it before saying a design is done.
3. **A full-page capture shows a pinned scene as empty ground.** The Path's pin spacer is
   1400px of nothing at full page and is correct in a viewport. `viewport-probe.mjs` before
   touching the CSS.
4. **`check.mjs` only verified references it could parse as `assets/`.** Seven pages carried
   `../uploads/x.webp` — my path bug — and painted grey boxes while the gate said 0 errors.
   It now checks every relative reference with an asset extension.
5. **Magnific titles lie.** "Child soccer player holding mouthguard" was a boy in a face mask;
   the aligner search returned dental models; the tooth-fairy search returned 3D renders. Look
   at the sheet, buy by `id`, and view the encoded frame again after `prep-images.py`.
6. **A portrait source cut to a 21:9 band shows a strip of wall.** Two desk frames went in as
   bands and came out as the tops of two heads; both were swapped for horizontal frames. A
   portrait belongs in a plate or an inset. `.is-top` exists but is not a cure.
7. **`prep-images.py` re-encodes the whole pool**, including keys whose mirror source is
   absent from this worktree (it leaves those as they are and says so). Three minutes; fine.

### 4. The button hover hid the label — every button, every page

Reported by the client after the review link went out. `.button::after` is the ink fill that
slides up on hover; it was `position: absolute; z-index: 0`, and the label is the anchor's own
text, not a child. A positioned pseudo-element at z-index 0 paints above its parent's in-flow
text, so the fill covered the words. `.button > * { z-index: 1 }` was meant to lift the label
and did nothing, because there is no child. Fix: `isolation: isolate` on `.button` and
`z-index: -1` on the fill, so it sits above the button's background and below its text. The
masthead's Book needed one more line: its colour rule outweighs `.button:hover`, so its label
was staying ink on ink. `hover-probe.mjs` hovers every variant and crops it; all four variants
on four pages now read white on ink. Commit `f6408ede`.

### 5. The homepage, after the client's first look

- **The comfort chapter's portrait slot** (two rows tall, middle column) carried `chair`, a
  landscape treatment-room frame squeezed upright. It now carries `shelf-kid`, the practice's
  own frame of a smiling boy holding a toothpaste box at the shelf by the front desk, captioned
  as the shelf where most visits end.
- **The hero is mirrored** so Dr. Nguyen is on the visible right instead of under the
  headline's veil: `smile-flip`, a new key `prep-images.py` writes from `smile` (`MIRRORED`,
  `--mirror-only`). Her glasses are at the frame's very top edge, and the parallax (a 6% box
  bleed plus a drift that starts at scale 1.09 shifted up 4%) hid the top fifth of the frame,
  so this one hero holds the top, sits flush and carries no `data-drift`. What is still
  missing above her glasses is missing from the photograph; a frame with more headroom would
  be the ask if the client wants her whole face. `probe-hooks.mjs`: all scenes still do work.
  Commit `fb60f3ee`.

### 6. The blog, in shape

The client asked what the old site's blog held, then for an overview page and an article page
built locally first. `build-blog.mjs` (see the README's blog section) harvests the 157 posts
from the recovery's WordPress export into `blog-content.json` and builds `/blog/` and
`/blog/<slug>/` on the current chrome with real posts in them: nine samples, the overview
listing all 157 and linking the nine. Two layouts on no other page (the feature spread, the
year archive); the article is the long-form frame with a table of contents in its sticky head.
`check.mjs` 68 pages, 0 errors; `nav-probe.mjs` on `/blog/` 62 links, 0 bad. **Not published.**
Two things to know: the 2025-2026 posts carried a pasted author bio, a directions link and a
disclaimer in the body, all dropped by the harvest (the byline carries the author); and the
old blog has one duplicated post ("Pacifiers and Teeth Development", 2021 and 2023), left as
found for the client to decide. Commit `ee9fac70`.

## Where it is now

Done locally, **not published**. Commit `e8f2e9ba` on `bk-mason-park-kids`, pushed.

| Gate | Result |
| :--- | :--- |
| `node check.mjs` | 57 pages, **0 errors**, 2 warnings (the same two prose-ceiling warnings as before) |
| `node crop-all.mjs` | **0 cropped headings** across 57 x 2 widths |
| `node shot.mjs --only mobile` on financing, services, doctors, thank-you | 0px overflow, nothing unrevealed |
| `node shoot-all.mjs` | all 57 captured and looked at, twice |
| `python recompose-figures.py --dry-run` | 0 pages would change (idempotent) |
| `node hover-probe.mjs` on four pages | every button variant legible while hovered |
| `node nav-probe.mjs` at three depths | 68 / 50 / 51 internal links, 0 bad; clicks through the masthead land |

Images inside `<main>`: `waiting` on 0 pages (was 50); 23 new keys in the pool
(14 stock, 9 album); `st-case`, `highfive` on 0 pages.

## Next

1. **Client review** at `file://` — open `home/index.html` and click around. Every path is
   relative, and since `656df723` the navigation works from disk too: `site.js` rewrites the
   root-relative links on `file://` only (the client asked for this the same evening; a review
   with dead links is not a review). `nav-probe.mjs` checks it at three depths.
2. If approved: `node upload-media.mjs` (24 new keys, `smile-flip` included), `node import-styles.mjs` (`site.css`
   changed — the overlap fix, `.is-top`, the sticky plate), `node import-pages.mjs`, publish,
   then `audit-live.mjs` at both widths and `crop-all.mjs --live`. `ship-payload.mjs` in the
   order the README gives.
3. `populate-seo.mjs` needs no re-run; no title or description changed.

## Open questions for the client

0. **Which posts come back.** 157 are harvested and nine are built. Sixty-three are Invisalign
   pieces, some written for adults; one post is duplicated. The overview lists every title so
   the choice can be made from the page.

1. **The album frames.** Nine photographs from the family practice's shoot now appear here as
   the shared front of house, captioned as shared. If the practice would rather the kids' site
   showed only its own shoot, say so and they come out; `waiting` does not go back in either
   way — a photograph of that wall at a usable size would be the ask.
2. **The mouth-guard frame** is a studio product shot on white. It is honest and it matches;
   it is also the only frame on the site with no room behind it. A real guard on a real
   kitchen table would be better, and the practice may well have one.

## Version Control

Committed with this worktree. See [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md) section 4.
