# Deliver: Rules

How Brandklout sites are delivered. The process is organised as **scenarios** (the kinds of job we
do), each a numbered list of **steps**, plus shared **tools**. The FigJam board *Deliver SOP's* draws
the same scenarios; when the board and these files disagree, fix both.

## 1. Scenarios

| # | Scenario | Folder | Platform |
| --- | --- | --- | --- |
| 0 | Website from Scratch | [process/scenario-0-new-site](./process/scenario-0-new-site/README.md) | Instatic on Railway, Cloudflare |
| 1 | Website Migration | [process/scenario-1-migration](./process/scenario-1-migration/README.md) | capture the old site, then Scenario 0 |
| 2 | Website Updates / Expansions | [process/scenario-2-updates-expansions](./process/scenario-2-updates-expansions/README.md) | Webflow (live clients) and Instatic |
| 3 | Ads Landing Pages | [process/scenario-3-ads-landing-pages](./process/scenario-3-ads-landing-pages/README.md) | Instatic and Webflow |
| 4 | Update Plugins Across Sites | [process/scenario-4-update-plugins](./process/scenario-4-update-plugins/README.md) | every Instatic site, staging then production |
| 5 | Instatic Release Update | [process/scenario-5-instatic-release-update](./process/scenario-5-instatic-release-update/README.md) | every Railway instance, staging then production, no data loss |

The numbers follow the board. Full index:
[process/PROCESS_INDEX.md](./process/PROCESS_INDEX.md).

## 2. Where things live

- **Process (this repo, `main`):** `deliver/process/` — scenario folders with one directive per step,
  and `tools/` with the shared scripts. Directives are the program: an agent reads the step `.md` and
  runs the tools it names.
- **Client work (the client's branch `bk-<client>`, its own Orca worktree):**
  - `deliver/brandklout/<client>/docs/` — `project-overview.md`, `facts.md`, `mcp-access.md`,
    `open-questions.md`, and the runbook (`RUNBOOK.md`, `runbook/INDEX.md`, dated runs).
  - `deliver/brandklout/<client>/workflows/<step>/.tmp/` — everything a step produces, named after the
    scenario step (for example `workflows/03-design-build/.tmp/site-src/`). Scripts run from
    `deliver/brandklout/<client>/`.
- **Shared Brandklout docs:** `deliver/brandklout/docs/` — design standard, fluid root, Client-First,
  Google Drive map, MCP access, Asana dispatch, orchestration. Shared scripts in
  `deliver/brandklout/scripts/` (Asana, journey audit, staging verify).
- **Media:** the client's Google Drive, pulled with `scripts/drive.mjs` into the step that uses it.
  Client media is gitignored and dies with the worktree: never keep the only copy there, and never
  create a client-level `assets/` folder.

## 3. Working rules

- **Read the step directive before starting the step**, then only the tools it names.
- **Promote, don't fork.** A fix or script that another client will need goes into
  `deliver/process/` as its own commit on `main`, then client branches merge `main`. Never leave the
  only copy of a rule or tool in one client folder.
- **Credentials** only in `~/.webzite/.env` ([SYSTEM_RULES.md §4.2.2](../SYSTEM_RULES.md)); never in
  docs, boards, Asana, commits or chat.
- **Asana and client-facing actions** (comments, status changes, emails, publishes to production) are
  confirmed with a person first.
- **Runbook** after every task ([SYSTEM_RULES.md §5](../SYSTEM_RULES.md)).
- **No prices.** Brandklout is a partner engagement: never compute or record a price, rate, quote or
  cost under `deliver/brandklout/`.

## 4. Quality bar

- [DESIGN-STANDARD.md](./brandklout/docs/DESIGN-STANDARD.md) is the design bar; brand authority is
  resolved before tokens, and a canary page is approved before the rest of the pages are built.
- Fluid root, rem sizing, breakpoints desktop / 1279 / 991 / 767 / 479
  ([FLUID-ROOT.md](./brandklout/docs/FLUID-ROOT.md)).
- Tested from 390 to 2560 wide and in Safari; gates click, take their page list from the site, and
  check the published page.
- SEO ready: one H1 and ordered headings, titles, descriptions, schema, Open Graph and alt text on
  every page.
- Launch is blocked while a critical or high issue is open.

## Version Control

Follows [SYSTEM_RULES.md §4](../SYSTEM_RULES.md). Never commit `.env` files, secrets or media;
lightweight `.tmp/` artifacts may be committed when they help review or handoff.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
