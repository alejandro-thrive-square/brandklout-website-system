# Brandklout Website System: System Core Rules

This document is the master blueprint for the Brandklout Website System: the Deliver pillar scoped to
Brandklout, split out of `webzite-agentic-workflow` on 2026-08-22. It defines the directory structure
and operational standards for every agentic process in this repository. The Sales, Manage and Growth
pillars, and the pricing rules, live in `webzite-agentic-workflow` and do not apply here.

> [!IMPORTANT]
> **Documentation Integrity Rule**: Whenever a change is made to the technical implementation of this system, the corresponding markdown files **MUST** be updated immediately to maintain synchronization between documentation and code.

> [!IMPORTANT]
> [AGENTS.md](./AGENTS.md), [CLAUDE.md](./CLAUDE.md), and [GEMINI.md](./GEMINI.md) must stay identical. These filenames exist separately because different agent runtimes auto-load different entry-point names.

## 0. Infrastructure
This system is designed to run on a **Hostinger VPS** with the following specifications:
- **OS**: Ubuntu 24.04 LTS
- **Execution Environment**: All scripts and system-level tools must be compatible with this Linux distribution.

> [!IMPORTANT]
> **Mandatory Section**: Every Markdown file created within this system **MUST** include an Infrastructure section at the end of the file to ensure environment compatibility.

> [!IMPORTANT]
> **Mandatory Section**: Every Markdown file created within this system **MUST** include a Version Control section (before Infrastructure) referencing the root-level version control rules. This ensures every directive reinforces Git discipline for agents operating in that context.

## 1. Scope

One pillar, one partner: **Deliver, for Brandklout's clients.** Delivery is organised as
**scenarios** (the kinds of job we do), each a numbered list of **steps**, plus shared **tools**. The
scenario list and the rules for working in them are in
[deliver/DELIVER_SYSTEM_RULES.md](./deliver/DELIVER_SYSTEM_RULES.md); the full index is
[deliver/process/PROCESS_INDEX.md](./deliver/process/PROCESS_INDEX.md). The FigJam board *Deliver
SOP's* draws the same scenarios.

**Main is for the system; client worktrees are for the sites.** A system change touches everything
except client folders and is committed on `main`; a client change touches only
`deliver/brandklout/<client>/` on that client's `bk-<client>` branch. `node scripts/check-scope.mjs`
enforces the split (§4.3).

## 2. Directory Structure

| Component | Directory | Purpose |
| :--- | :--- | :--- |
| **Entry points & rules** | root `*.md` | `AGENTS.md`/`CLAUDE.md`/`GEMINI.md`, this file, install, deployment, Orca and Hermes docs. |
| **Repo scripts** | `scripts/` | Worktrees (`new-client-worktree.sh`, `sparsify-worktree.sh`), scenarios (`scenario.mjs`), scope (`check-scope.mjs`), reading a client branch from main (`client.mjs`), credentials (`env-sync.mjs`), media (`assets.mjs`, `mirror-assets.sh`, `drive.mjs`), git hooks, sync and deploy. |
| **MCP Infrastructure** | `mcp-servers/` | Shared MCP server index, setup docs, access model and profiles. |
| **Deliver rules** | `deliver/DELIVER_SYSTEM_RULES.md` | Scenarios, where things live, working rules, quality bar. |
| **The process** | `deliver/process/` | `scenario-N-name/NN-step/` step folders and the shared `tools/<toolkit>/`. Fixed on `main` only. |
| **Shared standards** | `deliver/docs/` | Standards every client uses (fluid root, images, BugHerd, Client-First, Drive map, Asana, orchestration, partner MCP registry). |
| **Cross-client scripts** | `deliver/scripts/` | Asana pulls and other scripts that serve every client. |
| **Clients** | `deliver/brandklout/<client>/` on the client's `bk-<client>` branch only (main tracks none; list in [deliver/docs/CLIENTS.md](./deliver/docs/CLIENTS.md)) | One folder per client and nothing else: `README.md`, `RUNBOOK.md`, `docs/`, `assets.tsv`, and each started scenario's step `output/` folders (the directives and scripts beside them are an untracked mirror of main). |
| **System runbook** | `.claude/runbook/` | One file per system run, indexed in `INDEX.md`. |

### 2.1 Step Folder Structure
Every scenario step, on `main` and in a client's copy, has the same shape:
- `NN-step/NN-step.md`: **The Directive**. The step's logic, requirements and gates. The directive is the program; code exists only for real consequences and verifiers.
- `scripts/` (optional): the step's own executables.
- `tools.json`: the shared toolkits under `deliver/process/tools/` the step uses. `scenario.mjs` mirrors only these into a client, so a script that imports another toolkit must list it here.
- `output/`: **Artifact Storage**. Everything the step produces: `output/assets/` (media, gitignored, backed up to R2), `output/code/`, and the step's `output/RUNBOOK.md`. Lightweight text artifacts are committed; media never is. `output/` replaced `.tmp/` on 2026-09-23; client branches from before keep `workflows/<module>/.tmp/` until moved.

### 2.2 MCP Server Folder Structure
Every MCP server registered in the project follows this structure under `mcp-servers/`:
- `[mcp-name]/`: Subfolder for each MCP server (e.g., `webflow/`, `asana/`).
- `setup.md`: Setup, authorization, and usage documentation.
- `MCP_INDEX.md`: Master index of all MCP servers in the project.
- `ACCESS_MODEL.md`: Folder-based MCP access procedure.
- `profiles/`: Reusable MCP access profiles (`client-delivery.md`).

### 2.3 Folder-Based MCP Access
MCP server definitions stay centralized in `.mcp.json` and `mcp-servers/`, but MCP usage is controlled by the active folder's nearest `mcp-access.md`.

Before using any MCP tool, agents must:
1. Identify the active folder context.
2. Read the closest applicable `mcp-access.md`.
3. Read the referenced profile in `mcp-servers/profiles/`.
4. Confirm the intended MCP server is listed in [mcp-servers/MCP_INDEX.md](./mcp-servers/MCP_INDEX.md).
5. Verify runtime authentication through `/mcp`, `claude mcp list`, or the active MCP client's equivalent status check.
6. Confirm the target account, site, project, repository, base, deployment, or other resource before changing it.
7. Ask explicit confirmation before publishing, deleting, overwriting, billing, emailing, deploying, changing production data, or using private session data.
8. Store MCP outputs in the active step's `output/` folder unless the step specifies another repo-safe path.

Folders that rely on MCPs must include an `mcp-access.md` file documenting allowed MCPs, target resources, allowed operations, forbidden operations, confirmation requirements, runtime authentication notes, and artifact paths. Client projects use `deliver/brandklout/<client>/docs/mcp-access.md`; the partner registry is [deliver/docs/mcp-access.md](./deliver/docs/mcp-access.md).

## 3. Global Operational Standards

- **Context Filtering**: When working on a step, agents read that step's directive and only the tools it names, to save tokens and maintain focus.
- **Directive Improvement Loop**: At the end of each task, agents must update the specific directive `.md` files they used to learn or execute that process whenever the task reveals a missing step, changed requirement, new decision, corrected assumption, or reusable process improvement. This applies even when no code changes were made. Process fixes are made on `main`, never in a client's mirror (it is untracked, so a fix there is lost), and reach clients through `node scripts/scenario.mjs sync`. Preserve the mirrored entry-point files when they are affected.
- **Copy Standards — no em dashes**: No em dash (`—`, `&mdash;`) may appear in any copy this system produces: client sites, proposals, emails, decks, any deliverable. Use a comma, colon, semicolon or full stop, chosen per instance — a blanket substitution leaves half of them ungrammatical. The rule covers every rendered string, including `alt`, `placeholder`, `title`, SEO and Open Graph descriptions, and JSON-LD. It does **not** cover code comments and developer notes, which are not copy. Verify on the **built** output with comments and `<script>`/`<style>` blocks stripped first, or the check reads its own notes back as failures.
- **Environment Variables**: All API keys and secrets live in the single master file `~/.brandklout/.env`; every worktree `.env` is generated from it (§4.2.2).
- **MCP Servers**: MCP servers are defined in `.mcp.json` (project scope) and documented in `mcp-servers/`. OAuth-based MCPs (e.g., Webflow, Asana) authenticate at runtime — no static tokens required. Usage is controlled by the folder-based procedure in [mcp-servers/ACCESS_MODEL.md](./mcp-servers/ACCESS_MODEL.md).
- **Safety**: No destructive actions (deleting client data, unapproved publishing) should be taken without explicit confirmation in the directive.

## 4. Version Control & Asset Management

This system is version-controlled via a **GitHub repository**. All contributors and agents must follow these rules.

**Architecture: Git for code, docs, runbooks and lightweight step artifacts; Cloudflare R2 for client media.**
```
Local PC ──── git push (code/docs) ──────────→ GitHub ──→ VPS (git pull via GitHub Actions)
VPS      ──── git push (agent artifacts) ────→ GitHub ──→ Local (git pull)

Worktrees ─── node scripts/assets.mjs push ──→ R2   (clients/<client>/..., manifest assets.tsv in git)
Any checkout ← node scripts/assets.mjs pull <client> ── R2   (sha256-verified restore)
```

- **Resume work from anywhere — one command (local)**: `bash scripts/sync.sh` brings the local branch and GitHub into sync in both directions: it fetches and integrates remote git work **before** pushing local work (never auto-clobbering) and pushes. Preview with `--dry-run`. It does not move media. See [HERMES.md](./HERMES.md) and §4.5.
- **VPS deploys**: Pushes to `main` trigger `.github/workflows/deploy-vps.yml`, which SSHes into the VPS and runs a guarded `git pull --ff-only origin main`. The repository does not hold the `VPS_*` secrets yet, so the job fails at "Configure SSH" and nothing reaches the VPS until they are set. Details in [DEPLOYMENT.md](./DEPLOYMENT.md).
- **VPS → GitHub pushes**: When a VPS agent (e.g., [Hermes](./HERMES.md)) produces git-tracked artifacts, run `bash scripts/vps-commit-push.sh` on the VPS to commit and push to GitHub (it pulls before pushing so it never clobbers). Receive them locally with `bash scripts/sync.sh` or a plain `git pull`.

### 4.1 Repository Hygiene
- **Platform**: GitHub (private repository).
- **`.gitignore`**: Enforced at the repo root. The following are **never committed**:
  - `.env` and any files containing API keys or secrets.
  - OS/IDE junk files (`__pycache__/`, `.DS_Store`, `Thumbs.db`, `.vscode/`, etc.).
  - Dependency folders, browser profile caches, and local test output (`node_modules/`, `**/pw-profile/`, `test-results/`, etc.).
  - **All binary/media files** (`*.png`, `*.jpg`, `*.jpeg`, `*.gif`, `*.webp`, `*.svg`, `*.ico`, `*.pdf`, `*.mp4`, `*.webm`, `*.mov`, `*.zip`, `*.7z`, `*.psd`, `*.ai`, `*.eps`, `*.fig`, `*.sketch`).
- **`.gitattributes`**: Enforced at the repo root. Scripts and source files that may run on the Ubuntu VPS must keep LF line endings so Windows checkouts do not break shell execution.
- **`output/` folders** (and `.tmp/` on pre-2026-09-23 client branches): Committed when they contain lightweight state, text artifacts, HTML/CSS/JS, CSV/JSON, or other repo-friendly files. Media inside them is still blocked by `.gitignore` and must not be force-added.
- **Commit Discipline**: Commits must be atomic and descriptive. One logical change per commit.

### 4.2 Asset Management (R2)
Media is **never** stored in Git. It lives in the client's Google Drive and the step's `output/assets/`, and every untracked file under a client folder is backed up to Cloudflare R2.

- **Client media** (`deliver/brandklout/<client>/<scenario>/<step>/output/assets/`, and `.tmp/` on older client branches): pulled from the client's Google Drive with `scripts/drive.mjs` into the step that uses it; never keep the only copy in a worktree.
- **Backup and restore** — `scripts/assets.mjs` (details in [DELIVER_SYSTEM_RULES.md §2](./deliver/DELIVER_SYSTEM_RULES.md)):
  ```bash
  node scripts/assets.mjs push                 # every worktree -> R2; rewrites each client's assets.tsv (commit it)
  node scripts/assets.mjs pull <client>        # R2 -> this checkout, sha256-verified
  node scripts/assets.mjs status [<client>]    # manifest vs R2
  ```
  Run a push at the end of every task that made media, and before removing a worktree. Session cookies, keys, env files and `recovered/` dumps are never uploaded. On a new computer, `bash scripts/bootstrap.sh --client <slug>` (or `--all`) restores from R2.
- **Retired VPS paths**: When a repo restructure makes an old VPS-only path obsolete, add it to `scripts/deploy-cleanup.sh`. Deployment cleanup must stay allowlisted and explicit; do not use broad `git clean -fdx` cleanup.

#### 4.2.0 Creating a client worktree (sparse)

A full worktree checks out every client's work — 2,438 files / 94 MB — when one client needs about a
quarter of it. Create client worktrees sparse instead:

```bash
bash scripts/new-client-worktree.sh mason-park              # 722 files instead of 2,438
bash scripts/new-client-worktree.sh newclient --dry-run     # print the plan first
```

The cone is the client folder + `deliver/docs`, `deliver/scripts`, `scripts`, `mcp-servers`, `.claude`.
**`deliver/process/` is left out on purpose (since 2026-09-27):** it is tracked on `main` only. The
client folder holds an untracked mirror of each scenario it started, rebuilt from the committed `main`
ref by `node scripts/scenario.mjs sync` (on `npm install`, at Claude Code session start, or by hand). **Cone mode always materialises repo-root files**, so `CLAUDE.md`,
`AGENTS.md`, `SYSTEM_RULES.md` and `deliver/DELIVER_SYSTEM_RULES.md` arrive without being listed —
agents still get their directives. An unknown slug is treated as a **new** client under
`deliver/brandklout/`, since the folder does not exist until the agent creates it.

**Sparse narrows the working tree only — never commits.** The index still holds every path, so a
commit made in a sparse worktree still contains all 1,997 dr-nahlah files, all 1,817
other Brandklout client files, and everything else; merging one into `main` deletes nothing. This was
verified directly, not inferred. Widen later with `git sparse-checkout add <path>`, or go full with
`git sparse-checkout disable`.

The script seeds assets explicitly rather than relying on the hook: `post-checkout` only seeds when
the previous HEAD is the null SHA, and the sparse flow checks out in a *second* step
(`--no-checkout` → `sparse-checkout set` → `checkout`), so that hook does not fire.

##### Worktrees created from the Orca app

`new-client-worktree.sh` only covers worktrees created from the command line. A worktree created in
the **Orca app** is a plain `git worktree add`, so it lands full — every Brandklout client visible in
`deliver/brandklout/`, which makes it hard to tell which client the workspace is even for. Narrow it
after the fact:

```bash
bash scripts/sparsify-worktree.sh                         # client derived from the bk-<slug> branch
bash scripts/sparsify-worktree.sh --client institute-for-advanced-dentistry
bash scripts/sparsify-worktree.sh --dry-run               # print the plan first
bash scripts/sparsify-worktree.sh --undo                  # back to the full checkout
```

**This runs automatically on Orca worktree creation.** Orca's per-repo setup hook for this repo is
`npm install`, and root `package.json` carries a `postinstall` that calls the script. Nothing to
configure per worktree; if you ever change Orca's setup script, keep `npm install` in it or the
narrowing stops happening.

The guards matter more than the cone here, because unlike `new-client-worktree.sh` this one edits a
worktree that may already hold work:

- **The main worktree is never narrowed.** It is the source every other worktree seeds assets from,
  and the one place the whole repo is meant to be visible.
- **Uncommitted tracked changes abort it.** Narrowing would have to discard modified files outside
  the cone; commit or stash first, or pass `--force` if the changes are inside the client you keep.
- **An already-sparse worktree is left alone** and its cone printed, so re-running `npm install`
  never re-scopes a worktree you widened by hand. `--force` re-scopes deliberately.
- **A name that matches no client keeps the shared context only** and prints the
  `git sparse-checkout add` line for every client. This is the `bk-ifa-dentistry` case — the slug is
  not a prefix of `institute-for-advanced-dentistry`, so pass `--client` there.

The client is derived from the **worktree directory name first, the branch's last path segment
second**, stripping `bk-` and then trimming `-suffixes` longest-first. Both halves are load-bearing:
Orca names the branch `alejandro-thrive-square/bk-livewell`, not `bk-livewell`, so matching the raw
branch finds nothing, and the directory name is exactly what was typed into Orca. `scripts/hooks/post-checkout`
carries the same derivation for asset seeding and had the same prefix bug — keep the two in step.

Sparse-checkout removes *tracked* files only. Assets mirrored in by `mirror-assets.sh` are
git-ignored, so other clients can survive as asset-only leftover directories; the script lists them
and prints the `rm -rf`, but never deletes on its own.

#### 4.2.2 Credentials: one master file, generated per worktree

**`~/.brandklout/.env` is the only credential file anyone edits.** Every worktree's `.env` — this
repo's main checkout included — is a **generated artifact**, rewritten by `scripts/env-sync.mjs` on
every `npm install`, which is Orca's per-worktree setup hook. Hand-edit a worktree `.env` and the
next sync discards it. Rotate a credential in the master, run `npm install` where you need it, done.

```bash
node scripts/env-sync.mjs --check      # what would be written (key NAMES only, never values)
node scripts/env-sync.mjs              # write this worktree's .env
node scripts/env-sync.mjs --force      # overwrite a .env that was not generated (backs it up first)
```

The master lives **outside every repo** on purpose: no clone, no `git clean -x`, and no worktree
deletion can take it, and it cannot be committed by accident. `WEBZITE_ENV_MASTER` overrides the
path. `.env.example` is the template.

**The folder is `~/.brandklout/` (renamed from `~/.webzite/` on 2026-10-10)**, so it cannot be
mistaken for Webzite Studio's: the Webzite Website System is a separate copy of this system with its
own master at `~/.webzite-studio/.env`, `ws-<client>` worktrees and its own R2 bucket. Never point
one system at the other's master. `~/.webzite` is left as a junction to `~/.brandklout`, so a client
branch that has not merged main since the rename still finds its credentials; remove it
(`cmd /c rmdir %USERPROFILE%\.webzite`, which deletes the link, not the target) once every `bk-*`
branch has merged main.

It is sectioned, and the sections are load-bearing:

| Section | Reaches | Holds |
| :--- | :--- | :--- |
| `[shared]` | every worktree | account-wide keys — one Browserbase, one Cloudflare account token, one Vimeo, one Figma |
| `[<client>]` | only that client's worktree | `INSTATIC_BASE_URL`, the per-instance `INSTATIC_PASSWORD`, per-zone Cloudflare tokens, host credentials |
| `[aliases]` | — | worktree name → section, for names that do not match by prefix |
| `[vars]` | nothing — never written to a `.env` | named definitions, referenced as `${NAME}` from any section |

**Why sections rather than one flat list.** `INSTATIC_BASE_URL` differs per client and the shared
Instatic toolkit deliberately refuses to guess it ([instatic-embeds](./deliver/process/tools/instatic-embeds/instatic-embeds.md)):
a flat file holding several would resolve first-match and publish one client's plugin to **another
client's site**. A missing section fails loudly instead. For the same reason the **main worktree gets
`[shared]` only** — no client's site URL can leak into work done there.

Section names match the client folder under `deliver/brandklout/`. A worktree picks its section from
its own **directory name** (what was typed into Orca) and then the branch's last path segment, with
the same `bk-` strip and longest-first `-suffix` trim the narrowing script uses. Ambiguity is a hard
error naming the fix: add a line to `[aliases]`.

**`[vars]` is how one value gets a name without being copied.** Two client instances that share an
admin password are two named definitions there and two `${NAME}` references in the client sections —
so the value is typed once, rotating it is one edit, and it still reaches only the worktrees that ask
for it. A `${NAME}` that resolves to nothing is a **hard error**: a blank password would otherwise
surface much later as an authentication failure with no trace back to here.

**Railway needs no `.env` to work.** The Railway CLI keeps its own auth in `~/.railway/config.json`,
which is machine-global, so `railway` commands already run in every worktree — that is why no
Railway variable existed anywhere. `RAILWAY_TOKEN` in `[shared]` exists for scripts and API calls
that cannot shell out to an interactive login, and `RAILWAY_PROJECT_ID` per client section saves
re-deriving the project from the runbook table.

**Name host credentials with a prefix.** `USERNAME`, `HOSTNAME` and `PORT` are all set by Windows
itself, and every `.env` loader in this system fills in only variables that are **not already set**,
so an unprefixed `USERNAME` silently resolves to the Windows login rather than the host account.
Hence `SITEGROUND_USERNAME`, not `USERNAME`.

**Google Drive is read through `scripts/drive.mjs`, signed in as a person.** An API key
(`GOOGLEDRIVE`) is anonymous: it opens "anyone with the link" files only and answers 403 to any
listing, so it cannot see folders shared with the Brandklout account. The script uses an OAuth
"Desktop app" client (`GOOGLEDRIVEOAUTHID`, `GOOGLEDRIVEOAUTH`, Cloud project `agentic-508813`,
scope `drive.readonly`) and writes the refresh token, `GOOGLEDRIVEREFRESH`, **into `[shared]` of the
master**. A worktree `.env` would lose it on the next sync. The script reads the master before any
worktree `.env` for the same reason.

```bash
node scripts/drive.mjs auth                       # one-time browser sign-in
node scripts/drive.mjs roots                      # shared drives (one per client) + items shared directly
node scripts/drive.mjs search <text> [--folders]  # includes shared drives
node scripts/drive.mjs ls <folder id|url>
node scripts/drive.mjs get <file id|url> [dir]    # Docs/Sheets/Slides export to docx/xlsx/pdf
node scripts/drive.mjs pull <folder id|url> <dir>
```

The consent screen is in **Testing** (it cannot be published until Branding is complete, and it
cannot be made Internal because the project has no organization). Google expires a Testing refresh
token after **7 days**, so `invalid_grant` means run `auth` again. The downloaded client JSON is
kept at `~/.brandklout/google-drive-oauth-client.json`; a `client_secret_*.json` inside a repo is
git-ignored. Which drive belongs to which client, and the shortcuts whose targets are not shared, is
mapped in [deliver/docs/GOOGLE_DRIVE.md](./deliver/docs/GOOGLE_DRIVE.md).

#### 4.2.1 Worktree → main asset mirror (automatic)

Excluding media from Git is load-bearing in three places, so the rule does not bend: it keeps merges
clean, keeps the VPS `git pull` lean, and keeps the deploy's clean-tree gate
(`test -z "$(git status --porcelain)"` in `.github/workflows/deploy-vps.yml`) passing — ignored files
do not appear in `git status`, tracked ones would. **Un-ignoring assets would break the deploy.**

The cost is that `git merge bk-<client>` brings the markup into `main` but not the images it
references, so a design opened from `main` renders broken. Since every worktree lives on one machine
and shares one `.git`, that gap is closed by a local copy — **not** by R2, which is the backup
channel (§4.2):

```bash
bash scripts/mirror-assets.sh                 # scopes derived from HEAD's paths
bash scripts/mirror-assets.sh --all --dry-run # full sweep, preview only
bash scripts/mirror-assets.sh --to-worktree   # reverse: main -> this worktree
bash scripts/mirror-assets.sh --prune-dry-run # list orphans; never deletes
```

**A new worktree starts with zero assets.** `git worktree add` checks out tracked files only, so a
fresh worktree gets the markup and none of the images — designs open broken there exactly as they
did in `main`. `scripts/hooks/post-checkout` seeds it automatically: on a *new* worktree only
(previous HEAD is the null SHA), it infers the client folder from the branch name (`bk-` stripped,
then progressively shorter prefixes, so `bk-mason-park-2` still resolves to `mason-park`) and copies
that client's assets from `main`. It seeds one client rather than everything because `--all` means
~771 MB of scrapes and reference libraries the branch will never open. If the branch name matches no
client, the hook prints the exact command to run instead of guessing.

The mirror covers **vendored libraries as well as media**. Designs load GSAP from
`.tmp/_vendor/gsap/*.min.js`, which is ignored and is not a media extension; mirroring images but
not those yields a page that renders and never moves — a worse failure than a broken image, because
it still looks correct in a screenshot. Matching is path-anchored (`_vendor/`, `vendor/`) so
`node_modules` cannot be swept in.

This runs **automatically after every commit in every worktree** via `scripts/hooks/post-commit`,
wired up by `git config core.hooksPath <main>/scripts/hooks` (set by `scripts/bootstrap.sh`, and
required once per clone). Notes that matter:

- The hooks path is **absolute** by design. Worktrees share one config, but a *relative* hooksPath
  resolves against each worktree's own root, so a `bk-*` worktree on a branch predating
  `scripts/hooks/` would silently run no hook. For the same reason the hook resolves
  `mirror-assets.sh` from the **main** worktree, never the calling one.
- The mirror is **additive** — it never deletes in the destination. An asset deleted in a worktree
  lingers in `main`; find those with `--prune-dry-run` and remove them by hand.
- The hook always exits 0. `post-commit` cannot undo a commit anyway, and a failed asset copy must
  never surface as an error that derails the agent mid-task.
- Set `WEBZITE_SKIP_ASSET_MIRROR=1` for scripted bulk commits that would otherwise rescan the same
  folders once per commit.
- **One run at a time, enforced by a lock.** The scan is the expensive half and every worktree's
  `post-commit` fires it, so commits landing minutes apart in two worktrees used to leave two
  multi-thousand-file scans running side by side. A second run waits `WEBZITE_MIRROR_LOCK_WAIT`
  seconds (default 20) for the lock at `<git-common-dir>/webzite-mirror-assets.lock`, then skips and
  prints the command to re-run by hand. A lock older than `WEBZITE_MIRROR_LOCK_STALE_MIN` minutes
  (default 30) is treated as junk from a killed run and cleared. Read-only modes (`--dry-run`,
  `--prune-dry-run`) never take the lock.
- **The copy loop batches; never make it per-file again.** On Windows every external command is a
  process creation that Git Bash gives a console, so the original loop — two `stat`s, `dirname`,
  `mkdir` and `cp` per file — cost ~20,000 process spawns for a 4,000-file scope, which pegged a
  core for 20+ minutes and flashed terminal windows across the screen for a commit that usually
  copies nothing. `stat` and `cp` both accept many paths per call and `xargs` packs them to the
  command-line limit, so the same scope is now a handful of processes: **3.2 s where the old loop
  had not finished 911 files in 120 s.** The skip rule is unchanged (same size at the destination
  means already mirrored) and `cp --parents` replaces the per-file `mkdir`.
- Success is **verified by re-reading destination sizes**, not by `cp`'s exit code: one failure in a
  batched invocation would otherwise condemn every file that shared it.

### 4.3 Branching Strategy
- **`main`**: the system — process, tools, rules, scripts, docs — plus the client folders merged at launch. System changes are committed on `main` directly; the `pre-commit` and `pre-merge-commit` hooks run `check-scope.mjs` so a commit is either a system change or one client's change, never both.
- **`bk-<client>`**: one branch and one Orca worktree per client. It changes only `deliver/brandklout/<client>/` and is the client's permanent history: it merges `main` in at the start of a session (clean, because the two never touch the same files), never merges into `main`, and is never rewritten. `node scripts/client.mjs` reads it from any checkout. It never tracks the process: it reads `deliver/process/` through an untracked mirror refreshed by `node scripts/scenario.mjs sync`.
- **Backups**: `backup/*` branches and tags are recovery points; never delete or rewrite them.

### 4.4 Agent Responsibilities
- Agents must **never** commit secrets or binary/media files. `output/` folders are commit-eligible for lightweight artifacts, but ignored media inside them must stay out of Git.
- When an agent creates or modifies a media file intended to persist, it goes in the owning step's `output/assets/` in the client folder, and is backed up with `node scripts/assets.mjs push`.
- Agents should not force-push or rewrite shared branch history without explicit user confirmation.

### 4.5 Workspace Authority & Conflict Policy
The system has **two workspaces that can both change repo state**: the local machine (IDE / Claude desktop) and the VPS (where [Hermes](./HERMES.md) runs). This policy keeps them from clobbering each other.

- **GitHub `main` is the single source of truth for git-tracked state.** Neither workspace is inherently more authoritative — whoever pushes first wins the fast-forward, and the other must integrate remote work before pushing.
- **R2 plus each client's `assets.tsv` is the source of truth for media** (§4.2). A push never deletes from R2; the same path in two worktrees with different content resolves to the newer file and prints the clash.
- **Conflict resolution order**: (1) integrate remote git first, (2) resolve any git conflicts manually — never auto-clobber, (3) only then push media.
- **Default safety**: `scripts/sync.sh` defaults to abort-on-divergence.
- **Concurrency**: do not run `vps-commit-push.sh` on the VPS and `sync.sh` on local at the same time. If a push is rejected because the other side pushed first, simply re-run the safe command.
- **Hermes**: when committing inside this repo, Hermes must use `scripts/vps-commit-push.sh` (which pulls before pushing) and must never force-push or rewrite shared history.

## 5. Runbooks — one file per run, tracked, per project

**The runbook lives with the step (since 2026-09-23).** Client work happens in a scenario step
folder, `deliver/brandklout/<client>/<scenario>/<step>/`. After each run, add a dated entry (newest
first: Done with the commit SHA, Next, Gotchas) to that step's `output/RUNBOOK.md`, and a one-line row
to the client's `deliver/brandklout/<client>/RUNBOOK.md`, whose top section is the standing state.
System work (process, tools, rules) goes to `.claude/runbook/` on main as one file per run, indexed in
`.claude/runbook/INDEX.md`. Client branches created before 2026-09-23 still keep
`docs/runbook/` until they are moved to the scenario layout.

**Reading rule: open the client `RUNBOOK.md` (or `.claude/runbook/INDEX.md`), then only the step
runbooks or runs you need.** Never read the whole history.

**Runbooks are tracked — commit them.** They were gitignored until 2026-09-04 for a reason that the
current layout dissolves: every worktree wrote *the same path*, `.claude/RUNBOOK.md`, so tracking
guaranteed a merge conflict on every client branch. Now each project writes its own path and each run
its own file, so two sessions almost never touch the same file. What ignoring them actually cost was
worse than the conflicts: they travelled with nothing, were backed up nowhere, and died with the
worktree — the same failure class that lost Mason Park's `uploads/` and Stone's Drive export. Tracking
them also means a merge to `main` gives every worktree every project's history, which is the point.

Write for a reader with **no memory of your session**. **Gotchas** is the most valuable section:
failed approaches, environment quirks and false leads are exactly what a fresh session would
otherwise pay to rediscover. Be concrete — paths, commands, SHAs, not summaries.

**Why one file per run.** The old single file grew without bound: `bk-dr-nahlah` reached 6,459 lines
and ~81,500 tokens, 41% of a 200k context window before any work began. Splitting only helps if the
reading rule above is followed — a session that opens every run file is worse off than before.

**An undated `## ` heading belongs to the run above it.** The historical files use `## Done`,
`## Next` and `## Gotchas` as h2 sub-sections of a run, and are newest-first, so a trailing `Next`
describes the *oldest* entry, not current state. The 2026-09-04 migration attached them accordingly;
do not read a pre-migration `Next` as a plan.

### The session-rotation automation was removed on 2026-08-22

A session used to hand off to a fresh one automatically at 200,000 tokens, through `Stop` and
`SessionStart` hooks. It could type into the wrong agent's live terminal and fail silently, so it was
removed; `git log -- scripts/session-rotate.mjs` has the history.

**If you want a fresh session, start one.** `claude team --permission-mode bypassPermissions` (client work) or `claude personal …` (orchestration) in a new terminal in that worktree — see [Claude account profiles](./deliver/docs/ORCHESTRATION.md). Write the runbook first.

## 6. Key Directives
- **Agent Hermes & Two-Workspace Sync**: [HERMES.md](./HERMES.md) — how Telegram-driven VPS work and local work stay in sync via `scripts/sync.sh` (git only; media goes through `scripts/assets.mjs`).
- **New Computer Install**: [INSTALL.md](./INSTALL.md) - restore this system on a new local workstation from GitHub, R2, and private credentials.
- **Sales, Manage and Growth pillars**: not in this repository. This repo is the Deliver pillar scoped to Brandklout; the other three live in `webzite-agentic-workflow`.
- **Pricing & Timeline Rules**: not in this repository, and they do **not** apply here. Brandklout is a partner engagement, not a per-page client — never compute or record a price, rate, quote or cost anywhere under `deliver/brandklout/`.
- **Deliver Rules**: [DELIVER_SYSTEM_RULES.md](./deliver/DELIVER_SYSTEM_RULES.md)
