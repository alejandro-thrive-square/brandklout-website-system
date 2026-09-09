## 2026-09-04 — one master credential file, generated into every worktree

Credentials were hand-copied between worktrees and the files said so out loud:
`# Cloudflare API token, copied 2026-08-27 from the bk-dr-nahlah worktree (.env is per-worktree and
drifts).` Five of thirteen worktrees had a `.env`; eight had none, so anything needing Browserbase,
BugHerd, Vimeo, Magnific or Figma simply did not run there.

### Done

- **`~/.webzite/.env` is now the only credential file anyone edits.** Sectioned: `[shared]`,
  one `[<client>]` per client, `[aliases]`. Built by consolidating the five scattered files.
- `scripts/env-sync.mjs` resolves `[shared]` + the worktree's client section into a **generated**
  `.env`, marked `DO NOT EDIT`. `--check` prints key names only, never values. It refuses to
  overwrite a non-generated `.env` without `--force`, and backs one up to `~/.webzite/backups/`
  when it does.
- `scripts/postinstall.js` runs it after the narrowing, so Orca's `npm install` setup hook does both.
- All 14 worktrees (main included) regenerated. Verified key-by-key against the backups: every
  previous value survived except main's `INSTATIC_PASSWORD`, dropped **on purpose** — main gets
  `[shared]` only and that password is per-instance, so it lives in `[dr-nahlah]` now.

### Next

- Push. Nothing here is pushed yet.
- `INSTATIC_PASSWORD` has **two distinct values** in play — see the gotcha. Confirm they are genuinely
  per-instance rather than one of them being stale, and delete `~/.webzite/backups/` once satisfied.
- `core.hooksPath` is still unset; `bash scripts/bootstrap.sh` fixes it.

### Follow-up, same day: [vars] and Railway

- **`[vars]`** — named definitions referenced as `${NAME}`, never written to any `.env`. The two
  Instatic passwords are now `INSTATIC_PASSWORD_DR_NAHLAH` and `INSTATIC_PASSWORD_MASON_PARK`, each
  named once with a comment listing the instances using it; the client sections reference them. Same
  value in every worktree as before, verified byte-for-byte. An unknown `${NAME}` is a hard error.
- **`RAILWAY_TOKEN` in `[shared]`, `RAILWAY_PROJECT_ID` per client.** Railway was missing from every
  `.env` because the CLI keeps its auth in `~/.railway/config.json`, machine-global — so `railway`
  already worked everywhere and appeared nowhere. Token read from that file's `user.accessToken`.
  Project ids: dr-nahlah `2536e8b9…`, mason-park `e4a73ef0…`, mason-park-kids `a135c5ec…` (that
  last one is **not** in the Railway access table further down this file — it was only in the CLI
  config).
- Master backup before the refactor: `~/.webzite/.env.pre-vars.bak`.

### Gotchas

- **`USERNAME`, `HOSTNAME` and `PORT` in a `.env` are dead on Windows.** Windows sets all three
  itself, and every loader in this system uses `if (!process.env[k])` — fill-in-if-absent — so the
  SiteGround `USERNAME` silently resolved to the Windows login (`ACER`), not the host account.
  Nothing in the repo referenced them by name, so they were renamed `SITEGROUND_*` during the
  migration. **Prefix any host credential.**
- **`INSTATIC_EMAIL` is identical everywhere but `INSTATIC_PASSWORD` is not**: main + bk-dr-nahlah
  share one value, bk-mason-park + bk-mason-park-kids + bk-stone share another. Each client runs its
  own Instatic instance, so per-instance passwords are plausible — but so is a rotation that never
  reached two of the files. It is filed per-client, which preserves exactly what each worktree had.
  Do not promote it to `[shared]` without checking both still log in.
- **Sections are a safety mechanism, not organisation.** `INSTATIC_BASE_URL` differs per client and
  the toolkit refuses to guess it; a flat master with several would resolve first-match and publish
  one client's plugin to another client's site. Same reason the **main worktree gets `[shared]`
  only**. A missing section is a hard error, never a fallback.
- **`[aliases]` keys need their own parse rule.** They are worktree names and carry hyphens; the
  env-var pattern `[A-Za-z_][A-Za-z0-9_]*` silently dropped every alias, and `bk-ifa-dentistry`
  reported "no section matches" while the alias sat right there in the file.
- **The Orca CLI has no env-var injection.** `orca worktree create` passes nothing through. The setup
  hook (`npm install` → `postinstall`) is the only automation point, which is why the credential sync
  hangs off it rather than off anything Orca-specific.
- **`postinstall.js` must not exit early when Git Bash is missing.** The credential sync is pure Node
  and has to run regardless; the narrowing is the only part that needs bash.
