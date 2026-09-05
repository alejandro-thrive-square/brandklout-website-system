## Latest completed: Relume library MCP registered (2026-08-10)

Commit `9321222`. `relume` → `https://relume-library-mcp.relume.io/mcp`, project scope, HTTP.
Docs: [mcp-servers/relume/setup.md](../mcp-servers/relume/setup.md), row added to `MCP_INDEX.md`.

- **Not usable yet — OAuth pending.** A bare `initialize` returns `401 invalid_token`
  (`WWW-Authenticate: Bearer`, scope `relume:components`). The operator must run `/mcp` → `relume`
  and complete the browser flow. Grants are **per profile**, so `claude personal` and `claude team`
  each need their own round trip.
- Added to `enabledMcpjsonServers` in `.claude/settings.local.json` — that file is gitignored, so
  **every other worktree must add the name itself** or the server silently never appears in `/mcp`.
- No principal, no client account, writes nothing → global/agency access level, unlike the
  per-principal Webflow instances.
