# Project Overview — Alki House

| Field | Value |
| :--- | :--- |
| **Client** | Alki House |
| **Agency** | Brandklout (white-label partner; Webzite delivers, Brandklout owns the relationship) |
| **Engagement** | New website, built from scratch (no existing site to migrate) |
| **Domain** | not yet recorded |
| **Hosting** | not yet provisioned — the house target is Instatic on Railway |
| **Asana task** | not yet recorded — find it in the Brandklout workspace and put the GID here |
| **Started** | 2026-09-12 |
| **Worktree** | `bk-alki-house` at `~/orca/workspaces/Brandklout Website System/bk-alki-house` (sparse) |
| **process_baseline_commit** | `da1612b1` (local `main` when the worktree was cut) |

> [!IMPORTANT]
> **This worktree holds exactly one site: Alki House, in `deliver/brandklout/alki-house/`.**
> It is a sparse checkout: the client folder, `deliver/process/`, `deliver/brandklout/docs`,
> `deliver/brandklout/scripts`, `scripts/`, `mcp-servers/` and `.claude/`. Another client's folder
> is not on disk here, on purpose. `git sparse-checkout add <path>` if you truly need one.

> [!IMPORTANT]
> **Brandklout is a partner engagement.** Never compute or record a price, rate, quote or cost
> anywhere under `deliver/brandklout/`.

## Design bar

Read [`../../docs/DESIGN-STANDARD.md`](../../docs/DESIGN-STANDARD.md) before the first page.
Brandklout rejects static first builds: go straight to the elevated version — a photograph on
every page, scroll-driven motion, grounds that change under the reader. No section shape may be
lifted from another client's site; a technique may repeat, a layout may not.

## Workflows

None copied yet. Copy modules from `deliver/process/` into `workflows/` as the build reaches them
(see [`deliver/process/00-client-delivery-initialization`](../../../process/00-client-delivery-initialization/00-client-delivery-initialization.md)).
Initial client-provided material goes once in
`workflows/00-client-delivery-initialization/.tmp/client-handoff/`.

## Open questions

- The domain, and whether an existing site or DNS zone is live on it.
- The Asana task GID for this build.
- Brand assets: logo, palette, fonts, photography.
- Which Instatic instance (new Railway service) the site will publish to.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md). Work happens on
branch `bk-alki-house`.
