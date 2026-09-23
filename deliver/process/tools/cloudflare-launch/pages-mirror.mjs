#!/usr/bin/env node
/**
 * Serve a cleaned static mirror of an old site on Cloudflare Pages, on the client's domain, when
 * the old host is down or compromised and the new site is not ready.
 *
 * Origin: bk-mason-park-kids 2026-09-14 (mirror-clean/ -> Pages project mason-park-kids-wp on
 * masonparkpediatricdental.com) and auto-memory "wrangler-pages-create-delegates-to-workers".
 * Written as a script 2026-09-23.
 *
 *   node pages-mirror.mjs --project client-wp --dir <mirror-clean> --domains example.com,www.example.com --zone example.com   # dry run
 *   node pages-mirror.mjs ... --apply
 *
 * Steps (each idempotent):
 *   1. Refuse unless <dir>/404.html exists. Without it Pages answers EVERY missing path with the
 *      home page and a 200, so an HTTP sweep reports a broken mirror as perfect (40/40 false pass).
 *   2. Refuse unless the malware gate passed: run scenario-1-migration/01-old-site-capture/scripts/scan-mirror.mjs <dir> --strict
 *      first (ClearFake was live for an hour on Mason Park Kids because the old gate missed it).
 *   3. Create the project through the API (`wrangler pages project create` 4.131 delegates to
 *      Workers and fails with "Could not detect a directory containing static files").
 *   4. `npx wrangler@4 pages deploy <dir> --project-name <p> --branch main --commit-dirty=true`
 *      with CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID in the environment.
 *   5. Attach each domain to the project, and point its record at <project>.pages.dev as a PROXIED
 *      CNAME (existing A/AAAA/CNAME records for that name are replaced; www answers 522 for ~1 min).
 * Afterwards: delete any _railway-verify TXT and Railway custom domain for these hosts, trim
 * PUBLIC_ORIGIN, and check the pages in a real browser render, not by status codes.
 *
 * Token: mint-token.mjs --zone example.com --preset pages (Pages Write, Account Settings Read,
 * DNS Write on the zone).
 */
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { cf, accountId, zoneFor, token, arg, flag } from './cf-api.mjs'

const PROJECT = arg('project'), DIR = arg('dir') && resolve(arg('dir')), ZONE = arg('zone')
const DOMAINS = (arg('domains', '') || '').split(',').map((s) => s.trim()).filter(Boolean)
if (!PROJECT || !DIR || !ZONE || !DOMAINS.length) { console.error('usage: node pages-mirror.mjs --project <name> --dir <mirror> --domains a,b --zone <apex> [--apply]'); process.exit(2) }
const APPLY = flag('apply')

if (!existsSync(join(DIR, 'index.html'))) { console.error(`${DIR}/index.html missing`); process.exit(1) }
if (!existsSync(join(DIR, '404.html'))) { console.error(`${DIR}/404.html missing: Pages would answer every missing path with the home page and a 200`); process.exit(1) }
{
  const reportPath = join(DIR, '..', 'scan-mirror-report.json')
  const report = existsSync(reportPath) ? JSON.parse(readFileSync(reportPath, 'utf8')) : null
  if (!report || !report.ok || !report.strict || resolve(report.dir) !== DIR) {
    console.error('no passing strict scan for this directory: run scenario-1-migration/01-old-site-capture/scripts/scan-mirror.mjs <dir> --host <old> --strict first')
    process.exit(1)
  }
}

const acct = await accountId()
const zone = await zoneFor(ZONE)
const projects = await cf('GET', `/accounts/${acct}/pages/projects`)
const exists = projects.some((p) => p.name === PROJECT)
console.log(`project  ${PROJECT} ${exists ? 'exists' : 'will be created'} -> https://${PROJECT}.pages.dev`)
console.log(`deploy   ${DIR}`)
console.log(`domains  ${DOMAINS.join(', ')} -> CNAME ${PROJECT}.pages.dev (proxied)`)
if (!APPLY) { console.log('\nDRY RUN — re-run with --apply'); process.exit(0) }

if (!exists) { await cf('POST', `/accounts/${acct}/pages/projects`, { name: PROJECT, production_branch: 'main' }, { retries: 3 }); console.log('created project') }

const run = spawnSync('npx', ['--yes', 'wrangler@4', 'pages', 'deploy', DIR, '--project-name', PROJECT, '--branch', 'main', '--commit-dirty=true'], {
  stdio: 'inherit', shell: process.platform === 'win32', env: { ...process.env, CLOUDFLARE_API_TOKEN: token(), CLOUDFLARE_ACCOUNT_ID: acct },
})
if (run.status !== 0) { console.error('wrangler pages deploy failed'); process.exit(1) }

const attached = await cf('GET', `/accounts/${acct}/pages/projects/${PROJECT}/domains`).catch(() => [])
for (const d of DOMAINS) {
  if (!attached.some((a) => a.name === d)) { await cf('POST', `/accounts/${acct}/pages/projects/${PROJECT}/domains`, { name: d }); console.log(`attached ${d}`) }
  const records = await cf('GET', `/zones/${zone.id}/dns_records?name=${encodeURIComponent(d)}`)
  for (const r of records.filter((r) => ['A', 'AAAA'].includes(r.type) || (r.type === 'CNAME' && r.content !== `${PROJECT}.pages.dev`))) {
    await cf('DELETE', `/zones/${zone.id}/dns_records/${r.id}`); console.log(`dns del  ${r.type} ${d} ${r.content}`)
  }
  if (!records.some((r) => r.type === 'CNAME' && r.content === `${PROJECT}.pages.dev`)) {
    await cf('POST', `/zones/${zone.id}/dns_records`, { type: 'CNAME', name: d, content: `${PROJECT}.pages.dev`, proxied: true, ttl: 1 })
    console.log(`dns add  CNAME ${d} -> ${PROJECT}.pages.dev (proxied)`)
  }
}
console.log('\ndone. Wait ~2 min, then open every page in a real browser (status codes lie on Pages).')
