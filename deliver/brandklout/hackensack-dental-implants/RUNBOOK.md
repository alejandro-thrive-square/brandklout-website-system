# hackensack-dental-implants runbook

Standing state: what is true now, what is next, the traps. Each step's own history is in its
`output/RUNBOOK.md`; add a row below for every run.

## Standing

**Hackensack Center for Dental Implants**, a Brandklout client. The worktree `bk-hackensack-dental-implants`
owns this folder and nothing else. Start at [`docs/project-overview.md`](./docs/project-overview.md).

- **The current site is captured in full** (2026-09-30): 38 pages, 1440 + 390 screenshots, 675 assets,
  a scanned mirror that renders offline, 6 blog posts from the Webflow CMS, URL inventory, email DNS,
  tracking. Read [`docs/migration/old-site-capture.md`](./docs/migration/old-site-capture.md) first.
- **The client chose concept 04** (https://hackensack-dental-implants.webflow.io/concept-04-human-transformation).
  The home page is rebuilt to it as a local canary (2026-09-30), not pushed anywhere. Read
  [`scenario-0-new-site/03-design-build/output/canary-review.md`](./scenario-0-new-site/03-design-build/output/canary-review.md);
  open `OPEN-home.html` in that `output/` folder. It waits on six items to confirm.
- `scenario-0-new-site` is started (from `dd0359ee`); steps 01 and 02 have not been run.
- `scenario-1-migration` is started (from `dd0359ee`) because the capture step lives there. **The
  scope is still not recorded**: migration to Instatic, or work on the Webflow site, is not decided.
- The current site is Webflow site `6a1f4de5739bab24f074660f`, in the `webflow-brandklout` grant.
  Read-only: [`docs/mcp-access.md`](./docs/mcp-access.md).
- Shared drive `0ADqUKcTkH0SxUk9PVA` is readable and holds logos, before and afters, clinical and
  office photos. Nothing is pulled from it yet.
- Heavy capture files are in R2 ([`assets.tsv`](./assets.tsv)), not on the shared drive.
- `~/.webzite/.env` has an empty `[hackensack-dental-implants]` section; the worktree `.env` carries
  `[shared]` only.

## Next

1. Get rulings on the six items in `canary-review.md`, and decide where the menu, financing, hours
   and office photographs go (the concept has no place for them); then the inner pages.
1. Record the scope and the Asana task in `docs/project-overview.md`, and get a ruling on the
   content findings (blog posts that still name Arvada Dental Center, four dead links, the second
   phone number).
2. Upload the capture to the shared drive (manual) and re-run the Wayback sweep once; both are in the
   step runbook.
3. Migration: step 02, redirect map. Staying on Webflow: start `scenario-6-webflow-sites` instead.
4. On `main`: add this client to the Webflow registry in `deliver/docs/mcp-access.md` and to the map
   in `deliver/docs/GOOGLE_DRIVE.md`, and fix the capture scripts for Webflow (list in the step runbook).

## Gotchas

- **Paths.** The step output folder is ~180 characters deep and Windows stops Python at 260. Capture
  files use short flat names; do not nest deeper under `output/`.
- The design authority is concept 04 on `hackensack-dental-implants.webflow.io`, a different Webflow site from the live one.
- The step's `mirror-site.mjs`, `export-posts.mjs --scrape` and plain `extract_assets.py` do not
  work on a Webflow site. Use the four scripts in the step's `output/code/`.
- The folder was scaffolded by hand before any scenario was chosen; `scenario.mjs start` left the
  README, RUNBOOK and `docs/` alone.
- `docs/facts.md` is read off the live site, not confirmed by the client.

## Runs

| Date | Scenario / step | What happened | Commit |
| --- | --- | --- | --- |
| 2026-09-30 | setup | Orca worktree `bk-hackensack-dental-implants` from `main` at `dd0359ee`; client folder scaffolded; master env section added | first commit on the branch |
| 2026-09-30 | scenario-1-migration / 01-old-site-capture | Full capture of the live Webflow site: 38 pages, screenshots, 675 assets, offline mirror (scanned), CMS blog export, URL inventory, email DNS, tracking; R2 backup; content findings written up | `6e6fc2cc`; R2 manifest (1,663 files, 568 MB) in the commit after it |
| 2026-09-30 | scenario-0-new-site / 03-design-build | Home page canary: eight chapters, four pinned scroll scenes, client photos only, local build; drive pulled; probe 35/35 | `1ef53236`; R2 manifest in the commit after it |
| 2026-09-30 | scenario-0-new-site / 03-design-build | Home page rebuilt to the client's chosen concept 04 (Newsreader, DM Sans, its sections and copy); client photos; three scroll scenes; double-click preview; probe 27/27 | `073af353`; R2 manifest in the commit after it |

## Version Control

Follows [SYSTEM_RULES.md §5](../../../SYSTEM_RULES.md).
