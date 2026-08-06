# Brandklout — Orchestration Layer

How parallel client work is split across Orca worktrees, and what stays here.

Established 2026-08-05. Companion to [ASANA-DISPATCH.md](./ASANA-DISPATCH.md).

## The model

**One worktree per client. This main checkout orchestrates and does not do client work.**

```
Webzite Agentic Workflow  (main, refs/heads/main)   <-- orchestration only
├── bk-grand-mission        worktree   -> deliver/brandklout/grand-mission-dentistry/
├── bk-arvada               worktree   -> deliver/brandklout/arvada-dental-center/
├── bk-mason-park           worktree   -> deliver/brandklout/mason-park/
└── bk-stone                worktree   -> deliver/brandklout/stone-dental-implant-center/
```

Repo id: `7b269532-4e7a-4ceb-baa4-707929ee41d3`

### Why per-client worktrees rather than tabs in one checkout

The usual pattern here is several Orca tabs in a *single* worktree running different CLIs against
the same task. That is the right shape when agents are racing the *same* problem. This is the
opposite shape: five independent clients, each editing its own folder, all at once. Separate
worktrees mean agents cannot collide on each other's files, and each client's work lands on its own
branch and can be reviewed and merged independently.

### What belongs where

| Layer | Does | Does not |
| :--- | :--- | :--- |
| **Main (orchestration)** | Asana pulls, dispatch decisions, cross-client archetypes, access files, merging client branches | Build pages, edit a single client's deliverables |
| **Client worktree** | Everything for that one client: intake, captures, design, QA | Touch another client's folder, write to Asana, publish to Webflow |

A client worktree that needs something cross-cutting — a new shared archetype, a platform grant, a
scope decision — reports it back here rather than deciding alone.

## Claude accounts — which profile runs what

| Account | Used for |
| :--- | :--- |
| `alejandromilanoescalona@gmail.com` (personal) | **Orchestration only** — this main checkout |
| `alejandro@thrivesquare.com` (team) | **All Brandklout client work** in the per-client worktrees |

Client work is billed and owned through the ThriveSquare/Brandklout side, so client worktrees must
not run on the personal account. Note the team account is also the one holding the Asana grant.

### How to select the account — use the PowerShell profile wrapper

`~/.claude-profiles.ps1` (loaded from the PowerShell profile) defines a `claude` function that
switches account by setting `CLAUDE_CONFIG_DIR` per terminal:

```powershell
claude team       # -> CLAUDE_CONFIG_DIR=~/.claude-team,     then launches Claude Code
claude personal   # -> CLAUDE_CONFIG_DIR=~/.claude-personal, then launches Claude Code
claude which      # report the active profile without launching
```

The choice is **sticky for that terminal session**, so it is genuinely per-worktree. Credentials are
per-profile; history, memories, skills and plugins are shared back into `~/.claude` via directory
junctions, so both accounts see the same project context.

Launch a client agent like this:

```text
orca terminal send --terminal <handle> --text 'claude team --permission-mode bypassPermissions' --enter --json
orca terminal wait --terminal <handle> --for tui-idle --timeout-ms 120000 --json
orca terminal send --terminal <handle> --text '<brief>' --enter --json
```

> [!NOTE]
> Do **not** rely on Orca's own account switching for this. As of Orca 1.4.169 neither
> `orca worktree create` nor `orca terminal create` takes an account/profile flag, and the CLI
> exposes only `account add` / `account list` — no `account use`. Orca's active account is global
> (`activeAccountIdsByRuntime.host`) and switched in the UI, which cannot give two worktrees
> different accounts at once. The profile wrapper can, so prefer it.

Verifying which account an agent actually got is not possible from scrollback — the TUI clears it.
Ask the agent directly instead:

```text
orca terminal send --terminal <handle> --text 'Run this and reply with only its output: echo $env:CLAUDE_CONFIG_DIR' --enter --json
```

## Creating a worktree for a new client

```text
orca worktree create --repo id:7b269532-4e7a-4ceb-baa4-707929ee41d3 \
  --name bk-<client-slug> --no-parent --agent claude --prompt "<brief>" --json
```

`--no-parent` keeps each client independent rather than stacked on another client's branch.

**Commit the client's starter docs to `main` before creating the worktree.** A git worktree is
created from a commit, so anything still untracked in `main` will simply not exist in the new
checkout — the agent would arrive to an empty client folder.

## Standing brief for every client agent

Every dispatched agent is expected to have read, in this order:

1. `deliver/brandklout/docs/ASANA-DISPATCH.md` — the batch-wide rules, especially how reference
   URLs may be used and where pages get built
2. `deliver/brandklout/<client>/docs/project-overview.md` — the task manifest
3. `deliver/brandklout/<client>/docs/mcp-access.md` — what is *not* permitted

Non-negotiables, repeated here because they are the ones most likely to be skipped under time
pressure:

- **Reference URLs are structure and content only.** Screenshot them, take the section order and
  copy angles, then design original work to [DESIGN-STANDARD.md](./DESIGN-STANDARD.md) —
  awwwards-grade, motion-led, benchmarked against the Dr. Nahlah build. Copying the reference's
  visual design is a failure, and so is shipping a plain templatised page.
- **Build locally**, at
  `deliver/brandklout/<client>/workflows/04-design/.tmp/<page-slug>/`, and report the full path.
- **Nothing goes to Webflow yet.** No client has a grant; local approval comes first.
- **Never invent testimonials, reviews, patient stories, or statistics.** Real practices, real
  content, sourced from the client's own material.
- **Never write to Asana.** Comments and status changes notify real Brandklout staff.
- **Stay inside your client folder.** Cross-client changes come back to main.
- Record the source Asana task GID in every artifact produced.

## Coordination

- Shared page archetypes (thank-you page, new-patient-special, implants) are tracked in
  [ASANA-DISPATCH.md](./ASANA-DISPATCH.md). An agent that authors a new archetype reports it so the
  other clients reuse rather than reinvent it.
- Blockers that main must resolve: missing client website URLs, the unretrieved Asana attachments,
  Webflow grants, and the Stone scope questions.
- Read a worktree's state with `orca worktree list --json` / `orca terminal list --json`; send
  follow-up work with `orca terminal send`.

## Version Control

One branch per client worktree, merged back to `main` after review. Documentation and lightweight
`.tmp/` artifacts only — never secrets or binary/media assets. Follows the root-level rules in
[SYSTEM_RULES.md](../../../SYSTEM_RULES.md).
