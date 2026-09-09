# BugHerd #9 — /posts cards should show the post's main image

Read `_shared.md` in this folder FIRST. You own pin #9 and nothing else.

Board: https://www.bugherd.com/projects/537587/tasks/9
Screenshot: `../media/task-9-screenshot.jpg`
Page: `/posts` on https://www.drnahlah.com
Pinned element:
`main#top > section#articles.pk.pk-alt > div.wrap.section > div.bl-grid > article.bl-card`

## The client's words

> Here we should display the main image of the blog post

## Start here — the image may already be set

Session 15c/15d built the whole featured-image pipeline for pin #7:

- `15-instatic-api-sync/post-image-pool.mjs` — the curated ALLOWLIST of library
  assets (the library has named-patient case photography in it; a blocklist
  cannot curate it, and the runbook explains exactly why).
- `15-instatic-api-sync/pick-post-images.mjs` — assigns one image per article,
  library first and Magnific/Freepik as fallback, with `MAX_USES = 2` per asset.
  `--apply` downloads, uploads and sets `featuredMedia` on the CMS row.

**Your first job is to find out whether `featuredMedia` is actually populated on
the 43 post rows, or whether only the contact sheet was ever generated.** The
runbook's session 15c entry says `--apply` was "not yet written"; the script on
disk now has an apply path. Check the live data, not the runbook.

If `featuredMedia` is set, this pin is a template change only. If it is not, you
own running the pick + apply as well — read the contact sheet, and note that
Freepik downloads spend account quota while library picks do not.

## The template change

`article.bl-card` in `.bl-grid` on the `/posts` index currently renders text
only. It needs the post's own featured image as a thumbnail.

- The 43 articles are **CMS rows behind the `post` template**, not entries in the
  pages table. `insta-api.mjs pages` returns `[]` for them (the CLI reads
  `.pages`, the endpoint answers `{rows}` — known, unfixed).
- `.bl-related` on the article template was given thumbnails in the seq-98
  layout work (`push-post-layout.mjs`, `css/62-blog.css`, `sections/blog-post.js`).
  **Match that treatment** — same aspect ratio, same rounding, same fallback when
  a row has no image. Reuse the CSS you can; don't fork a second thumbnail style.
- That seq-98 work is on the DRAFT and unpublished. You are building on top of
  it. Do not undo it.
- Pin **#10** (another agent, right now) is adding a search bar and topic filter
  to the SAME `/posts` section — `section#articles.pk.pk-alt > div.wrap.section`
  is their pinned element and `.bl-grid` is what they filter. Their filter will
  show/hide your cards. Agree the card's markup contract with them via
  `.tmp/bugherd/briefs/NOTES-posts.md` — write down what data attributes you put
  on `.bl-card` so their filter can key off them instead of inventing its own.

## Watch for

- A missing/empty `featuredMedia` must degrade to something deliberate, not a
  broken `<img>`. 43 rows; assume at least one is empty.
- Images on an index page are the classic LCP regression. The first row should
  be eager/`fetchpriority`, the rest lazy. `perf-image-priority.mjs` is the
  existing tool for this pattern.
- A `class`-kind rule referenced by no `node.classIds` is TREE-SHAKEN at publish.
  New styling that isn't attached to a node has to go in as `kind: 'ambient'`.

## Done means

- Draft verified by reading the `/posts` subtree back, all 43 cards accounted
  for, including whatever the empty-image case is.
- Runbook section appended. No publish, no commit.
