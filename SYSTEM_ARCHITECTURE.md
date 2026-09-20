# Brandklout system architecture and migration plan

Date: 2026-09-19. Status: proposed implementation of Alejandro's architecture diagram.
This records the intended destination, not a completed migration. Existing projects and
deployment scripts still use the current repository layout until individually migrated.

## Target architecture

The diagram separates shared process development from client delivery. The laptop is the
review and troubleshooting workspace; a private Hostinger or Namespace environment runs the
agents and workflows. GitHub carries code and documentation between environments. SSH gives
access to the remote runtime. Client websites have their own Railway/Instatic runtime and
Cloudflare domain configuration, separate from the environment that builds them.

| Layer in the diagram | Intended responsibility |
| :--- | :--- |
| System GitHub repository | Canonical SOPs, skills, directives, executors, integration adapters, templates, framework references, and automation definitions. |
| Site project version control | Client output folders containing site code, selected workflow copies, client configuration, and runbooks. Repository topology remains an open choice below. |
| Client output folder | A reproducible project with its own scoped inputs, workflow artifacts, build output, and asset manifest. |
| Templates and framework | Screenshot library, Client-First references, style guides, and variables; client projects receive the selected version. |
| Rclone and Cloudflare R2 | Proposed transport and durable backup for ignored media; tracked manifests connect assets to projects and releases. |
| API connections | Scoped integrations for Asana, Instatic, Railway, GHL, Magnific, Ahrefs, Elfsight, Osmo, Fathom, FigJam, Google Drive, BugHerd, Cloudflare, Vimeo, GitHub, Browserbase, CodeRabbit, scraping, Resend, and Apify. Presence in the diagram does not establish working API access. |
| Automation triggers | Forms, Asana tasks, and scheduled events create scoped workflow runs through cron/webhook entry points. |
| Agents and runtime | Agent CLIs and tools use the shared process and client context. Node/npm supports the existing tools; Python remains required for Python executors. |
| Remote environment | Private execution workspace, with one designated scheduler owner to avoid duplicate runs. |
| Laptop and Orca | Review output, troubleshoot remote work over SSH, and develop improvements to the system. |
| Client hosting | Target stack: website code and Instatic on Railway, with domain/DNS configuration in Cloudflare. Existing platform exceptions require a client-specific migration. |

The diagram describes two feedback loops:

1. Review output: inspect a client preview, record corrections in that client's work, verify
   the result, and release through its deployment workflow.
2. Evolve system: take reusable lessons from delivery, update the canonical process, version
   the change, and deliberately refresh client workflow copies at task boundaries.

The system remains Brandklout-only. No Sales, Manage, Growth, or non-Brandklout client work is
introduced by this design. Hosting annotations in the image are not an approved budget.

## Current state and migration gaps

Evidence was read from the local checkout at `7a0595b6` and selected runbooks. Remote services
were not rechecked during this architecture pass.

| Area | Evidence in this checkout | Required change |
| :--- | :--- | :--- |
| Repository ownership | Shared process and `deliver/brandklout/<client>/` live in the same Git repository. Sparse worktrees narrow visibility but retain the repository's full history. | Separate system and project version control once the project repository topology is selected. |
| Workflow reuse | `deliver/process/` is canonical; client copies already record `process_baseline_commit`. | Preserve explicit versions across repository boundaries and package all required shared dependencies. |
| Asset recovery | September 19 R2 trial restored and hash-verified one client's files. No production asset script, manifest, or schedule exists. | Implement backup, conflict handling, and verified restore before moving or removing working copies. |
| Bootstrap | `scripts/bootstrap.sh` and `scripts/sync-assets.sh` still target `vps:/root/webzite-agentic-workflow`. | Replace the obsolete restore source only after a new complete backup passes recovery checks. |
| Cloud execution | Namespace runbook records a clone, 15 worktrees, and a media transfer that was still in progress when written. | Verify completeness and authentication, choose the scheduler host, and document recovery. |
| Credentials | `scripts/env-sync.mjs` generates scoped worktree files from the external master. | Preserve scoping; independent repositories will need explicit client identification rather than reliance solely on monorepo paths/worktree names. |
| Setup hooks | `npm install` currently narrows a monorepo worktree and generates its environment. | Introduce setup appropriate to separate client repositories without applying obsolete sparse-checkout assumptions. |
| Deployment | `.github/workflows/deploy-vps.yml` pulls system `main` on the VPS. | Give system updates and client site releases distinct deployment definitions and target mappings. |
| Documentation | Root rules still describe four pillars; Deliver rules and dispatch docs retain older platform assumptions. | Reconcile these documents with the Brandklout scope and each verified migration milestone. |

Evidence: [R2 trial](./.claude/runbook/2026-09-19-r2-asset-mirror-trial.md),
[Namespace mirror](./.claude/runbook/2026-09-19-namespace-devbox-mirror.md),
[standing runbook](./.claude/RUNBOOK.md), and
[versioned workflows](./deliver/DELIVER_SYSTEM_RULES.md#32-versioned-workflow-instances).

## Project and asset contracts

These are proposed contracts to implement, not files or commands already available.

- A project manifest identifies the client, project repository, source branch/commit,
  process baseline, selected modules, asset namespace, and exact staging/production resources.
  Resource identifiers may be recorded; credential values stay outside Git.
- The output folder retains `docs/`, `docs/runbook/`, and workflow-owned `.tmp/` artifacts.
  Migration initially preserves relative paths to reduce broken imports. A later layout cleanup
  needs its own dependency inventory.
- Workflow copies record the originating system commit, client deviations, and included tools.
  Updates are reviewed against those deviations rather than copied over active client work.
- A tracked asset manifest records relative path, byte count, and SHA-256. Remote keys must
  preserve recoverable versions, through snapshot prefixes or content hashes, so a later
  overwrite or deletion cannot erase the only good backup. An upload mirror alone is insufficient.
- Restore resolves a manifest into a fresh destination and verifies every file. Existing files
  with differing hashes are reported as conflicts. Routine backup does not propagate deletions.
- Media stays outside Git. Credential files, tokens, browser profiles, session cookies, and
  dependency caches are excluded from asset backup. Shared and client assets have distinct scopes.
- A transferable client includes code, required workflow/tool versions, media, CMS data export
  and restore instructions, dependency versions, and deployment/domain ownership instructions.
  R2 media recovery alone does not establish CMS or full-site recoverability. Secrets are
  provisioned separately and access transfer is handled explicitly.
- Automation records client ID, trigger/event ID, workflow version, input references, state,
  output references, and failure/retry details. Duplicate events must not create duplicate work.
  Concurrent jobs must not write to the same client workspace. External task text is input data.

## Migration sequence and acceptance criteria

1. **Inventory and recovery baseline.** Inventory the latest client branches and ignored media
   in every active worktree, including the five clients whose media was reported in the old
   Webzite checkout. Verify the existing backup and Namespace transfer. Record source locations
   and hashes without deleting or consolidating them. Acceptance: every client has an identified
   current code source and recoverable media inventory.
2. **R2 backup and restore.** Select the agency-owned account/bucket, implement the rclone-based
   transfer and manifest verification path, and test Unicode/spaces, interrupted uploads,
   overwrites, and conflicts. Restore one complete client to an empty folder, then cover the
   inventory. Acceptance: all required assets restore with matching hashes and older snapshots
   remain recoverable. The personal trial bucket is not assumed to be the production destination.
3. **Pilot project separation.** Select one client and preserve its latest branch state, history,
   workflow deviations, and runbooks in an isolated migration checkout. Inventory dependencies
   on shared scripts and other client paths. Add explicit identity/configuration and test the
   chosen repository layout. Acceptance: fresh checkout plus scoped credentials and asset
   restore can reproduce the client build without reaching into another client's worktree.
4. **Remote execution and deployment.** Choose Hostinger or Namespace as the primary execution
   environment and scheduler owner; keep deployment and agent workspaces separate. Complete
   required sign-ins and validate a staging build and a CMS recovery exercise. Acceptance:
   laptop review and remote execution address the same recorded project version, with a
   documented release and rollback procedure.
5. **Automation pilot.** Implement one bounded trigger-to-workflow path with event deduplication,
   a per-client lock, persisted run status, and failure reporting. Acceptance: replaying a trigger
   does not duplicate work; interrupted runs can be inspected and retried. Expand integrations
   only after verifying their actual supported access paths.
6. **Rollout and documentation.** Migrate remaining clients individually after the pilot passes.
   Update bootstrap, asset tools, setup hooks, deployment, process initialization/refresh, and
   entry-point documentation as their behavior changes. Archive old working locations only after
   verified recovery and migration; retain an explicit mapping from old to new repositories.

## Technology guidance, 2026-09-19

These are recommendations requested by Alejandro, not accepted implementation decisions.
The diagram does not constitute selection of a production storage or execution provider.

- **Keep Git/GitHub for version control.** The current media gap is caused by this repository's
  broad media exclusions plus an unfinished asset recovery workflow. Git can track binary files;
  GitHub also supports Git LFS, which versions pointers to separately stored large files.
  The blanket prohibition on media is our repository policy, not a universal GitHub limitation.
  LFS is a valid alternative for selected project media when a Git-integrated experience is the
  priority. It would require an explicit policy and setup change, including deployment support;
  the current exclusions still apply until then.
- **Use R2 with rclone for the existing broad asset collection.** R2 is the storage destination;
  rclone is a transfer tool that supports it. They are complementary. Prefer the maintained
  transfer tool over turning the trial's custom S3 implementation into a second transfer stack.
  Add the project-specific manifest and verification layer, and retain recoverable asset versions.
  `rclone copy` avoids destination deletions but can replace changed files; it is not by itself
  a versioned backup. Do not present an upload of latest files as historical recovery.
- **Tie code and media together.** Each saved project version should include a tracked manifest
  referencing immutable media hashes or snapshots already uploaded and verified. A restore should
  retrieve the chosen code version and matching media and report missing files as a failure.
  This unified save/restore experience is proposed work, not an existing command. CMS data and
  private credentials require their own recovery paths.
- **Prefer the existing VPS for the first continuous automation host.** This recommendation
  follows the diagram's cron, webhook, and unattended-work needs, not a benchmark of either host.
  Verify available CPU/RAM, existing workloads, and service restart behavior before rollout.
  Hostinger VPS is self-managed: patching, process supervision, access, and backup checks remain
  operational responsibilities. Neither execution host should hold the only recoverable copy.
- **Keep Namespace optional as a remote development environment.** Standard Devboxes retain
  persistent storage when stopped, but idle stopping can interrupt running jobs. Official
  documentation says CPU load alone does not prevent idleness; long tasks need a task marker
  under `/.namespace/tasks` or another documented active condition. Namespace can run unattended
  work with correct lifecycle handling; it is not inherently unsuitable. If the immediate need
  is an interactive cloud workstation rather than continuous automation, it is a strong candidate.
  Avoid adding a two-host dispatcher before a single-host workflow works.

Primary sources checked on 2026-09-19:

- [Cloudflare: rclone with R2](https://developers.cloudflare.com/r2/examples/rclone/)
- [rclone copy behavior](https://rclone.org/commands/rclone_copy/)
- [GitHub: large files](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github)
- [GitHub: Git LFS](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-git-large-file-storage)
- [Namespace: lifecycle](https://namespace.so/docs/devbox/lifecycle)
- [Namespace: long tasks](https://namespace.so/docs/guides/devbox/long-running-tasks)
- [Hostinger: self-managed VPS](https://www.hostinger.com/support/8311982-what-is-managed-hosting-in-hostinger/)

## Decisions needed before the migration

| Decision | Diagram leaves open | Proposed direction for review |
| :--- | :--- | :--- |
| Project repositories | One separate repository containing site folders, or one repository per client. | One per client supports independent history and transfer; a shared sites repository is a valid simpler alternative. Neither topology has been created. |
| Remote execution | Hostinger or Namespace, or a defined division between them. | Recommend the existing VPS for continuous automation, with Namespace optional for development. Verify capacity and restart behavior; user selection remains open. |
| Asset destination | Production account, bucket, and access boundaries. | An agency-owned private bucket with scoped access; retain the existing trial only as trial evidence. |
| First migration | Which active client becomes the pilot. | Choose a client whose latest branch, media, and build are understood; the IFA asset trial alone does not make it a completed-site pilot. |

## Version Control

Follow [SYSTEM_RULES.md section 4](./SYSTEM_RULES.md#4-version-control--asset-management).
Keep this proposal and migration evidence tracked. Do not commit secrets or binary/media assets.
The migration must not rewrite existing shared history or remove source worktrees as a side effect.

## Infrastructure

Existing supported server baseline: Hostinger VPS, Ubuntu 24.04 LTS. Namespace is an additional
execution candidate already recorded in the runbook. Validate its actual runtime during the pilot.
Local review remains on the Windows workstation. Node/npm and Python are both required by current
tooling; the diagram's Node layer does not remove the Python executors.
