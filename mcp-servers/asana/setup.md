# Asana MCP Server

Connects Claude Code to Asana's Work Graph for reading and managing tasks, projects, portfolios, and goals. Used to read and delegate work items from a partner's or client's project-management workspace.

## Endpoint and Transport

| Property | Value |
| :--- | :--- |
| URL | `https://mcp.asana.com/v2/mcp` |
| Transport | Streamable HTTP (`--transport http`) |
| Authorization server | `https://app.asana.com` (**not** `mcp.asana.com`) |
| Dynamic client registration (RFC 7591) | **Not supported** |
| Client authentication | Confidential client — `client_id` + `client_secret` required |
| PKCE | `S256` |

> [!WARNING]
> The V1 beta server `https://mcp.asana.com/sse` is **deprecated** (shutdown announced for 2026-08-05). Do not register it. Note that `https://mcp.asana.com/.well-known/oauth-authorization-server` still advertises a `registration_endpoint` — that metadata belongs to the retired V1 server. The V2 resource's protected-resource metadata points at `https://app.asana.com`, whose metadata has **no** `registration_endpoint` and does **not** list `none` in `token_endpoint_auth_methods_supported`.

The practical consequence: unlike Webflow, Asana **cannot** be added with a bare `claude mcp add --transport http <name> <url>`. Claude Code has no client to register itself as, so the OAuth flow fails before the browser opens. You must pre-register an OAuth app in Asana's developer console first.

## Prerequisite: Register an Asana OAuth App

This is a one-time manual step per Asana account, done by a human in the Asana UI.

1. Sign in to Asana as the user who has been granted access to the target workspace.
2. Go to <https://app.asana.com/0/my-apps> → **Create new app**.
3. Name it (e.g. `Webzite Claude Code`) and accept the API terms.
4. Under **OAuth** → **Redirect URLs**, add exactly:
   ```
   http://localhost:8080/callback
   ```
   This must match byte-for-byte — no trailing slash, no `127.0.0.1` substitution. It is the URI Claude Code serves when `--callback-port 8080` is set.
5. Copy the **Client ID** and **Client secret**.

> [!NOTE]
> Asana historically restricted redirect URLs to `https://` or the out-of-band value `urn:ietf:wg:oauth:2.0:oob`, which is why several public reports describe CLI OAuth as impossible. Claude Code's `--callback-port` flag exists to pin the loopback port so it *can* be pre-registered. If Asana's console rejects the `http://localhost:8080/callback` value, that is the blocker — fall back to the alternatives below.

## Installation

Registered as **one server instance per principal** (see [ACCESS_MODEL.md — Server Instances](../ACCESS_MODEL.md#server-instances-one-per-principal)), matching the Webflow pattern. The instance slug matches the folder name under `deliver/`.

```bash
claude mcp add --transport http \
  --client-id <ASANA_CLIENT_ID> \
  --client-secret \
  --callback-port 8080 \
  asana-<principal-slug> https://mcp.asana.com/v2/mcp -s project
```

`--client-secret` takes no value — it triggers a hidden interactive prompt. **Use the prompt, not the `MCP_CLIENT_SECRET` environment variable**: an env var assignment on the command line is captured in shell history and in agent session transcripts.

### What lands where

Verified 2026-08-05 on Claude Code 2.1.222:

- `.mcp.json` receives **only** `type`, `url`, and `oauth: { clientId, callbackPort }`. A client ID is a public identifier, so this file stays safe to commit.
- The **client secret is not written to `.mcp.json`, and not to `~/.claude.json`** — it goes to the OS credential store. Nothing secret enters the repository.
- `claude mcp remove <name> -s project` strips the file's trailing newline. Re-add it before committing to avoid a spurious diff.

## Known blocker: Claude Code cannot complete the token exchange

**Status 2026-08-05: the official Asana MCP server does not work from Claude Code**, even with a
correctly configured OAuth app. The browser flow completes, the callback lands, and then:

```
Couldn't complete authentication for "<name>":
The `client_id` and `client_secret` must authorize the app.
```

This was isolated to Claude Code — **not** to the Asana app — by replaying the identical flow by
hand (`deliver/scripts/`):

| Variable | Result |
| :--- | :--- |
| Redirect URI `http://localhost:8080/callback` | Accepted; Asana returns a real authorization code |
| Credentials via `client_secret_post` (form body) | **200 — token issued** |
| Same, plus RFC 8707 `resource=https://mcp.asana.com/v2/mcp` | **200 — token issued** |
| That token against `https://mcp.asana.com/v2/mcp` | **200** — `initialize` succeeds, 36 tools listed |
| Credentials via `client_secret_basic` (Authorization header) | Untested — the one remaining suspect |

So the app, the secret, the redirect URL, the `resource` parameter, and the MCP server are all fine.
The only untested difference is the client-authentication method. Asana's metadata advertises both
`client_secret_post` and `client_secret_basic`; if Claude Code uses Basic and Asana does not honour
it for this app type, that fully explains the error.

**Consequence:** register the instance for documentation and future use, but do not expect `/mcp` to
connect. Use a direct-token script path (see `deliver/scripts/README.md`) or the
claude.ai connector until this is fixed upstream.

## App types: MCP app vs API app

Asana distinguishes app types, and an **MCP app's tokens are rejected by the REST API**:

```
GET https://app.asana.com/api/1.0/users/me  ->  400 "This endpoint requires an API app."
```

That is deliberate — it limits the blast radius of a leaked MCP token. If you register the app for
MCP use, all data access must go through MCP JSON-RPC `tools/call` against
`https://mcp.asana.com/v2/mcp`. Do not plan on REST endpoints as a fallback; you would need a
separate API-type app for that.

## Folder-Based Access

The server definition is shared; usage is controlled by the active folder's nearest `mcp-access.md`.

Before using Asana MCP:
1. Read [ACCESS_MODEL.md](../ACCESS_MODEL.md).
2. Read the closest applicable `mcp-access.md`.
3. Read the referenced profile in [profiles/](../profiles/).
4. Verify runtime authentication through `/mcp`.
5. Confirm the target workspace and project before any write.

## Grant Scope: Read This Before Authorizing

Asana's OAuth grant follows the **user**, not the workspace. There is no workspace picker in the authorization screen. A token issued to your Asana user can reach **every workspace that user belongs to**.

This is a materially weaker isolation boundary than Webflow's, where the OAuth screen lets you select individual sites. Per-instance naming still buys the right things — a persistent grant per engagement, and a self-evident tool prefix (`mcp__asana-brandklout__...`) — but it does **not** by itself prevent an agent from reading another workspace.

Real isolation has to come from the Asana membership:

- **Preferred:** be invited to the partner/client workspace as a **limited-access member or guest**, scoped to only the projects relevant to the engagement.
- **Strongest:** register the OAuth app under a **separate Asana user account** that belongs only to that one workspace.
- **Weakest (document it if used):** your everyday Asana account, which spans multiple workspaces. The `mcp-access.md` must then name the allowed workspace explicitly, and agents must verify workspace GID before every write.

## Authorization

1. Run the `claude mcp add` command above.
2. Restart the session and approve the new project-scoped server when prompted.
3. Run `/mcp`, select the `asana-<principal-slug>` instance, and complete OAuth in the browser.
4. Confirm the authenticated user and the visible workspaces before doing any work.

## Alternatives (if the redirect URL is rejected)

| Route | Trade-off |
| :--- | :--- |
| **claude.ai connector** (<https://claude.ai/settings/connectors>) | Uses Anthropic's pre-registered redirect, so no Asana app is needed. But it is an **account-level** connector — it lives outside `.mcp.json`, holds a single Asana grant, and a second client's Asana would silently overwrite the first. Same failure mode documented for the `claude.ai Webflow` connector in [MCP_INDEX.md](../MCP_INDEX.md). |
| **Community stdio server + PAT** (`npx @roychri/mcp-server-asana`) | No OAuth at all, fully project-scoped. But it is unmaintained third-party code, and an Asana personal access token is a long-lived secret that reaches **every** workspace the user belongs to, with no scoping whatsoever. Local scope only; never commit the token. |

Both are fallbacks. Prefer the official V2 server.

## Troubleshooting

- **`redirect_uri not registered for application`**: the Redirect URL in the Asana app does not exactly match `http://localhost:8080/callback`, or `--callback-port 8080` was omitted so Claude Code picked a random port.
- **OAuth fails before the browser opens / `invalid_client`**: `--client-id` was omitted. V2 has no dynamic registration, so there is nothing to fall back to.
- **`Authorization header is required for MCP V2 access` (401)**: the instance is registered but not yet authenticated. Complete OAuth via `/mcp`.
- **Port 8080 already in use**: pick another port, and register that exact URL in the Asana app as well.
- **`"<name>" is from .mcp.json and awaiting approval. Run \`claude\` in this directory to review it first.`**: `claude mcp login` will not run until the project-scoped server has been approved. Approval is an interactive trust prompt shown when a session starts in this directory — a session that was already running when the server was added has not seen it. Restart the session, approve, then authenticate. This ordering cannot be skipped or scripted.
- **Server missing from `/mcp` entirely**: project-scoped servers need a one-time approval at session start, and Claude Code remembers a rejection silently. Run `claude mcp reset-project-choices`, restart, and approve.
- **Wrong workspace visible**: the grant follows the Asana user. Re-check which account completed OAuth; see *Grant Scope* above.

## Version Control

Documentation only — no secrets. The client ID in `.mcp.json` is a public identifier; the client secret and OAuth tokens are held at runtime by Claude Code in the OS credential store and must never be committed.

## Infrastructure

- **Hosting**: Hostinger VPS (Ubuntu 24.04 LTS)
- **Client**: Claude Code CLI (project-scoped MCP config)
- **Type**: Remote HTTP (`https://mcp.asana.com/v2/mcp`)
