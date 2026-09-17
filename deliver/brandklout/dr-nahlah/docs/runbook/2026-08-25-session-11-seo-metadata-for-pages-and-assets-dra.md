## DONE 2026-08-25 (session 11): SEO metadata for pages and assets — DRAFT seq 70, NOT PUBLISHED

Two independent gaps, both now closed on the draft. **Nothing is published.** Draft
was clean when this started (`draftMatchesPublished: true`, last publish 11:58Z), so
a publish now ships exactly this work and nothing else.

### Every published page shipped the SAME title and description

`buildDocumentMetaTags` (`core/publisher/render.ts`) resolves the entire SEO head from
site-wide settings: `settings.metaTitle ?? page.title ?? site.name` for `<title>`,
`settings.metaDescription` for the description, and **nothing at all** for canonical,
`og:*`, `twitter:*` or `robots`. `metaTitle` was set, so its branch always won —
**37 pages, one `<title>`, one description.** Everything per-page came from
`src/scripts/seo-head.js` after load: Google renders that, Bing and every social
unfurler do not.

`push-page-seo.mjs` cleared `settings.metaTitle`. Resolution now falls to `page.title`
and the published `<title>` is per page, statically, with no JS. First though, 10 rows
had to be fixed:

- **6 stored literal `&amp;`.** The publisher escapes the row, so those would have
  published as `&amp;amp;` and rendered as the visible text "&amp;". This is invisible
  while `metaTitle` masks the row — clearing it is what exposes it.
- **4 had drifted from `seo.json`** (`post` was literally titled "Post").

Verified: 37/37 rows match `seo.json`, 37 DISTINCT titles, none double-escaped, and
37/37 agree exactly with what `seo-head.js` assigns — so no tab re-titles itself on
load. `.tmp/simulate-head.mjs` reproduces the publisher's own function against the
draft, so the title each page WILL publish was read without publishing.

**`metaDescription` is deliberately still set.** There is ONE description slot for the
whole site and no per-page equivalent at any layer, so per-page descriptions stay with
`seo-head.js`; the site-wide value stays the home page's, the best fallback for a
crawler that does not run scripts. **This is the remaining architectural gap.**

### The Pages table's own SEO fields — filled, and they do NOTHING at publish

Caught during review: the Data tab's `SEO title` / `SEO description` columns were
empty on all 37 rows. They are `builtIn` fields on the system `pages` table, so it
looks like the obvious place SEO belongs. **Traced through the source: on 0.0.16 they
are inert.** `<title>` is emitted in exactly one place (`render.ts:461`) from
`buildDocumentMetaTags`; `readSeoTitleCell` / `readSeoDescriptionCell` have exactly
two callers, both in the admin authoring UI; and templated entries take their title
from `row.cells.title` (`publicRenderer.ts:182`). Nothing under `server/publish/` or
`src/core/publisher/` touches them.

Filled all 37 from `seo.json` anyway via `push-page-seo-cells.mjs` — that is where a
person looks, and an empty column reads as broken. **It changes no published byte.**
The thing that actually fixed `<title>` is clearing `metaTitle`, above.

**The endpoint trap, worth remembering:** `handleRowItemPatch` does
`body.cells ?? currentRow.cells` and persists that whole object — `cells` is
REPLACED, never merged. `{ cells: { seoTitle } }` would have dropped `title`, `slug`
and the entire `body` page tree, and `slugForTable` re-derives the route from the
cells it is handed, so the pages would have lost their URLs too. The script re-reads
each row, spreads the current cells underneath, and asserts the body tree is
byte-identical afterwards. Verified 37/37: SEO cells correct, slug + body intact.
Full backup at `.tmp/backups/pages-rows-full.json` (3.9 MB).

### 193 rendered images had no alt text — including the logo, on all 37 pages

`base.image`'s `render()` takes alt **exclusively** from the resolved library asset,
never from a per-instance prop. So one `PATCH /admin/api/cms/media/:id` changes every
`<img>` on every page using that asset — and 366 of 433 library rows were empty.

`push-asset-alt-text.mjs` wrote 193, scoped to assets the site actually references
(page trees + shell); the other 208 are orphaned migration uploads no page renders, so
writing alt on them changes no published byte. **193/193 written, all read back
exactly.** Measured effect at publish: **476 of 489 `base.image` nodes render real
alt, up from 32.** Live baseline for contrast: `/smile-gallery` is 111/111 `alt=""`
today, `/our-team` 11/12, `/contact` 2/2.

### Two things that will bite the next person

- **Instatic's alt is per-ASSET; the design package authored it per INSTANCE.** 38
  images carried two to twelve different alt strings across pages. Each had to collapse
  to one value true wherever the image appears. Every call is recorded by hand in
  `.tmp/alt-overrides.json` — a frequency heuristic must not pick these silently.
- **The design package's alt text is not trustworthy.** Checked against the actual
  image files: `office-hero` is a building lounge, not a reception; `office-wide` is
  one overhead light, not a treatment floor; `tech-hero` is the lab bench under a
  stereo microscope (the same photograph as `lab.jpg`), not a cone-beam scan;
  `pt-interaction-3` is a fist-bump at the front desk, not "a treatment plan being
  reviewed". **Look at the image.**

### NOT done

1. **NOT PUBLISHED.** Draft at `seq 70` plus 37 row drafts. `POST /admin/api/cms/publish`
   runs `publishDraftSite` — the FULL publish — so one call covers the shell, the page
   titles and the row cells together.
2. **No sitemap.xml** — `/sitemap.xml`, `/sitemap_index.xml` and `/sitemap.txt` all
   404, and `robots.txt` names none. The platform serves no sitemap route.
3. **13 YouTube thumbnails stay at `alt=""`** on `/video-library` and
   `/patient-stories`: their `src` is `img.youtube.com`, and alt is reachable only
   through a library asset. Fix would be uploading the thumbnails to the library.
4. **`og:image` is still guessed at runtime** by `seo-head.js` from the largest image
   in the DOM; there is no per-page og:image in `seo.json`.
5. Library `title` / `caption` / `tags` are still empty on all 433. They have **no
   render path** — admin-library organisation only, not SEO. Left alone on purpose.
6. Nothing committed.
