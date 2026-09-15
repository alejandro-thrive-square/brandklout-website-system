#!/usr/bin/env node
/**
 * Upload .tmp/out/sitemap-worker.js and bind it to /sitemap.xml on the apex and www.
 *
 *   CF_TOKEN=<scoped token> node deploy-sitemap.mjs           # dry run
 *   CF_TOKEN=<scoped token> node deploy-sitemap.mjs --apply
 *   CF_TOKEN=<scoped token> node deploy-sitemap.mjs --rollback --apply   # unbind + delete
 *
 * The shared CLOUDFLAREAPI token has no zone permissions; mint a short-lived one scoped to
 * this zone (Workers Routes Write) plus account Workers Scripts Write, pass it as CF_TOKEN,
 * and revoke it after. See the directive.
 *
 * Idempotent: the upload is a PUT, and a route is created only if its pattern is unbound.
 * The zone is a constant resolved by exact name, so nothing here can land on another client.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ACCOUNT = '45ec80048aabfb983a20f415546f62c7'
const ZONE_NAME = 'westlaketxmedspa.com'
const SCRIPT = 'westlaketxmedspa-sitemap'
/* The trailing `*` is required: a pattern ending in `/sitemap.xml` does NOT match
   `/sitemap.xml?anything`, which then falls through to Instatic's JSON 404. The Worker
   itself only answers the exact pathname and passes everything else to the origin. */
const ROUTES = [`${ZONE_NAME}/sitemap.xml*`, `www.${ZONE_NAME}/sitemap.xml*`]
const APPLY = process.argv.includes('--apply')
const ROLLBACK = process.argv.includes('--rollback')

const TOKEN = process.env.CF_TOKEN
if (!TOKEN) { console.error('set CF_TOKEN to a token scoped to this zone'); process.exit(1) }

async function cf(method, path, body) {
  const isForm = body instanceof FormData
  const r = await fetch('https://api.cloudflare.com/client/v4' + path, {
    method,
    headers: { authorization: 'Bearer ' + TOKEN, ...(body && !isForm ? { 'content-type': 'application/json' } : {}) },
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  })
  const j = await r.json()
  if (!j.success) throw new Error(`${method} ${path} -> ${JSON.stringify(j.errors)}`)
  return j.result
}

const [zone] = await cf('GET', `/zones?name=${ZONE_NAME}&per_page=5`)
if (zone?.name !== ZONE_NAME) throw new Error('zone not found: ' + ZONE_NAME)
const source = readFileSync(join(HERE, '.tmp', 'out', 'sitemap-worker.js'), 'utf8')
const existing = await cf('GET', `/zones/${zone.id}/workers/routes?per_page=100`)

console.log(`zone    ${zone.name} ${zone.id} (${zone.plan?.name})`)
console.log(`script  ${SCRIPT} — ${source.length} bytes, ${(source.match(/<loc>/g) || []).length} URLs`)
console.log(`routes  ${ROUTES.join(', ')}`)
console.log(`bound   ${existing.map((r) => `${r.pattern} -> ${r.script}`).join(', ') || 'none'}`)
if (!APPLY) { console.log('\nDRY RUN — re-run with --apply'); process.exit(0) }

if (ROLLBACK) {
  for (const r of existing.filter((r) => r.script === SCRIPT)) {
    await cf('DELETE', `/zones/${zone.id}/workers/routes/${r.id}`)
    console.log('route removed', r.pattern)
  }
  await cf('DELETE', `/accounts/${ACCOUNT}/workers/scripts/${SCRIPT}`)
  console.log('script deleted', SCRIPT)
  process.exit(0)
}

const form = new FormData()
form.append('metadata', JSON.stringify({ main_module: 'worker.js', compatibility_date: '2026-09-01' }))
form.append('worker.js', new Blob([source], { type: 'application/javascript+module' }), 'worker.js')
const up = await cf('PUT', `/accounts/${ACCOUNT}/workers/scripts/${SCRIPT}`, form)
console.log(`uploaded ${up.id} (modified ${up.modified_on})`)

for (const pattern of ROUTES) {
  const have = existing.find((r) => r.pattern === pattern)
  if (have?.script === SCRIPT) { console.log('route ok     ', pattern); continue }
  if (have) { await cf('PUT', `/zones/${zone.id}/workers/routes/${have.id}`, { pattern, script: SCRIPT }); console.log('route repoint', pattern, `(was ${have.script})`); continue }
  const made = await cf('POST', `/zones/${zone.id}/workers/routes`, { pattern, script: SCRIPT })
  console.log('route created', pattern, made.id)
}
// Routes this script bound under an older pattern would shadow nothing but still confuse.
for (const r of existing.filter((r) => r.script === SCRIPT && !ROUTES.includes(r.pattern))) {
  await cf('DELETE', `/zones/${zone.id}/workers/routes/${r.id}`)
  console.log('route pruned ', r.pattern)
}
console.log('\ndeployed. Prove it: node verify-sitemap.mjs')
