# Runbook

The **standing** state of this project: what is true now, what is next, and the traps.
Dated run history is one file per run under [`runbook/`](./runbook/INDEX.md) — read the index,
then only the runs you need. Do not read them all.

## Where things stand (2026-10-05)

| | |
| :--- | :--- |
| **Platform** | Instatic on Railway. Production `www.drnahlah.com`, staging `staging.drnahlah.com` (a full clone). Webflow is superseded. |
| **Published site** | 38 editorial pages + 43 migrated blog posts + **18 ads landing pages** + 1 ChatGPT page, live and verified. `/five-year-warranty` added 2026-09-21. Home page reviews are the ReputationHub **embed only** since 2026-09-22. |
| **Call tracking** | **ON for every visitor, no consent needed** (client, 2026-09-22e). Two GoHighLevel pools: Alexandria's (swaps (571) 617-7245) in the head of every page except `ads-landing-pages/tysons-*`, Tysons' (swaps (703) 448-3312) on those nine. Scoped by embed-origins **1.8.0** `pages=`/`except=` (`set-site-tags.mjs`). `connectOrigins` carries `services.leadconnectorhq.com` + `services.msgsndr.com`; without them, pages with no embed refuse the swap. Gate: `check-pool-scope.mjs`. Proof: `dni-proof.mjs --relay`. |
| **ChatGPT Ads** | Dedicated page `/ads-landing-pages/alexandria-all-on-4-chatgpt` (2026-09-23b), a live clone of the Alexandria All-on-4 page with every CTA on its own form, now its own GHL form `AD6c2Du26a0JUpxoh6p5` (2026-09-23d, `set-chatgpt-form.mjs`, prod + staging). OpenAI `oaiq` pixel `2EKUEqMZC1in13nT8T8eb5` on **that page only**, init only, no consent hold, www only; **off the Google pages**. **No ChatGPT lead is measured**: the new form redirects to the *Tysons* Google thank-you page, so the redirect needs changing in GHL. `dup-chatgpt-landing.mjs`, `set-openai-pixel.mjs` + `openai-ads-pixel.js`. |
| **HIPAA notice** | `/hipaa-disclosure` live on production + staging since 2026-10-01 (59 pages each): HHS model Notice of Privacy Practices naming BOTH entities (Esam Abou Nahlah, DDS, MS, PLLC = McLean; Implants And Prosthodontics Specialists, PLLC = Alexandria), effective 2026-10-01. **Linked from the footer legal row on every page** (after Privacy Policy, 2026-10-01b, also in site-src `footer.html` + `lp-foot.html`); **not in the static sitemap**. Both office privacy policies still carry Grand Mission Dentistry's email, a Texas phone and Texas law: flagged, untouched. `push-hipaa-page.mjs`; see the 2026-10-01 run. |
| **Footer social (2026-10-05)** | "Find Us Online" in footer column 1 on every site page of **production** (not ads pages): Facebook `/drnahlahprosthodontist/`, Instagram, RealSelf, Vitals, Healthgrades, Google = McLean GBP. **Staging still lacks it** (its draft holds the unreviewed class map): run `push-footer-social.mjs` there once that draft clears. `seo.json`/live schema `sameAs` still names the dead `/DentalGroupofTysons/`. See the 2026-10-05 run. |
| **Doctor referral (2026-10-05b)** | `/doctor-referral` **LIVE on production + staging**: hero › the referral-form PDF (`/patient-referral-form.pdf` → drnahlah-files Worker; the "About Dr. Nahlah (PDF)" button removed on production 2026-10-05, staging still has it) › the **GHL survey** `KXFNR4JPqxonXEFTtme0` (HIPAA, Sung, 2026-10-03; `partials/referral-survey.html`; the native webhook form is retired) › the home review wall. No office alert yet (client). Asana task closed 2026-10-05. `push-referral-page.mjs`; see the 2026-10-02b and 2026-10-05b runs. |
| **QA report (2026-09-28)** | Every Web Dev item fixed 2026-10-02 on prod + staging + site-src; `22-instatic-api-sync/audit-qa-fixes.cjs` = 81/81 sitemap pages clean, axe clean. QA's own package (01-content-intake/.tmp) is untouched. **Open with CS:** McLean phone (Google (571) 702-9900), the four office legal pages (entity, Texas law/courts, SMS scope, Grand Mission details), GA/FB pixel HIPAA sign-off, "Dental Group of Tysons" in 14 posts, `/video-library`, "&" vs "and", "Six people". See the 2026-10-02 run. |
| **Addresses** | McLean pages are `/contact-mclean`, `/privacy-policy-mclean`, `/terms-of-service-mclean` since 2026-10-02; the `-maclean` URLs 301 from the `drnahlah_301` Bulk Redirect list (Instatic makes no redirect for a renamed page). |
| **Share images / plugins** | Every page's OG override carries its own 1200x630 (`make-og-images.py`, `push-og-images.mjs`). open-graph **1.2.3** on both hosts (posts unfurl as themselves). seo-head.js no longer overwrites og:image. Cloudflare Web Analytics OFF (`enabled:false`). |
| **Sedation** | **Nitrous oxide and oral sedation only, no IV, no anaesthesiologist** (client, 2026-09-28). Every page, head, schema, OG, alt and post says so; `/meet-dr-nahlah` alone keeps "IV Sedation Certificate" as a credential (ask the client). Gate: `audit-live-sedation.mjs`. Never reintroduce IV/anaesthesiologist copy. See the 2026-09-28 run. |
| **Telephone numbers** | Tysons Corner · McLean **(703) 448-3312** (both lines), Alexandria new patients **(571) 617-7245**, Alexandria current patients (703) 940-5410. Retargeted 2026-09-22c; `(571) 702-9900` and `(571) 253-7790` are retired everywhere including the structured data. |
| **Class standard (2026-10-06)** | **Staging migration BLOCKED at step 0, nothing written.** Staging's draft ≠ published: the documented SEO v2/v3 sync (30 title cells, retired JSON-LD scripts, trimmed seo-head.js) **plus two undocumented Styles-panel edits** from 2026-10-05 03:57–04:00Z: `.ch-services .sv-grid` gained `grid-template-rows: repeat(2, 1fr)` and an empty class `flex-test` exists (probably the user's hand test; no visible change at any width). Page bodies are identical on all 59 pages. **The draft never held the class map**, despite what the 2026-10-05 runs say. Decide: publish the edits as is, or drop them; then run CLASS-STANDARD §8 (map `22-instatic-api-sync/class-standard/class-map.json` is complete, staging is still EDITABLE, dry run clean). See the 2026-10-06 run. |
| **Editable in Instatic (2026-10-04)** | **Staging only:** every token in the Framework panel (40 variables, root 16; spec `workflows/22-instatic-api-sync/framework/framework-spec.json`) and every rule in the Styles panel (`landing.css` moved, disabled). Gate `editability.mjs --site dr-nahlah:staging --published` = EDITABLE. **Production not yet**: same steps, after a parity snapshot. Body text rounds 15.6 → 15.68px in the Framework. See the 2026-10-04 run. |
| **SEO v2 (2026-10-05d)** | Production: titles/descriptions in the Hackensack form (treatment + "McLean & Alexandria, VA"), one server-side JSON-LD graph per page from aeo-schema **1.3.0** (Dentist + 2 offices, Person, Service + FAQPage, BlogPosting with original dates), seo-head.js trimmed to noindex + touch icon, legacy runtime JSON-LD retired, 43 image alts. Gate: `22-instatic-api-sync/seo-v2/verify-seo-v2.mjs`. **Never regenerate seo-head.js.** Staging's draft synced to match (`seo-v2/parity-check.mjs` = STAGING MATCHES PRODUCTION): run that check before any promotion. Still needed: Search Console access; H1s + copy depth (client). See the 2026-10-05d run. |
| **SEO v3 (2026-10-05g)** | Production structured data is **built from each page's own content** (`22-instatic-api-sync/seo-v3/`): scan → facts → build → push → publish. Service/procedure carry the page's hero line, options, timeline steps; HowTo x7, ItemList x33, VideoObject x23, LoanOrCredit, WarrantyPromise, team Persons, full credentials (no IV certificate), Wikipedia/Wikidata sameAs. **aeo-schema emitBreadcrumbs is OFF**: every page carries the trail it shows. After ANY copy edit: rescan, rebuild, push, publish (a renamed heading fails the build). Gates: `seo-v3/verify-seo-v3.mjs` + `seo-v2/verify-seo-v2.mjs`. Staging draft synced (parity check carries the emit flags). See the 2026-10-05g run. |
| **Instatic users (2026-10-05)** | Production: Alejandro (owner), Sang (admin), **Trong `trong@driverank.com` (admin, added 2026-10-05 via `POST /admin/api/cms/users`, temporary password given in chat; he should change it)**. Staging not touched. |
| **Local source of truth** | `workflows/04-design/.tmp/site-src/`. `node build-site.mjs` assembles `../final-site/`. Never hand-edit `final-site/`. |
| **Ads landing pages** | **LIVE** at `www.drnahlah.com/ads-landing-pages/<office>-<campaign>[-consultation\|-thank-you]` (Alexandria and Tysons Corner × All-on-4, dental implants, veneers). Rebuilt 2026-09-18 to the Livewell flow, pushed headlessly over REST (`22-instatic-api-sync/ads-to-nodes.py` + `push-ads-pages.mjs`), noindex, with the four site tags live site-wide. Brandklout's review (BugHerd #32-#48) applied and republished 2026-09-21. See the 2026-09-18 and 2026-09-21 runs. |

## What is next

1. ~~**A warranty terms sheet from the practice** (BugHerd #47).~~ **DONE 2026-09-21.**
   `/five-year-warranty` is live and linked from eleven places. Every commitment on it traces
   to something the practice already published (/about, /all-on-4, /dental-implants,
   /our-team); it carries **no exclusion list, no transferability clause and no "what voids
   it"**, because the practice has published none and an invented limitation on a warranty
   takes away something a patient was promised. **Still open with the practice:** have
   Dr. Nahlah's team read it and send any exclusions or corrections. See the 2026-09-21c run.
   **The claim is WITHHELD from all 18 ads landing pages** until they do (2026-09-21d, client
   instruction). Put it back with `toggle-ads-warranty-claim.mjs --restore --apply` then
   `push-warranty-links.mjs --apply`, and restore the four ads page sources from git.
   Provenance, since it gets asked: the claim comes from the OLD WordPress site
   (/about, /dental-implants, /all-on-4, captured 2026-07-30, trading as Dental Group of
   Tysons). The current terms of service say nothing about a warranty at all.
2. **In LeadConnector**: point each of the six forms (All-on-4: DONE, both redirect — verified 2026-09-23; implants/veneers unchecked) at its own thank-you page,
   `/ads-landing-pages/<office>-<campaign>-thank-you`, and remove the Continue step and the
   "Preferred Method of Contact" field (BugHerd #32). Neither is reachable from this repository.
3. Google Ads conversions, one per thank-you URL (six), or GTM page-view triggers on
   `/ads-landing-pages/` + `-thank-you`.
4. ~~**One filmed veneer patient**… BugHerd #41 and #42.~~ **RESOLVED 2026-09-21** without one:
   the client chose to drop the films from the two veneers consultation pages, and they now carry
   the four five-star Google reviews that actually name veneer treatment. **A photograph of the
   Alexandria office is still wanted from the client.** A filmed veneer patient remains the
   better answer whenever one exists. See the 2026-09-21c run.
5. ~~**Decide whether the film library moves to Vimeo** (BugHerd #34).~~ **DONE 2026-09-21.**
   Every practice-owned film on the site now plays from the Brandklout Vimeo library: 108 nodes
   across 15 pages, `player.vimeo.com` added to the Embed Origins `frameOrigins`, and
   `site.js` teaching the click-to-play cards to build either player. BugHerd #31 and #34
   closed. **The eight THE WELLNESS HOUR films on `/video-library` stay on YouTube** —
   third-party, rights unresolved — so that page is mixed-host by design. The Vimeo folder's
   privacy is still `view=anybody` / `embed=public`; locking it to this domain is now
   actionable and has not been done. See the 2026-09-21 Vimeo swap run.
   **The Vimeo side is ready**: the 12 practice-owned films have been sitting in the Brandklout
   workspace since 2026-08-29 (account `/users/248712727`, folder `Dr. Nahlah` = project
   `30326239`), and as of 2026-09-21 all 14 carry full descriptions. The manifest at
   `03-graphic-resources/.tmp/video-migration-manifest.csv` now holds every `vimeo_id`.
   Still open on that folder: all 14 are `privacy.view=anybody` / `privacy.embed=public`,
   so the domain-locked embedding the migration was *for* has not been applied.
   See the 2026-09-21 Vimeo run.
6. ~~**Nine older BugHerd pins are still open**.~~ **DONE 2026-09-21.** The board is
   **45 done / 2 open**: #32 (a GHL form setting) and #39 (a wording call for the client).
   Nothing on the board is waiting on us. Ten August
   pins were already fixed and live and had simply never been written back to the board; #29
   (title-case labels on /dental-conditions) and #30 (both street addresses in every footer)
   had never been picked up and were built and published that day. See the 2026-09-21b run.
   **Write the board back at the end of a review round** — `05-design-revisions/close-bugherd-*.mjs`
   posts comments and statuses over the API, and leaving it to "whoever normally closes them"
   is how seventeen pins sat open for a month.
7. **Staging re-mirrored 2026-09-23c**: embed-origins 1.8.0, settings synced by
   `18-instatic-staging-clone/sync-plugin-settings.mjs`, which copies everything EXCEPT the
   GoHighLevel pools, user_session.js and GTM (they would burn real pool numbers and fire the
   production container). To re-mirror, follow the 2026-09-23c run's recipe.
8. ~~**In GoHighLevel**: only `(571) 253-7790` was pooled.~~ **SUPERSEDED 2026-09-22d**: one pool per office,
   each forwarding the office's new-patient number. Consent: decided 2026-09-22e, the pools
   run without it. Open: should `(703) 940-5410` be tracked (it is not).
9. **The home page's reviews now have no fallback.** `check-review-embed.mjs` is the check;
   the vendor was serving zero reviews as recently as 2026-09-21.

## Standing traps

These bite every time somebody works in here. The per-run files carry the rest.

- **Site-wide wording goes through `push-copy-fixes.mjs <map>`** (2026-10-02): text fields only, URL/slug token guard, plan / --apply / --publish, staging first, then `04-design/.tmp/retarget-qa-copy.mjs` for the local source. The maps `copy-fixes-qa-*.mjs` are the examples.
- **Copy lives in SEVEN stores, not the page tree.** Nodes, the row `title` cell, code assets
  (`jsonld/*.js`, `seo-head.js`), the open-graph runtime store, **aeo-schema stored blocks**
  (`runtime/entries`), media alt text and `posts` rows. `push-sedation-copy.mjs` walks all of
  them and is the template for any site-wide wording change.
- **Every pre-v2 script in `22-instatic-api-sync/` imports a path that no longer exists**
  (`../../../../process/...`). Go through `sedation-api.mjs`, which loads this worktree's
  `.env` (without `process.loadEnvFile`: it cuts the password at `#`) and imports the helper
  from the main checkout.
- **A phone number lives in FOUR places, and fixing the pages fixes only one.** The visible
  numbers are `base.link` nodes on all 57 pages; the shared `cta-offices` component has its
  own; the JSON-LD is `brandklout.aeo-schema` plugin settings; and the per-page meta/og/twitter
  descriptions are materialised in the `brandklout.open-graph` **runtime store**. A body-only
  check passes while the head still publishes the old number. `audit-live-numbers.mjs` sweeps
  every sitemap URL and says which half a hit is in.
- **The home page reviews are the EMBED ONLY, and `.rv-wall` still matters elsewhere.** The
  six-card wall came off `/` on 2026-09-22 at the client's request. Do NOT revert
  `fix-rv-wall-display.mjs` to undo it: `.rv-wall{display:grid}` is a site-wide rule and the
  two veneers consultation pages still use it. Remove nodes from a page, never the rule.
  `restore-review-wall.mjs` would put the wall back and also looks for the pre-migration
  plugin id, so it is the wrong tool for that page now.
- **A phone number written in the wrong shape silently stops swapping.** The GHL pool reads
  `(NNN) NNN-NNNN`, `NNN-NNN-NNNN`, `NNN.NNN.NNNN` and `(NNN)NNN-NNNN` in text, and a
  ten-digit run in an href. Spaces, a non-breaking space or bare digits in text are invisible
  to it and nothing fails. `site-test.mjs` gates this; `dni-proof.mjs` proves the swap.
- **Proving DNI burns pool numbers if you clear cookies per page.** Clear once per run and
  walk the site as one visitor, which is what `dni-proof.mjs` does.
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



## Cookie consent (Termly) — 2026-09-22

**Live.** The banner renders and the Cookie Preferences control opens Termly's modal. Tagged analytics and ad pixels wait for consent; the **GoHighLevel call-tracking pool deliberately does not** (client instruction, 2026-09-22). Account `dr.nahlah@thrivesquare.com`, website UUID
`7737150b-c6b0-4003-a1b0-52a6495a4a4f`, `autoBlock=off`. The Cookie Preferences control is inserted at runtime by
`BrandkloutConsentPreferences` / `brandklout-consent-preferences.js`, which clones the footer's
Privacy Policy link so it matches this site's own type.

`TERMLY_API_KEY` is in this worktree's generated `.env`, from `~/.webzite/.env` `[vars]`
`TERMLY_NAHLAH`. Never hand-edit `.env`; edit the master and run `node scripts/env-sync.mjs`.
The key is near-useless (one read-only endpoint) — the public **website UUID** is what tooling needs.

**Do not re-add a consent hold to a GoHighLevel number pool**: the client's instruction (2026-09-22)
is that pools run even without consent.

Full history: [`runbook/2026-09-22-termly-cookie-consent.md`](./runbook/2026-09-22-termly-cookie-consent.md). Cross-site detail:
[`deliver/process/23-termly-ghl-consent`](../../../../process/23-termly-ghl-consent/23-termly-ghl-consent.md).

## Version Control

Tracked with the repo. Follows the runbook rules in
[SYSTEM_RULES.md §5](../../../../SYSTEM_RULES.md).
