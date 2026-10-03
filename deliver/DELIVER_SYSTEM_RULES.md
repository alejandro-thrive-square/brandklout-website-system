# Deliver: Rules

How Brandklout sites are delivered. The process is organised as **scenarios** (the kinds of job we
do), each a numbered list of **steps**, plus shared **tools**. The FigJam board *Deliver SOP's* draws
the same scenarios; when the board and these files disagree, fix both.

## 1. Scenarios

| # | Scenario | Folder | Platform |
| --- | --- | --- | --- |
| 0 | Website from Scratch | [process/scenario-0-new-site](./process/scenario-0-new-site/README.md) | Instatic on Railway, Cloudflare |
| 1 | Website Migration | [process/scenario-1-migration](./process/scenario-1-migration/README.md) | capture the old site, then Scenario 0 |
| 2 | Website Updates / Expansions | [process/scenario-2-updates-expansions](./process/scenario-2-updates-expansions/README.md) | Instatic (live sites) |
| 3 | Ads Landing Pages | [process/scenario-3-ads-landing-pages](./process/scenario-3-ads-landing-pages/README.md) | designed for both; built here on Instatic, in Scenario 6 on Webflow |
| 4 | Update Plugins Across Sites | [process/scenario-4-update-plugins](./process/scenario-4-update-plugins/README.md) | every Instatic site, staging then production |
| 5 | Instatic Release Update | [process/scenario-5-instatic-release-update](./process/scenario-5-instatic-release-update/README.md) | every Railway instance, staging then production, no data loss |
| 6 | Webflow Sites | [process/scenario-6-webflow-sites](./process/scenario-6-webflow-sites/README.md) | Webflow (seven live clients), native builds over the MCP |

The numbers follow the board. Full index:
[process/PROCESS_INDEX.md](./process/PROCESS_INDEX.md).

## 2. Where things live

**Main is for the system; client worktrees are for the sites** (the *Cloud Website Deliver System*
board draws this).

- **The system (main):** `deliver/process/`.
  - `scenario-N-name/NN-step/` is one folder per step: the directive `NN-step.md`, the step's own
    `scripts/`, `tools.json` (the shared toolkits it uses) and an empty `output/`.
  - `tools/<toolkit>/` holds the shared toolkits, one copy each. A toolkit whose scripts import or
    run another toolkit lists it in its own `toolkit.json` (`"requires"`); `scenario.mjs` mirrors the
    whole chain, so a step's `tools.json` names only what the step itself runs. Plus the rules, `scripts/`,
    `deliver/docs/` and `deliver/scripts/`.
- **`deliver/brandklout/` holds client folders and nothing else.** Shared standards live in
  `deliver/docs/`, cross-client scripts (the Asana pulls) in `deliver/scripts/`. A standard or gate that
  belongs to one step lives in that step (the design standard and journey audit in Scenario 0 step 03).
- **A client (its branch `bk-<client>`, its own Orca worktree):** `deliver/brandklout/<client>/`, laid
  out like the process for the scenarios it runs. **The process is tracked on main only**; the
  client branch tracks only what the client produced:
  - Tracked: `README.md` (which scenarios, from which commit), `RUNBOOK.md` (standing state and a row
    per run), `docs/` (`project-overview.md`, `facts.md`, `mcp-access.md`), and each step's
    **`output/`**: everything the step produces. `output/assets/` (media, gitignored, backed up to
    R2), `output/code/` (builds, scripts and config written for this client, e.g. `embeds.json`) and
    `output/RUNBOOK.md` (that step's history).
  - **Untracked mirror** (gitignored, rebuilt by `scenario.mjs sync` from the committed `main` ref):
    each step's directive and scripts beside its `output/`, and `tools/<toolkit>/` for the toolkits the
    started steps use, so every relative path in a directive or script works the same on main and in
    the client folder. `.process-mirror.json` records the commit and each file's blob id. Until
    2026-10-03 this was a tracked copy on the client branch, and every fix made in it stayed on that
    branch; `scenario.mjs detach` untracks an old copy once.
- **Media:** the client's Google Drive and the step's `output/assets/`, pulled with `scripts/drive.mjs`;
  R2 holds the backup. Never keep the only copy in a worktree. `node scripts/assets.mjs push` uploads
  every untracked file under each client folder in every worktree and writes the client's
  `assets.tsv` manifest (commit it); `pull <client>` restores a client, hash-verified; `status`
  compares. Session cookies, keys, env files and `recovered/` dumps are never uploaded. Run a push at
  the end of every task that made media, and before removing a worktree.
- `output/` replaced `.tmp/` on 2026-09-23. Client branches from before keep `workflows/<module>/.tmp/`
  until they are moved to the scenario layout.

## 3. Working rules

- **Start a scenario for a client with `node scripts/scenario.mjs start <client> <scenario>`.** It
  scaffolds each step's `output/`, mirrors the step folders and toolkits from main, and records the
  commit in the client README.
- **Work in the step folder, write only to its `output/`.** Read the step directive first, then only
  the tools it names. Scripts run from the step folder and write to `./output`. Anything else in a
  step folder is the mirror: gitignored, and replaced on the next sync.
- **The process has one source: `deliver/process/` on main.** Client worktrees do not check it out;
  `scenario.mjs sync` mirrors it from the committed `main` ref (never from the main checkout's
  working tree, so a half-made edit there never reaches a client). Sync runs by itself when a
  worktree is set up (`npm install`) and at the start of every Claude Code session
  (`.claude/settings.json`); run `node scripts/scenario.mjs sync` yourself after main changes, and
  before reading a directive in any other runtime. `scenario.mjs status` says whether the mirror is
  behind, edited, or still tracked.
- **Fix the process on main, never in the mirror.** A directive, script or toolkit fix, or a
  runbook Gotcha that would bite another site, is a system commit on main in the same session that
  found it. From a client worktree: make the change in the main checkout (`git worktree list` names
  it) and commit only the paths you touched (`git -C <main> add <paths>` then
  `git -C <main> commit -- <paths>`), then sync. When another agent is working in the main checkout,
  use a short branch instead (`git worktree add <dir> -b process-<topic> main`, commit there, then
  `git merge process-<topic>` from the main checkout) so neither of you commits the other's edits.
  If you edit a mirror file anyway, `sync` refuses to overwrite it and names it (exit 3) until it is
  ported to main or discarded with `--force`: the edit exists nowhere else.
- **A client branch changes only its own folder.** It merges into main when the site launches
  (`git merge --no-ff`), adding or updating that client's folder and nothing else. A system update
  changes everything except client folders. `node scripts/check-scope.mjs` checks both; the
  `pre-commit` and `pre-merge-commit` hooks enforce it on main.
- **Credentials** only in `~/.webzite/.env` ([SYSTEM_RULES.md §4.2.2](../SYSTEM_RULES.md)); never in
  docs, boards, Asana, commits or chat.
- **Computer use goes through Codex.** Any task that needs a website or desktop app with no
  API (GoHighLevel, Elfsight, vendor dashboards) runs as one plain instruction through
  [`tools/codex-computer-use`](./process/tools/codex-computer-use/README.md). It is read-only unless
  `--allow-writes`, and runs in a background tab of the user's own Chrome. Do not use Jev,
  `orca computer`, Cua sandboxes or new CDP scripts for this. **Secondary: Claude in Chrome**
  (`mcp__claude-in-chrome__*`), for two cases:
  - FigJam and Figma edits, through its `javascript_tool` and the plugin API. Codex cannot reach
    `window.figma`, and it damaged a lane when it tried. Experiment on a duplicated board first.
  - A fallback when a Codex run fails, stalls, or the ChatGPT app is unavailable.
  It works in the foreground tab, so the user should not be using Chrome meanwhile.
- **Asana and client-facing actions** (comments, status changes, emails, publishes to production) are
  confirmed with a person first.
- **Runbook** after every run: the step's `output/RUNBOOK.md` and a row in the client `RUNBOOK.md`
  ([SYSTEM_RULES.md §5](../SYSTEM_RULES.md)). System runs go to `.claude/runbook/`.
- **No prices.** Brandklout is a partner engagement: never compute or record a price, rate, quote or
  cost under `deliver/brandklout/`.

## 4. Quality bar

- [DESIGN-STANDARD.md](./process/scenario-0-new-site/03-design-build/DESIGN-STANDARD.md) is the design bar; brand authority is
  resolved before tokens, and a canary page is approved before the rest of the pages are built.
- Fluid root, rem sizing, breakpoints desktop / 1279 / 991 / 767 / 479
  ([FLUID-ROOT.md](./docs/FLUID-ROOT.md)).
- Tested from 390 to 2560 wide and in Safari; gates click, take their page list from the site, and
  check the published page.
- SEO ready: one H1 and ordered headings, titles, descriptions, schema, Open Graph and alt text on
  every page.
- Images: client sources (Drive, brief links, old site) before stock, every photo showing what its
  text says, no photo overused ([IMAGES.md](./docs/IMAGES.md)).
- Review comments: every BugHerd comment gets a scope decision (site-wide or this page) before the
  fix, and a site-wide fix is made at the source and checked on every page
  ([BUGHERD.md](./docs/BUGHERD.md)).
- Launch is blocked while a critical or high issue is open.

## Version Control

Follows [SYSTEM_RULES.md §4](../SYSTEM_RULES.md). Never commit `.env` files, secrets or media;
lightweight `output/` artifacts may be committed when they help review or handoff.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
