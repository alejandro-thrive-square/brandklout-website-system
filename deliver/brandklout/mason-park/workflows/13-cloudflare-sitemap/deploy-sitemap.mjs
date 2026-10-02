#!/usr/bin/env node
/**
 * Upload .tmp/out/sitemap-worker.js and bind it to www.masonparkdental.com/sitemap.xml*.
 *
 *   node ../12-legacy-redirects/cf-token.mjs mint
 *   CLOUDFLARE_API_TOKEN=$(cat ../12-legacy-redirects/.tmp/.cf-token) node deploy-sitemap.mjs           # dry run
 *   CLOUDFLARE_API_TOKEN=$(cat ../12-legacy-redirects/.tmp/.cf-token) node deploy-sitemap.mjs --apply
 *   CLOUDFLARE_API_TOKEN=... node deploy-sitemap.mjs --rollback --apply   # unbind + delete
 *   node ../12-legacy-redirects/cf-token.mjs revoke
 *
 * Idempotent: the upload is a PUT, and a route is created only if its pattern is unbound. The
 * zone is resolved by exact name, so nothing here can land on another client.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ACCOUNT = '45ec80048aabfb983a20f415546f62c7' // BrandKlout
const ZONE_NAME = 'masonparkdental.com'
const SCRIPT = 'masonparkdental-sitemap'
/* www only: the apex 301s to www, and staging must never serve production's sitemap. The
   trailing `*` is required, or /sitemap.xml?x falls through to Instatic's JSON 404; the
   Worker itself answers only the exact pathname. */
const ROUTES = [`www.${ZONE_NAME}/sitemap.xml*`]
const APPLY = process.argv.includes('--apply')
const ROLLBACK = process.argv.includes('--rollback')

const TOKEN = process.env.CLOUDFLARE_API_TOKEN
if (!TOKEN) { console.error('set CLOUDFLARE_API_TOKEN (a scoped, short-lived token; see the directive)'); process.exit(2) }

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
if (zone?.name !== ZONE_NAME) throw new Error('zone not visible to this token: ' + ZONE_NAME)
const source = readFileSync(join(HERE, '.tmp', 'out', 'sitemap-worker.js'), 'utf8')
const existing = await cf('GET', `/zones/${zone.id}/workers/routes?per_page=100`)

console.log(`zone    ${zone.name} ${zone.id} (${zone.plan?.name}, ${zone.status})`)
console.log(`script  ${SCRIPT} - ${source.length} bytes, ${(source.match(/<loc>/g) || []).length} URLs`)
console.log(`routes  ${ROUTES.join(', ')}`)
console.log(`bound   ${existing.map((r) => `${r.pattern} -> ${r.script}`).join(', ') || 'none'}`)
if (!APPLY) { console.log('\nDRY RUN - re-run with --apply'); process.exit(0) }

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
for (const r of existing.filter((r) => r.script === SCRIPT && !ROUTES.includes(r.pattern))) {
  await cf('DELETE', `/zones/${zone.id}/workers/routes/${r.id}`)
  console.log('route pruned ', r.pattern)
}
console.log('\ndeployed. Prove it: node verify-sitemap.mjs')
