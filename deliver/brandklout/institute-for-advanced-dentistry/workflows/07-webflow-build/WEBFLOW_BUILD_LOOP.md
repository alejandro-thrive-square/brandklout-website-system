# Webflow Build Loop

## Purpose
This document defines the scheduled-session loop for the `07-webflow-build` workflow only.

The loop exists to build Webflow pages through fresh Claude Code Desktop sessions instead of one long session. This reduces context pressure, avoids the five-hour session limit, and lets each scheduled run complete a bounded page build with testing.

Originally proven on the Giovanni Serrano project; now the default operating model for any multi-page Webflow build cloned from this template.

## Operating Model
- Claude Desktop scheduled tasks trigger a fresh Claude Code session on a fixed interval.
- The recommended interval is every 1 hour.
- Each scheduled run must process exactly one eligible Webflow page or exit cleanly.
- The scheduled task is the loop. Do not use an in-session loop for this workflow.
- Each run must read the project state files, claim one page, build it in Webflow through the browser extension workflow, test it, update state, write a handoff, and stop.

## Why Fresh Sessions
Each page usually takes up to 40 minutes including testing and consumes about 25% of the five-hour Claude Code limit. Running one page per fresh scheduled session keeps the active context small and makes the system recoverable if a session reaches a limit, crashes, or stalls.

Compaction may help inside a session, but continuity for this workflow should come from markdown state and handoff files on disk.

## Project States
Each Webflow build project or page must expose a state that the scheduled session can read before starting work.

Use these statuses:

| Status | Meaning | Scheduled Loop Behavior |
|:---|:---|:---|
| `queued` | Ready to build. | Eligible. |
| `in_progress` | Claimed by a running or recently running session. | Skip unless stale. |
| `waiting` | Blocked by user, client, credentials, missing assets, content, or an external dependency. | Skip. |
| `experimental` | Exploratory or not production-ready. | Skip by default. |
| `failed_retryable` | Failed, but another run may retry safely. | Eligible after review of the failure note. |
| `failed_manual` | Failed and needs human review. | Skip. |
| `completed` | Built, tested, and verified. | Skip. |

## Recommended Client Folder Files
When this process is copied into a client project, keep state inside the client workflow folder:

```text
deliver/[client-name]/workflows/07-webflow-build/
  state.md
  .tmp/
    webflow-build-handoff.md
    webflow-build-lock.md
    test-results.md
```

For page-level tracking, either extend `state.md` with one row per page or create page-specific state files in `.tmp/page-states/`.

## Example `state.md`

```markdown
# Webflow Build State

Project: [client-name]
Workflow: 07-webflow-build
Status: queued
Priority: 10
Current Page: homepage
Claimed By:
Claimed At:
Updated At:

## Pages

| Page | Status | Notes |
|:---|:---|:---|
| homepage | queued | First page. |

## Blockers
None.
```

## Lock Rule
Before doing any Webflow work, the session must inspect the lock file:

```text
.tmp/webflow-build-lock.md
```

Rules:
- If a page is `in_progress` and `Claimed At` is less than 90 minutes old, stop without editing.
- If a page is `in_progress` and `Claimed At` is older than 90 minutes, treat it as stale, inspect `.tmp/webflow-build-handoff.md`, and decide whether to resume or mark `failed_retryable`.
- At the start of work, write the lock with current timestamp, target project, target page, and status `running`.
- Before ending, update the lock to `completed`, `waiting`, `failed_retryable`, or `failed_manual`.

## Scheduled Task Prompt
Use this as the Claude Desktop scheduled task prompt for the hourly experiment:

```text
Run one bounded Webflow build cycle.

Scope:
- This loop is only for deliver/[client-name]/workflows/07-webflow-build (cloned from deliver/process/07-webflow-build).
- Build exactly one eligible Webflow page, then stop.

Before starting:
- Read AGENTS.md, SYSTEM_RULES.md, deliver/DELIVER_SYSTEM_RULES.md, and deliver/[client-name]/workflows/07-webflow-build/07-webflow-build.md.
- Read deliver/[client-name]/workflows/07-webflow-build/WEBFLOW_BUILD_LOOP.md and html-to-webflow-clipboard.md.
- In the client workflow folder, read webflow-build.config.json, state.md, .tmp/webflow-build-lock.md, and .tmp/webflow-build-handoff.md if they exist.
- Do not assume access to a previous Claude conversation.
- Verify the repo state directly before editing.

Selection rules:
- If no page is queued or failed_retryable, stop cleanly.
- If any page is in_progress and Claimed At is less than 90 minutes old, stop cleanly.
- If an in_progress page is older than 90 minutes, treat it as stale and inspect the handoff before deciding.
- Claim exactly one page by setting it to in_progress and updating Claimed At.

Execution:
- Build the claimed page in Webflow using the Claude Code browser extension workflow.
- Use the approved HTML/design package and the workflow rules from 07-webflow-build.md.
- Run the required responsive and visual testing for the page.
- Keep the run bounded. Do not start a second page.

Before ending:
- If successful, mark the page completed.
- If all project pages are completed, mark the project completed.
- If blocked, mark waiting and write the blocker.
- If failed but safe to retry, mark failed_retryable and write the failure note.
- If failed and needs human review, mark failed_manual.
- Update .tmp/webflow-build-handoff.md with completed work, files changed, Webflow changes, test results, blockers, and the next concrete step.
- Update .tmp/webflow-build-lock.md with the final status.
- Stop cleanly.
```

## Completion Criteria Per Run
A scheduled run is complete when it has done one of the following:
- Built and tested one page, then marked it `completed`.
- Found no eligible page and exited without changing Webflow.
- Detected an active lock and exited.
- Hit a blocker and marked the page `waiting`.
- Failed safely and marked the page `failed_retryable` or `failed_manual`.

## Notes For The First Run Of Any Project
- Start with a single page, preferably `homepage` / the site index.
- Keep the first run conservative: page build, responsive testing, and state update only.
- Do not let the scheduled session continue into a second page, even if time remains.
- After the first run, inspect the state and handoff files before enabling a longer hourly sequence.

## Version Control
- This loop document follows the root version control rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md).
- Commit lightweight markdown state and handoff files when they support review, replay, or agent continuity.
- Do not commit `.env` files, secrets, credentials, or binary/media assets.
- Any change to this loop logic must be reflected here and, when relevant, in [07-webflow-build.md](./07-webflow-build.md).
