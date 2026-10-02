#!/usr/bin/env node
/**
 * Prove the live sitemap: www serves it as XML (with and without a query string), byte for
 * byte the build, every <loc> answers 200, robots.txt is still Cloudflare's own, and staging
 * serves none.
 *
 *   node verify-sitemap.mjs      # ends "FAIL  none" or lists what failed; exit code follows
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const built = readFileSync(join(HERE, '.tmp', 'out', 'sitemap.xml'), 'utf8')
const fails = []
const WWW = 'https://www.masonparkdental.com'

for (const url of [`${WWW}/sitemap.xml`, `${WWW}/sitemap.xml?v=${Date.now()}`]) {
  const r = await fetch(url, { redirect: 'manual' })
  const body = await r.text()
  const type = r.headers.get('content-type') || ''
  console.log(`${url}  ${r.status}  ${type}  ${body.length} B`)
  if (r.status !== 200) fails.push(`${url} ${r.status}`)
  if (!/xml/.test(type)) fails.push(`${url} content-type ${type}`)
  if (body !== built) fails.push(`${url} differs from .tmp/out/sitemap.xml`)
}

// The apex must still hand /sitemap.xml to www (one 301), never serve its own.
const apex = await fetch('https://masonparkdental.com/sitemap.xml', { redirect: 'manual' })
console.log(`apex /sitemap.xml  ${apex.status} -> ${apex.headers.get('location')}`)
if (apex.status !== 301 || apex.headers.get('location') !== `${WWW}/sitemap.xml`) fails.push(`apex /sitemap.xml ${apex.status} ${apex.headers.get('location')}`)

const locs = [...built.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
const q = [...locs]
await Promise.all(Array.from({ length: 8 }, async () => {
  while (q.length) {
    const loc = q.shift()
    const r = await fetch(loc, { redirect: 'manual' })
    if (r.status !== 200) fails.push(`${loc} ${r.status}`)
  }
}))
console.log(`<loc> entries: ${locs.length}, all checked`)

// Module 19, trap 1: the Worker must not have taken over robots.txt.
const robots = await fetch(`${WWW}/robots.txt`)
const rb = await robots.text()
console.log(`robots.txt  ${robots.status}  ${rb.length} B`)
if (robots.status !== 200 || !/content signals/i.test(rb)) fails.push(`robots.txt looks replaced (${robots.status}, ${rb.length} B)`)

const st = await fetch('https://staging.masonparkdental.com/sitemap.xml').catch((e) => ({ status: e.message }))
console.log(`staging /sitemap.xml  ${st.status}`)
if (st.status === 200) fails.push('staging serves a sitemap')

console.log(fails.length ? `FAIL\n  ${fails.join('\n  ')}` : 'FAIL  none')
process.exit(fails.length ? 1 : 0)
