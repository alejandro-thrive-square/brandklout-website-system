# 2026-09-17 — Obsidian vault set up on the repo root, 139 broken doc links repaired

Repo-level. The vault is the repository itself: `.obsidian/` sits at the root, so every `.md`
in this repo is a note and every relative markdown link is a graph edge.

## Done

- **`.obsidian/app.json`** — was `{}`. Now: `useMarkdownLinks: true` and `newLinkFormat: relative`
  so anything Obsidian writes matches the house style (`[text](../../SYSTEM_RULES.md)`) instead of
  wikilinks, `alwaysUpdateLinks: true` so moving a file rewrites the links that point at it, and
  `userIgnoreFilters` regexes that hide `.tmp/`, `node_modules/`, `.venv/`, `__pycache__/` and
  `test-results/`. Without the filters the vault is 1,020 notes; with them it is **368 real docs**,
  because 652 `.md` files are workflow artifacts under some `.tmp/`.
- **`.obsidian/graph.json`** — kept Alejandro's physics (repel, link distance, scale). Added
  `showArrow: true`, turned `showAttachments` off, and added six colour groups: root rules
  (amber) · `deliver/process` (purple) · client folders (teal) · runbooks (grey-blue) ·
  `mcp-servers` (green) · `manage`/`scripts` (blue).
- **139 broken relative links repaired across 109 files.** 104 of them pointed at
  `SYSTEM_RULES.md` with the wrong number of `../` — e.g. a module at
  `deliver/brandklout/<client>/workflows/07-webflow-build/` linking `../../../../SYSTEM_RULES.md`,
  which resolves above the repo root. Every one of those edges was missing from the graph and every
  one of those links was dead in the docs too. Resolved links went 935 → 1,073, broken 208 → 69,
  orphan notes 67 → 18. The repair only retargeted a link when exactly one non-`.tmp` file in the
  repo carried that basename; ambiguous ones (`README.md`, `project-overview.md`,
  `TEMPLATE_LIBRARY_PLAN.md`) were left alone.
- **`.gitignore`** — added `.obsidian/workspace-mobile.json`, `.obsidian/cache`,
  `.obsidian/plugins/*/data.json` and `.trash/`, with a comment saying the rest of `.obsidian/` is
  tracked on purpose so the graph looks the same on every machine. `/untitled.md` became
  `/untitled*.md`.
- Deleted the two empty `untitled.md` / `untitled-2.md` notes at the root; `untitled-2.md` was
  tracked, so it was `git rm --cached`'d as well.

## Gotchas

- **Obsidian cannot see dot-folders, and there is no setting for it.** The 23 repo-level runbooks
  under `.claude/runbook/` plus `.claude/RUNBOOK.md` are invisible in the vault and absent from the
  graph. Client runbooks under `deliver/brandklout/<client>/docs/runbook/` are fine. The only fixes
  are a directory junction (`mklink /J`) pointing at `.claude`, which must then be git-ignored, or
  moving the folder out of `.claude/`. Neither was done.
- **The vault is the repo, so `.obsidian/` is versioned.** Settings changes are commits and they
  travel to every `bk-*` worktree on merge. `workspace.json` stays ignored — it is per-machine pane
  state and it once kept a stale pointer to a Webzite agency file alive in this Brandklout-only repo.
- **`userIgnoreFilters` entries wrapped in `/…/` are regexes**, and they are matched against the
  path, so `.tmp` anywhere is `"/\\.tmp\\//"`. A bare `node_modules/` would only match at the root.
- Excluded files are still *indexed*; they are hidden from search, graph and the quick switcher.
  Nothing was deleted by the filters.
- The 69 links still broken mostly name files that do not exist anywhere in the repo
  (`PRICING-CONFIRMATION.md`, `BLOG-CONTENT.md`, `15-instatic-api-sync.md` as referenced from a
  runbook). `hideUnresolved: true` keeps them out of the graph. Note that pricing docs are
  out of scope for Brandklout by the root rules, so that one should be deleted, not restored.

## Next

- Decide on the `.claude/` junction, or leave the system runbooks out of the graph.
- The 18 remaining orphan notes (mostly per-client `workflows/*` modules and
  `arvada-dental-center/docs/`) are unlinked from anything — worth linking from the client's
  `docs/RUNBOOK.md` if they are still live.
- The vault indexes all 15 `bk-*` worktrees only if you open each one; each worktree needs its own
  `.obsidian/`, which it now inherits from `main` on merge.

## Version Control

Tracked with the repo per [SYSTEM_RULES.md §4](../../SYSTEM_RULES.md).
