#!/usr/bin/env node
/**
 * Prove the live sitemap: both hosts serve it as XML, it matches the build byte for byte,
 * every <loc> answers 200, robots.txt is still Cloudflare's own, and staging serves none.
 *
 *   node verify-sitemap.mjs      # ends "FAIL  none" or lists what failed; exit code follows
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const built = readFileSync(join(HERE, '.tmp', 'out', 'sitemap.xml'), 'utf8')
const fails = []
const bust = () => `?v=${Date.now()}`

for (const host of ['https://westlaketxmedspa.com', 'https://www.westlaketxmedspa.com']) {
  const r = await fetch(host + '/sitemap.xml' + bust(), { redirect: 'manual' })
  const body = await r.text()
  const type = r.headers.get('content-type') || ''
  console.log(`${host}/sitemap.xml  ${r.status}  ${type}  ${body.length} B`)
  if (r.status !== 200) fails.push(`${host}/sitemap.xml ${r.status}`)
  if (!/xml/.test(type)) fails.push(`${host}/sitemap.xml content-type ${type}`)
  if (body !== built) fails.push(`${host}/sitemap.xml differs from .tmp/out/sitemap.xml`)
}

const locs = [...built.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
for (const loc of locs) {
  const r = await fetch(loc, { redirect: 'manual' })
  if (r.status !== 200) fails.push(`${loc} ${r.status}`)
}
console.log(`<loc> entries: ${locs.length}, all checked`)

// Module 19, trap 1: the Worker must not have taken over robots.txt.
const robots = await fetch('https://westlaketxmedspa.com/robots.txt')
const rb = await robots.text()
console.log(`robots.txt  ${robots.status}  ${rb.length} B`)
if (robots.status !== 200 || rb.length < 200) fails.push(`robots.txt looks replaced (${robots.status}, ${rb.length} B)`)

// Staging is noindex; it must not advertise a sitemap of production URLs.
const st = await fetch('https://staging.westlaketxmedspa.com/sitemap.xml').catch((e) => ({ status: e.message }))
console.log(`staging /sitemap.xml  ${st.status}`)
if (st.status === 200) fails.push('staging serves a sitemap')

console.log(fails.length ? `FAIL\n  ${fails.join('\n  ')}` : 'FAIL  none')
process.exit(fails.length ? 1 : 0)
