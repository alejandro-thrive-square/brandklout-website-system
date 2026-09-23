# Scenario 4 · 01 Change and Version

## Purpose

Make the change in the one plugin source, give it a new version, write down what changed, and prove
it offline before any site sees it. A version number is a promise: the same number always means the
same code, on every site.

## Inputs

- The request: Asana task, BugHerd pin, runbook "Next" item, or a `plugins.mjs status` finding.
- The plugin source in `tools/instatic-plugins/<plugin>/` on the `system-v2` (or current) branch.
- `node tools/instatic-plugins/plugins.mjs status` output, to know which versions are live.

## Checklist

- [ ] Status read: no site runs a version newer than the source
- [ ] Change made in `tools/instatic-plugins/<plugin>/` only
- [ ] Version bumped in `plugin.json` (semver)
- [ ] Same version in `plugins.json`, plus a changelog line
- [ ] Grants unchanged, or widened on purpose with a reason
- [ ] Offline tests green, a new test for the change
- [ ] Package rebuilt from source
- [ ] Committed before any rollout

## Steps

1. **Read the fleet first.** `node plugins.mjs status --plugin <name> > .tmp/status.log 2>&1`.
   If any site shows `AHEAD`, that site runs code the source does not have. Stop and bring that
   source into `tools/instatic-plugins/<plugin>/` first (see Conditionals).
2. **Change the source** in `tools/instatic-plugins/<plugin>/`. Server code runs in a QuickJS
   sandbox: no `node:` or `bun:` imports, no `require(`, no network, and a `publish.html` filter must
   stay synchronous (read only `api.cms.settings.get`, or preload in `publish.before`).
3. **Pick the version.** Patch (`1.8.0` to `1.8.1`) for a fix with no new setting; minor (`1.8.0` to
   `1.9.0`) for a new setting or option; major only for a change that needs a settings migration.
   A module change always needs a plugin bump: the editor loads modules by plugin version.
4. **Bump both files in the same edit.** `"version"` in `<plugin>/plugin.json` and
   `plugins.<id>.version` in `plugins.json`. Add `plugins.<id>.changelog["<version>"]`: date, site
   that asked, one sentence on what changes on a page.
5. **Grants.** If `plugin.json` now asks for a new permission, add it to `plugins.<id>.grants` with a
   reason in `why`. Every command refuses a manifest that asks for more than the registry grants.
6. **Manifest limits.** A setting `description` over 500 characters, `keywords` outside
   `^[A-Za-z0-9_-]{1,30}$`, or `contentAccess` keyed `tableSlug` all fail at install with a 400 that
   does not name the field. Check before packing.
7. **Test offline.** Add a test for the change to the plugin's suite, then
   `node plugins.mjs test --plugin <name>`. Every suite must pass. `node plugins.mjs registry` must
   print no PROBLEMS.
8. **Pack.** `node plugins.mjs pack --plugin <name>`. The zip lands in `.tmp/packages/` and is never
   committed; it is always rebuilt from source.
9. **Commit** the source, `plugins.json` and the test on the process branch, then go to step 02.

## Conditionals

- **If a site runs a newer version than the source (`AHEAD`):** find the branch that built it
  (`git log --all -- '**/<plugin>/plugin.json'`), diff it against `tools/instatic-plugins/<plugin>/`,
  take the newer code, and record it as that version. Do not bump over it without its code.
- **If the change needs a new permission:** add it to `grants` with the reason, and say so in the
  changelog line. The person approving the rollout reads that line.
- **If the plugin id itself must change:** that is not a version. Use
  `tools/instatic-api-sync/migrate-plugin-ids.mjs` (export, swap, publish, verify, uninstall).
- **If only a client's settings must change:** not this scenario. Change settings on that site
  (`tools/instatic-embeds/set-origins.mjs` for embed-origins, the plugin admin page for the others).

## Do / Don't

- Do write the changelog line for the person who will approve the rollout, not for yourself.
- Don't edit a plugin inside a client folder or a worktree copy; there is one source.
- Don't reuse a version number for different code.
- Don't commit a zip.

## Tools

- `tools/instatic-plugins/plugins.mjs`: `status`, `registry`, `test`, `pack`.
- `tools/instatic-plugins/test-*.mjs`, `verify-link-editor.mjs`: offline suites.
- `tools/instatic-plugins/pack-plugin.mjs`: deterministic zip (called by `pack`).

## Outputs

- `tools/instatic-plugins/<plugin>/` changed, `plugins.json` version and changelog.
- `tools/instatic-plugins/.tmp/packages/<id>-<version>.zip` (not committed).

## Evidence

Repo runbooks: 2026-08-28 embed-origins canvas card (module bump needs plugin bump, pack folder
gotcha), 2026-09-10 plugin ids renamed (Kids ran 1.1.3, the shared package 1.1.2), 2026-09-12
Sienna (siteScripts 1.6.0, dedupe fix), 2026-09-22 Termly rollout (500-character description cap).
bk-dr-nahlah 2026-09-22d (1.8.0 built on the unmerged 1.7.0), bk-brandklout-website 2026-09-15 wipe
and rebuild (1.5.1 installed over a live 1.6.0).

## Version Control

Follows [SYSTEM_RULES.md §4](../../../SYSTEM_RULES.md).
