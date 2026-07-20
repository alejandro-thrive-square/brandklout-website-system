# New Computer Install Directive

This directive documents how to restore the Webzite Agentic Workflow on a new laptop or workstation. It assumes the repository is the source of truth for code, docs, and lightweight workflow artifacts, while the Hostinger VPS is the source of truth for heavy binary/media assets.

Use this document when a future agent needs to help rebuild the local working environment after moving to a different computer.

## Restore Model

The system is recoverable from three sources:

| Source | Restores | Does Not Restore |
| :--- | :--- | :--- |
| GitHub repository | Code, workflow directives, executors, lightweight `.tmp/` artifacts, deployment scripts, project-scoped MCP config | Secrets, ignored media, local credentials |
| Hostinger VPS | Deployed repository state, heavy binary/media assets, server-side ignored files | Local workstation tools, local SSH keys |
| Private credential store | `.env`, API keys, SSH keys, GitHub access, MCP/OAuth credentials, external service logins | Repository files |

Do not treat a fresh Git clone as complete until secrets, MCP auth, and VPS asset sync are verified.

## Prerequisites

Install these tools on the new computer before cloning:

- Git
- GitHub CLI, optional but useful for authentication
- Python 3.11 or newer
- `pip`
- `rclone`
- SSH client
- Claude Code or the agent runtime used for this project
- Orca Agent IDE (local workstation — installed in [Step 10](#step-10-install-orca-agent-ide-local-workstation); see [ORCA.md](./ORCA.md))
- Node.js only if a workflow or MCP setup requires it

On Windows, use PowerShell for local commands. For scripts ending in `.sh`, use Git Bash, WSL, or another Bash-compatible shell.

## Step 1: Prepare GitHub Access

1. Sign in to GitHub with an account that has access to the private repository.
2. Confirm `git clone` can authenticate with SSH or HTTPS.
3. If using SSH, add or generate a GitHub SSH key on the new computer and register the public key in GitHub.
4. Verify access:

```powershell
ssh -T git@github.com
```

or:

```powershell
gh auth status
```

## Step 2: Clone The Repository

Choose the local parent folder, then clone the repository:

```powershell
cd "C:\Users\<USER>\Documents"
New-Item -ItemType Directory -Force -Path "Webzite Studio"
git clone <GITHUB_REPOSITORY_URL> "Webzite Studio\Webzite Agentic Workflow"
cd "Webzite Studio\Webzite Agentic Workflow"
```

Verify the checkout:

```powershell
git status --short --branch
git remote -v
```

Expected result:

- The working tree is clean.
- The remote points to the private GitHub repository.
- The active branch is the intended working branch, usually `dev` for active work or `main` for production inspection.

## Step 3: Create The Python Environment

From the repository root:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m playwright install
```

If PowerShell blocks venv activation, run:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Then activate the venv again.

## Step 4: Restore Secrets

Create the root `.env` file from the private credential source. This file is intentionally ignored by Git.

Required values depend on the workflows being used, but commonly include:

- External API keys
- Airtable credentials
- Webflow credentials or runtime auth references
- Email or CRM credentials
- Any workflow-specific service tokens

Rules:

- Never commit `.env`.
- Never paste secrets into markdown docs.
- If a secret is missing, stop that workflow and ask the user to retrieve it from the private credential store.

Verify `.env` remains ignored:

```powershell
git check-ignore -v .env
```

## Step 5: Restore SSH Access To The VPS

Restore or create the SSH key used to access the Hostinger VPS.

Recommended local path:

```powershell
$HOME\.ssh\id_ed25519
```

Confirm the key and known hosts exist:

```powershell
Get-ChildItem -Force $HOME\.ssh
Get-Content $HOME\.ssh\known_hosts
```

Test VPS access, replacing `USER` and `HOST`:

```powershell
ssh -i $HOME\.ssh\id_ed25519 -o BatchMode=yes -o StrictHostKeyChecking=yes USER@HOST "whoami; pwd"
```

The known verified VPS repository path is:

```text
/root/webzite-agentic-workflow
```

If the path changes, update [DEPLOYMENT.md](./DEPLOYMENT.md).

## Step 6: Configure Rclone Asset Sync

Heavy binary/media files are intentionally not committed to Git. Configure an `rclone` remote named `vps` using SFTP credentials for the Hostinger VPS.

Start configuration:

```powershell
rclone config
```

Required remote name:

```text
vps
```

> [!IMPORTANT]
> The rclone SFTP backend skips host key verification by default. During `rclone config`, in the advanced options, set `known_hosts_file` to your SSH known_hosts path so the VPS connection is verified instead of trusted blindly. The expected config block:
>
> ```ini
> [vps]
> type = sftp
> host = <VPS_IP>
> user = root
> key_file = C:\Users\pc\.ssh\id_ed25519
> known_hosts_file = C:\Users\pc\.ssh\known_hosts
> ```
>
> Ensure the VPS host key is in known_hosts first (Step 5). Verify with `ssh-keygen -F <VPS_IP> -f $HOME\.ssh\known_hosts`. If `known_hosts_file` is unset, rclone logs a "No host key validation" advisory.

Validate the remote:

```powershell
rclone lsd vps:/root/webzite-agentic-workflow
```

Preview heavy asset sync from the VPS to the local machine before downloading anything:

```powershell
rclone copy vps:/root/webzite-agentic-workflow/manage/brand-assets ./manage/brand-assets --dry-run --progress
```

Then restore global brand assets:

```powershell
rclone copy vps:/root/webzite-agentic-workflow/manage/brand-assets ./manage/brand-assets --progress
```

Restore heavy workflow media as needed for the active client or workflow. Example:

```powershell
rclone copy vps:/root/webzite-agentic-workflow/deliver/giovanni-serrano/workflows ./deliver/giovanni-serrano/workflows --include "**/.tmp/**" --progress
```

Prefer targeted `rclone copy` operations when setting up a new computer. Use full sync carefully because local empty folders can overwrite remote data if the command direction is wrong.

For normal day-to-day work after setup, use the single safe sync command (git + assets, both ways). It runs from Git Bash on the local machine:

```bash
bash scripts/sync.sh --dry-run   # preview
bash scripts/sync.sh             # commit + push + bisync
```

The first-ever bisync needs `--resync` to establish a baseline (`bash scripts/sync.sh --resync`); the script detects a missing baseline and prompts you. See [HERMES.md](./HERMES.md) for the two-workspace model. The directional `bash scripts/sync-assets.sh [--dry-run]` commands remain available as lower-level primitives for asset-only transfers.

## Step 7: Restore MCP Configuration

Project-scoped MCP definitions are committed in [.mcp.json](./.mcp.json). User/global MCP credentials are not committed and must be reauthorized locally.

Current project-scoped MCP:

- Webflow remote MCP: `https://mcp.webflow.com/mcp`

Read:

- [MCP Index](./mcp-servers/MCP_INDEX.md)
- [MCP Access Model](./mcp-servers/ACCESS_MODEL.md)
- [Webflow MCP Setup](./mcp-servers/webflow/setup.md)
- [Figma MCP Setup](./mcp-servers/figma/setup.md)

If using Claude Code, verify MCP visibility:

```powershell
claude mcp list
```

If an MCP requires OAuth or browser authorization, complete that auth flow on the new computer. Do not store OAuth tokens in this repository.

Before using MCPs after reinstall, read the closest applicable `mcp-access.md` for the active folder and verify the target account, site, project, base, repository, or deployment before making changes.

## Step 8: Verify Deployment Connectivity

Read [DEPLOYMENT.md](./DEPLOYMENT.md) before changing the VPS.

Inspect the VPS repository without modifying it:

```powershell
ssh -i $HOME\.ssh\id_ed25519 -o BatchMode=yes -o StrictHostKeyChecking=yes USER@HOST "cd /root/webzite-agentic-workflow && printf 'BRANCH=' && git branch --show-current && printf 'HEAD=' && git rev-parse --short HEAD && printf 'STATUS\n' && git status --short --branch && printf 'REMOTE\n' && git remote -v"
```

Expected result:

- VPS branch is `main`.
- VPS worktree is clean.
- VPS remote points to the GitHub repository.

Do not run deployment commands from the new computer until GitHub access, secrets, SSH, and asset sync direction have been verified.

## Step 9: Run Local Smoke Checks

From the repository root with the Python venv active:

```powershell
python --version
python -m pip show playwright
git status --short --branch
```

Run a workflow-specific executor only after reading the relevant pillar rules and directive. For example, before using a Deliver workflow, read:

- [DELIVER_SYSTEM_RULES.md](./deliver/DELIVER_SYSTEM_RULES.md)
- The target workflow directive under `deliver/process/` or `deliver/<client>/workflows/`

## Step 10: Install Orca Agent IDE (Local Workstation)

The supported local workstation is now **Orca Agent IDE** — a desktop app that runs multiple agents side by side, each in its own isolated git worktree. It replaces the former WezTerm "Agent Hub" (multiple PowerShell tabs) and the removed `@dispatch` orchestration layer. Full reference: [ORCA.md](./ORCA.md).

> [!NOTE]
> Orca is external tooling and is **not** stored in this repository. Install it per-machine; only [ORCA.md](./ORCA.md) is versioned here.

1. **Download and install.** Get the Windows installer `orca-windows-setup.exe` from the latest release at [github.com/stablyai/orca/releases/latest](https://github.com/stablyai/orca/releases/latest) and run it.
2. **First launch.** Grant Orca access to your home directory. When prompted, let it **import existing config** — it reads `~/.claude` and `~/.codex`, so your existing Claude Code and Codex accounts/subscriptions carry over (this covers the old `claude` / `claude2` account separation via Claude Code's account hot-swap).
3. **Set the shell.** Under **Settings → Terminal**, set the default shell to **PowerShell**.
4. **Add the repo.** In the sidebar, **Add Repo** and point Orca at the local checkout:

   ```text
   C:\Users\<USER>\Documents\Webzite Studio\Webzite Agentic Workflow
   ```

   Orca reads git state and sets your default branch as the base reference.
5. **Configure agents.** Under **Settings → Agents**, confirm the built-in agents (Claude Code, Codex, Cursor CLI, GLM-5.2). Add any extra CLIs you use (e.g. `pi`, `opencode`) via **Add a custom CLI agent** — the picker simply launches the process in a terminal. Authenticate each CLI once inside its Orca terminal; sign in when prompted. Do not store auth tokens in this repository.
6. **(Optional) Run agents on the VPS.** The chosen remote model is an **SSH target** — Orca stays local, agents and worktrees run on the Hostinger VPS (nothing is installed on the VPS beyond git + agent CLIs). Add it under **Settings → SSH** using the same `root@<VPS_HOST>` connection as the rclone `vps` remote. Full steps and VPS readiness notes: [ORCA.md — Run Orca Against the Hostinger VPS](./ORCA.md#run-orca-against-the-hostinger-vps-option-a-ssh-target).

Verify: open Orca, confirm the repo appears in the sidebar, create a test worktree with **+**, launch Claude Code in it, and confirm the agent starts in a PowerShell terminal scoped to that worktree. To run several agents at once, create additional worktrees and assign a different agent to each (see [ORCA.md — Multi-Agent Orchestration](./ORCA.md#multi-agent-orchestration)).

> [!NOTE]
> **Legacy:** the previous WezTerm "Agent Hub" shortcut (`~/.wezterm.lua` + a Start Menu `Agent Hub.lnk`) is superseded by Orca and no longer maintained. Its config lives in git history if ever needed.

## Step 11: Agent Handoff Checklist

Before declaring the new computer ready, confirm:

- Repository cloned and clean.
- Correct branch checked out.
- Python venv created and dependencies installed.
- Root `.env` restored and ignored.
- GitHub authentication works.
- VPS SSH authentication works.
- `rclone` remote `vps` works.
- Required heavy assets have been copied down from the VPS.
- MCP servers are visible and any required OAuth auth is complete.
- Orca Agent IDE installed, repo added, and agents authenticated (a test worktree launches Claude Code in a scoped PowerShell terminal).
- [SYSTEM_RULES.md](./SYSTEM_RULES.md), [DEPLOYMENT.md](./DEPLOYMENT.md), and relevant pillar docs have been read.

## Recovery Boundaries

Agents may help restore:

- Repo files from GitHub.
- Heavy assets from the VPS.
- Local Python environment.
- MCP configuration and reauthorization.
- Deployment verification.

Agents must not invent or guess:

- Missing API keys.
- VPS passwords.
- GitHub credentials.
- OAuth tokens.
- Client-provided assets that are absent from both Git and the VPS.

If a required item is absent from GitHub, the VPS, and the private credential store, treat it as unrecoverable until the user provides another source.

## Maintenance Rules

Update this document immediately when any of the following changes:

- Required local tools.
- Repository clone path convention.
- Python version or dependency installation.
- VPS host, user, or repository path.
- `rclone` remote name or asset storage layout.
- MCP server setup.
- Orca Agent IDE setup.
- Deployment process.
- Secret management process.

## Version Control

This install directive follows the root-level version control rules in [SYSTEM_RULES.md](./SYSTEM_RULES.md). Commit this document and future updates to Git. Do not commit `.env` files, secrets, SSH keys, OAuth tokens, or binary/media assets.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
- **Local Workstation**: Windows PowerShell supported; Bash-compatible shell required for `.sh` scripts
