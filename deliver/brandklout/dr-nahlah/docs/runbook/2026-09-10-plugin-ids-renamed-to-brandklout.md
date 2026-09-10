# 2026-09-10 — plugin ids renamed to `brandklout.*` on Dr. Nahlah — production and staging

The plugins moved from `webzite.*` to `brandklout.*`. Ids are load-bearing, so this was a
migration, not an edit: export -> install the new id -> import settings and records ->
rewrite the embed nodes -> disable the old -> publish -> verify -> uninstall.

## Done (dc99313d)

| instance | plugins | data carried across | pages rewritten |
| :--- | :-- | :--- | :-- |
| `www.drnahlah.com` | 4 | 80 schema blocks, 80 Open Graph overrides, all settings | 5 (7 embed nodes) |
| `staging.drnahlah.com` | 4 | settings | 5 (7 embed nodes) |


`seoTitle`/`seoDescription` were restored on `contact-maclean`, `contact-alexandria` and
`patient-stories` after the page write, and every template checked intact.

Verified on the published pages: `og:title` once, one `application/ld+json` graph, no
stale `data-aeo="webzite…"` marker, no `<!-- unknown module -->`, and
`/_instatic/module-js/brandklout.embed-origins.embed.js` serving 200. Tooling:
`deliver/process/22-instatic-api-sync/migrate-plugin-ids.mjs`.

## Gotchas

- **Uninstalling a plugin deletes its stored rows** — `plugin_records.plugin_id` is
  `on delete cascade`. The export runs first and `uninstall` refuses until the new id holds
  the same record count.
- **The Embed module id follows the plugin id** (`<pluginId>.<name>`, enforced by the host).
  A node left on the old id publishes as `<!-- instatic: unknown module -->` — the embed
  disappears silently.
- **A publish is part of the migration.** `/_instatic/module-js/<id>.js` is built from the
  latest published snapshot against the live registry, so the old module-js 404s the moment
  the old plugin is disabled, even for pages already published.
- **A page write drops `seoTitle`/`seoDescription`** — the script snapshots and PATCHes them
  back, and asserts every template survived.
- **Staging is invisible to tooling that reads `INSTATIC_BASE_URL`** — `staging.drnahlah.com`
  is documented only in workflow 18 and is in no `.env` key. It was missed by the
  author-only pass earlier the same day. Worth adding as `INSTATIC_STAGING_URL`.
- Publishing production also shipped a teammate's unpublished `contact-maclean` edit from
  2026-09-04, on the user's explicit instruction.

## Version Control

Tracked with the repo. Follows the runbook rules in [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
