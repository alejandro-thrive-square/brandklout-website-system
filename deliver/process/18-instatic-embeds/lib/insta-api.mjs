#!/usr/bin/env node
/**
 * Instatic admin REST client — headless, no Site-editor tab required.
 *
 * The MCP connector proxies every `site_*` tool through the in-editor AI chat
 * stream, which is why 29 of its 52 tools declare "requires the Instatic Site
 * editor to be open in a browser" and why the bridge flaps. The admin API
 * underneath has no such dependency: it is a plain cookie-authenticated REST
 * surface served by `server/handlers/cms/`.
 *
 *   GET  /admin/api/cms/site           -> { site, seq }   the draft SiteShell
 *   GET  /admin/api/cms/pages          -> pages
 *   PUT  /admin/api/cms/site-document  -> { ok, seq }     atomic shell+pages save
 *   POST /admin/api/cms/publish        -> publish result
 *   GET  /admin/api/cms/publish/status -> draft publish status
 *
 * Two things bite if you get them wrong:
 *
 * 1. CSRF. Every state-changing request is checked against PUBLIC_ORIGIN
 *    (`server/auth/security.ts`). A missing or foreign `Origin` header is a
 *    403 "invalid origin", which reads like a permissions problem and is not.
 *    We always send the canonical origin.
 *
 * 2. Conflict detection. `PUT /site-document` takes `shellBaseSeq` — the seq
 *    you read the shell at. If someone edited in the browser since, the save
 *    409s rather than clobbering them. Never invent a seq; always carry
 *    through the one that came back from the read.
 *
 * Credentials come from the environment, never from source:
 *   INSTATIC_BASE_URL   (default https://encorercm.com)
 *   INSTATIC_EMAIL
 *   INSTATIC_PASSWORD
 *
 * The session cookie is cached per host in `.tmp/.session-<host>` so repeated runs do not
 * re-hit the login rate limiter (5 failures locks the account).
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const TMP = join(HERE, '.tmp')
const COOKIE_NAME = 'instatic_admin_session'


function loadEnv() {
  // Repo-root .env, walked up from here. Keeps secrets out of the workflow folder.
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
    const up = dirname(dir)
    if (up === dir) return
    dir = up
  }
}
loadEnv()

/* Declared AFTER loadEnv(): this is evaluated at module load, and above the
   call the repo-root .env has not been read yet — the guard would then fire
   on a correctly configured site. The client copy could sit higher up only
   because it carried a hardcoded default. */
/**
 * The site this run targets. There is deliberately NO default: the client copy
 * of this file defaults to the site it was written for, and a shared installer
 * that quietly inherited that default would publish one client's plugin to
 * another client's site. Set INSTATIC_BASE_URL in the repo-root .env.
 */
export const BASE = (() => {
  const raw = (process.env.INSTATIC_BASE_URL || '').trim()
  if (!raw) {
    throw new Error(
      'INSTATIC_BASE_URL is not set. Add it to the repo-root .env, for example ' +
      'INSTATIC_BASE_URL=https://client-site.com — the shared toolkit refuses to ' +
      'guess which site it is talking to.',
    )
  }
  return raw.replace(/\/+$/, '')
})()

/* Keyed BY HOST (2026-09-25). One bare `.session` sent staging's cookie to
   production, which answers a plain 401 that nothing here retries. */
const SESSION_FILE = join(TMP, '.session-' + BASE.replace(/^https?:\/\//, '').replace(/[^a-z0-9.-]/gi, '_'))

let cookie = null

function cacheCookie(value) {
  cookie = value
  mkdirSync(TMP, { recursive: true })
  writeFileSync(SESSION_FILE, value, 'utf8')
}

function cachedCookie() {
  if (cookie) return cookie
  if (existsSync(SESSION_FILE)) cookie = readFileSync(SESSION_FILE, 'utf8').trim()
  return cookie
}

/**
 * Log in and cache the session cookie.
 *
 * `mfaRequired: true` in the response means the account has a second factor
 * and this pipeline cannot complete the login on its own — surfaced as a hard
 * error rather than a silent half-authenticated state.
 */
export async function login() {
  const email = process.env.INSTATIC_EMAIL
  const password = process.env.INSTATIC_PASSWORD
  if (!email || !password) {
    throw new Error('INSTATIC_EMAIL / INSTATIC_PASSWORD are not set (repo-root .env)')
  }
  const res = await fetch(`${BASE}/admin/api/cms/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: BASE },
    body: JSON.stringify({ email, password }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`login failed ${res.status}: ${JSON.stringify(body)}`)
  if (body.mfaRequired) throw new Error('login needs a second factor; this account cannot drive the pipeline')

  const setCookie = res.headers.getSetCookie?.() ?? [res.headers.get('set-cookie')].filter(Boolean)
  const found = setCookie.map((c) => c.split(';')[0]).find((c) => c.startsWith(`${COOKIE_NAME}=`))
  if (!found) throw new Error('login succeeded but returned no session cookie')
  cacheCookie(found)
  return found
}

/**
 * Open a step-up window. Sensitive operations — publishing among them — answer
 * `401 {"error":"step_up_required"}` until the password has been re-entered
 * within `stepUpWindowMinutes`.
 *
 * This ROTATES the session token (`rotateSessionToken` in the handler), so the
 * response's cookie replaces the cached one. Miss that and every subsequent
 * request 401s with a cookie that no longer exists.
 */
export async function stepUp() {
  const password = process.env.INSTATIC_PASSWORD
  if (!password) throw new Error('INSTATIC_PASSWORD is not set — cannot open a step-up window')
  const res = await fetch(`${BASE}/admin/api/cms/auth/step-up`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: BASE, cookie: cachedCookie() ?? '' },
    body: JSON.stringify({ password }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`step-up failed ${res.status}: ${JSON.stringify(body)}`)

  const setCookie = res.headers.getSetCookie?.() ?? [res.headers.get('set-cookie')].filter(Boolean)
  const rotated = setCookie.map((c) => c.split(';')[0]).find((c) => c.startsWith(`${COOKIE_NAME}=`))
  if (!rotated) throw new Error('step-up succeeded but returned no rotated session cookie')
  cacheCookie(rotated)
  return body.stepUpExpiresAt
}

/**
 * One authenticated request, with a single transparent re-login when the
 * cached cookie has gone stale (idle timeout is 30 days, but "log out all
 * sessions" or a container restart can invalidate it sooner), and a single
 * transparent step-up when the operation demands a fresh password.
 */
async function request(method, path, body, { retryAuth = true, retryStepUp = true } = {}) {
  const headers = { origin: BASE, cookie: cachedCookie() ?? '' }
  if (body !== undefined) headers['content-type'] = 'application/json'
  if (!headers.cookie) {
    await login()
    headers.cookie = cachedCookie()
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const text = await res.text()

  if (res.status === 401 && text.includes('step_up_required') && retryStepUp) {
    await stepUp()
    return request(method, path, body, { retryAuth, retryStepUp: false })
  }
  if (res.status === 401 && retryAuth) {
    await login()
    return request(method, path, body, { retryAuth: false, retryStepUp })
  }

  let parsed
  try {
    parsed = text ? JSON.parse(text) : null
  } catch {
    // A non-JSON body from an API route means we were served the admin SPA
    // shell or an error page — treat it as a failure, never as data.
    throw new Error(`${method} ${path} -> ${res.status}, non-JSON body: ${text.slice(0, 200)}`)
  }
  if (!res.ok) {
    const err = new Error(`${method} ${path} -> ${res.status}: ${JSON.stringify(parsed).slice(0, 400)}`)
    err.status = res.status
    err.payload = parsed
    throw err
  }
  return parsed
}

/** Escape hatch for endpoints without a named helper (fonts, media, plugins). */
export async function api(method, path, body) {
  return request(method, path, body)
}

/**
 * Multipart POST, for the endpoints that take a file rather than JSON — today
 * only plugin package install (`/admin/api/cms/plugins/package`).
 *
 * Kept beside `request` so the cookie, the mandatory `Origin` and the
 * step-up dance stay in ONE place; the only difference is that `FormData` sets
 * its own `content-type` (with the multipart boundary), so we must not.
 */
export async function requestForm(path, form, { retryStepUp = true } = {}) {
  let cookie = cachedCookie()
  if (!cookie) { await login(); cookie = cachedCookie() }
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { origin: BASE, cookie },
    body: form,
  })
  const text = await res.text()
  if (res.status === 401 && text.includes('step_up_required') && retryStepUp) {
    await stepUp()
    return requestForm(path, form, { retryStepUp: false })
  }
  let parsed
  try { parsed = text ? JSON.parse(text) : null } catch {
    throw new Error(`POST ${path} -> ${res.status}, non-JSON body: ${text.slice(0, 200)}`)
  }
  if (!res.ok) {
    const err = new Error(`POST ${path} -> ${res.status}: ${JSON.stringify(parsed).slice(0, 600)}`)
    err.status = res.status
    err.payload = parsed
    throw err
  }
  return parsed
}

/** The draft shell plus the seq to quote back on save. */
export async function getSite() {
  return request('GET', '/admin/api/cms/site')
}

export async function getPages() {
  return request('GET', '/admin/api/cms/pages')
}

/**
 * Shell-only save. `styleRules` and `files` both live on the shell, so every
 * CSS operation in this workflow is one of these.
 *
 * Pages are shipped empty deliberately: `mode: 'incremental'` treats an
 * unmentioned row as untouched, so this cannot disturb page content edited in
 * the browser while we work.
 */
export async function saveShell(shell, shellBaseSeq) {
  return request('PUT', '/admin/api/cms/site-document', {
    mode: 'incremental',
    site: shell,
    changedPages: [],
    deletedPageIds: [],
    changedComponents: [],
    deletedComponentIds: [],
    changedLayouts: [],
    deletedLayoutIds: [],
    baseSeqs: {},
    shellBaseSeq,
  })
}

export async function publish() {
  return request('POST', '/admin/api/cms/publish', {})
}

export async function publishStatus() {
  return request('GET', '/admin/api/cms/publish/status')
}

/** Read one stylesheet's content out of a shell. */
export function styleFile(shell, path) {
  return (shell.files ?? []).find((f) => f.type === 'style' && f.path === path) ?? null
}

// ── CLI ────────────────────────────────────────────────────────────────────
// node insta-api.mjs whoami | site | pages | status | publish
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const cmd = process.argv[2] ?? 'whoami'
  const run = {
    whoami: () => request('GET', '/admin/api/cms/me'),
    site: async () => {
      const { site, seq } = await getSite()
      return {
        seq,
        name: site.settings?.name ?? site.name,
        styleRules: Object.keys(site.styleRules ?? {}).length,
        styleFiles: (site.files ?? []).filter((f) => f.type === 'style').map((f) => `${f.path} (${(f.content ?? '').length}c)`),
      }
    },
    pages: async () => (await getPages()).pages?.map((p) => p.slug) ?? [],
    status: publishStatus,
    publish,
  }[cmd]
  if (!run) {
    console.error(`unknown command: ${cmd}`)
    process.exit(2)
  }
  run()
    .then((r) => console.log(JSON.stringify(r, null, 2)))
    .catch((e) => {
      console.error(e.message)
      process.exit(1)
    })
}
