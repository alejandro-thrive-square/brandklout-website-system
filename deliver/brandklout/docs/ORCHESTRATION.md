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
├── bk-dr-nahlah            worktree   -> deliver/brandklout/dr-nahlah/
├── bk-stone                worktree   -> deliver/brandklout/stone-dental-implant-center/
├── bk-livewell             worktree   -> deliver/brandklout/livewell-dental/
├── bk-west-la-implants     worktree   -> deliver/brandklout/west-la-implants/
├── bk-legacy-dental        worktree   -> deliver/brandklout/legacy-dental-pasadena/
└── bk-ifa-dentistry        worktree   -> deliver/brandklout/institute-for-advanced-dentistry/
```

Repo id: `7b269532-4e7a-4ceb-baa4-707929ee41d3`

### Why per-client worktrees rather than tabs in one checkout

The usual pattern here is several Orca tabs in a *single* worktree running different CLIs against
the same task. That is the right shape when agents are racing the *same* problem. This is the
opposite shape: six independent clients, each editing its own folder, all at once. Separate
worktrees mean agents cannot collide on each other's files, and each client's work lands on its own
branch and can be reviewed and merged independently.

### What belongs where

| Layer | Does | Does not |
| :--- | :--- | :--- |
| **Main (orchestration)** | Asana pulls, dispatch decisions, cross-client archetypes, access files, merging client branches | Build pages, edit a single client's deliverables |
| **Client worktree** | Everything for that one client: intake, captures, design, QA | Touch another client's folder, write to Asana, publish to Webflow |

A client worktree that needs something cross-cutting — a new shared archetype, a platform grant, a
scope decision — reports it back here rather than deciding alone.

### Propagation is versioned, not live

A client worktree is isolated at a Git commit. It does not see later local `main` commits, changes
to `deliver/process/`, or untracked root-worktree files until those inputs are deliberately made
available. Before dispatch, checkpoint a clean client branch, merge current local `main`, record
`process_baseline_commit` in the project overview and runbook, and confirm the task's references
exist inside that worktree. Follow [ORCA.md](../../../ORCA.md#client-worktrees-and-directive-propagation).

Reusable client learning is promoted to `deliver/process/` in a separate canonical commit. Merge
that commit into sibling clients only between bounded runs. Client agents do not edit the canonical
process opportunistically while also changing their client deliverable.

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
orca terminal send --terminal <handle> --text '<brief>' --enter --wait-submit 15 --json
```

> [!WARNING]
> From Windows PowerShell 5.1, a brief containing `"` never arrives: the quotes are mangled on the
> way to the native `orca` exe, no receipt prints, and the agent's prompt stays empty. Use single
> quotes inside briefs, confirm the receipt shows `turn_started`, and `orca terminal read` the
> terminal before any resend.

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
orca worktree create --repo id:db55534c-1992-4094-b865-7eaecc3e5eab \
  --name bk-<client-slug> --no-parent --base-branch main --json
```

That repo id is **Brandklout Website System** in `orca repo list --json`; the id this doc carried
until 2026-09-03 (`7b269532…`) was the old `webzite-agentic-workflow` repo and would have created the
worktree in the wrong repository. Orca names the branch `<git-username>/bk-<slug>`; rename it to bare
`bk-<slug>` right after create (`git branch -m`) so `git worktree list` stays uniform.

`--no-parent` keeps each client independent rather than stacked on another client's branch.
`--base-branch main` is intentional: this orchestration checkout may be ahead of `origin/main`, and
the client must start from the exact local baseline that contains its committed starter files.
Launch the team-profile client agent from the created terminal using the wrapper above; do not use
`--agent claude` here because Orca cannot select the required per-worktree Claude profile.

**Commit the client's starter docs and routed lightweight workflow files to local `main` before
creating the worktree, then verify the new worktree contains that commit.** Binary/media assets stay
ignored and must be synced separately. Anything uncommitted or untracked in the orchestration
checkout will not exist in the new checkout.

## Standing brief for every client agent

Every dispatched agent is expected to have read, in this order:

1. `deliver/brandklout/docs/ASANA-DISPATCH.md` — the batch-wide rules, especially how reference
   URLs may be used and where pages get built
2. The relevant canonical directive under `deliver/process/` and the current baseline commit
3. `deliver/brandklout/<client>/docs/project-overview.md` — the task manifest and deviations
4. `deliver/brandklout/<client>/docs/mcp-access.md` — the exact target and what is not permitted

Non-negotiables, repeated here because they are the ones most likely to be skipped under time
pressure:

- **Reference URLs are structure and content only.** Screenshot them, take the section order and
  copy angles, then design original work to [DESIGN-STANDARD.md](./DESIGN-STANDARD.md) —
  awwwards-grade, motion-led, benchmarked against the Dr. Nahlah build. Copying the reference's
  visual design is a failure, and so is shipping a plain templatised page.
- **Build locally**, at
  `deliver/brandklout/<client>/workflows/04-design/.tmp/<page-slug>/`, and report the full path.
- **Local approval comes before Webflow.** Use the shared `webflow-brandklout` grant only for the
  exact site ID in the client's access file, and follow the pasteable-components build standard.
- **Never invent testimonials, reviews, patient stories, or statistics.** Real practices, real
  content, sourced from the client's own material.
- **Never write to Asana.** Comments and status changes notify real Brandklout staff.
- **Stay inside your client folder.** Cross-client changes come back to main.
- Record the source Asana task GID in every artifact produced.

## Bounded Iteration Loop

Orca schedules sessions; it does not supply shared memory or quality control. Every repeated design
or build run must therefore operate as a small persisted state machine, not as an open-ended prompt.

Store `iteration-state.json` in the active workflow's `.tmp/` folder with:

- `baseline_commit` and `process_baseline_commit`;
- approved brand/reference authority and canary artifact;
- current page/component and the single acceptance transition this run owns;
- required gates with commands and expected results;
- attempt count, last failure, next action, and stop reason;
- files changed and checkpoint commit after a successful transition.

Each fresh session performs exactly one bounded unit: one canary, one page, one component batch, or
one named failed gate. It reads the state and runbook, verifies the baseline, executes that unit,
runs its acceptance gates, updates the state, and checkpoints before exiting. It may not silently
change the design system, delivery method, or target site to make a gate pass.

Stop and return to orchestration when any of these occurs:

- the same acceptance gate fails after two repair attempts;
- the required fix changes shared architecture, brand authority, approved content, or build method;
- the worktree is dirty with unrelated work or is missing its recorded baseline/reference inputs;
- a production mutation, publish, access change, or unresolved client decision is required;
- automated gates pass but visual review still rejects the direction — revise the canary instead of
  multiplying the rejected system across more pages.

This loop optimizes for accepted transitions per run. Page count, elapsed sessions, or static-gate
scores alone are not progress measures.

## Coordination

- Shared page archetypes (thank-you page, new-patient-special, implants) are tracked in
  [ASANA-DISPATCH.md](./ASANA-DISPATCH.md). An agent that authors a new archetype reports it so the
  other clients reuse rather than reinvent it.
- Cross-client blockers, baseline changes, platform access, and scope decisions are resolved in
  orchestration and then distributed at clean task boundaries.
- Read a worktree's state with `orca worktree list --json` / `orca terminal list --json`; send
  follow-up work with `orca terminal send`.

## Version Control

One branch per client worktree, merged back to `main` after review. Documentation and lightweight
`.tmp/` artifacts only — never secrets or binary/media assets. Follows the root-level rules in
[SYSTEM_RULES.md](../../../SYSTEM_RULES.md).

## Infrastructure

- **Workstation orchestration**: Windows 10/11 with Orca
- **Deployment host**: Hostinger VPS, Ubuntu 24.04 LTS
