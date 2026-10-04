# 2026-10-03 — deliver/process tracked on main only; clients get an untracked mirror; two-way merges

## Why

Every client branch carried a **tracked copy** of its scenarios and toolkits. Agents fixed bugs in
that copy, so the fix stayed on the branch (Hackensack's `place-embeds.mjs` unbalanced-div fix and
its registry rows never reached main), and merges had to pick between diverging copies.

## Done

- `718d7afd` Hackensack's three stranded process fixes brought to main (`place-embeds.mjs` balanced
  `</div>` match + `output/code/embeds.json` lookup; its rows in `sites.json`, `plugins.json`).
- `5413d25c` `scripts/scenario.mjs` rewritten: mirrors from the committed `main` ref (never main's
  working tree), untracked. `sync` (alias `update`) refuses to overwrite a mirror file edited locally
  (exit 3, names the path on main); `status` says behind / edited / still tracked / strays;
  `detach` untracks an old copy once. Root `.gitignore` hides the mirror and `.session-*`. Sync runs
  on `npm install` (postinstall), `new-client-worktree.sh`, and Claude Code SessionStart
  (`.claude/settings.json`). `assets.mjs` skips the mirror.
- `14635906`, `3349663f` status splits mirror vs strays; ignore rules also written to the shared
  `.git/info/exclude`, since client branches' own `.gitignore` predates the mirror.
- `c4d632a1` rules: merging is two-way and routine — main into the client at session start, the
  client into main (`--no-ff`) at the end of a task. Client history is never rewritten.
- Migrated and merged into main, each verified (tracked outputs kept, nothing lost from disk, old
  head still an ancestor, merge = client folder only, zero deletions on main):
  `bk-hackensack-dental-implants` (`789b1bf2`), `bk-ifa-dentistry` (`6268a8f8`),
  `bk-livewell` (`2b77f411`), `bk-oceanic-dental` (`20fa0fd3`).

## Next

- `bk-west-la-implants` has a process copy and one uncommitted change: once that is committed, run
  in its worktree `git merge main`, `node scripts/scenario.mjs detach`, `sync`, commit, then
  `git merge --no-ff bk-west-la-implants` from main.
- The 12 other client branches carry no copy (pre-v2 layout); they only need `git merge main` to get
  the new rules, and a merge into main to publish their outputs.
- Instatic login cookies (`tools/instatic-api-sync/output/.session-*`) were committed on four client
  branches. Untracked now, but still in history: rotate/log out those sessions if they are live.
- Git hooks (`scripts/hooks/*`) are not installed in this clone's `.git/hooks`, so `check-scope`
  does not run on commit/merge; scope was checked by hand for every merge above.

## Gotchas

- Client branches never merged main before this, so their `scripts/`, `CLAUDE.md` and `.gitignore`
  were stale; that is why the ignore rules also live in `info/exclude`.
- A file differing from main is not necessarily a local fix: most were older main versions. `sync`
  without a manifest checks the file's blob against main's history of that path before calling it
  "edited".
- `--force` only after confirming the edit is on main (`git show main:deliver/process/<path>`).

## Addendum — "main is broken" check (same day)

- Alki House `final-site/index.html` broke when opened from main because `assets/` and `productos/`
  are build output its own `.gitignore` excludes (`node build-site.mjs` regenerates them). Git never
  had them on any branch; all 1,434 are in R2. Not merge damage. Open a site from main only after
  `node scripts/assets.mjs pull <client>`.
- `dbe7b3ad` `assets.mjs` split manifests on `\n` only: a CRLF `assets.tsv` (any manifest that
  arrives by merge, with autocrlf) reported 0 in R2 and would have broken `pull`. Hackensack, IFA,
  Livewell and Oceanic were backed up all along.
- Pushed from each client's own worktree (manifest committed on its branch, by path): Mason Park
  Kids 24 files and Dr. Nahlah 2 were not in R2, now uploaded; Mason Park, Stone Med Spa, West LA
  and IFA needed nothing (their gaps were stale manifest rows). All six now 100% except Mason Park
  Kids: 18 `workflows/03-core-pages/.tmp/instatic/pages/*.json` rows are on no disk and not in R2.
  They are Instatic page exports, regenerable from the live site.

## Addendum — clients never merge into main (same day, supersedes the two-way rule)

- Decision: a client branch is the client's permanent history and **never merges into main**. A merge
  carried only the git half of a client (outputs) and not its R2 media, so main looked broken and
  gained nothing. Main still merges into clients (system files only, cannot conflict). The four
  merges made earlier today (Hackensack, IFA, Livewell, Oceanic) stay in main's history as snapshots.
- `scripts/client.mjs`: `list | log | runbook | ls | show | where` reads any client branch from main
  without a checkout or merge. Branch → folder by name, with `ALIASES` for bk-ifa-dentistry and
  bk-stone / bk-stone-dental; pre-v2 clients keep `docs/RUNBOOK.md`.
- `pre-merge-commit` now runs `check-scope --merge --expect system` (refuses any merge bringing client
  files); `bootstrap.sh` sets `branch.main.mergeoptions=--no-ff` (set on this machine) so a client
  that just merged main cannot fast-forward main past the hook.
- **Hooks are still not enabled here** (`core.hooksPath` unset): `post-commit` copies every worktree's
  heavy media into main, an R2-era leftover. Decide on post-commit before running
  `bash scripts/bootstrap.sh --hooks-only`.
- Planned host: Paperclip (paperclip.ing) on AWS. Its isolated workspaces are git worktrees too, so
  this layout carries over as is: the system repo's main is the process; one Paperclip project per
  client on its permanent branch (or a separate client repo). Workstation-only pieces to replace:
  Codex/Claude-in-Chrome computer use, `~/.webzite/.env`, Windows-specific scripts.

## Version Control

Follows [SYSTEM_RULES.md §5](../../SYSTEM_RULES.md).
