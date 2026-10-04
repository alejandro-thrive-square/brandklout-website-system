# New Computer Install Directive

This directive documents how to restore the Brandklout Website System on a new laptop or workstation. The GitHub repository is the source of truth for code, docs, runbooks and lightweight step artifacts; Cloudflare R2 holds the client media, listed per client in `deliver/brandklout/<client>/assets.tsv`.

Use this document when a future agent needs to help rebuild the local working environment after moving to a different computer.

## Restore Model

The system is recoverable from three sources:

| Source | Restores | Does Not Restore |
| :--- | :--- | :--- |
| GitHub repository | Code, step directives, scripts, runbooks, lightweight `output/` artifacts, media manifests (`assets.tsv`), project-scoped MCP config | Secrets, media, local credentials |
| Cloudflare R2 | Client media (images, video, PDFs, fonts, zips), hash-verified against `assets.tsv` | Anything never pushed with `scripts/assets.mjs`; session cookies, keys and `recovered/` dumps, which are never uploaded |
| Private credential store | `~/.webzite/.env`, API keys, SSH keys, GitHub access, MCP/OAuth credentials, external service logins | Repository files |

Do not treat a fresh Git clone as complete until secrets, MCP auth, and the media restore are verified.

## Prerequisites

Install these tools on the new computer before cloning:

- Git (with Git Bash on Windows)
- GitHub CLI, optional but useful for authentication
- Node.js 18 or newer (most tooling is Node; `npm install` generates the worktree `.env`)
- Python 3.11 or newer, with `pip`
- SSH client
- Claude Code or the agent runtime used for this project
- Orca Agent IDE (local workstation — installed in [Step 9](#step-9-install-orca-agent-ide-local-workstation); see [ORCA.md](./ORCA.md))

On Windows, use PowerShell for local commands. For scripts ending in `.sh`, use Git Bash or another Bash-compatible shell.

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
git clone <GITHUB_REPOSITORY_URL> "Webzite Studio\Brandklout Website System"
cd "Webzite Studio\Brandklout Website System"
```

Verify the checkout:

```powershell
git status --short --branch
git remote -v
```

Expected result:

- The working tree is clean.
- The remote points to the private GitHub repository.
- The active branch is `main` (the system). Client work happens on `bk-<client>` branches in their own worktrees (Step 9).

## Step 3: Create The Python Environment

From the repository root:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

If PowerShell blocks venv activation, run:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Then activate the venv again.

## Step 4: Restore Secrets

Create the **master** credential file at `~/.webzite/.env` from the private credential source, using
[.env.example](./.env.example) as the template. This is the only credential file you create by hand.

Every worktree's `.env`, including this repo's own, is then generated from it:

```powershell
npm install        # runs scripts/env-sync.mjs (and sparsifies client worktrees)
```

Orca runs `npm install` whenever it creates a worktree, so in normal use a new workspace arrives with
its credentials already in place. The master lives outside every repo so a fresh clone cannot
overwrite it and Git cannot see it. See [SYSTEM_RULES.md §4.2.2](./SYSTEM_RULES.md).

The generated repo-root `.env` is intentionally ignored by Git.

Values the system commonly needs:

- `[shared]`: Browserbase, Cloudflare (plus `R2_TOKEN` / `R2_BUCKET` for media; `assets.mjs` falls back to `CLOUDFLARETESTING`), Railway, Magnific, BugHerd, Vimeo, Figma (`FIGMASECRET`, FigJam boards), Google Drive OAuth.
- `[<client>]`: `INSTATIC_BASE_URL`, the instance password, per-zone Cloudflare tokens, host credentials.

Rules:

- Never commit `.env`.
- Never paste secrets into markdown docs.
- If a secret is missing, stop and ask the user to retrieve it from the private credential store.

Verify `.env` remains ignored:

```powershell
git check-ignore -v .env
```

## Step 5: Install Hooks And Restore Media

Install the git hooks (scope check, asset mirror) and restore client media from R2:

```bash
bash scripts/bootstrap.sh --hooks-only            # hooks only
bash scripts/bootstrap.sh --client mason-park     # hooks + one client's media
bash scripts/bootstrap.sh --all --dry-run         # preview every client with an assets.tsv
bash scripts/bootstrap.sh --all
```

The restore runs `node scripts/assets.mjs pull <client>`, which downloads each file in the client's
`assets.tsv` and verifies its sha256. It never deletes local files and never writes to R2. Restore
only the clients you will work on; the full set is about 19.5 GB.

For day-to-day git sync after setup, use `bash scripts/sync.sh` (fetch, reconcile, push; `--dry-run`
to preview). Back up new media with `node scripts/assets.mjs push`. See [HERMES.md](./HERMES.md).

## Step 6: Restore MCP Configuration

Project-scoped MCP definitions are committed in [.mcp.json](./.mcp.json). User/global MCP credentials are not committed and must be reauthorized locally.

Current project-scoped MCPs:

- `webflow-brandklout` — Webflow remote MCP (the Brandklout partner workspace)
- `webflow-clientfirst` — local stdio server for Client-First class reuse on Webflow builds
- `asana-brandklout` — Asana remote MCP (blocked in Claude Code; the scripts in `deliver/scripts/` are the working path)
- `relume` — Relume component library (awaiting OAuth)
- `instatic-dr-nahlah` — Dr. Nahlah's Instatic instance

Read:

- [MCP Index](./mcp-servers/MCP_INDEX.md)
- [MCP Access Model](./mcp-servers/ACCESS_MODEL.md)
- [Webflow MCP Setup](./mcp-servers/webflow/setup.md)
- [Asana MCP Setup](./mcp-servers/asana/setup.md)

If using Claude Code, verify MCP visibility:

```powershell
claude mcp list
```

If an MCP requires OAuth or browser authorization, complete that auth flow on the new computer, on the **team** profile for client work. Do not store OAuth tokens in this repository.

Before using MCPs after reinstall, read the closest applicable `mcp-access.md` for the active folder and verify the target account, site, project, base, repository, or deployment before making changes.

## Step 7: Restore SSH Access To The VPS (Optional)

Only needed for Hermes, Orca's SSH target, or deployment checks. Restore or create the SSH key used to access the Hostinger VPS, recommended at `$HOME\.ssh\id_ed25519`, then test access, replacing `USER` and `HOST`:

```powershell
Get-ChildItem -Force $HOME\.ssh
ssh -i $HOME\.ssh\id_ed25519 -o BatchMode=yes -o StrictHostKeyChecking=yes USER@HOST "whoami; pwd"
```

Read [DEPLOYMENT.md](./DEPLOYMENT.md) before changing the VPS. The `Deploy VPS` GitHub Action is not live yet (the repository has no `VPS_*` secrets); do not run deployment commands until GitHub access, secrets and SSH have been verified.

## Step 8: Run Local Smoke Checks

From the repository root:

```powershell
node --version
python --version
git status --short --branch
node scripts/check-scope.mjs --staged
```

Before running any delivery step, read:

- [DELIVER_SYSTEM_RULES.md](./deliver/DELIVER_SYSTEM_RULES.md)
- [PROCESS_INDEX.md](./deliver/process/PROCESS_INDEX.md) and the step directive under `deliver/process/scenario-*/` (or the client's copy under `deliver/brandklout/<client>/`)

## Step 9: Install Orca Agent IDE (Local Workstation)

The supported local workstation is **Orca Agent IDE** — a desktop app that runs multiple agents side by side, each in its own isolated git worktree. Full reference: [ORCA.md](./ORCA.md).

> [!NOTE]
> Orca is external tooling and is **not** stored in this repository. Install it per-machine; only [ORCA.md](./ORCA.md) is versioned here.

1. **Download and install.** Get the Windows installer `orca-windows-setup.exe` from the latest release at [github.com/stablyai/orca/releases/latest](https://github.com/stablyai/orca/releases/latest) and run it.
2. **First launch.** Grant Orca access to your home directory. When prompted, let it **import existing config** — it reads `~/.claude` and `~/.codex`, so your existing Claude Code and Codex accounts/subscriptions carry over.
3. **Set the shell.** Under **Settings → Terminal**, set the default shell to **PowerShell**.
4. **Add the repo.** In the sidebar, **Add Repo** and point Orca at the local checkout:

   ```text
   C:\Users\<USER>\Documents\Webzite Studio\Brandklout Website System
   ```

   Orca reads git state and sets your default branch as the base reference. Keep `npm install` as the repo's setup script: it generates each worktree's `.env` and narrows client worktrees to their folder.
5. **Configure agents.** Under **Settings → Agents**, confirm the built-in agents (Claude Code, Codex, Cursor CLI, GLM-5.2). Add any extra CLIs you use via **Add a custom CLI agent**. Authenticate each CLI once inside its Orca terminal. Do not store auth tokens in this repository.
6. **(Optional) Run agents on the VPS.** The chosen remote model is an **SSH target** — Orca stays local, agents and worktrees run on the Hostinger VPS. Add it under **Settings → SSH** using the `root@<VPS_HOST>` connection from Step 7. Full steps: [ORCA.md — Run Orca Against the Hostinger VPS](./ORCA.md#run-orca-against-the-hostinger-vps-option-a-ssh-target).

Verify: open Orca, confirm the repo appears in the sidebar, create a test worktree with **+**, launch Claude Code in it, and confirm the agent starts in a PowerShell terminal scoped to that worktree (see [ORCA.md — Multi-Agent Orchestration](./ORCA.md#multi-agent-orchestration)).

## Step 10: Agent Handoff Checklist

Before declaring the new computer ready, confirm:

- Repository cloned and clean, on `main`.
- Python venv created and dependencies installed.
- Master `~/.webzite/.env` restored; `npm install` run; the generated root `.env` ignored.
- GitHub authentication works.
- Git hooks installed (`git config --get core.hooksPath` points at `<checkout>/scripts/hooks`).
- Media restored from R2 for the clients you will work on.
- MCP servers are visible and any required OAuth auth is complete.
- Orca Agent IDE installed, repo added, and agents authenticated.
- [SYSTEM_RULES.md](./SYSTEM_RULES.md) and [DELIVER_SYSTEM_RULES.md](./deliver/DELIVER_SYSTEM_RULES.md) have been read.

## Recovery Boundaries

Agents may help restore:

- Repo files from GitHub.
- Client media from R2.
- Local Python and Node environment.
- MCP configuration and reauthorization.
- Deployment verification.

Agents must not invent or guess:

- Missing API keys.
- VPS passwords.
- GitHub credentials.
- OAuth tokens.
- Client-provided assets that are absent from Git, R2 and the client's Google Drive.

If a required item is absent from GitHub, R2, the client's Drive and the private credential store, treat it as unrecoverable until the user provides another source.

## Maintenance Rules

Update this document immediately when any of the following changes:

- Required local tools.
- Repository clone path convention.
- Python or Node dependency installation.
- Media storage (R2 bucket, `assets.mjs`) or the bootstrap flow.
- VPS host, user, or repository path.
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
