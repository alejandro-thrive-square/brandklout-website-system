# 2026-10-10 — master credential folder renamed `~/.webzite` -> `~/.brandklout`

Repo-level. The Webzite Website System (a separate copy of this system, for Webzite Studio's
freelance clients) now has its own master at `~/.webzite-studio/.env`. With both on disk, a
Brandklout master named `.webzite` read as the wrong business, so Alejandro asked to rename it.

## Done

- `~/.webzite/` renamed to `~/.brandklout/` (master, its `.env.bak-*` copies, `backups/`,
  `asana-brandklout.json`, `google-drive-oauth-client.json`). `~/.webzite` is now a **junction** to
  it, so nothing that still says the old path breaks.
- Code defaults now `~/.brandklout`: `env-sync.mjs`, `assets.mjs`, `drive.mjs`,
  `instatic-plugins/lib/fleet.mjs`, `instatic-release/lib.mjs`, `termly-ghl-consent/consent-kit.mjs`,
  `deliver/scripts/asana-lib.mjs` (`TOKEN_DIR`). Every live doc mention (75 in 44 files) follows;
  dated runbooks keep the old path as history.
- Master header comment says what it is and points at the Webzite master; every other line unchanged
  (backed up as `~/.brandklout/.env.bak-2026-10-10-rename`). Main's `.env` regenerated from it.
- SYSTEM_RULES §4.2.2: the rename, the junction and when to remove it.

## Next

- Each `bk-*` branch picks the new defaults up when it next merges main. Until then its scripts read
  `~/.webzite/.env` through the junction — checked on bk-mason-park (`env-sync --check` resolves
  `[shared] + [mason-park]`). Remove the junction once all have merged:
  `cmd /c rmdir %USERPROFILE%\.webzite` (removes the link only).
- The old `webzite-agentic-workflow` repo's `deliver/brandklout/scripts/asana-*` still say
  `~/.webzite`; the junction covers them.

## Gotchas

- Do not delete `~/.webzite` with a recursive delete while it is a junction: some tools follow the
  link and empty `~/.brandklout`. `rmdir` without `/s` removes only the link.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../SYSTEM_RULES.md).
