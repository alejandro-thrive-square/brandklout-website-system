# Scenario 4 · 03 Verify and Record

## Purpose

Prove every site ended where the registry says it should, with its pages still right, and leave a
record a later reader can trust without having been here.

## Inputs

- Step 02 finished with no failure.
- `tools/instatic-plugins/output/rollouts/<stamp>-<plugin>-<version>/rollout.json`.

## Checklist

- [ ] `verify` green on every host
- [ ] `status` shows no drift for the plugin
- [ ] One page per site looked at by a person
- [ ] Registry notes updated
- [ ] Docs updated if behaviour changed
- [ ] Runbook written, committed with its SHA

## Steps

1. **Verify every host.** `node plugins.mjs verify --plugin <name> --env both > output/verify.log 2>&1`.
   Per host it checks the plugin row (active, enabled, released version, no error) and a sample of
   published pages: home plus five, plus up to three pages with an Embed block.
   - `aeo-schema`: one `data-aeo="brandklout.aeo-schema"` graph that parses.
   - `open-graph`: one `og:title`, a canonical where the site asks for one (`emitCanonical` on and a
     `siteUrl`).
   - `embed-origins`: one CSP meta tag, one tag per unscoped site script, module-js served.
   - every plugin: no `unknown module`, no `webzite.` marker.
   `--limit 20` widens the sample.
2. **Status.** `node plugins.mjs status --plugin <name>`: no `OLD`, `MISSING`, `AHEAD` or `PARITY`
   for the plugin. Save the report path for the runbook.
3. **Plugin-specific gates, where they apply.**
   - `open-graph`, `aeo-schema` on production: `tools/instatic-site/gates/seo-head-check.mjs
     --public <host>` over the live sitemap.
   - `embed-origins` with site scripts: `tools/instatic-embeds/rollout-site-scripts.mjs verify
     --url <script>`; for DNI, `tools/instatic-site/gates/dni-proof.mjs` once (each run burns a pool
     number).
   - `embed-origins` block changes: `tools/instatic-embeds/verify-embed-canvas.mjs` (publishes
     nothing).
   - `link-editor`: reload the editor and change one link by hand on staging.
4. **Update the registry.** In `plugins.json` `sites`, add or fix a site's plugin list and its note
   if the rollout changed what it carries. `plugins.json` holds what should be true; `status` is
   what is true.
5. **Update the docs** if behaviour changed: the plugin's `README.md`, the toolkit README
   (`tools/instatic-plugins/README.md`), and `tools/instatic-embeds/instatic-embeds.md` for
   embed-origins features.
6. **Runbook.** Repo-level work: `.claude/runbook/YYYY-MM-DD-<plugin>-<version>-rollout.md` and its
   row in `.claude/runbook/INDEX.md`: version, sites and hosts in order, what was published and
   with whose go-ahead, anything skipped and why, Gotchas, Next. If one site needed site-specific
   work, add a row to that client's `RUNBOOK.md` on its branch too.
7. **Commit** registry, docs and runbook together. Delete the `output/rollouts/` snapshot only after
   a week with no complaint.

## Conditionals

- **If verify fails on a host that was already failing before the rollout:** compare with the
  `seo-head-check-before.log` and the `site/` backup in the snapshot. Pre-existing is recorded as a
  Next item, not fixed silently.
- **If a setting or records changed:** restore them from `plugin-before.json` (`PUT
  /admin/api/cms/plugins/<id>/settings`, records re-posted), republish, verify again.
- **If a page lost content after the publish:** it was an unpublished draft that shipped. Restore
  from the `site/` backup, then tell the site owner.
- **If a site is still behind on purpose** (drift, waiting for the client): list it under Next with
  the reason, so the next status reader knows it is known.

## Do / Don't

- Do record hosts, versions and the commit SHA in the runbook, never a password.
- Do check the head in a rendered page for WordPress clones (`seo-head-check.mjs --render`).
- Don't call a plugin broken from a red `verify-embed-editor.mjs`; run the canvas gate first.
- Don't mark the rollout done while `status` still shows PARITY for the plugin.

## Tools

- `tools/instatic-plugins/plugins.mjs`: `verify`, `status`.
- `tools/instatic-site/gates/seo-head-check.mjs`, `dni-proof.mjs`.
- `tools/instatic-embeds/rollout-site-scripts.mjs verify`, `verify-embed-canvas.mjs`.

## Outputs

- `tools/instatic-plugins/plugins.json` (sites, notes), plugin and toolkit READMEs.
- `.claude/runbook/YYYY-MM-DD-<plugin>-<version>-rollout.md` and `INDEX.md` row.

## Evidence

Repo runbooks: 2026-09-10 plugin ids renamed (verify: `og:title` once, one graph, no stale marker,
no unknown module, module-js 200), 2026-08-28 embed-origins canvas card (a gate made only of
negatives passes vacuously; the editor gate is red for a synthetic-click reason), 2026-09-12 Sienna
(412 pages each with one tag). bk-dr-nahlah 2026-09-22d and 2026-09-22e (`check-pool-scope.mjs`,
connect-src gap on pages without an embed, one pool number burned per proof).

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md).
