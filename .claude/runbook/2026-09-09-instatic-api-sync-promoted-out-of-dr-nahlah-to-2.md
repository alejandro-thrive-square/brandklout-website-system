# 2026-09-09 — Instatic API sync promoted out of `dr-nahlah/` to process `22`

Commits: `13a05dd2` (Stone tooling fixes), `e3d8f864` (the promotion). Both on `main`.

## Why this started

The question was why `bk-stone` and `bk-stone-med-spa` each contained a `deliver/brandklout/dr-nahlah/`
folder for a client they have nothing to do with. The answer: the Instatic build-and-publish
toolchain was written for Dr. Nahlah and never moved, so every other Instatic client reached it by
sparse-checking a `dr-nahlah/` skeleton into its own worktree. `PROCESS_INDEX.md` had already
flagged this exact folder as due for promotion.

## Done

- **`deliver/brandklout/dr-nahlah/workflows/15-instatic-api-sync/` → `deliver/process/22-instatic-api-sync/`.**
  `15` collides with the canonical `15-improvement-intake-audit`; a scan of all thirteen worktrees
  confirmed `00`–`21` were claimed, so it landed as `22`. The directive file was renamed to match.
- **Two unmerged Stone fixes landed on `main` first** (`13a05dd2`), because they touched files the
  move was about to relocate and would otherwise have conflicted on every branch:
  - `insta-api.mjs` — `loadEnv()` ran *after* `BASE` was evaluated, so `INSTATIC_BASE_URL` in `.env`
    never took effect. Session cache is now per host.
  - `conv-encode.ts` — `encodeChunk()` found the property name with `chunk.indexOf(':')`, which hits
    the first colon in a preceding *comment*. The declaration then shipped unencoded and the CSS
    engine dropped it silently.
- **`16-instatic-plugins` stayed put**, its six `../15-instatic-api-sync/` imports repointed to
  `../../../../process/22-instatic-api-sync/`. `verify-embed-editor.mjs` also stopped hardcoding
  `.tmp/.session`, which the per-host fix had made stale — `insta-api.mjs` now exports
  `SESSION_FILE`.
- **`.tmp/` is no longer tracked in the module.** Five of Dr. Nahlah's generated artifacts (~373KB)
  were riding in every branch on a path every other client also writes to. All regenerable; the last
  tracked copies are in history at the old path.
- **`PROCESS_INDEX.md`**: module `22` added, next free number is now `23`, promotion-due list updated.
- **`scripts/env-sync.mjs`** comment repointed.
- **Sparse-checkout rewritten** for `bk-stone` and `bk-stone-med-spa` (the five `dr-nahlah` lines
  removed), then `git sparse-checkout reapply`.
- **`main` merged into ten branches**: arvada, grand-mission, ifa-dentistry, legacy-dental, livewell,
  marvel-dental, mason-park-kids, stone, stone-med-spa, west-la-implants. All verified to have
  `deliver/process/22-instatic-api-sync/` and no `dr-nahlah/` remnant.

## Next

Three worktrees still need `git merge main`, deliberately left alone:

| Worktree | Why | What it will hit |
| :--- | :--- | :--- |
| `bk-dr-nahlah` | 344 uncommitted files, 4 of them tracked edits *inside* the folder that moved | Commit those four first, then merge; the rename will be detected |
| `bk-mason-park` | 269 uncommitted files | Nothing specific to this change |
| `bk-stone-dental` | 18 dirty files **and** an add/add conflict on `.claude/RUNBOOK.md` | See gotcha 3 |

Still due for promotion per `PROCESS_INDEX.md`: `19-cloudflare-launch`, `21-instatic-upload`, and
`16`/`17`/`18` of the Dr. Nahlah Instatic run — each still collides with a canonical module number.

## Gotchas

1. **`git sparse-checkout reapply` does not delete ignored or untracked files.** After the merge,
   `bk-stone-med-spa` still showed a `dr-nahlah/` directory containing exactly one thing: the
   gitignored `.tmp/.session-stone-med-spa-production.up.railway.app` cookie cache. Sparse rules only
   govern tracked paths. Removed by hand. Expect the same anywhere a worktree is narrowed.

2. **A branch-level rename does not propagate; `main` must be merged into each worktree.** Ten of the
   thirteen shared a byte-identical copy, but `bk-stone`, `bk-stone-med-spa` and `bk-dr-nahlah` had
   diverged, which is why the Stone fixes had to land on `main` *before* the move — a conflict on a
   file that has also been renamed is much worse to resolve.

3. **`bk-stone-dental` was mis-classified as clean and its merge was aborted.** The detection loop
   only grepped the merge output for `CONFLICT`, so an abort on *"local changes would be
   overwritten"* was silently reported as success. Re-running it revealed a genuine add/add conflict
   on `.claude/RUNBOOK.md`: that branch holds real client-runbook content there, while `main` now has
   the standing repo-level template pointing at `runbook/INDEX.md`. That is an editorial merge of
   someone's notes, so the merge was aborted and the worktree restored byte-for-byte (18 dirty files,
   HEAD `7f96d683`, stash dropped). Whoever owns that branch should decide whether its content
   belongs at `deliver/brandklout/stone-dental-implant-center/docs/RUNBOOK.md` instead.

4. **`git merge` reporting "ok" is not proof it merged.** Always check `git merge-base --is-ancestor
   main HEAD` afterwards. Three worktrees looked fine in the loop output and had not moved.

5. **`python` on this machine resolves to a node shim.** A `python - file <<'PY'` heredoc was handed
   to node, which failed on `import sys,io` — and because the following `node --check` passed on the
   *unmodified* file, the run printed "syntax OK" and looked successful. Use `perl -0777 -i -pe` for
   multi-line in-place edits here. Related: [[no-mjs-via-bash-heredoc]].

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../SYSTEM_RULES.md).
