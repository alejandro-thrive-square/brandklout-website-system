# Workflow: 21 - Instatic Upload (Stone Surgical Arts)

Takes the static build in
[`04-design/.tmp/surgical-arts/final-site`](../04-design/.tmp/surgical-arts/final-site) and puts it
into the client's own Instatic instance as an editable site — pages as node trees, CSS as style
registry rules, images in the media library.

> [!WARNING]
> **REPUBLISHED 2026-09-04, `{"publishedPages":12}`, `12 written, 0 deleted`, seq 26.** The design
> feedback round, the face crops, the doctor's stock and the un-parallaxed arrival inset. Media:
> 25 uploads — 18 `ds-*`, `ssa-exterior`, and the six doctor photographs re-sent with `--only`
> because the Magnific upscales replace originals of the same name (live was still serving
> `dr-stone-portrait` at 643x1020 against a 1200x1903 local file; the byte-size sweep in the
> runbook is how to find these). The two marble textures also differ byte-wise and were **left
> alone on purpose**: the local copies are `w1800` variants re-downloaded from this instance, so
> re-uploading would replace the originals with a downsample.
>
> Both gates clean, and `compare-live.mjs` went **17 findings → 0** — but see **trap 26**: both
> findings were bugs in the LOCAL build that the import was rendering correctly.
>
> **TWELVE PAGES, PUBLISHED 2026-09-02, `{"publishedPages":12}`, `12 written, 0 deleted`.** The
> client lifted the hold the same morning (*"let's upload to Instatic, the team didn't leave any
> feedback yet"*) and asked for the comparison page by page. `verify-live.mjs` clean: 12 routes,
> 92 URLs, 205 asset references, 8 retired routes 404, 12/12 distinct titles. `compare-live.mjs`
> went **168 → 122 → 48 → 5 → 2** findings across five applies in one morning, and the two that
> remain are an 8px auto-margin on one page's footer container. Every step of that descent is a
> trap below (21 to 24), and every one of them answered 200 on the way in.
>
> **Ten photographs were re-uploaded at their 2200px source width** with the new `--only` flag on
> `upload-media.mjs`; the library is 88 files, ten of them now orphans of the same name.

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

## Blog extension, 2026-09-08

The user authorized adding the overview and article pages locally and building/testing them on
this Instatic instance. `BLOG_PAGES` in the design renderer feeds `build-import-input.mjs`,
`verify-live.mjs` and `compare-live.mjs`, alongside the existing twelve routes. The content
collection supplies three real recovered articles. See
[content provenance and verification](../04-design/.tmp/surgical-arts/BLOG-CONTENT.md).

Run `node ../04-design/.tmp/surgical-arts/site-src/blog-test.mjs --live` after the standard gates.
It exercises the overview, every article and navigation at six widths, including 320 and 1920.
The expected import has 16 pages and retains all 12 existing slugs. Confirm the actual remote
slug set before using replace mode; `deletedPageIds` is empty by contract and is not proof that
no existing rows would be deleted. The pre-task remote shell was sequence 26.

## The instance

| | |
| :--- | :--- |
| **URL** | `https://stone-surgical-arts-production.up.railway.app` |
| **Railway** | workspace `Brandklout` → project **`Stone Surgical Arts`** → service `Stone Surgical Arts` |
| **Image** | `ghcr.io/corebunch/instatic:latest`, volume `/app/storage`, DB `/app/storage/data/cms.db` |
| **Renamed** | 2026-08-31. Project, service and generated domain all carry the business name now. The CLI cannot rename either, so it went through `backboard.railway.com/graphql/v2` (`projectUpdate`, `serviceUpdate`, `serviceDomainCreate`) with the token in `~/.railway/config.json`. **Rename BEFORE minting the domain** — a generated domain is derived from the service name at creation, which is why the old one was named after the Docker image. **`PUBLIC_ORIGIN` must move with it**, or every write answers `403 invalid origin`. |
| **Owner** | `alejandro@thrivesquare.com` — the same credentials as Mason Park, created 2026-08-31 |
| **Credentials** | `INSTATIC_BASE_URL` / `INSTATIC_EMAIL` / `INSTATIC_PASSWORD` in the repo-root `.env` |

The instance was provisioned but **never set up** — `users`, `site` and `sessions` were all empty
and `GET /admin/api/cms/setup/status` answered `needsSetup: true`. `POST /admin/api/cms/setup`
(`{siteName, email, password, displayName}`, password ≥ 12 chars) is a one-shot bootstrap that
409s afterwards, so it is safe to leave public.

## Execution Steps

> [!IMPORTANT]
> **In a sparse worktree, add the shared client first.** Every script here imports
> `insta-api.mjs` from `deliver/brandklout/dr-nahlah/workflows/15-instatic-api-sync/`, which is
> outside a Stone-only sparse checkout. The file is in the tree, so it fails as
> `ERR_MODULE_NOT_FOUND` on a path that plainly exists in `git ls-tree` — which reads like a broken
> import rather than a missing checkout. Once per worktree:
>
> ```bash
> git sparse-checkout add deliver/brandklout/dr-nahlah/workflows/15-instatic-api-sync
> ```

```bash
export RAILWAY_LINK_DIR=/path/to/a/dir/linked/to/the/project
                               # railway link -p b3cae5d8-5f45-4e5c-8bfb-03113bb45327 \
                               #              -s "Stone Surgical Arts" -e production
                               # Link by project ID, never by the name "Stone": there are THREE
                               # Stone projects. ship.sh runs check-link.mjs first and refuses a
                               # link dir that does not serve INSTATIC_BASE_URL

node install-fonts.mjs --apply  # 0. ONCE per instance: the two typefaces into Instatic's
                               #    own library. See trap 16
node upload-media.mjs           # 1. images -> media library, writes .tmp/media-map.json
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

### 26. A `compare-live` finding can mean the LOCAL build is the wrong one

Every earlier entry on this list assumes the build is right and the import broke something. On the
2026-09-04 publish both remaining findings were the other way round, and reading them the usual way
would have "fixed" the live site by shipping the bug to it.

Both had the same shape: **a top-level rule written BELOW an `@media` block that overrides the same
property at the same specificity.** Media queries add no specificity, so the later top-level rule
wins locally and the media rule never applies. Instatic rebuilds the cascade out of the style
registry (trap 20) and the media rule won there — so live rendered what the author actually meant
and local did not.

- `22-footer.css` — `@media (max-width: 991px) { .footer_nav { align-items: center } }` at line 145,
  then a `/* the page list, 2026-09-02 */` block appended at the END of the file setting
  `align-items: flex-start`. The whole media block exists to centre the footer on a phone; the
  append silently switched the nav back to left-aligned on all twelve pages. **Fixed by moving the
  appended block above the media query**, which is where a base rule belongs.
- `58-breathe.css` — `.concern_arrow` was grouped with three `… span` selectors taking
  `display: inline-block`. That beat its own `display: grid` in `52-elevate.css` (so
  `place-items: center` never centred the svg in its circle, at any width) *and* the
  `display: none` that same file sets at `<=767px`, where `.concern_row`'s template has no arrow
  column. On a phone the arrow fell into an implicit ninth grid row: +43px on all nine concern
  rows, +381px on the home page. **Fixed by taking `.concern_arrow` out of the group** and leaving
  it only the transition the file was there to give it.

> **The tell is a finding where live looks *more* correct than local.** Before changing anything,
> ask which value the CSS author asked for. `grep -n` the property across `css/` and look at
> whether the losing rule is inside an `@media` — if it is, the bug is source order in the build,
> not the import. Trap 20's remedy (double the class to win on specificity) is for the case where
> the two rules genuinely disagree; here the right move was to put the rules in the correct order,
> because the media rule was never meant to lose.

**Appending to the bottom of a stylesheet is the habit that causes this.** Six of these files end
in an `@media` block. A new base rule goes above it.

### 27. The published page picks a different font INSTANCE once scripts run

Found on 2026-09-08, on the first pages with long prose. With scripts off the local build and the
published page agree to the pixel on all sixteen routes. Turn scripts on and the published article
is ~30px shorter: one body paragraph sets in two lines live and three lines locally.

The cause is not the font files, and the list of things it is *not* is worth keeping, because every
one of them looks like the answer:

- **Not the binaries.** Instatic ignores `assets/fonts` entirely and serves its own
  `/uploads/fonts/<family>/<weight>-latin-0.woff2` — one variable file covering all four Inter
  weights against our four static subsets, so the bytes genuinely differ (trap 16). Irrelevant:
  with scripts off the two already measure identically. Swapping the local files for Instatic's
  changes nothing, and it silently overwrote seven untracked `.woff2` files to prove it —
  `*.woff2` is in `.gitignore`, so there is no `git checkout` back. Regenerate with
  `node site-src/get-fonts.mjs --force`, or copy from `site-src/assets/fonts`, which the build
  copies *from* and which therefore still holds the originals.
- **Not BugHerd.** Blocking `bugherd.com` leaves the difference exactly as it was.
- **Not an injected stylesheet.** The four Instatic stylesheets carry seven `@font-face` rules
  between them, all same-origin, none with a `local()` source.
- **Not `document.fonts.add()`.** Hooking it ahead of every page script records zero calls, and
  `document.adoptedStyleSheets` is empty.
- **Not a third-party webfont.** The page never touches `fonts.gstatic.com`; the same six font
  files load with scripts on and off.
- **Not layout.** The paragraph is 640px wide either way, at the same size, line-height,
  letter-spacing, word-spacing and weight.

What actually changes is which *instance* of the same downloaded file gets rasterised.
`CSS.getPlatformFontsForNode` reports `postScriptName` **`Inter`** (171 glyphs) with scripts off
and **`Inter-Regular`** (172 glyphs) with scripts on. A 64-character string measures 480.41px
against 479.80px — 0.13% narrower, about **0.6px per line**. That is invisible on its own and only
surfaces where a long paragraph already sits on a line-break boundary, which is why the twelve
original pages never showed it and the first long-prose pages did immediately.

> **The tell is a geometry finding that appears only with scripts on, only on prose, and only as a
> whole-line jump.** Run `node font-instance-probe.mjs <slug>`. Differing `postScriptName` between
> its two blocks is this condition, not a regression. Nothing in this repository controls it; it is
> the platform's font resolution.

So the **gate stays `compare-live.mjs` with scripts off**, which is deterministic and passes.
`--runtime-layout` re-measures geometry with scripts on and therefore reports this on every
prose-heavy page — it is a **diagnostic, not a gate**. Do not silence it with a `BENIGN` entry: a
tolerance wide enough to swallow a whole line is wide enough to swallow a real regression.

### The check: `compare-live.mjs`

```bash
node compare-live.mjs                 # both pages, 1440 and 390
node compare-live.mjs neck-lift 390   # one page, one width
node compare-live.mjs --shots         # also write viewport PNG pairs
COMPARE_PORT=8837 node compare-live.mjs   # when 8821 is held, see below

node compare-live.mjs --runtime-layout    # DIAGNOSTIC, not a gate. See trap 27.
node font-instance-probe.mjs <slug>       # why --runtime-layout reports prose. Trap 27.
```

Every flag has to be filtered out of `args` inside the script, not merely recognised: the slug test
is `/^[a-z-]+$/`, which a long flag matches happily, so an unfiltered `--runtime-layout` silently
became the entire page list until this was fixed on 2026-09-08.

**It serves the local build on 8821, and an interrupted run leaves that server behind.** The next
run then dies on `EADDRINUSE` before comparing anything, which looks like a broken tool. `PORT` reads
`COMPARE_PORT` since 2026-09-04 so you can just move; to clear the orphan instead,
`Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object { $_.CommandLine -like
'*compare-live*' }` and stop it. Killing the listener and re-running immediately can still lose the
race to a second orphan — check for more than one before assuming the port is yours.

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

### 28. A JS-only change does not need the convert steps, and `/assets/site.js` does not exist live

Two halves of the same session, 2026-09-09, swapping the BugHerd board key — one line in
`site-src/js/90-bugherd.js`.

**The shortcut.** `push-site.mjs` reads `assets/site.js` and `assets/vendor.js` live from
`final-site/`, but takes the page node trees from `.tmp/import-out.json`, which is whatever the
last `ship.sh` produced. So when a rebuild changes *only* JS, the previous run's `import-out.json`
is still valid and steps 1–3 (`upload-media`, `build-import-input`, `ship.sh`) can be skipped
entirely — go straight to `push-site.mjs --apply --force` and `publish()`. That turns a
twenty-minute pipeline into two minutes.

**The test for whether you may.** Rebuild, then:

```bash
git diff --stat -- .../final-site/
```

If the only modified file is `assets/site.js` (or `vendor.js`), take the shortcut. If any `.html`
or the CSS differs, the stored node trees are stale and you must run the whole pipeline —
`push-site.mjs` will happily publish the OLD markup with the NEW script and report success.

**The verification trap.** There is no `/assets/site.js` on the published site. Fetching it
returns 21 bytes and no match, which reads exactly like the publish silently failed. Instatic
serves the bundle from a content-hashed path — `/_instatic/assets/<id>/entries/site-<hash>.js` —
so a live check has to read the `<script src>` off the HTML first:

```bash
node -e "const B=process.env.INSTATIC_BASE_URL;
fetch(B+'/').then(r=>r.text()).then(async t=>{
  const s=[...t.matchAll(/<script[^>]+src=\"([^\"]+)\"/g)].map(m=>m[1]);
  for (const u of s) console.log(u, (await fetch(B+u).then(r=>r.text())).length) })"
```

Related: the header of `js/90-bugherd.js` explains why a third-party tag belongs in the JS bundle
and never in `partials/head.html` — `importHtml` strips every `<script>` out of an imported page,
so the head tag works locally and does not exist live.


### 29. Instatic publishes a CSP, and it blocks every third-party script and iframe

Found 2026-09-09, when the BugHerd sidebar would not appear on a site that demonstrably carried
the tag. Every published page gets a `<meta http-equiv="Content-Security-Policy">` written by
Instatic's publisher:

```
default-src 'self'; frame-src 'none'; img-src 'self' data: https:; media-src 'self' data: https:;
script-src 'self'; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:;
```

**It is not in our build and it is not an HTTP header** — `grep` finds it nowhere in `site-src/`,
and the response headers do not carry it. So it is invisible to every local check: the page works
in `final-site/`, and the difference only exists once published. `compare-live.mjs` does not catch
it either, because it compares the two documents' structure and computed style, and a blocked
third-party script changes neither.

The failure is also disguised. The browser reports the blocked request as **503**, which reads as
"BugHerd is down" or "the key is wrong". `node` fetching the identical URL returns 200, which reads
as "then it must be the browser or the VPN". Injecting the same tag on `example.com` in the same
browser loads it fine. Only the page's own CSP explains all three.

**What relaxes it**, from the container (`/app/src/core/publisher/`):

- `cspPlan.ts` — `createBaseCspPlan` sets `script-src 'self'` once the page has any script tag.
- `render.ts:461` — the base plan is unioned with `moduleCspSources`.
- `renderNode.ts:181` — which come from a module's `render()` output declaring `cspSources`. The
  worked example in its own comment is a YouTube embed lifting `frame-src 'none'`.
- `plugins/manifest.ts:304,524` — a plugin's `frontend.assets[]`, with the `frontend.assets`
  permission.

Those two are the whole list. A third-party URL inside `site.js` is neither: `getSite()` exposes no
CSP field and the container has no CSP env var. **Do not post-process the published HTML** — the
next `publish()` regenerates it.

Older Instatic instances emit no CSP at all (`westlaimplants.com` and `novismilerogers.com` serve
none), so a script that works on an older client site is no evidence it will work here.


## Output Artifacts

- `.tmp/media-map.json` — original filename → media library path, id, dimensions
- `.tmp/import-input.json.gz` — the payload shipped to the container
- `.tmp/import-out.json` — 509 style rules, 9 conditions, 7 page node trees
- `.tmp/converted/` — AVIF→WebP intermediates

## What is NOT done

- **Nav and footer are inlined into the page rather than being a Visual Component.** At eighteen
  pages this was the strongest item on this list, because editing the nav meant eighteen edits. At
  one page it costs nothing today and is still the right shape the moment a second page returns —
  `changedComponents` / `changedLayouts` are already in the `PUT /site-document` contract.
- **Per-page meta descriptions** — see trap 6.
- **The domain.** The site is on its Railway URL. Pointing `stonesurgicalarts.com` here is
  [HANDOFF §4](../04-design/.tmp/surgical-arts/HANDOFF.md), and after that run
  [`20-instatic-domain-origins`](../../../../process/20-instatic-domain-origins) before sending
  anyone the admin link.
- **The booking form still posts nowhere** — HANDOFF §5.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md).
Scripts and this directive are committed; `.tmp/` artifacts are lightweight JSON and may be
committed, but `.tmp/converted/` holds images and must not be.
