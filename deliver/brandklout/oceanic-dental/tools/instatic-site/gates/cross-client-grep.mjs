#!/usr/bin/env node
/**
 * cross-client-grep.mjs — find another practice's data on this site: names, doctors, phones, domains,
 * Vimeo/YouTube ids, addresses. Sister practices (Mason Park vs Mason Park Kids, Stone Surgical Arts
 * vs Stone Med Spa) and the shared agency Vimeo account (Arvada carried Livewell's doctor video) make
 * this a real, repeated failure; no rendering gate notices it because the page looks right.
 *
 * Written 2026-09-23 for tools/instatic-site from those runbook findings (no single origin script).
 *
 * Usage:
 *   node cross-client-grep.mjs --deny deny.json [--dist <dir>] [--base https://staging.example.com]
 * deny.json: { "Mason Park Kids": ["Mason Park Kids", "(281) 578-7100", "masonparkkids.com", "Dr. Nguyen"],
 *              "Livewell": ["vimeo.com/123456789", "Livewell Dental"] }
 *   Case-insensitive substring match. Phones are also matched digits-only. Allowed shared items (the
 *   sister's front desk photo, a deliberate cross-link) go in "allow": ["..."] and are reported as INFO.
 * Scans every .html under the build (SITE_SRC/dist by default) and, with --base, every URL in the live
 * sitemap (or the build's routes if there is no sitemap yet). Exit 1 on any hit.
 */
import fs from 'node:fs'
import path from 'node:path'

const argv = process.argv.slice(2)
const val = (n) => { const i = argv.indexOf('--' + n); return i >= 0 ? argv.splice(i, 2)[1] : undefined }
const DENY = val('deny')
const DIST_ARG = val('dist')
const BASE = (val('base') || '').replace(/\/$/, '')
if (!DENY) { console.error('usage: --deny deny.json [--dist dir] [--base https://host]'); process.exit(2) }
const cfg = JSON.parse(fs.readFileSync(DENY, 'utf8'))
const allow = (cfg.allow || []).map((s) => s.toLowerCase())
const terms = Object.entries(cfg).filter(([k]) => k !== 'allow').flatMap(([owner, list]) => list.map((t) => ({ owner, t })))
const digits = (s) => s.replace(/\D/g, '')

function scan(where, html) {
  const low = html.toLowerCase()
  const dig = digits(html)
  const hits = []
  for (const { owner, t } of terms) {
    const d = digits(t)
    const found = low.includes(t.toLowerCase()) || (d.length === 10 && /^[\d\s().+-]+$/.test(t) && dig.includes(d))
    if (!found) continue
    const i = low.indexOf(t.toLowerCase())
    const ctx = i >= 0 ? html.slice(Math.max(0, i - 60), i + t.length + 60).replace(/\s+/g, ' ') : '(digits match)'
    if (allow.some((a) => ctx.toLowerCase().includes(a))) console.log(`INFO  ${where}  ${owner}: "${t}" (allowed)`)
    else hits.push(`${owner}: "${t}"  …${ctx}…`)
  }
  for (const h of hits) console.log(`HIT   ${where}  ${h}`)
  return hits.length
}

let bad = 0
let n = 0
const dist = DIST_ARG ? path.resolve(DIST_ARG) : (await import('../lib/paths.mjs')).DIST
if (fs.existsSync(dist)) {
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : /\.(html|js|json|css)$/.test(e.name) ? [path.join(d, e.name)] : []))
  for (const f of walk(dist)) { n++; bad += scan(path.relative(dist, f), fs.readFileSync(f, 'utf8')) }
} else console.log(`no local build at ${dist}; live only`)

if (BASE) {
  let urls = []
  const sm = await fetch(BASE + '/sitemap.xml').catch(() => null)
  if (sm && sm.ok) urls = [...(await sm.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => BASE + new URL(m[1]).pathname)
  else if (fs.existsSync(dist)) urls = (await import('../lib/paths.mjs')).distPages(dist).map((p) => BASE + p.route)
  for (const u of urls) {
    const r = await fetch(u)
    if (!r.ok) { console.log(`${r.status}  ${u}`); continue }
    n++
    bad += scan(u, await r.text())
  }
}
console.log(`\n${n} documents scanned, ${bad} hit(s)`)
process.exit(bad ? 1 : 0)
