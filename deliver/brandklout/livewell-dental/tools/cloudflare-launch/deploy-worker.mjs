#!/usr/bin/env node
/**
 * Upload a generated Worker (sitemap or redirects) and bind its routes on one zone. Dry run by default.
 *
 * Origin: merged from bk-stone-med-spa 06-cloudflare-sitemap/deploy-sitemap.mjs (trailing * routes,
 * pruning), bk-stone 14-migration-seo-redirects/deploy-redirects.mjs (catch-all backup and removal,
 * rollback) and bk-mason-park 12-legacy-redirects/deploy-redirects.mjs (DNS records, workers.dev
 * preview for pending zones). Generalized 2026-09-23; replaces cloudflare-launch/deploy-worker.mjs.
 *
 *   node deploy-worker.mjs --zone example.com --script example-sitemap --file out/sitemap-worker.js \
 *       --routes "example.com/sitemap.xml*,www.example.com/sitemap.xml*"            # dry run
 *   ... --apply
 *   node deploy-worker.mjs --zone old.com --script client-legacy-redirects --file out/client-legacy-redirects.js \
 *       --routes "old.com/*,www.old.com/*" --records records.json --preview --remove-catch-all --backup out --apply
 *   node deploy-worker.mjs --zone old.com --script client-legacy-redirects --routes "old.com/*,www.old.com/*" \
 *       --rollback --backup out --apply                                            # unbind; restore the catch-all
 *
 * Options:
 *   --routes-from      a redirect-map.json from build-redirect-worker.mjs: use its `routes`.
 *   --routes           comma list of route patterns. Always end a path route with * (a bare
 *                      /sitemap.xml route misses ?query and falls to an origin 404).
 *   --exclude-routes   comma list of patterns bound to NO Worker (e.g. "www.example.com/robots.txt*"
 *                      when a broader route would cover it). Robots.txt must
 *                      never be answered by a Worker.
 *   --records          JSON array of DNS records the Worker needs, e.g. a proxied www A record on a
 *                      legacy zone (a Worker only runs on proxied hostnames). Existing different
 *                      records stop the run for a human decision.
 *   --preview          enable <script>.<account-subdomain>.workers.dev so the map can be verified
 *                      while the zone is still pending (verify-redirects.mjs --via <url>).
 *   --remove-catch-all save, then delete, a zone Single Redirect whose expression is `true`.
 *                      It runs before Workers, so the Worker never sees traffic while it exists.
 *                      Order: upload, bind routes, save, delete: no moment without a redirect.
 *   --backup <dir>     where backup-dynamic-redirect.json is written/read.
 *
 * Token: CLOUDFLARE_API_TOKEN minted with mint-token.mjs (--preset redirects or launch):
 * Workers Scripts Write (account) + Workers Routes Write, Zone Read, DNS Write, Dynamic URL
 * Redirects Write (zone). The zone is resolved by exact name, so nothing lands on another client.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { cf, accountId, zoneFor, entrypoint, stripRule, arg, flag } from './cf-api.mjs'

const ZONE = arg('zone')
const SCRIPT = arg('script')
const FILE = arg('file')
const ROUTES = arg('routes-from')
  ? JSON.parse(readFileSync(arg('routes-from'), 'utf8')).routes
  : (arg('routes', '') || '').split(',').map((s) => s.trim()).filter(Boolean)
const EXCLUDES = (arg('exclude-routes', '') || '').split(',').map((s) => s.trim()).filter(Boolean)
const RECORDS = arg('records') ? JSON.parse(readFileSync(arg('records'), 'utf8')) : []
const BACKUP_DIR = arg('backup', '.')
const BACKUP = join(BACKUP_DIR, 'backup-dynamic-redirect.json')
const APPLY = flag('apply')
const ROLLBACK = flag('rollback')
const PHASE = 'http_request_dynamic_redirect'

if (!ZONE || !SCRIPT || !ROUTES.length || (!FILE && !ROLLBACK)) {
  console.error('usage: node deploy-worker.mjs --zone <domain> --script <name> --file <worker.js> --routes "<a>,<b>" [--exclude-routes ...] [--records f.json] [--preview] [--remove-catch-all] [--backup dir] [--rollback] [--apply]')
  process.exit(2)
}
for (const r of [...ROUTES, ...EXCLUDES]) {
  if (!r.includes(ZONE)) { console.error(`route ${r} is not on zone ${ZONE}`); process.exit(2) }
  if (/\/[^*]+$/.test(r) && !r.endsWith('*')) console.error(`WARN route ${r} has no trailing *; ?query requests will miss it`)
  if (/robots\.txt/.test(r) && ROUTES.includes(r)) { console.error(`refusing to bind robots.txt to a Worker (${r})`); process.exit(2) }
}

const acct = await accountId()
const zone = await zoneFor(ZONE)
const routes = await cf('GET', `/zones/${zone.id}/workers/routes?per_page=100`)
const ep = await entrypoint(zone.id, PHASE).catch((e) => { console.error(`note: cannot read ${PHASE} (${e.message.slice(0, 80)})`); return null })
const isCatchAll = (r) => r.action === 'redirect' && /^\s*\(?\s*true\s*\)?\s*$/.test(r.expression)
const catchAll = (ep?.rules ?? []).filter(isCatchAll)

console.log(`zone     ${zone.name} ${zone.id} (${zone.status}, ${zone.plan?.name}; NS ${zone.name_servers?.join(', ')})`)
console.log(`routes   ${routes.length ? routes.map((r) => `${r.pattern} -> ${r.script ?? '(none)'}`).join(', ') : 'none'}`)
console.log(`redirect ${catchAll.length} catch-all Single Redirect(s), ${(ep?.rules ?? []).length - catchAll.length} other(s)`)

if (ROLLBACK) {
  const mine = routes.filter((r) => r.script === SCRIPT)
  const saved = existsSync(BACKUP) ? JSON.parse(readFileSync(BACKUP, 'utf8')) : []
  console.log(`\nplan: unbind ${mine.map((r) => r.pattern).join(', ') || 'nothing'}; restore ${saved.length} saved rule(s)`)
  if (!APPLY) { console.log('DRY RUN — add --apply'); process.exit(0) }
  const restore = saved.filter((s) => !(ep?.rules ?? []).some((r) => r.expression === s.expression && isCatchAll(r)))
  if (restore.length) await cf('PUT', `/zones/${zone.id}/rulesets/phases/${PHASE}/entrypoint`, { rules: [...(ep?.rules ?? []).map(stripRule), ...restore.map(stripRule)] })
  for (const r of mine) { await cf('DELETE', `/zones/${zone.id}/workers/routes/${r.id}`); console.log(`unbound  ${r.pattern}`) }
  console.log(`restored ${restore.length} rule(s)`)
  process.exit(0)
}

const dns = RECORDS.length ? await cf('GET', `/zones/${zone.id}/dns_records?per_page=200`) : []
const dnsPlan = []
for (const want of RECORDS) {
  const have = dns.filter((r) => r.name === want.name && ['A', 'AAAA', 'CNAME'].includes(r.type))
  if (have.some((r) => r.type === want.type && r.content === want.content && r.proxied === want.proxied)) { console.log(`dns ok   ${want.type} ${want.name}`); continue }
  if (have.length) { console.error(`${want.name} already has ${have.map((r) => `${r.type} ${r.content} proxied=${r.proxied}`).join(', ')}; resolve by hand`); process.exit(1) }
  dnsPlan.push({ ttl: 1, ...want })
}
const source = readFileSync(FILE, 'utf8')
console.log(`script   ${SCRIPT}, ${source.length} bytes${/<loc>/.test(source) ? `, ${(source.match(/<loc>/g) || []).length} sitemap URLs` : ''}`)
console.log(`\nplan: ${dnsPlan.map((r) => `add ${r.type} ${r.name} (${r.proxied ? 'proxied' : 'DNS only'}); `).join('')}upload ${SCRIPT}; bind ${ROUTES.join(', ')}` +
  `${EXCLUDES.length ? `; exclude ${EXCLUDES.join(', ')}` : ''}${flag('remove-catch-all') && catchAll.length ? `; save + remove ${catchAll.length} catch-all` : ''}`)
if (!APPLY) { console.log('\nDRY RUN — re-run with --apply'); process.exit(0) }

// 1. DNS the Worker needs
for (const r of dnsPlan) { await cf('POST', `/zones/${zone.id}/dns_records`, r); console.log(`dns add  ${r.type} ${r.name}`) }

// 2. the Worker (module syntax, multipart upload)
const form = new FormData()
form.append('metadata', JSON.stringify({ main_module: 'worker.js', compatibility_date: '2026-09-01' }))
form.append('worker.js', new Blob([source], { type: 'application/javascript+module' }), 'worker.js')
const up = await cf('PUT', `/accounts/${acct}/workers/scripts/${SCRIPT}`, form, { retries: 3 })
console.log(`uploaded ${up.id} (modified ${up.modified_on})`)
if (flag('preview')) {
  await cf('POST', `/accounts/${acct}/workers/scripts/${SCRIPT}/subdomain`, { enabled: true })
  const sub = await cf('GET', `/accounts/${acct}/workers/subdomain`).catch(() => null)
  if (sub?.subdomain) console.log(`preview  https://${SCRIPT}.${sub.subdomain}.workers.dev`)
}

// 3. routes, then no-Worker exclusions
for (const pattern of ROUTES) {
  const have = routes.find((r) => r.pattern === pattern)
  if (have?.script === SCRIPT) { console.log(`route ok ${pattern}`); continue }
  if (have) { await cf('PUT', `/zones/${zone.id}/workers/routes/${have.id}`, { pattern, script: SCRIPT }); console.log(`route repointed ${pattern} (was ${have.script})`); continue }
  await cf('POST', `/zones/${zone.id}/workers/routes`, { pattern, script: SCRIPT })
  console.log(`route bound ${pattern}`)
}
for (const pattern of EXCLUDES) {
  if (routes.some((r) => r.pattern === pattern && !r.script)) { console.log(`exclude ok ${pattern}`); continue }
  await cf('POST', `/zones/${zone.id}/workers/routes`, { pattern })
  console.log(`excluded ${pattern} (no Worker)`)
}
for (const r of routes.filter((r) => r.script === SCRIPT && !ROUTES.includes(r.pattern))) {
  await cf('DELETE', `/zones/${zone.id}/workers/routes/${r.id}`)
  console.log(`route pruned ${r.pattern}`)
}

// 4. the catch-all goes last, after it is saved
if (flag('remove-catch-all') && catchAll.length) {
  mkdirSync(BACKUP_DIR, { recursive: true })
  const previous = existsSync(BACKUP) ? JSON.parse(readFileSync(BACKUP, 'utf8')) : []
  writeFileSync(BACKUP, JSON.stringify([...previous, ...catchAll.filter((c) => !previous.some((p) => p.id === c.id))], null, 1) + '\n')
  await cf('PUT', `/zones/${zone.id}/rulesets/phases/${PHASE}/entrypoint`, { rules: (ep.rules ?? []).filter((r) => !isCatchAll(r)).map(stripRule) })
  console.log(`removed ${catchAll.length} catch-all rule(s); saved to ${BACKUP}`)
}
console.log(`\ndeployed. ${zone.status === 'active' ? 'Verify on the real host now.' : 'Zone is NOT active: verify through the workers.dev preview (--preview), again after activation.'}`)
