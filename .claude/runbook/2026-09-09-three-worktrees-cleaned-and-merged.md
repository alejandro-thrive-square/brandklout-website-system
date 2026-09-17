# 2026-09-09 — bk-dr-nahlah, bk-mason-park and bk-stone-dental cleaned and merged

Follows [2026-09-09 — Instatic API sync promoted to process `22`](./2026-09-09-instatic-api-sync-promoted-out-of-dr-nahlah-to-2.md),
which left these three unmerged because their trees were dirty. All thirteen worktrees now have a clean
tree and carry the promotion; each sits one docs-only commit behind `main` (this file).

## Done

**`bk-stone-dental`** (`9d76f1b8`, merge) — 2.9MB of reference captures committed (the landing page
is a strict clone of the Arvada reference, so the captures are what make it reviewable).
`.claude/RUNBOOK.md` was still holding the 250-line pre-split copy; it now points at the client's
own runbook and carries `main`'s repo-level one.

**`bk-mason-park`** (`6bb2c9e6`, merge, `c466c4eb`) — 147 newly scraped pages, the
`security-incident-2026-08-24.md` writeup, and the Asana context refresh.

**`bk-dr-nahlah`** (`848251ee`, `6dc7ac96`, merge `015d5cd7`) — the big one:
- `deliver/process/19-cloudflare-launch/` **was never committed at all**, despite PROCESS_INDEX
  describing it as "promoted on `bk-dr-nahlah` but not yet merged to `main`" since 2026-08-25.
- `insta-api.mjs` gained `toChangedPage()`, `templateMap()` and `assertTemplatesIntact()`.
- 49 scripts were split out of the shared module into the client's own copy — see Gotcha 1.

## Gotchas

1. **A shared module accumulates client one-offs unless someone stops it.** `bk-dr-nahlah` had 49
   uncommitted scripts in `15-instatic-api-sync/`, 7 of them already tracked. They are BugHerd-pin
   patches (`push-milling-card.mjs` is pin #24, `audit-round-corners.mjs` is pin #11) — this site's
   work, not tooling. They now live in `dr-nahlah/workflows/22-instatic-api-sync/`, importing
   `../../../../process/22-instatic-api-sync/insta-api.mjs`. This is the same drift that put a
   `dr-nahlah/` folder in the Stone worktrees; expect it again wherever a client runs a shared module.

2. **Both branches independently found and fixed the same `loadEnv()`/`BASE` ordering bug**, months
   apart, each writing its own comment about it. That is what an unmerged branch costs: the same
   debugging paid for twice. It is now on `main`.

3. **Git flags a rename-vs-added-files collision as `CONFLICT (file location)`** and leaves the added
   files at the old path. That was the right outcome here, but `git checkout --ours` on the *new*
   path plus `git rm --cached` silently relocated the files on disk instead of erroring — check
   `git status` before assuming a loop did what you asked.

4. **A scrape mirrors third-party trackers and blows past the Windows path limit.** Mason Park's
   `site-scrape/assets/` is 1.2GB over ~1200 files, 682 under `google.com/rmkt/collect`, deepest path
   321 chars. Its `.state/cookies.json` holds a live `PHPSESSID` for the crawled site. Both ignored.
   dr-nahlah's Instatic `.tmp` was 576MB (80MB of page backups, ~14MB per parity snapshot).

5. **Two live session tokens were sitting untracked** — `mcp-session.txt` in `bk-stone-dental`, twice.
   Now covered by `**/.tmp/mcp-session.txt`.

6. **`perl -0777` patterns with `\n` silently no-op on the CRLF files here.** `SYSTEM_RULES.md` and
   most root `.md` are CRLF; the substitution reports success and changes nothing. Use `\r?\n`, and
   verify with `git diff --stat` rather than trusting the exit code. Related: [[no-mjs-via-bash-heredoc]].

## Open questions

- **`.env.example` on `main` says `INSTATIC_BASE_URL` "has deliberately no default anywhere in the
  system", but `deliver/process/22-instatic-api-sync/insta-api.mjs` defaults to `encorercm.com`.**
  Left as-is rather than changing runtime behaviour mid-cleanup. The doc and the code disagree; one
  of them should move.
- **Number `21` is double-claimed.** `bk-mason-park` promoted `21-instatic-staging-clone` into
  `deliver/process/`, which settles `21`; `bk-stone`'s client-local `21-instatic-upload` (itself
  renumbered from `05` on 2026-09-04) still holds it and should become `23`. Recorded in
  PROCESS_INDEX on the mason-park branch; nothing breaks until one of them merges to `main`.
- **`bk-legacy-dental` (2 files) and `bk-stone-med-spa` (6)** carry unrelated in-progress work,
  untouched here.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../SYSTEM_RULES.md).
