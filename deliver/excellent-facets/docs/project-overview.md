# Excellent Facets - Maintenance Client

Excellent Facets is an existing Webflow client site entering a maintenance/update engagement. The immediate purpose of this workspace is to receive client-provided documents, normalize the requested changes, audit the current site impact, and execute approved adjustments safely.

## Current State

| Field | Value |
| :--- | :--- |
| Client | Excellent Facets |
| Live site | https://excellentfacets.com |
| Platform | Webflow |
| Engagement type | Maintenance / Webflow improvements and updates |
| Selected offer | Webflow Improvements & Updates |
| Current phase | `15-improvement-intake-audit` - awaiting client documents |
| Primary intake path | `workflows/15-improvement-intake-audit/.tmp/client-docs/` |
| Initial handoff path | `workflows/00-client-delivery-initialization/.tmp/client-handoff/` |

## Delivery Path

Maintenance route from [deliver/process/OFFER_ROUTING.md](../../process/OFFER_ROUTING.md):

`00-client-delivery-initialization` -> `15-improvement-intake-audit` -> `07-webflow-build` -> `08-qa` -> optional `09-launch` -> adapted `10-handoff-support`

## Workspace Structure

| Path | Purpose |
| :--- | :--- |
| `docs/` | Client knowledge base, MCP access rules, project notes, final delivery notes. |
| `workflows/00-client-delivery-initialization/` | Setup and original handoff storage. |
| `workflows/15-improvement-intake-audit/` | Intake, change-list normalization, current-site audit, implementation plan. |
| `workflows/07-webflow-build/` | Webflow implementation workflow for approved changes. |
| `workflows/08-qa/` | QA checklist, regression checks, staging/live verification. |
| `workflows/09-launch/` | Optional publishing/release workflow when approved changes require a production publish. |
| `workflows/10-handoff-support/` | Adapted maintenance delivery note, support summary, and next-request process. |
| `workflows/01-fr-update-v1/` | Existing prior French-page update artifact folder. |
| `workflows/new-page/` | Existing prior new-page work and Webflow handoff artifacts. |

## Intake Rules

- Store the documents the client provides for this new maintenance cycle in `workflows/15-improvement-intake-audit/.tmp/client-docs/`.
- Store any original signed handoff package or account-level source material in `workflows/00-client-delivery-initialization/.tmp/client-handoff/`.
- Store later generated plans, audits, QA notes, and implementation artifacts in the `.tmp/` folder of the workflow that produced or used them.
- Do not place secrets, credentials, OAuth tokens, cookies, private exports, or binary/media assets in Git-tracked docs.
- Heavy binary/media files belong in the relevant workflow `.tmp/` path on disk and should be synced through the VPS asset process rather than committed.

## MCP Access

See [mcp-access.md](./mcp-access.md). Webflow MCP use is client-scoped and requires target-site confirmation before any mutation. Publishing, deleting, DNS changes, access changes, bulk edits, or production data edits require explicit confirmation.

## Open Questions

- Awaiting client documents for the new maintenance request.
- Confirm affected pages, components, CMS collections, forms, integrations, and desired publish timing after intake.
- Confirm whether the requested adjustments are staging-only, scheduled production release, or retainer-cycle updates.

## Version Control

- Follows [SYSTEM_RULES.md - Section 4](../../../SYSTEM_RULES.md).
- Branch naming: `deliver/excellent-facets-<description>`.
- Commit documentation, source files, and lightweight workflow artifacts only.
- Never commit `.env` files, secrets, OAuth tokens, private cookies, passwords, or binary/media assets.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
