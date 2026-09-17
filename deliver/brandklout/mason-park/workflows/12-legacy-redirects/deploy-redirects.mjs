#!/usr/bin/env node
/**
 * Put the 301 map on bestdentistinkatytx.com, or take it back off.
 *
 *   node deploy-redirects.mjs             # dry run: what it would do, changes nothing
 *   node deploy-redirects.mjs --apply
 *   node deploy-redirects.mjs --rollback --apply   # unbind the Worker's routes
 *
 * Token: CLOUDFLARE_API_TOKEN in the environment, never a file in the repo. It needs
 * Workers Scripts Write (account) plus Zone Read, DNS Write and Workers Routes Write on
 * the bestdentistinkatytx.com zone. The shared CLOUDFLAREAPI key has no zone permissions:
 * mint a short-lived scoped token from it (see the directive) and revoke it when done.
 *
 * What it does, in order:
 *   1. DNS: the records the Worker and the practice's mail need (see RECORDS).
 *   2. Upload the Worker; also enable its workers.dev address so the map can be
 *      verified before the zone is active.
 *   3. Bind the routes on the apex and www.
 * The zone had no redirect rules of its own on 2026-09-17, so nothing is removed.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(HERE, '.tmp', 'out')
const ACCOUNT = '45ec80048aabfb983a20f415546f62c7'   // BrandKlout
const ZONE_NAME = 'bestdentistinkatytx.com'
const SCRIPT = 'mason-park-legacy-redirects'
const ROUTES = ['bestdentistinkatytx.com/*', 'www.bestdentistinkatytx.com/*']
/* www must exist and be proxied or the Worker never sees it. mail is the SiteGround
 * mail host the live (Squarespace) DNS carries and the Cloudflare scan missed; it must
 * stay DNS-only. Values match the live records on 2026-09-17. */
const RECORDS = [
  { type: 'A', name: 'www.bestdentistinkatytx.com', content: '35.208.39.228', proxied: true, ttl: 1 },
  { type: 'A', name: 'mail.bestdentistinkatytx.com', content: '35.208.39.228', proxied: false, ttl: 1 },
]
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
  if (!json.success) throw new Error(`${method} ${path} -> ${res.status}: ${(json.errors || []).map((e) => `${e.code ?? ''} ${e.message}`).join(' | ')}`)
  return json.result
}

/* Resolved by exact name, so no argument can land this on another client's zone. */
const [zone] = await cf('GET', `/zones?name=${ZONE_NAME}`)
if (!zone || zone.name !== ZONE_NAME) throw new Error(`zone ${ZONE_NAME} not visible to this token`)
const routes = await cf('GET', `/zones/${zone.id}/workers/routes`)
const dns = await cf('GET', `/zones/${zone.id}/dns_records?per_page=200`)

console.log(`zone     ${zone.name} ${zone.id} (${zone.status}; nameservers ${zone.name_servers.join(', ')})`)
console.log(`routes   ${routes.length ? routes.map((r) => `${r.pattern} -> ${r.script}`).join(', ') : 'none'}`)

if (ROLLBACK) {
  const mine = routes.filter((r) => r.script === SCRIPT)
  if (!APPLY) { console.log(`\nDRY RUN — would unbind ${mine.map((r) => r.pattern).join(', ') || 'nothing'}. Add --apply.`); process.exit(0) }
  for (const r of mine) { await cf('DELETE', `/zones/${zone.id}/workers/routes/${r.id}`); console.log(`unbound  ${r.pattern}`) }
  process.exit(0)
}

const plan = []
for (const want of RECORDS) {
  const have = dns.filter((r) => r.name === want.name && ['A', 'AAAA', 'CNAME'].includes(r.type))
  if (have.some((r) => r.type === want.type && r.content === want.content && r.proxied === want.proxied)) { console.log(`dns ok   ${want.type} ${want.name}`); continue }
  if (have.length) throw new Error(`${want.name} already has ${have.map((r) => `${r.type} ${r.content} proxied=${r.proxied}`).join(', ')} — resolve by hand`)
  plan.push(want)
}
const source = readFileSync(join(OUT, `${SCRIPT}.js`), 'utf8')
console.log(`script   ${SCRIPT}, ${source.length} bytes`)
console.log(`\nplan: ${plan.map((r) => `add ${r.type} ${r.name} (${r.proxied ? 'proxied' : 'DNS only'}); `).join('')}upload ${SCRIPT}; bind ${ROUTES.join(' and ')}`)
if (!APPLY) { console.log('\nDRY RUN — re-run with --apply'); process.exit(0) }

// 1. DNS
for (const r of plan) { await cf('POST', `/zones/${zone.id}/dns_records`, r); console.log(`dns add  ${r.type} ${r.name}`) }

// 2. the Worker, and its workers.dev address for pre-activation checks
const form = new FormData()
form.append('metadata', JSON.stringify({ main_module: 'worker.js', compatibility_date: '2026-09-01' }))
form.append('worker.js', new Blob([source], { type: 'application/javascript+module' }), 'worker.js')
const up = await cf('PUT', `/accounts/${ACCOUNT}/workers/scripts/${SCRIPT}`, form)
console.log(`uploaded ${up.id}`)
await cf('POST', `/accounts/${ACCOUNT}/workers/scripts/${SCRIPT}/subdomain`, { enabled: true })
const sub = await cf('GET', `/accounts/${ACCOUNT}/workers/subdomain`).catch(() => null)
if (sub?.subdomain) console.log(`preview  https://${SCRIPT}.${sub.subdomain}.workers.dev`)

// 3. its routes
for (const pattern of ROUTES) {
  const have = routes.find((r) => r.pattern === pattern)
  if (have?.script === SCRIPT) { console.log(`route ok ${pattern}`); continue }
  if (have) { await cf('PUT', `/zones/${zone.id}/workers/routes/${have.id}`, { pattern, script: SCRIPT }); console.log(`route repointed ${pattern} (was ${have.script})`); continue }
  await cf('POST', `/zones/${zone.id}/workers/routes`, { pattern, script: SCRIPT })
  console.log(`route bound ${pattern}`)
}
console.log(`\ndeployed. ${zone.status === 'active' ? 'Prove it: node verify-redirects.mjs' : 'The zone is not active yet — prove the map with: node verify-redirects.mjs --via <preview URL>'}`)
