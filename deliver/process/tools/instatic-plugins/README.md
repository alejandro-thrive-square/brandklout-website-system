# tools/instatic-plugins

One home for every Brandklout Instatic plugin: the source, the registry of what is released and
who must carry it, and the scripts that pack, install, upgrade and verify them on every site,
production and staging. The process that uses it is
[Scenario 4 · Update Plugins Across Sites](../../scenario-4-update-plugins/README.md); new sites get
their plugins in [Scenario 0 step 01](../../scenario-0-new-site/01-client-inquiry/01-client-inquiry.md).

Built 2026-09-23. Before this, the four plugins lived in client folders
(`bk-dr-nahlah/.../16-instatic-plugins/`, `bk-brandklout-website/.../16-instatic-plugins/`,
`bk-mason-park-kids/deliver/process/19-instatic-seo/`) and embed-origins in
`tools/instatic-embeds/`, with a different installer and grant table in each worktree. The
versions had drifted apart: Dr. Nahlah's production ran embed-origins 1.8.0 while this repo's source
said 1.7.0, and Kids ran open-graph 1.1.3 while every other copy said 1.1.2.

## The plugins

| Id | Source | Released | What it does | Tests |
| --- | --- | --- | --- | --- |
| `brandklout.embed-origins` | [`embed-origins/`](embed-origins/README.md) | 1.8.0 | Embed block + per-page CSP; `siteScripts` on every page, `#consent=`, `pages=` / `except=` scoping | `test-embed-origins.mjs` (85), `test-embed-module.mjs` (54) |
| `brandklout.open-graph` | [`open-graph/`](open-graph/README.md) | 1.1.3 | og/twitter tags, canonical, per-page meta description (inserted when the site has none) | `test-open-graph.mjs` (64) |
| `brandklout.aeo-schema` | [`aeo-schema/`](aeo-schema/README.md) | 1.2.0 | one JSON-LD `@graph` per page, managed from the admin and a bulk API | `test-aeo-schema.mjs` (92) |
| `brandklout.link-editor` | [`link-editor/`](link-editor/README.md) | 1.0.2 | Link URL panel in the editor rail; editor-only, nothing on published pages | `verify-link-editor.mjs` (needs the Instatic source checkout, `--host=<path>`, default `C:\ifork\Instatic-main`) |

Where each came from, and why that copy: embed-origins 1.8.0 from `bk-dr-nahlah`
`deliver/process/18-instatic-embeds/` (superset of 1.7.0, live on Dr. Nahlah); open-graph 1.1.3
from `bk-mason-park-kids` `deliver/process/19-instatic-seo/` (1.1.2 plus the description insert;
admin and README byte-identical); aeo-schema 1.2.0 and link-editor 1.0.2 from `bk-dr-nahlah`
`workflows/16-instatic-plugins/` (aeo-schema is byte-identical on all three branches that carry it;
link-editor exists only there). `bk-brandklout-website` vendored open-graph 1.1.2 and aeo-schema
1.2.0 verbatim from Dr. Nahlah; nothing there is newer. No other `bk-*` branch has a plugin source
that is not one of these.

## The registry: `plugins.json`

- `plugins.<id>`: `dir`, `version` (the only version anyone installs), `grants` (the security
  review: install grants exactly this list), `why` per permission, `changelog`, `tests`,
  `publishes` (false for editor-only plugins).
- `defaults`: the set every site carries (embed-origins, open-graph, aeo-schema).
- `sites.<client>`: overrides (`link-editor` on Dr. Nahlah and Mason Park) and notes.
- Hosts are not here. `../instatic-domain-origins/sites.json` owns them: `<client>` is production,
  `<client>-staging` is staging. Credentials come from the `[<client>]` section of
  `~/.webzite/.env`; staging uses the same login.

Every command refuses to run if `plugins.json` and a `plugin.json` disagree on id or version, if a
version has no changelog line, or if a manifest asks for a permission the registry does not grant.

## Scripts

All Node 18+, no install. Dry run unless `--apply`. On Windows redirect output to a file
(`> output/x.log 2>&1`); Node 24 can die when stdout is a pipe.

| Script | Purpose | Usage | Origin |
| --- | --- | --- | --- |
| `plugins.mjs` | The fleet tool: `registry`, `test`, `pack`, `status`, `rollout`, `verify` | see below | New 2026-09-23. Reuses the fleet loop and drift check of `../instatic-embeds/rollout-site-scripts.mjs`, the export and verify checks of `../instatic-api-sync/migrate-plugin-ids.mjs`, `../instatic-site/ops/backup-site.mjs`, `../instatic-site/gates/seo-head-check.mjs` |
| `install-plugin.mjs` | One plugin on one site (the worktree's `INSTATIC_BASE_URL`) | `node install-plugin.mjs <name> [--apply] [--allow-downgrade]` | `tools/instatic-embeds/install-plugin.mjs` merged with the per-id GRANTS version in `bk-dr-nahlah` `16-instatic-plugins/install-plugin.mjs` |
| `pack-plugin.mjs` | Deterministic zip, forward-slashed entries; now creates its output folder | `node pack-plugin.mjs <dir> <out.zip>` | moved from `tools/instatic-embeds/` |
| `lib/fleet.mjs` | Registry loader and checks, master env reader, host resolver | imported | `readMaster()` moved from `rollout-site-scripts.mjs`, which imports it now |
| `lib/install.mjs` | Inspect with no grants, check id, version, grants, downgrade and old id, install | imported | `bk-dr-nahlah` `16-instatic-plugins/install-plugin.mjs` |
| `lib/pack.mjs` | `output/packages/<id>-<version>.zip` from source | imported | new |
| `test-*.mjs`, `verify-link-editor.mjs` | Offline suites, no site | `node plugins.mjs test` | `bk-dr-nahlah` `16-instatic-plugins/` and `18-instatic-embeds/`. The aeo and og suites still matched the old `webzite.` markers after the 2026-09-10 rename; fixed here (the og one had been passing vacuously). |

```bash
cd deliver/process/tools/instatic-plugins
node plugins.mjs registry                                   # released versions, who carries what
node plugins.mjs test --plugin open-graph                   # offline suites
node plugins.mjs status > output/status.log 2>&1              # every site, production and staging, read-only
node plugins.mjs rollout --plugin open-graph --sites expected --env staging            # dry run
node plugins.mjs rollout --plugin open-graph --sites mason-park --env staging --apply --publish
node plugins.mjs verify  --plugin open-graph --sites mason-park --env staging
node plugins.mjs rollout --plugin open-graph --sites mason-park --env production --apply --publish
```

`status` prints one row per host and one cell per plugin: `ok`, `OLD` (behind the release),
`AHEAD` (the site runs something newer than the source: stop and bring the source in), `MISSING`,
plus `DRIFT` when the draft differs from what is live. Then issues: old `webzite.*` ids, disabled
or errored plugins, and `PARITY` (staging and production on different versions). It writes
`output/status/status-<stamp>.json`.

`rollout`, per host, one at a time, stops at the first failure:

1. Reads the plugin row, settings, stored records and the draft state.
2. Refuses: the old `webzite.*` id (run `../instatic-api-sync/migrate-plugin-ids.mjs`), a
   downgrade, a production host whose staging is not already on the release, a client with no
   staging host (unless `--no-staging-ok`), a publish over drafts (unless `--allow-drift`).
3. Snapshots `plugin-before.json` (settings and every record) and runs `ops/backup-site.mjs`, under
   `output/rollouts/<stamp>-<plugin>-<version>/<host>/`.
4. Installs the package rebuilt from source with the registry grants.
5. Checks the row is active and enabled on the release, every setting unchanged, record counts equal.
6. With `--publish`: publishes, only if the draft still matches what is live. A fresh install is
   never published (its settings are empty).
7. Verifies the published pages: one of each tag, JSON-LD parses, no `unknown module`, no `webzite.`
   marker, site-script tags present, module-js served. On production for open-graph and
   aeo-schema, `seo-head-check.mjs` failures must not grow.

`verify` runs step 7 on its own, read-only.

## First status, 2026-09-23 (read-only, all 14 hosts reachable)

| Site | Production | Staging |
| --- | --- | --- |
| dr-nahlah | embed 1.8.0, og 1.1.2, aeo 1.2.0, link 1.0.2 | embed **1.5.1**, og 1.1.2, aeo 1.2.0, link 1.0.2 |
| mason-park | embed 1.6.0, og 1.1.2, aeo 1.2.0, link 1.0.2 | embed **1.5.1**, og 1.1.2, aeo 1.2.0, link 1.0.2 |
| mason-park-kids | embed 1.6.0, og 1.1.3, aeo 1.2.0 | none (production is served at `staging.masonparkpediatricdental.com`) |
| brandklout-website | embed 1.5.1, og 1.1.2, aeo 1.2.0 | same |
| institute-for-advanced-dentistry | embed 1.6.0, **no og, no aeo** | same |
| stone-surgical-arts, stone-med-spa | embed 1.6.0, **no og, no aeo** | same |
| west-la-implants | embed 1.6.0, **no og, no aeo** | none |

Every draft matched live. No site runs 1.7.0 even though the Termly rollout used `#consent=`; no
live `siteScripts` line carries a consent tag today.

## Gotchas

- **An old package installs the old id.** Anything packed before 2026-09-10 is `webzite.*`.
  `install-plugin.mjs` takes a plugin name, never a zip, and always rebuilds from source.
- **The id is load-bearing; a rename is a migration** (settings, records with `on delete cascade`,
  the module id in every page). `migrate-plugin-ids.mjs`, not an install.
- **Never install older than live.** Kids was briefly downgraded from open-graph 1.1.3 to 1.1.2 on
  2026-09-10, and Brandklout's embed-origins from 1.6.0 to 1.5.1 on 2026-09-15, because each ran the
  package from the worktree at hand. 1.7.0 over 1.8.0 would put both DNI pools on every Dr. Nahlah
  page.
- **Reinstalling a package replaces it in place and keeps settings and records** (verified on three
  instances 2026-09-10). `rollout` still compares them key by key.
- **A plugin that declares no settings 400s on the settings route** (link-editor). The scripts ask
  the manifest first.
- **Plugins do not travel.** A duplicated Railway environment and a site export both come up with
  zero plugins and look fine; a staging clone silently lost canonical, og and JSON-LD on Dr. Nahlah.
  `../instatic-site/staging-clone/clone-plugins.mjs` copies code and settings from a source instance.
- **Staging settings are not production settings.** Staging runs `emitCanonical: false`, no GTM and
  no number pool. Match versions, never copy `siteScripts` from production to staging: the clone
  would claim real pool numbers.
- **`publish.html` changes reach pages only at the next publish**, and a publish bakes every page,
  drafts included. `/_instatic/module-js/<id>.js` is rebuilt against the live registry, so an
  upgraded embed module serves at once.
- **A plugin setting's `description` is capped at 500 characters**; over it `inspect-package`
  answers `400 Invalid plugin manifest: Expected union value`. `keywords` must match
  `^[A-Za-z0-9_-]{1,30}$`. `contentAccess[]` entries are keyed `table`.
- **A module change needs a plugin version bump**: the editor imports
  `/uploads/plugins/<id>/<version>/modules/index.js`, keyed on the plugin version.
- **Reload the editor tab after installing an editor plugin**; plugins activate at admin boot.
- **A `publish.html` filter must be synchronous**: read only `api.cms.settings.get`, or preload in
  `publish.before`.
- **Known flaw in embed-origins 1.8.0**: the glob escape is `'\$&'` (should be `'\\$&'`), so a `.`
  in a `pages=` / `except=` glob matches any character. Harmless for today's slugs. Fix as 1.8.1.
- **Five failed logins lock an admin.** `status` never tries a host without a password in the
  master, and a failed login is reported, not retried.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md). Plugin source, tests, scripts,
`plugins.json` and this README are committed; `output/` (packages, status, rollout snapshots, which
hold plugin settings and records) is not.
