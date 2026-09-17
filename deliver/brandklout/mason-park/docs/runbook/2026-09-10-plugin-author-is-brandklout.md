# 2026-09-10 — plugin author is Brandklout on https://www.masonparkdental.com

The Instatic plugins on this instance said `Webzite Studio / https://webzite.studio`
in the admin's plugin list. They now say **Brandklout / https://brandklout.com/**.

## Done

| plugin | id | version reinstalled |
| :--- | :--- | :--- |
| AEO Schema | `webzite.aeo-schema` | 1.2.0 |
| Open Graph | `webzite.open-graph` | 1.1.2 |
| Link Editor | `webzite.link-editor` | 1.0.2 |
| Embed Origins | `webzite.embed-origins` | 1.4.0 |


Each was repacked from the worktree source with `pack-plugin.mjs` and reinstalled
with `install-plugin.mjs --apply` **at the same version** — the manifest's
`author` block is the only change. All came back `lifecycleStatus: active`,
`lastError: null`. Settings were snapshotted before and compared after: identical.


Source commit on this branch: `c53f7e06`. The repo-wide record is
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
- **Live embed-origins here is 1.4.0 while this worktree's source says 1.5.1**, and
  the two are byte-identical apart from the version string. It was reinstalled as
  1.4.0 to leave live where it was; the stale bump is still unresolved. The four
  packages were built from `18-instatic-embeds/.tmp/pkg/` (sources copied in from
  `bk-dr-nahlah`, which is where aeo-schema, open-graph and link-editor live).
- All 78 pages have **no** Open Graph override and empty `seoTitle`/`seoDescription`.
  That predates this run — the plugin derives everything from the page.

## Version Control

Tracked with the repo. Follows the runbook rules in [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
