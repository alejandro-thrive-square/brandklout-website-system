# MCP Access Model

This document defines how agents use Model Context Protocol (MCP) servers across the Brandklout Website System. MCP server definitions stay centralized, while permission and target-resource decisions are controlled by the active folder.

## Access Levels

| Level | Folder Scope | Purpose |
| :--- | :--- | :--- |
| `global` | Repository-wide | Utility MCPs that touch no client account, such as a component library, browser, search, or read-only analysis tools. |
| `client` | `deliver/brandklout/<client>/` | MCP access to Brandklout client sites, the partner-owned workspace, or client-authorized platforms. |
| `workflow` | A specific scenario step folder | Narrow MCP access needed only for one step. |

## Server Instances: One Per Principal

For platform MCPs that authenticate via OAuth grants (Webflow, and any future platform where one grant covers a set of accounts/sites), we register **one named server instance per principal** instead of one shared server for the whole platform.

A **principal** is the account boundary a grant should cover — and it is defined by **whoever owns the platform account**, not by whoever the invoice is addressed to. In practice that is one direct client engagement or one **white-label partner agency** whose clients all live inside a single account the partner owns. In this repository that is Brandklout.

**Why:** the MCP client stores the OAuth grant keyed by *server name*. A single shared server therefore forces a choice between one grant that spans every client's sites (over-broad access) or re-authenticating on every client switch (which silently wipes the previous client's grant). Named instances give each principal a persistent, least-privilege grant — and the tool prefix (`mcp__webflow-brandklout__...`) makes it self-evident which account an agent is acting on.

**Naming convention:** `<platform>-<principal-slug>`, where the principal slug matches the folder name under `deliver/` (`brandklout`) or the client folder under `deliver/brandklout/`. For a partner agency the slug is the **partner** folder (`brandklout`), not the client subfolder beneath it.

| Instance pattern | Access level | Grant scope when authorizing |
| :--- | :--- | :--- |
| `<platform>-<client-name>` | `client` | Only that client's site(s) — never select other clients' sites in the OAuth screen |
| `<platform>-<partner-name>` | `client` | Every site in the partner's workspace that Webzite is engaged on. Per-client isolation is **not available** here — see below |

### When the partner owns the workspace, one instance is correct

Splitting by client only buys isolation when the clients sit in **separate platform accounts**. When a white-label partner keeps every client site in one workspace it owns, per-client instances are isolation theatre: each instance authorizes against the same workspace, so each one can see every sibling site anyway. What the split actually costs is real —

- one OAuth round trip per client, multiplying with every new engagement;
- a `.mcp.json` edit, a session restart, and a project-scoped server approval per client;
- a standing invitation to the exact mistake the naming was meant to prevent, because the operator re-authenticating instance #7 is looking at a site picker listing all of them.

So for a partner-owned workspace, register **one instance for the partner** and re-authenticate it when a new client joins, adding that client's site to the same grant.

**The compensating control is the site ID, not the server name.** With one instance the tool prefix no longer tells an agent which client it is acting on, so the boundary has to move into the folder docs and be enforced per call:

1. Every client subfolder's `mcp-access.md` must name that client's **site ID** under Target Resources. A client whose site ID is unknown has no authorization to write, only to read.
2. Before any mutating call, resolve the site ID from the `mcp-access.md` of the folder you are working in, and pass it explicitly. Never let a tool default to "the first site" or infer one from conversation.
3. Never widen a call to `list_sites`-and-act. Listing is fine for discovery; acting requires the ID from the folder doc.
4. One worktree per client (see the partner's orchestration doc) keeps the folder context unambiguous, which is what makes rule 2 reliable.

This is a weaker guarantee than a scoped grant, and it should be recorded as such. It is the correct trade only because the scoped-grant alternative was never actually available for this topology.

**Runtime rules:**

1. Authenticate only the instance for the principal you are actively working on; leave other instances unauthenticated.
2. When completing the OAuth authorization screen, select **only** the sites belonging to that instance's principal.
3. Before any mutation, verify the tool prefix matches the client folder you are working in. Every client in this repository sits under the **one** partner instance `webflow-brandklout`, so the prefix is identical for all of them and tells you nothing about which site you are on. Verify the **site ID** against the folder's `mcp-access.md` instead, on every call.
4. Each machine/account holds its own runtime grants; instance definitions in `.mcp.json` are shared and safe to commit (they contain no secrets).

**Adding a client instance:**

1. `claude mcp add --transport http <platform>-<client-name> <platform-mcp-url> -s project` (or add the entry to `.mcp.json` directly).
2. Restart the session and approve the new project-scoped server when prompted.
3. Authenticate via `/mcp`, selecting only that client's sites in the OAuth screen.
4. Register the instance in [MCP_INDEX.md](./MCP_INDEX.md) and the client's `docs/mcp-access.md`.

**Onboarding a client under an existing partner instance:**

No new server, no `.mcp.json` edit, no session restart.

1. Confirm the partner has added the new client's site to the workspace the instance already covers, and has invited the agency account to it.
2. Re-authenticate the existing partner instance via `/mcp` on the **team** profile, selecting the previously-authorized sites **plus** the new one. Re-authorizing replaces the grant wholesale, so a site left unticked loses access — tick every active client, not just the new one.
3. Run `list_sites` and record the new site's ID in the client's `docs/mcp-access.md` under Target Resources, and in the partner's site registry.
4. Add the client to the partner's row in [MCP_INDEX.md](./MCP_INDEX.md).

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
8. Store MCP outputs in the active step's `output/` folder unless that step specifies a different repo-safe artifact path.

If no `mcp-access.md` exists for the active folder and the task requires an MCP, create or request one before using the MCP.

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
