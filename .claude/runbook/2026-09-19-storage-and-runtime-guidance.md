# 2026-09-19 - Storage, version control, and remote runtime guidance

## Done

- User asked for help choosing R2/rclone, Hostinger/Namespace, and whether GitHub remains
  appropriate given missing media. Starting documentation commit: `d2b22ada`.
- Checked official Cloudflare, rclone, GitHub, Namespace, and Hostinger documentation.
- Added recommendations and sources to [SYSTEM_ARCHITECTURE.md](../../SYSTEM_ARCHITECTURE.md).
  Recommendation: retain GitHub, use R2 plus rclone with version-linked asset manifests, and
  begin continuous automation on the existing VPS after capacity checks. Namespace remains
  optional for cloud development. Git LFS is a valid alternative, not ruled out by GitHub.
- No implementation, account changes, runtime configuration, or live infrastructure checks.
  Recommendations are not user approval. Find this documentation commit with
  `git log -1 --format=%H -- .claude/runbook/2026-09-19-storage-and-runtime-guidance.md`.

## Next

- Continue the architecture discussion from these distinctions; do not ask the user to make
  unexplained product choices. Prioritize a complete project save/restore experience.
- Before implementation, settle the media approach and target account. Before committing
  continuous work to the VPS, verify its capacity and existing workloads.

## Gotchas

- R2 stores objects; rclone moves them. They are not competing storage services.
- GitHub can store media. This repository's exclusions caused its media separation. LFS would
  need changed tracking rules and working support in every checkout/deployment environment.
- `rclone copy` does not propagate deletions but can overwrite changed destination files.
  Recoverable history needs snapshots/content hashes or another versioned backup mechanism.
- Namespace's official lifecycle docs say ordinary stopped Devboxes retain persistent storage.
  Their long-task guide says CPU activity does not prevent idle auto-stop. Unattended jobs need
  explicit lifecycle handling; do not confuse retained disk with a continuously running process.
- The web reader could not open two Namespace pages. Their official `.md` versions were read
  successfully using HTTPS from PowerShell, without connecting to the user's Devbox.

## Version Control

Follow [SYSTEM_RULES.md section 4](../../SYSTEM_RULES.md#4-version-control--asset-management).
This is a documentation-only commit; no secrets or binary/media files are included.

## Infrastructure

Research performed on Windows. Existing Hostinger Ubuntu 24.04 LTS and Namespace environments
remain unchanged; no capacity or performance comparison was run.
