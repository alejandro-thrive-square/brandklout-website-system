#!/usr/bin/env node
/**
 * hash-live-pages.mjs — sha256 of every published URL on one host, to prove a
 * publish changed nothing but what it meant to (2026-10-01, HIPAA page).
 *
 *   node hash-live-pages.mjs <host> <label>          # writes .tmp/hipaa/hash-<host>-<label>.json
 *   node hash-live-pages.mjs <host> --diff <a> <b>   # every URL whose hash moved
 *
 * The URL set is the sitemap (re-hosted, since staging's points at www) plus
 * every page row slug, so the noindex ads pages the sitemap omits are covered.
 * Published HTML is byte-stable between fetches (checked first), so any moved
 * hash is a real change. Run sequentially: no pipes, no parallel fetch storm.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'

const [host, label, a, b] = process.argv.slice(2)
if (!/^(www|staging)\.drnahlah\.com$/.test(host ?? '')) { console.error('host must be www.drnahlah.com or staging.drnahlah.com'); process.exit(2) }
const file = (l) => `.tmp/hipaa/hash-${host}-${l}.json`

if (label === '--diff') {
  const A = JSON.parse(readFileSync(file(a), 'utf8')), B = JSON.parse(readFileSync(file(b), 'utf8'))
  const keys = [...new Set([...Object.keys(A), ...Object.keys(B)])].sort()
  const moved = keys.filter((k) => A[k]?.sha !== B[k]?.sha || A[k]?.status !== B[k]?.status)
  console.log(`${host}: ${keys.length} URLs, ${moved.length} differ between ${a} and ${b}`)
  for (const k of moved) console.log(`  ${k}  ${A[k]?.status ?? '-'} ${A[k]?.sha?.slice(0, 12) ?? '-'} -> ${B[k]?.status ?? '-'} ${B[k]?.sha?.slice(0, 12) ?? '-'}`)
  process.exit(0)
}

const UA = { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) hash-live-pages' }
const paths = new Set(['/', '/hipaa-disclosure'])
const sm = await (await fetch(`https://${host}/sitemap.xml`, { headers: UA })).text()
for (const m of sm.matchAll(/<loc>([^<]+)<\/loc>/g)) paths.add(new URL(m[1]).pathname)
const pagesFile = `.tmp/hipaa/pages-${host}.json`
if (existsSync(pagesFile)) for (const p of JSON.parse(readFileSync(pagesFile, 'utf8'))) paths.add(p.slug === 'home' || p.slug === 'index' || p.slug === '' ? '/' : `/${p.slug}`)

const out = {}
const dir = `.tmp/hipaa/bodies/${host}-${label}`
mkdirSync(dir, { recursive: true })
for (const p of [...paths].sort()) {
  const res = await fetch(`https://${host}${p}`, { headers: UA, redirect: 'manual' })
  const body = Buffer.from(await res.arrayBuffer())
  out[p] = { status: res.status, bytes: body.length, sha: createHash('sha256').update(body).digest('hex') }
  writeFileSync(`${dir}/${p === '/' ? 'index' : p.slice(1).replaceAll('/', '__')}.html`, body)
}
writeFileSync(file(label), JSON.stringify(out, null, 1))
const by = {}
for (const v of Object.values(out)) by[v.status] = (by[v.status] ?? 0) + 1
console.log(`${host} ${label}: ${Object.keys(out).length} URLs hashed`, JSON.stringify(by))
