# Workflow: 05 - Instatic Upload (Stone Med Spa)

Takes the static build in
[`04-design/.tmp/med-spa/final-site`](../04-design/.tmp/med-spa/final-site) and puts it
into the client's own Instatic instance as an editable site — pages as node trees, CSS as style
registry rules, images in the media library.

> [!NOTE]
> **This file arrived as a verbatim copy of Stone Surgical Arts'
> [`21-instatic-upload.md`](../../../stone-surgical-arts/workflows/21-instatic-upload/21-instatic-upload.md)
> and its traps 1–25 are that build's, found on that build.** They were all still true here, which
> is the point of copying them; traps 23 and 24 in particular predicted two of this build's four
> real defects before anyone looked. Traps 26 onward are this build's own. Where a trap names a
> page or a stylesheet that does not exist here, it is the sibling's — read the mechanism, not the
> filename.

> [!WARNING]
> **ELEVEN PAGES, PUBLISHED 2026-09-04, `{"publishedPages":11}`, `11 written, 0 deleted`, on a
> brand-new instance provisioned the same day.** Gates: `verify-live.mjs` clean (11 routes, 81 URLs,
> 166 asset references, 11/11 distinct titles) · `css-parity.mjs` FAIL none · `visual-diff.mjs`
> ≤1.6% at 1440 and ≤4.4% at 390, all of it text antialiasing and image re-encoding ·
> `compare-live.mjs` **36 → 12 → 10 → 2**, and those two are comparison noise whose direction flips
> between runs (trap 30).
>
> **EIGHT real defects, every one silent, every one behind a 200.** Four found by `compare-live.mjs`
> and by reading the published `<head>`: the whole site's dark band published in the wrong charcoal
> (trap 26), two custom properties declared on classes vanished (trap 27), **every image published
> with `alt=""`** (trap 28), and every page published the SIBLING's meta description (trap 31). One
> was trap 23 arriving again — a breadcrumb's `&nbsp;` spacing (trap 29).
>
> **And three that nothing in the workflow could see, which is why it gained two gates.**
> `visual-diff.mjs` — a plain pixel subtraction — found that a multi-layer `background` loses every
> layer but the last, so **the scrim over every interior header was gone and `/thank-you` was 56%
> different** (trap 32). `css-parity.mjs` — which asks whether each declared property arrived at all
> — found `scroll-padding-top` dropped, meaning every in-page anchor landed under the fixed navbar
> (trap 34). And two "missing photographs" turned out to be `fullPage: true` screenshots lying
> (trap 33).

> [!IMPORTANT]
> **A THIRD-PARTY SCRIPT TAG CANNOT BE ADDED TO A PAGE. IT GOES IN THE BUNDLE.**
>
> Instatic has **no custom-head field**, and `importHtml` strips every
> `<script>` out of a page it imports — that is the `strippedScripts: 2` this
> workflow prints per page on every run. A tag pasted into
> `partials/head.html` or a page body works perfectly in `final-site/` and then
> simply does not exist on the published site, which is the worse of the two
> failures because the local build proves it works.
>
> There is exactly ONE script asset for the whole site, `src/scripts/site.js`,
> assembled by `push-site.mjs` as `bootstrap + vendor.js + site.js`. Anything
> third-party has to be a JS module in `site-src/js/` that injects the tag at
> runtime. `js/90-bugherd.js` is the worked example: `build-site.mjs`
> concatenates `js/*.js` in filename order into `assets/site.js`,
> `push-site.mjs` reads that file, and **no part of this workflow needs
> changing.** `90-` sorts last and marks it as not-core.
>
> Anything of that kind should also be HOST-GATED rather than remembered about
> at launch. See the header of `js/90-bugherd.js`.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the scripts or technical logic of this workflow must be
> documented here immediately.

## The instance

| | |
| :--- | :--- |
| **URL** | `https://stone-med-spa-production.up.railway.app` |
| **Admin** | `https://stone-med-spa-production.up.railway.app/admin` — verified by `check-origins.mjs`, registered in [`20-instatic-domain-origins/sites.json`](../../../../process/20-instatic-domain-origins/sites.json) |
| **Railway** | workspace `Brandklout` → project **`Stone Med Spa`** `ad4db12e-eb77-42b8-9021-4e84083fc99d` → service `Stone Med Spa` `001e714b-6bba-4cb4-b4e6-b60117e2ef1d`, env `production` `70523c39-dd75-4438-93bb-2c76f93b4c1a` |
| **Image** | `ghcr.io/corebunch/instatic:latest`, volume `/app/storage`, DB `/app/storage/data/cms.db`, healthcheck `/health`, port 8080 |
| **Owner** | `alejandro@thrivesquare.com` — the same credentials as Mason Park, created 2026-09-04 |
| **Credentials** | `INSTATIC_BASE_URL` / `INSTATIC_EMAIL` / `INSTATIC_PASSWORD` in the repo-root `.env`, generated from `~/.webzite/.env` `[stone-med-spa]` |

### Provisioning it, in the order that matters

The sibling was created from the Railway dashboard and then **renamed**, which is what taught us the
ordering: a generated domain is derived from the service name **at creation**, so the sibling's first
domain was named after the Docker image and `PUBLIC_ORIGIN` had to be moved with it afterwards. This
instance was created name-first instead, in one script, and was correct from its first boot.

The Railway CLI cannot create a project or name a service, so this goes through
`backboard.railway.com/graphql/v2` with the token in `~/.railway/config.json`:

1. `projectCreate` `{name: "Stone Med Spa", workspaceId, defaultEnvironmentName: "production"}`
2. `serviceCreate` `{projectId, environmentId, name: "Stone Med Spa", source: {image: "ghcr.io/corebunch/instatic:latest"}}`
3. `volumeCreate` `{projectId, environmentId, serviceId, mountPath: "/app/storage"}`
4. `serviceDomainCreate` `{environmentId, serviceId, targetPort: 8080}` — **only now**, so the
   generated host is `stone-med-spa-production.up.railway.app` and not the image's name
5. `variableCollectionUpsert` — `DATABASE_URL=sqlite:/app/storage/data/cms.db`,
   `PUBLIC_ORIGIN=https://<the domain from step 4>`, `PORT=8080`, `STATIC_DIR=/app/dist`,
   `UPLOADS_DIR=/app/storage/uploads`, `RAILWAY_RUN_UID=0`, and a **fresh**
   `INSTATIC_SECRET_KEY` (`randomBytes(32).toString('base64')` — never reuse another client's)
6. `serviceInstanceUpdate` `{healthcheckPath: "/health"}`, then `serviceInstanceDeploy`

A new instance is provisioned but **not set up** — `users`, `site` and `sessions` are empty and
`GET /admin/api/cms/setup/status` answers `needsSetup: true`. `POST /admin/api/cms/setup`
(`{siteName, email, password, displayName}`, password ≥ 12 chars) is a one-shot bootstrap that
409s afterwards, so it is safe to leave public. Then add the `[<client>]` section to
`~/.webzite/.env` and re-run `node scripts/env-sync.mjs` in the worktree.

> [!IMPORTANT]
> **The business name has to be decided BEFORE step 1, because it is baked into the URL** and the
> URL is what goes into `seo.json` as the origin, into every canonical and `og:url`, and into the
> link the team reviews from. Here that name is *Stone Med Spa*, from Asana and from every string
> in the build — but the live Instagram trades as *Westlake Medical Aesthetics* and the client has
> not confirmed which is the trading name. If they pick the second, the project, the service and
> the domain are all renamed, `PUBLIC_ORIGIN` moves with them, and `seo.json` is rebuilt.

## Execution Steps

```bash
export RAILWAY_LINK_DIR=/path/to/a/dir/linked/to/the/project
                               # railway link -p ad4db12e-eb77-42b8-9021-4e84083fc99d \
                               #              -s "Stone Med Spa" -e production
                               # Link by project ID, never by the name "Stone": there are THREE
                               # Stone projects. ship.sh runs check-link.mjs first and refuses a
                               # link dir that does not serve INSTATIC_BASE_URL

node install-fonts.mjs --apply  # 0. ONCE per instance: the two typefaces into Instatic's
                               #    own library. See trap 16
node upload-media.mjs           # 1. images -> media library, writes .tmp/media-map.json
node set-alt.mjs --apply        # 1b. alt text -> the media library, which is the ONLY place
                               #    Instatic reads it from. Skip this and every image on the
                               #    published site has alt="". See trap 28
node build-import-input.mjs     # 2. assemble css + the page body, rewriting srcs, links AND
                               #    css url(), excising @font-face. See traps 14 and 16
bash ship.sh                    # 3. ship to the container, run Instatic's own converters, retrieve
node push-site.mjs              # 4. dry run
node push-site.mjs --apply --force   # write shell + pages + code assets in ONE atomic PUT
                               #    --force is REQUIRED on any re-import: see trap 11
node -e "import('.../insta-api.mjs').then(m=>m.publish())"   # 5. publish
node verify-live.mjs            # 6. GATE — crawls every route, link and asset
node compare-live.mjs           # 7. GATE — diffs the published pages against the
                               #    local build: structure, computed style, geometry,
                               #    text and runtime state. See traps 19 and 20
node css-parity.mjs             # 7b. GATE — did every declaration the build wrote reach
                               #    the published CSS at all? Asks directly, in seconds.
                               #    See trap 34
node visual-diff.mjs            # 8. GATE — subtracts the two renders, pixel for pixel,
node visual-diff.mjs 390        #    at both widths. No pairing, no property list, no
                               #    suppressions. See traps 32 and 33
```

`verify-live.mjs` is not optional. Every failure on this build reported success somewhere first.

**Neither is `compare-live.mjs`, and it is the stronger of the two.** `verify-live.mjs` asks whether
the routes and assets resolve; `compare-live.mjs` asks whether the page still LOOKS like the build.
Two defects shipped through a clean `verify-live.mjs` run and were caught by the comparison: a
`width` the converter dropped, and a background colour that changed because the cascade was rebuilt.

### The link guard, and the three ways the Railway target gets crossed

`ship.sh` runs `check-link.mjs` as step 0 and refuses to ship if it fails. The invariant it
enforces: **the linked Railway project and environment must actually serve `INSTATIC_BASE_URL`** —
the same host `insta-api.mjs` resolves `BASE` from, so ship.sh and push-site.mjs cannot end up
pointing at two different sites. It reads that host per-worktree, so it needs no per-client table
here and stays correct when this toolkit is copied to the next client, which is the failure mode it
exists for.

It was written after the med spa worktree was found carrying this directive's own
`railway link -p "Stone Surgical Arts"` line, four lines above a script that would have shipped the
med spa's payload into the Surgical Arts container and run the importer there.

Three separate mechanisms can point `railway` at the wrong instance. Only the first is obvious:

1. **`$RAILWAY_LINK_DIR` copied from a sibling worktree.** `ship.sh` has no other source of truth —
   every `railway ssh` runs `cd "$RAILWAY_LINK_DIR"`. This is what the guard checks.
2. **`RAILWAY_PROJECT_ID` in the environment outranks the link dir entirely.** Standing in a
   directory linked to Stone Surgical Arts with the med spa's value exported, `railway status`
   reports *Stone Med Spa*. It is in the worktree `.env`, so `set -a; . .env` in the shell you run
   `ship.sh` from is enough to do it. The guard names the variable when this happens.
3. **`RAILWAY_TOKEN` in the worktree `.env` is stale and overrides the CLI's own stored auth.** Any
   script that loads `.env` and then shells out to `railway` dies with `Invalid RAILWAY_TOKEN`, from
   a CLI that works by hand a second later. `check-link.mjs` drops the RAILWAY_* values it injected
   before spawning `railway`, so it observes the environment `ship.sh` will really have.

Link by **project ID, never by the name "Stone"** — there are three Stone projects.

## Why the conversion runs on the container

Same reason as [`convert-css.md`](../../../dr-nahlah/workflows/15-instatic-api-sync/convert-css.md):
it uses **Instatic's own** `cssToStyleRules`, `importHtml` and `importLinking`, which live in
`/app/src` on the Railway container along with bun, happy-dom and the tsconfig path aliases.
A reimplementation would drift from what the editor expects and the drift would only surface weeks
later as a subtly wrong Styles panel.

`ship.sh` chunks everything across the boundary at 6 KB because `railway ssh` takes the payload on
the command line and fails silently past ~10 KB.

**Order matters inside `import-run.ts`:** merge the converted CSS into the registry *before*
linking class names on nodes. Reversed, every class auto-creates as a bare style-less class, the
merge then skips it as already-present, and the site publishes with a complete class registry and
no styling at all.

## The traps

Ten of them, all found the hard way on 2026-08-31. Every one of these answered 200, or printed
"ok", while doing the wrong thing.

### 1. Custom properties do not survive the registry conversion

happy-dom's `CSSStyleDeclaration` does not enumerate `--*` declarations, so `cssToStyleRules` turns
every `:root { --ivory: …; --space-large: … }` block into an **empty rule**, with no warning. The
`var()` usages all survive on the rules that consume them, so the conversion looks clean and the
published stylesheet is full of references to properties that no longer exist anywhere.

On a token-driven design system that is not a missing colour — it is the entire layout. The first
styled publish rendered as centred unstyled text with correct fonts, which reads like a half-loaded
stylesheet rather than a token failure.

**Fix:** ship the token primitives as a **code asset** (`type: 'style'`), served verbatim as
`userStyles-*.css` and never parsed by happy-dom. Everything built on top of them stays in the
registry where the Styles panel can reach it. `push-site.mjs` assembles `src/styles/tokens.css`
from `00-fluid-root.css` + `01-tokens.css` plus the one stray `--pos` in `35-gallery.css`.

### 2. The publish-time tree shake purges runtime classes *and their neighbours*

Documented in [15-instatic-api-sync](../../../dr-nahlah/workflows/15-instatic-api-sync/15-instatic-api-sync.md),
and it bit here exactly as written. `is-solid`, `is-open`, `is-active`, `is-revealed` and `js` are
added by `site.js` at runtime and appear in no static markup, so each is an unused class-kind rule.
That drops the rule itself *and every ambient rule whose selector mentions it* — six rules of the
form `.navbar_component:not(.is-solid):not(.is-static) .navbar_link` disappeared with `is-solid`,
and the navbar published in the wrong colour over the hero photograph.

**Fix:** demote every class-kind rule that no node references to `kind: 'ambient'`. Done
generically in `push-site.mjs` — 72 rules on this site — because a class the markup does not carry
is runtime-or-dead either way. Selectors are already complete, so nothing else changes.

### 3. `PATCH /data/rows/:id` replaces `cells` wholesale

```ts
const rawCells = body.cells ?? currentRow.cells      // server/handlers/cms/data/rows.ts
const slug = slugForTable(table, cells)
```

Sending `{cells: {seoTitle, seoDescription}}` **deletes title, slug and body** and derives an empty
slug. It answers 200. All seven pages saved correctly and were emptied a second later; the site
then published as seven blank pages with a working stylesheet.

**Fix:** read the row, merge, send the whole `cells` object, then read back and assert the body
survived. `push-site.mjs` does all three.

### 4. Internal links must be rewritten from filenames to slugs

The static build linked `treatments.html#face` because it is opened from disk. Instatic serves
`/treatments` and 404s `/treatments.html`. Unrewritten, **every** internal link on the site was
broken — nav, drawer, footer ribbon, category cards, every CTA — while each page in isolation looked
perfect. `index.html` maps to `/`, not `/index`.

**Since 2026-09-01 there is nothing left for this rule to rewrite**: the home page is the only page,
and every link on it is an in-page `#contact` anchor, a `tel:` or an off-site URL. The rewrite stays
because it is correct and because the moment a second page returns it is load-bearing again — and
because a link rewrite that quietly does nothing is much easier to leave working than to rediscover
the need for.

### 5. AVIF cannot be uploaded to the media library

Instatic sniffs MIME from magic bytes and never trusts the declared type — correct, but its
ISO-BMFF branch matches `ftyp` alone without reading the brand that follows. AVIF begins
`....ftypavif`, so both `.avif` assets stored as **video/mp4**, with null dimensions and zero
responsive variants. They upload "successfully" and then cannot render.

**Fix:** `upload-media.mjs` converts AVIF to WebP before upload and keys the media map on the
original filename, so the HTML rewrite still resolves. The static build keeps its AVIFs. **Report
upstream**; until it is fixed, never upload AVIF here.

### 6. `<title>` comes from a site-level setting, and per-page SEO cells are not rendered

```ts
pageTitle: escapeHtml(settings.metaTitle ?? page.title ?? site.name)   // publisher/render.ts
```

`settings.metaTitle` wins on **every** page — setting it gave all seven the same title. The
`seoTitle` / `seoDescription` cells exist on the pages table and are populated by `push-site.mjs`,
but `buildDocumentMetaTags` never reads them.

**Fix today:** leave `metaTitle` unset (and *strip* it — a spread of `site.settings` carries a
previously-saved value forward) and carry the SEO string as `page.title`. The cost is a long name
in the admin page list.

**Still open:** `meta description` is site-level too, so all seven pages share one. The per-page
values are stored and ready the moment the publisher learns to read them.

### 7. `importHtml` needs the module registry populated

`walkAndMap` calls `registry.getOrThrow(moduleId)` per element. Outside app boot nothing populates
the singleton, so the first anchor throws `Module "base.link" is not registered`. Import
`./src/modules/base/index.ts` for its side effects first.

### 8. `replace` mode derives its own deletions

`deletedPageIds` must be **empty** or the save 400s. Any stored row absent from `changedPages` is
removed server-side. Reuse existing row ids by slug so a re-run updates pages rather than
replacing the rows.

### 9. `insta-api.mjs` read `.env` too late

`export const BASE = process.env.INSTATIC_BASE_URL || 'https://encorercm.com'` sat **above**
`loadEnv()`, so `INSTATIC_BASE_URL` from `.env` was always ignored. Invisible while the only
instance *was* the default; the first run against Stone posted the login to `encorercm.com` and got
Railway's "Application not found". Fixed in the shared client, along with the session cache, which
was one file for all hosts and replayed one client's cookie at another.

### 10. Scroll reveals need a bootstrap the importer strips

The static build sets `class="js"` on `<html>` from an inline `<head>` script, and `39-motion.css`
hides every `[data-reveal]` behind it. Instatic has no custom-head field and `importHtml` strips
inline scripts. `push-site.mjs` prepends the one line to `site.js` instead — deliberately there and
not on the body node, so a script that fails to load leaves the content **visible**, which is the
failure the design chose. The cost is a possible flash on first paint.

### 11. Re-importing over a live site needs `--force`, and that is not a rubber stamp

`push-site.mjs` refuses when any stored page already carries authored content (more than one node),
because `replace` mode would delete it. On the FIRST import that guard is what you want. On every
import after it, the guard always fires, because the site is now authored, and `--force` is the
only way past.

What `--force` actually costs you: **any edit made in the Instatic admin since the last import is
overwritten.** The static build in this repository is the source of truth, and the admin is not.
Before re-importing, confirm nobody has been editing in the CMS, or their work is gone.

What it does NOT cost you, because of the id reuse in trap 8: pages keep their row ids across a
re-import, so slugs, and anything holding a reference to a page id, survive. A page whose slug is
absent from `changedPages` is deleted server-side, which is how `treatment-detail` was retired when
its content moved to `myellevate-neck-lift`. Removing a page from the build IS how you delete it;
there is no separate step.

**Media is additive and is never pruned.** `upload-media.mjs` skips what is already in the library
by filename and uploads the rest. Assets dropped from the build (`gen-consult-pair.webp`,
`gen-reception.webp`) stay in the media library as orphans. Harmless, but they accumulate, and
nothing removes them for you.

### 12. `autoCreatedClasses` is not a styling alarm on its own

The conversion report counts classes it had to create because the converted CSS had no rule for
them. It reads like a warning and mostly is not: this build has **53 style-less classes by design**
(`section_hero`, `section_process`, `hide-tablet`, `is-reverse` and friends) that appear in the
source CSS only inside compound selectors, never with declarations of their own. They come back as
bare registry entries every run.

**What actually matters is whether YOUR classes converted with declarations.** Check that directly
rather than trusting the counter:

```bash
node -e "
const o=require('./.tmp/import-out.json');
for (const id of Object.keys(o.styleRules)) {
  const r = o.styleRules[id];
  if (String(r.selector||'').includes('YOUR_CLASS'))
    console.log(r.selector, Object.keys(r.styles||{}).length + ' declarations');
}"
```

Zero declarations on a class you wrote CSS for is the real failure, and it means the rule did not
survive `cssToStyleRules`.

**And read the whole report, not its tail.** `bash ship.sh | tail -40` shows the last two or three
pages of an eighteen-page report, which is how "0 auto-created classes" got recorded for this build
when eleven pages were 0 and seven were not. Redirect to a file and grep it.

### 13. `:root` blocks outside the two token files are dropped, and the failure is not uniform

Trap 1 says custom properties do not survive the registry conversion, and `push-site.mjs` ships the
token primitives as a code asset to get round it. Its list was `00-fluid-root.css` and
`01-tokens.css`, which **stopped being the whole token layer on 2026-08-31**, when `50-journey.css`
opened a `:root` of its own for `--size-display`, `--size-display-sm`, `--size-numeral`,
`--size-h3-j`, `--gutter`, `--section`, `--section-sm` and `--pad-panel`. `51-dossier.css` added
`--spec-w` and `--spec-top` on 2026-09-01.

Those eleven went into the registry and happy-dom dropped them.

**The reason it survived a publish is that the failure is not uniform.** `--size-h2` is in
`01-tokens.css`, so every section heading was the right size; `--size-display` is not, so the `<h1>`
rendered at inherited body size. `--gutter` is not, so `padding: var(--section) var(--gutter)` was an
invalid declaration and the whole page sat flush against x=0 while every other spacing value looked
correct. A half-tokenised page reads as a layout bug rather than as a token bug, and the first
instinct is to go looking at the layout.

`push-site.mjs` now **harvests** every `:root` block from every other stylesheet, top level and
inside `@media`, and appends them to the code asset. A new stylesheet that declares a token is
covered the day it is written rather than the day somebody remembers a list. It also asserts a
`MUST` list of tokens the layout cannot survive without and refuses to build if one is missing — the
first harvester keyed on the character before `:root`, found nothing at all in a file whose `:root`
follows a comment, and that assertion is what caught it.

### 14. `url()` in the CSS is not rewritten by the src rewriter, and a 404 texture is invisible

`build-import-input.mjs` rewrites `src="assets/x.webp"` in the markup. It did not touch
`url("tex-carrara.webp")` in the CSS, which is how `.stone-panel` and `.stone-band` reference their
marble. In the static build that resolves because `site.css` is served FROM `assets/`. Instatic
publishes the registry at `/_instatic/css/`, so the published pages asked for
`/_instatic/css/tex-carrara.webp` and got a 404 on every one.

> [!IMPORTANT]
> **A missing background image is not a visible error.** `.stone-panel` also sets
> `background-color: var(--ivory)` and `.stone-band` sets `#1c1b19`, so the panels rendered as flat
> panels that look deliberate. Nothing warned. `verify-live.mjs` was clean, because it checks the
> assets the MARKUP references and these are only in CSS. It took reading a browser network log.

Rewritten now, against the same media map, with a check that fails the build on any remaining
relative `url()`. The check runs on a comment-stripped copy: `38-cta.css` records the PREVIOUS
incident of this same bug in a comment, quoting the broken path verbatim.

### 15. `base.button` has a label, not children

`importHtml` maps `<button>` onto `base.button`, whose content is a `label` STRING. Anything inside
the button is flattened into it and the elements are gone.

Two things were bitten:

- **`.navbar_burger`** draws its three bars with three `<span>` children. It arrives with
  `label: ""` and nothing to style, so **the published mobile menu button has been an empty
  bordered square on every Instatic publish of this site.** Nothing failed; the drawer still opened
  if you hit the invisible target.
- **`.layers_tab`** on the neck lift page carried an eyebrow span, and came back as `"DeepestMuscle"`
  with the span gone.

The tab was fixed in the source: one string per button, and the depth wording moved onto the
indicator beside them, which is where the order is actually being drawn. The burger is repaired in
CSS with **`.navbar_burger:empty`**, which matches only where the children have been taken away, so
the static build keeps its spans and the imported one draws the same three bars from a border, a
pseudo-element and a box-shadow. `currentColor` is set on the button, because the authored rule
colours `.navbar_burger span` and there are no spans.

**Check `import-out.json` for `base.button` labels after any import that adds a button.**
`node -e` over `.tmp/import-out.json` printing every `props.label` takes ten seconds.

### 16. Fonts have to go into Instatic's own library

`css/03-fonts.css` declares seven self-hosted cuts with `url("fonts/<file>.woff2")`, relative to
`assets/`. There is no `assets/` on Instatic and nowhere to make one, so
`build-import-input.mjs` refuses the payload rather than shipping seven dead `url()`s — and a dead
`@font-face` is invisible in the same way a dead texture is, because the family name still resolves
and the browser falls back to Georgia.

`install-fonts.mjs` (this folder, Stone's own families) posts to
`/admin/api/cms/fonts/install`, which downloads the woff2 files server-side, serves them from
`/uploads/fonts/` and records a FontEntry the publisher emits `@font-face` from.
`build-import-input.mjs` excises the `03-fonts.css` block from the CSS payload and asserts that no
`@font-face` survived. The `<link rel="preload">` tags are stripped for the same reason.

> `saveShell(shell, seq)` — **the seq is not optional.** Without it the API answers
> `400 Invalid request body`, which reads like a malformed payload and is a missing
> optimistic-concurrency token.

### 17. There is one script asset, so the vendor split does not survive

The static build emits GSAP as a separate `vendor.js` that only pages with `motion: true` request,
so the neck lift page never downloads 122KB it has no use for. Instatic has one script asset for the
whole site. `push-site.mjs` concatenates the vendor bundle **ahead of** `site.js` into that asset and
both published pages carry it.

Order is load-bearing and fails quietly if reversed: `js/10-journey.js` reads `window.gsap` at call
time and guards on it, so a reversed order does not throw — it produces a home page with no pinned
chapter and no split headlines, which looks like a design decision.

### 18. A full-page screenshot lies about `background-attachment: fixed`

Not an Instatic trap, but it cost a false alarm during this verification and belongs where the next
person will look. `.stone-band` uses `background-attachment: fixed`. In a `fullPage: true`
screenshot Chrome paints that background only where the viewport happened to be, so the dark
chapter came back as white text on ivory and looked like a catastrophic theme failure on the live
site. It was correct in the browser.

**Verify a fixed-attachment section with a VIEWPORT screenshot**, scrolled to it. `slices.mjs` in
`site-src/` does exactly that and is the right tool for looking at a published page as well as a
local one.

### 19. A colon inside a comment defeats the lossy-declaration encoder

`conv-encode.ts` exists because happy-dom drops declarations whose values it
cannot evaluate. It probes each one and, when the engine would drop it, rewrites
it to `--instatic-sub-<prop>` so Instatic's own decoder restores it at publish
time. It works, and it is why `clamp()` and `min()` are all over the published
stylesheet.

`encodeChunk` found the property name with `chunk.indexOf(':')`. A *chunk* is
everything between two top-level `;`, so it carries any comment written above
the declaration — and **a colon inside that comment is found first**. The
comment is then read as the property name, fails `PLAIN_PROPERTY_RE`, and the
chunk is returned unencoded. happy-dom drops the declaration for real and
nothing warns.

`.path_panel` on the home page:

```css
flex: 0 0 auto;
/* 40rem, not 30rem. ... the pinned chapter travelled 144px: the
   reader could not tell it had moved. */
width: min(40rem, 86vw);
```

`144px:` is the colon. **The published home page's three process panels were
1045px wide inside a 390px phone** instead of 335px, so the rail scrolled about
three screens per panel.

**Three conditions had to line up**, which is why exactly one declaration on a
130KB stylesheet was affected and why it survived four publishes:

1. a colon in the comment attached to the declaration,
2. a value the CSS engine rejects (`width: min()` is rejected; `min-height:
   clamp()` is not), and
3. no `var()` in that value — `var()` puts a declaration under Instatic's OWN
   substitution protection, which is why `.surgeon_panel`'s
   `padding-right: calc(var(--pad-panel) + ...)` came through untouched with the
   same colon-in-comment problem.

Fixed in `conv-encode.ts` by stripping comments before locating the colon, and
inserting the marker where the property actually begins so the comment survives.
**The same patch is applied to the Nahlah copy**, which was byte-identical.

> A `min()`/`clamp()` value with no `var()` in it is the risky shape. There is no
> reason to avoid writing one; `compare-live.mjs` is the check.

### 20. The cascade is rebuilt, so equal-specificity rules can swap places

`.stone-band` sets `background-color: #1c1b19`. `[data-theme="dark"]` in
`01-tokens.css` sets `background-color: var(--bg)`, which is `--charcoal`. Both
are specificity (0,1,0), so locally the later file wins and the band is
`#1c1b19`. Instatic rebuilds the cascade out of the style registry and the
attribute rule won instead: the published band was `#272727`.

Two dark greys under a marble texture, invisible by eye, found by
`compare-live.mjs` on both pages.

**Source order is not a contract across the import.** Where two rules of equal
specificity disagree and the outcome matters, make the winner win on
specificity: `.stone-band.stone-band` is (0,2,0) and settles it in any order.
Doubling a class is not a hack here, it is the cheapest way to say "this one, on
purpose".

### 21. `clamp()`, `min()` and `max()` without a `var()` are dropped, and the encoder cannot save them

Trap 19 said the encoder rewrites a rejected value to `--instatic-sub-<prop>` and Instatic's
decoder restores it. **That is not what happens through the registry.** happy-dom drops
`--custom-property` declarations (trap 1), so an encoded declaration is dropped exactly as the
original was; `import-out.json` carried zero `instatic-sub` strings after a run that reported 23
encoded. And the probe that decides what to encode disagrees with the converter: a
`CSSStyleSheet` keeps `font-size: clamp(6rem, 21vw, 22rem)` (so the probe says "survives") and
`cssToStyleRules` drops it. `min(40rem, 86vw)` survived the same run. Which math functions live
is not predictable.

On the twelve-page publish that was the ghost words at 16px, the catalogue's sticky photograph
0px tall, the doctor's name at 32px, the hub's category words at 16px, the surgeon frame 0px,
the doctor page's team band gone: 168 findings from one cause.

**Fix:** `push-site.mjs` `harvestLossy()`. Every declaration whose value carries a bare math
function goes into the **code asset** with the tokens, served verbatim and last in the cascade.
And not the math declaration alone: **the whole cascade of that (selector, property) pair**,
every declaration of it in every `@media`, in source order, with grouped selectors split into
their parts. The first version emitted only the math values, and an unconditional
`.catalogue_media { height: min(…) }` at the end of the cascade beat the registry's own
`@media (max-width: 991px) { height: auto }`; the second version missed
`.catx_band, .catx_band.is-reverse { min-height: 0 }` because the group's text is not
`.catx_band`. 49 declarations in the asset now. `conv-encode.ts` is back to what it was.

### 22. `<input type="range">` publishes as `type="text"`, with `step`, `aria-label` and `data-*` gone

Instatic's `base.input` renders one input type. The membership calculator's slider published as
a 2px text field and its `data-calc-range` hook was gone, so the calculator was inert. Divs keep
their `data-*` attributes (`data-monthly`, `data-calc-banked` all arrived); inputs do not.

**Fix:** the markup ships a `<div class="calc_slot" data-calc-slot …>` and `12-elevate.js`
creates the range input inside it at runtime on both sides. The same rule applies to anything
`<input>` needs beyond a text field.

### 23. Whitespace between inline elements is collapsed to nothing

Two `<a>`s separated by `&nbsp;&nbsp;` published touching. The text diff caught it. Lay inline
siblings out with a flex container and `gap`, never with whitespace.

### 24. A grid item with `justify-self: end` and no width shrinks to the image variant

Locally `<img width="1160">` makes a frame's max-content 1160px and `max-width: 28rem` caps it.
Live, Instatic's image module writes the smallest responsive variant's width on the `<img>`
and the frame published at 300px. **Give every photographic frame an explicit `width: 100%`
before its `max-width`.** Instatic also styles inputs by attribute selector, which outranks a
single class: `.calc_range.calc_range` restates every property the framework touches.

### 25. The diff tool skips `svg` and `path`

They carry no class, Instatic strips the SVG out of any `<button>` (trap 15), and the two
missing carousel arrows shifted every later icon's index so the diff reported thirty colour and
alignment findings that were the same icons one place apart. `compare-live.mjs` skips them; the
icons' boxes are covered by their parents.

### 26. The token asset must carry CUSTOM PROPERTIES ONLY — an ordinary declaration in it outranks the registry

Found 2026-09-04 by `compare-live.mjs`, on all eleven pages at once: the footer published as
`#272727` where the build is `#1e1e1e`, and one card on `/financing` published green where the
build is white. Twenty-four of the run's thirty-six findings were this.

`push-site.mjs` used to paste `00-fluid-root.css` and `01-tokens.css` into the token code asset
**verbatim**, which was fine while those files declared nothing but custom properties. This build's
`01-tokens.css` also carries `background-color` and `color` inside its three `[data-theme="…"]`
blocks — a section flips its whole palette by carrying an attribute — and those two declarations
rode along.

The token asset is the **last** stylesheet in the cascade
(`reset → framework → style → userStyles`). So a re-emitted `[data-theme="dark"] {background-color:
var(--bg)}` lands after the registry's `.footer_component {background-color: var(--bg-alt)}`, and
the two have **equal specificity** — an attribute selector and a class are both 0-1-0. Locally
`01-tokens.css` is read before `22-footer.css` and the footer wins; published, the order is
reversed and the theme wins. Nothing errors, nothing warns, and the site is simply the wrong
colour in a way that reads as a design decision.

**Fix:** `harvestRoots()` in `push-site.mjs` now filters every block it emits down to its
custom-property declarations, and the token files go through it rather than in verbatim. The
ordinary declarations are not lost — they are in the registry already, which is where they belong
and where the Styles panel can edit them.

### 27. A custom property is not always declared on `:root`

Trap 13 is about `:root` blocks in stylesheets other than the token files. This is the same failure
one step further out: `--marquee-duration` on `.marquee_component` (`40-motion.css`) and
`--cad-label` on `.cadence_grid` (`52-cadence.css`, and again at a breakpoint in `90-wide.css`)
are declared on **classes**, and trap 1 does not care where a custom property was written.

The sibling hit this once, as `--pos` on `.compare_component`, and handled it by appending that one
rule to the token asset by hand. Hand-handling does not scale and does not warn — this build would
have published a marquee that does not scroll and a year grid whose labels size from nothing.

**Fix:** harvest by declaration rather than by selector. Any rule declaring a custom property
contributes its selector and only its custom-property declarations. The `MUST` assertion under it
is now **derived** from the sources too — every `--x:` written anywhere in `site-src/css/` must
appear in the asset — because the sibling's hand-written list of eight token names had already
needed extending twice, and six of those eight names do not exist on this site at all, so the first
run here refused a payload that was perfectly fine.

### 28. `importHtml` DISCARDS `alt`, and the site publishes with `alt=""` on every image

The worst of this build's four, because it is invisible to everyone who can see. The local build
carries written alt text on every photograph — `audit.mjs` fails a page without it — and the first
published home page had fifteen images and fifteen `alt=""`.

It is not a bug. It is a design decision, and the platform says so out loud:

```
ImageEditor.tsx:10             alt text comes from the library asset
                               (single source of truth — edit via the Media viewer)
modules/base/image/index.ts:187  const alt = escapeHtml(media?.altText?.trim() ?? '')
```

A `base.image` node has no alt at all: `props` is `{src, loading, fetchPriority, decoding,
htmlAttributes}` and the importer does not even park the attribute in `htmlAttributes`. **No amount
of care in the markup can survive the import.**

**Fix:** `set-alt.mjs`, a new step 1b. It harvests every `<img alt="…">` from `final-site/`, keys it
by filename through `media-map.json`, and `PATCH`es `altText` onto the media asset
(`PATCH /admin/api/cms/media/:id`). Idempotent, and it needs no re-import — alt lives on the asset,
so a re-publish picks it up.

The consequence to understand is that **alt is per ASSET here, not per usage.** Eight photographs
on this site are used twice with different words. `set-alt.mjs` takes the longest and prints every
conflict; where the two usages genuinely wanted different alt text, the answer is two assets, not a
cleverer script.

### 29. `&nbsp;` is not spacing that survives — this is trap 23, arriving from the other direction

Trap 23 is about whitespace *between* inline elements. This is entity whitespace *inside* one:
`<a>Treatments</a>&nbsp; / &nbsp;Injectables` published as `<a>Treatments</a> / Injectables`, and
the breadcrumb came out 17px narrower than the build. `verify-live.mjs` was happy — the text is
still there and the link still resolves — and only the geometry comparison saw it.

**Any typographic spacing that must survive the import goes in CSS.** The separator is now a
`<span class="cover_crumb-sep">` with a margin.

### 30. The `container-large` 8px auto-margin finding is comparison NOISE, and its direction flips

The residual on this publish, and worth writing down so nobody spends a morning on it twice.
`compare-live.mjs` reports a `div.container-large` whose `margin: 0 auto` reads `8px` on one side
and `0px` on the other — on a different page each run, and with a different number of findings each
run (2, then 6, then 4 on one unchanged publish).

**The proof that it is not a publish difference is that it changes sides.** Probing the two pages
directly showed all ten containers identical; on the very next run the same two containers read
`0px` locally and `8px` live, the exact opposite of what the gate had just reported.

The mechanism is the scroll pass `capture()` performs before it measures. The pinned sections'
spacers exist or do not exist depending on where GSAP is in its own setup, and `.padding-global`'s
`5%` resolves against whatever the containing block is at that instant — 72px against 1440, 80px
against 1600 — which moves an auto margin by exactly 8px. `compare-live.mjs` now waits for the
document's own dimensions to hold still before measuring, which did **not** fix it.

Do **not** add it to the `IGNORE` list. An 8px margin on this class could one day be real, and a
suppressed finding is worse than a noisy one.

### 31. The published `<head>` is FOUR TAGS. No canonical, no Open Graph, no JSON-LD — and the site-level description was the sibling's

Read `buildDocumentMetaTags` in `src/core/publisher/render.ts` and this stops being a surprise. The
publisher emits exactly:

```
<title>            settings.metaTitle ?? page.title ?? site.name
<meta description> override.description || settings.metaDescription     ← SITE-level
<link rel=icon>    settings.faviconUrl                                   ← SITE-level, unset here
lang=""            settings.language
```

and nothing else. Everything `build-site.mjs` writes into `partials/head.html` from `seo.json` —
`<link rel="canonical">`, the eight `og:` and `twitter:` tags, the `MedicalBusiness` JSON-LD block —
**is not on the published site.** There is no custom-head field and `importHtml` does not carry head
tags across; this is the same shape as the script warning at the top of this file. The local build
proves it works, and it is simply absent.

Two consequences worth separating:

- **For a review link, it does not matter.** Nobody reviewing eleven pages notices a missing
  `og:image`, and `seo.json`'s origin being a real resolvable host is enough.
- **For a launch it matters a great deal**, and it is on the "not done" list below rather than in
  the build's `seo.json`, because no amount of editing `seo.json` will put those tags on the page.
  The route is a runtime module in `site-src/js/` that injects them — the same road
  `js/90-bugherd.js` takes — or an upstream change.

**And the description was wrong in a way none of the gates could see.** `push-site.mjs` set
`settings.metaDescription` to a HARDCODED string, so when this workflow was copied from the sibling
every one of the med spa's eleven pages published *"Boutique facial and cosmetic surgery in
Westlake, Texas. Dr. Mona Stone plans and performs every case herself"* — the surgical practice's
positioning, on the non-surgical site, as the description Google would show. `verify-live.mjs` does
not look at descriptions and `compare-live.mjs` compares rendered pages, not `<head>`. It was found
by reading the published `<head>` by hand, which is now worth doing once per new instance.

It is derived from `seo.json`'s home-page description now, and throws rather than falling back, so a
third client copying this file cannot inherit the second one's words.

### 32. A MULTI-LAYER `background` LOSES EVERY LAYER BUT THE LAST — and that layer is the scrim

The worst thing this build has published, and neither existing gate could see it.

`.cover_media::after` is the dark wash that sits between an interior page's
photograph and its white type. It is written as two stacked gradients:

```css
background:
  linear-gradient(180deg, rgba(39,39,39,.55) 0%, …, rgba(39,39,39,.82) 100%),   /* the scrim */
  linear-gradient(90deg,  rgba(39,39,39,.4)  0%, rgba(39,39,39,0) 60%);
```

happy-dom expands the shorthand into longhands and keeps **one** layer. Published:

```css
background-image: linear-gradient(90deg, rgba(39,39,39,0.4) 0%, rgba(39,39,39,0) 60%);
```

The 180deg layer — the one that darkens the top and the foot so a title can be read over a
photograph — is gone. Every interior header published as the raw photograph at full brightness with
white text lying on top of it. On `/thank-you`, whose photograph is a bright green neon sign, the
heading was barely legible and the secondary button had all but vanished.

There are three of these on the site and **all three are scrims**: the home hero, the interior
cover, and the `/thank-you` override.

**Why nothing caught it.** `verify-live.mjs` checks routes and assets. `compare-live.mjs` compares
computed properties on elements it can pair by class — and `::after` **is a pseudo-element**: it has
no node, it is not in `document.querySelectorAll('body *')`, so no pseudo-element on this site has
ever been compared. Two more blind spots in the same place: an element with **no class at all** is
skipped (`if (!cls) continue`), which is every bare `<img>`; and `filter`, `backdrop-filter`,
`mix-blend-mode`, `clip-path` and the inset properties are not in its property list.

**Fix:** `harvestLossy()` now treats a multi-layer `background` / `background-image` / `mask` the
same way it treats a bare `clamp()` — the whole (selector, property) cascade goes verbatim into the
token code asset, which is served last. Same road, same reasoning, three more declarations.

**And a new gate, `visual-diff.mjs`, because a property list will never be complete.** It subtracts
the two full-page renders and reports what differs, with no pairing and no suppressions. It found
this in its first run: `/thank-you` was 56% different.

### 33. `fullPage: true` IS NOT WHAT A VISITOR SEES, and it invents missing photographs

Chrome takes a full-page screenshot by **resizing the viewport to the whole document** — 8,600px
tall on the home page — and re-rendering. Every scroll-driven effect then evaluates against a
viewport no human has, and every `loading="lazy"` image is asked to decide whether it is in view
inside that giant frame.

Two photographs "went missing" on the published site and neither was missing: the home page's
`data-wipe` frame in the place section, and Dr. Stone's portrait on `/about` at 390. Both are
present and pixel-identical at a real 1440x900 or 390x900. Both cost a round of investigation, and
both looked utterly convincing in a diff — a solid block where a picture should be.

`visual-diff.mjs` therefore scrolls a real viewport down the page and stitches the tiles, hiding
`position: fixed` elements after the first tile (identically on both sides) so the navbar does not
repeat down the seam. `shot.mjs` still uses `fullPage` and that is fine for a static reference
image; it is **not** fine as the input to a comparison.

The related half of this: **wait for the images before capturing.** Poll `complete && naturalWidth`,
bounded — do not `await img.decode()` on a lazy image the browser has not chosen to fetch, because
that promise never settles and the run dies on the CDP protocol timeout instead.

### 34. Some properties are dropped outright, and `scroll-padding-top` is the one that hurts

Three lossy conversions are now documented — custom properties (trap 1), bare math values
(trap 21), multi-layer backgrounds (trap 32). This is the fourth shape: **a property the parser
simply does not know, discarded with no trace.**

```css
/* 02-base.css, as written */          /* as published */
html {                                 html {
  -webkit-text-size-adjust: 100%;        font-size: calc(…);
  scroll-behavior: smooth;             }
  scroll-padding-top: 7rem;
}
```

`scroll-padding-top` is not cosmetic here. The navbar is **fixed** and about 5.5rem tall, so
without it every in-page anchor on the published site scrolls its target underneath the navbar.
`menu-test.mjs` asserts the anchor lands at `top=112` — **against the local build**, so it passes
while the published site does the wrong thing. That is the recurring shape of everything in this
file: the gate that would have caught it is pointed at the wrong copy.

**Fix:** `harvestLossy()` takes a third category, `DROPPED`, alongside the math values and the
layered backgrounds. It covers `scroll-behavior`, `scroll-padding*`, `scroll-margin*`,
`overscroll-behavior*` and `text-size-adjust`.

**That list is not a guess and it is not exhaustive** — it is exactly what `css-parity.mjs`
reported missing on a real publish. Which is the point of the new gate:

### The check: `css-parity.mjs`

```bash
node css-parity.mjs      # seconds; needs only INSTATIC_BASE_URL
```

It indexes every rule in `final-site/assets/site.css` and every rule in the four published
stylesheets, pairs them by normalised selector, and asks whether each **property name** the build
declared is declared live. Values are deliberately not compared: the publisher rewrites them freely
(`0` becomes `0px`, shorthands expand, colours normalise) and a value comparator is a project of its
own, while a missing property NAME catches every failure this workflow has actually had. Shorthands
that the publisher expands are matched against their longhands.

It also lists selectors that are not published at all — that is the tree shake (trap 2), expected
for runtime-only classes, so it reports them rather than failing on them.

This is the cheapest of the three live gates and the one to reach for first after any stylesheet
change. `verify-live.mjs` asks whether the site is whole; `compare-live.mjs` asks whether it still
looks right; `visual-diff.mjs` asks the same question with no assumptions; this one asks whether
the CSS survived the trip, which is where four of this workflow's worst defects came from.

### The check: `compare-live.mjs`

```bash
node compare-live.mjs                 # both pages, 1440 and 390
node compare-live.mjs neck-lift 390   # one page, one width
node compare-live.mjs --shots         # also write viewport PNG pairs
```

Serves the local `final-site` and opens both it and the published page at the
same viewport, then reports:

- **structure** — elements present locally and missing live, keyed by tag and
  class list rather than by position, so a node the importer moved is still
  matched and one it dropped is named once;
- **style** — every property in a wide list, grouped by property with each
  affected element listed, so "eighteen elements differ on width" is legible as
  one bug rather than eighteen;
- **geometry** — bounding boxes, which catch a layout that computes the same and
  lays out differently;
- **text** — the first point of divergence in the rendered copy;
- **runtime**, scripts on — the `is-*` classes the site sets itself, the `hidden`
  attributes, the resolved tokens, and counts of every control.

Known-benign differences are declared in `BENIGN` with a reason each: Instatic's
responsive `image-set`, its `<img>` width/height and blurhash, sub-pixel
rounding, and the `.navbar_burger:empty` repair. **Resist adding to that list to
make a run quiet.** Both of the bugs above would have been caught before the
first publish by exactly this check.

## Pushing to staging (2026-09-15)

Staging is the Railway environment `staging` at `https://staging.westlaketxmedspa.com` (see the
2026-09-15 staging run). Every script here takes its target from `INSTATIC_BASE_URL`, and an
exported value wins over the `.env` one, so the whole pipeline points at staging with one export.
Client changes go to staging first and to production only once they are reviewed there.

```bash
S=<scratchpad>                              # holds doh-lookup.cjs and a staging link dir
export INSTATIC_BASE_URL=https://staging.westlaketxmedspa.com
# railway link -p ad4db12e-eb77-42b8-9021-4e84083fc99d -e staging -s "Westlake Medical Aesthetics"   (in $S/link-staging)

node -r $S/doh-lookup.cjs .tmp/snapshot-staging.mjs          # 0. site + pages -> .tmp/backup-staging-<date>/
node -r $S/doh-lookup.cjs .tmp/staging-media-map.mjs          # 1. staging's media ids, by URL (trap 36)
node -r $S/doh-lookup.cjs set-alt.mjs --map media-map.staging.json --apply
node build-import-input.mjs                                   # 2. same payload as production; URLs match
RAILWAY_LINK_DIR=$S/link-staging NODE_OPTIONS="-r $S/doh-lookup.cjs" bash ship.sh
node -r $S/doh-lookup.cjs push-site.mjs --apply --force
node -r $S/doh-lookup.cjs -e "import('../../../../process/22-instatic-api-sync/insta-api.mjs').then(m=>m.publish())"
node -r $S/doh-lookup.cjs verify-live.mjs && node -r $S/doh-lookup.cjs css-parity.mjs
node compare-live.mjs && node visual-diff.mjs && node visual-diff.mjs 390
```

`doh-lookup.cjs` is only needed while this workstation's resolver still returns NXDOMAIN for the
subdomain (memory: new-subdomain-nxdomain). Chrome-based gates use the OS resolver, so they wait
until it resolves.

### 35. The staging clone has NO FONTS — `clone-site --media` copies the media library, not `/uploads/fonts/`

Found 2026-09-15 on the first push to staging. The shell's font library (`settings.fonts`) came
across in the clone, so the published CSS still carried seven `@font-face` rules pointing at
`/uploads/fonts/…` — and every one of those files answered **404**, because `install-fonts.mjs`
writes them to the container's disk and the clone never ran it. The site rendered in fallback
faces. `verify-live` and `css-parity` were clean (the rules exist, the URLs are syntactically
fine); `compare-live` reported 142 findings, all width and wrap, and `visual-diff` 13–37%.

**Fix:** run `install-fonts.mjs --apply` once against the staging instance, the same "once per
instance" step as production. It rewrote the files and re-saved the library; findings fell from
142 to 4. **Check fonts first on any cloned instance:** `curl` one `/uploads/fonts/` URL from the
published CSS.

### 36. Staging's media ids are not production's

`clone-site` keeps every asset's **URL** and mints a new **id**. Image `src`s are unaffected
(`build-import-input.mjs` writes URLs), but `set-alt.mjs` PATCHes `/media/<id>` and missed all 73.
`.tmp/staging-media-map.mjs` rebuilds the map against staging's ids by URL into
`.tmp/media-map.staging.json`; `set-alt.mjs --map media-map.staging.json` uses it.

### 37. A 404 you probe for is cached at the edge for four hours

Checking whether a staging font existed, *before* installing it, put its 404 in Cloudflare's cache
(`cache-control: max-age=14400`, `cf-cache-status: HIT`). After the install the file served 200 with
a cache-busting query string and 404 without one. Purge the one URL: mint a one-hour token from
`CLOUDFLAREAPI` with the zone-scoped **Cache Purge** group (pick the group whose `scopes` end in
`.zone`), wait ~5 s before using it — a fresh token answered `10000 Authentication error`
immediately and worked on retry — then `DELETE` it. Better: don't probe a URL you are about to
create; check the container's disk with `railway ssh ls` instead.

### 38. The sienna accessibility widget is live-only and moves every line of text

Production gained the `sienna-accessibility` plugin after this build, and the staging clone carries
it. It writes text sizes inline at load and paints a floating button, so `visual-diff.mjs` at 390
read 11–37% on pages whose layout `compare-live` found identical. `visual-diff.mjs` now aborts
requests to `sienna-accessibility` by default (`VISUAL_WIDGET=1` keeps it). It is a client-side
plugin; do not remove it from the site to make a gate quiet.

## Output Artifacts

- `.tmp/media-map.json` — original filename → media library path, id, dimensions (73 files)
- `.tmp/media-map.staging.json` — the same, with staging's ids (trap 36)
- `.tmp/backup-staging-2026-09-15/` — staging's site and pages before the first feedback push
- `.tmp/import-input.json.gz` — the payload shipped to the container
- `.tmp/import-out.json` — 985 style rules, 11 conditions, 11 page node trees
- `.tmp/live-shots/` — full-page captures of the PUBLISHED site (reduced motion, so they show the
  static state; use a real browser for the pins and scrubs)
- `.tmp/probe-key.mjs` — looks one `compare-live.mjs` finding up on both sides, with the CSS rules
  that set the property. Keys elements exactly as `compare-live.mjs` does, so a finding's key can
  be pasted straight in. This is the tool for turning "some element differs" into "this rule does"
- `.tmp/probe-sel.mjs` — the same, addressed by an ordinary CSS selector rather than by a
  comparison key. Reaches the things `compare-live.mjs` cannot: a bare `<img>`, a pseudo-element's
  host, anything with no class
- `.tmp/viewshot.mjs` — one section, local above live, captured in a REAL viewport scrolled to it.
  The arbiter when a full-page diff and a probe disagree; see trap 33
- `.tmp/crop.mjs` — cuts a y-band out of the diff images so a band can be looked at rather than
  guessed at
- `.tmp/visual/` — the full-page renders and their diffs (gitignored: `*.png`)

## What is NOT done

- **Nav and footer are inlined into the page rather than being a Visual Component.** Eleven pages
  means editing the nav is eleven edits. This is now the strongest item on the list —
  `changedComponents` / `changedLayouts` are already in the `PUT /site-document` contract.
- **Per-page meta descriptions** — see trap 6. All eleven share the home page's.
- **Canonical, Open Graph and JSON-LD are not on the published site at all** — see trap 31. Fine
  for review, not fine for launch. The route is a runtime module in `site-src/js/` that injects
  them, the way `js/90-bugherd.js` injects its tag.
- **No favicon**, so every published page answers 404 for `/favicon.ico` and the browser tab shows
  a generic mark. This is one field — `settings.faviconUrl` in the site shell, pointing at an
  uploaded asset — and it is deliberately still empty because **this brand has no logo or identity
  yet** and a favicon invented here would be read as a proposed mark. Set it the day one exists.
  It is the only console error on the whole site.
- ~~The domain, and before it the trading name.~~ Settled: the domain is `westlaketxmedspa.com`
  (2026-09-10) and the trading name is **Westlake Medical Aesthetics** (the client's feedback,
  2026-09-15).
- **No brand identity, logo or favicon**, and no per-case photo consent — see `HANDOFF.md`.
- **The booking form still posts nowhere.**
- **The six remaining treatment dossiers.** `botox` is the built template; each of the others is a
  body file, a line in `PAGES` here and a line in `ROUTES` in `verify-live.mjs` and `PAGES` in
  `compare-live.mjs`. All three lists are written by hand on purpose — see the warning on `PAGES`.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md).
Scripts and this directive are committed; `.tmp/` artifacts are lightweight JSON and may be
committed, but `.tmp/converted/` holds images and must not be.
