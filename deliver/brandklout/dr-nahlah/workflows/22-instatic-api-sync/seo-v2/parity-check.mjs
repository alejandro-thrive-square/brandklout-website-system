#!/usr/bin/env node
// SEO parity between production and staging DRAFTS (2026-10-05). Run before ANY staging -> production
// promotion: a promotion carries staging's page rows and (clone-site) its shell, so staging must hold
// the same titles, SEO cells and scripts as production or the promotion reverts them.
//   node seo-v2/parity-check.mjs        exit 1 on any difference
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const HERE = dirname(fileURLToPath(import.meta.url))
const HOSTS = { prod: 'https://www.drnahlah.com', staging: 'https://staging.drnahlah.com' }
const snap = (host) => JSON.parse(execFileSync(process.execPath, [join(HERE, 'parity-snapshot.mjs')], { env: { ...process.env, INSTATIC_BASE_URL: host }, maxBuffer: 64 << 20 }).toString())
const a = snap(HOSTS.prod), b = snap(HOSTS.staging)
const diffs = []
for (const k of ['rows', 'og', 'aeo', 'scripts', 'alts']) {
  for (const key of Object.keys(a[k])) {
    if (k === 'alts' && !(key in b.alts)) continue   // media only on production: a promotion never carries media
    if (JSON.stringify(a[k][key]) !== JSON.stringify(b[k][key])) diffs.push(`${k} ${key}`)
  }
}
if (a.org !== b.org) diffs.push('aeo organizationJson')
console.log(`compared rows ${Object.keys(a.rows).length}, og ${Object.keys(a.og).length}, aeo ${Object.keys(a.aeo).length}, scripts ${Object.keys(a.scripts).length}, alts ${Object.keys(a.alts).length}`)
console.log(diffs.length ? diffs.length + ' DIFFERENCE(S)\n  ' + diffs.slice(0, 40).join('\n  ') : 'STAGING MATCHES PRODUCTION')
process.exit(diffs.length ? 1 : 0)
