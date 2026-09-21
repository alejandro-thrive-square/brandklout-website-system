# Runbook

The **standing** state of this project: what is true now, what is next, and the traps.
Dated run history is one file per run under [`runbook/`](./runbook/INDEX.md) — read the index,
then only the runs you need. Do not read them all.

## Where things stand (2026-09-21)

| | |
| :--- | :--- |
| **Platform** | Instatic on Railway. Production `www.drnahlah.com`, staging `staging.drnahlah.com` (a full clone). Webflow is superseded. |
| **Published site** | 37 editorial pages + 43 migrated blog posts + **18 ads landing pages**, live and verified. |
| **Local source of truth** | `workflows/04-design/.tmp/site-src/`. `node build-site.mjs` assembles `../final-site/`. Never hand-edit `final-site/`. |
| **Ads landing pages** | **LIVE** at `www.drnahlah.com/ads-landing-pages/<office>-<campaign>[-consultation\|-thank-you]` (Alexandria and Tysons Corner × All-on-4, dental implants, veneers). Rebuilt 2026-09-18 to the Livewell flow, pushed headlessly over REST (`22-instatic-api-sync/ads-to-nodes.py` + `push-ads-pages.mjs`), noindex, with the four site tags live site-wide. Brandklout's review (BugHerd #32-#48) applied and republished 2026-09-21. See the 2026-09-18 and 2026-09-21 runs. |

## What is next

1. **A warranty terms sheet from the practice** (BugHerd #47). Six paid-page mentions of the
   five-year warranty now state its Precare condition, but none links to terms, because no terms
   sheet exists anywhere on the site. Do not write one from the marketing copy.
2. **In LeadConnector**: point each of the six forms at its own thank-you page,
   `/ads-landing-pages/<office>-<campaign>-thank-you`, and remove the Continue step and the
   "Preferred Method of Contact" field (BugHerd #32). Neither is reachable from this repository.
3. Google Ads conversions, one per thank-you URL (six), or GTM page-view triggers on
   `/ads-landing-pages/` + `-thank-you`.
4. **One filmed veneer patient**, and a photograph of the Alexandria office, from the client.
   Until the film exists, BugHerd #41 and #42 cannot be answered: the only cosmetic clips in the
   library are generic-presenter ones and must not go on a paid page.
5. **Decide whether the film library moves to Vimeo** (BugHerd #34). It is a job for all fourteen
   films at once, and it needs `player.vimeo.com` in the Embed Origins `frameOrigins`.
6. **Nine older BugHerd pins are still open**: #13, #14 (patient-stories), #24–#28, #30, #31
   (main site), #29 (dental-conditions). Several wait on client assets.
7. The staging clone's Embed Origins plugin is 1.4.0 and has no `siteScripts`; the four tags
   are on production only. Upgrade staging's plugin if tag behaviour ever needs testing there.

## Standing traps

These bite every time somebody works in here. The per-run files carry the rest.

- **`site-src/` is the source; `final-site/` is output.** Edit the body, the partial or the
  CSS component, then rebuild. Three page lists move together: `PAGES` in `build-site.mjs`,
  and the lists in `site-test.mjs` (derived) and `fluid-qa.mjs` (hardcoded).
  `check-page-lists.mjs` is the cheap gate that catches the drift, and a gate pointed at a
  page that does not exist is not a failing gate, it is an absent one.
- **One class name, one stylesheet.** `css-vocab.mjs` fails any class declared in two files,
  because Webflow and Instatic both merge classes by name. A new stylesheet cannot restate a
  rule an old one owns, not even to change one value.
- **Instatic flattens a slash in a slug.** `a/b` saves and then serves at `/a-b`, so links to
  the nested path 404. Flatten before importing.
- **Instatic drops elements it considers empty**, which includes a `<dt>` or `<span>` whose
  only content is a CSS `::before`. Put the character in the markup.
- **Duplicate uploads of the same photograph exist under different filenames.** `lab.jpg` IS
  `tech-hero.jpg`. Compare bytes, not filenames, when checking whether a page repeats an
  image.
- **`js/90-boot.js` reads `#nav` and `#navProgress` without guarding.** Any page with its own
  header has to keep those ids or the first scroll past 40px throws and takes the rest of
  boot with it.
- **Only six of the fourteen films in `videos.json` are the practice's own.** The other eight
  feature a generic presenter and are not Dr. Nahlah; the tell is `hqdefault` rather than
  `maxresdefault`. Never put one on a paid page. There is no veneer patient film at all.
- **A page with click-to-play film facades needs one real YouTube `<iframe>` on it.** Instatic
  lifts CSP `frame-src` only for a page that renders a real YouTube node.
- **Never wrap already-revealing blocks in a `data-rv` container** — `js/20-pagekit.js` skips a
  `data-rv` whose parent has one, and the children silently stay at opacity 0.
- **A blank GHL form under automation is Cloudflare Turnstile**, not a broken embed. It refuses
  automation and localhost; prove the form on the deployed domain.
- **Ads pages publish at a NESTED slug, and only a site-document write keeps it nested.**
  `ads-landing-pages/<name>` serves at the nested URL after `PUT /site-document`; any
  `PATCH /data/rows/:id` on the row (the SEO-cells write) re-derives the route and flattens it
  to `/ads-landing-pages-<name>` until the page is re-saved through site-document.
  `push-ads-pages.mjs` re-saves after the patch; `.tmp/reassert-slug.mjs` repairs a page by hand.
- **`render-draft-page.mjs` drops shared components.** A page with a
  `base.visual-component-ref` (the home page's office panels since 2026-09-14) previews with a
  hole. Count the refs before concluding a block is missing; on 2026-09-18 that mistake
  published the panels twice for a few minutes.
- **The Instatic MCP grant is dead** (`.mcp.json` still points at `encorercm.com`). Nothing
  needs it any more: pages go in through `ads-to-nodes.py` + `push-ads-pages.mjs`, code assets
  through `push-script-asset.mjs`, media through `upload-ads-media.mjs`.
- **The ads pages are templates: nine bodies, eighteen outputs.** `build-site.mjs` fills
  `{{LOC_*}}` tokens from its `LOCATIONS` table per office. Edit the body once; never the
  built page. The six form ids live in that table and nowhere else.
- **The asset library's file names lie.** `Untitled-3.jpg` is the reception desk, `Untitled-4`
  a handshake, `pt-hero-2` is Stephen, `dr-and-yolanda` is Barbara. Look before captioning.
- **BugHerd writes back over the same API the pull uses.** `PUT /api_v2/projects/:p/tasks/:id.json`
  with `{"task":{"status":"done"}}` moves a pin; `POST .../tasks/:id/comments.json` with
  `{"comment":{"text":"..."}}` adds a note. Both want the INTERNAL `id`, not the `local_task_id`
  the board shows — `.tmp/bugherd/tasks.json` carries both. Same Basic auth as the pull
  (`BUGHERD` as the username, a literal `x` as the password).
- **A bordered card row must not stagger on Y.** `js/20-pagekit.js` tweens `data-rv="stagger"`
  children `y: 30 -> 0` with a `.09` stagger, which puts a row of `.pk-card` boxes on a visible
  staircase for over a second. Brandklout read that as broken alignment twice (BugHerd #37, #38).
  The nine `.pk-cards` rows on the ads pages now use a plain `data-rv` and land as one block.
- **`.sp-copy` only works inside `.pk-split`** — it is declared as `.pk-split .sp-copy`. Pull a
  two-column split apart and the surviving column silently loses its grid, its gap and its 56ch
  measure, with nothing failing.
- **`seo.json` is CRLF with 2-space indent.** Re-serialize it the same way or a 22-line edit
  lands as a 3,476-line diff.
- **The four site tags are one partial, `partials/site-scripts.html`, on every page.** The
  inline-script gate exempts only a `<script data-site-script>`. Termly runs autoBlock=off on
  purpose: on, it would hide the GHL form and the films until consent.
- **No prices anywhere**, on the client site or the landing pages: the practice publishes
  none, and the relative-weight column ($ / $$ / $$$) is the substitute.
- **Open since the original build:** the McLean current-patient phone conflict
  ((703) 448-3312 is used, (703) 493-1358 also published), inconsistent brand naming, and
  four `assets/tech-*.webp` files `/our-facility` references that are not in the local
  assets folder.

## Version Control

Tracked with the repo. Follows the runbook rules in
[SYSTEM_RULES.md §5](../../../../SYSTEM_RULES.md).
