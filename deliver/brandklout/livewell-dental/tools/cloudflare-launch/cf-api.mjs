#!/usr/bin/env node
/**
 * Cloudflare REST client shared by every script in tools/cloudflare-launch and
 * scenario-1-migration step scripts.
 *
 * Origin: bk-dr-nahlah deliver/process/tools/cloudflare-launch/cf-api.mjs (2026-08-25),
 * generalized 2026-09-23 with the token rules learned on IFA, Stone, Mason Park and
 * brandklout.ai.
 *
 * Token order: CLOUDFLARE_API_TOKEN (a minted, zone-scoped, short-lived token, set in
 * the shell for one session) then CLOUDFLAREAPI (the shared account-owned token from
 * the generated .env). The shared token has NO zone permissions: DNS, zone settings,
 * redirect rules and routes need a minted token (see mint-token.mjs).
 * The token is never printed, logged or written to a file.
 *
 *   node cf-api.mjs whoami     # verify the token the right way + list account and zones
 *   node cf-api.mjs zones
 */
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))

/** Walk up from the cwd, then from this file, and load the first .env found (never overriding the shell). */
function loadEnv() {
  for (const start of [process.cwd(), HERE]) {
    let dir = start
    for (let i = 0; i < 10; i++) {
      const candidate = join(dir, '.env')
      if (existsSync(candidate)) {
        for (const line of readFileSync(candidate, 'utf8').split(/\r?\n/)) {
          const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
          if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
        }
        return
      }
      const up = dirname(dir)
      if (up === dir) break
      dir = up
    }
  }
}
loadEnv()

export const BASE = 'https://api.cloudflare.com/client/v4'

export function token() {
  const t = process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLAREAPI
  if (!t) {
    console.error('no Cloudflare token: set CLOUDFLARE_API_TOKEN (minted, scoped) or CLOUDFLAREAPI (shared, generated .env)')
    process.exit(2)
  }
  return t
}

/**
 * Cloudflare wraps every answer in { success, errors, result }. A 200 with success:false
 * is a normal failure, so the status alone is not the check. err.code carries the first
 * Cloudflare error code (10000 = auth/scope, 10003/10404 = no entrypoint yet).
 */
export async function cf(method, path, body, { tokenOverride, retries = 0 } = {}) {
  const headers = { authorization: `Bearer ${tokenOverride || token()}` }
  let payload
  if (body instanceof FormData) payload = body
  else if (body !== undefined) { headers['content-type'] = 'application/json'; payload = JSON.stringify(body) }
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(BASE + path, { method, headers, body: payload })
    const text = await res.text()
    let json
    try { json = JSON.parse(text) } catch { json = { success: res.ok, raw: text } }
    if (res.ok && json.success !== false) return json.result ?? json
    const code = json.errors?.[0]?.code
    /* A freshly minted token answers 10000 for a few seconds. Retry, do not re-scope. */
    if (code === 10000 && attempt < retries) { await new Promise((r) => setTimeout(r, 5000)); continue }
    const hint = res.status === 403 && path.startsWith('/zones/')
      ? (process.env.CLOUDFLARE_API_TOKEN ? ' (the minted token lacks this permission; add it to the preset)' : ' (the shared CLOUDFLAREAPI has no zone rights: mint one with mint-token.mjs and export CLOUDFLARE_API_TOKEN)')
      : ''
    const err = new Error(`${method} ${path} -> ${res.status}: ${(json.errors ?? []).map((e) => `${e.code ?? ''} ${e.message}`.trim()).join(' | ') || text.slice(0, 300)}${hint}`)
    err.code = code
    err.status = res.status
    throw err
  }
}

export async function accountId() {
  if (process.env.CLOUDFLARE_ACCOUNT_ID) return process.env.CLOUDFLARE_ACCOUNT_ID
  const accounts = await cf('GET', '/accounts')
  if (accounts.length !== 1) console.error(`note: ${accounts.length} accounts visible, using ${accounts[0].name}`)
  return accounts[0].id
}

/** Resolve a zone by EXACT name, so a typo can never land on another client's zone. */
export async function zoneFor(name) {
  const zones = await cf('GET', `/zones?name=${encodeURIComponent(name)}`)
  const zone = zones.find((z) => z.name === name)
  if (!zone) throw new Error(`no zone named ${name} is visible to this token`)
  return zone
}

/** Read a ruleset phase entrypoint; null when the zone has none yet. */
export async function entrypoint(zoneId, phase) {
  try { return await cf('GET', `/zones/${zoneId}/rulesets/phases/${phase}/entrypoint`) }
  catch (e) { if ([10003, 10404].includes(e.code) || e.status === 404) return null; throw e }
}

/** Fields the API returns on a rule but refuses on a PUT. */
export const stripRule = ({ id, version, last_updated, ref, ...keep }) => keep

export function arg(name, fallback = undefined) {
  const i = process.argv.indexOf(`--${name}`)
  return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : fallback
}
export const flag = (name) => process.argv.includes(`--${name}`)

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const cmd = process.argv[2] ?? 'whoami'
  if (cmd === 'whoami') {
    /* Account-owned tokens answer "Invalid API Token" on /user/tokens/verify while being
       valid. Verify against the account endpoint, never the user one. */
    const accounts = await cf('GET', '/accounts')
    for (const a of accounts) {
      try {
        const v = await cf('GET', `/accounts/${a.id}/tokens/verify`)
        console.log('token:', v.status, '| expires:', v.expires_on ?? '(none)')
      } catch {
        console.log('token: account verify endpoint refused; a real read worked, so the token is valid')
      }
      console.log('account:', a.name, a.id)
    }
    const zones = await cf('GET', '/zones?per_page=50')
    for (const z of zones) console.log('zone:', z.name, z.id, '| status:', z.status, '| plan:', z.plan?.name)
  } else if (cmd === 'zones') {
    console.log(JSON.stringify(await cf('GET', '/zones?per_page=50'), null, 1))
  } else {
    console.error('usage: node cf-api.mjs whoami|zones')
    process.exit(2)
  }
}
