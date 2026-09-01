# Workflow: 05 - Instatic Upload (Stone Surgical Arts)

Takes the static build in
[`04-design/.tmp/surgical-arts/final-site`](../04-design/.tmp/surgical-arts/final-site) and puts it
into the client's own Instatic instance as an editable site — pages as node trees, CSS as style
registry rules, images in the media library.

> [!WARNING]
> **THE SOURCE IS ONE PAGE, AND THE LIVE SITE IS STILL EIGHTEEN.**
>
> Seven pages on 2026-08-30, eighteen on 2026-08-31, and on 2026-09-01 the client kept the home page
> alone. `build-import-input.mjs` now lists exactly one page and no longer derives treatment rows
> from `treatments-data.mjs`, which was deleted with them.
>
> **The next `--apply` deletes seventeen pages from the client's live instance.** That is trap 8
> working as designed — in replace mode any stored page absent from `changedPages` is removed
> server-side — and it is the intended outcome, but it is not reversible from this side. Confirm it
> is wanted before running, and note that the media library is untouched either way: the assets for
> the deleted pages stay uploaded, matching the decision to keep them in the repository.

> [!IMPORTANT]
> **Integrity Rule**: Any change to the scripts or technical logic of this workflow must be
> documented here immediately.

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

```bash
export RAILWAY_LINK_DIR=/path/to/a/dir/linked/to/the/Stone/project   # railway link -w Brandklout -p "Stone Surgical Arts"

node upload-media.mjs           # 1. images -> media library, writes .tmp/media-map.json
node build-import-input.mjs     # 2. assemble css + the page body, rewriting srcs and links
bash ship.sh                    # 3. ship to the container, run Instatic's own converters, retrieve
node push-site.mjs              # 4. dry run
node push-site.mjs --apply --force   # write shell + pages + code assets in ONE atomic PUT
                               #    --force is REQUIRED on any re-import: see trap 11
node -e "import('.../insta-api.mjs').then(m=>m.publish())"   # 5. publish
node verify-live.mjs            # 6. GATE — crawls every route, link and asset
```

`verify-live.mjs` is not optional. Every failure on this build reported success somewhere first.

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
