# Relume Library MCP — Setup

Remote MCP server published by Relume that exposes the **Relume component library** to an agent.
Registered project-scoped on 2026-08-10.

- **Endpoint**: `https://relume-library-mcp.relume.io/mcp`
- **Transport**: HTTP (streamable)
- **Server name in `.mcp.json`**: `relume`
- **Auth**: OAuth 2.1 (protected resource). Authorization server is the same host,
  `https://relume-library-mcp.relume.io`. Scope advertised: `relume:components`.
  Bearer token in the `Authorization` header; an unauthenticated `initialize` returns `401
  invalid_token`.

## Registration

```bash
claude mcp add --scope project --transport http relume https://relume-library-mcp.relume.io/mcp
```

The server is added to `.mcp.json` (committed). It must also be listed in
`enabledMcpjsonServers` in the worktree's `.claude/settings.local.json` — that file is gitignored,
so **a new worktree will not see this server until the name is added there**. See
[MCP_INDEX.md — Where OAuth grants actually live](../MCP_INDEX.md#where-oauth-grants-actually-live--authenticate-on-the-right-profile).

## Authentication

Run `/mcp` inside Claude Code, select `relume`, and complete the browser flow with a Relume account
that has library access.

> [!IMPORTANT]
> Grants are stored per **profile** (`~/.claude-personal/.credentials.json` vs
> `~/.claude-team/.credentials.json`). Authenticating on the personal profile does **not** give the
> team profile access. Client work runs on `claude team`, so authenticate there too if Relume
> components are used during client builds. The grant is global across worktrees once done.

## Access level

Treat as a **global/agency** tool: it reads a third-party component library and touches no client
account, so it carries none of the per-principal isolation concerns that the Webflow instances do.
It writes nothing anywhere.

## What it is for

Pulling Relume library components/sections as a source of structure when building or converting
pages. It complements, and does not replace, the local conversion pipeline
(`webflow-clientfirst`).

> [!WARNING]
> Relume output is a **starting structure**, not a deliverable. The house standard is the awwwards
> bar — chaptered, scroll-driven, motion-led. A page assembled from stock library sections will read
> as templatised and fails that bar. See the design standard in
> [deliver/DELIVER_SYSTEM_RULES.md](../../deliver/DELIVER_SYSTEM_RULES.md).

## Version Control

This directory is committed to Git. It contains documentation only — no secrets, tokens, or binary
assets. The OAuth grant is held at runtime by the Claude MCP client, outside the repository.
