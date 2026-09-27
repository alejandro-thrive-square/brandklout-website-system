# BugHerd #8 — services cards: cursor-following image on desktop, plain image on touch

Read `_shared.md` in this folder FIRST. You own pin #8 and nothing else.

Board: https://www.bugherd.com/projects/537587/tasks/8
Screenshot: `../media/task-8-screenshot.jpg`
Page: `/` on https://www.drnahlah.com
Pinned element:
`main#top > section#services.ch-services > div.wrap.section > div#svcGrid.sv-grid > a.sv-card`

## The client's words

> On desktop I want to have a hover effect with an image showing following the
> cursor and on mobile and tablet the image should be present on the card with
> no hover effect.

## What exists today

Chapter 07 "The Services" was built last week for pin #6 by
`15-instatic-api-sync/push-services-section.mjs`. It is deliberately a
TYPOGRAPHIC index — number, name, one line of copy, hairline grid — and it was
made image-free on purpose, because Standard above it is four photos and Proof
below it opens on full-bleed video. Read that script and the runbook's
"session 15b / #6" section before you change its character.

Local source of truth for the section:
- `.../04-design/.tmp/final-site/...` and the design package's
  `css/39-ch-services.css`
- the block in `pages/home.body.html`

11 cards, one per treatment page.

## What #8 actually asks for

The image arrives on both sides — the difference is only how it is presented:

- **Desktop (fine pointer)**: image is hidden until hover, then follows the
  cursor. One shared floating element that swaps its `src` per hovered card is
  the right build — not 11 absolutely-positioned images. Drive it with GSAP
  `quickTo` (GSAP is already on the page) so it lags the cursor rather than
  snapping to it. Gate on the site's existing `.wz-fine` class, which is how
  every other hover on this site is gated — do NOT gate on width.
- **Mobile and tablet (coarse pointer)**: the image is simply IN the card, laid
  out, always visible, no hover behaviour and no floating element at all. That
  changes the card's layout on touch, so the grid rules need a real design pass,
  not a `display:block` bolted on.

## Where the 11 images come from

This is the part that needs judgement, and it overlaps another agent's pin.

- Pin **#11** (another agent, running right now) is de-duplicating imagery
  site-wide: no repeated image on the same page, and no round-radius images. The
  home page is in scope for them. **Your 11 new images all land on the home
  page**, so they must not collide with what Standard/Proof/Path already use
  there, and they must not repeat each other.
- Source order, same as the client set for pin #7: the site's own media library
  first (434 assets), Magnific/Freepik only as fallback. Key is `MAGNIFIC` in the
  repo-root `.env` — it is a Freepik key, header `x-freepik-api-key`.
  `15-instatic-api-sync/pick-post-images.mjs` is the working reference for both
  the library allowlist pattern and the Freepik call; read it, don't reinvent it.
- The library has NAMED PATIENT portraits and case photography in it. An
  allowlist, never a blocklist — `post-image-pool.mjs` explains why.
- A treatment card wants the treatment, not a stock smile. Query the topic with a
  curated phrase; do NOT build a query out of the card's title (that mistake put
  one image on 24 of 43 articles last week).

**Coordinate on this**: leave a note in
`.tmp/bugherd/briefs/NOTES-images.md` listing the 11 asset ids/paths you claim
for the home page, and read that file before you pick, in case #11's agent got
there first.

## Done means

- Live-DOM verified on the DRAFT at both a fine-pointer width and a coarse one.
- The floating element does not exist in the DOM on touch (not merely hidden) —
  or if it does, prove it costs nothing.
- No horizontal overflow at any width. The last two chapters on this site both
  broke that way.
- Runbook section appended. No publish, no commit.
