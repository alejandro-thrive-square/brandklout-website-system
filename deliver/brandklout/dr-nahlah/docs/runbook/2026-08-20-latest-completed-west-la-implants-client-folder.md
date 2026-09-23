## Latest completed: West LA Implants client folder + worktree (2026-08-20, latest)

Commit **70e1656**. Orchestration task only, no client build work.

New Brandklout client: **West LA Implants** (`westlaimplants.com`), Dr. Tony Barriere DDS,
12301 Wilshire Blvd #205, Los Angeles CA 90025, (310) 481-0111. Arrived **directly from
Brandklout, not through Asana** — the 2026-08-05 Asana pull predates it, so there is no task GID to
record in artifacts yet. That is question 7 in the overview.

- Folder `deliver/brandklout/west-la-implants/` with `docs/project-overview.md` and
  `docs/mcp-access.md`.
- Routed as **Development from Scratch**: modules `00`-`10` copied from `deliver/process/` at
  baseline **`8d65269`**. The 00 module's `style-guide/` and `client-first-docs/` were deliberately
  **not** copied — they are shared reference material and stay canonical in `deliver/process/`.
  `__pycache__` excluded. Recorded in `00/.tmp/copied-workflows.json` and `routing-check.json`.
- Existing site inventoried from `sitemap_index.xml`: WordPress + Rank Math, **42 pages + 46 posts
  = 88 URLs**, written to `01-content-intake/.tmp/existing-site-urls.txt`.
- Registered in `docs/ASANA-DISPATCH.md` (not-in-Asana list), `docs/ORCHESTRATION.md` (worktree
  table) and the partner `docs/mcp-access.md` client site registry (no site ID — read-only).
- Worktree **`bk-west-la-implants`** created at
  `C:/Users/ACER/orca/workspaces/Webzite Agentic Workflow/bk-west-la-implants`, branch
  `refs/heads/bk-west-la-implants`, head `70e1656`, clean, client folder present. No agent launched
  in it yet.

### Two things the next session must not skip

1. **The page count is blocking and is NOT 88.** 88 is the old WordPress footprint. A from-scratch
   build consolidates that. `pages x 2 days` cannot be computed until Brandklout names the number,
   so the schedule and the fee are both open. Do not let a design phase start against an assumed
   count.
2. **`14-migration-seo-redirects` is flagged but not copied.** If the new site replaces
   `westlaimplants.com` at the same domain, those 88 URLs currently returning 200 need a redirect
   map before `09-launch` or the practice loses its rankings on cutover. Pull the module in once
   the domain plan is confirmed.

Worth noting: `orca worktree create --base-branch main` came up at the correct local head this
time, **not** at `origin/main`. Local main is 148 commits ahead of origin, so the old trap
(new worktree silently missing the starter commit) would have bitten hard. Still verify the head
after every create rather than trusting the flag.
