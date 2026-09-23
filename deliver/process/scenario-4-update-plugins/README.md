# Scenario 4 · Update Plugins Across Sites (Instatic)

Our own Instatic plugins (`brandklout.embed-origins`, `brandklout.open-graph`,
`brandklout.aeo-schema`, `brandklout.link-editor`) run on every Instatic site, production and
staging. This scenario changes one of them, releases a new version, and puts that version on every
site that should carry it, staging first, one site at a time, without losing a setting, a stored
record or a published tag. The FigJam board **Deliver SOP's → Scenario 4** is the same process as a
picture; when the two disagree, fix both.

Use it when:

- a plugin needs a fix or a feature (a new `siteScripts` option, a schema field, a tag change);
- `plugins.mjs status` shows drift: a site behind the release, a plugin missing, staging and
  production on different versions;
- a site is found carrying an old `webzite.*` id.

Not this scenario: a new site gets its plugins in
[Scenario 0 step 01](../scenario-0-new-site/01-client-inquiry.md); changing a plugin's SETTINGS on
one site (an origin, a site script) is [Scenario 2](../scenario-2-updates-expansions/README.md) with
[`tools/instatic-embeds`](../tools/instatic-embeds/instatic-embeds.md).

| Step | Directive | Gate to leave the step |
| --- | --- | --- |
| 01 | [Change and Version](01-change-and-version.md) | Source changed, version bumped in `plugin.json` and `plugins.json`, changelog line, `plugins.mjs test` green |
| 02 | [Rollout](02-rollout.md) | Every target site on the release, staging and production equal, settings and records kept, verify green |
| 03 | [Verify and Record](03-verify-and-record.md) | `plugins.mjs status` shows no drift for the plugin, registry and runbook updated, committed |

## Where things live

- **Plugin source, registry and scripts:** [`tools/instatic-plugins/`](../tools/instatic-plugins/README.md)
  (`plugins.json`, `plugins.mjs`, `install-plugin.mjs`, one folder per plugin, offline suites).
- **Hosts:** [`tools/instatic-domain-origins/sites.json`](../tools/instatic-domain-origins/sites.json)
  (`<client>` = production, `<client>-staging` = staging).
- **Credentials:** `~/.webzite/.env`, one `[<client>]` section per site; staging uses the same
  login. Never in a doc, a commit or chat.
- **Outputs:** `tools/instatic-plugins/.tmp/` (status reports, rollout snapshots; not committed) and
  the repo runbook `.claude/runbook/` (committed).

## The rules that matter most

1. **One source.** Plugins are built only from `tools/instatic-plugins/<plugin>/`. Never from a
   client folder, never from an old zip.
2. **Never downgrade.** If a site runs a newer version than the source, bring that source in first.
3. **Staging first, then production, one site at a time.** Stop at the first failure.
4. **Parity is versions, not settings.** Staging and production run the same version; their
   settings stay different on purpose.
5. **Publish only over a clean draft.** A publish bakes every page, including other people's work.

## Models

Opus 5, GPT 5.6 terra, GLM 5.3 flash (or the latest models).

## Version Control

Follows [SYSTEM_RULES.md §4](../../../SYSTEM_RULES.md).
