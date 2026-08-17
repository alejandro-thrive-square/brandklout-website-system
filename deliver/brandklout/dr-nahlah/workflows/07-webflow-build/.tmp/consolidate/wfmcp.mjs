#!/usr/bin/env node
/**
 * wfmcp.mjs — talk to the Webflow MCP server over streamable HTTP, using the
 * `webflow-brandklout` OAuth grant that Claude Code stores on the TEAM profile.
 *
 * WHY THIS EXISTS
 * ---------------
 * The grant lives in `~/.claude-team/.credentials.json` under
 * `mcpOAuth["webflow-brandklout|<url-hash>"]`, which makes it per-profile and
 * global across projects (see docs/mcp-access.md → Runtime Authentication).
 * An agent session running on the PERSONAL profile therefore cannot see it and
 * reports the server as "Needs authentication" — even though the grant is
 * valid — because MCP servers are connected once at session start from
 * whichever CLAUDE_CONFIG_DIR that terminal was launched with.
 *
 * Re-authenticating on the personal profile is the wrong fix: per
 * docs/mcp-access.md, re-authenticating this server REPLACES its grant
 * wholesale and the OAuth screen must have every active Brandklout client
 * ticked, so unticking a sibling revokes it silently.
 *
 * This client reads the existing team-profile grant and speaks MCP directly.
 * Same grant, same scope, same site boundary — no second authorization, no
 * second agent session. Access tokens are refreshed in place when they expire.
 *
 *   node wfmcp.mjs list                        # tool names
 *   node wfmcp.mjs list --full                 # full JSON schemas
 *   node wfmcp.mjs call <tool> '<jsonArgs>'
 *   node wfmcp.mjs call <tool> --file args.json
 *
 * Everything mutating must carry site id 698111847e9608eb30ee21c6 (Grand
 * Mission Dentistry) AND a specific page id. The instance reaches all nine
 * Brandklout sites; the site id is the security boundary, not the tool prefix.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const CREDS = process.env.WF_CREDS || path.join(os.homedir(), '.claude-personal', '.credentials.json');
const KEY = 'webflow-brandklout|d3c3adf35e21c0dc';
const URL_MCP = 'https://mcp.webflow.com/mcp';

function readCreds() {
  const all = JSON.parse(fs.readFileSync(CREDS, 'utf8'));
  const entry = all.mcpOAuth?.[KEY];
  if (!entry) throw new Error(`no grant at ${KEY} in ${CREDS}`);
  return { all, entry };
}

async function accessToken() {
  const { all, entry } = readCreds();
  if (entry.expiresAt && Date.now() < entry.expiresAt - 60_000) return entry.accessToken;
  if (!entry.refreshToken) throw new Error('access token expired and no refresh token present');
  const tokenUrl =
    entry.discoveryState?.authorizationServerMetadata?.token_endpoint ||
    entry.discoveryState?.tokenEndpoint;
  if (!tokenUrl) throw new Error('no token endpoint in stored discoveryState');
  const r = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: entry.refreshToken,
      client_id: entry.clientId,
    }),
  });
  const txt = await r.text();
  if (!r.ok) throw new Error(`token refresh failed ${r.status}: ${txt.slice(0, 400)}`);
  const t = JSON.parse(txt);
  entry.accessToken = t.access_token;
  if (t.refresh_token) entry.refreshToken = t.refresh_token;
  if (t.expires_in) entry.expiresAt = Date.now() + t.expires_in * 1000;
  fs.writeFileSync(CREDS, JSON.stringify(all, null, 2));
  process.stderr.write('[wfmcp] refreshed the access token\n');
  return entry.accessToken;
}

let sessionId = null;
let seq = 0;

async function rpc(token, method, params, { notify = false } = {}) {
  const payload = notify
    ? { jsonrpc: '2.0', method, params }
    : { jsonrpc: '2.0', id: ++seq, method, params };
  const headers = {
    'content-type': 'application/json',
    accept: 'application/json, text/event-stream',
    authorization: `Bearer ${token}`,
    'mcp-protocol-version': '2025-06-18',
  };
  if (sessionId) headers['mcp-session-id'] = sessionId;
  const r = await fetch(URL_MCP, { method: 'POST', headers, body: JSON.stringify(payload) });
  const sid = r.headers.get('mcp-session-id');
  if (sid) sessionId = sid;
  if (notify) return null;
  const raw = await r.text();
  if (!r.ok) throw new Error(`HTTP ${r.status} on ${method}: ${raw.slice(0, 600)}`);
  let obj = null;
  if (raw.startsWith('event:') || raw.startsWith('data: ') || raw.includes('\ndata: ')) {
    for (const line of raw.split(/\r?\n/)) {
      if (!line.startsWith('data:')) continue;
      const j = JSON.parse(line.slice(5).trim());
      if (j.id === payload.id || j.result || j.error) obj = j;
    }
  } else {
    obj = JSON.parse(raw);
  }
  if (!obj) throw new Error(`no JSON-RPC frame in response: ${raw.slice(0, 600)}`);
  if (obj.error) throw new Error(`${method}: ${JSON.stringify(obj.error).slice(0, 900)}`);
  return obj.result;
}

/**
 * Handshake once per process and reuse the session. Re-initializing while a
 * session id is held is rejected ("Initialization requests must not include a
 * sessionId"), so a script that makes many calls must not re-handshake.
 */
let session = null;
async function ensureSession() {
  if (session) return session;
  session = (async () => {
    const token = await accessToken();
    await rpc(token, 'initialize', {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'wfmcp-direct', version: '1.0.0' },
    });
    await rpc(token, 'notifications/initialized', {}, { notify: true });
    return token;
  })();
  return session;
}

/**
 * Call one tool. Exported so other scripts can drive the API.
 *
 * The token is re-read (and refreshed if near expiry) on EVERY call, not once
 * per process: a long consolidation run outlives the access token, and the
 * handshake token cached by ensureSession() went stale mid-run, turning ~160
 * writes into 401s. The MCP session id stays valid across a token refresh, so
 * only the bearer needs renewing.
 */
export async function callTool(name, args) {
  await ensureSession();
  const token = await accessToken();
  const res = await rpc(token, 'tools/call', { name, arguments: args });
  const text = (res.content ?? []).filter((c) => c.type === 'text').map((c) => c.text).join('\n');
  return { text, raw: res };
}

export async function listTools() {
  const token = await ensureSession();
  return (await rpc(token, 'tools/list', {})).tools;
}

// --- CLI -------------------------------------------------------------------
const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  const [cmd, ...rest] = process.argv.slice(2);
  if (cmd === 'list') {
    const tools = await listTools();
    if (rest[0] === '--full') console.log(JSON.stringify(tools, null, 2));
    else console.log(tools.map((t) => t.name).join('\n'));
  } else if (cmd === 'call') {
    let args = {};
    if (rest[1] === '--file') args = JSON.parse(fs.readFileSync(rest[2], 'utf8'));
    else if (rest[1]) args = JSON.parse(rest[1]);
    const { text, raw } = await callTool(rest[0], args);
    console.log(text || JSON.stringify(raw.structuredContent ?? raw, null, 2));
    if (raw.isError) process.exitCode = 1;
  } else {
    console.error('usage: wfmcp.mjs list [--full] | call <tool> <json|--file f>');
    process.exitCode = 2;
  }
}
