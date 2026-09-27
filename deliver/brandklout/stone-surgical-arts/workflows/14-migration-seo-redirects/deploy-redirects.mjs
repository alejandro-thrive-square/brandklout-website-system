#!/usr/bin/env node
/**
 * Put the 301 map live on stonesurgicalarts.com, or take it back off.
 *
 *   node deploy-redirects.mjs             # dry run: what it would do, changes nothing
 *   node deploy-redirects.mjs --apply
 *   node deploy-redirects.mjs --rollback  # restore the saved catch-all rule, unbind the Worker
 *
 * Token: CLOUDFLARE_API_TOKEN in the environment, never a file in the repo. It
 * needs Workers Scripts Write (account) plus Workers Routes Write and Dynamic
 * URL Redirects Write on the stonesurgicalarts.com zone. The shared
 * CLOUDFLAREAPI key has no zone permissions — mint a short-lived scoped token
 * from it (see the directive) and revoke it when done.
 *
 * Order matters. The zone's existing Single Redirect sends every path to the new
 * home page and runs BEFORE Workers, so while it exists the Worker never sees a
 * request. So: upload the Worker, bind its routes, save the rule to
 * .tmp/out/, and only then remove the rule. The moment it goes, the Worker takes
 * every request, so there is no window with no redirect at all.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(HERE, '.tmp', 'out')
const ACCOUNT = '45ec80048aabfb983a20f415546f62c7'   // Agency@brandklout.com's Account
const ZONE_NAME = 'stonesurgicalarts.com'
const SCRIPT = 'stone-legacy-redirects'
const ROUTES = ['stonesurgicalarts.com/*', 'www.stonesurgicalarts.com/*']
const BACKUP = join(OUT, 'backup-dynamic-redirect.json')
const APPLY = process.argv.includes('--apply')
const ROLLBACK = process.argv.includes('--rollback')

const TOKEN = process.env.CLOUDFLARE_API_TOKEN
if (!TOKEN) { console.error('set CLOUDFLARE_API_TOKEN (a scoped, short-lived token) in the environment'); process.exit(2) }

async function cf(method, path, body) {
  const headers = { authorization: `Bearer ${TOKEN}` }
  let payload = body
  if (body !== undefined && !(body instanceof FormData)) { headers['content-type'] = 'application/json'; payload = JSON.stringify(body) }
  const res = await fetch('https://api.cloudflare.com/client/v4' + path, { method, headers, body: payload })
  const json = await res.json().catch(() => ({ success: false, errors: [{ message: `HTTP ${res.status}` }] }))
  if (!json.success) {
    const err = new Error(`${method} ${path} -> ${res.status}: ${(json.errors || []).map((e) => `${e.code ?? ''} ${e.message}`).join(' | ')}`)
    err.code = json.errors?.[0]?.code
    throw err
  }
  return json.result
}

/* Resolved by exact name, so no argument can land this on another client's zone. */
const [zone] = await cf('GET', `/zones?name=${ZONE_NAME}`)
if (!zone || zone.name !== ZONE_NAME) throw new Error(`zone ${ZONE_NAME} not visible to this token`)

async function entrypoint() {
  try { return await cf('GET', `/zones/${zone.id}/rulesets/phases/http_request_dynamic_redirect/entrypoint`) }
  catch (e) { if (e.code === 10003) return null; throw e }
}
/* The catch-all: a redirect whose expression matches every request on this zone. */
const isCatchAll = (r) => r.action === 'redirect' && /^\s*\(?\s*true\s*\)?\s*$/.test(r.expression)
const strip = ({ id, version, last_updated, ref, ...keep }) => keep

const ep = await entrypoint()
const catchAll = (ep?.rules ?? []).filter(isCatchAll)
const others = (ep?.rules ?? []).filter((r) => !isCatchAll(r))
const routes = await cf('GET', `/zones/${zone.id}/workers/routes`)

console.log(`zone     ${zone.name} ${zone.id}`)
console.log(`rules    ${catchAll.length} catch-all redirect(s)${catchAll.map((r) => ` -> ${r.action_parameters?.from_value?.target_url?.value ?? '?'}`).join('')}, ${others.length} other(s)`)
console.log(`routes   ${routes.length ? routes.map((r) => `${r.pattern} -> ${r.script}`).join(', ') : 'none'}`)

if (ROLLBACK) {
  if (!existsSync(BACKUP)) { console.error(`no ${BACKUP} — nothing to restore`); process.exit(1) }
  const saved = JSON.parse(readFileSync(BACKUP, 'utf8'))
  if (!APPLY) { console.log(`\nDRY RUN — would restore ${saved.length} rule(s) and unbind ${ROUTES.join(', ')}. Add --apply.`); process.exit(0) }
  const restore = saved.filter((s) => !(ep?.rules ?? []).some((r) => r.expression === s.expression && isCatchAll(r)))
  if (restore.length) await cf('PUT', `/zones/${zone.id}/rulesets/phases/http_request_dynamic_redirect/entrypoint`, { rules: [...(ep?.rules ?? []).map(strip), ...restore.map(strip)] })
  console.log(`restored ${restore.length} rule(s)`)
  for (const r of routes.filter((r) => r.script === SCRIPT)) { await cf('DELETE', `/zones/${zone.id}/workers/routes/${r.id}`); console.log(`unbound  ${r.pattern}`) }
  process.exit(0)
}

const source = readFileSync(join(OUT, 'stone-legacy-redirects.js'), 'utf8')
console.log(`script   ${SCRIPT}, ${source.length} bytes`)
console.log(`\nplan: upload ${SCRIPT}; bind ${ROUTES.join(' and ')}; save then remove ${catchAll.length} catch-all rule(s)`)
if (!APPLY) { console.log('\nDRY RUN — re-run with --apply'); process.exit(0) }

// 1. the Worker
const form = new FormData()
form.append('metadata', JSON.stringify({ main_module: 'worker.js', compatibility_date: '2026-09-01' }))
form.append('worker.js', new Blob([source], { type: 'application/javascript+module' }), 'worker.js')
const up = await cf('PUT', `/accounts/${ACCOUNT}/workers/scripts/${SCRIPT}`, form)
console.log(`uploaded ${up.id}`)

// 2. its routes
for (const pattern of ROUTES) {
  const have = routes.find((r) => r.pattern === pattern)
  if (have?.script === SCRIPT) { console.log(`route ok ${pattern}`); continue }
  if (have) { await cf('PUT', `/zones/${zone.id}/workers/routes/${have.id}`, { pattern, script: SCRIPT }); console.log(`route repointed ${pattern} (was ${have.script})`); continue }
  await cf('POST', `/zones/${zone.id}/workers/routes`, { pattern, script: SCRIPT })
  console.log(`route bound ${pattern}`)
}

// 3. save, then remove, the catch-all
if (catchAll.length) {
  const previous = existsSync(BACKUP) ? JSON.parse(readFileSync(BACKUP, 'utf8')) : []
  writeFileSync(BACKUP, JSON.stringify([...previous, ...catchAll.filter((c) => !previous.some((p) => p.id === c.id))], null, 1) + '\n')
  await cf('PUT', `/zones/${zone.id}/rulesets/phases/http_request_dynamic_redirect/entrypoint`, { rules: others.map(strip) })
  console.log(`removed ${catchAll.length} catch-all rule(s); saved to ${BACKUP}`)
}
console.log('\nlive. Prove it: node verify-redirects.mjs')
