# Workflow: 21 - Instatic Upload (West LA Implants)

Takes the static build in
[`04-design/.tmp/site-src/dist`](../04-design/.tmp/site-src) and puts it into the client's own
Instatic instance as an editable site — the page as a node tree, CSS as style registry rules,
photographs, films and typefaces in the media library.

> [!NOTE]
> **This file arrived as a verbatim copy of Stone Med Spa's
> [`05-instatic-upload.md`](../../../stone-med-spa/workflows/05-instatic-upload/05-instatic-upload.md),
> which was itself a copy of Stone Surgical Arts'. TRAPS 1–34 ARE THEIRS AND ARE KEPT VERBATIM** —
> that is the point of copying them, and eight of the thirty-four bit again here before anybody
> looked. Traps 35 onward are this build's own. Where a trap names a page, a class or a stylesheet
> that does not exist here, it is a sibling's: **read the mechanism, not the filename.**

## What is different about West LA Implants

Read this before the Execution Steps; five things in this toolkit diverge from the med spa's copy
and each one is a thing that failed first.

| | Stone Med Spa | **West LA Implants** |
| :--- | :--- | :--- |
| **Pages** | eleven | **ONE.** `index.html` — eight chapters in a single scrolling document. Every link on it is an in-page `#anchor`, a `tel:` or off-site, so trap 4's filename→slug rewrite has nothing to do |
| **Build layout** | `final-site/` with a flat `assets/` | `site-src/dist/` with `assets/`, `media/img/`, `media/video/` and `fonts/`. Every script here is keyed on that shape, and `media-map.json` is keyed by the **dist-relative path** (`media/img/x.jpg`) as well as by basename |
| **Fonts** | `install-fonts.mjs`, Instatic's own font library | **media uploads.** All three faces are VARIABLE woff2 (`400 900`, `200 800`, plus an `opsz` axis `.display`/`.h2` set by hand) and Instatic's installer creates STATIC instances and ignores `font-variation-settings`. `font/woff2` is an accepted media mime, so the files upload as ordinary media and the three `@font-face` blocks travel in the token code asset with their `url()` rewritten. `install-fonts.mjs` IS NOT RUN — trap 16 is inverted here |
| **Video** | none | **five mp4s, all uploaded.** `video/mp4` is an accepted mime and `MAX_MEDIA_BYTES` is 50 MB (`server/handlers/cms/mediaUpload.ts`); the largest file is 7.4 MB. Both `<video>` elements needed trap 35 to survive at all |
| **Motion** | reveal-on-scroll | **the whole page.** GSAP 3.15 vendored (six files), ScrollSmoother, four pinned chapters, SplitText. None of it is visible to the four original gates — see trap 36 and `verify-motion-live.mjs` |

There is no `.js` scope on this site: the reveal masks key on `html.wz-ready`, which
`js/90-boot.js` sets itself, so `push-site.mjs`'s `BOOTSTRAP` is deliberately EMPTY (trap 10 does
not apply, and carrying the line over gave `compare-live.mjs` a real finding).

> [!WARNING]
> **ONE PAGE, PUBLISHED 2026-09-10, `{"publishedPages":1}`, `1 written, 0 deleted`, on an instance
> provisioned the same day.** 52 media assets (44 images, 5 videos, 3 variable woff2), 560 nodes,
> 272 style rules, 9 conditions, alt text on 19 photographs.
>
> Gates: `verify-live.mjs` clean (1 route, 33 URLs, 36 asset references) · `css-parity.mjs`
> **FAIL none** · `compare-live.mjs` **7 → 2–4**, all residual findings the `margin-inline`
> artifact of trap 37 · `visual-diff.mjs` 2.3% at 390 and 4–6% at 1440, every band either an
> autoplaying video frame or JPEG→WebP re-encoding (trap 38) · `verify-motion-live.mjs`
> **FAIL none — the published page moves.**
>
> **Four real defects, every one silent, every one behind a 200.** Both `<video>` elements
> published as `<video>` with NO src, poster, id or data-* (trap 35). **SplitText and Observer were
> never on `window`**, so every split headline published unsplit while the pins scrubbed perfectly
> (trap 36). Eleven declarations dropped that the med spa's harvest did not cover — `!important`
> and `svh` (trap 39). And `.tr-media`'s breakpoint lost a cascade race to its own reduced-motion
> rule, publishing the transformation pin 149px too tall on a phone (trap 20, again).

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
> assembled by `push-site.mjs` as `the six vendored GSAP files + assets/site.js`,
> in that order. Anything third-party has to be a JS module in `site-src/js/`
> that injects the tag at runtime; `build.mjs` concatenates `js/00-*.js`, then
> `sections/*.js`, then `js/90-*.js` into `dist/assets/site.js`, `push-site.mjs`
> reads that one file, and **no part of this workflow needs changing.** `90-`
> sorts last and marks a module as not-core.
>
> Anything of that kind should also be HOST-GATED rather than remembered about
> at launch.
>
> And read trap 36 before adding a library: the published asset is served as
> `<script type="module">` and bundled as CommonJS, so a UMD that has not been
> wrapped exports into a module scope nothing reads and never reaches `window`.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the scripts or technical logic of this workflow must be
> documented here immediately.

## The instance

| | |
| :--- | :--- |
| **URL** | `https://west-la-implants-production.up.railway.app` |
| **Admin** | `https://west-la-implants-production.up.railway.app/admin` |
| **Railway** | workspace `Brandklout` -> project **`West LA Implants`** `a55b5cac-b92d-4653-a9ff-6da522a5c89c` -> service `West LA Implants` `f54653f7-fc7a-41db-8eea-6bfb6bf386c5`, env `production` `5872429f-9ed2-4c15-9597-3479c097eae7` |
| **Image** | `ghcr.io/corebunch/instatic:latest`, volume `/app/storage`, DB `/app/storage/data/cms.db`, healthcheck `/health`, port 8080 |
| **Owner** | `alejandro@thrivesquare.com` |
| **Credentials** | `INSTATIC_BASE_URL` / `INSTATIC_EMAIL` / `INSTATIC_PASSWORD` in the worktree `.env`, generated from `~/.webzite/.env` `[west-la-implants]`. Never hand-edit a worktree `.env` |
| **Link dir** | `21-instatic-upload/.tmp/railway-link`, already linked. `export RAILWAY_LINK_DIR` to its ABSOLUTE path before `ship.sh` |

The provisioning order is unchanged from the sibling — name the project and the service FIRST,
because the generated domain is derived from the service name at creation and that domain is what
goes into `seo.json`, into every canonical, and into the link the team reviews from. This instance
was created name-first and was correct from its first boot. A new instance is provisioned but
**not set up**: `POST /admin/api/cms/setup` is a one-shot bootstrap that 409s afterwards.

> [!IMPORTANT]
> **`MSYS_NO_PATHCONV=1` GOES ON THE `railway ssh` CALL AND NOWHERE ELSE.** Git Bash rewrites any
> argument that looks like a POSIX path before a native `.exe` sees it, so
> `railway ssh "rm -f /app/x"` arrives on the container as `rm -f C:/Program Files/Git/app/x`.
> Exporting the variable for the whole of `ship.sh` breaks the script the other way: `$HERE` is a
> `/c/Users/...` path and `node "$HERE/check-link.mjs"` then gets something Windows cannot resolve,
> which surfaces as MODULE_NOT_FOUND on a file that is plainly there. It is scoped to `rs()`.

## Execution Steps

```bash
export RAILWAY_LINK_DIR="$PWD/.tmp/railway-link"   # ABSOLUTE.
                               # railway link -p a55b5cac-b92d-4653-a9ff-6da522a5c89c \
                               #              -s "West LA Implants" -e production
                               # ship.sh runs check-link.mjs first and refuses a link dir
                               # that does not serve INSTATIC_BASE_URL

cd ../04-design/.tmp/site-src && node build.mjs && cd -
                               # 0. dist/ is the source of truth for every step below.
                               #    REBUILD IT after any site-src change, or the payload and
                               #    the gates disagree about which build is live

# NOTE: install-fonts.mjs IS NOT RUN on this client. See "What is different".
node upload-media.mjs          # 1. images + videos + the three variable woff2 -> media
                               #    library; writes .tmp/media-map.json (52 files)
node set-alt.mjs --apply       # 1b. alt text -> the media library, the ONLY place Instatic
                               #    reads it from. Skip it and every image is alt="" (trap 28)
node build-import-input.mjs    # 2. css + the page body, rewriting src/href/poster/data-src/
                               #    data-src-mobile and excising @font-face (traps 14, 16)
bash ship.sh                   # 3. ship to the container, run Instatic's own converters
node push-site.mjs             # 4. dry run. Read .tmp/tokens.css afterwards to see exactly
                               #    what the code asset will carry BEFORE it is live
node push-site.mjs --apply --force   # shell + page + code assets in ONE atomic PUT.
                               #    --force is REQUIRED on any re-import (trap 11)
node -e "import('../../../../process/22-instatic-api-sync/insta-api.mjs').then(m=>m.publish())"

node verify-live.mjs           # 5. GATE - routes, links, assets, tree shake, token layer,
                               #    the @font-face srcs, and the ORDER of the script bundle
node css-parity.mjs            # 6. GATE - did every declared property reach the live CSS?
                               #    Cheapest of the five; reach for it first after any CSS change
node compare-live.mjs          # 7. GATE - structure, computed style, geometry, text
node visual-diff.mjs           # 8. GATE - pixels, at both widths. Read the BANDS, not the
node visual-diff.mjs 390       #    percentage (trap 38)
node verify-motion-live.mjs    # 9. GATE - DRIVES the published page: smoother, the four pins,
                               #    the scrubs, the fonts, the hero film, 390 overflow.
                               #    THE ONLY GATE THAT CAN SEE THE MOTION LAYER (trap 36)
```

`verify-motion-live.mjs` is not optional and is not a nicety. The other four capture with
`prefers-reduced-motion: reduce`, deliberately, so **a published page with no ScrollSmoother, no
pins and no SplitText passes every one of them** — a chapter that never animates looks exactly like
a chapter that has finished animating. It is the gate that found trap 36, and trap 36 had already
survived four clean publishes of the other four.

`puppeteer-core` is not a dependency of this repo. The three browser gates resolve it out of
`bk-stone/node_modules` — `compare-live.mjs` and `visual-diff.mjs` through a `node_modules`
directory junction at this worktree's root, `verify-motion-live.mjs` through an explicit
`createRequire` path that `PUPPETEER_DIR` overrides. If that worktree is gone, `npm i
puppeteer-core` here instead.

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

Forty of them now. **1-34 are the siblings', kept verbatim**, and eight of those bit again on this
build. 35-40 are this one's. Every single one answered 200, or printed "ok", while doing the wrong
thing — that is the only thing they all have in common, and it is why the gates exist.

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

### 35. A TYPED MODULE KEEPS ITS OWN PROPS AND THROWS THE REST OF THE TAG AWAY — `<video>` published EMPTY

FOUND 2026-09-10 on this build's first publish, by reading the published HTML. Two `<video>`
elements went in and this came out:

```html
<video class="ar-film">        <video>
```

No `id`, no `poster`, no `src`, no `data-src`, no `aria-label`, no `muted`, no `loop`, no
`playsinline`. Both films were a blank black box where the page's two most expensive assets should
be, and **nothing failed**: `verify-live.mjs` checks the assets the MARKUP references, and the
markup referenced none.

**This is trap 22 in its general form, and that is the part to carry forward.** `importHtml` maps a
tag onto a MODULE, and a typed module has a FIXED PROP SCHEMA. `base.video` is
`{videoUrl, poster, autoplay, loop, muted, controls, playsinline, preload, title, noRelatedVideos}`
and there is nowhere for anything else to go — the importer does not even park the leftovers in
`htmlAttributes`, exactly as `base.image` does not park `alt` (trap 28). A plain `<div>` or
`<section>` keeps everything it arrived with: this page published 8 `data-chapter`s, 9 `data-anim`s
and 50 `id`s untouched, because those map to `base.container`, whose entire schema is
`{tag, customTag, htmlAttributes}`.

**The escape hatch is `base.container`, and the platform uses it itself.** `core/htmlImport/rules.ts`
maps a non-YouTube `<iframe>` to
`{ moduleId: 'base.container', props: { tag: 'custom', customTag: 'iframe' } }`, with the comment
*"so their src/attributes are preserved via htmlAttributes"*. `sanitizeRenderableHtmlAttribute`
accepts any attribute name except `class`, `style`, event handlers and the reserved
`data-instatic-*`, so a restored tag can carry the lot.

**Fix:** `push-site.mjs` re-points every `base.video` node at `base.container` with
`customTag: 'video'` and restores the attributes verbatim from the payload `build-import-input.mjs`
shipped — which is the post-rewrite markup, so every path is already a `/uploads/...` URL. Nodes are
paired with `<video>` tags in DOCUMENT ORDER, walked from the root rather than read off
`Object.keys(nodes)`, and the counts are asserted: putting the wrong film behind the wrong poster
would look like nothing at all.

The alternative was to ship a `<div data-video>` and build the element in `90-boot.js`, the way the
med spa builds its range input. It was rejected: it puts an Instatic-shaped compromise into a static
build that renders perfectly without one, it costs the `<video>` its poster on first paint, and it
makes local and published different, which is what every gate downstream assumes they are not.

> **The general rule: after any import that introduces a new KIND of element, read
> `import-out.json` for what its node actually carries.** Ten seconds of `node -e` printing `props`
> per `moduleId` is the whole check, and it is the same ten seconds that would have caught trap 15's
> empty burger and trap 22's dead slider.

### 36. THE SCRIPT ASSET IS BUNDLED AS CommonJS AND SERVED AS A MODULE, SO A UMD NEVER REACHES `window`

The worst thing this build published, and **the four gates the med spa left behind could not see any
part of it.**

`window.SplitText` and `window.Observer` were undefined on the published site while `window.gsap`,
`ScrollTrigger`, `ScrollToPlugin` and `ScrollSmoother` were all present. So the page pinned, scrubbed
and smooth-scrolled correctly, and every split headline simply never split: the reality chapter's
nineteen words, which light one at a time as its pin scrubs, published as one static paragraph at
full opacity. `WZ.splitWords` catches and returns null, and the timeline then tweens the paragraph
itself — there is no error anywhere.

**The mechanism is visible in the published bundle.** Instatic runs the code asset through esbuild,
and esbuild REWRITES a top-level `this` to `exports`. Every GSAP file is a UMD that opens

```js
typeof exports == "object" && typeof module != "undefined" ? A(exports)
  : typeof define == "function" && define.amd ? define(["exports"], A)
  : (k = globalThis, A(k.window = k.window || {}))
```

and is invoked as `})(this, function (k) {…})`. Published, all six read `})(exports, function (k)
{…})` and take the FIRST branch: the library attaches itself to a module exports object that nothing
ever reads, and never touches `window`.

**Four of the six survived by accident, which is why it was so quiet.** gsap's core puts itself on
`window` from the inside, and ScrollTrigger, ScrollToPlugin and ScrollSmoother each call
`gsap.registerPlugin`, which re-exposes them globally. SplitText is not a gsap plugin and registers
nothing. The standalone Observer is shadowed by ScrollTrigger's own internal copy, which appears in
`gsap.core.globals()` as **`Observer2`** — a name that reads like success. So the two files with no
self-registration are exactly the two that vanished.

**Fix:** wrap each vendored file in a scope where `exports`, `module` and `define` are all
undefined, and hand it a global to write to:

```js
var __wzUmdGlobal = { window: window };
;(function (exports, module, define, globalThis, self) {
  /* the vendor file, byte for byte */
}).call(__wzUmdGlobal, void 0, void 0, void 0, __wzUmdGlobal, __wzUmdGlobal);
```

Shadowing by PARAMETER is deliberate: it cannot be defeated by whatever the outer bundle declares.
Nothing about the libraries is patched.

> [!WARNING]
> **AND THE GLOBAL CANNOT BE `window` ITSELF.** The first version of this wrapper passed `window`
> as `this` and the whole bundle died on gsap's first line with
> `Cannot set property window of #<Window> which has only a getter` — because the UMD's browser
> branch writes `window.window`, an accessor with no setter. In a classic `<script>` that
> assignment fails silently, sloppy-mode style, and the expression still evaluates to `window`.
> **Instatic serves the script asset as `<script type="module">`, and a module is always strict**,
> so the same line throws and takes every library with it. The shim is a plain object whose
> `window` property is writable and already IS window: the UMD writes to the shim, reads `window`
> back out, and hands the real global to the factory. `globalThis` and `self` are shadowed by the
> same object because SplitText's UMD prefers `globalThis` and ignores `this` entirely; both names
> appear in these six files ONLY in that prelude line, so shadowing them reaches nothing else.

`verify-motion-live.mjs` asserts all six globals by name now, and **`gsap.core.globals()` is not
the check** — `Observer2` is in there whether or not the standalone file loaded.

### 37. `compare-live.mjs`'s `margin-inline: auto` finding is an artifact, and the geometry proves it

The residual on this publish, and the second time this workflow has spent a morning on an auto
margin (trap 30 was the first). Between two and six findings per run, always the same shape:

```
div.pr-body.wrap#0         local "64px"        live "0px"
div.su-grid.wrap#0         local "64px"        live "0px"
div.su-strip.wrap--wide#0  local "57.5938px"   live "0px"
```

`.wrap` and `.wrap--wide` centre with `margin-inline: auto`. The CSS is byte-identical on both
sides, `css-parity.mjs` is clean, and **`compare-live.mjs`'s own geometry pass never flags these
elements** — which is the tell, because a margin that had really collapsed would move the box.

Probing both pages under the gate's exact conditions (JS disabled, `networkidle0`, reduced motion)
settles it: when `getComputedStyle(el).marginLeft` reads `0px` live,
`el.getBoundingClientRect().x` still reads **58** and **64** — the used margins are there and the
element is centred. Chrome is returning the computed value rather than the used value for a margin
specified through the logical `margin-inline` shorthand, non-deterministically, and slightly more
often on the live page, which has more style-recalc work to do because Instatic's images carry
`srcset` and `sizes="auto"`.

**Do not suppress it** — that is trap 30's rule and it still holds; a collapsed auto margin could
one day be real. Check `x` instead: if the geometry pass is silent, the box has not moved.

`.frame` gained a `min-width: 0` while this was being chased. It did NOT cause the finding and it
fixes nothing that was broken. It is kept because trap 24 is real: a grid item's automatic minimum
is its min-content width, and Instatic's `<img width height srcset>` can floor an `fr` track at the
loaded variant's intrinsic width. It is locally neutral.

### 38. `visual-diff.mjs`'s PERCENTAGE is meaningless on a page with autoplaying video — read the bands

This page reports between 2.3% and 6.2% different, and the number changes on every run of an
unchanged publish. Two `<video>` elements are playing on two origins and there is no frame they can
be expected to agree on; 900px of hero and 900px of the precision chapter are film, and a moment's
difference in either one moves the total by two points.

Every band on this build has been read and each is one of three things:

- **a video frame** — `y 0-776` (hero) and `y 2809-3709` (precision) at 1440. The TYPE over them is
  pixel-identical, which is what the band is actually good for;
- **the review marquee** — `y ~9200`, an infinite scroll caught at a different phase;
- **JPEG to WebP re-encoding** — `y 2160-2668`, `y 4333-4740` and friends: edge pixels only, the
  layout underneath identical.

So the gate still earns its place — it is what would catch a missing scrim (trap 32) or a shifted
block — but the headline number is not a regression signal here. Compare BANDS between runs, and
crop any new one with `.tmp/crop.mjs` before believing it.

### 39. `!important` and the `svh` unit are dropped too, and the reduced-motion escape hatch went with them

`css-parity.mjs` reported eleven declarations missing on the first publish, in two shapes the med
spa's `harvestLossy()` did not cover:

- **`!important`.** `02-base.css` kills every animation under `prefers-reduced-motion` with
  `*,*::before,*::after{animation-duration:.001ms!important; …}`. All three declarations were
  dropped. `scroll-behavior:auto!important` in the same rule survived ONLY because `DROPPED` had
  already claimed that property by name. A site whose reduced-motion escape hatch is silently gone
  passes every other gate, because no gate runs with the preference set except the two that force
  it — and they force it on both sides.
- **`svh` / `lvh` / `dvh`.** `.pr-pin{height:100svh}` published with no height, which on a PINNED
  section is not cosmetic: it is the pin's own measurement. `.an-pin{min-height:100svh}` in the same
  stylesheet survived, exactly as trap 21 warns — `min-height` keeps what `height` rejects and there
  is no rule to infer.

Both are now in `isLossy()`, by VALUE rather than by property, so they are covered wherever they are
written. `background-position` and `background-size` joined `LAYERABLE` in the same pass, for
`.in-fields select`'s two-triangle arrow: half a layered background is not a smaller bug than none
of it.

`font-variation-settings` was added to `DROPPED` pre-emptively rather than after a failure — all
three faces here are variable and `.display`/`.h2` set `opsz` by hand, and a headline at the wrong
optical size reads as a different typeface rather than as a dropped declaration.

### 40. `css-parity.mjs` was not really checking conditions, and the fix is one normaliser

Found while chasing trap 39. `import-run.ts` rewrites every at-rule prelude before conversion — a
space after each colon, among other things — so the build's `@media (max-width:1023px)` is published
as `@media (max-width: 1023px)`. The gate keyed local rules on the raw text, so **every local
`@media` key failed to find its live twin**, fell through to the `RbySel` fallback — which asks only
whether the selector declares the property ANYWHERE, at any breakpoint — and passed.

A responsive override the conversion dropped would therefore have been reported as present, because
the unconditional rule declares the same property. `normCond()` now matches the platform's own
normalisation. It cannot reuse `norm()`: that is the SELECTOR normaliser and would turn `a:hover`
into `a: hover`.

### 41. `background-position` is split into `-x` / `-y` longhands, and css-parity reports the shorthand missing

Found 2026-09-11. `.textlink { background-position: left bottom }` published as
`background-position-x: left; background-position-y: bottom` — the page renders correctly, the
computed value is `0% 100%`, and `css-parity.mjs` still lists `.textlink {background-position}`
as a declaration published without its property, because it pairs on property names. Author the
two longhands in the source and the gate is clean. (The comma-layered case is trap 26 territory
and is harvested into the code asset instead.)

### 42. The live page carries a Sienna accessibility widget the build does not, and it freezes type sizes inline

Found 2026-09-15 (BugHerd round two). The published HTML loads
`cdn.jsdelivr.net/npm/sienna-accessibility/…umd.js` with `data-wz-site-script` — a site-level
injection, not part of `site-src`, already present in the 2026-09-15 pre-push snapshot. At load it
writes `font-size` inline on ~200 elements, **rounded to whole pixels and sometimes snapshotted
before the stylesheet applies** (the hero read 32px — the UA `h1` default — for the first seconds,
then 102px; the review quotes stay at 16px against the authored 17.92px). Consequences:

- `visual-diff.mjs` went from 2.7 % to 15.9 % @1440 / 31.8 % @390 with the page height off by 66px @1440 and 120–220px @390:
  every section below the fold shifted. With the widget blocked, live and local match to the pixel
  in height and in every section top. `visual-diff.mjs` now aborts the widget's request on both
  sides.
- Any probe that reads `getComputedStyle().fontSize` on the live page in its first seconds reads
  the widget's snapshot, not the CSS. Wait ~5s, or block it.
- Frozen px sizes do not follow the fluid root on resize (see the memory note on gates above 1440).

Removing the widget is the agency's call, not a build change — it is reported, not touched.

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

## Output Artifacts

- `.tmp/media-map.json` — reference path AND basename → media library path, id, dimensions
  (52 files: 44 images, 5 videos, 3 variable woff2)
- `.tmp/import-input.json.gz` — the payload shipped to the container
- `.tmp/import-out.json` — 272 style rules, 9 conditions, one 560-node page tree
- `.tmp/tokens.css` — **the token code asset exactly as it will be written**, dumped on every run
  of `push-site.mjs` including the dry run. It is the one payload nobody can read back without
  publishing, and three of this workflow's worst defects lived in it; read it before applying
- `.tmp/ship.log` — the full conversion report. Read the WHOLE file, not its tail (trap 12)
- `.tmp/visual/` — the stitched renders and their diffs (gitignored: `*.png`)
- `.tmp/crop.mjs` — cuts a y-band out of the three diff images, local | live | diff side by side,
  so a band can be LOOKED at rather than guessed at. Chrome is the image tool (there is no `sharp`
  here): a data-URI `<img>` in `setContent`, then a clipped screenshot. Takes `y0 y1 [width]`
- `.tmp/probe-*.mjs` — one-off probes kept from this run: `probe-wrap.mjs` and `probe-strip.mjs`
  (the trap 37 auto-margin, on both sides under the gate's exact conditions), `probe-split.mjs`
  (SplitText, which is how trap 36 was isolated), `probe-globals.mjs` (the six GSAP globals),
  `probe-err.mjs` (page errors and 4xx responses with their URLs). Cheap to write, and the reason
  every residual on this publish has an answer rather than a suppression
- `08-qa/.tmp/screenshots/live/` — 36 captures of the PUBLISHED page written by
  `verify-motion-live.mjs`: every pin at four scrub positions plus four viewport shots, at 1440 and
  390 (gitignored: `*.png`)

## What is NOT done

- **Canonical, Open Graph and JSON-LD are not on the published site at all** — see trap 31. The
  published `<head>` is four tags. Fine for a review link; not fine for launch. The route is a
  runtime module in `site-src/js/` that injects them, or an upstream change.
- **Nav and footer are inlined rather than being a Visual Component.** Costless today at one page,
  and the reason to do it arrives with the second.
- **The consultation form posts nowhere.** `.in-fields` is markup only.
- **The domain.** The site is on its Railway URL and `seo.json`'s origin is that URL — real and
  resolvable. When a domain is bought: change the origin, rebuild, republish, and run
  [`20-instatic-domain-origins`](../../../../process/20-instatic-domain-origins) before sending
  anyone the admin link. Keep the railway host in `PUBLIC_ORIGIN` — `INSTATIC_BASE_URL` points at
  it and every script here would start answering 403 without it. This instance is **not** yet in
  that process's `sites.json`.
- **`aria-label` on both `<video>` elements survives only because of trap 35's rewrite.** If anyone
  removes the `base.container` restoration, the films lose their accessible names along with
  everything else.
- **No per-case photo consent recorded** for the before/after cases.
- **Nothing has been retired.** `GONE` in `verify-live.mjs` is empty, which is a true statement on
  an instance whose first publish was this site — fill it the first time a page is deleted rather
  than overwritten.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md).
Scripts and this directive are committed; `.tmp/` artifacts are lightweight JSON and may be
committed, but the PNGs under `.tmp/visual/` and `08-qa/.tmp/screenshots/` must not be.
