# Open Graph — `brandklout.open-graph` v1.2.3

Social sharing previews for every published page: Open Graph and Twitter Card
tags, a `<link rel="canonical">`, the page's own meta description, and the site
favicon.

| Version | Change |
| :--- | :--- |
| 1.2.3 | `og:image:width` / `height` / `type` when the image's file name carries its size (`…-1200x630.jpg`, the way the media library names resized uploads). Without them Facebook shows a link's first share with no picture while it fetches the image. |
| 1.2.2 | Entries are indexed by their SEO title as well as their title. A template that renders `{currentEntry.seoTitle}` as the `<title>` otherwise matched nothing, and every article was tagged as the template page (`og:url /blog-article`, `og:type website`). |
| 1.2.1 | `contentAccess[]` reads the `articles` table too. |
| 1.2.0 | `favicon` and `appleTouchIcon` settings. Instatic writes no icon link and serves nothing at `/favicon.ico`, so every tab showed a blank page icon. A page that already names an icon is left alone. |
| 1.1.3 | Inserts `<meta name="description">` when the site has no site-wide one (below). |

1.2.x was written in `bk-mason-park` (2026-09-25) and brought here on 2026-09-27.

## The problem it solves

Instatic's publisher writes three things into `<head>`
(`src/core/publisher/render.ts` → `buildDocumentMetaTags`): the title, ONE
site-wide description, and the favicon. There is no `og:`, no `twitter:` and no
canonical link anywhere in the source. A link to any page of this site pasted
into Facebook, LinkedIn, WhatsApp, Slack or iMessage unfurled as a bare URL.

It also corrects something adjacent and worse. `pages.seoDescription` and
`posts.seoDescription` are real cells, the admin has a field for them, and **30
of 37 pages and 43 of 43 articles had one written** — but `buildDocumentMetaTags`
reads `settings.metaDescription` and nothing else, so all 80 published pages
shipped the identical sentence and 73 hand-written descriptions were stored and
never published. `syncMetaDescription` (on by default) puts each page's own
description back on the page.

## What it writes

| tag | source, in order |
| :--- | :--- |
| `og:title` / `twitter:title` | override → the page's `<title>` |
| `og:description` / `twitter:description` | override → the row's `seoDescription` → the page's `<meta name="description">` |
| `og:image` / `twitter:image` | override → the first content picture on the page → the fallback image in settings |
| `og:image:alt` | override → that picture's own `alt` |
| `og:image:width` / `height` / `type` | parsed from the image's file name, only when it carries `-<w>x<h>.<ext>` |
| `og:url`, `<link rel="canonical">` | override → site address + the page's route |
| `og:type` | override → `article` for a journal entry, else the default |
| `og:site_name`, `og:locale`, `twitter:card`, `twitter:site` | settings |
| `<meta name="description">` | **replaced in place** with the page's own, when one is known; **inserted** when the page has none |
| `<link rel="icon">`, `<link rel="apple-touch-icon">` | the `favicon` / `appleTouchIcon` settings (touch icon falls back to the favicon); skipped where the page already has one |

Nothing is emitted blank. No site address means no `og:image`, no `og:url` and no
canonical link — the networks reject relative values, and a relative `og:image`
is not "degraded", it is a broken card.

## The two facts that make it work

### 1. `slug` does not identify an article

`applyPublishedHtmlPipeline` hands the filter `{ siteId, pageId, slug }`. For an
entry page those come from the merged TEMPLATE, not the row:

```ts
// publicRenderer.ts → renderPublishedDataRowTemplate
return { ...rendered, pageId: merged.id, slug: merged.slug, siteId: … }
```

So all 43 articles arrive as `slug: "post"` with one shared `pageId`. Keying off
`slug` gives every article the same share card, and it looks like it is working
until somebody shares two of them.

The same function sets `merged.title = row.cells.title` immediately before
rendering, so `<title>` *is* the article's own. The resolver matches slug first
and falls back to a title lookup, preferring the title match when the slug's page
disagrees with the document title. The live gate
(`../../instatic-site/gates/seo-head-check.mjs`) checks every published URL has a
**distinct** `og:url` and canonical, which is the check that would catch a
regression here.

### 2. The filter has to be synchronous

It runs inside the QuickJS worker via an RPC round-trip
(`runHookFilterInWorker`); calling `api.cms.content.*` from inside it would be a
second round-trip while the host awaits the first. Everything the filter needs is
loaded into an in-memory mirror on `publish.before` — which the pipeline
`await`s — behind a 10-second floor, so a 37-page publish reloads the content
table once rather than 37 times.

## Idempotence

A page that already carries `og:title` is returned untouched. A re-publish, a
republish, and running after another plugin's `publish.html` filter are all safe.
The test suite asserts `filter(filter(x)) === filter(x)`.

## The admin page

`Open Graph` in the admin sidebar. Three things:

- **Change many pages at once** — set one field across everything that matches
  a kind and an optional slug prefix. `{title}`, `{slug}`, `{url}` and
  `{description}` interpolate per page. Preview is a dry run; nothing is written
  until Apply.
- **A searchable list of all 80 pages**, `●` where an override exists.
- **A per-page editor**, in a popup, showing what the page derives today above
  the fields that override it. Closes on Escape, on the backdrop, and on Close.

## Every page is populated

`populate-seo.mjs` writes an explicit override for all 80 pages and articles —
title, description, the page's own picture and its alt, and the type — so every
row is filled in and editable rather than implied. Two values are deliberately
left deriving: the **canonical URL** (it comes from the site-address setting, and
freezing 80 absolute URLs would make a domain change an 80-row edit) and
**og:description on the 7 pages with no `seoDescription`** (the derived value
there is the site-wide sentence, and freezing that would re-create the defect
this plugin removed).

The script is idempotent, and that is the point: materialising a derived value
stops it tracking its source, so **re-running it is the re-sync** after a title
or description changes in the CMS.

## The API

Everything the admin page does, it does over these routes. They are the answer
to "change the whole site at once", and they are all under
`/admin/api/cms/plugins/brandklout.open-graph/runtime/`.

| method | path | gate | what |
| :--- | :--- | :--- | :--- |
| GET | `/pages` | any admin session | every page and article, its derived values, and its override |
| POST | `/override` | `content.manage` | upsert one page's override |
| DELETE | `/override` | `content.manage` | remove one, so the page falls back to derived |
| POST | `/bulk` | `content.manage` | one field across a matched set — **dry run by default** |
| POST | `/preview` | `content.manage` | the exact tags a given page's HTML would receive |

```bash
# every journal article gets one share image, previewed first
curl -sX POST .../runtime/bulk -H 'content-type: application/json' -d '{
  "match": { "kind": "entry" },
  "set":   { "image": "/uploads/journal-card.jpg" }
}'
# …then written
… -d '{ "match": {"kind":"entry"}, "set": {"image":"/uploads/journal-card.jpg"}, "dryRun": false }'
```

`dryRun` defaults to **true** and the response has the same shape either way, so
the preview and the result can be diffed.

## Install

```bash
cd deliver/process/tools/instatic-plugins
node install-plugin.mjs open-graph            # dry run: packs from source, shows the grants
node install-plugin.mjs open-graph --apply    # one site; plugins.mjs rollout for several
```

Back the site up first: a `publish.html` filter changes every published page at the
next publish. Then configure it and publish. The plugin ships with empty defaults on
purpose — a share image, a site address, a favicon and a practice name belong to one
client, not to a package. Each client keeps its own configure script
(`configure-seo-plugins.mjs` in Dr. Nahlah's worktree, `configure-seo.mjs` in Mason
Park Kids'), idempotent, printing a diff before `--apply`.

## Configure it, per client

- **`siteUrl`** is the PUBLIC address, scheme included, no trailing slash. With it
  empty the plugin emits no image, no `og:url` and no canonical at all (Mason Park
  production ran that way for weeks). Re-check it at every domain cutover, and on a
  staging host set it to the STAGING host (see
  [staging-clone.md](../../instatic-site/staging-clone/staging-clone.md)).
- **`deriveFromPage`** (on by default) is what makes it work at scale: a page with no
  override takes its title from its `<title>`, its description from its SEO
  description, and its image from the first picture on the page.
- **`favicon`** (1.2.0+): a media-library path or an https URL, square PNG of at
  least 48x48. Set it on every site; the platform has no favicon setting of its own.
- **Per-page descriptions depend on the `pages` table.** A site whose rows have a
  `seoDescription` cell (Dr. Nahlah's) needs nothing further. A site whose rows are
  only `title, slug, body` (Mason Park Kids) has nowhere to put one: write the
  plugin's override store instead, `POST .../runtime/override` with
  `{ key: <slug>, description, url, enabled: true }`. Kids'
  `03-core-pages/.tmp/populate-seo.mjs` sourced each description from the local
  build's `<meta>`, then the WordPress recovery mirror, then the page's opening
  paragraph, and reported which one each page used.
- **Overrides are plugin records, and they do not travel** in a site export or a
  staging clone. Count them on both sides.

When a head diff gate (a client's `diff-live.mjs`) compares the local build with the
published page, two differences are expected: live JSON-LD has **more** than local
(aeo-schema adds `WebPage`, `WebSite`, `BreadcrumbList`), and `viewport` / `themeColor`
never match because the platform owns them.

## Test and verify

```bash
node test-open-graph.mjs           # 64 assertions, off-platform
node test-open-graph.mjs --live    # + the filter over the real published pages (needs INSTATIC_BASE_URL)
node ../../instatic-site/gates/seo-head-check.mjs   # the LIVE gate: every published URL
```

`test-` proves the filter transforms HTML correctly. The live gate proves the host
calls it, that both plugins are enabled and configured, and that every one of the
published URLs carries a unique, absolute, matching `og:url` and canonical.

## What it deliberately does not do

- **It does not rewrite `<title>`.** Page titles on this site are already the SEO
  titles. Article titles are the article's own rather than `seoTitle`; changing
  that is a decision about the site's copy, not a plugin default.
- **It does not upload or resize an image.** `og:image` should be 1200x630;
  the plugin points at whatever it is given and says so in the settings help.
- **It does not touch page content.** `cms.content.read` is read-only and scoped
  to `pages`, `posts` and (1.2.1+) `articles` in the manifest's `contentAccess[]`.

## Version Control

Follows the version control rules in
[SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md). The packaged `.zip` under
`output/` is a build artifact and is not committed.
