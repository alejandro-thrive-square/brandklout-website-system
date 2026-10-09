#!/usr/bin/env node
/**
 * site-audit.mjs — where a live site stands on the seo-aeo standard, page by page. A report, not a
 * gate: it always exits 0 (keyword-gate.mjs is the gate). Run it first, before anything changes, and
 * keep the JSON as the baseline.
 *
 * Per page: status, title and description length, H1 count and words, H2 count, JSON-LD size, node
 * count, @types and FAQ questions (and whether each question is visible on the page), images without
 * an alt attribute, body words outside header/nav/footer, and how often each --places name appears
 * there (the footer's addresses would otherwise make every page "name" every city).
 *
 *   node site-audit.mjs https://www.client.com --places "McLean,Tysons,Alexandria" \
 *        [--page /extra-path ...] [--out output/site-audit.json] > output/site-audit.md
 *
 * Pages: the sitemap (indexes followed), else the home page and its same-origin links. Redirect stdout
 * to a file on Windows: Node fetch scripts can die on a pipe.
 * Origin: bk-dr-nahlah 2026-10-07 (live-seo-audit.mjs), promoted with the SEO & AEO plan.
 */
import { writeFileSync } from 'node:fs'
import { get, sitemapUrls, parsePage, pathOf, phraseIn } from './lib.mjs'

const args = process.argv.slice(2)
let origin = null, out = null
const extra = [], places = []
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--page') extra.push(args[++i].replace(/^[A-Za-z]:[\\/].*?[\\/]Git[\\/]/, '/'))
  else if (args[i] === '--out') out = args[++i]
  else if (args[i] === '--places') places.push(...args[++i].split(',').map((s) => s.trim()).filter(Boolean))
  else if (/^https?:\/\//.test(args[i])) origin = args[i].replace(/\/+$/, '')
  else throw new Error(`unknown argument ${args[i]}`)
}
if (!origin) { console.error('usage: node site-audit.mjs <origin> [--places "A,B"] [--page /path ...] [--out file.json]'); process.exit(2) }

const urls = [...new Set([...(await sitemapUrls(origin)), ...extra.map((p) => new URL(p, origin + '/').href)])]
if (!urls.length) { console.log(`PROBLEM  ${origin}: no page found (no sitemap, home page unreachable)`); process.exit(0) }

const rows = []
for (const url of urls) {
  const { status, text } = await get(url)
  if (status !== 200) { rows.push({ path: pathOf(url), status }); continue }
  const p = parsePage(text)
  const desc = p.descriptions[0] ?? ''
  rows.push({
    path: pathOf(url), status,
    noindex: /noindex/.test(p.robots),
    title: p.title, titleLen: p.title.length,
    description: desc, descLen: desc.length, descCount: p.descriptions.length,
    h1s: p.h1s, h2s: p.h2s,
    ldKB: +(p.ld.bytes / 1024).toFixed(1), ldNodes: p.ld.nodes, ldErrors: p.ld.errors, types: p.ld.types,
    faq: p.ld.questions.length,
    faqHidden: p.ld.questions.filter((q) => !phraseIn(q, p.visible)),
    imgs: p.imgs.length, noAlt: p.imgs.filter((i) => i.alt === null).map((i) => i.src),
    words: p.words,
    places: Object.fromEntries(places.map((n) => [n, (p.main.match(new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length])),
  })
}
if (out) writeFileSync(out, JSON.stringify({ origin, fetched: new Date().toISOString(), places, rows }, null, 1))

// ---- the report ----------------------------------------------------------------------------
const ok = rows.filter((r) => r.status === 200 && !r.noindex)
const flag = (r) => [
  !r.title && 'no title', r.titleLen > 60 && `title ${r.titleLen}`,
  !r.description && 'no description', r.descCount > 1 && `${r.descCount} descriptions`,
  r.description && (r.descLen < 120 || r.descLen > 160) && `description ${r.descLen}`,
  r.h1s.length !== 1 && `${r.h1s.length} H1`, r.ldErrors && 'JSON-LD does not parse',
  r.faqHidden.length && `${r.faqHidden.length} FAQ question(s) not on the page`, r.noAlt.length && `${r.noAlt.length} img without alt`,
].filter(Boolean).join('; ')

console.log(`# SEO audit · ${origin} · ${new Date().toISOString().slice(0, 10)}\n`)
console.log(`${rows.length} URLs, ${ok.length} indexable 200s, ${rows.length - ok.length} other (non-200 or noindex).\n`)
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0 }
console.log(`- H1: ${ok.filter((r) => r.h1s.length === 1).length} pages with exactly one; ${ok.filter((r) => r.h1s.length !== 1).length} with none or several`)
console.log(`- Titles over 60 characters: ${ok.filter((r) => r.titleLen > 60).length}; descriptions outside 120–160: ${ok.filter((r) => r.description && (r.descLen < 120 || r.descLen > 160)).length}; missing: ${ok.filter((r) => !r.description).length}`)
console.log(`- JSON-LD per page: median ${med(ok.map((r) => r.ldKB))} KB, ${med(ok.map((r) => r.ldNodes))} nodes; pages with a FAQPage: ${ok.filter((r) => r.faq).length}; home page FAQ: ${ok.find((r) => r.path === '/')?.faq ? 'yes' : 'NO'}`)
console.log(`- Body words (outside header/nav/footer): median ${med(ok.map((r) => r.words))}`)
console.log(`- Images without an alt attribute: ${ok.reduce((n, r) => n + r.noAlt.length, 0)} across ${ok.filter((r) => r.noAlt.length).length} pages`)
// A site-wide block outside header/nav/footer tags (an address bar, a CTA band) names a place on every
// page; the lowest count across pages is that boilerplate, so a page "names" a place only above it.
const floor = Object.fromEntries(places.map((n) => [n, Math.min(...ok.map((r) => r.places[n]))]))
if (places.length) console.log(`- Pages naming each place beyond the site-wide blocks (${places.map((n) => `${n} ×${floor[n]}`).join(', ')} on every page): ${places.map((n) => `${n} ${ok.filter((r) => r.places[n] > floor[n]).length}`).join(', ')}`)
console.log('\n| Page | Title | Desc | H1 | H1 text | LD KB | FAQ | Words | ' + places.join(' | ') + (places.length ? ' | ' : '') + 'Flags |')
console.log('| --- | --- | --- | --- | --- | --- | --- | --- | ' + places.map(() => '---').join(' | ') + (places.length ? ' | ' : '') + '--- |')
for (const r of rows) {
  if (r.status !== 200) { console.log(`| ${r.path} | | | | status ${r.status} | | | | ${places.map(() => '').join(' | ')}${places.length ? ' | ' : ''}|`); continue }
  console.log(`| ${r.path}${r.noindex ? ' (noindex)' : ''} | ${r.titleLen} | ${r.descLen} | ${r.h1s.length} | ${(r.h1s[0] || '').replace(/\|/g, '/').slice(0, 70)} | ${r.ldKB} | ${r.faq} | ${r.words} | ${places.map((n) => r.places[n]).join(' | ')}${places.length ? ' | ' : ''}${flag(r)} |`)
}
