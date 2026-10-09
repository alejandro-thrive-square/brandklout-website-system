#!/usr/bin/env node
/**
 * keyword-gate.mjs — does the live site follow its agreed keyword map? The gate for Scenario 7
 * steps 02–04 and for any copy change on a site that has a map.
 *
 * The map is a CSV (see keyword-map.template.csv): one row per page, `status` target | planned | exempt.
 *
 * FAIL (exit 1):
 *   map    a target/planned row without a primary keyword; two rows with the same primary keyword
 *          (they would compete with each other); a status that is not target/planned/exempt
 *   cover  a sitemap page with no row in the map (every indexable page is either targeted or exempt)
 *   page   a target page that is not 200, is noindex, or canonicalises to another path
 *   h1     not exactly one H1, or the H1 lacks the primary keyword
 *   title  missing, over 60 characters, or lacking the primary keyword
 *   desc   missing, more than one, or outside 120–160 characters
 *   alt    an <img> with no alt attribute (alt="" is fine for decoration)
 *   faq    a FAQPage question that is not visible on the page (Google ignores, then may penalise it)
 * WARN: the description lacks the primary keyword; a planned page already answers 200 (set it to target).
 *
 * "Contains the keyword" = every meaningful word of it is there, in any order: case, punctuation,
 * plurals and VA/Virginia are ignored; in/near/me/best/the… are not required (lib.mjs keywordIn).
 *
 *   node keyword-gate.mjs https://www.client.com --map output/keyword-map.csv [--no-coverage] > output/keyword-gate.log
 * Origin: bk-dr-nahlah 2026-10-07, from the SEO & AEO plan agreed after Trong's review.
 */
import { readFileSync } from 'node:fs'
import { get, sitemapUrls, parsePage, pathOf, keywordIn, normKeyword, phraseIn, readCsv } from './lib.mjs'

const args = process.argv.slice(2)
let origin = null, mapFile = null, coverage = true
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--map') mapFile = args[++i]
  else if (args[i] === '--no-coverage') coverage = false
  else if (/^https?:\/\//.test(args[i])) origin = args[i].replace(/\/+$/, '')
  else throw new Error(`unknown argument ${args[i]}`)
}
if (!origin || !mapFile) { console.error('usage: node keyword-gate.mjs <origin> --map keyword-map.csv [--no-coverage]'); process.exit(2) }

let pass = 0, fail = 0, warn = 0
const FAIL = (kind, where, msg) => { fail++; console.log(`FAIL  ${kind.padEnd(5)} ${where}  ${msg}`) }
const WARN = (kind, where, msg) => { warn++; console.log(`WARN  ${kind.padEnd(5)} ${where}  ${msg}`) }
const check = (cond, kind, where, msg) => { if (cond) pass++; else FAIL(kind, where, msg) }
const normPath = (p) => { p = String(p).trim(); if (/^https?:/.test(p)) p = pathOf(p); p = p.replace(/\/+$/, ''); return p ? (p.startsWith('/') ? p : '/' + p) : '/' }

const rows = readCsv(readFileSync(mapFile, 'utf8'))
if (!rows.length || !('path' in rows[0]) || !('primary_keyword' in rows[0]) || !('status' in rows[0])) {
  console.error(`${mapFile}: needs at least the columns path, primary_keyword, status (see keyword-map.template.csv)`); process.exit(2)
}
for (const r of rows) r.path = normPath(r.path)

// ---- the map itself ------------------------------------------------------------------------
const seen = new Map()
for (const r of rows) {
  const st = r.status.toLowerCase()
  check(['target', 'planned', 'exempt'].includes(st), 'map', r.path, `status "${r.status}" is not target, planned or exempt`)
  if (st === 'exempt') continue
  check(!!r.primary_keyword, 'map', r.path, 'no primary keyword')
  const k = normKeyword(r.primary_keyword)
  if (k && seen.has(k)) FAIL('map', r.path, `same primary keyword as ${seen.get(k)}: "${r.primary_keyword}"`)
  else if (k) { seen.set(k, r.path); pass++ }
}

// ---- coverage: every sitemap page has a row ------------------------------------------------
if (coverage) {
  const live = (await sitemapUrls(origin)).map(pathOf)
  if (!live.length) FAIL('cover', origin, 'no sitemap page found: cannot check coverage (use --no-coverage only if the site has no sitemap)')
  const mapped = new Set(rows.map((r) => r.path))
  for (const p of live) check(mapped.has(p), 'cover', p, 'in the sitemap but not in the map: add a target or exempt row')
}

// ---- each page ------------------------------------------------------------------------------
console.log(`\n${rows.filter((r) => r.status.toLowerCase() === 'target').length} target pages on ${origin}\n`)
for (const r of rows) {
  const st = r.status.toLowerCase()
  if (st === 'exempt') continue
  const { status, text } = await get(origin + (r.path === '/' ? '/' : r.path))
  if (st === 'planned') {
    if (status === 200) WARN('page', r.path, 'planned but already live: set its status to target so the gate checks it')
    else console.log(`todo  ${r.path}  planned: "${r.primary_keyword}"`)
    continue
  }
  if (status !== 200) { FAIL('page', r.path, `answered ${status}`); continue }
  const p = parsePage(text), kw = r.primary_keyword
  check(!/noindex/.test(p.robots), 'page', r.path, `robots "${p.robots}"`)
  if (p.canonical) { let c; try { c = normPath(new URL(p.canonical, origin).pathname) } catch { c = p.canonical } check(c === r.path, 'page', r.path, `canonical points at ${p.canonical}`) }

  check(p.h1s.length === 1, 'h1', r.path, `${p.h1s.length} H1s: ${p.h1s.map((h) => `"${h}"`).join(', ')}`)
  if (p.h1s.length) { const m = keywordIn(kw, p.h1s.join(' ')); check(m.ok, 'h1', r.path, `"${p.h1s[0]}" lacks ${m.missing.join(', ')} (keyword "${kw}")`) }

  check(!!p.title, 'title', r.path, 'no <title>')
  if (p.title) {
    check(p.title.length <= 60, 'title', r.path, `${p.title.length} characters: "${p.title}"`)
    const m = keywordIn(kw, p.title); check(m.ok, 'title', r.path, `"${p.title}" lacks ${m.missing.join(', ')}`)
  }

  const d = p.descriptions
  check(d.length === 1, 'desc', r.path, d.length ? `${d.length} meta descriptions` : 'no meta description')
  if (d[0]) {
    check(d[0].length >= 120 && d[0].length <= 160, 'desc', r.path, `${d[0].length} characters (120–160)`)
    if (!keywordIn(kw, d[0]).ok) WARN('desc', r.path, `lacks "${kw}"`)
  }

  const noAlt = p.imgs.filter((i) => i.alt === null)
  check(!noAlt.length, 'alt', r.path, `${noAlt.length} <img> without alt: ${noAlt.slice(0, 3).map((i) => i.src.split('/').pop()).join(', ')}`)

  const hidden = p.ld.questions.filter((q) => !phraseIn(q, p.visible))
  check(!hidden.length, 'faq', r.path, `FAQPage question(s) not on the page: ${hidden.slice(0, 3).map((q) => `"${q}"`).join('; ')}`)
}

console.log(`\n${fail ? 'FAIL' : 'CLEAN'}  ${pass} passed, ${fail} failed, ${warn} warnings  (${mapFile})`)
process.exit(fail ? 1 : 0)
