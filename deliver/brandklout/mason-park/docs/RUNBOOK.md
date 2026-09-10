# Runbook

The **standing** state of this project: what is true now, what is next, and the traps.
Dated run history is one file per run under [`runbook/`](./runbook/INDEX.md) — read the index,
then only the runs you need. Do not read them all.


## Where the build stands — 2026-09-10

**The second elevation is on staging** (evening run,
[`runbook/2026-09-10-the-second-elevation-services-blog-articles.md`](./runbook/2026-09-10-the-second-elevation-services-blog-articles.md)):
the 31 treatment pages' ragged card grids are equal-row mosaics of photo cards
and tonal plates, every Treatment overlap carries a stock photograph of the
treatment (Unsplash, `stock-*` in the manifest), the provider band carries Dr.
Sung's 3703×4000 portrait from his other practice's site (`dr-sung`), the blog
index has a topic strip that filters the loop, and every article has a sticky
contents rail. All of it is CSS at the end of `site.css` plus `elevate.js`'s
`blog()`; `apply-stock.mjs` is the page→frame map. **Awaiting the client's
review.**

**The rebuild is finished.** `https://staging.masonparkdental.com` serves 55
static pages, the `/blog` listing, 161 articles at their original URLs, and a
branded 404 on every unmatched address. 57 page rows. Every local gate is green
and `verify-live.mjs` is clean on all 54 routable pages. **Production has not
been touched — promoting staging is the next step, and it is the client's
call.**

Everything still open is a client decision, listed at the foot of
[`runbook/2026-09-10-the-404-page.md`](./runbook/2026-09-10-the-404-page.md).

**All 31 approved treatments have pages.** Every catalogue chip links; none are dashed.
Every internal link on every page resolves. The definitive list is the `el-tabs` chips on
`home/our-services/index.html`, not the old site's 35 `/services/*` pages.

**The blog lives in the CMS, not in pages.** The 161 articles are rows in the custom
`Articles` postType table (`hsqsHRo6L5KkU5AGQNGTP`, `routeBase /blog`, slug `articles`).
`/blog/<slug>` renders through the `blog-article` page row, which is `templateEnabled`
targeting `articles`. `/blog` is a `base.loop` over the same table. The seven
`/blog/page/N` routes no longer exist — Instatic has no numeric paginator, so the listing
loads 24 and then a "Load more" button.

**`home/blog/**` is still generated and still in the repo**, as the source the CMS rows
are built from and as a file:// fallback. It is output from `.tmp/blog/posts.json`; hand
edits are overwritten by `build-blog.mjs`.

**Non-service pages built:** Contact, Terms of Service, Special Offers, Technology, FAQ,
Virtual Consultation, Sitemap, Dental Dictionary, Patient Resources, Toothpaste RDA table,
pH & acidity, Product recommendations, Town resources. **One page deliberately not
rebuilt:** `/toothpaste-chart/`, which reproduces a third-party toxicant-testing chart
credited to Lead Safe Mama, LLC — a licensing question for the client, not a build one.
The old "Dental Library" is not rebuilt either: it was a treatment index, which is what
`/our-services/` already is.

**There is no Privacy Policy or Cookie Policy.** The Terms of Service references both.
The crawl never captured them (`/privacy-policy` 403'd) and they are regulated under
HIPAA / Texas law / A2P 10DLC — **do not draft them.** Ask the practice.

**There is no form backend anywhere on the site.** The Patient Resources hub says what
actually happens instead — call ahead, or the tablet at reception — rather than linking a
form that does not exist. Wiring a real one is still an open decision.

**The Amazon affiliate tag on `/product-recommendations/` is `grandmissiond-20`**, which
is not obviously this practice's. It is preserved verbatim; somebody should check whose
Associates account it is.

### Traps that are live right now

- **Every Instatic command must export the staging URL.** `INSTATIC_BASE_URL` in `.env`
  points at **production**:
  ```bash
  export $(grep -E '^INSTATIC_(EMAIL|PASSWORD|STAGING_URL)=' .env | xargs -d '\n')
  export INSTATIC_BASE_URL="$INSTATIC_STAGING_URL"
  ```
- **Never PATCH a page row.** `PATCH /admin/api/cms/data/rows/:id` re-derives the routable
  `data_rows.slug` column through `slugFromTitle()`, which turns `services/invisalign`
  into `services-invisalign` and 404s the page while the admin still looks healthy.
  Only `PUT /admin/api/cms/site-document` writes a page slug verbatim. `apply-seo.mjs`
  refuses to run for this reason and carries the whole story.
- **`apply-blog-template.mjs` AND `apply-404-template.mjs` run AFTER any
  `import-pages.mjs`.** The site-document save rebuilds each row through
  `pageToCells()` and drops the template flags. Lose the first and every
  `/blog/<slug>` 404s; lose the second and Instatic's bare stock 404 is back.
  The full end-to-end order is in the 2026-09-10 run.
- **`GET /404` returning 200 is Instatic's design**, not a soft-404 bug — its router
  says so, matching how static hosts treat `404.html`. Unmatched URLs correctly get
  status 404. Do not re-investigate.
- **`fetch-nodes.mjs` always writes `converted-pages.json`**, so the blog-templates
  cycle overwrites the pages' set. Copy it to `converted-templates.json` right after that
  fetch, and run `import-styles.mjs` for the pages BEFORE the templates cycle.
- **Re-run `import-scripts.mjs` whenever a page row id changes**, and whenever
  `elevate.js`, `journey.js` or `site.js` change — the bundle is a snapshot. The script bundle is
  scoped to an explicit `pageIds` list; a page outside it loads no GSAP and no `journey.js`.
- **Per-page meta descriptions do not render in this Instatic build.** Only entry routes
  get their own (`documentMeta`). The 161 articles have real descriptions; the 54 pages
  fall through to the site-level setting. Worth reporting upstream.
- **Build a treatment page with `.tmp/stamp-service.mjs`**, then run `.tmp/link-chips.mjs`
  and `.tmp/prune-nav.mjs`. Neither of the last two is triggered by the stamper, and the
  catalogue chip stays dashed without the first.
- **`prune-nav.mjs` used to be a blind gate** — its route list was hardcoded to the eleven
  routes of 2026-09-02 and reported live pages as DEAD. It now walks `home/`.
  Never reintroduce a literal page list to a gate here.
- **`probe-heights.mjs`'s baseline was stale from 2026-09-02 to 2026-09-09.** Re-saved
  against HEAD on 2026-09-09. **`--save base` after any approved change**, or the next
  person cannot trust it.
- **The Services dropdown is grouped** (`GROUPS` in `prune-nav.mjs`), rendering the
  catalogue's seven groups as nested submenus. Empty groups are dropped; a group with one
  built page renders flat.
- **The old WordPress pages carry fabricated testimonials.** `services-sealants` has three
  that match none of the 20 real Google reviews. Check any quoted patient against the
  Trustindex JSON before reproducing it.
- **The old WordPress bodies carry theme furniture.** `extract-posts.mjs` now strips the
  comment counter, skip links, author box and tag cloud, and rebuilds flattened lists.
  If article text ever looks like it starts mid-page, that is what regressed.
- **Git Bash rewrites leading-slash arguments** into Windows paths
  (`/blog` → `C:/Program Files/Git/blog`). Prefix such commands with `MSYS_NO_PATHCONV=1`.
- **`cityofkaty.com` answers 403 to anything that is not a browser**, including its own
  root with a browser user-agent. Its links on `/town-resource/` are live — verified in
  Chrome. Never delete a link from that host on the strength of a curl check.
- **The old pH page's numbers are wrong in nine places.** `build-ph.mjs` validates every
  value against the 0–14 scale, applies mechanical repairs only, prints each one, and
  drops anything it cannot repair. Read that log before trusting the page.
