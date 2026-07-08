# Agent Dispatch MCP Server

Local **stdio** MCP server that exposes the Webzite cross-provider dispatcher ([`.agents/dispatch.py`](../../.agents/dispatch.py)) as MCP tools, so any MCP client (Claude Code, pi, Gemini, …) can trigger another provider's agent **natively** instead of shelling out.

This is the optional "native idiom" layer. The dispatcher CLI is the universal core and works without it. Full rules: [`.agents/DISPATCH.md`](../../.agents/DISPATCH.md).

## Tools

| Tool | Purpose |
| :--- | :--- |
| `ask` | Synchronously run another provider's agent; return its answer. |
| `handoff` | Queue a task; returns a `task_id`. |
| `collect` | Return the answer for a finished `task_id`, or its status. |
| `status` | Show inbox/outbox state. |
| `routes` | Print the roster, role→agent routing, and installed CLIs. |

## Register

Already wired into [`.mcp.json`](../../.mcp.json) as a project-scoped stdio server:

```json
"agent-dispatch": {
  "type": "stdio",
  "command": "python",
  "args": ["mcp-servers/agent-dispatch/server.py"]
}
```

After changing `.mcp.json`, restart the MCP client and approve the project-scoped server. Verify in Claude Code via `/mcp`.

> **`python` vs `python3`:** the command is `python`. On Ubuntu/VPS where only `python3` exists, either `sudo apt install -y python-is-python3` or change the `command` locally to `python3`. On Windows `python` is correct.

## Smoke test (without an MCP client)

```bash
# from repo root
python mcp-servers/agent-dispatch/server.py
# then paste on stdin:
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0"}}}
{"jsonrpc":"2.0","method":"notifications/initialized"}
{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}
{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"routes","arguments":{}}}
```

## Folder-Based Access

This server only **launches** other agents; it holds no platform grants itself. The sub-agents it spawns are still bound by the active folder's `mcp-access.md`. Access profile: [profiles/agent-dispatch.md](../profiles/agent-dispatch.md) (`global`). Read [ACCESS_MODEL.md](../ACCESS_MODEL.md) and [`.agents/DISPATCH.md`](../../.agents/DISPATCH.md) before routing work that touches client resources.

## Version Control

Stdlib-only Python (no dependencies). Safe to commit. Provider login tokens and API keys live outside this repo at runtime — never commit them.

## Infrastructure

- **Hosting**: Hostinger VPS (Ubuntu 24.04 LTS) + local Windows workstation.
- **Runtime**: Python 3.11+ (stdlib only). Provider CLIs installed per machine.
