# MCP Access Model

This document defines how agents use Model Context Protocol (MCP) servers across the Webzite Agentic Workflow. MCP server definitions stay centralized, while permission and target-resource decisions are controlled by the active folder.

## Access Levels

| Level | Folder Scope | Purpose |
| :--- | :--- | :--- |
| `global` | Repository-wide | Utility MCPs that are safe across pillars, such as design, browser, search, or read-only analysis tools. |
| `agency` | Webzite-owned folders and workflows | MCP access to Webzite-owned accounts, sites, projects, dashboards, and assets. |
| `client` | `deliver/[client-name]/` | MCP access to signed client projects, client-owned platforms, or client-authorized workspaces. |
| `prospect` | Sales and Growth lead workflows | Public or pre-contract analysis of prospect websites, listings, and reference material. |
| `workflow` | A specific workflow folder | Narrow MCP access needed only for one workflow execution. |

## Server Instances: One Per Principal

For platform MCPs that authenticate via OAuth grants (Webflow, and any future platform where one grant covers a set of accounts/sites), we register **one named server instance per principal** instead of one shared server for the whole platform.

A **principal** is the account boundary a grant should cover: Webzite Studio itself, or one client engagement.

**Why:** the MCP client stores the OAuth grant keyed by *server name*. A single shared server therefore forces a choice between one grant that spans every client's sites (over-broad access) or re-authenticating on every client switch (which silently wipes the previous client's grant). Named instances give each principal a persistent, least-privilege grant — and the tool prefix (`mcp__webflow-clifton-exteriors__...`) makes it self-evident which account an agent is acting on.

**Naming convention:** `<platform>-<principal-slug>`, where the principal slug matches the folder name under `deliver/` (or `webzite` for agency-owned properties).

| Instance pattern | Access level | Grant scope when authorizing |
| :--- | :--- | :--- |
| `<platform>-webzite` | `agency` | Webzite-owned sites/workspaces only |
| `<platform>-<client-name>` | `client` | Only that client's site(s) — never select other clients' sites in the OAuth screen |
| *(none — no authenticated instance)* | `prospect` | Prospect analysis uses public URLs only, never an authenticated grant |

**Runtime rules:**

1. Authenticate only the instance for the principal you are actively working on; leave other instances unauthenticated.
2. When completing the OAuth authorization screen, select **only** the sites belonging to that instance's principal.
3. Before any mutation, verify the tool prefix matches the client folder you are working in (e.g., work under `deliver/farewell-agency/clifton-exteriors/` must use `webflow-clifton-exteriors` tools).
4. Each machine/account holds its own runtime grants; instance definitions in `.mcp.json` are shared and safe to commit (they contain no secrets).

**Adding a client instance:**

1. `claude mcp add --transport http <platform>-<client-name> <platform-mcp-url> -s project` (or add the entry to `.mcp.json` directly).
2. Restart the session and approve the new project-scoped server when prompted.
3. Authenticate via `/mcp`, selecting only that client's sites in the OAuth screen.
4. Register the instance in [MCP_INDEX.md](./MCP_INDEX.md) and the client's `docs/mcp-access.md`.

**Platforms without dynamic client registration:**

Step 1 above assumes the platform supports RFC 7591 dynamic client registration, so Claude Code can register itself and open the browser unaided. Webflow does. Some platforms do not — Asana's V2 server, for example, delegates authorization to `https://app.asana.com`, whose metadata advertises no `registration_endpoint` and requires a confidential client.

For those platforms, a human must first create an OAuth app in the platform's developer console with a **pinned loopback redirect URI**, then register the instance with the resulting credentials:

```bash
claude mcp add --transport http \
  --client-id <CLIENT_ID> --client-secret --callback-port 8080 \
  <platform>-<client-name> <platform-mcp-url> -s project
```

- `--callback-port` pins the loopback port so the redirect URI (`http://localhost:<port>/callback`) is stable enough to pre-register. Without it Claude Code picks a random port and the platform rejects the callback.
- `--client-secret` takes no value; it opens a hidden prompt. Prefer the prompt over the `MCP_CLIENT_SECRET` environment variable, which leaks the secret into shell history and agent transcripts.
- **Verified 2026-08-05 (Claude Code 2.1.222):** only `oauth: { clientId, callbackPort }` is written to `.mcp.json`. The client secret goes to the OS credential store, not to `.mcp.json` and not to `~/.claude.json`. A client ID is a public identifier, so the file remains safe to commit.
- `claude mcp remove` strips `.mcp.json`'s trailing newline; restore it before committing.

**Grant boundary is platform-specific.** Per-instance naming guarantees a persistent grant and a self-evident tool prefix, but it does not by itself guarantee least privilege. Check what the platform's authorization screen actually lets you scope: Webflow scopes to selected sites, whereas Asana's grant follows the **user** and reaches every workspace that user belongs to. Where the platform cannot scope the grant, isolation must come from the account itself (a limited-access/guest membership, or a dedicated account), and the client's `mcp-access.md` must name the allowed workspace explicitly.

## Folder-Based Control

MCP server definitions are stored in `.mcp.json` and documented in `mcp-servers/`. Folder-level access is controlled by `mcp-access.md` files.

Before using any MCP tool, agents must:

1. Identify the active folder context.
2. Read the closest applicable `mcp-access.md`.
3. Read the referenced profile in `mcp-servers/profiles/`.
4. Confirm the MCP server is listed in [MCP_INDEX.md](./MCP_INDEX.md).
5. Verify runtime authentication through `/mcp`, `claude mcp list`, or the MCP client's equivalent status check.
6. Confirm the target account, site, base, project, repository, or deployment before making changes.
7. Ask explicit confirmation before publishing, deleting, overwriting, billing, emailing, deploying, changing production data, or using private session data.
8. Store MCP outputs in the active workflow's `.tmp/` folder unless that workflow specifies a different repo-safe artifact path.

If no `mcp-access.md` exists for the active folder and the task requires an MCP, create or request one before using the MCP. Read-only public prospect analysis may use the `prospect-audit` profile when the workflow directive already allows public web analysis.

> [!NOTE]
> **VPS-resident agents (e.g., [Hermes](../HERMES.md))** that operate inside this repository's folders are bound by the same folder-based `mcp-access.md` rules as any other agent. Their own external projects live outside this repository and are out of scope here — do not add a Hermes-specific MCP profile, since that would imply Hermes' infrastructure lives in this repo.

## MCP Access File Pattern

Each folder that uses MCPs should include an `mcp-access.md` file with:

- Access level.
- Referenced profile.
- Active MCP servers.
- Target accounts, sites, projects, repositories, bases, or deployment targets.
- Allowed operations.
- Forbidden operations.
- Confirmation requirements.
- Runtime authentication notes without secret values.
- Artifact storage path.

Use identifiers such as site IDs, workspace names, base IDs, project slugs, and public URLs when they are not secrets. Never include API keys, OAuth tokens, passwords, full credential values, private cookies, or recovery codes.

## Scope Strategy

- **Project scope**: Use `.mcp.json` for team-visible server definitions that are safe to commit.
- **User scope**: Use user/global MCPs for private tools available across projects.
- **Local scope**: Use local-scoped MCP definitions for experimental tools, private credentials, or stronger client isolation. Local scope is stored outside this repository and must not become the default unless a client project requires it.

## Mutating Actions

The following actions always require explicit confirmation in the current conversation or workflow directive:

- Publishing a site or deployment to production.
- Deleting, overwriting, bulk editing, or migrating client data.
- Sending email, outreach, invoices, contracts, or public notifications.
- Charging, refunding, billing, or changing payment settings.
- Changing DNS, domain, OAuth app, webhook, or production environment settings.
- Granting, revoking, or transferring access.

## Version Control

This MCP access model follows the root-level version control rules in [SYSTEM_RULES.md](../SYSTEM_RULES.md). Commit documentation and lightweight configuration references only. Do not commit secrets, OAuth tokens, API keys, passwords, private cookies, or binary/media assets.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
