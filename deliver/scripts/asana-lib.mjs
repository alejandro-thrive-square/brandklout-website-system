/**
 * Shared Asana helpers for the Brandklout partnership.
 *
 * Auth: OAuth authorization-code grant against the pre-registered Webzite app.
 * Tokens live OUTSIDE this repository (see TOKEN_PATH) and refresh
 * automatically; access tokens expire hourly, refresh tokens are long-lived.
 *
 * IMPORTANT — this app is an Asana **MCP app**, not an API app. Its tokens are
 * rejected by the REST API (`/api/1.0/...` returns 400 "This endpoint requires
 * an API app") and work only against the MCP server. That is deliberate on
 * Asana's part: it limits the blast radius of a leaked MCP token. So all data
 * access below goes through MCP JSON-RPC tool calls, not REST.
 *
 * Why the client secret travels in the form body: Asana advertises both
 * client_secret_post and client_secret_basic, but only client_secret_post is
 * verified working for this app (2026-08-05). Do not "improve" this to a Basic
 * header without re-testing — Basic is the prime suspect in Claude Code's own
 * failure to authenticate this same app.
 */
import { homedir } from 'node:os'
import { join } from 'node:path'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

export const CLIENT_ID = '1217205892702386'
export const TOKEN_URL = 'https://app.asana.com/-/oauth_token'
export const AUTH_URL = 'https://app.asana.com/-/oauth_authorize'
export const MCP_URL = 'https://mcp.asana.com/v2/mcp'

/** Deliberately outside the repo — holds a refresh token and the client secret. */
export const TOKEN_DIR = join(homedir(), '.brandklout')
export const TOKEN_PATH = join(TOKEN_DIR, 'asana-brandklout.json')

export async function loadTokens() {
  try {
    return JSON.parse(await readFile(TOKEN_PATH, 'utf8'))
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(
        `No Asana credentials at ${TOKEN_PATH}.\n` +
          `Run: node deliver/scripts/asana-auth.mjs`
      )
    }
    throw err
  }
}

export async function saveTokens(t) {
  await mkdir(TOKEN_DIR, { recursive: true })
  await writeFile(TOKEN_PATH, JSON.stringify(t, null, 2), 'utf8')
}

/** Exchange a refresh token for a new access token. Returns the updated store. */
export async function refresh(store) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: store.clientId ?? CLIENT_ID,
      client_secret: store.clientSecret,
      refresh_token: store.refreshToken,
    }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || !json.access_token) {
    throw new Error(
      `Token refresh failed (${res.status}): ${json.error_description ?? JSON.stringify(json)}\n` +
        `Re-run asana-auth.mjs if the grant was revoked.`
    )
  }
  const updated = {
    ...store,
    accessToken: json.access_token,
    // Asana may rotate the refresh token; keep the old one if it doesn't.
    refreshToken: json.refresh_token ?? store.refreshToken,
    expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
  }
  await saveTokens(updated)
  return updated
}

/** Load tokens, refreshing when within 5 minutes of expiry. */
export async function getAccessToken() {
  let store = await loadTokens()
  if (!store.expiresAt || store.expiresAt - Date.now() < 5 * 60 * 1000) {
    store = await refresh(store)
  }
  return { token: store.accessToken, store }
}

/** The MCP server replies as SSE frames even for single responses. */
function parseSSE(text) {
  const out = []
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith('data: ')) {
      try {
        out.push(JSON.parse(line.slice(6)))
      } catch {
        /* keep-alive or partial frame */
      }
    }
  }
  return out
}

let rpcId = 0

async function rpc(method, params, token) {
  const res = await fetch(MCP_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: ++rpcId, method, params }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`MCP ${method} failed (${res.status}): ${text.slice(0, 300)}`)
  const msg = parseSSE(text).find((m) => m.result || m.error)
  if (!msg) throw new Error(`MCP ${method}: no parseable response`)
  if (msg.error) throw new Error(`MCP ${method} error: ${msg.error.message ?? JSON.stringify(msg.error)}`)
  return msg.result
}

export async function listTools(tokenOverride) {
  const token = tokenOverride ?? (await getAccessToken()).token
  return (await rpc('tools/list', {}, token)).tools ?? []
}

/**
 * Call an Asana MCP tool and return its parsed JSON payload.
 *
 * Tools reply with a text block containing JSON. `isError` is surfaced as a
 * thrown error rather than returned quietly, so a failed call can never be
 * mistaken for an empty result.
 */
export async function callTool(name, args = {}, tokenOverride) {
  const token = tokenOverride ?? (await getAccessToken()).token
  const result = await rpc('tools/call', { name, arguments: args }, token)
  const text = (result.content ?? [])
    .filter((c) => c.type === 'text')
    .map((c) => c.text)
    .join('\n')
  if (result.isError) throw new Error(`Asana tool ${name} returned an error: ${text.slice(0, 400)}`)
  if (!text.trim()) return null
  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}

/**
 * Page through a list-style tool until exhausted.
 *
 * Pagination matters: a truncated task list is indistinguishable from a
 * complete one, and silently-partial work lists are the failure mode that would
 * make delegation untrustworthy. Never swap this for a single call.
 */
export async function callToolPaged(name, args = {}, tokenOverride) {
  const token = tokenOverride ?? (await getAccessToken()).token
  const out = []
  let offset
  for (let guard = 0; guard < 200; guard++) {
    const page = await callTool(name, { limit: 100, ...args, ...(offset ? { offset } : {}) }, token)
    const rows = page?.data ?? []
    out.push(...(Array.isArray(rows) ? rows : [rows]))
    offset = page?.next_page?.offset
    if (!offset) return out
  }
  throw new Error(`Pagination guard tripped on ${name}`)
}
