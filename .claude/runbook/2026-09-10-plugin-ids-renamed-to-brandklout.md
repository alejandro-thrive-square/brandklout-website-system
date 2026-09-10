# 2026-09-10 — plugin ids renamed `webzite.*` -> `brandklout.*` on all five instances

Follows [the author change](./2026-09-10-plugin-author-is-brandklout.md) earlier the same
day. The author was a metadata edit; the **id** is load-bearing, so this one is a migration
with an export, an import and a page rewrite.

## Done

**Ids.** `brandklout.aeo-schema`, `brandklout.open-graph`, `brandklout.link-editor`,
`brandklout.embed-origins`, and the Embed module is now
`brandklout.embed-origins.embed`. `embed-origins` standardised on **1.5.1** (it was
byte-identical to 1.4.0 apart from the version string, which is where Mason Park's stale
bump came from). Source renamed in every copy on all 14 branches; `install-plugin.mjs`
grant tables rekeyed; directives 16/18/19 annotated; docs and the handoff guide swept.
Runbook history keeps the old ids — it is a record of what was true then.

**New tool: `deliver/process/22-instatic-api-sync/migrate-plugin-ids.mjs`**
`export` -> `swap --zips <dir> --apply` -> `publish --apply` -> `verify` ->
`uninstall --apply`, one instance per run, state under
`.tmp/plugin-id-migration/<host>/`. `insta-api.mjs` was synced to the newest copy on every
branch (+137 lines, purely additive: `toChangedPage`, `assertTemplatesIntact`,
`templateMap`, and the `backfillTemplates` guard inside `api()`).

**Migrated, in this order — staging first, by the user's call:**

| # | instance | plugins | records carried | pages rewritten |
| :-- | :--- | :-- | :--- | :-- |
| 1 | `staging.drnahlah.com` | 4 | — | 5 (7 nodes) |
| 2 | `www.drnahlah.com` | 4 | 80 schema-blocks + 80 og-overrides | 5 (7 nodes) |
| 3 | `staging.masonparkdental.com` | 4 | — | 0 |
| 4 | `www.masonparkdental.com` | 4 | — | 8 (13 nodes) |
| 5 | `mason-park-kids.up.railway.app` | 3 | 216 og-overrides | 0 |

19 installs. Every instance ends with only `brandklout.*`, all `active`, author
`Brandklout https://brandklout.com/`, settings round-tripped key by key and record counts
equal before and after. All five published and verified: `og:title` once, one
`application/ld+json` graph, no stale `data-aeo="webzite…"`, no `unknown module`, and
`/_instatic/module-js/brandklout.embed-origins.embed.js` returning 200. Spot-checked
`contact-maclean` (Dr. Nahlah) and `invisalign` (Mason Park): vendor iframe present, graph
nodes `Dentist` / `WebPage`+`ContactPage` / `BreadcrumbList`, CSP intact.

Both productions carried an unpublished page edit from a teammate — `contact-maclean`
(6 days old) and Mason Park's `index` (10 days old). The user chose to publish anyway, so
those two edits went live with the migration.

## Gotchas

- **`plugin_records.plugin_id` is `references installed_plugins(id) on delete cascade`**
  (`server/db/migrations-pg.ts:380`). Uninstalling the old plugin deletes its rows. Export
  first; uninstall only after the new id holds the same count. `uninstall` refuses
  otherwise.
- **The module id is locked to the plugin id** — `validatePluginModuleId` requires
  `<pluginId>.<name>` (`moduleAdapter.ts:46`). So the rename forces a page-tree rewrite,
  and a node left on the old id publishes as
  `<!-- instatic: unknown module -->` (`renderNode.ts:309`): the embed vanishes silently,
  no error anywhere.
- **A publish is not optional.** `/_instatic/module-js/<id>.js` is rebuilt from the latest
  published snapshot against the **live registry** (`handlers/cms/moduleJs.ts`), so the
  moment the old plugin is disabled the OLD module-js 404s for pages that are already
  published. Swapping without publishing leaves those pages' auto-height helper dead until
  someone publishes.
- **A page write drops `seoTitle` / `seoDescription`** (`pageToCells` builds
  `{title, slug, body}` + template keys and nothing else). The script snapshots them per
  affected page and PATCHes them back; it restored three on Dr. Nahlah. It also asserts
  every template survived — `assertTemplatesIntact` takes a `{ slug: hasTemplate }` map,
  NOT a list of ids.
- **`GET /plugins/:id/settings` 400s for a plugin that declares no settings** —
  link-editor. Ask the manifest before asking the route.
- **Kids ran open-graph 1.1.3, everyone else 1.1.2**, and 1.1.3 is not cosmetic: it INSERTS
  `<meta name="description">` when the site has no site-wide one, which is Kids' case
  (57 of 57 pages shipped without a description before it). The shared package set was
  1.1.2, so the swap briefly downgraded Kids — caught before publishing, 1.1.3 repacked
  from `19-instatic-seo/` and installed over it. **Pack from the source that matches the
  instance.**
- **Mason Park production has open-graph `siteUrl` EMPTY with `emitCanonical: true`**, so
  the whole site emits no canonical, no `og:image` and no `og:url`. Pre-existing, carried
  through the migration untouched, and worth fixing on its own.
- Staging sets `emitCanonical: false` deliberately, so a missing canonical there is correct,
  not a regression. `verify` reads the plugin's own settings before demanding one.
- The staging instances live under `INSTATIC_STAGING_URL` (Mason Park) or nowhere at all
  (Dr. Nahlah staging is documented only in workflow 18) — which is why the author-only
  pass earlier that day missed both. **`INSTATIC_BASE_URL` is not the full instance list.**

## Next

- Add `INSTATIC_STAGING_URL` for Dr. Nahlah to `~/.webzite/.env` so staging stops being
  invisible to tooling that iterates the env.
- Decide whether Mason Park production should emit canonicals (`siteUrl`).
- Nothing carries the old ids any more except runbook history; a package built before today
  would reinstall `webzite.*`, so rebuild from source rather than reusing an old zip.

## Version Control

Tracked with the repo. Follows the runbook rules in
[SYSTEM_RULES.md §5](../../SYSTEM_RULES.md).
