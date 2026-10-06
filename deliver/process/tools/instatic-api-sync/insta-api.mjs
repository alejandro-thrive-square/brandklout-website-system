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
 *   INSTATIC_BASE_URL   (required; there is no default host)
 *   INSTATIC_EMAIL
 *   INSTATIC_PASSWORD
 *
 * The session cookie is cached in `output/.session` so repeated runs do not
 * re-hit the login rate limiter (5 failures locks the account).
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
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

// MUST run before BASE is evaluated. This used to sit BELOW the BASE
// declaration, which meant `INSTATIC_BASE_URL` in .env was read into the
// environment a moment too late and BASE always fell back to the default.
// It went unnoticed for as long as the only instance WAS the default: the
// first run against a second client (Stone, 2026-08-31) posted the login to
// encorercm.com and came back with Railway's "Application not found".
loadEnv()

/* MUST come after loadEnv(). This used to sit above it, which meant the repo-root
   .env could set INSTATIC_EMAIL and INSTATIC_PASSWORD but NOT INSTATIC_BASE_URL --
   BASE had already been frozen to the default by the time the file was read, so
   every script silently talked to the default host no matter what .env said. That
   surfaced on 2026-08-29 as `login failed 403` against a domain whose login was
   verified working by hand seconds earlier, and again on 2026-08-31 as Railway's
   "Application not found" on the first run against a second client.

   THERE IS NO DEFAULT HOST. This module is shared across every Instatic client, so no
   client's host is the right default: it used to fall back to encorercm.com, which stopped
   being an Instatic origin on 2026-08-31, and a stale default is indistinguishable from a
   broken login. Set INSTATIC_BASE_URL in the client's [<client>] section of ~/.webzite/.env
   and run scripts/env-sync.mjs; the generated worktree .env is what this reads.
   See deliver/process/tools/instatic-domain-origins/sites.json for canonical hosts. */
export const BASE = (() => {
  const raw = (process.env.INSTATIC_BASE_URL || '').trim()
  if (!raw) {
    throw new Error(
      'INSTATIC_BASE_URL is not set. Add it to the client section of ~/.webzite/.env and run ' +
      'scripts/env-sync.mjs — the shared toolkit refuses to guess which site it is talking to.',
    )
  }
  return raw.replace(/\/+$/, '')
})()

// The session cache is PER HOST. One shared `output/.session` meant a cookie
// minted for one client's instance was replayed against the next one's; the
// 401-and-relogin path papered over it, but it also meant two pipelines run
// back to back kept evicting each other's session and re-hitting the login
// rate limiter (5 failures locks the account).
const TMP = join(HERE, 'output')
export const SESSION_FILE = join(TMP, `.session-${BASE.replace(/^https?:\/\//, '').replace(/[^a-z0-9.-]/gi, '_')}`)

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
    throw new Error('INSTATIC_EMAIL / INSTATIC_PASSWORD are not set (generated worktree .env)')
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

/**
 * Backfill `template` onto any `changedPages` entry whose row currently has one.
 *
 * This is a SAFETY NET at the single choke point, not a substitute for writing
 * the field. `PUT /site-document` replaces a page's cells with the output of
 * `pageToCells()`, which only emits the template trio when the payload carries a
 * `template` object — so a page write that forgets it silently un-templates the
 * page. On 2026-08-25 that turned `post`, the entry template for the `posts`
 * post-type, into an ordinary page and 404'd all 43 articles on publish. Eleven
 * scripts in this folder had the same shape, so guarding each call site was
 * never going to hold; guarding the one function they all go through does.
 *
 * It only ADDS what the row already had. It never invents or changes a template,
 * so a caller deliberately setting or clearing one still wins.
 */
async function backfillTemplates(changedPages) {
  const rows = (await request('GET', '/admin/api/cms/pages')).rows ?? []
  const byId = new Map(rows.map((r) => [r.id, r]))
  const out = []
  for (const entry of changedPages) {
    if (entry.template !== undefined) { out.push(entry); continue }
    const row = byId.get(entry.id)
    if (!row) { out.push(entry); continue }
    const full = await request('GET', `/admin/api/cms/data/rows/${row.id}`)
    const cells = full.row?.cells ?? {}
    if (cells.templateEnabled !== true) { out.push(entry); continue }
    console.warn(`[insta-api] carrying template through for "${row.slug}" — the caller omitted it`)
    out.push({
      ...entry,
      template: { enabled: true, target: cells.templateTarget, priority: cells.templatePriority ?? 0 },
    })
  }
  return out
}

/**
 * Escape hatch for endpoints without a named helper (fonts, media, plugins).
 *
 * Site-document saves are intercepted so a page write cannot drop a template —
 * see `backfillTemplates`. Nothing else is touched.
 */
export async function api(method, path, body) {
  if (method === 'PUT' && path.includes('/site-document') && Array.isArray(body?.changedPages) && body.changedPages.length) {
    body = { ...body, changedPages: await backfillTemplates(body.changedPages) }
  }
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
 * Every URL a visitor can open, as slugs without the leading slash ('' is the home page): the page
 * rows that are not templates, plus every published entry of each collection (`postType` table
 * with a `routeBase`) at `<routeBase>/<slug>`. Gates that took only the page rows captured the
 * template row (a 404 at its own slug) and none of the entries it renders, so a broken article
 * passed every gate (bk-brandklout-website legal pages, Mason Park's 161 articles, 2026-10-05).
 */
export async function pageSlugs() {
  const { rows } = await getPages()
  const out = rows
    .filter((r) => r.cells?.templateEnabled !== true)
    .map((r) => String(r.cells?.slug ?? r.slug ?? ''))
    .map((s) => (s === 'index' || s === 'home' ? '' : s))
    .filter((s) => !s.includes('['))
  const res = await request('GET', '/admin/api/cms/data/tables')
  for (const t of res.tables ?? res ?? []) {
    if (t.kind !== 'postType' || !t.routeBase) continue
    const base = t.routeBase.replace(/^\/+|\/+$/g, '')
    const entries = (await request('GET', `/admin/api/cms/data/tables/${t.id}/rows`)).rows ?? []
    for (const e of entries) {
      const slug = e.slug ?? e.cells?.slug
      if (e.status === 'published' && slug) out.push(base ? `${base}/${slug}` : String(slug))
    }
  }
  return [...new Set(out)]
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


// ── page writes ────────────────────────────────────────────────────────────
/**
 * Build ONE `changedPages` entry from a row you have read.
 *
 * `PUT /site-document` does NOT merge cells. Every entry in `changedPages` is
 * run through `pageToCells()` (`core/data/pageFromRow.ts`) and the result
 * REPLACES the row's cells:
 *
 *     const cells = { title, slug, body: { nodes, rootNodeId } }
 *     if (page.template) { cells.templateEnabled = true; … }
 *
 * Two things follow, and both have already broken this site:
 *
 *  1. **`template` survives only if you send it.** Omitting it un-templates the
 *     page. On 2026-08-25 that turned `post` — the entry template for the
 *     `posts` post-type — into an ordinary page, and all 43 articles 404'd the
 *     moment the draft was published.
 *  2. **`seoTitle` / `seoDescription` cannot survive at all.** They are not in
 *     `pageToCells`, so ANY page write through this endpoint drops them. They
 *     must be re-applied afterwards through `PATCH /data/rows/:id`, which does
 *     merge — that is what `push-page-seo-cells.mjs` is for.
 *
 * Always build entries with this helper rather than by hand.
 */
export function toChangedPage(row, overrides = {}) {
  const cells = row.cells ?? {}
  const entry = {
    id: row.id,
    slug: cells.slug ?? row.slug,
    title: cells.title,
    nodes: cells.body?.nodes,
    rootNodeId: cells.body?.rootNodeId,
    ...overrides,
  }
  // Carry the template through untouched unless the caller is deliberately
  // changing it. `enabled` is a literal `true` in the schema.
  if (cells.templateEnabled === true && entry.template === undefined) {
    entry.template = {
      enabled: true,
      target: cells.templateTarget,
      priority: cells.templatePriority ?? 0,
    }
  }
  return entry
}

/**
 * Read back every page that was written and fail loudly if a template was lost.
 * Call this after any `changedPages` save. Cheap, and it is the check that
 * would have caught the 43 dead articles before they were published.
 */
export async function assertTemplatesIntact(expected) {
  const rows = (await getPages()).rows
  const broken = []
  for (const [slug, want] of Object.entries(expected)) {
    const r = rows.find((x) => x.slug === slug)
    if (!r) { broken.push(`${slug}: page missing`); continue }
    const full = await request('GET', `/admin/api/cms/data/rows/${r.id}`)
    const on = full.row.cells.templateEnabled === true
    if (want && !on) broken.push(`${slug}: template LOST`)
    if (!want && on) broken.push(`${slug}: template unexpectedly enabled`)
  }
  if (broken.length) {
    throw new Error(`page template check failed: ${broken.join(' | ')}`)
  }
  return true
}

/** Slug → true for every page that currently carries a template. */
export async function templateMap() {
  const rows = (await getPages()).rows
  const out = {}
  for (const r of rows) {
    const full = await request('GET', `/admin/api/cms/data/rows/${r.id}`)
    if (full.row.cells.templateEnabled === true) out[r.slug] = true
  }
  return out
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
    // The endpoint answers { rows: [...] } - DataRows, not a `pages` array. The older `.pages`
    // read printed an empty list for a site full of pages, which reads as "nothing imported yet"
    // (fixed in bk-mason-park-kids). The slug is a cell on a data row.
    pages: async () => (await getPages()).rows?.map((p) => p.cells?.slug ?? p.slug) ?? [],
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
