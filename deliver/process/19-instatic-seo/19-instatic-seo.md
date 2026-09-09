# 19 — Instatic SEO: the head tags a published page does not get

Two Instatic plugins, and the scripts to install them:

| Plugin | Version | What it writes into `<head>` at publish |
| :--- | :--- | :--- |
| `webzite.open-graph` | 1.1.3 | Open Graph + Twitter Card tags, `<link rel="canonical">`, and the page's own `<meta name="description">` |
| `webzite.aeo-schema` | 1.2.0 | one `application/ld+json` graph per page: the organisation, the WebSite, the WebPage, a BreadcrumbList |

## The problem they solve

**A published Instatic page has almost no `<head>`.** `buildDocumentMetaTags`
(`src/core/publisher/render.ts`) writes the title, ONE site-wide description and
the favicon, and that is all. There is no `og:`, no `twitter:`, no canonical
link and no structured data anywhere in the source.

A page row is a title, a slug and a body. Everything an HTML build puts in its
head — the description, the canonical, the og tags, the JSON-LD — is dropped on
the way in and there is nowhere to put it back. Every workflow that has imported
a hand-built site into Instatic has recorded this as an open item and none had
closed it.

On Mason Park Dental for Kids, 2026-09-09, that was **228 of the 285 faults**
an audit of all fifty-seven live routes counted: four per page (no description,
no canonical, no `og:title`, no JSON-LD) on every page of the instance,
redesigned and migrated alike.

## Install

`INSTATIC_BASE_URL`, `INSTATIC_EMAIL` and `INSTATIC_PASSWORD` in the repo-root
`.env` decide which site this touches. **Back the site up first**
(`backup-site.mjs` in the client's workflow), because installing a plugin that
filters `publish.html` changes every published page.

```bash
cd deliver/process/19-instatic-seo
node ../18-instatic-embeds/pack-plugin.mjs open-graph .tmp/open-graph.zip
node ../18-instatic-embeds/pack-plugin.mjs aeo-schema .tmp/aeo-schema.zip
node install-plugin.mjs .tmp/open-graph.zip            # dry run: shows the grants
node install-plugin.mjs .tmp/open-graph.zip --apply
node install-plugin.mjs .tmp/aeo-schema.zip --apply
```

`pack-plugin.mjs` is 18's, deliberately: it is the one that writes forward-slash
zip entries, and `Compress-Archive` on Windows writes backslashes, which
installs a plugin whose `server/index.js` can never be found — a failure that
surfaces later as a plugin parked in `error`, not as a bad zip.

`install-plugin.mjs` here is NOT 18's. The grant list is the security review
written down, and keeping the embed plugin's and the SEO plugins' in separate
files means widening one can never silently widen the other. Both plugins ask
for the same six permissions; the reasoning per permission is in that file.

## Then configure it, per client

The plugins ship with **empty defaults on purpose**: a share image, an address
and a telephone number are facts about one practice and have no business inside
a package another client installs. Each client's workflow holds its own
configure script. For Mason Park Kids that is
`deliver/brandklout/mason-park-kids/workflows/03-core-pages/.tmp/configure-seo.mjs`,
which is idempotent and prints a diff before `--apply`.

The two settings that matter most:

- **`siteUrl`** is the PUBLIC address, with scheme and no trailing slash. The
  networks refuse a relative `og:image` and a relative `og:url`, so with this
  empty the plugin emits no image, no `og:url` and no canonical at all. On a
  site whose domain has not been cut over yet this is the value to re-check at
  cutover.
- **`deriveFromPage`** (on by default) is what makes the plugin useful at scale:
  a page with no override takes its title from its own `<title>`, its
  description from its SEO description, and its image from the first picture on
  the page. Nobody types fifty-seven sets of tags.

## Per-page descriptions, and the cell that may not exist

`syncMetaDescription` replaces the site-wide description with the page's own.
Where "the page's own" comes from depends on the site:

- Sites whose `pages` table has a **`seoDescription` cell** (Dr Nahlah's does)
  need nothing further — the admin already has the field and it is already
  filled in.
- Sites where the rows are only **`title, slug, body`** (Mason Park Kids) have
  nowhere to put one. Use the plugin's **override store** instead, which is the
  designed mechanism and needs no schema change:
  `POST /admin/api/cms/plugins/webzite.open-graph/runtime/override`
  with `{ key: <slug>, description, url, enabled: true }`.
  `03-core-pages/.tmp/populate-seo.mjs` is the worked example: it sources each
  description from the local build's own `<meta>`, then from the WordPress
  recovery mirror, then from the page's own opening paragraph, and reports which
  of the three each page used.

> [!IMPORTANT]
> **v1.1.3 fixes a bug that only shows on a site with no site-wide description.**
> The filter used to REPLACE an existing `<meta name="description">` and do
> nothing when there was none — and there is none whenever `settings.metaDescription`
> was never filled in. The result was a site whose `og:description` was perfect
> and whose `<meta name="description">` was absent on every page. It now inserts
> when there is nothing to replace. The guard against duplicates is unchanged:
> it only inserts on the branch that has already established no tag exists.

## Verifying

The plugins run at PUBLISH, so nothing changes until the next publish.

```bash
curl -s https://<site>/ | grep -oE '<meta name="description"[^>]*>|<link rel="canonical"[^>]*>'
```

The client-side gates that catch a regression: `audit-live.mjs` (walks every
route and counts a missing description, canonical, og:title or JSON-LD as a
fault) and `diff-live.mjs` (compares the local build's head against the
published one). Both live in the client's workflow.

Two differences `diff-live.mjs` will still report, and both are correct:

- **`jsonLd` live has MORE than local.** The plugin adds `WebPage`, `WebSite`
  and `BreadcrumbList` around whatever organisation schema the page declared.
- **`viewport`, `themeColor` and `favicon` never match.** The platform owns
  those three lines of the published head and neither plugin touches them.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../SYSTEM_RULES.md).
Both plugin folders are committed in full — they are the artifact. `.tmp/` holds
only the built zips, which the root `.gitignore` refuses.

The two plugins were written in the `bk-dr-nahlah` worktree
(`deliver/brandklout/dr-nahlah/workflows/16-instatic-plugins/`) and were
promoted here on 2026-09-09, which the parent practice's workflow 10 README had
been asking for: they belong on every new Instatic site, and a plugin that lives
in one client's folder cannot be installed on another client's site without
copying it. **`16-instatic-plugins` remains the place they are developed and
tested** (`test-open-graph.mjs`, `test-aeo-schema.mjs`, `verify-seo-plugins.mjs`
are there and were not copied); this folder is the place they are shipped from.
Changes made here — like the 1.1.3 insert fix — must be carried back.
