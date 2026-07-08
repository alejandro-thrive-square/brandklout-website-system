#!/usr/bin/env python3
"""
Zero-dependency stdio MCP server -> Webzite agent dispatcher.

Exposes .agents/dispatch.py as MCP tools so any MCP client (Claude Code, pi,
Gemini, ...) can trigger other providers' agents natively instead of shelling
out. Stdlib only (JSON-RPC 2.0 over stdin/stdout).

Tools: ask, handoff, collect, status, routes.
Register via .mcp.json (see setup.md). The dispatch.py CLI is the universal
core; this server is optional convenience.
"""
import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent            # mcp-servers/agent-dispatch/
REPO = HERE.parent.parent                          # repo root
DISPATCH = REPO / ".agents" / "dispatch.py"
PYTHON = sys.executable

TOOLS = [
    {
        "name": "ask",
        "description": "Synchronously run another provider's agent and return its answer. "
                       "Use for quick questions/sub-tasks where you need the result now. "
                       "Pick a role (backend|docs|audit|design|build|...) or a named agent.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "prompt":  {"type": "string",  "description": "the task for the sub-agent"},
                "role":    {"type": "string",  "description": "role tag, e.g. backend|docs|audit|design|build"},
                "agent":   {"type": "string",  "description": "named agent (overrides role)"},
                "cwd":     {"type": "string",  "description": "working directory (a workflow folder)"},
                "timeout": {"type": "integer", "description": "seconds"},
                "difficulty": {"type": "integer", "description": "1-10 capability tier (sets model + reasoning effort)"},
                "account": {"type": "string", "enum": ["team", "personal"], "description": "Claude account (team default, or personal Max)"},
            },
            "required": ["prompt"],
        },
    },
    {
        "name": "handoff",
        "description": "Queue a task for async processing. Returns a task id; run a worker to execute it.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "prompt": {"type": "string"},
                "role":   {"type": "string"},
                "agent":  {"type": "string"},
                "cwd":    {"type": "string"},
                "note":   {"type": "string"},
                "difficulty": {"type": "integer", "description": "1-10 capability tier"},
                "account": {"type": "string", "enum": ["team", "personal"]},
            },
            "required": ["prompt"],
        },
    },
    {
        "name": "collect",
        "description": "Return the answer for a finished task id (from handoff), or its current status.",
        "inputSchema": {"type": "object", "properties": {"task_id": {"type": "string"}}, "required": ["task_id"]},
    },
    {
        "name": "status",
        "description": "Show the dispatcher inbox/outbox state.",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "routes",
        "description": "Print the roster, role->agent routing, and which provider CLIs are installed.",
        "inputSchema": {"type": "object", "properties": {}},
    },
]


def run_dispatch(args):
    proc = subprocess.run([PYTHON, str(DISPATCH), *args],
                          capture_output=True, text=True, cwd=str(REPO))
    return proc.stdout, proc.stderr, proc.returncode


def text_result(text, is_error=False):
    r = {"content": [{"type": "text", "text": text}]}
    if is_error:
        r["isError"] = True
    return r


def call_tool(name, a):
    a = a or {}
    if name == "ask":
        args = ["ask", "--prompt", a["prompt"]]
        if a.get("agent"):
            args += ["--agent", a["agent"]]
        elif a.get("role"):
            args += ["--role", a["role"]]
        if a.get("cwd"):
            args += ["--cwd", a["cwd"]]
        if a.get("timeout"):
            args += ["--timeout", str(a["timeout"])]
        if a.get("difficulty"):
            args += ["--diff", str(a["difficulty"])]
        if a.get("account"):
            args += ["--account", a["account"]]
        out, err, rc = run_dispatch(args)
        if rc == 0:
            return text_result(out.strip())
        return text_result(f"[dispatch failed rc={rc}]\n{out}\n--- stderr ---\n{err}", is_error=True)
    if name == "handoff":
        args = ["handoff", "--prompt", a["prompt"]]
        if a.get("agent"):
            args += ["--agent", a["agent"]]
        elif a.get("role"):
            args += ["--role", a["role"]]
        if a.get("cwd"):
            args += ["--cwd", a["cwd"]]
        if a.get("note"):
            args += ["--note", a["note"]]
        if a.get("difficulty"):
            args += ["--diff", str(a["difficulty"])]
        if a.get("account"):
            args += ["--account", a["account"]]
        out, err, rc = run_dispatch(args)
        if rc == 0:
            return text_result(
                f"Queued. task_id={out.strip()}\n"
                "Process it with: python .agents/dispatch.py worker --once")
        return text_result((err or out).strip(), is_error=True)
    if name == "collect":
        out, err, rc = run_dispatch(["collect", a["task_id"]])
        return text_result((out if rc == 0 else err).strip(), is_error=rc != 0)
    if name == "status":
        out, _, _ = run_dispatch(["status"])
        return text_result(out.strip())
    if name == "routes":
        out, _, _ = run_dispatch(["routes"])
        return text_result(out.strip())
    return text_result(f"Unknown tool: {name}", is_error=True)


def handle(method, params):
    if method == "initialize":
        return {"protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "serverInfo": {"name": "agent-dispatch", "version": "0.1.0"}}
    if method == "tools/list":
        return {"tools": TOOLS}
    if method == "tools/call":
        return call_tool(params.get("name"), params.get("arguments"))
    if method == "ping":
        return {}
    return None


def main():
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            msg = json.loads(line)
        except json.JSONDecodeError:
            continue
        if "method" not in msg:
            continue
        rid = msg.get("id")
        method = msg["method"]
        params = msg.get("params") or {}
        if method.startswith("notifications/"):
            continue  # notifications receive no response
        try:
            result = handle(method, params)
        except Exception as e:  # noqa: BLE001 - surface any error to the client
            if rid is not None:
                sys.stdout.write(json.dumps(
                    {"jsonrpc": "2.0", "id": rid,
                     "error": {"code": -32603, "message": f"{type(e).__name__}: {e}"}}
                ) + "\n")
                sys.stdout.flush()
            continue
        if rid is not None:
            sys.stdout.write(json.dumps({"jsonrpc": "2.0", "id": rid, "result": result}) + "\n")
            sys.stdout.flush()


if __name__ == "__main__":
    main()
