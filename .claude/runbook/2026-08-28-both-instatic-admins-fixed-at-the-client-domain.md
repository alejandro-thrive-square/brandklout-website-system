## 2026-08-28 — both Instatic admins fixed at the client domain; module renumbered 19 → 20

`www.drnahlah.com/admin` and `www.masonparkdental.com/admin` **now work.** Both were returning
`403 Forbidden: invalid origin` on the LOGIN POST — not on save, as I first wrote. Logging in is a
state-changing request, so the origin gate blocks it and nobody gets in at all.

| Client | Send this | Also works |
| --- | --- | --- |
| Dr. Nahlah | `https://www.drnahlah.com/admin` | `encorercm.com`, `www.encorercm.com`, `dr-nahlah.up.railway.app` |
| Mason Park | `https://www.masonparkdental.com/admin` | `mason-park.up.railway.app` |

`node check-origins.mjs --all` exits 0.

### Two different root causes, and I had both wrong at first

**Dr. Nahlah — set once, never extended.** `PUBLIC_ORIGIN` already held
`encorercm.com,www.encorercm.com,dr-nahlah.up.railway.app` from a **2026-08-18** fix recorded in
`bk-dr-nahlah/.claude/RUNBOOK.md`. That entry diagnosed this same bug class and even wrote the rule
down: *"Adding a custom domain in Railway does not update PUBLIC_ORIGIN, and `www` is a separate
domain."* Then `drnahlah.com` went live 2026-08-25 and was never appended. **The knowledge existed
and the failure happened anyway, because it lived in one worktree's runbook rather than in a process
anyone hits at cutover time.** That is the argument for module 20 existing.

**Mason Park — set, but never applied.** `PUBLIC_ORIGIN` was `https://masonparkdental.com`: the apex
has no DNS record (so everyone uses `www.`, a different origin), *and* the value had never taken
effect — the live server rejected the configured host while accepting one that wasn't in the
variable at all. The container was still on its boot-time derived value.

### What I got wrong

- Said Mason Park's `PUBLIC_ORIGIN` was unset and falling back to `RAILWAY_PUBLIC_DOMAIN`. It was
  set. I inferred it from black-box probing when **the Railway CLI was authenticated the whole
  time** and I could have read it. Check `railway whoami` before assuming no access.
- Said Dr. Nahlah's Railway host was "recorded nowhere". It is `dr-nahlah.up.railway.app`, in that
  worktree's runbook. An audit agent missed it and I repeated the claim without checking.
- Numbered the new module `19`, colliding with `19-cloudflare-launch`, which exists **untracked** in
  `bk-dr-nahlah` and is therefore invisible from `main`. Renumbered to `20`; the index now reserves
  19 and says to check worktrees before claiming a number.

### Railway access

Workspace **Brandklout**, one project per client (not one project, many services):

| Client | Project id | Service |
| --- | --- | --- |
| Dr. Nahlah | `2536e8b9-026a-4a55-b0da-5dbb2eb8b6c5` | `Dr Nahlah` |
| Mason Park | `e4a73ef0-64a3-48e5-b3c3-b2ea60737acc` | `Mason Park` |

`railway variables --json` **prints every secret** (`DATABASE_URL`, `INSTATIC_SECRET_KEY`) — filter
before showing output to anyone.

### Redeploy facts, measured not assumed

- `railway variables --set` **does** auto-trigger a redeploy (observed on both). Mason Park's earlier
  change evidently did not, so always confirm a new deployment appears.
- **Downtime: Mason Park ~5–10s (2 failed samples of 58), Dr. Nahlah ~5s (1 of 24)**, polling the
  public site once a second through each deploy.
- **No zero-downtime rollover is possible**: a Railway volume mounts to one container at a time, so
  the old container must stop first.
- **No data risk**: SQLite (`DATABASE_URL` under `/app/storage`), uploads (`/app/storage/uploads`)
  and published version history all live on that persistent volume. What a restart *does* lose is
  unsaved in-browser editor state — the collab socket drops. Don't redeploy mid-edit.
- **Both services run `ghcr.io/corebunch/instatic:latest`, unpinned.** A redeploy re-pulls the tag,
  so an origin change can silently become a platform upgrade. Verified 2026-08-28: `latest` ==
  `0.0.16` == `sha256:d940465d…f623fcbe`, the newest tag published, so it was a no-op. **That is
  luck.** Pin by digest; `railway redeploy` without `--from-source` re-runs the existing deployment.

### Still open

- **Pin both services by image digest** rather than `:latest`.
- **Promote `19-cloudflare-launch`** from `bk-dr-nahlah` into `deliver/process/` — it is untracked
  and invisible to everyone else.
- `masonparkdental.com` apex still has no DNS record; only `www` resolves.
- Dr. Nahlah's volume was 78% full on 2026-08-24 with a note that writes fail *silently* near 90%.
  Unrelated to this change, but worth re-checking.
