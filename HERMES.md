# Agent Hermes & the Two-Workspace Model

This document explains **Agent Hermes** and how the system stays in sync when work happens in two places. It is a *workspace-model* doc, not a deployment mechanism — for the VPS deploy pipeline see [DEPLOYMENT.md](./DEPLOYMENT.md).

## What Hermes Is

**Hermes** is a VPS-resident agent that the user controls over **Telegram** from a phone. It lets the user work hands-free, away from the computer.

> [!IMPORTANT]
> **Hermes lives OUTSIDE this repository.** It is installed in a separate folder on the Hostinger VPS, runs on separate projects, and has its own runtime, Telegram bot configuration, and credentials. None of Hermes' infrastructure (bot code, tokens, systemd units, its own projects) belongs in this repository and must not be added here. Hermes' own projects have their own version control.

## Why Hermes Is Documented Here

Even though Hermes is external, it is one of the **actors that can change this repository's state**: when the user asks Hermes to work inside the VPS checkout of this repo (`VPS_REPO_PATH` in [DEPLOYMENT.md](./DEPLOYMENT.md)), its commits must flow back to the local machine. This doc defines how that round-trip works so neither workspace clobbers the other.

## The Two Workspaces

The user can resume work from either of two workspaces, both of which can mutate this repo:

| Workspace | How work happens | Where it runs |
| :--- | :--- | :--- |
| **Local** | IDE / Claude desktop app / Orca | Windows machine |
| **VPS** | Telegram → Hermes (or direct SSH) | Hostinger VPS (Ubuntu 24.04) |

```
                    ┌──────────────┐
                    │    GitHub     │   ← hub for all git-tracked files (code, docs,
                    │  (origin/main)│      runbooks, lightweight output/ artifacts)
                    └───┬───────▲──┘
       git pull/push    │       │   git pull (Actions) / vps-commit-push.sh
                        ▼       │
          ┌───────────────┐   ┌─┴───────────────┐
          │  Local (Win)  │   │   VPS (Ubuntu)  │
          │  IDE / Claude │   │  Hermes (Telegram)│
          └───────┬───────┘   └─────────────────┘
                  │
                  │  node scripts/assets.mjs push / pull <client>
                  ▼
          ┌───────────────┐
          │ Cloudflare R2 │   ← client media, listed in each client's assets.tsv
          └───────────────┘
```

Git syncs both ways through GitHub. Media never goes through git or the VPS: it is backed up to R2 with `scripts/assets.mjs` from any checkout that holds it (see [SYSTEM_RULES.md §4.2](./SYSTEM_RULES.md)).

## How Work Flows

### Work done on the VPS (Hermes) → local

1. On the VPS, commit and push git-tracked changes (asset-free):
   ```bash
   bash scripts/vps-commit-push.sh "feat: <what Hermes did>"
   ```
2. On local, pull it with one command:
   ```bash
   bash scripts/sync.sh
   ```

### Work done locally → VPS

Same one command — it pushes local git changes (which deploy to the VPS via GitHub Actions once the deploy secrets are set):
```bash
bash scripts/sync.sh --dry-run   # preview first
bash scripts/sync.sh             # commit + push
```

`scripts/sync.sh` is the canonical "resume work from anywhere" command for git. It integrates remote work **before** pushing and aborts on divergence. Media made in the session is backed up separately with `node scripts/assets.mjs push`.

## Authority & Conflict Policy

The rules for which workspace wins, and how conflicts are handled, live in **[SYSTEM_RULES.md §4.5 — Workspace Authority & Conflict Policy](./SYSTEM_RULES.md)**. In short: GitHub `main` is the source of truth for git-tracked state, R2 plus each client's `assets.tsv` is the source of truth for media, divergence is resolved manually (never auto-clobbered), and Hermes must use `vps-commit-push.sh` and never force-push shared history.

## Boundary Statement

- Do **not** add Hermes' bot code, Telegram tokens, environment, or its separate projects to this repository.
- Hermes, when operating inside this repo's folders, is bound by the same folder-based MCP rules as any agent — see [mcp-servers/ACCESS_MODEL.md](./mcp-servers/ACCESS_MODEL.md).
- Hermes must never force-push or rewrite shared branch history.

## Version Control

This document follows the root-level version control rules in [SYSTEM_RULES.md](./SYSTEM_RULES.md). It documents Hermes' *relationship* to this repository only; Hermes' own runtime and projects are versioned separately and outside this repo. Never commit secrets, tokens, or binary/media assets.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
