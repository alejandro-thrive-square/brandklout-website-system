## 2026-09-11: worktree, client folder and Railway instance created

### Done

- **Worktree** `bk-brandklout-website`, created with `bash scripts/new-client-worktree.sh
  brandklout-website` from `main` `116efa21`. It is sparse: `deliver/process`,
  `deliver/brandklout/{docs,scripts,brandklout-website}`, `scripts`, `mcp-servers`, `.claude`.
  The branch name is bare. The script, unlike `orca worktree create`, adds no user prefix.
- **The slug is `brandklout-website`, not `brandklout`**, so the path is not
  `deliver/brandklout/brandklout/`.
- **Client folder** scaffolded per `00-client-delivery-initialization`: `docs/project-overview.md`,
  this runbook, and `workflows/00-client-delivery-initialization/.tmp/client-handoff/` (where Sang's
  HTML lands).
- **`21-instatic-upload` toolkit** copied from `bk-stone-med-spa`'s `05-instatic-upload`, the most
  recent known-good copy. It imports `insta-api.mjs` from the canonical
  `deliver/process/22-instatic-api-sync/`, so no sparse widening is needed. The directive has a
  Brandklout box at the top. Everything under it is still the sibling's text.
- **Railway instance provisioned name-first by script**, following the six mutations in the
  directive. Project `Brandklout` `550ebd58-0e74-444e-96d5-2b836a2db98a`, service `742221a0-…`,
  volume `/app/storage`, `PUBLIC_ORIGIN=https://brandklout-production.up.railway.app`, fresh
  `INSTATIC_SECRET_KEY`, healthcheck `/health`. The domain came out right the first time.
- **Instatic set up**: `POST /admin/api/cms/setup` → `201`, site name `Brandklout`, owner
  `alejandro@thrivesquare.com`, with the Mason Park password by reference (same as Stone Med Spa).
- `~/.webzite/.env` gained `[brandklout-website]` (`RAILWAY_PROJECT_ID`, `INSTATIC_BASE_URL`,
  `INSTATIC_PASSWORD=${INSTATIC_PASSWORD_MASON_PARK}`). The previous file is kept at
  `~/.webzite/.env.bak-brandklout-website`. The worktree `.env` was regenerated with `env-sync.mjs`.
- Registered in `deliver/process/20-instatic-domain-origins/sites.json` on this branch.

### Next

See [`../RUNBOOK.md`](../RUNBOOK.md) → Next. In one line: the HTML lands, gets read for scripts,
forms and fonts, the toolkit gets thinned for one page, then publish, gates, and the review link
goes to Sang.

### Gotchas

- **`new-client-worktree.sh` put the worktree in the wrong folder.** Its default path was
  `$(dirname "$MAIN")/../orca/...`, and because the main checkout lives under
  `~/Documents/Webzite Studio/`, that resolved to `~/Documents/orca/...`. The files written to the
  intended path `~/orca/workspaces/...` went into a plain folder with no `.git`, so `env-sync.mjs`
  and every `insta-api.mjs` import failed with `MODULE_NOT_FOUND`. Fixed with `git worktree move`,
  and the default now uses `$HOME/orca/workspaces` (the fix is committed on `main`). If a worktree
  "has no scripts/", run `git worktree list` before anything else.
- `~/.railway/config.json` holds the token at `user.accessToken`, and `user.token` is null. The
  `[shared]` `RAILWAY_TOKEN` is rejected by GraphQL in every header form.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
