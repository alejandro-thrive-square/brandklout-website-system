# Runbook

The **standing** state of this project: what is true now, what is next, and the traps.
Dated run history is one file per run under [`runbook/`](./runbook/INDEX.md) — read the index,
then only the runs you need. Do not read them all.


## Production's live ad pages - 2026-09-18

**The six Webflow ad pages are on production at the slugs the ads point at, and they match Webflow
with zero differences**
([`runbook/2026-09-18-webflow-ad-pages-on-production-verified-and-fixed.md`](./runbook/2026-09-18-webflow-ad-pages-on-production-verified-and-fixed.md)).
They were ported on 2026-08-28 (workflow 10). A computed-style audit against
`mason-park-dental.webflow.io` found the main site's unscoped heading and `.button` rules leaking
Figtree, ink and letter spacing onto them, and `/invisalign`'s Privacy Policy link reduced to bare
text; both are fixed and published (`2026-09-18T16:41:10Z`, shell seq 33). `type-diff.mjs --all` is
the gate, and it must be re-run whenever the main site's stylesheet changes. Live changes to these
pages go through `patch-live.mjs`, never a re-import. **Open:** the Webflow site carries
unpublished Designer edits newer than its last publish; production mirrors what is published.

## Where the build stands - 2026-09-18

**The six paid-traffic routes are rebuilt in Livewell's information flow and live on staging under
`/ads-landing-pages/`**
([`runbook/2026-09-18-ad-pages-rebuilt-in-livewells-flow.md`](./runbook/2026-09-18-ad-pages-rebuilt-in-livewells-flow.md)).
The agency rejected the morning's first cut (the service page with a form near the bottom). The
second cut is written by `build-ads-landing-pages.mjs`: a landing page with the **lead form in the
hero**, the journey, why here, the dentist, the path, the proof and the rooms, questions and the
invitation; a consultation page that is the form first; a thank-you page that is the phone first
and carries no form. Invisalign and the $189 New Patient campaign each have the three.
Staging is **63 draft / 63 published**, no drift, last published `2026-09-18T13:33:44.919Z`; the
six first-cut root routes were removed from staging. All live gates pass: forms (right campaign id,
514px wide in their cards), call tracking, mobile, the scroll scenes, and **zero elements hidden by
an ad blocker**. **Production is unchanged and was not touched.**

**The trap this run paid for: never name anything on a paid page `ad`.** `is-ad`, `ad-hero` and
`ad-rail` are on ad blockers' cosmetic lists; the published hero, form included, collapsed to 0px
while every other gate was green, and it renders perfectly on `file://`. The namespace is `lp-*`
and `probe-adblock.mjs` is the gate.

**Next:** agency review on staging. **At promotion, outside the repo:** each GHL form's redirect has
to move to `/ads-landing-pages/<campaign>-thank-you` (they are the live ads' forms and still point
at production's root thank-you slugs), and the ads' final URLs move or the old root slugs get
redirected through the workflow-12 Cloudflare Worker. These pages depend on staging's stylesheet,
scripts and media, so they go live with the rest of the staging site.

## Earlier - 2026-09-18, the first cut of the paid routes

Published to staging at the production slugs and superseded the same day
([`runbook/2026-09-18-redesigned-ad-funnels-published-to-staging.md`](./runbook/2026-09-18-redesigned-ad-funnels-published-to-staging.md)).
Kept for its pipeline notes: the incremental import order, the isolated tracking verifier, and the
rule that production stays the exact Webflow port until launch is authorised.


## Earlier - 2026-09-17, legacy redirects

**The old domain's 301 map is deployed but not live yet**
([`runbook/2026-09-17-legacy-redirects-for-bestdentistinkatytx.md`](./runbook/2026-09-17-legacy-redirects-for-bestdentistinkatytx.md)).
A Cloudflare Worker sends every `bestdentistinkatytx.com` URL (apex and www) to its page on
`www.masonparkdental.com`. The zone is **pending**: the registrar (Squarespace) must switch the
nameservers to `ajay`/`ruth.ns.cloudflare.com`, and someone must decide on the zone's DMARC
record first. The 161 old article URLs land on `/` until production has the blog; after that,
rebuild and redeploy `workflows/12-legacy-redirects`.

## Earlier — 2026-09-16, Termly

**Production has Termly cookie consent on every page**
([`runbook/2026-09-16-termly-cookie-consent-on-production.md`](./runbook/2026-09-16-termly-cookie-consent-on-production.md)),
added through embed-origins `siteScripts`, with `us.consent.api.termly.io` allowed for connections and `app.termly.io` for frames.
**Staging does not have it yet**: its plugin is 1.5.1. Install 1.6.0 and add the same settings there before launch.

## Earlier — 2026-09-16, BugHerd round three

**BugHerd round three is answered** ([`runbook/2026-09-16-bugherd-round-three-standalone-and-motion.md`](./runbook/2026-09-16-bugherd-round-three-standalone-and-motion.md)).
The agency asked for **Mason Park to stand alone as a cosmetic and general practice**: the home
page's two-practice story is rewritten, and Dr. Nguyen's practice is referenced as **Mason Park
Dental for Kids**. Site-wide: **photographs are in colour at rest** (no grayscale anywhere but
the map), **words written on scroll are readable before they are written** (.66 alpha) and
finish by mid-window, **ScrollTrigger re-measures when the page grows** (a "read more" fold used
to fade headings that were still on screen), **button hover fills sit behind the label**, and
the **header logo is a padded PNG** (`mp-logo-nav-422x180.png`). The home hero is the Nguyen/Sung
family photograph; the team page has a named portrait chapter (`#team`). **Waiting on the
agency:** Mason Park's Cherry link (#66), a look at the logo in Safari 26 (#3).

## Earlier — 2026-09-15

**BugHerd round two is answered on the board** ([`runbook/2026-09-15-bugherd-round-two-in-the-reviewers-safari.md`](./runbook/2026-09-15-bugherd-round-two-in-the-reviewers-safari.md)).
The reviewer works in **Safari 26 on a Mac at 1512×735**, so every note was re-checked in
WebKit at that size. Four of the 09-10 answers were not enough and are fixed: the logo gets
air in its box (#3), the relay's sentence gets a photograph (#6), the home band gets a smiling
frame (#21), and the **team page has its own photographs** — none of its team photos repeat
the home page (#45). 45 notes are replied to and moved to done on BugHerd. **Waiting on the
agency, left in todo with a question:** the family photograph (#1), one look at the logo in
Safari (#3), the Canva team portraits (#43).

## Earlier — 2026-09-10, evening

**The agency's 48 BugHerd notes are answered on staging** (late run,
[`runbook/2026-09-10-the-bugherd-round-48-notes-on-five-pages.md`](./runbook/2026-09-10-the-bugherd-round-48-notes-on-five-pages.md)):
45 of them changed the site, three could not be done here. What changed the *system*:
every inner page now opens on a **split arrival** (copy on ink, photograph right) instead
of the homepage's full-bleed one, and **no inner page carries the credential strip**;
**Dr. Sung's portrait is the standing Grand Mission frame** (`dr-sung-standing`) on all
33 places, the crossed-arms files are orphaned; the doctors are ordered **Nguyen, Cho,
Sung** everywhere; the **team page names nobody** (the Named chapter is gone, pending the
agency's Canva portraits); both **seals carry the tree**. **Waiting on the agency:** the
photograph of Drs. Nguyen and Sung with their kids for the hero (#1), the browser that
clips the logo (#3, not reproducible), and the team portraits (#43). The 48 BugHerd tasks
are still open on the board; the reviewer closes them.

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

- **Anything that changes page height after load is handled by `journey.js`'s height watcher**
  (added 2026-09-16). Do not add per-component `ScrollTrigger.refresh()` calls, and measure a
  `<details>` fold on the summary's click, not on `toggle` (which fires after layout grew).
- **Photographs are colour at rest (2026-09-16).** Do not add `filter: grayscale` to a new
  component; the agency reads a colour change on scroll as a bug.

- **Check a BugHerd note in the reviewer's browser, not Chrome.** Pull tasks by id
  (`.tmp/bugherd/pull.mjs`): `requester_browser`, `requester_browser_size`, assignees and
  attachments are not in the list endpoint. The reviewer uses Safari; re-shoot with
  `shot-tasks.mjs webkit` at their size before calling anything unreproducible.
- **`import-album.mjs` must keep `frame: "external"` entries** (fixed 2026-09-15; it used to
  drop `dr-sung-standing` from the manifest on every run). Confirm after any run.

- **Never export `RAILWAY_TOKEN` from `.env` before `ship-payload` / `run-converter` /
  `fetch-nodes`.** The Railway CLI is logged in on its own; with the token in the
  environment every `railway ssh` answers "Unauthorized". And a push chain must check each
  step's exit code (`PIPESTATUS[0]`), not `node x | tail`: on 2026-09-10 a chain walked
  past the failed ship and published the new stylesheet over the old pages.
- **`home/**/index.html` files mix CRLF and LF.** Regexes anchored on `\n` match some
  pages and not others; use `\r?\n`.
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
