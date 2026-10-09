#!/usr/bin/env node
/**
 * snap-pages.mjs: raw published HTML of every page, masked (asset folder ids, bundle hashes, ?v=)
 * and broken one tag per line, so two snapshots diff to exactly what a patch changed.
 *
 *   node snap-pages.mjs snap <dir> [--base <origin>]     # slugs from the live draft
 *   node snap-pages.mjs diff <dirA> <dirB> [--full]      # per page: + / - line counts (--full: the lines)
 */
import fs from 'node:fs'
import path from 'node:path'

const [cmd, a, b] = process.argv.slice(2)
const mask = (html) => html
  .replace(/\/_instatic\/assets\/[A-Za-z0-9_-]+\//g, '/_instatic/assets/~/')
  .replace(/-[A-Z0-9]{8}\.js/g, '-~.js')
  .replace(/-[a-f0-9]{12}\.css/g, '-~.css')
  .replace(/\?v=[\w.-]+/g, '?v=~')
  .replace(/>\s*</g, '>\n<')

if (cmd === 'snap') {
  const { getPages, BASE } = await import('../../tools/instatic-api-sync/insta-api.mjs')
  const i = process.argv.indexOf('--base')
  const origin = i > -1 ? process.argv[i + 1] : BASE
  const slugs = (await getPages()).rows.map((r) => r.slug)
  fs.mkdirSync(a, { recursive: true })
  let n = 0
  for (const s of slugs) {
    const url = `${origin}/${s === 'index' ? '' : s}`
    const r = await fetch(url, { headers: { 'cache-control': 'no-cache' } })
    const body = await r.text()
    fs.writeFileSync(path.join(a, `${(s || 'index').replace(/\//g, '__')}.html`), `<!-- ${r.status} ${url} -->\n` + mask(body))
    n++
  }
  console.log(`${n} pages -> ${a}`)
} else if (cmd === 'diff') {
  const full = process.argv.includes('--full')
  const names = [...new Set([...fs.readdirSync(a), ...fs.readdirSync(b)])].sort()
  for (const f of names) {
    const A = fs.existsSync(path.join(a, f)) ? fs.readFileSync(path.join(a, f), 'utf8').split('\n') : null
    const B = fs.existsSync(path.join(b, f)) ? fs.readFileSync(path.join(b, f), 'utf8').split('\n') : null
    if (!A || !B) { console.log(`${f}  ${A ? 'GONE' : 'NEW'}`); continue }
    const count = (xs) => xs.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map())
    const ca = count(A), cb = count(B)
    const minus = [], plus = []
    for (const [l, k] of ca) for (let i = (cb.get(l) ?? 0); i < k; i++) minus.push(l)
    for (const [l, k] of cb) for (let i = (ca.get(l) ?? 0); i < k; i++) plus.push(l)
    if (!minus.length && !plus.length) continue
    console.log(`${f}  -${minus.length} +${plus.length}`)
    if (full) { for (const l of minus) console.log(`   - ${l.slice(0, 220)}`); for (const l of plus) console.log(`   + ${l.slice(0, 220)}`) }
  }
}
