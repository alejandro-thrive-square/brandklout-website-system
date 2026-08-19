#!/usr/bin/env node
/**
 * instatic-mcp.mjs — talk to the `instatic-dr-nahlah` MCP server over
 * streamable HTTP, using the OAuth grant Claude Code stores on the TEAM profile.
 *
 * WHY THIS EXISTS
 * ---------------
 * MCP servers are connected once at session start from whichever
 * CLAUDE_CONFIG_DIR that terminal was launched with. The Instatic grant lives
 * in `~/.claude-team/.credentials.json` under `mcpOAuth["instatic-dr-nahlah|…"]`,
 * so a session on the PERSONAL profile cannot see the server at all — it is
 * absent from `.mcp.json` and from every per-profile `.claude.json`, which reads
 * as "the MCP is not connected" rather than "you are on the wrong profile".
 *
 * Re-authenticating on the personal profile is the wrong fix (same reasoning as
 * `07-webflow-build/.tmp/consolidate/wfmcp.mjs`, which this is modelled on):
 * re-auth replaces the grant wholesale. This reads the existing team-profile
 * grant and speaks MCP directly. Same grant, same scope, same site.
 *
 *   node instatic-mcp.mjs list                 # tool names
 *   node instatic-mcp.mjs list --full          # full JSON schemas
 *   node instatic-mcp.mjs call <tool> '<jsonArgs>'
 *   node instatic-mcp.mjs call <tool> --file args.json
 *
 * The stored access token is normally expired; the refresh_token grant is used
 * to mint a new one and the credential file is rewritten in place. The token
 * endpoint is NOT in the stored discoveryState (only authorizationServerUrl is),
 * so it is discovered from the authorization server's metadata document.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const SERVER = process.env.INSTATIC_SERVER || 'instatic-dr-nahlah';
// Search every profile, not one. The grant moves around: the original lived on
// the TEAM profile against the railway.app host and is now dead, and re-authorizing
// through `/mcp` wrote a NEW one to whichever profile that session was running
// (personal), against the encorercm.com host. Both keys are `instatic-dr-nahlah|<hash>`
// and both are still present, so matching on the name alone picks the stub half
// the time. Pick the entry that actually carries tokens, newest first.
const PROFILES = process.env.INSTATIC_CREDS
  ? [process.env.INSTATIC_CREDS]
  : ['.claude-personal', '.claude', '.claude-team'].map((d) =>
      path.join(os.homedir(), d, '.credentials.json'));

function readCreds() {
  const found = [];
  for (const file of PROFILES) {
    let all;
    try { all = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { continue; }
    for (const [k, entry] of Object.entries(all.mcpOAuth || {})) {
      if (k.split('|')[0] !== SERVER) continue;
      if (!entry.accessToken || !entry.refreshToken) continue;   // stub entry
      found.push({ file, all, entry, expiresAt: entry.expiresAt || 0 });
    }
  }
  if (!found.length) throw new Error(`no usable grant for ${SERVER} in: ${PROFILES.join(', ')}`);
  found.sort((a, b) => b.expiresAt - a.expiresAt);
  return found[0];
}

const CHOSEN = readCreds();
const URL_MCP = CHOSEN.entry.serverUrl;
process.stderr.write(`[instatic-mcp] ${URL_MCP} via ${CHOSEN.file}
`);

/** The token endpoint is not stored with the grant; fetch it from the AS metadata. */
let tokenEndpoint = null;
async function discoverTokenEndpoint(entry) {
  if (tokenEndpoint) return tokenEndpoint;
  const as = entry.discoveryState?.authorizationServerUrl;
  if (!as) throw new Error('no authorizationServerUrl in stored discoveryState');
  const r = await fetch(new URL('/.well-known/oauth-authorization-server', as));
  if (!r.ok) throw new Error(`AS metadata ${r.status} at ${as}`);
  const meta = await r.json();
  if (!meta.token_endpoint) throw new Error('AS metadata has no token_endpoint');
  tokenEndpoint = meta.token_endpoint;
  return tokenEndpoint;
}

async function accessToken() {
  const { all, entry, file } = readCreds();
  if (entry.expiresAt && Date.now() < entry.expiresAt - 60_000) return entry.accessToken;
  if (!entry.refreshToken) throw new Error('access token expired and no refresh token present');
  const url = await discoverTokenEndpoint(entry);
  // Public client: token_endpoint_auth_methods_supported is ["none"], so the
  // client_id goes in the body and there is no client secret to present.
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: entry.refreshToken,
      client_id: entry.clientId,
      // RFC 8707. Without it Instatic answers `invalid_request: The token request
      // is invalid`, which looks like a malformed body; with the wrong value it
      // answers `invalid_target`. It must be this server's own endpoint URL.
      resource: entry.serverUrl,
    }),
  });
  const txt = await r.text();
  if (!r.ok) throw new Error(`token refresh failed ${r.status}: ${txt.slice(0, 400)}`);
  const t = JSON.parse(txt);
  entry.accessToken = t.access_token;
  if (t.refresh_token) entry.refreshToken = t.refresh_token;
  if (t.expires_in) entry.expiresAt = Date.now() + t.expires_in * 1000;
  fs.writeFileSync(file, JSON.stringify(all, null, 2));
  process.stderr.write('[instatic-mcp] refreshed the access token\n');
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

/** Handshake once per process; re-initializing while holding a session id is rejected. */
let session = null;
async function ensureSession() {
  if (session) return session;
  session = (async () => {
    const token = await accessToken();
    await rpc(token, 'initialize', {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'instatic-mcp-direct', version: '1.0.0' },
    });
    await rpc(token, 'notifications/initialized', {}, { notify: true });
    return token;
  })();
  return session;
}

/**
 * The token is re-read (and refreshed if near expiry) on EVERY call rather than
 * once per process: a 28-page push outlives the access token, and a stale
 * bearer cached at handshake turns the tail of the run into 401s. The MCP
 * session id survives a token refresh; only the bearer needs renewing.
 */
export async function callTool(name, args) {
  await ensureSession();
  const token = await accessToken();
  const res = await rpc(token, 'tools/call', { name, arguments: args });
  const text = (res.content ?? []).filter((c) => c.type === 'text').map((c) => c.text).join('\n');
  return { text, raw: res };
}

/**
 * The Site-editor tools are served through a browser bridge, and the bridge
 * flaps. A call can come back with the plain-text line
 *   "This tool runs in the Instatic Site editor. Open the Site editor in a
 *    browser (signed in as the connector owner) and try again."
 * while the editor is demonstrably open and `get_context` reports
 * `siteConnected: true` — the very next identical call succeeds. Treating that
 * as a hard failure aborts a long push a few writes in, and worse, it is
 * indistinguishable from a genuinely closed editor unless you retry.
 *
 * Returns the parsed JSON payload, so callers do not each re-implement it.
 */
/**
 * Transient bridge failures, worth retrying. Both arrive as a 200 with a plain
 * sentence, indistinguishable from a real refusal except by their text.
 *
 * "AI chat stream ended before tool result arrived" is the proxy dropping the
 * response, not the server rejecting the call. Retrying a WRITE after it is
 * safe HERE because every write this driver makes is either idempotent or
 * guarded by `expectedHash`: if the dropped call actually landed, the hash has
 * moved and the retry fails loudly instead of applying twice.
 */
const BRIDGE_DOWN = /runs in the Instatic (Site editor|Content workspace)|AI chat stream ended before tool result/i;
export async function callJson(name, args, { tries = 6, waitMs = 1500 } = {}) {
  let last;
  for (let i = 0; i < tries; i++) {
    let text;
    try {
      ({ text } = await callTool(name, args));
    } catch (e) {
      last = e; await new Promise((r) => setTimeout(r, waitMs * (i + 1))); continue;
    }
    if (BRIDGE_DOWN.test(text)) {
      last = new Error('site editor bridge not ready');
      await new Promise((r) => setTimeout(r, waitMs * (i + 1)));
      continue;
    }
    try { return JSON.parse(text); } catch { return { text }; }
  }
  throw last || new Error(`${name}: exhausted retries`);
}

/**
 * Like callJson, but for WRITE tools, where a non-JSON response is always a
 * failure and never prose worth keeping.
 *
 * These tools report refusals as a plain sentence with a 200 and no error flag:
 *   "Replacement for src/styles/site.css is ambiguous: 2 matches. Use a larger
 *    oldText span or set replaceAll:true."
 * `callJson` hands that back as `{ text }`, which reads exactly like success to
 * a caller that only checks for a thrown error. That is how a stylesheet ended
 * up on the server twice on 2026-08-19: 40 clearing patches in a row were all
 * refused, all "succeeded", and the loop ran to its attempt limit.
 *
 * A successful write always returns JSON (`{ok:true}` or the asset record), so
 * "did not parse as JSON" is a sound failure test.
 */
export async function callWrite(name, args, opts) {
  const res = await callJson(name, args, opts);
  if (res && typeof res.text === 'string') {
    throw new Error(`${name} refused: ${res.text.slice(0, 300)}`);
  }
  return res;
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
    else console.log(tools.map((t) => `${t.name}  ${(t.description || '').slice(0, 90)}`).join('\n'));
  } else if (cmd === 'call') {
    let args = {};
    if (rest[1] === '--file') args = JSON.parse(fs.readFileSync(rest[2], 'utf8'));
    else if (rest[1]) args = JSON.parse(rest[1]);
    const { text, raw } = await callTool(rest[0], args);
    console.log(text || JSON.stringify(raw.structuredContent ?? raw, null, 2));
    if (raw.isError) process.exitCode = 1;
  } else {
    console.error('usage: instatic-mcp.mjs list [--full] | call <tool> <json|--file f>');
    process.exitCode = 2;
  }
}
