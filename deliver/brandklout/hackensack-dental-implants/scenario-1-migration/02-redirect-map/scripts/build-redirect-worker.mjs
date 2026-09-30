#!/usr/bin/env node
/**
 * Build and validate the old-URL redirect map, and generate the Cloudflare Worker that serves it.
 *
 * Origin: bk-stone stone-surgical-arts/workflows/14-migration-seo-redirects/build-redirects.mjs
 * and bk-mason-park mason-park/workflows/12-legacy-redirects/build-redirects.mjs (same design,
 * 2026-09-15 and 2026-09-17). Generalized 2026-09-23: the map moved out of the code into a
 * JSON config, and a same-domain mode was added (old and new site on one domain).
 *
 *   node build-redirect-worker.mjs --config redirect-map.config.json
 *   node build-redirect-worker.mjs --config redirect-map.config.json --offline   # skip live checks
 *
 * Config (paths are relative to the config file):
 * {
 *   "target": "https://www.new-domain.com",        // canonical host of the NEW site
 *   "checkOrigin": "https://client.up.railway.app", // optional: where destinations are checked live
 *                                                   // before cutover (defaults to target)
 *   "oldHosts": ["old.com", "www.old.com"],         // hosts the Worker is bound to
 *   "mode": "legacy-domain" | "same-domain",
 *       legacy-domain: every request on the old hosts redirects; unmatched -> fallback
 *       same-domain:   only mapped paths redirect; everything else passes to the origin
 *   "status": 301,                                  // 302 for a temporary move
 *   "keepPath": false,                              // true: every path goes to target + SAME path
 *                                                   // (temporary move to a mirror; map is ignored)
 *   "fallback": "/",                                // legacy-domain only
 *   "workerName": "client-legacy-redirects",
 *   "inventory": "url-inventory.txt",               // every known old URL (capture step output)
 *   "pages": "new-pages.txt",                       // every path the new site serves (required for same-domain)
 *   "exact":  [["/old-path", "/new-path", "category", "note"], ...],
 *   "prefix": [["/old-section", "/new-page", "category", "note"], ...],
 *   "samePathForLivePages": true                    // legacy-domain: an old path the new site serves
 *                                                   // at the same address maps to itself
 * }
 *
 * Writes next to the config, in out/:
 *   <workerName>.js     the Worker (deploy with tools/cloudflare-launch/deploy-worker.mjs)
 *   redirect-map.json   the map, the Worker routes, and one audit row per known old URL
 *                       (read by verify-redirects.mjs and by deploy-worker.mjs --routes-from)
 *   redirect-audit.csv  the same rows, for the client
 *
 * Hard rules it enforces (a failure means nothing is safe to deploy):
 *   - no trailing-slash rows (the Worker ignores the slash; a slash row is a duplicate)
 *   - no self-redirects in same-domain mode
 *   - every destination is a page the new site serves, and answers 200 live
 *   - same-domain: no source is a live page (that would serve the wrong page with a 200)
 *   - every inventoried old URL resolves to something (or is reported as fallback)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join, resolve as resolvePath } from 'node:path'

const argAt = process.argv.indexOf('--config')
if (argAt < 0) { console.error('usage: node build-redirect-worker.mjs --config <redirect-map.config.json> [--offline]'); process.exit(2) }
const CONFIG_PATH = resolvePath(process.argv[argAt + 1])
const BASE = dirname(CONFIG_PATH)
const CFG = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'))
const OFFLINE = process.argv.includes('--offline')
const OUT = join(BASE, 'out')
const UA = { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36' }

const TARGET = String(CFG.target || '').replace(/\/$/, '')
const CHECK = String(CFG.checkOrigin || TARGET).replace(/\/$/, '')
const MODE = CFG.mode || 'legacy-domain'
const STATUS = CFG.status || (CFG.keepPath ? 302 : 301)
const FALLBACK = MODE === 'legacy-domain' ? (CFG.fallback ?? '/') : null
const NAME = CFG.workerName
if (!/^https:\/\/[^/]+$/.test(TARGET)) { console.error('target must look like https://www.example.com'); process.exit(2) }
if (!['legacy-domain', 'same-domain'].includes(MODE)) { console.error('mode must be legacy-domain or same-domain'); process.exit(2) }
if (!NAME || !/^[a-z0-9-]+$/.test(NAME)) { console.error('workerName must be lowercase letters, digits and dashes'); process.exit(2) }
if (!Array.isArray(CFG.oldHosts) || !CFG.oldHosts.length) { console.error('oldHosts is required'); process.exit(2) }

// ── the matcher. Both functions are copied into the Worker by source, so the checks test what ships. ──

function normalise(path) {
  let p = path
  try { p = decodeURIComponent(p) } catch {}
  p = p.toLowerCase().replace(/\/{2,}/g, '/').replace(/\/+$/, '')
  return p || '/'
}

function resolve(rawPath, MAP) {
  const path = normalise(rawPath)
  if (Object.prototype.hasOwnProperty.call(MAP.exact, path)) return { to: MAP.exact[path], rule: path }
  let best = null
  for (const prefix of Object.keys(MAP.prefix)) {
    if ((path === prefix || path.startsWith(prefix + '/')) && (!best || prefix.length > best.length)) best = prefix
  }
  if (best) return { to: MAP.prefix[best], rule: best + '/*' }
  if (MAP.fallback !== null) return { to: MAP.fallback, rule: 'fallback' }
  return null
}

// ── inputs ─────────────────────────────────────────────────────────────────

const fail = (msg) => { console.error('FAIL ' + msg); process.exitCode = 1 }
const readList = (rel) => {
  if (!rel) return []
  const p = join(BASE, rel)
  if (!existsSync(p)) { fail(`${rel} not found`); return [] }
  const raw = readFileSync(p, 'utf8')
  const lines = p.endsWith('.json') ? JSON.parse(raw) : raw.split(/\r?\n/)
  return lines.map((l) => String(typeof l === 'object' ? (l.url ?? l.path ?? l.from) : l).trim()).filter(Boolean)
}
const toPath = (u) => {
  try { return normalise(new URL(u).pathname) } catch { return normalise(u.startsWith('/') ? u : '/' + u) }
}
const pool = async (items, fn, n = 8) => {
  const q = [...items]
  await Promise.all(Array.from({ length: n }, async () => { while (q.length) await fn(q.shift()) }))
}
const status = async (path) => {
  for (let i = 0; i < 3; i++) {
    const r = await fetch(CHECK + path, { redirect: 'manual', headers: UA }).catch(() => null)
    if (r) return r.status
  }
  return 0
}

const inventory = [...new Set(readList(CFG.inventory).map(toPath))]
const pages = new Set(readList(CFG.pages).map(toPath))
if (MODE === 'same-domain' && !pages.size) fail('same-domain mode needs "pages" (every path the new site serves) to catch shadowing')

// ── the map ────────────────────────────────────────────────────────────────

const exact = new Map()   // old path -> { to, category, note }
const prefix = new Map()
const add = (table, [from, to, category = '', note = ''], label) => {
  if (from !== '/' && /\/$/.test(from)) fail(`${label} row ${from} has a trailing slash; drop it (the Worker ignores slashes)`)
  const key = normalise(from)
  if (table.has(key)) fail(`${key} is mapped twice in ${label}`)
  if (MODE === 'same-domain' && normalise(to) === key) { console.log(`dropped self-redirect ${key}`); return }
  table.set(key, { to: to === '/' ? '/' : to.replace(/\/+$/, ''), category, note })
}
if (!CFG.keepPath) {
  for (const row of CFG.exact ?? []) add(exact, row, 'exact')
  for (const row of CFG.prefix ?? []) add(prefix, row, 'prefix')
}

/* Legacy domain: an old path the new site serves at the same address maps to itself. */
let liveOld = new Map()
if (MODE === 'legacy-domain' && !CFG.keepPath && CFG.samePathForLivePages !== false) {
  if (pages.size) for (const p of inventory) if (pages.has(p)) liveOld.set(p, 200)
  if (!OFFLINE && !pages.size) await pool(inventory, async (p) => liveOld.set(p, await status(p)))
  for (const [p, code] of liveOld) if (code === 200 && !exact.has(p)) exact.set(p, { to: p, category: 'same-path', note: 'served at the same address' })
}

const MAP = {
  exact: Object.fromEntries([...exact].map(([k, v]) => [k, v.to])),
  prefix: Object.fromEntries([...prefix].map(([k, v]) => [k, v.to])),
  fallback: FALLBACK,
}

// ── checks ─────────────────────────────────────────────────────────────────

const destinations = new Set([...Object.values(MAP.exact), ...Object.values(MAP.prefix), ...(FALLBACK ? [FALLBACK] : [])])
if (pages.size) for (const d of destinations) if (!pages.has(normalise(d))) fail(`destination ${d} is not in the new site's page list`)
if (!OFFLINE && !CFG.keepPath) {
  const bad = []
  await pool(destinations, async (d) => { const s = await status(d); if (s !== 200) bad.push(`${d} -> ${s}`) })
  if (bad.length) fail(`destinations not 200 on ${CHECK}:\n  ${bad.join('\n  ')}`)
  else console.log(`live: all ${destinations.size} destinations answer 200 on ${CHECK}`)
}
if (MODE === 'same-domain') {
  /* Shadowing: a rule on a real page returns 200 somewhere else and hides the page. */
  const shadowed = [...pages].filter((p) => resolve(p, MAP))
  if (shadowed.length) fail(`rules match live pages (they would hide them):\n  ${shadowed.join('\n  ')}`)
  const uncovered = inventory.filter((p) => !pages.has(p) && !resolve(p, MAP))
  if (uncovered.length) fail(`old URLs with no rule and no page (they will 404):\n  ${uncovered.join('\n  ')}`)
}

// ── audit rows ─────────────────────────────────────────────────────────────

const rows = CFG.keepPath
  ? inventory.map((from) => ({ from, to: from, rule: 'keep-path', category: 'temporary-move', note: `${STATUS} to the same path` }))
  : [...new Set([...inventory, ...exact.keys()])].sort()
    .filter((from) => !(MODE === 'same-domain' && pages.has(from)))
    .map((from) => {
      const hit = resolve(from, MAP)
      if (!hit) return null
      const meta = hit.rule === 'fallback' ? { category: 'fallback', note: 'no page; lands on the fallback' }
        : hit.rule.endsWith('/*') ? prefix.get(hit.rule.slice(0, -2)) : exact.get(hit.rule)
      return { from, to: hit.to, rule: hit.rule, category: meta.category, note: meta.note }
    }).filter(Boolean)

// ── emit ───────────────────────────────────────────────────────────────────

mkdirSync(OUT, { recursive: true })
const header = `/**
 * ${MODE === 'same-domain' ? 'Redirects the mapped old URLs on' : 'Redirects every URL on'} ${CFG.oldHosts.join(', ')} to ${TARGET}.
 *
 * GENERATED by deliver/process/scenario-1-migration/02-redirect-map/scripts/build-redirect-worker.mjs from
 * ${CONFIG_PATH.split(/[\\/]/).slice(-3).join('/')}. Do not hand-edit: change the config, rebuild, redeploy.
 * Order: the exact old URL, then the longest matching old section, then ${FALLBACK ? 'the fallback' : 'the origin (unchanged)'}.
 * Case and trailing slashes are ignored; the query string is kept.
 */`
const worker = CFG.keepPath ? `${header}
const TARGET = ${JSON.stringify(TARGET)}
export default {
  async fetch(request) {
    const url = new URL(request.url)
    return new Response(null, { status: ${STATUS}, headers: { location: TARGET + url.pathname + url.search, 'cache-control': 'no-store', 'x-redirect-rule': 'keep-path' } })
  },
}
` : `${header}
const TARGET = ${JSON.stringify(TARGET)}
const STATUS = ${STATUS}
const MAP = ${JSON.stringify(MAP, null, 1)}

${normalise.toString()}

${resolve.toString()}

export default {
  async fetch(request) {
    const url = new URL(request.url)
${MODE === 'same-domain' ? `    /* Same domain: robots.txt belongs to the edge and sitemap.xml to the sitemap Worker. */
    if (url.pathname === '/robots.txt' || url.pathname === '/sitemap.xml') return fetch(request)
` : ''}    const hit = resolve(url.pathname, MAP)
    if (!hit) return fetch(request)
    return new Response(null, {
      status: STATUS,
      headers: {
        location: TARGET + hit.to + url.search,
        'cache-control': STATUS === 301 ? 'public, max-age=3600' : 'no-store',
        'x-redirect-rule': hit.rule,
      },
    })
  },
}
`
/* Routes. Legacy domain: the whole old host. Same domain: ONLY the old paths, never host/*, because
   Workers Free has an account-wide 100,000 requests/day and a Worker on a live site's host/* would
   spend it on every asset. A route like host/old-path* also catches /old-path-more: the Worker passes
   anything unmapped to the origin, so that only costs a request. */
let routes
if (MODE === 'legacy-domain' || CFG.keepPath) routes = CFG.oldHosts.map((h) => `${h}/*`)
else {
  const keys = [...Object.keys(MAP.prefix), ...Object.keys(MAP.exact)].filter((k) => k !== '/').sort((a, b) => a.length - b.length)
  const kept = []
  for (const k of keys) if (!kept.some((p) => k.startsWith(p))) kept.push(k)
  routes = CFG.oldHosts.flatMap((h) => kept.map((k) => `${h}${k}*`))
  if (routes.length > 200) console.log(`WARN ${routes.length} routes: consider section prefixes, or a Bulk Redirect list for this map`)
}
writeFileSync(join(OUT, `${NAME}.js`), worker)
writeFileSync(join(OUT, 'redirect-map.json'), JSON.stringify({ target: TARGET, oldHosts: CFG.oldHosts, mode: MODE, status: STATUS, keepPath: !!CFG.keepPath, workerName: NAME, routes, map: MAP, rows }, null, 1) + '\n')
const q = (s) => /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
writeFileSync(join(OUT, 'redirect-audit.csv'), ['Old URL,New URL,Matched by,Category,Note',
  ...rows.map((r) => [`${CFG.oldHosts[0]}${r.from}`, TARGET + r.to, r.rule, r.category, r.note].map((v) => q(String(v ?? ''))).join(','))].join('\n') + '\n')

// ── report ─────────────────────────────────────────────────────────────────

const by = rows.reduce((m, r) => (m[r.category || '(none)'] = (m[r.category || '(none)'] || 0) + 1, m), {})
console.log(`\n${rows.length} known old URLs -> ${destinations.size} destinations (${MODE}, ${STATUS}${CFG.keepPath ? ', keep path' : ''})`)
for (const [k, v] of Object.entries(by).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(22)} ${v}`)
console.log(`\nmap: ${exact.size} exact rules, ${prefix.size} section rules; ${routes.length} Worker route(s): ${routes.slice(0, 6).join(', ')}${routes.length > 6 ? ', ...' : ''}`)
const fb = rows.filter((r) => r.rule === 'fallback')
if (fb.length) console.log(`\nfalls back with no rule (${fb.length}); add a row for any that had traffic:\n  ${fb.slice(0, 30).map((r) => r.from).join('\n  ')}`)
console.log(`\nwrote ${OUT}`)
if (process.exitCode) console.error('\nBUILD FAILED: nothing above is safe to deploy')
