# Orca Agent IDE — Local Workstation & Multi-Agent Orchestration

This document defines **Orca Agent IDE** as the supported local workstation for this system on Windows. Orca replaces two older mechanisms:

- the **WezTerm "Agent Hub"** (multiple PowerShell tabs, one CLI per tab) as the way to run several agents at once, and
- the hand-built **`@dispatch`** layer (removed 2026-07-20) as the way to orchestrate agents across providers.

> [!IMPORTANT]
> **Orca is external tooling, not part of this repository.** It is a desktop app installed on the Windows workstation (and optionally on the Hostinger VPS). None of Orca's binaries, settings, or credentials belong in this repo. Orca *operates on* this repo's git checkout; it is not versioned inside it.

## What Orca Is

Orca ([onorca.dev](https://www.onorca.dev/docs)) is a desktop IDE for running multiple AI coding agents side by side, each in its own isolated **git worktree**. Every task gets its own worktree, agent terminal, and browser tab, so agents never fight over branches or stashes. It is bring-your-own-subscription — Orca launches the agents' CLIs, it is not a model itself.

Core capabilities:

- **Worktree isolation** — one worktree + terminal + browser tab per task.
- **Multi-agent orchestration** — run Claude Code, Codex, Cursor CLI, GLM-5.2, or any custom CLI agent in parallel; race several on the same task and pick the winner.
- **Built-in diff review** — annotate an AI diff before committing.
- **Remote execution** — SSH targets, `orca serve`, or per-workspace sandboxes (see [Ways to Run](#ways-to-run)).

## Install on Windows

1. Download the Windows installer from GitHub: `orca-windows-setup.exe` (latest release at [github.com/stablyai/orca/releases/latest](https://github.com/stablyai/orca/releases/latest)) and run it.
2. On first launch, grant Orca access to your home directory for repo management. When prompted, let it **import existing config** — it reads `~/.claude` and `~/.codex` so your existing agent accounts/subscriptions carry over.
3. Set the default shell under **Settings → Terminal** — use **PowerShell** (the recommended default on Windows).
4. Add this repo: **Add Repo** in the sidebar → point Orca at the local checkout at `C:\Users\<USER>\Documents\Webzite Studio\Webzite Agentic Workflow`. Orca reads git state and sets the default branch as the base reference.

macOS (Homebrew or direct download) and Linux (AppImage / `.deb`) builds also exist, but Windows is the supported workstation for this system.

## Supported Agents

The existing account-separated agents map onto Orca's agent picker (**Settings → Agents** to customize launch args / env vars):

| Agent | Notes |
| :--- | :--- |
| **Claude Code** | Deep integration: usage tracking, account hot-swap, hooks. Covers the old `claude` / `claude2` account separation. Launches with permission-bypass flags by default. |
| **Codex** | Deep integration: usage, account hot-swap. |
| **Cursor CLI** | Deep integration. |
| **GLM-5.2** | Dedicated setup guide in Orca docs. |
| **Custom CLI agent** | The picker just launches a process in a terminal — any CLI works (e.g. `pi`, `opencode`) via **Add a custom CLI agent**. |

Authenticate each agent CLI once inside its Orca terminal (sign in when prompted). Never store agent auth tokens in this repository.

## Ways to Run

Orca supports four execution modes. The first is the default; the middle two map directly onto the existing Hostinger VPS.

1. **Local desktop** — agents run on the Windows machine alongside the UI. Default for day-to-day coding and fast iteration.
2. **SSH targets** — agents and `git worktree` run on a remote host (the **Hostinger VPS**); the editor, diff, and UI stay on the laptop. Use when the remote already has the tools and credentials. See [DEPLOYMENT.md](./DEPLOYMENT.md).
3. **Remote Orca server** — run `orca serve` on an always-on machine (the VPS); agents keep running when the laptop disconnects, and multiple clients (laptop, browser, mobile) reconnect to the same runtime. Complements the phone-driven [Hermes](./HERMES.md) model for working away from the computer.
4. **Per-workspace sandboxes** — each worktree provisions a disposable environment via a provider recipe (Docker, Fly, Modal, Vercel…). You bring and pay the provider.

## Run Orca Against the Hostinger VPS (Option A: SSH Target)

The chosen model for using the VPS is an **SSH target**: Orca stays installed on the Windows machine, while agents and their `git worktree`s run on the VPS. The editor, diff viewer, and UI stay local. Nothing is installed on the VPS for this mode beyond git and the agent CLIs — no Orca install, no headless-GUI concerns (that would only apply to the `orca serve` mode, which is not used here).

**VPS readiness (verified 2026-07-20):** Ubuntu 24.04, git 2.43, repo present at `/root/webzite-agentic-workflow`. Agent CLIs available: **Claude Code**, **Codex**, **OpenCode**. Not installed (optional, add later if needed): Cursor CLI (`cursor-agent`), `pi`, GLM. A separate `claude2` binary is **not** required — Orca switches between Claude accounts via its built-in hot-swap.

**Setup (in Orca on Windows):**

1. **Settings → SSH → Add host.** Use the same connection as the rclone `vps` remote: user `root`, host `<VPS_HOST>` (the Hostinger IP configured in `rclone config show vps` / the `VPS_HOST` deploy secret), port `22`, private key `C:\Users\<USER>\.ssh\id_ed25519`.
2. **Test the connection** and confirm it succeeds.
3. **Create a worktree → set "Run on" to the VPS SSH target**, choose the base ref (`origin/main`), and launch an agent (Claude Code / Codex / OpenCode).

**Keep the deploy checkout clean.** The GitHub Actions deploy aborts if `/root/webzite-agentic-workflow` has a dirty worktree (see [DEPLOYMENT.md](./DEPLOYMENT.md) and [SYSTEM_RULES.md §4.5](./SYSTEM_RULES.md)). Orca uses `git worktree`, which creates **separate** working directories, so it does not dirty the main checkout — but do not point an agent at the main checkout directly. Let Orca manage the worktrees and merge back through normal commits/PRs.

To add Cursor / `pi` / GLM later, install those CLIs on the VPS and they will appear as selectable agents for that SSH target.

## Multi-Agent Orchestration

### GUI — race agents on one task (day-to-day)

1. Create N worktrees from the same ref (e.g. `origin/main`) via the **+** next to the repo.
2. Assign a different agent to each (Claude Code / Codex / Cursor / GLM).
3. Give all of them the identical prompt.
4. Split-pane the tabs to watch them work in parallel.
5. Review each diff, **Annotate AI Diff** on the winner, commit + push from that worktree, and one-click delete the losing worktrees (removes worktree **and** branch).

Where the agents agree is usually correct; where they diverge flags the hard parts.

### CLI — scriptable coordination

Every `orca orchestration` command supports `--json` for automation. This is a structured coordination layer, not a library API — you drive it by piping JSON.

```bash
orca status --json                      # what's running
orca worktree ps --json
orca orchestration task-list --json

orca orchestration task-create --task-title "..." --spec "..." --json
orca orchestration dispatch --task <taskId> --to <workerHandle> --inject --json
orca orchestration run --spec "..." --max-concurrent 3 --worktree active --json

orca orchestration send --to @all --subject "..." --body "..." --json   # groups: @idle @codex @cursor @worktree:<id>
orca orchestration gate-create  --task <taskId> --question "..." --options '[...]' --json
orca orchestration gate-resolve --id <gateId> --resolution "..." --json
```

Mutating actions (commit, push, deploy, publish) still require explicit confirmation — Orca does not auto-commit or auto-deploy on your behalf.

### CLI — an agent starting another session

> [!IMPORTANT]
> **An agent can start a new session itself.** When the user says "start a new session", "hand this off", or "spawn an agent", execute it with the Orca CLI. Never reply that you cannot launch a session and hand the user a prompt to paste manually.

Load the `orca-cli` skill first, then run `orca skills get orca-cli` for the version-matched command reference — subcommands and flags change between Orca releases, so do not work from memory.

Pick the spawn mode by **whether the new session needs uncommitted files**:

```bash
# Same checkout — the new agent sees uncommitted .tmp/ artifacts. Matches the normal
# multi-tab pattern (several CLIs in one worktree) and is the usual choice.
orca terminal create --worktree active --command "claude" --json
orca terminal wait   --terminal <handle> --for tui-idle --timeout-ms 60000 --json
orca terminal send   --terminal <handle> --text "<task brief>" --enter --json

# Separate checkout — isolated worktree, its own branch and terminal.
orca worktree create --name <task-name> --agent claude --prompt "<task brief>" --json
```

A new **worktree** is a different working directory: uncommitted artifacts from the current worktree will **not** be present. Commit them first, or use the `terminal create --worktree active` path.

Hand the new session a written brief it can act on alone — for this system that means a `TRIGGER_PROMPT.txt` plus an execution plan under the relevant workflow's `.tmp/`, not a summary in the prompt text. Prefer `--agent` on `worktree create` over creating a worktree and then opening an agent; the two-step path leaves a stray fallback shell when no default tabs are configured.

For a genuine handoff, deliver the brief and stop monitoring. Use the `orchestration` skill and `orca orchestration ...` only when the user actually asked to supervise, wait for results, or coordinate a task DAG.

### A new worktree shows one client, not all of them

Orca creates worktrees with a plain `git worktree add`, which checks out **every** Brandklout client
— thirteen client folders in a workspace that exists for one of them. Orca's per-repo **setup script**
for this repo is `npm install`, and root `package.json` has a `postinstall` that runs
`scripts/sparsify-worktree.sh`, so a new worktree narrows itself to the shared context
(`deliver/process`, the pillar's `docs/` and `scripts/`, `scripts`, `mcp-servers`, `.claude`, plus the
repo-root directives) and the one client its `bk-<slug>` branch names.

Orca names the branch `alejandro-thrive-square/bk-livewell`, so the client is derived from the
worktree **directory** name first and the branch's last path segment second. If neither is a prefix
of the client folder — `bk-ifa-dentistry` vs `institute-for-advanced-dentistry` — nothing matches, the
worktree keeps the shared context only, and the script prints the line to run:

```bash
bash scripts/sparsify-worktree.sh --client institute-for-advanced-dentistry
```

Sparse never touches commits or the index; `--undo` restores the full checkout. Full rules and guards
in [SYSTEM_RULES.md §4.2.0](./SYSTEM_RULES.md).

## Client Worktrees and Directive Propagation

Use the root `main` worktree as the **orchestration and canonical-process worktree**. Perform client
delivery in one long-lived Orca worktree per client, with the same client slug in the branch,
worktree path, and Orca display name. Isolation is valuable, but it is also a version boundary:
commits and untracked files in one worktree do not appear automatically in another.

Before dispatching a new client task:

1. Finish and commit any reusable process or standard changes in the root worktree. A worktree made
   from `origin/main` does not include unpushed local `main` commits.
2. Require the client worktree to be clean, or make a named checkpoint commit. Do not merge a new
   standard into a dirty, half-finished run.
3. Merge the current local `main` into the client branch, resolve conflicts as a union of the client
   adaptation and the canonical correction, and record the resulting baseline commit in the client
   `docs/project-overview.md` and the client's standing `docs/RUNBOOK.md`.
4. Read the canonical directive under `deliver/process/` first, then the client workflow instance
   and its documented deviations. A client workflow copied earlier is a snapshot, not a live link.
5. Confirm that every required reference and lightweight tool exists inside the active worktree.
   Never make an operational brief depend on an untracked absolute path in another checkout. Commit
   lightweight reference code/docs; sync ignored media into the active worktree through the normal
   asset workflow.

When a client run discovers a reusable improvement, keep the client-specific fix on the client
branch and promote the generalized rule/tool to `deliver/process/` in a separate canonical commit.
Merge that commit into sibling clients only at a task boundary, then re-run their preflight gates.
Do not edit `deliver/process/` opportunistically inside several client worktrees: that creates
multiple competing canonical versions and makes the eventual merge decide the standard by accident.

Pin each dispatched brief to the baseline commit it was written against. A new standard should not
interrupt an active run unless it fixes correctness, safety, data loss, or an acceptance-blocking
defect. Otherwise finish the bounded run, checkpoint it, merge the new baseline, and start the next
run with a fresh brief. This preserves learning between runs without forcing agents to repeatedly
rebuild work already in flight.

## Relationship to This Repo

- Orca operates on the **same local git checkout** all other tooling uses; commits it makes are normal git commits that flow through the existing [DEPLOYMENT.md](./DEPLOYMENT.md) / [HERMES.md](./HERMES.md) sync model.
- Worktrees Orca creates live outside the main checkout and are disposable — do not commit worktree scratch state; follow the standard `.tmp/` artifact rules in [SYSTEM_RULES.md](./SYSTEM_RULES.md).
- New-computer setup is documented in [INSTALL.md — Step 10](./INSTALL.md).

## Version Control

This directive follows the root-level version control rules in [SYSTEM_RULES.md](./SYSTEM_RULES.md). Orca itself is external tooling and is **not** committed to this repository — only this doc (and the Quick Link entries in the entry-point files) is versioned. When any of the run modes, agents, or setup steps change, update this file and keep [AGENTS.md](./AGENTS.md), [CLAUDE.md](./CLAUDE.md), and [GEMINI.md](./GEMINI.md) Quick Links consistent.

## Infrastructure

- **Workstation**: Windows 10/11 (Orca desktop app)
- **Remote (optional)**: Hostinger VPS (Ubuntu 24.04 LTS) via SSH target or `orca serve`
