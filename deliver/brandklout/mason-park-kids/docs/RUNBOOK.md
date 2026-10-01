# RUNBOOK - `bk-mason-park-kids`

The **standing** state of this project: what is true now, what is next, and the traps.
Dated run history is one file per run under [`runbook/`](./runbook/INDEX.md) — read the index,
then only the runs you need. Do not read them all.


**This worktree holds exactly one site: Mason Park Dental for Kids,
`pediatricdentistkatytx.com`, in `deliver/brandklout/mason-park-kids/`.** Nothing else. If a task
is about `bestdentistinkatytx.com` / `mason-park.up.railway.app`, it belongs one directory over in
`bk-mason-park` - stop and switch, do not do it here.

## Where the site is, as of 2026-09-09

**2026-10-01: `/hipaa-disclosure` IS LIVE on staging and production** (HHS model notice, entity = "Mason Park Dental for Kids" because the site names no legal entity: confirm with the practice). In the footer's legal row after Privacy on every page since 14:02 UTC, in `home/` too (`runbook/2026-10-01-hipaa-footer-link.md`); not in the edge Worker's static sitemap.xml. Its source is `home/hipaa-disclosure/`, so later chains carry it. **`draftMatchesPublished` does not see Open Graph overrides: run `populate-seo.mjs` before a publish, not after.** See `runbook/2026-10-01-hipaa-disclosure-page.md`.

**2026-10-01: ON PRODUCTION (15:38 UTC).** BugHerd round seven (#507-#515), the /patient-reviews rebuild (Asana, Marvel order, story carousel), the GHL contact form on /contacts and /patient-reviews, the Canva team portraits and #82, promoted in one `--only` chain (`publish-1001-all.sh`), every verify green on masonparkpediatricdental.com. **Publish only the pages you changed:** `to-instatic.mjs --only` (03 README). Open on the practice: #198 (GHL service field), #483 (photo), #368, #378-#381, #38. Drive export and Canva team folders sit in `workflows/`. See `runbook/2026-10-01-reviews-page-ghl-form-canva-team.md` and `runbook/2026-10-01-bugherd-round-seven.md`.

**2026-10-01: BugHerd round seven, #507-#515, 8 closed; on production since 15:38 UTC (above).** 13 notes still wait on the practice (#483 photo, #502/#504/#506 Canva headshots, GHL form, forms URL, lender links, #38, #82). See `runbook/2026-10-01-bugherd-round-seven.md`.

**2026-09-29: LIVE GOOGLE REVIEWS ON STAGING (Elfsight app `d359c3c4`, the pediatric #104B listing).** It replaces the homepage `#proof` chip rail and the `/patient-reviews` wall; not promoted to production. `.tmp/add-elfsight-reviews.mjs` places it, and must be re-run after any re-import of those two pages. Never use `data-elfsight-app-lazy` (it never boots here). See `runbook/2026-09-29-elfsight-google-reviews-on-staging.md`.

**215 pages live and published at <https://mason-park-kids.up.railway.app> as of the night of
2026-09-09: the 57, the blog overview and all 157 posts, on one design.** Local and live are
the same (`diff-all.mjs` 215/215; see `docs/runbook/2026-09-09-the-whole-site-on-instatic-215-pages.md`). The public domain still does not point here; that host is the
review link. Every gate is clean over 215 pages: `check.mjs` 0 errors, `audit-live.mjs` 215/215 at 1440
and 390, `diff-all.mjs` 215 match, `crop-all.mjs --live` 0 across 215 x 2 widths.

**2026-09-14: the new design is on STAGING at <https://staging.masonparkpediatricdental.com>**
(admin at `/admin`, origins verified). It is not ready for production.
**`masonparkpediatricdental.com` and `www` serve the OLD WordPress site** as a static copy
(`workflows/01-site-recovery/.tmp/recovered/mirror-clean/`) from Cloudflare Pages project `mason-park-kids-wp`.
**Deploy only `mirror-clean`, never `mirror/`: the original carries a malware loader on every page**
(stripped 2026-09-15, see the security incident doc). `node verify-safe.mjs mirror-clean` must pass first. The real WordPress is unreachable: the
SiteGround vhost is suspended and SSH is refused. To update the old site, redeploy the mirror with
`wrangler pages deploy`. When the new design launches, repoint the apex/`www` CNAMEs to Railway and put them back
in `PUBLIC_ORIGIN`. Staging has no `noindex` and no `robots.txt`.
See `runbook/2026-09-14-domain-masonparkpediatricdental-live.md`.

**2026-09-27: STAGING IS ITS OWN INSTANCE.** `staging.masonparkpediatricdental.com` is a separate
Railway environment (`staging`, own volume and database), seeded from production, de-indexed at the
edge, with the same logins. **This worktree's `INSTATIC_BASE_URL` is staging; every chain publishes
there.** Promote to production by re-running the same chain with `PROMOTE=production
INSTATIC_BASE_URL=https://mason-park-kids.up.railway.app`. The paragraphs below that say "staging and
production are the same instance" are history. See `runbook/2026-09-27-staging-environment.md`.

**2026-09-26: BugHerd round five, #174-#433. 242 of 252 closed and live on production.** Photos
from the practice Drive (`_drive/`, `DRIVE` pool in `prep-images.py`); the "Credentialed by" strip
is on the homepage only; every "Suite 104B" caption is gone; ~70 copy edits; SDF on fillings and
restorative; insurer logos on /financing; tickers pause on hover. **Open, on the practice:** #34/#198
(no kids GHL form), #368 (no online-forms URL), #378-#381 (practice lender links; generic ones
linked meanwhile), #406 (Invisalign Platinum badge). #38 and #82 unchanged. See
`runbook/2026-09-26-bugherd-round-five.md`.

**2026-09-24, 22:31 UTC: PRODUCTION LAUNCH. `masonparkpediatricdental.com` (apex; `www` 301s to it)
serves the Instatic site.** The old WordPress copy is off the domain but still deployed on Cloudflare
Pages as the rollback. Backups are in `C:/Users/ACER/Backups/mason-park-kids/2026-09-24-prelaunch/`, plus a
DB copy on the Railway volume. The edge Worker `masonparkpediatricdental-edge` owns www -> apex, 170 legacy
301s, robots.txt and sitemap.xml. **Staging and production are the SAME instance: every admin edit is
live.** See `runbook/2026-09-24-production-launch.md`. The paragraphs below that describe the domain
serving WordPress are history.

**2026-09-24: `pediatricdentistkatytx.com` (the old domain) is prepped to 301 to
`masonparkpediatricdental.com`,** through a Cloudflare Worker on the pending zone, tested on workers.dev.
It is still delegated to Squarespace DNS and currently serves SiteGround's suspended 503. **Live the
moment the Squarespace owner sets NS `ajay`/`ruth.ns.cloudflare.com`**; then run
`workflows/.tmp/legacy-domain/verify.mjs`. See `runbook/2026-09-24-legacy-domain-redirect-prepped.md`.

**2026-09-24: BugHerd round three, #42-#168. 126 of 127 done, published to staging, verified
(`verify-0924.mjs` 118/118) and replied.** The reviewer's own photos across ~55 slots (`rv-*` keys,
`REVIEWER` in `prep-images.py`), 11 band photos removed, ~30 copy edits, less space between
chapters site-wide, short text columns centred, a **second level in the Services menu on every
page** (with "Cosmetic and gum care"), a topic list on the FAQ, the reviews regrouped. Dr. William
Sung (the adult practice) was named on three more pages and is gone; /thank-you had a seventh copy
of the old hours. Evening, #170-#187: 15 done and closed; #174/#176/#182 wait on two Drive originals (the Drive sign-in expired). Later the same day, #169: a photo on every homepage step card, published and closed. **Open: #82** (its attachment was 0 bytes; asked again), plus #34 and #38. The
recipes are now behind the pages; the files are the source. See `runbook/2026-09-24-bugherd-round-three.md`.

**2026-09-23: BugHerd #41 done.** The /special-offers hero is the reviewer's own front-desk photo (`front-desk-tablet`), centred with `.ar-bg.is-counter`; published and verified on staging, replied, closed. #34 and #38 still open. See `runbook/2026-09-23-bugherd-41-special-offers-hero.md`.

**2026-09-21: BugHerd round two, #29-#40. Nine done and published to staging, two open.** The map on every page pointed at the
**adult** practice's Google listing (suite 104A); it is the pediatric one now (#29/#40). The hours were
wrong in six places and are **Mon to Thu 9am-6pm, Fri to Sun closed** everywhere, schema included
(#30/#39) - **confirm them with the practice before production, Google is told this too.** The copper
sticker on the homepage was painting body grey at **1.3:1** because `.ch p` outranks a bare
`.ft-sticker`; `colour-leak.mjs` is the new gate for that whole class (#33). Also #31, #35, #36, #37.
**Open: #34** needs a GoHighLevel form URL from Brandklout before an enquiry form can exist at all
(`.tmp/add-inquiry.mjs` is the whole change, waiting on the URL); **#38** is changed but was never
reproduced, and needs the reviewer to re-check. Two things not in any note were fixed on the way:
"(281) 578 to 7100" on 18 pages (the generators' "6-18 months" rule was eating the phone number, now
guarded) and a block of raw WordPress schema naming the **adult** practice on five blog posts.
Published and verified on staging 13:35-13:36 UTC, 215 pages, `draftMatchesPublished`; replies sent.
See `runbook/2026-09-21-bugherd-round-two.md`.

**2026-09-16: BugHerd's first 27 notes are all done.** The last three were resolved
with the Drive brand guide: the site now uses the practices' brand palette, with Marcellus/Figtree
standing in for the Adobe faces (#4). "Hospital setting" is gone site-wide (#11). The gumball frames were
edited to black slacks (#28). Published to staging, 215 pages. Re-run
`workflows/.tmp/bugherd/fetch.mjs` for new notes. See `runbook/2026-09-16-bugherd-open-three-brand-guide.md`
(and `2026-09-15-bugherd-staging-round-one.md` for the first 24).

| | State |
| :--- | :--- |
| The **eleven core pages** | Designed, and the design is now identical on disk and published. `workflows/03-core-pages/` is the source. |
| The **blog** | **Live, all 157 posts and the overview,** built by `build-blog.mjs` from the recovered export. On the masthead and in the footer. Which posts the practice keeps is still its call; unpublishing one is a line in the generator's list. |
| The **46 migrated pages** | **Redesigned, 2026-09-09.** All 57 pages now carry the same masthead and footer, the fluid type, the journey layer, at least one photograph and a ground that changes under the reader. They have local source for the first time: `.tmp/harvest-migrated.mjs` pulled their content down, a recipe in `.tmp/recipes/` says which blocks go where, and `.tmp/build-pages.mjs` wrote the files. **From here the files are the source** - edit a page's `<main>` in place, exactly like the eleven. |
| Head tags | Every page has a description, canonical, Open Graph and JSON-LD, written at publish by the two plugins in `deliver/process/19-instatic-seo`. |
| Type & colour | **Brand guide since 2026-09-16:** Marcellus (for Collier) and Figtree VF (for Avenir Next), self-hosted on both sides; exact guide palette (slate, sage, light grey, copper, sand, beige). No Adobe Fonts kit yet. Fraunces/Nunito files remain uploaded but unused. |

### The gates, and what each one is for

Run from `workflows/03-core-pages/.tmp/`. All of them are cheap; run them all.

| Command | Answers |
| :--- | :--- |
| `node check.mjs` | Do the assets resolve, the braces balance, the prose fit, the chrome match? |
| `node shot.mjs <page>` | What does it look like at four widths, and which font is really painted? |
| `node crop-all.mjs` / `--live` | Does any heading lose ink to a clipping ancestor? Walks `home/`, so it sweeps all 57. |
| `node shoot-all.mjs ../home <dir>` then LOOK | Does every chapter hold together? The per-page gates cannot see a figure hanging alone; this can. Pinned scenes show as empty ground here and are fine: `viewport-probe.mjs` for those. |
| `node hover-probe.mjs ../home/<page>/index.html` | Can you still read a button while hovering it? A crop of every variant, hovered. |
| `node nav-probe.mjs ../home/<page>/index.html` | Can the client click through the review from disk? Every internal link must resolve to a file, at every depth. |
| `python recompose-figures.py --dry-run` | Is every picture still where the plan puts it? 0 pages should change. |
| `node build-blog.mjs --list` | Which of the 157 posts are built, and the old-URL to new-URL map. `--all` builds every post; the overview links whatever is on disk. |
| `node build-pages.mjs --list` | Which pages have a recipe. **Order is `build-pages` then `stamp` then `check`, and it does not commute.** |
| `node colour-leak.mjs` | Whose rule is painting this text? A single-class rule that sets `color` loses to a contextual one like `.ch p`, and the element paints an ink it never asked for. Default run covers every coloured class on the first page that uses it; `--all` is the slow per-page path. |
| `node btn-line-gate.mjs local\|live` | Does anything paint a line across a pill button, in WebKit at retina scale? Sample the column LEFT of centre: down the middle it reads the white label as a line. |
| `node diff-all.mjs` | Local against live, all eleven: head, structure, text, geometry. |
| `node audit-live.mjs` / `--width 390` | **All 57 routes**, not the eleven. |
| `node verify-live.mjs` / `--migrated` | The published pages, end to end. |
| `node probe-hooks.mjs <url>` | Do the scrubbed scenes actually do work? |
| `node section-shots.mjs local\|live [width]` | What does each homepage chapter look like in ONE viewport, the way a BugHerd reviewer saw it? Also: is the Home pill legible, is the review written by mid-window, does the rail move and stop on hover? |
| `MSYS_NO_PATHCONV=1 node import-pages.mjs --only / --publish` | A homepage-only push, after the conversion chain in the 03 README. `--only` takes the converted slug (`/`), not `index`. |

### The traps that have each cost a session

1. **Look at every Magnific face before you ship it.** It will return a
   convincing photograph of somebody who is not the person. Two of this
   practice's named staff came back as different people; `contact-sheet.py`
   is what caught it.
2. **`import-styles.mjs` ships `instatic/site.css`,** which `to-instatic.mjs`
   writes. Edit the stylesheet without re-exporting and it publishes the
   previous one silently.
3. **`abspath` before you open anything under the recovery mirror.** Windows
   applies MAX_PATH to the unresolved string, so a valid path fails as "no such
   file" from this worktree's root.
4. **A gate with a hard-coded page list watches only what is in the list.**
   `crop-all.mjs` carried the eleven as an array while 46 other pages drifted
   onto a different nav bar for a week, and `check.mjs` reported the chrome
   identical the whole time because the other pages had no local file to read.
   Every gate walks `home/` now. Keep it that way.
5. **A positioned pseudo-element paints over its parent's own text.** The button fill at
   `z-index: 0` hid every label on hover; `.button > *` cannot lift a bare text node. Fill at
   `z-index: -1` inside `isolation: isolate`. `hover-probe.mjs` is the gate.
6. **A transformed sibling paints on top.** `data-drift` and `data-wipe` put transforms
   on figures; anything meant to overlap one needs `position: relative` and a `z-index`,
   or the picture rides over the text (it did, on nineteen pages, for a week).
7. **The adult practice is not this practice.** Dr. William Sung, teeth
   whitening, implants, `bestdentistinkatytx.com`: all of it belongs to
   `bk-mason-park`. It arrived here through the 02 migration and was cleaned
   out of six pages on 2026-09-09. If you see his name on this site, it is a
   bug.

## Cookie consent (Termly) — 2026-09-22

**Applied and published to the Instatic build**, which is not yet the live site. Nothing fires before a visitor chooses. Account `masonparkpediatricdental@brandklout.com`, website UUID
`1e31d822-4be9-4f13-8fea-784b57185bb0`, `autoBlock=off`. The Cookie Preferences control is inserted at runtime by
`BrandkloutConsentPreferences` / `brandklout-consent-preferences.js`, which clones the footer's
Privacy Policy link so it matches this site's own type.

`TERMLY_API_KEY` is in this worktree's generated `.env`, from `~/.webzite/.env` `[vars]`
`TERMLY_MASON_PEDIATRIC`. Never hand-edit `.env`; edit the master and run `node scripts/env-sync.mjs`.
The key is near-useless (one read-only endpoint) — the public **website UUID** is what tooling needs.

**Do not re-add a consent hold to a GoHighLevel number pool**: the client's instruction (2026-09-22)
is that pools run even without consent.

Full history: [`runbook/2026-09-22-termly-cookie-consent.md`](./runbook/2026-09-22-termly-cookie-consent.md). Cross-site detail:
[`deliver/process/23-termly-ghl-consent`](../../../../process/23-termly-ghl-consent/23-termly-ghl-consent.md).

## Version Control
Tracked. Follows the root-level version control rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
