# 2026-09-25 — Open Graph, meta descriptions, canonicals and the practice schema, filled in

The client: "The opengraph please".

**Before:** every page's share card had a title and nothing else: no image, description, page URL
or site name, and a small card. No page had a meta description or a canonical. The schema's `Dentist`
had no name, address or phone. Every Open Graph and AEO Schema setting was empty on both instances.

**Done on both instances.** `bugherd/check-open-graph.mjs`: production 253 URLs, staging 223 URLs,
0 problems.

## What changed

- **`brandklout.open-graph` 1.2.2** (`deliver/process/18-instatic-embeds/open-graph`):
  - 1.2.1 adds read access to the `articles` table. The plugin saw only `pages`/`posts`, so the
    161 articles got no URL or description.
  - 1.2.1 also inserts `<meta name="description">` when the page has none. "Sync meta description"
    only replaced an existing tag, and Instatic emits none, so no page had one.
  - 1.2.2 indexes entries by SEO title too. The article template renders `seoTitle` as `<title>`,
    so every article resolved to the template (`og:url /blog-article`, `og:type website`).
- **Settings** (`bugherd/set-open-graph.mjs`, read-merge-write):
  - `siteUrl` = each instance's own host, so staging never points at production (staging keeps
    canonicals off).
  - `siteName` "Mason Park Dental of Katy".
  - A 1200x630 fallback share image, `mp-share-default-1200x630.jpg`, cut from the Contact hero by
    `og/render-share-image.mjs`. The building photo was rejected because its sign says
    "Children's Dentistry".
- **Descriptions**, one override per page:
  - 63 rebuilt pages use the build's own `<meta name="description">` (`og/page-descriptions.json`).
  - 24 production-only old pages use descriptions written from their own copy
    (`og/old-page-descriptions.json`), with doctors in full and Dr. Cho first.
  - Articles use their `seoDescription` directly.
- **Images:** each page shares its own hero photo (the logo is skipped), with two overrides:
  - the **home** page uses the three-doctors photo instead of the Nguyen and Sung family hero,
    which would have left Dr. Cho off the card ("Dr. Cho leads");
  - `/dental-implant-costs-esp` uses the fallback, because its first image hotlinks a 404.
- **Schema** (`bugherd/set-schema.mjs`):
  - `organizationJson` carries the practice: name, url, logo, the **public** phone, email,
    address, opening hours and Facebook.
  - The pool swaps visible numbers only, never the schema.
  - Every page now emits a `Dentist` with `@id`, a `WebPage` and breadcrumbs.

## Gotchas

- `/admin/api/cms/plugins/<id>/runtime/pages` returns a bare array. Override writes are slow (the
  plugin refreshes its mirror after each one), so 63 take about 2 minutes.
- A gate run that overlaps a publish sees a page with no head tags at all. Re-run before believing it.
- Portrait heroes (1536x2046) are cropped to 1.91:1 by the networks; they work, but landscape reads better.

## Open

- The share preview is not verified in Facebook's Sharing Debugger (it needs a Facebook login).
  Run it once, and use it to refresh anything shared before today.
- `aeo-schema` is still 1.2.0 with no `articles` access, so articles get no `Article` node.

## Version Control

This run file follows the runbook rules in [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
