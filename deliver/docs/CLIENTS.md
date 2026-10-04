# Brandklout clients — active worktrees

Every client lives on its own branch (`bk-<client>`) and its own Orca worktree, for good. **Main
tracks no client folders** (since 2026-10-03): the branch is the client's whole history, its media is
in R2, and a client never merges into main. Work on a client in its worktree; read one from anywhere
with `node scripts/client.mjs` (`runbook`, `log`, `ls`, `show`, `where`).

Regenerate this table after a client is added, renamed or retired:
`node scripts/client.mjs list --md`, and paste it below.

| Client folder | Branch | Worktree | Scenarios | Last client commit |
| --- | --- | --- | --- | --- |
| `alki-house` | `bk-alki-house` | `~/orca/workspaces/Brandklout Website System/bk-alki-house` | pre-v2 (`workflows/`) | 2026-09-27 |
| `arvada-dental-center` | `bk-arvada` | `~/orca/workspaces/Brandklout Website System/bk-arvada` | pre-v2 (`workflows/`) | 2026-09-30 |
| `brandklout-website` | `bk-brandklout-website` | `~/orca/workspaces/Brandklout Website System/bk-brandklout-website` | pre-v2 (`workflows/`) | 2026-09-27 |
| `dentalpro-toolkit` | `bk-dentalpro-toolkit` | — (no worktree) | — | 2026-09-23 |
| `dr-nahlah` | `bk-dr-nahlah` | `~/orca/workspaces/Brandklout Website System/bk-dr-nahlah` | pre-v2 (`workflows/`) | 2026-10-03 |
| `grand-mission-dentistry` | `bk-grand-mission` | `~/orca/workspaces/Brandklout Website System/bk-grand-mission` | pre-v2 (`workflows/`) | 2026-09-27 |
| `hackensack-dental-implants` | `bk-hackensack-dental-implants` | `~/orca/workspaces/Brandklout Website System/bk-hackensack-dental-implants` | S0, S1 | 2026-10-03 |
| `institute-for-advanced-dentistry` | `bk-ifa-dentistry` | `~/orca/workspaces/Brandklout Website System/bk-ifa-dentistry` | S0 | 2026-10-03 |
| `legacy-dental-pasadena` | `bk-legacy-dental` | `~/orca/workspaces/Brandklout Website System/bk-legacy-dental` | pre-v2 (`workflows/`) | 2026-09-27 |
| `livewell-dental` | `bk-livewell` | `~/orca/workspaces/Brandklout Website System/bk-livewell` | S0, S1 | 2026-10-03 |
| `marvel-dental` | `bk-marvel-dental` | `~/orca/workspaces/Brandklout Website System/bk-marvel-dental` | pre-v2 (`workflows/`) | 2026-09-27 |
| `mason-park` | `bk-mason-park` | `~/orca/workspaces/Brandklout Website System/bk-mason-park` | pre-v2 (`workflows/`) | 2026-10-03 |
| `mason-park-kids` | `bk-mason-park-kids` | `~/orca/workspaces/Brandklout Website System/bk-mason-park-kids` | pre-v2 (`workflows/`) | 2026-10-03 |
| `oceanic-dental` | `bk-oceanic-dental` | `~/orca/workspaces/Brandklout Website System/bk-oceanic-dental` | S0, S1 | 2026-10-03 |
| `stone-surgical-arts` | `bk-stone` | `~/orca/workspaces/Brandklout Website System/bk-stone` | pre-v2 (`workflows/`) | 2026-10-01 |
| `stone-dental-implant-center` | `bk-stone-dental` | `~/orca/workspaces/Brandklout Website System/bk-stone-dental` | pre-v2 (`workflows/`) | 2026-09-27 |
| `stone-med-spa` | `bk-stone-med-spa` | `~/orca/workspaces/Brandklout Website System/bk-stone-med-spa` | pre-v2 (`workflows/`) | 2026-10-03 |
| `west-la-implants` | `bk-west-la-implants` | `~/orca/workspaces/Brandklout Website System/bk-west-la-implants` | S3 | 2026-10-03 |

- **Scenarios**: S0 new site, S1 migration, S3 ads landing pages (an untracked mirror of main's
  `deliver/process/`, refreshed by `node scripts/scenario.mjs sync`). **pre-v2** clients still use
  the older `workflows/` layout inside their folder.
- **Last client commit**: the newest non-merge commit that touched the client folder.
- `dentalpro-toolkit` is a 26-page template kit with no worktree; it was only ever on main and is kept
  on `bk-dentalpro-toolkit`.
- `bk-termly-consent-rollout` is an old system branch, not a client.
- Branch names that are not a prefix of their folder (`bk-ifa-dentistry`, `bk-stone`,
  `bk-stone-dental`) are mapped in `ALIASES` in `scripts/client.mjs`.

## Adding a client

`bash scripts/new-client-worktree.sh <slug>` creates `bk-<slug>` from main (no client folders),
then `node scripts/scenario.mjs start <slug> <scenario>` in the new worktree. Add the row here.

## Version Control

Follows [SYSTEM_RULES.md §4](../../SYSTEM_RULES.md). Lives on main; regenerated, not hand-edited.
