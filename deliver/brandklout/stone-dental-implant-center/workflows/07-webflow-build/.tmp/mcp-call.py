#!/usr/bin/env python3
"""Minimal Webflow MCP (streamable HTTP) JSON-RPC client."""
import json, sys, urllib.request, urllib.error
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

CREDS = r"C:/Users/ACER/.claude-team/.credentials.json"
MCP_URL = "https://mcp.webflow.com/mcp"
SESSION_FILE = r".tmp/mcp-session.txt"


def get_token():
    with open(CREDS) as f:
        data = json.load(f)
    return data["mcpOAuth"]["webflow-brandklout|d3c3adf35e21c0dc"]["accessToken"]


def post(payload, token, session_id=None):
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
    }
    if session_id:
        headers["Mcp-Session-Id"] = session_id
    req = urllib.request.Request(MCP_URL, data=json.dumps(payload).encode(), headers=headers, method="POST")
    try:
        resp = urllib.request.urlopen(req, timeout=120)
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        return e.code, dict(e.headers), body
    return resp.status, dict(resp.headers), resp.read().decode(errors="replace")


def parse_body(body):
    """Parse SSE or plain JSON into a list of messages."""
    msgs = []
    body_s = body.strip()
    if body_s.startswith("{"):
        msgs.append(json.loads(body_s))
    else:
        for line in body_s.splitlines():
            if line.startswith("data:"):
                chunk = line[5:].strip()
                if chunk and chunk != "[DONE]":
                    msgs.append(json.loads(chunk))
    return msgs


def rpc(method, params=None, notify=False):
    token = get_token()
    session_id = None
    try:
        with open(SESSION_FILE) as f:
            session_id = f.read().strip() or None
    except FileNotFoundError:
        pass

    msg_id = 1
    if not notify:
        payload = {"jsonrpc": "2.0", "id": msg_id, "method": method}
        if params is not None:
            payload["params"] = params
        status, headers, body = post(payload, token, session_id)
        new_sid = headers.get("Mcp-Session-Id") or headers.get("mcp-session-id")
        if new_sid and new_sid != session_id:
            with open(SESSION_FILE, "w") as f:
                f.write(new_sid)
        msgs = parse_body(body)
        return status, msgs
    else:
        payload = {"jsonrpc": "2.0", "method": method}
        if params is not None:
            payload["params"] = params
        status, headers, body = post(payload, token, session_id)
        return status, body


def main():
    cmd = sys.argv[1]
    if cmd == "init":
        status, msgs = rpc("initialize", {
            "protocolVersion": "2025-03-26",
            "capabilities": {},
            "clientInfo": {"name": "bk-stone-dental-agent", "version": "1.0.0"},
        })
        print("status:", status)
        for m in msgs:
            if "result" in m:
                print("server:", m["result"].get("serverInfo", {}))
                print("capabilities:", json.dumps(m["result"].get("capabilities", {}))[:500])
            elif "error" in m:
                print("error:", m["error"])
        # notifications/initialized
        rpc("notifications/initialized", notify=True)
        print("initialized notification sent")
    elif cmd == "tools":
        status, msgs = rpc("tools/list", {})
        for m in msgs:
            for t in m.get("result", {}).get("tools", []):
                print(f"- {t['name']}: {t.get('description','')[:100]}")
    elif cmd == "call":
        tool = sys.argv[2]
        args = json.loads(sys.argv[3]) if len(sys.argv) > 3 else {}
        status, msgs = rpc("tools/call", {"name": tool, "arguments": args})
        print("status:", status)
        for m in msgs:
            if "result" in m:
                for c in m["result"].get("content", []):
                    if c.get("type") == "text":
                        print(c["text"])
            elif "error" in m:
                print("error:", json.dumps(m["error"]))
    else:
        print("usage: mcp-call.py init|tools|call <tool> <json-args>")


if __name__ == "__main__":
    main()
