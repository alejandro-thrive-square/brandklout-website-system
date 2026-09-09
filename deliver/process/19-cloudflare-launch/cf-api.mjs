#!/usr/bin/env node
/**
 * Cloudflare admin REST client for the drnahlah.com launch artefacts.
 *
 * The token comes from `CLOUDFLARE_API_TOKEN` in the repo-root `.env` (walked
 * up from here, same as `insta-api.mjs` does for Instatic). It is NEVER passed
 * on a command line, echoed, or written to a log — every helper here takes it
 * from the environment and nothing prints it.
 *
 *   node cf-api.mjs whoami      # verify the token + resolve account/zone ids
 *   node cf-api.mjs zones
 */
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))

function loadEnv() {
  let dir = HERE
  for (let i = 0; i < 8; i++) {
    const candidate = join(dir, '.env')
    if (existsSync(candidate)) {
      for (const line of readFileSync(candidate, 'utf8').split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
      }
      return
    }
    dir = dirname(dir)
  }
}
loadEnv()

/* `CLOUDFLAREAPI` is the name the token was actually saved under in this
   repo's .env; `CLOUDFLARE_API_TOKEN` is the conventional one. Accept both so
   neither the file nor this script has to be edited to match the other. */
const TOKEN = process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLAREAPI
if (!TOKEN) {
  console.error('no Cloudflare token — set CLOUDFLARE_API_TOKEN (or CLOUDFLAREAPI) in the repo-root .env')
  process.exit(2)
}
export const BASE = 'https://api.cloudflare.com/client/v4'

/**
 * Cloudflare wraps every response in `{ success, errors, messages, result }`.
 * A 200 with `success: false` is the normal failure shape, so status alone is
 * not the check.
 */
export async function cf(method, path, body, extra = {}) {
  const headers = { Authorization: `Bearer ${TOKEN}` }
  let payload
  if (body instanceof FormData || typeof body === 'string' && extra.raw) {
    payload = body
    if (extra.contentType) headers['content-type'] = extra.contentType
  } else if (body !== undefined) {
    headers['content-type'] = 'application/json'
    payload = JSON.stringify(body)
  }
  const res = await fetch(BASE + path, { method, headers, body: payload })
  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { json = { success: res.ok, raw: text } }
  if (!res.ok || json.success === false) {
    const errs = (json.errors ?? []).map((e) => `${e.code}: ${e.message}`).join(' | ') || text.slice(0, 300)
    throw new Error(`${method} ${path} -> ${res.status}: ${errs}`)
  }
  return json.result ?? json
}

export async function accountId() {
  const accounts = await cf('GET', '/accounts')
  if (accounts.length !== 1) console.error(`note: ${accounts.length} accounts visible`)
  return accounts[0].id
}

export async function zoneFor(name) {
  const zones = await cf('GET', `/zones?name=${encodeURIComponent(name)}`)
  if (!zones.length) throw new Error(`no zone named ${name} is visible to this token`)
  return zones[0]
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const cmd = process.argv[2] ?? 'whoami'
  if (cmd === 'whoami') {
    /* This is an ACCOUNT-owned token (Manage account -> Account API tokens),
       not a user token, so `/user/tokens/verify` 401s on it even though the
       token is perfectly valid. Verify against the account-scoped endpoint and
       fall back to simply exercising a real read. */
    const accounts = await cf('GET', '/accounts')
    for (const a of accounts) {
      try {
        const v = await cf('GET', `/accounts/${a.id}/tokens/verify`)
        console.log('token:', v.status, '| id:', v.id, '| expires:', v.expires_on ?? '(none)')
      } catch {
        console.log('token: valid (account-owned; verify endpoint not exposed)')
      }
    }
    for (const a of accounts) console.log('account:', a.name, a.id)
    const zones = await cf('GET', '/zones')
    for (const z of zones) console.log('zone:', z.name, z.id, '| status:', z.status, '| plan:', z.plan?.name)
  } else if (cmd === 'zones') {
    console.log(JSON.stringify(await cf('GET', '/zones'), null, 1))
  }
}
