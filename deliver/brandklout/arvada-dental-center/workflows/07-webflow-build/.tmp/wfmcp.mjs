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
 * Everything mutating must carry site id 6a60bdc0340e5f1784b4d553 (Mason Park
 * Dental of Katy) AND a specific page id. The instance reaches all nine
 * Brandklout sites; the site id is the security boundary, not the tool prefix.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const CREDS = path.join(os.homedir(), '.claude-team', '.credentials.json');
const KEY = 'webflow-brandklout|d3c3adf35e21c0dc';
const URL_MCP = 'https://mcp.webflow.com/mcp';

function readCreds() {
  const all = JSON.parse(fs.readFileSync(CREDS, 'utf8'));
  const entry = all.mcpOAuth?.[KEY];
  if (!entry) throw new Error(`no grant at ${KEY} in ${CREDS}`);
  return { all, entry };
}

/**
 * Newer Claude Code builds store a slimmed `discoveryState` that carries only
 * `authorizationServerUrl` — no cached metadata document. Fall back to the
 * authorization server's own well-known endpoint in that case.
 */
async function discoverTokenEndpoint(entry) {
  const base =
    entry.discoveryState?.authorizationServerUrl ||
    new URL(entry.serverUrl || URL_MCP).origin;
  const r = await fetch(new URL('/.well-known/oauth-authorization-server', base));
  if (!r.ok) throw new Error(`oauth metadata discovery failed ${r.status} at ${base}`);
  const meta = await r.json();
  if (!meta.token_endpoint) throw new Error(`no token_endpoint in metadata at ${base}`);
  return meta.token_endpoint;
}

async function accessToken() {
  const { all, entry } = readCreds();
  if (entry.expiresAt && Date.now() < entry.expiresAt - 60_000) return entry.accessToken;
  if (!entry.refreshToken) throw new Error('access token expired and no refresh token present');
  const tokenUrl =
    entry.discoveryState?.authorizationServerMetadata?.token_endpoint ||
    entry.discoveryState?.tokenEndpoint ||
    (await discoverTokenEndpoint(entry));
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
 * Drop the cached session so the next call re-reads (and if needed refreshes)
 * the stored grant. `ensureSession` memoises the access token for the life of
 * the process, so a long run outlives its own token and every later call comes
 * back `HTTP 401 invalid_token` — which looks exactly like a revoked grant.
 */
export function resetSession() {
  session = null;
  sessionId = null;
}

/** Call one tool. Exported so other scripts can drive the API. */
export async function callTool(name, args) {
  for (let attempt = 0; ; attempt++) {
    const token = await ensureSession();
    try {
      const res = await rpc(token, 'tools/call', { name, arguments: args });
      const text = (res.content ?? []).filter((c) => c.type === 'text').map((c) => c.text).join('\n');
      return { text, raw: res };
    } catch (e) {
      if (attempt >= 1 || !/HTTP 401|invalid_token/.test(String(e.message))) throw e;
      process.stderr.write('[wfmcp] access token expired mid-run — re-handshaking\n');
      resetSession();
    }
  }
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
