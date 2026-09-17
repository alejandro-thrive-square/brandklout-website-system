# 2026-09-10 — plugin ids renamed to `brandklout.*` on Mason Park — production and staging

The plugins moved from `webzite.*` to `brandklout.*`. Ids are load-bearing, so this was a
migration, not an edit: export -> install the new id -> import settings and records ->
rewrite the embed nodes -> disable the old -> publish -> verify -> uninstall.

## Done (434c6337)

| instance | plugins | data carried across | pages rewritten |
| :--- | :-- | :--- | :-- |
| `www.masonparkdental.com` | 4 | settings (no stored records on this site) | 8 (13 embed nodes) |
| `staging.masonparkdental.com` | 4 | settings | 0 |


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
- **`open-graph` here has `siteUrl` EMPTY while `emitCanonical` is on**, so production emits
  no canonical, no `og:image` and no `og:url` at all. Pre-existing; carried through the
  migration untouched and still worth fixing.
- `embed-origins` was 1.4.0 live and 1.5.1 in source, byte-identical apart from the version.
  Both instances now run 1.5.1 and the ambiguity is gone.
- Publishing production also shipped a teammate's unpublished `index` edit from 2026-08-31,
  on the user's explicit instruction.

## Version Control

Tracked with the repo. Follows the runbook rules in [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
