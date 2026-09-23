# 2026-09-09 — The whole site on staging, and the blog moved into the CMS

**Instance:** `https://staging.masonparkdental.com` (Railway env `staging`, project
`e4a73ef0-…`). Production was never touched. Every command in this run exported
the staging URL explicitly, because `INSTATIC_BASE_URL` in `.env` points at
**production**:

```bash
export $(grep -E '^INSTATIC_(EMAIL|PASSWORD|STAGING_URL)=' .env | xargs -d '\n')
export INSTATIC_BASE_URL="$INSTATIC_STAGING_URL"
```

## Done

**49 static pages live on staging**, plus **161 blog articles as CMS rows**
rendered by one template page, plus a `/blog` listing driven by a loop. 52 page
rows, 161 article rows, 219 media files. `verify-live.mjs` is clean on all 49
pages and on a spread of six articles: 200, chapters present, site.css applied,
GSAP booted, `--jr-nav-h` measured, no broken images, no console errors, no
horizontal overflow.

| Route | What renders it |
| :--- | :--- |
| `/`, `/about-us`, `/services/*`, … (49) | page rows, imported node graphs |
| `/blog` | page row `blog`, a `base.loop` over the `Articles` table |
| `/blog/<slug>` (161) | page row `blog-article`, `templateEnabled`, targeting `articles` |

### The blog is data now

- Custom postType table **`Articles`** (`hsqsHRo6L5KkU5AGQNGTP`), `routeBase
  /blog`, slug `articles`. The system `posts` table refuses to change its name
  or its routeBase, which would have put every article at `/posts/<slug>`.
- Fields added this run: `topic`, `excerpt`, `dateDisplay`, `dateIso`.
- `/blog/<slug>` renders through the `blog-article` page, which is marked
  `templateEnabled` with target `{kind:"postTypes", tableSlugs:["articles"]}`.
  It is not itself routable — `/blog-article` 404s, correctly.
- The seven `/blog/page/N` routes are **gone**. Instatic has no numeric
  paginator module; the listing is a loop in `infinite` mode and the runtime
  injects a "Load more" button. `build-sitemap.mjs` now leaves those seven
  routes out of `sitemap.xml` so Search Console is not handed six 404s.

### New scripts

| Script | What it does |
| :--- | :--- |
| `build-blog-templates.mjs` | writes the two CMS blog pages as HTML payloads, with `{currentEntry.…}` tokens and `@@OUTLET@@` / `@@LOOP:…@@` markers |
| `apply-blog-markers.mjs` | swaps those markers for `base.outlet` and `base.loop` nodes after conversion |
| `apply-blog-template.mjs` | sets `templateEnabled` / `templateTarget` / `templatePriority` on the `blog-article` row |
| `publish-articles.mjs` | publishes the 161 rows **oldest article first** |
| `apply-seo.mjs` | **refuses to run.** Kept as the record of a bug — see Gotchas |

### Content defects fixed at the source

`extract-posts.mjs` was shipping WordPress chrome inside the articles. All of
this was in both the static build and the first CMS import:

- **98 of 161 bodies opened with theme furniture** — `<h2>0Comments</h2>`,
  `Skip to content`, `ADMIN`, `SCHEDULE ONLINE`, the header phone strip. Cause:
  the cut used `p.title`, the *cleaned* headline, while `rendered.txt` carries
  the raw one with the " - Dentist Katy" suffix; `indexOf` returned −1 and
  nothing was cut. Now tries `seoTitle` first.
- **The author box** — the doctor's biography above the article on most posts
  and below it on 28 others. Removed by *repetition*, not by pattern: a first
  or last paragraph that opens or closes two different articles verbatim is
  furniture whatever it says. 120 dropped from the head, 141 from the tail.
- **Flattened lists** — "12 Reasons to See Your Dentist" shipped its twelve
  reasons as twelve consecutive `<h2>`s. A run of three or more short
  unpunctuated lines is now a `<ul>`. 169 lists, 1042 items across the corpus.
- **Duplicate card blurbs** — Yoast's descriptions repeat; 26 of 161 shared one
  with another post, and three implant articles all carried a blurb about
  Invisalign. Cards now use `excerpt`, derived from the article's own opening
  (161 distinct). The meta description stays exactly as the practice wrote it.
- **Every blog date was a day early** — `toLocaleDateString` rendered Yoast's
  UTC-midnight dates in the build machine's timezone. Now formatted in UTC.

Body words went 233,000 → 201,221; the difference is boilerplate.

## Gotchas

**Do not PATCH a page row.** `PATCH /admin/api/cms/data/rows/:id` does not store
the slug you send — it re-derives the routable `data_rows.slug` column with
`slugForTable() → slugFromTitle()`, whose `[^a-z0-9]+ → '-'` turns
`services/invisalign` into `services-invisalign`. The public router looks pages
up by that exact column, so **all 31 treatment pages started answering 404**
while `cells.slug` still read correctly and the admin looked healthy. Only
`PUT /admin/api/cms/site-document` writes a page slug verbatim.

**And that mistake compounds.** `import-pages.mjs` keyed its existing-row map on
`row.slug`, so on the repair run it could not find the 31 mangled rows, minted
new ids, and left 31 orphan duplicates behind (83 rows for 52 pages). Fixed:
the map keys on `cells.slug` now. The orphans were deleted by hand.

**Per-page meta descriptions do not exist in this Instatic build.**
`renderPublishedSnapshot()` passes no `documentMeta`, so `<meta
name="description">` falls through to the site-level setting for every page.
Only entry routes get their own: `renderPublishedDataRowTemplate()` reads
`seoTitle`/`seoDescription` off the row. So the 161 articles have real
descriptions; the 49 pages have none, and writing the cell does not change that.
**This is worth reporting upstream** — the `pages` table declares both fields
and the admin UI edits them.

**`site-document` drops cells it does not know.** It rebuilds each row through
`pageToCells()`, which carries only title, slug, body and the template flags.
So `apply-blog-template.mjs` must run **after** any `import-pages.mjs` run, or
the template flag is silently gone and every `/blog/<slug>` 404s.

**Re-run `import-scripts.mjs` whenever a page row's id changes.** The script
bundle is scoped `{type:"pages", pageIds:[…]}`. After the orphan cleanup the 31
new service rows were outside the scope and GSAP did not load on any of them —
`verify-live.mjs` caught it as "gsap did not load" on `/services/invisalign`.

**The outlet must BE the styled element.** The prose rhythm is
`.text-rich-text > * + *`, a direct-child selector. Wrapping the outlet inside
`.lf-body` made every paragraph a grandchild and every article rendered as one
unbroken block. The marker now goes on `.lf-body.text-rich-text` itself. Same
trap the `.lf-section > * + *` comment in `site.css` already warns about.

**Article order is publish order.** `base.loop` can only sort by `publishedAt`,
`createdAt`, `updatedAt` or `slug` — none of which is the article's own date,
and there is no API to backdate a row (`/publish` stamps now, `/schedule`
refuses a past time). So `publish-articles.mjs` publishes ascending by article
date and `publishedAt DESC` then reads newest-first. Verify through
`/data/tables/:id/loop-preview`, **not** by sorting the rows endpoint: that
serialises `publishedAt` truncated to the second, so rows microseconds apart
look tied and a divergence gets reported that does not exist.

**The blog payloads no longer need a manual `mv`.** `to-instatic.mjs` writes
`blog*` payloads to `instatic/pages-blog-cms/` itself. The old shell `mv` failed
silently twice — it cannot overwrite files already in the destination and the
`2>/dev/null` hid the error — each time leaving 217 pages staged for an import
meant to write 49.

**`railway ssh` and Git Bash.** Passing routes that begin with `/` to a node
script under Git Bash rewrites them into Windows paths
(`/blog` → `C:/Program Files/Git/blog`). Prefix with `MSYS_NO_PATHCONV=1`.

## Next

- **Report the page-level SEO gap to Instatic.** Cheap fix upstream: pass
  `readEntrySeoOverride(pageRow.cells)` as `documentMeta` in
  `renderPublishedSnapshot()` the way the entry path already does.
- **The 404 page is Instatic's stock one.** No `notFound` template exists, so a
  bad URL gets an unstyled page with none of the site chrome. One template page
  with `target: {kind:"notFound"}` fixes it.
- **Duplicate `alt` attributes.** `apply-image-alt.mjs` adds an `alt` prop and
  `base.image` emits its own empty one, so every image ships `alt="…" alt=""`.
  The first wins per the HTML parsing spec, so the accessible name is correct,
  but it is invalid markup on every image on every page.
- Remaining old-build pages: Toothpaste RDA table, pH & acidity, Product
  recommendations, then the Patient Resources hub (children first), Katy town
  resource.
- **Blocked on the client:** Privacy Policy and Cookie Policy. Referenced by
  Terms §17/§18, never captured, `/privacy-policy` 403'd. HIPAA / Texas law /
  A2P 10DLC — must not be drafted here.
- **Open question:** form backend. Patient Resources' premise is "complete our
  online patient forms", and there is no form on the site.
- Standing recommendation: skip `/appointment/` — a calendar widget with no
  content, and Instatic's `script-src 'self'` CSP would render it as an empty
  box.
