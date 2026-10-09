#!/usr/bin/env node
/**
 * HEAD GATE (read-only; promoted 2026-10-06 from the Brandklout website migration). The css/runtime gates look at the rendered
 * page; nothing looks at <head>, and a page write drops the SEO cells the head is built from.
 *
 *   node head-parity.mjs save <label>          # fetch every public URL's HTML into head-<label>/
 *   node head-parity.mjs diff <a> <b>          # title, meta (description, og:*, twitter:*, robots…),
 *                                              # canonical and JSON-LD must be identical per URL
 * URLs: every page row that is not a template, plus every published collection entry (same list
 * as the parity gates: insta-api pageSlugs()). `save` needs --site.
 */
import { writeFileSync, readFileSync, mkdirSync, readdirSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const HERE = dirname(fileURLToPath(import.meta.url))
const [cmd, a, b] = process.argv.slice(2)
const dir = (l) => join(HERE, 'output', `head-${l}`) // label with the client: <client>-before
const fileOf = (l, slug) => join(dir(l), (slug || 'index').replace(/\//g, '__') + '.html')

const headOf = (html) => {
  const head = (html.match(/<head[^>]*>([\s\S]*?)<\/head>/i) ?? [, ''])[1]
  const out = []
  for (const m of head.matchAll(/<title[^>]*>[\s\S]*?<\/title>|<meta\b[^>]*>|<link\b[^>]*rel=["'](?:canonical|alternate|icon|shortcut icon|apple-touch-icon)["'][^>]*>|<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi)) {
    out.push(m[0].replace(/\s+/g, ' ').trim())
  }
  return out
}

if (cmd === 'save' && a) {
  const { connect } = await import(pathToFileURL(join(HERE, 'target.mjs')).href)
  const { api, target } = await connect()
  const slugs = await api.pageSlugs()
  mkdirSync(dir(a), { recursive: true })
  const index = {}
  for (const slug of slugs) {
    const res = await fetch(`${target.url.replace(/\/$/, '')}/${slug}`, { redirect: 'manual' })
    const html = await res.text()
    writeFileSync(fileOf(a, slug), html)
    index[slug || 'index'] = { status: res.status, bytes: html.length, tags: headOf(html).length }
    console.log(`  ${String(res.status)}  /${slug}  ${html.length} bytes, ${index[slug || 'index'].tags} head tags`)
  }
  writeFileSync(join(dir(a), '_index.json'), JSON.stringify(index, null, 1))
  const bad = Object.entries(index).filter(([, v]) => v.status !== 200)
  console.log(`saved ${slugs.length} URL(s) to ${dir(a)}; ${bad.length} not 200${bad.length ? ': ' + bad.map(([k, v]) => `${k}=${v.status}`).join(', ') : ''}`)
  process.exit(0)
}
if (cmd === 'diff' && a && b) {
  const IA = JSON.parse(readFileSync(join(dir(a), '_index.json'), 'utf8'))
  const IB = JSON.parse(readFileSync(join(dir(b), '_index.json'), 'utf8'))
  let fails = 0
  for (const slug of new Set([...Object.keys(IA), ...Object.keys(IB)])) {
    if (!IA[slug] || !IB[slug]) { console.log(`FAIL  ${slug}: only in ${IA[slug] ? a : b}`); fails++; continue }
    if (IA[slug].status !== IB[slug].status) { console.log(`FAIL  ${slug}: status ${IA[slug].status} -> ${IB[slug].status}`); fails++; continue }
    const s = slug === 'index' ? '' : slug
    const x = headOf(readFileSync(fileOf(a, s), 'utf8'))
    const y = headOf(readFileSync(fileOf(b, s), 'utf8'))
    const gone = x.filter((t) => !y.includes(t))
    const added = y.filter((t) => !x.includes(t))
    if (gone.length || added.length || x.join('\n') !== y.join('\n')) {
      fails++
      console.log(`FAIL  ${slug}: ${gone.length} tag(s) gone, ${added.length} new${!gone.length && !added.length ? ' (order differs)' : ''}`)
      for (const t of gone.slice(0, 6)) console.log(`        - ${t.slice(0, 230)}`)
      for (const t of added.slice(0, 6)) console.log(`        + ${t.slice(0, 230)}`)
    }
  }
  console.log(`${fails ? 'FAIL' : 'ok  '}  head-parity ${a} -> ${b}: ${fails} of ${Object.keys(IA).length} URL(s) differ (title, every <meta>, canonical/icons, JSON-LD)`)
  process.exit(fails ? 1 : 0)
}
console.error('usage: head-parity.mjs save <label> --site <client>:staging | diff <a> <b>')
process.exit(2)
