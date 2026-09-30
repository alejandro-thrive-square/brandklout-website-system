# hackensack-dental-implants runbook

Standing state: what is true now, what is next, the traps. Each step's own history is in its
`output/RUNBOOK.md`; add a row below for every run.

## Standing

**Hackensack Center for Dental Implants**, a Brandklout client. The worktree `bk-hackensack-dental-implants`
owns this folder and nothing else. Start at [`docs/project-overview.md`](./docs/project-overview.md).

- The worktree, branch and client folder exist. **No scenario is started**: the scope is not recorded
  yet, so nothing under `deliver/process/` has been copied in.
- The current site, https://www.hackensackdentalimplants.com/, is on Webflow.
- `~/.webzite/.env` has an empty `[hackensack-dental-implants]` section; the worktree `.env` carries
  `[shared]` only.

## Next

1. Record the scope and the Asana task in `docs/project-overview.md`.
2. Start the scenario that matches it: `node scripts/scenario.mjs start hackensack-dental-implants <scenario>`
   (`node scripts/scenario.mjs list` prints them).
3. Add client credentials to the master file section, then `node scripts/env-sync.mjs`.
4. Write `docs/mcp-access.md` once the platform and its MCP profile are known.

## Gotchas

- The folder was scaffolded by hand in the shape `scenario.mjs start` writes, because no scenario was
  chosen. `start` leaves an existing README, RUNBOOK and `docs/` alone, so it is safe to run later.
- `docs/facts.md` was read off the live home page on 2026-09-30, not confirmed by the client.

## Runs

| Date | Scenario / step | What happened | Commit |
| --- | --- | --- | --- |
| 2026-09-30 | setup | Orca worktree `bk-hackensack-dental-implants` from `main` at `dd0359ee`; client folder scaffolded; master env section added | first commit on the branch |

## Version Control

Follows [SYSTEM_RULES.md §5](../../../SYSTEM_RULES.md).
