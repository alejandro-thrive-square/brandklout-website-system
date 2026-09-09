/* HTTP status of every URL in the Instatic build, against the canonical host. */
import { readFileSync, writeFileSync } from 'node:fs'
const HOST = process.argv[2] || 'https://www.drnahlah.com'
const SYNC = '../15-instatic-api-sync/.tmp'
const pages = JSON.parse(readFileSync(`${SYNC}/inventory-pages.json`, 'utf8'))
const posts = JSON.parse(readFileSync(`${SYNC}/inventory-posts.json`, 'utf8'))

const urls = [
  ...pages.map(p => ({ path: p.slug === 'index' ? '/' : `/${p.slug}`, kind: p.templated ? 'template' : 'page', slug: p.slug })),
  ...posts.map(p => ({ path: `/posts/${p.slug}`, kind: 'post', slug: p.slug, lastmod: p.updatedAt || p.publishedAt })),
]
const out = []
let i = 0
async function one(u) {
  try {
    const r = await fetch(HOST + u.path, { redirect: 'manual' })
    out.push({ ...u, status: r.status, location: r.headers.get('location') || '' })
  } catch (e) { out.push({ ...u, status: 0, location: String(e).slice(0, 80) }) }
  if (++i % 20 === 0) process.stderr.write(`  ${i}/${urls.length}\n`)
}
const queue = [...urls]
await Promise.all(Array.from({ length: 8 }, async () => { while (queue.length) await one(queue.shift()) }))
out.sort((a, b) => a.path.localeCompare(b.path))
writeFileSync('.tmp/live-status.json', JSON.stringify(out, null, 1))
const by = {}
for (const r of out) by[r.status] = (by[r.status] || 0) + 1
console.log('status counts:', JSON.stringify(by))
for (const r of out) if (r.status !== 200) console.log(`  ${r.status} ${r.path} ${r.location}`)
