#!/usr/bin/env node
/**
 * Deploy `.tmp/out/sitemap-worker.js` and bind it to the two paths it owns.
 *
 *   node deploy-worker.mjs            # dry run — says what it would do
 *   node deploy-worker.mjs --apply
 *
 * Idempotent: the script upload is a PUT (overwrites in place) and each route
 * is created only if an identical pattern is not already bound.
 *
 * SCOPE. The token can see seven zones — every Brandklout client. Nothing here
 * takes a zone name from anywhere but the ZONE constant below, and the zone id
 * is resolved by exact name match, so a fat-fingered argument cannot land this
 * on another practice's domain.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cf, accountId, zoneFor } from './cf-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ZONE = 'drnahlah.com'
const SCRIPT_NAME = 'drnahlah-seo'
const ROUTES = [
  'www.drnahlah.com/sitemap.xml',
  'www.drnahlah.com/robots.txt',
  'drnahlah.com/sitemap.xml',
  'drnahlah.com/robots.txt',
]
const APPLY = process.argv.includes('--apply')

const source = readFileSync(join(HERE, '.tmp', 'out', 'sitemap-worker.js'), 'utf8')
const acct = await accountId()
const zone = await zoneFor(ZONE)

console.log(`account ${acct}`)
console.log(`zone    ${zone.name} ${zone.id} (${zone.plan?.name})`)
console.log(`script  ${SCRIPT_NAME} — ${source.length} bytes, ${(source.match(/<loc>/g) || []).length} sitemap URLs`)
console.log(`routes  ${ROUTES.join('\n        ')}`)

if (!APPLY) { console.log('\nDRY RUN — re-run with --apply'); process.exit(0) }

// ── upload the script ──────────────────────────────────────────────────────
// Module workers upload as multipart: a `metadata` part naming the main module,
// plus the module itself with the `application/javascript+module` content type.

const form = new FormData()
form.append('metadata', JSON.stringify({
  main_module: 'worker.js',
  compatibility_date: '2026-08-01',
}))
form.append('worker.js', new Blob([source], { type: 'application/javascript+module' }), 'worker.js')

const uploaded = await cf('PUT', `/accounts/${acct}/workers/scripts/${SCRIPT_NAME}`, form)
console.log(`\nuploaded: ${uploaded.id} (modified ${uploaded.modified_on})`)

// ── bind the routes ────────────────────────────────────────────────────────

const existing = await cf('GET', `/zones/${zone.id}/workers/routes`)
for (const pattern of ROUTES) {
  const already = existing.find((r) => r.pattern === pattern)
  if (already) {
    if (already.script === SCRIPT_NAME) { console.log(`route ok      ${pattern}`); continue }
    await cf('PUT', `/zones/${zone.id}/workers/routes/${already.id}`, { pattern, script: SCRIPT_NAME })
    console.log(`route repoint ${pattern} (was ${already.script})`)
    continue
  }
  const made = await cf('POST', `/zones/${zone.id}/workers/routes`, { pattern, script: SCRIPT_NAME })
  console.log(`route created ${pattern} -> ${made.id}`)
}

console.log('\ndeployed. Verify with: node verify-live.mjs')
