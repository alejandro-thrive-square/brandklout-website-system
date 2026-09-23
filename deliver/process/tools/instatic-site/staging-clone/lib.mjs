/**
 * Shared auth for the staging-clone scripts.
 *
 * Every script here talks to TWO Instatic instances in one process, so it
 * cannot use `tools/instatic-embeds/lib/insta-api.mjs` — that module fixes its
 * BASE from `INSTATIC_BASE_URL` at import time, by design, so one client's
 * toolkit can never be pointed at another client's site by accident. Cloning
 * is the one workflow that legitimately needs both ends at once, so it carries
 * its own thin session helper instead of widening that guard.
 *
 * Credentials come from the repo-root `.env` (INSTATIC_EMAIL / INSTATIC_PASSWORD).
 * Source and target are passed explicitly — there is deliberately no default,
 * because the failure mode of guessing is writing one site's content over another.
 */
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const COOKIE_NAME = 'instatic_admin_session'

export function loadEnv() {
  let dir = dirname(fileURLToPath(import.meta.url))
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
  throw new Error('no repo-root .env found — INSTATIC_EMAIL / INSTATIC_PASSWORD are required')
}
loadEnv()

const creds = () => ({
  email: process.env.INSTATIC_EMAIL,
  password: process.env.INSTATIC_PASSWORD,
})

/** Log in and return the session cookie for `base`. */
export async function login(base) {
  const r = await fetch(base + '/admin/api/cms/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(creds()),
  })
  const body = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(`${base} login ${r.status}: ${JSON.stringify(body).slice(0, 200)}`)
  if (body.mfaRequired) throw new Error(`${base} requires MFA — this pipeline cannot complete the login`)
  const cookie = (r.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0]).find((c) => c.startsWith(`${COOKIE_NAME}=`))
  if (!cookie) throw new Error(`${base} returned no session cookie`)
  return cookie
}

/**
 * Open a step-up window and return the ROTATED cookie.
 *
 * import, publish and plugin install are all step-up gated: a session cookie
 * alone is not enough, the password must have been re-entered within 15 min.
 * Step-up rotates the cookie, so the caller MUST use the returned value.
 */
export async function stepUp(base, cookie) {
  const r = await fetch(base + '/admin/api/cms/auth/step-up', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: base, cookie },
    body: JSON.stringify({ password: creds().password }),
  })
  if (!r.ok) throw new Error(`${base} step-up ${r.status}: ${(await r.text()).slice(0, 200)}`)
  const rotated = (r.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0]).find((c) => c.startsWith(`${COOKIE_NAME}=`))
  return rotated ?? cookie
}

/** Logged in AND step-up'd — what every write path here needs. */
export async function session(base, { elevate = true } = {}) {
  const cookie = await login(base)
  return elevate ? stepUp(base, cookie) : cookie
}

/** One authenticated JSON call. `origin` is always set: the admin gate requires it. */
export async function api(base, cookie, method, path, body) {
  const headers = { cookie, origin: base }
  if (body !== undefined) headers['content-type'] = 'application/json'
  const r = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  const text = await r.text()
  let parsed
  try { parsed = JSON.parse(text) } catch { parsed = text }
  if (!r.ok) {
    const err = new Error(`${method} ${path} -> ${r.status}: ${String(text).slice(0, 240)}`)
    err.status = r.status
    err.payload = parsed
    throw err
  }
  return parsed
}

export const mb = (n) => (n / 1048576).toFixed(2) + ' MB'
