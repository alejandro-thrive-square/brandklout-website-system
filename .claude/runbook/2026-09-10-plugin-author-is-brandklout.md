# 2026-09-10 — Instatic plugin author is Brandklout, not Webzite Studio

The four in-house Instatic plugins carried `author: Webzite Studio /
https://webzite.studio` in their manifests. The client is Brandklout and the
plugins ship on Brandklout sites, so the author is now **Brandklout /
https://brandklout.com/** — in every source copy and on every live instance
that has them installed.

## Done

**Source (21 `plugin.json` files, 14 branches).** `author.name` -> `Brandklout`,
`author.url` -> `https://brandklout.com/`. Nothing else in any manifest changed.

| branch | files | commit |
| :--- | :--- | :--- |
| `main` | 2 | this commit |
| `bk-dr-nahlah` | 5 (the four plugins + the process copy of embed-origins) | `c09b934e` |
| `bk-mason-park-kids` | 3 | `372b5070` |
| `bk-arvada` `bk-grand-mission` | 1 each | `743e94f4` |
| `bk-ifa-dentistry` | 1 | `8e7f808a` |
| `bk-legacy-dental` `bk-livewell` | 1 each | `f3ff2260` |
| `bk-marvel-dental` | 1 | `f8f1f1b3` |
| `bk-mason-park` | 1 | `c53f7e06` |
| `bk-stone` | 1 | `defd7cc4` |
| `bk-stone-dental` | 1 | `8c7776e2` |
| `bk-stone-med-spa` | 1 | `c7701fb3` |
| `bk-west-la-implants` | 1 | `958abb00` |

(Several branches share a SHA because they sit on the same base commit and the
patch is identical.)

**Live (11 installs, 3 instances).** Repacked with `pack-plugin.mjs` and
reinstalled with `install-plugin.mjs --apply`, each from the worktree whose
`.env` holds that instance's credentials:

| instance | plugins reinstalled |
| :--- | :--- |
| `https://www.drnahlah.com` | aeo-schema 1.2.0, open-graph 1.1.2, link-editor 1.0.2, embed-origins 1.4.0 |
| `https://www.masonparkdental.com` | same four, same versions |
| `https://mason-park-kids.up.railway.app` | aeo-schema 1.2.0, open-graph 1.1.3, embed-origins 1.4.0 |

All eleven came back `lifecycleStatus: active`, `lastError: null`, author
`Brandklout https://brandklout.com/`. Settings compared before/after per plugin:
identical. Stored rows intact — Dr. Nahlah 80 OG overrides + 81 schema entries,
Kids 215 + 215. Stone Surgical Arts and Stone Med Spa are live instances with
**no plugins installed**, so nothing to do there; the other eight clients have no
Instatic instance provisioned yet (their `INSTATIC_BASE_URL` is commented out in
`~/.webzite/.env`).

## Gotchas

- **The plugin ids stay `webzite.*`.** `webzite.aeo-schema`,
  `webzite.open-graph`, `webzite.link-editor`, `webzite.embed-origins`. The id
  keys the installed record, the plugin's settings and resource storage, the
  module id (`webzite.embed-origins.embed`) written into every page that carries
  an Embed block, the asset base path, and the `data-aeo="webzite.aeo-schema"`
  marker the schema filter matches to replace its own block on republish.
  Renaming it is a different, much larger job: uninstall, reinstall under the new
  id, re-enter every setting, rewrite every embed block's module id. Only the
  display author changed here.
- **Reinstalling the SAME version works and preserves settings.** No version bump
  was needed; `POST /admin/api/cms/plugins/package` replaces the package in place
  and the plugin's storage survives, verified on all three instances.
- **Credentials are per client**, so an install must run from that client's
  worktree — `insta-api.mjs` walks up from its own directory for the `.env`.
  Running Dr. Nahlah's copy of `install-plugin.mjs` from another worktree still
  hits Dr. Nahlah's instance.
- **The per-worktree installers have different grant tables.**
  `18-instatic-embeds/install-plugin.mjs` on `bk-mason-park-kids` grants
  embed-origins only and REFUSES the SEO pair; those go through
  `19-instatic-seo/install-plugin.mjs`. `bk-mason-park`'s copy grants all four.
- **Mason Park's live embed-origins is 1.4.0 while its worktree source says
  1.5.1** — and the two are byte-identical apart from that version string. It was
  reinstalled as 1.4.0 to keep live exactly where it was; the stale bump is
  unresolved.
- Mason Park has **zero** OG overrides and empty `seoTitle`/`seoDescription` on
  all 78 pages. That predates this run (no runbook mentions populating them) —
  the plugin is deriving everything from the page.

## Next

- Decide whether Mason Park's embed-origins version number should be 1.4.0 or
  1.5.1 and make source and live agree.
- Stone Surgical Arts and Stone Med Spa get the plugins with the new author
  automatically whenever they are first installed.

## Version Control

Tracked with the repo. Follows the runbook rules in
[SYSTEM_RULES.md §5](../../SYSTEM_RULES.md).
