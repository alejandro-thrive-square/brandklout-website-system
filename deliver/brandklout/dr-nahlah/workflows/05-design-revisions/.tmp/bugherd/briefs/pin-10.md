# BugHerd #10 — /posts needs a search bar and a filter per topic

Read `_shared.md` in this folder FIRST. You own pin #10 and nothing else.

Board: https://www.bugherd.com/projects/537587/tasks/10
Screenshot: `../media/task-10-screenshot.jpg`
Page: `/posts` on https://www.drnahlah.com
Pinned element:
`main#top > section#articles.pk.pk-alt > div.wrap.section`

## The client's words

> Here we should have a search bar and a filter per topic

## The shape of the problem

43 articles, rendered as `article.bl-card` inside `.bl-grid` on the `/posts`
index. They are **CMS rows behind the `post` template**, not pages — so there is
no server-side query surface here. This is a client-side filter over a list that
is already fully in the DOM, which for 43 rows is the right answer anyway: no
fetch, no spinner, instant.

## "A filter per topic" — decide what a topic IS, and say so

There is no topic/category field on these rows unless you find one. Check before
you build. `15-instatic-api-sync/post-image-pool.mjs` and `pick-post-images.mjs`
already carry an **ordered topic taxonomy** (specific before general) used to
assign images — that list is the closest thing to a curated topic set that
exists on this project, and reusing it keeps the two consistent. If you derive
topics some other way, write down why in the runbook.

Whatever you choose, the topic has to be DATA on the card, not a guess made at
click time.

## Coordinate with pin #9

Another agent, right now, is adding the post's featured image to
`article.bl-card` — the exact elements you filter. Use
`.tmp/bugherd/briefs/NOTES-posts.md` as the shared contract: they are writing
down the data attributes they put on `.bl-card`. Read it before you write your
filter, add your own topic attribute there, and do not restructure `.bl-card`
out from under them.

## Requirements worth being strict about

- **Search should match title and body/excerpt**, not just the title. 43 articles
  with near-identical titles ("dental implants" is in almost all of them) — a
  title-only search will feel broken. Normalise case and strip punctuation.
- **Empty state.** A search with no hits needs a real message plus a way back,
  not an empty grid.
- **Deep-linkable.** `?topic=implants` / `?q=...` in the URL, restored on load,
  updated with `replaceState`. Cheap here, and the client will ask.
- **Keyboard and screen-reader**: a real `<input type="search">` with a label, a
  real control for the topic filter, and the result count announced
  (`aria-live="polite"`). The filter row must not be a wall of unlabelled divs.
- **No layout jump** when the grid shrinks. Filtering a CSS grid down to 2 cards
  should not make the footer leap.
- No new third-party JS. Nothing on this page needs a library, and the site
  already has one measured mobile performance problem — do not add to it.

## Site-specific traps

- `position: sticky` is INERT on this site (ScrollSmoother). If you want the
  search bar to stay put while the grid scrolls, that is a ScrollTrigger pin, and
  honestly the simpler answer is: do not.
- New CSS attached to no node gets TREE-SHAKEN at publish. Rules for states that
  only exist at runtime (`.is-hidden`, `.is-empty`, and so on) must go in as
  `kind: 'ambient'`. This exact trap ate a whole session on the `is-swipe` work.
- Site JS ships through `push-script-asset.mjs`. Read how the last few sections
  were shipped (`sections/*.js` plus the registry half) before you write yours —
  pushing JS without the CSS half has broken this site before.

## Done means

- Draft verified in the live DOM: search, topic filter, both together, empty
  state, and a reload with the URL params set.
- Runbook section appended. No publish, no commit.
