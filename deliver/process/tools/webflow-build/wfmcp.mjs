#!/usr/bin/env node
/**
 * wfmcp.mjs — talk to the Webflow MCP server over streamable HTTP from a script,
 * reusing the OAuth grant Claude Code already holds for a project MCP instance.
 *
 * Promoted 2026-09-23 from grand-mission-dentistry/workflows/07-webflow-build/output/wfmcp.mjs
 * (identical copies lived in arvada, legacy and marvel). Generalised: the instance name is an
 * argument instead of a hardcoded `webflow-brandklout|<hash>` key, and no site id is baked in.
 *
 * WHY THIS EXISTS
 * ---------------
 * - The Webflow OAuth token is MCP-only. It returns 401 against api.webflow.com, so there is
 *   no REST path. Scripts that make hundreds of calls (tree walks, class syncs, audits) have to
 *   speak MCP JSON-RPC themselves.
 * - The grant lives in `~/.claude-<profile>/.credentials.json` under
 *   `mcpOAuth["<instance>|<url-hash>"]`. Which profile holds a live copy depends on how the
 *   session started (`claude team` vs `claude personal`), so all profiles are scanned and the
 *   freshest wins. Never re-authenticate to "fix" a missing grant on a partner instance:
 *   re-authorizing replaces the grant wholesale and any site left unticked loses access.
 * - Access tokens are refreshed in place when they expire.
 *
 * USAGE
 *   node wfmcp.mjs list [--full]                      tool names (or full JSON schemas)
 *   node wfmcp.mjs call <tool> '<jsonArgs>'
 *   node wfmcp.mjs call <tool> --file args.json
 *   env WEBFLOW_MCP_INSTANCE=webflow-oceanic-dental   default: webflow-brandklout
 *
 * Library: `import { callTool, listTools } from './wfmcp.mjs'`. Prefer wf.mjs, which adds the
 * site-id guard, argument-shape injection and 429 retries on top of this.
 *
 * Redirect output to a file, never pipe it (Node on Windows dies on a libuv assertion when
 * stdout is a pipe).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const PROFILES = ['.claude-team', '.claude-personal', '.claude'];
const INSTANCE = process.env.WEBFLOW_MCP_INSTANCE || 'webflow-brandklout';
const URL_MCP = 'https://mcp.webflow.com/mcp';

function readCreds() {
  const found = [];
  for (const dir of PROFILES) {
    const file = path.join(os.homedir(), dir, '.credentials.json');
    if (!fs.existsSync(file)) continue;
    let all;
    try { all = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { continue; }
    for (const [key, entry] of Object.entries(all.mcpOAuth || {})) {
      if (key.split('|')[0] === INSTANCE && entry?.accessToken) found.push({ file, all, entry });
    }
  }
  if (!found.length) {
    throw new Error(`no OAuth grant for MCP instance "${INSTANCE}" in any of ${PROFILES.join(', ')}. ` +
      'Authenticate it once through /mcp in a Claude Code session (see mcp-servers/webflow/setup.md).');
  }
  found.sort((a, b) => (b.entry.expiresAt ?? 0) - (a.entry.expiresAt ?? 0));
  return found[0];
}

/* The stored discoveryState does not always carry a token endpoint. */
async function discoverTokenEndpoint() {
  const origin = new URL(URL_MCP).origin;
  for (const u of [`${origin}/.well-known/oauth-authorization-server`, `${origin}/.well-known/openid-configuration`]) {
    try {
      const r = await fetch(u);
      if (!r.ok) continue;
      const j = await r.json();
      if (j.token_endpoint) return j.token_endpoint;
    } catch { /* try the next one */ }
  }
  return null;
}

async function accessToken() {
  const { file, all, entry } = readCreds();
  if (entry.expiresAt && Date.now() < entry.expiresAt - 60_000) return entry.accessToken;
  if (!entry.refreshToken) throw new Error('access token expired and no refresh token present');
  const tokenUrl =
    entry.discoveryState?.authorizationServerMetadata?.token_endpoint ||
    entry.discoveryState?.tokenEndpoint ||
    (await discoverTokenEndpoint());
  if (!tokenUrl) throw new Error('no token endpoint in stored discoveryState');
  const r = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: entry.refreshToken, client_id: entry.clientId }),
  });
  const txt = await r.text();
  if (!r.ok) throw new Error(`token refresh failed ${r.status}: ${txt.slice(0, 300)}`);
  const t = JSON.parse(txt);
  entry.accessToken = t.access_token;
  if (t.refresh_token) entry.refreshToken = t.refresh_token;
  if (t.expires_in) entry.expiresAt = Date.now() + t.expires_in * 1000;
  fs.writeFileSync(file, JSON.stringify(all, null, 2));
  process.stderr.write('[wfmcp] refreshed the access token\n');
  return entry.accessToken;
}

let sessionId = null;
let seq = 0;

async function rpc(token, method, params, { notify = false } = {}) {
  const payload = notify ? { jsonrpc: '2.0', method, params } : { jsonrpc: '2.0', id: ++seq, method, params };
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

/* Handshake once per process. Re-initializing while a session id is held is rejected. */
let session = null;
async function ensureSession() {
  if (session) return session;
  session = (async () => {
    const token = await accessToken();
    await rpc(token, 'initialize', {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'wfmcp-direct', version: '1.1.0' },
    });
    await rpc(token, 'notifications/initialized', {}, { notify: true });
    return token;
  })();
  return session;
}

/** Call one tool. Returns { text, raw }. */
export async function callTool(name, args) {
  const token = await ensureSession();
  const res = await rpc(token, 'tools/call', { name, arguments: args });
  const text = (res.content ?? []).filter((c) => c.type === 'text').map((c) => c.text).join('\n');
  return { text, raw: res };
}

export async function listTools() {
  const token = await ensureSession();
  return (await rpc(token, 'tools/list', {})).tools;
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  const [cmd, ...rest] = process.argv.slice(2);
  if (cmd === 'list') {
    const tools = await listTools();
    console.log(rest[0] === '--full' ? JSON.stringify(tools, null, 2) : tools.map((t) => t.name).join('\n'));
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
