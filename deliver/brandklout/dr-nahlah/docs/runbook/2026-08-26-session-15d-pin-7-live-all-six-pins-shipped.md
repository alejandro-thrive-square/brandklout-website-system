## DONE 2026-08-26 (session 15d): pin #7 LIVE — all six pins shipped

All 43 articles now carry a featured image, a contents list, a consult block and
a related strip. Audited live: 43/43 clean (hero present with alt at >=1400px,
CTA, related, no placeholder text).

- `pick-post-images.mjs` + `post-image-pool.mjs` — choose one image per article.
  40 from the practice's own library, 3 from Freepik. Read-only by default;
  `--apply` downloads, uploads and sets `featuredMedia`.
- `push-post-template.mjs` — the template furniture and its 21 registry rules.
- `sections/blog-post.js` (design package) — contents + related dedup at runtime.
- `css/62-blog.css` — the furniture styles, mirrored into the registry.

### The data model, and the four things that were NOT obvious

- The 43 articles are rows in the `posts` TABLE:
  `GET /admin/api/cms/data/tables/posts/rows` (the `?table=` form is a 404).
  `posts` already had a `featuredMedia` field of type `media`, empty on all 43.
- **A `media` cell stores the asset ID as a plain STRING** — not an object, not a
  path (`CellDisplayRenderer.tsx`).
- **DATA ROWS PUBLISH SEPARATELY FROM THE SITE.** `insta-api.mjs publish` ships
  pages; it does NOT ship row edits. The entry route reads `cells_json` from a
  published VERSION snapshot (`server/repositories/data/publish.ts`), so a PATCHed
  row renders its old values until `POST /admin/api/cms/data/rows/:id/publish`.
  This cost an hour of chasing an empty hero that was written correctly.
- **Bind the hero to `featuredMediaPath`, not `featuredMedia`.** On the entry the
  latter is the raw ID; `base.image` does `safeUrl(props.src)` and returns '' when
  that fails, so the figure publishes EMPTY with no error anywhere. `fields` also
  exposes `featuredMediaUrl` (all three come from `row.featuredMediaPath`).
  A string prop token `{currentEntry.featuredMediaPath}` works as well as a
  structured `dynamicBindings` overlay; the token is what ships.

### Gotchas earned this session

- **`tag: 'b'` is not a valid `base.text` tag** and an invalid tag makes the
  module fall back to its DEFAULTS — two headings published as "Add your text
  here." while the stored props were correct all along. The vocabulary is
  `none|p|h1..h6|span|div|small|strong|em` (`src/modules/base/text/tags.ts`).
  The stored node is NOT evidence of what renders.
- **Sub-1200px art cannot headline a page.** The first pass put 26 of 43 articles
  on 500-800px product renders — one was 223x700 cropped to a sliver and blown up
  4x. `MIN_WIDTH = 1400` now gates the pool, and the topical 3D model PNGs lost
  their place to the practice's own 1600-2560px photography. Less literal, but
  real, on-brand and correctly sized.
- **Alt text lives on the ASSET, never the node**, so a bound image inherits it
  and one media row fixes every page. 19 assets were described here — each
  written against the actual picture. `advanced_tech.jpg` is a lab bench under a
  stereo microscope, NOT a scanner; the filename would have lied.
- **Stock search needs a human eye.** Freepik returned a COVID temperature check
  for an implant-placement article, and the obvious replacement search returned an
  AI-generated EXTRACTION illustration with malformed hands. Both were rejected by
  looking at them. Two articles are now pinned to library photos by hand in
  `.tmp/fix2.mjs`.
- **Never verify a page write by matching hrefs page-wide** — the drawer and
  footer live in the same node tree, so "11 service links" read as 30.
- **`printf`-ing a regex `.source` hides ``** — the terminal eats the backspace
  and it reads as a missing anchor. Use `JSON.stringify` before concluding a
  pattern is broken.

### Left deliberately undone

- The client's reference also had a persistent right rail and an FAQ accordion.
  The rail duplicates a reviews widget the home page already runs; the FAQ has no
  data source, since none of the 43 articles carry structured Q&A.
- One orphaned upload (`1777.jpg`, the rejected temperature-check photo) is still
  in the library, unreferenced.
