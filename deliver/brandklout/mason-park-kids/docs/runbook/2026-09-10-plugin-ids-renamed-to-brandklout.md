# 2026-09-10 — plugin ids renamed to `brandklout.*` on Mason Park Kids

The plugins moved from `webzite.*` to `brandklout.*`. Ids are load-bearing, so this was a
migration, not an edit: export -> install the new id -> import settings and records ->
rewrite the embed nodes -> disable the old -> publish -> verify -> uninstall.

## Done (bdccdd03)

| instance | plugins | data carried across | pages rewritten |
| :--- | :-- | :--- | :-- |
| `mason-park-kids.up.railway.app` | 3 | **216 Open Graph overrides**, all settings | 0 (no embeds) |


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
- **This site runs `open-graph` 1.1.3 while the others run 1.1.2, and the difference matters**:
  1.1.3 INSERTS `<meta name="description">` when the site has no site-wide one, which is this
  site's case. The shared package set was 1.1.2, so the swap briefly downgraded it — caught
  before publishing and reinstalled from `19-instatic-seo/`. Pack from the source that matches
  the instance, never from whichever folder is nearest.

## Version Control

Tracked with the repo. Follows the runbook rules in [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
