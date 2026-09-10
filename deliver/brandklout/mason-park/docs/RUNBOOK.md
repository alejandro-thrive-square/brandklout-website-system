# Runbook

The **standing** state of this project: what is true now, what is next, and the traps.
Dated run history is one file per run under [`runbook/`](./runbook/INDEX.md) — read the index,
then only the runs you need. Do not read them all.


## Where the build stands — 2026-09-09

**217 routes built and live on staging.** `https://staging.masonparkdental.com` serves
49 static pages, the `/blog` listing, and 161 articles at their original URLs.
`verify-live.mjs` is clean on all of them. Production has not been touched.

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
Virtual Consultation, Sitemap, Dental Dictionary. **Still missing from the old build:**
Toothpaste RDA table, pH & acidity, Product recommendations, the Patient Resources hub
(build its children first), the Katy town resource.

**There is no Privacy Policy or Cookie Policy.** The Terms of Service references both.
The crawl never captured them (`/privacy-policy` 403'd) and they are regulated under
HIPAA / Texas law / A2P 10DLC — **do not draft them.** Ask the practice.

**There is no form backend anywhere on the site.** Patient Resources' whole premise is
"complete our online patient forms", so that hub is blocked on this decision.

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
- **`apply-blog-template.mjs` runs AFTER any `import-pages.mjs`.** The site-document save
  rebuilds each row through `pageToCells()` and drops the template flags, and every
  `/blog/<slug>` 404s the moment they are gone.
- **Re-run `import-scripts.mjs` whenever a page row id changes.** The script bundle is
  scoped to an explicit `pageIds` list; a page outside it loads no GSAP and no `journey.js`.
- **Per-page meta descriptions do not render in this Instatic build.** Only entry routes
  get their own (`documentMeta`). The 161 articles have real descriptions; the 49 pages
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
