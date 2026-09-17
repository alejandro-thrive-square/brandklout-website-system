# 2026-09-10 — plugin author is Brandklout on https://mason-park-kids.up.railway.app

The Instatic plugins on this instance said `Webzite Studio / https://webzite.studio`
in the admin's plugin list. They now say **Brandklout / https://brandklout.com/**.

## Done

| plugin | id | version reinstalled |
| :--- | :--- | :--- |
| AEO Schema | `webzite.aeo-schema` | 1.2.0 |
| Open Graph | `webzite.open-graph` | 1.1.3 |
| Embed Origins | `webzite.embed-origins` | 1.4.0 |


Each was repacked from the worktree source with `pack-plugin.mjs` and reinstalled
with `install-plugin.mjs --apply` **at the same version** — the manifest's
`author` block is the only change. All came back `lifecycleStatus: active`,
`lastError: null`. Settings were snapshotted before and compared after: identical.
Stored rows intact afterwards: 215 Open Graph overrides and 215 schema entries.


Source commit on this branch: `372b5070`. The repo-wide record is
`.claude/runbook/2026-09-10-plugin-author-is-brandklout.md` on `main`.

## Gotchas

- **Plugin ids stay `webzite.*`** and must not be renamed: the id keys the
  installed record, the plugin's own settings and resource storage, the module id
  written into every page carrying an Embed block, the asset base path, and the
  `data-aeo="webzite.aeo-schema"` marker the schema filter matches on republish.
  Only the displayed author changed.
- **Reinstalling the same version is safe** — the package is replaced in place and
  plugin storage survives. No version bump was needed.
- The install must run **from this worktree**: `insta-api.mjs` walks up from its own
  folder for the `.env`, and the Instatic password is per client.
- **The two installers grant different things.** `18-instatic-embeds/install-plugin.mjs`
  knows only `webzite.embed-origins` and REFUSES the SEO pair with a permissions
  message; aeo-schema and open-graph go through `19-instatic-seo/install-plugin.mjs`.

## Version Control

Tracked with the repo. Follows the runbook rules in [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
