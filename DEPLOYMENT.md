# VPS Deployment

This repository deploys to the Hostinger VPS through GitHub Actions. A successful push to `main` starts the `Deploy VPS` workflow, which connects to the VPS over SSH and runs a guarded fast-forward pull of `origin/main`.

The deployment intentionally updates only repository-tracked files. Heavy binary/media assets remain outside Git and still require the documented `rclone sync` flow.

The normal deployment path is GitHub Actions. Manual SSH deployment is an approved fallback when Actions is not configured yet, when an immediate server-side verification is needed, or when the current VPS state must be inspected directly.

## Required GitHub Secrets

Add these repository secrets in GitHub before enabling the workflow:

| Secret | Purpose |
| :--- | :--- |
| `VPS_HOST` | VPS hostname or IP address. |
| `VPS_PORT` | SSH port. Optional; defaults to `22` when empty. |
| `VPS_USER` | SSH user used for deployment. |
| `VPS_SSH_KEY` | Private SSH key GitHub Actions uses to log into the VPS. |
| `VPS_KNOWN_HOSTS` | Trusted host-key entry for the VPS, generated from a verified SSH host key. |
| `VPS_REPO_PATH` | Absolute path to this repository on the VPS. |

## One-Time VPS Setup

1. Create a dedicated deployment SSH key pair for GitHub Actions.
2. Add the public key to the VPS deployment user's `~/.ssh/authorized_keys`.
3. Add the private key to GitHub as `VPS_SSH_KEY`.
4. Add the VPS host-key line to GitHub as `VPS_KNOWN_HOSTS`.
5. Confirm the repository already exists on the VPS at `VPS_REPO_PATH`.
6. Ensure the VPS repository can run `git pull origin main` non-interactively. For this private repository, prefer a read-only GitHub deploy key on the VPS or another non-interactive GitHub authentication method.
7. Keep the VPS worktree clean. The workflow aborts if `git status --porcelain` returns any local changes.

## Deployment Behavior

- Trigger: push to `main`, or manual run from the GitHub Actions UI.
- Update commands on VPS:
  1. `git pull --ff-only origin main`
  2. `bash scripts/deploy-cleanup.sh`
- Safety checks:
  - The target directory must be a Git repository.
  - The VPS worktree must be clean before deployment.
  - Non-fast-forward history is rejected instead of merged automatically.
  - Cleanup is limited to explicit retired paths listed in `scripts/deploy-cleanup.sh`; broad `git clean -fdx` cleanup is not used because valid ignored media also lives on the VPS.
- Not included:
  - No automatic `rclone` sync for heavy assets.
  - No automatic service restart because this repository currently has no documented long-running service process to restart.

## Manual SSH Fallback

Use this process only for committed repository state that already exists on GitHub. Local uncommitted files do not reach the VPS until they are committed, pushed, and merged into the branch being pulled.

1. Confirm local connection material already exists instead of creating new credentials unnecessarily:

```powershell
Get-ChildItem -Force $HOME\.ssh
Get-Content $HOME\.ssh\known_hosts
```

2. Connect with the existing SSH key and verify the account:

```powershell
ssh -i $HOME\.ssh\id_ed25519 -o BatchMode=yes -o StrictHostKeyChecking=yes USER@HOST "whoami; pwd"
```

3. If the repository path is unknown, locate Git worktrees on the VPS:

```powershell
ssh -i $HOME\.ssh\id_ed25519 -o BatchMode=yes -o StrictHostKeyChecking=yes USER@HOST "find /root /home /var/www /opt -maxdepth 5 -type d -name .git 2>/dev/null | sed 's#/.git$##'"
```

4. Inspect the target repository before changing it:

```powershell
ssh -i $HOME\.ssh\id_ed25519 -o BatchMode=yes -o StrictHostKeyChecking=yes USER@HOST "cd /path/to/repo && printf 'BRANCH=' && git branch --show-current && printf 'HEAD=' && git rev-parse --short HEAD && printf 'STATUS\n' && git status --short --branch && printf 'REMOTE\n' && git remote -v"
```

5. Pull only when the worktree is clean and the branch is the intended deployment branch, then run the repo-owned cleanup allowlist:

```powershell
ssh -i $HOME\.ssh\id_ed25519 -o BatchMode=yes -o StrictHostKeyChecking=yes USER@HOST "cd /path/to/repo && git pull --ff-only origin main && bash scripts/deploy-cleanup.sh && printf 'HEAD=' && git rev-parse --short HEAD && printf 'STATUS\n' && git status --short --branch"
```

### Verified Manual Procedure

The manual SSH path was verified on May 18, 2026:

- VPS host-key entry already existed locally for `177.7.59.218`.
- SSH access succeeded with the existing local key as `root`.
- Repository checkout was found at `/root/webzite-agentic-workflow`.
- The VPS worktree was clean on `main`.
- `git pull --ff-only origin main` updated the VPS from commit `17c8896` to `62c0e46`.

## Retired Path Cleanup

Git does not remove ignored or untracked directories during `git pull`. When the architecture retires an old VPS-side path, migrate any assets that still belong in the system, then add the retired path to [`scripts/deploy-cleanup.sh`](./scripts/deploy-cleanup.sh).

Current retired paths:

- `deliver/giovanni-serrano/assets`
- `deliver/giovanni-serrano/workflows/03-design`
- `deliver/company-1`
- `deliver/company-2`

Rules:

- Use explicit retired paths only.
- Add a path only after its contents are migrated or intentionally discarded.
- Keep long-lived heavy assets in their canonical VPS locations; do not rely on deployment cleanup for normal asset management.
- Do not replace the allowlist with `git clean -fdx`, because that would delete valid ignored media stored on the VPS by design.

## First Verification

After adding the secrets:

1. Push a small commit to `main`.
2. Open GitHub Actions and confirm `Deploy VPS` succeeds.
3. SSH into the VPS and confirm:

```bash
cd /path/to/repo
git log --oneline -1
```

The top commit should match the new commit from GitHub.

## Troubleshooting

- `Host key verification failed`: `VPS_KNOWN_HOSTS` is missing or does not match the VPS host key.
- `Permission denied (publickey)`: the `VPS_SSH_KEY` private key does not match an authorized public key on the VPS user account.
- `fatal: could not read Username for 'https://github.com'`: the VPS repo itself cannot authenticate to GitHub for `git pull`; configure a non-interactive GitHub credential on the VPS.
- `Working tree is not clean`: commit, stash, or intentionally remove local VPS changes before retrying.
- `Already up to date` but expected newer files: confirm the desired changes are committed and pushed to GitHub first. Manual SSH deployment does not transfer local uncommitted work.
- Old ignored directories still exist after deployment: migrate any needed files, add the obsolete path to `scripts/deploy-cleanup.sh`, and redeploy.

## Version Control

This deployment workflow follows the root-level version control rules in [SYSTEM_RULES.md](./SYSTEM_RULES.md). Deployments track committed repository state only; secrets stay out of Git.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
