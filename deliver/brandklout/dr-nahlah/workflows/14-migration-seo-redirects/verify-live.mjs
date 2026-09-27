#!/usr/bin/env node
/**
 * End-to-end check of what is ACTUALLY deployed at Cloudflare.
 *
 *   node verify-live.mjs
 *
 * Everything else in this folder gates the artefacts. This gates production:
 * it replays all 190 source URLs against the live edge and asserts each lands
 * on the intended target, then checks the three things a redirect map most
 * often gets wrong in ways nothing surfaces:
 *
 *   - a rule shadowing a page that exists (returns 200, serves the WRONG page)
 *   - an unknown URL being swallowed instead of 404ing
 *   - redirect CHAINS, now that apex->www is also live
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const CANONICAL = 'https://www.drnahlah.com'
let pass = 0, fail = 0
const ok = (label, cond, detail = '') => {
  if (cond) { pass++ } else { fail++; console.log(`  FAIL ${label}${detail ? `  — ${detail}` : ''}`) }
}

/** Follow up to `max` hops manually so the chain length is observable. */
async function chase(url, max = 5) {
  const hops = []
  let current = url
  for (let i = 0; i < max; i++) {
    const res = await fetch(current, { redirect: 'manual' })
    const loc = res.headers.get('location')
    hops.push({ url: current, status: res.status, loc })
    if (!loc) break
    current = new URL(loc, current).toString()
  }
  return { hops, final: hops[hops.length - 1], landed: current }
}

const rows = readFileSync(join(HERE, '.tmp', 'out', 'drnahlah-cloudflare-301.csv'), 'utf8')
  .trim().split(/\r?\n/)
  .map((l) => { const [src, tgt] = l.split(','); return { src, tgt } })

console.log(`replaying all ${rows.length} redirect rows against production...`)
const queue = [...rows]
const chains = []
await Promise.all(Array.from({ length: 10 }, async () => {
  while (queue.length) {
    const r = queue.shift()
    const { hops, final, landed } = await chase('https://' + r.src)
    ok(`${r.src} -> ${r.tgt}`, hops[0].status === 301 && landed === r.tgt,
      `first hop ${hops[0].status}, landed ${landed}`)
    if (hops.length > 2) chains.push(`${r.src} took ${hops.length - 1} hops`)
  }
}))
console.log(`  ${pass}/${rows.length} redirect rows correct`)

console.log('\nsubpath matching (the wildcard replacements)')
for (const [src, want] of [
  ['drnahlah.com/2019/05/some-old-post', `${CANONICAL}/`],
  ['drnahlah.com/blog/page/3', `${CANONICAL}/posts`],
  ['drnahlah.com/blog/any-old-article', `${CANONICAL}/posts`],
  ['drnahlah.com/category/dental-care', `${CANONICAL}/posts`],
  ['drnahlah.com/tag/implants', `${CANONICAL}/posts`],
  ['drnahlah.com/author/admin', `${CANONICAL}/meet-dr-nahlah`],
  ['drnahlah.com/wp-json/wp/v2/posts', `${CANONICAL}/`],
]) {
  const { hops, landed } = await chase('https://' + src)
  ok(`${src} -> ${want}`, hops[0].status === 301 && landed === want, `landed ${landed} (${hops[0].status})`)
}

console.log('\npages that must NOT be redirected (rules were dropped for these)')
for (const p of ['/privacy-policy', '/terms-conditions', '/veneers', '/posts', '/crowns-and-bridges', '/thank-you']) {
  const res = await fetch(CANONICAL + p, { redirect: 'manual' })
  ok(`${p} serves 200`, res.status === 200, `got ${res.status}`)
}

console.log('\nhonest 404s (proves the rules are scoped, not swallowing everything)')
for (const p of ['/definitely-not-a-real-url', '/blogx', '/veneers-not-real']) {
  const { final } = await chase(CANONICAL + p)
  ok(`${p} still 404s`, final.status === 404, `got ${final.status}`)
}

console.log('\ncanonical host + sitemap')
{
  const { hops, landed } = await chase('https://drnahlah.com/veneers')
  ok('apex/veneers 301s to www', hops[0].status === 301 && landed === `${CANONICAL}/veneers`, landed)
}
{
  const res = await fetch(`${CANONICAL}/sitemap.xml`)
  const xml = await res.text()
  ok('sitemap 200 + xml content-type', res.status === 200 && /xml/.test(res.headers.get('content-type') ?? ''))
  ok('sitemap has 79 urls', (xml.match(/<loc>/g) || []).length === 79)
}
{
  const res = await fetch(`${CANONICAL}/robots.txt`)
  const txt = await res.text()
  ok('robots.txt is the full content-signals file (not my 70-byte fallback)', txt.length > 1000, `${txt.length} bytes`)
}

if (chains.length) {
  console.log(`\nnote — ${chains.length} row(s) took more than one hop:`)
  for (const c of chains.slice(0, 5)) console.log(`  ${c}`)
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
