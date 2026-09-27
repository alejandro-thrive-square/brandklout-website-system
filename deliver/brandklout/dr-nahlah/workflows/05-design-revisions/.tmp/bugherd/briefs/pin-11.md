# BugHerd #11 — stop repeating images across the site

Read `_shared.md` in this folder FIRST. You own pin #11 and nothing else.

Board: https://www.bugherd.com/projects/537587/tasks/11
Screenshot: `../media/task-11-screenshot.jpg`
Page pinned on: `/smile-makeover` on https://www.drnahlah.com
Pinned element:
`main#top > section#process.pk.pk-light > div.wrap.section > div.pk-cards.pk-cards-4`

## The client's words

> There are a lot of repeated images in this site overall. We need to make sure
> not to repeat images on the same page. If you don't have a related image or if
> the image has a round radius to it, pick a new one from the Magnific API.

Three separate asks in there. Treat them separately:

1. **No image repeats on the same page.** This is the hard requirement and it is
   site-wide, not just `/smile-makeover`. Cross-page reuse is NOT in scope —
   they said "on the same page".
2. **Round-radius images get replaced.** They mean source images that arrive
   already cropped into a circle or rounded shape and then sit inside a square
   frame. Those are the giveaway that a placeholder was reused. Find them by
   looking at the actual pixels (transparent or flat-white corners), not by
   filename.
3. **Replacements come from Magnific**, when the library has nothing related.

## Start with the audit, not the fix

Before changing one asset: build the inventory. Which asset is used where, per
page, across all ~79 published URLs plus the 43 CMS post rows. There are prior
tools in `15-instatic-api-sync/.tmp/` for exactly this shape of question —
`audit-media.mjs`, `audit-usage.mjs`, `audit-files.mjs`, `alt-coverage.mjs`.
Read them before writing a new one. Produce a table the human can look at, in
`.tmp/bugherd/` — the client will want to see the before/after count.

Expect the honest answer to be "N pages have duplicates, here they are", and
expect some of those to be intentional (a logo, a decorative texture). Say which
is which; do not silently swap a repeat that is doing a job.

## The library and the key

- 434 assets in the site's own media library. **It contains named-patient case
  photography and staff headshots** — `pt-yolanda.jpg`, bare numeric pairs like
  `1.1.jpg` / `8.2.jpg` / `9-b4.jpg`, duplicate uploads of the same picture. A
  patient's case photo on an unrelated page misrepresents the case. That is why
  `15-instatic-api-sync/post-image-pool.mjs` is an explicit ALLOWLIST. Extend
  that allowlist; do not go around it.
- Library first, Magnific/Freepik as fallback — the client's own ordering, set on
  pin #7. Key is `MAGNIFIC` in the repo-root `.env`; it is a Freepik key, header
  `x-freepik-api-key`. `pick-post-images.mjs` is the working reference for the
  search plus `/v1/resources/:id/download` plus upload flow.
- `source.url` from Freepik search is a **626px preview on img.b2bpic.net**, not
  the licensed asset. Reviewing previews is free; only the download spends quota.
  Review before you spend.
- **Query the topic with a curated phrase. Never build the query from a page
  title.** Doing that put one image on 24 of 43 articles last week.

## Uploading

- `POST /admin/api/cms/media` picks the extension from MAGIC BYTES, not the
  filename. Read `publicPath` off the response — never construct it.
- **One media upload bumps the shell seq by ~6** (variant generation). With three
  other agents writing the same document right now, that matters: batch your
  uploads, then take a fresh seq before the document write. A seq jump is not
  evidence of corruption.

## Coordinate — you overlap two other agents

- Pin **#8** (running now) is adding **11 new images to the home page** service
  cards. They are writing what they claim into
  `.tmp/bugherd/briefs/NOTES-images.md`. Read it, keep it updated with your own
  home-page changes, and settle the home page between you rather than both
  rewriting it.
- Pin **#9** (running now) is setting featured images on the 43 post rows and
  showing them on `/posts`. Every card on `/posts` is then an image on ONE page —
  which is squarely your no-repeats rule. `MAX_USES = 2` in
  `pick-post-images.mjs` allows a repeat; on the `/posts` index that repeat is
  visible side by side. Flag it to them via `NOTES-posts.md`.

## Done means

- The audit table, before and after.
- Every same-page duplicate either fixed or explicitly justified in writing.
- Round-radius offenders identified by pixels and replaced.
- Nothing swapped for something less related than what it replaced. "Different"
  is not the goal; "right, and not repeated" is.
- Runbook section appended. No publish, no commit.
