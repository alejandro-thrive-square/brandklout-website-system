# 2026-09-19 — the workstation mirrored onto a Namespace devbox

Repo-level. Alejandro found [namespace.so](https://namespace.so) and asked to work the way we work
here, but in the cloud. A devbox now carries the whole system: the clone, all 15 client worktrees
with their sparse layout, the generated credentials, the Python/Playwright runtime, and (in
progress at the time of writing) every client's media.

## Done

- **Devbox CLI installed** on the workstation at `C:\Users\ACER\AppData\Local\Programs\devbox\devbox.exe`
  (v0.0.189), logged in — tenant `tenant_np0manm1cbgce`, credential expires **2026-10-19**, after
  which `devbox login` again. The CLI is on `PATH` only for terminals started after the install.
- **The devbox is Alejandro's own `Brandklout` box** (id `qa1cci73uhj3k`, size M, 150 GiB, North
  Virginia), not a new one — the plan allows **one devbox per user**, so `devbox create` fails with
  `ResourceExhausted … per-user devbox limit reached (1)` while it exists.
- **All 15 client worktrees created** under `/workspaces/bk-*`, each sparse to its own client, and
  every HEAD matches this workstation commit for commit. The clone itself lives at
  `/workspaces/brandklout-website-system` and was already current with `origin/main` (`14251c10`).
- **Credentials mirrored.** `~/.webzite/.env` copied over the SSH pipe (base64, md5 verified
  `8b6c4aa9…`, 9728 bytes, `chmod 600`), then `npm install` in all 16 checkouts generated each
  worktree's own `.env` — per-client sizes differ, as they do here.
- **Runtime installed**: Python 3.14.7 venv in the clone, Playwright 1.63.0, Chrome Headless Shell
  153. There is no system Chrome on the box.
- **All media transferred — 12 GB on the box, every client verified file-for-file.** Streamed as
  `tar -cz | devbox ssh -T -- tar -xz` per worktree, smallest client first, 22:51 → 00:18 for
  eleven clients and 11:30 → 12:52 the next morning for the two that failed. Observed throughput
  ~1.1 MB/s. The only files that did not cross: each worktree's `.claude/scheduled_tasks.lock`
  (local Claude Code state, unwanted) and exactly one file in bk-stone,
  `…/stone-surgical-arts/workflows/01-content-intake/.tmp/website-files/blog/wp-includes/SimplePie/library/SimplePie/Decode/HTML/Entities.php`
  — a deep path in a scraped WordPress mirror, almost certainly Windows long-path, and irrelevant.

## Found

- **The media is 10.0 GB, not the 1.5 GB a first measurement said.** `git ls-files --ignored |
  xargs du -ch | tail -1` under-reports by ~7×: `xargs` splits into several `du` runs and `tail -1`
  keeps only the **last batch's** total. Use `tr '\n' '\0' | du -c --files0-from=- --apparent-size`,
  one process, no batching. The corrected total agrees with the 10.3 GB the 2026-09-18 backup run
  copied out independently.
- **Nothing was unpushed.** All 15 `bk-*` branches, `main` and the seven `backup/2026-09-18/*`
  branches match `origin` exactly. The only dirty files across every worktree are `.tmp/` workflow
  artifacts (163 in bk-brandklout-website, a handful elsewhere). A clone that looks stale is a
  clone sitting on `main` — the work is on the client branches.
- **About a third of the media is re-derivable on the box** and did not have to come up the wire at
  all: site scrapes 1.9 GB, Dr. Nahlah's WordPress downloads 585 MB, CMS backup snapshots 484 MB,
  Asana/BugHerd dumps 330 MB. Pushed anyway this once, because sorting it costs more than the
  bandwidth did.
- **The documented asset-restore path is dead for this repo.** `INSTALL.md` step 6 and
  `scripts/bootstrap.sh` pull media by rclone from `vps:/root/webzite-agentic-workflow` — the
  pre-split repo path — and `rclone` is installed nowhere, with no `rclone.conf`. Any new machine
  or devbox therefore has no asset source but this workstation.

## Gotchas

- **`du` on a file list lies if you pipe it through `xargs`.** See above. Every size in the first
  half of this session was wrong because of it; re-measure before trusting a media number.
- **One devbox per user.** Do not `devbox create` expecting a second one, and do not delete the
  existing box to make room without asking — it is the one with everything on it.
- **`devbox ssh` passes stdin cleanly** (`-T` to drop the PTY), which is what makes
  `tar | devbox ssh -- tar -x` and the base64 credential copy work. It prints
  `You are now connected to <name>.` before the remote output, so parse from the tail, not the head.
- **The five clients with no media here arrive with none there.** arvada, marvel-dental,
  legacy-dental, grand-mission and livewell still have their images only in
  `Documents\Webzite Studio\Webzite Agentic Workflow\deliver\brandklout\` (804 MB, 745 MB, 155 MB,
  211 MB, 18 MB). The devbox mirrors this workstation faithfully, including this hole.
- **Upstream is ~1.1 MB/s.** A full re-push of 10 GB is ~3 hours. Do not plan on doing it per
  devbox.

- **The pipe breaks on long transfers — always wrap it in a retry.** At 00:18 one drop killed
  ifa-dentistry ten minutes in (`tar: -: Cannot write: Broken pipe`) and then mason-park instantly,
  leaving 388/1525 and 1/6386 files. The box, the auth and the network were all fine minutes later,
  and both clients went through on the first retry. `tar -x` overwrites, so a re-run is idempotent
  and only costs the bytes again — re-send the whole client, do not try to resume.

## Next

- ~~Let the transfer finish~~ — done, verified by diffing local and remote `ls-files --ignored`
  lists per worktree, not by trusting the counts. (The counts alone mislead: a remote list gains the
  generated `.env` and loses the local lock file, so it can match by accident.)
- **MCP and OAuth are not set up on the box**: Asana, Instatic, Webflow and Drive all need their own
  sign-in there, and `drive.mjs` will want `drive.mjs auth` on its own 7-day clock.
- **Orca does not run there** — it is a Windows app. The worktrees are plain `git worktree`, so
  Orca's per-worktree niceties (briefs, `.orca-*.md`, automatic `npm install`) are absent.
- **Fix the asset source of truth** so the next box bootstraps itself: put the media in R2 and
  rewrite `scripts/bootstrap.sh` to pull from there instead of the dead VPS path. Deferred by
  Alejandro in favour of the one-off push; this run is the argument for doing it.
- **Decide whether the old repo's five clients get imported** into this repo's worktrees. Separate
  task — it changes repo content, not just the devbox.

## Version Control

Follows the root-level version control rules in [SYSTEM_RULES.md](../../SYSTEM_RULES.md).
