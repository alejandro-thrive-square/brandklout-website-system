# 2026-09-28 — Instatic update path: push only the changed pages (`push-site.mjs --update`)

Repo-level. Alejandro noticed that every update to a house-built Instatic site re-uploaded the
whole site, and asked for a quicker way. The full run is one `PUT /site-document` in `replace`
mode: every page, the whole registry and the scripts rewritten (9.41 MB for West LA Implants' 80
pages), and any page missing from `dist/` deleted. The platform's `incremental` mode was already
used by the hand-edit tools, but not by the build pipeline.

## Done

- `tools/instatic-site/push/push-site.mjs`:
  - `--update`: incremental write of the pages in `import-out.json` (`--pages a,b` to narrow).
    Untouched pages are not sent. Nothing is ever deleted.
  - `--shell-only`: CSS/JS only.
  - The shell (registry + token/script assets) is sent only when the source hash changed or a
    written page uses a class the live registry lacks. `--with-shell` / `--no-shell` override.
  - `--record` snapshots the live page seqs and registry hash to `output/push-state.<host>.json`.
  - Every `--apply` now goes through `lib/staging-guard.mjs` (`STAGING_HOST` or `--allow-production`).
  - Fixed a crash: the file used `P.WORK` / `P.DIST` without importing `../lib/paths.mjs` (same bug
    in `build-import-input.mjs`). Neither script could have run since the 2026-09-23 promotion.
- `push/build-import-input.mjs`: `--only a,b` and `--changed` (pages whose rewritten html hash
  differs from the last push to this host). A partial payload is marked `partial: true`, and a
  replace push refuses it.
- `lib/push-state.mjs`: the record (html hash per page, seqs, registry hash, source hash).
- Docs: `tools/instatic-site/README.md` has an "update path" section. Scenario 2 `02-build.md`
  step 8 points at it and forbids the full `--force` push for updates.

## Verified (dry runs against West LA Implants production, read-only)

- Scrambled every rule id in the last `import-out.json` to simulate a fresh conversion. `--update`
  mapped 318 class rules back onto their live ids. The other 112 are runtime-only classes the
  pipeline demotes to ambient, as before.
- `--update --pages index,financing`: 2 written, 78 untouched, 0.77 MB. `--shell-only`: 0.45 MB.
  Full replace: 9.41 MB.
- The guard: no record → refuses; after `--record` → passes; a moved seq or registry hash →
  refuses and names the page and the registry. A partial payload into a replace push → refuses.
  `--apply` against the production host without `STAGING_HOST` → refuses (exit 2).
- **Not yet done: a live `--update --apply`.** No staging instance currently runs a site built with
  this pipeline. The first real update should run on a staging clone, followed by `verify-live`,
  `compare-live` and a visual diff of one written page and one untouched page.

## Next

- Live test on a staging instance (Alejandro to pick the site).
- After the next full push on any house-built site, run `push-site.mjs --record` so its first
  update has a baseline.

## Gotchas

- **Style-rule ids are random per conversion.** A node's `classIds` point at them. This is why a
  page cannot simply be re-sent alone, and why `--update` maps ids by class name onto the live
  registry first. Condition ids are deterministic (`media:(max-width: 767px)`) and need no mapping.
- **Runtime-only classes live as `ambient`,** so they never match by name. They get new ids and are
  demoted again. Harmless, because no node points at an ambient rule.
- **The first update after `--record` always sends the shell.** `--record` cannot know which
  sources built the live shell, so there is no source hash yet.
- **Our own post-processing moves seqs** (place-embeds, template flags, the SEO PATCH). End every
  push with `--record`, or the next update reads them as browser edits.
- Bash heredocs halved `\n` inside the Python edit script (memory: no .mjs via bash heredoc). Write
  edit scripts to a file with the Write tool.

## Version Control

Follows [SYSTEM_RULES.md §4](../../SYSTEM_RULES.md).
