/**
 * type-roles-check.mjs — the gate for the Client-First type roles (class-system.mjs, 2026-09-15).
 *
 *   node type-roles-check.mjs [width] [--live] [slug]
 *
 * 1. Registry invariants (site-src/registry.json): `fontSize` appears only on role classes
 *    (`text-size-*`, `heading-style-*`) and the rules class-system left as written; no role or
 *    utility carries `!important`; every role's responsive sizes are on the role itself.
 * 2. Rendering: every element with its own text is measured on Sang's page (final-site) and on the
 *    class site (or the live site with --live) at the width, matched by document order (the DOMs are
 *    the same), and its font-size must be within tolerance of Sang's: 2px for text under 24px, 12%
 *    for display type. Line-height is reported, not gated. The worst ten are printed.
 *
 * Why not class-parity: parity demands identity at 1440, and the roles snap Sang's sizes to a scale
 * on purpose; this gate says how far, and refuses past the tolerance.
 */
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const SITE = path.join(HERE, '.tmp', 'site')
const SRC = path.join(SITE, 'site-src')
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const args = process.argv.slice(2)
const WIDTH = Number(args.find((a) => /^\d+$/.test(a)) ?? 1440)
const LIVE = args.includes('--live')
const only = args.find((a) => !/^\d+$/.test(a) && !a.startsWith('--'))
const manifest = JSON.parse(fs.readFileSync(path.join(SRC, 'pages.json'), 'utf8'))
const pages = manifest.pages.filter((p) => !only || p.slug === only)
const REMOTE = (process.env.INSTATIC_BASE_URL || '').replace(/\/$/, '')
if (LIVE && !REMOTE) { for (const line of fs.readFileSync(path.resolve(HERE, '../../../../..', '.env'), 'utf8').split(/\r?\n/)) { const m = line.match(/^\s*INSTATIC_BASE_URL\s*=\s*(.*)$/); if (m) process.env.INSTATIC_BASE_URL = m[1].replace(/^["']|["']$/g, '') } }
const BASE_LIVE = (process.env.INSTATIC_BASE_URL || '').replace(/\/$/, '')

const fails = []
/* --- 1. registry ------------------------------------------------------------------------------ */
const reg = JSON.parse(fs.readFileSync(path.join(SRC, 'registry.json'), 'utf8'))
const isRole = (r) => /^\.(text-size-|heading-style-)/.test(r.selector)
const isUtility = (r) => /^\.text-(weight|style|family|tracking|lh)-/.test(r.selector)
const rolesMd = fs.existsSync(path.join(SRC, 'type-roles.md')) ? fs.readFileSync(path.join(SRC, 'type-roles.md'), 'utf8') : ''
const leftAsWritten = new Set([...rolesMd.matchAll(/left as written: (.*)/g)].flatMap((m) => m[1].split('; ').map((s) => '.' + s.split(':')[0].trim())))
let roleCount = 0
for (const r of reg.rules) {
  const hasSize = 'fontSize' in (r.styles ?? {}) || Object.values(r.contextStyles ?? {}).some((b) => 'fontSize' in b)
  if (isRole(r)) {
    roleCount++
    if (r.stylePriorities || r.contextStylePriorities) fails.push(`${r.selector}: carries !important`)
    continue
  }
  if (isUtility(r)) { if ('fontSize' in (r.styles ?? {})) fails.push(`${r.selector}: a utility with a font-size`); continue }
  if (hasSize && r.kind === 'class' && !leftAsWritten.has(r.selector)) fails.push(`${r.selector}: font-size outside the roles`)
}
console.log(`registry ${reg.rules.length} rules, ${roleCount} roles, ${reg.rules.filter(isUtility).length} utilities, ${leftAsWritten.size} left as written; ${fails.length ? fails.length + ' invariant failure(s)' : 'invariants ok'}`)

/* --- 2. rendering ----------------------------------------------------------------------------- */
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json' }
// one server per site root: the pages link /assets/site.css root-absolute, so each site needs its own origin
const serve = (root) =>
  new Promise((r) => {
    const s = http.createServer((req, res) => {
      let f = path.join(root, decodeURIComponent(req.url.split('?')[0]))
      if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html')
      if (!fs.existsSync(f)) { res.writeHead(404); return res.end() }
      res.writeHead(200, { 'content-type': mime[path.extname(f)] ?? 'application/octet-stream' })
      res.end(fs.readFileSync(f))
    })
    s.listen(0, () => r(s))
  })
const A = await serve(path.join(SITE, 'final-site'))
const B = await serve(path.join(SITE, manifest.classSite ?? 'class-site'))
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
const measure = async (url) => {
  const p = await browser.newPage()
  await p.setViewport({ width: WIDTH, height: 1000 })
  await p.setJavaScriptEnabled(false)
  await p.goto(url, { waitUntil: 'load', timeout: 120000 })
  // settle: fonts and two frames, or a 200KB stylesheet can still be applying when computed styles are read
  // (scripts are off on the page, so no in-page promise: a plain wait)
  await new Promise((r) => setTimeout(r, 500))
  const out = await p.evaluate(() =>
    [...document.querySelectorAll('body *')]
      .filter((e) => !e.closest('svg,script,style') && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))
      .map((e) => ({ tag: e.localName, cls: e.className && String(e.className).slice(0, 60), text: e.textContent.trim().slice(0, 40), fs: parseFloat(getComputedStyle(e).fontSize), lh: getComputedStyle(e).lineHeight })),
  )
  const styled = await p.evaluate(() => [...document.styleSheets].some((s) => { try { return s.cssRules.length > 50 } catch { return false } }))
  await p.close()
  if (!styled) throw new Error(`${url}: page rendered without its stylesheet`)
  return out
}
// 1440 is the approved design: 2px for text, 12% for display type. Below it Sang's phone sizes were ad hoc
// (a 14px label became 13px here and 17px there) and the roles normalise them on purpose, so the bar is
// 4px / 20% and the distribution is printed for the runbook.
const STRICT = WIDTH >= 1440
const tol = (px) => (px < 24 ? (STRICT ? 2 : 4) : px * (STRICT ? 0.12 : 0.2))
const hist = { '<=1px': 0, '<=2px': 0, '<=3px': 0, '<=4px': 0, '>4px': 0 }
const worst = []
let elements = 0
let bad = 0
for (const p of pages) {
  if (LIVE && p.template) continue // a template page is never served at its slug
  const a = await measure(`http://127.0.0.1:${A.address().port}/${p.file}`)
  const b = LIVE ? await measure(`${BASE_LIVE}${p.slug === 'index' ? '/' : '/' + p.slug}`) : await measure(`http://127.0.0.1:${B.address().port}/${p.file}`)
  // Locally the two DOMs are the same document with different class attributes: pair by index and refuse
  // if the structure ever differs (a search would silently pair the wrong "Reputation"). Live, the
  // importer drops a text node here and there (a submit button's children become its label, trap 38),
  // so a live page may be a few elements short: pair by tag + text within a short window and skip the rest.
  if (!LIVE && a.length !== b.length) { fails.push(`${p.slug}: ${a.length} text elements on Sang's page, ${b.length} on the class site`); continue }
  let pageBad = 0
  let pageMax = 0
  let skipped = 0
  let j = 0
  for (let i = 0; i < a.length; i++) {
    let k = i
    if (LIVE) {
      k = j
      while (k < b.length && k < j + 4 && !(b[k].tag === a[i].tag && b[k].text === a[i].text)) k++
      if (k >= b.length || k >= j + 4) { skipped++; continue }
      j = k + 1
    } else if (b[i].tag !== a[i].tag || b[i].text !== a[i].text) { fails.push(`${p.slug}: element ${i} is <${a[i].tag}> "${a[i].text}" on Sang's page and <${b[i].tag}> "${b[i].text}" on the other`); break }
    const bi = b[k]
    elements++
    const d = Math.abs(a[i].fs - bi.fs)
    pageMax = Math.max(pageMax, d)
    hist[d <= 1 ? '<=1px' : d <= 2 ? '<=2px' : d <= 3 ? '<=3px' : d <= 4 ? '<=4px' : '>4px']++
    if (d > tol(a[i].fs)) { pageBad++; bad++; worst.push({ page: p.slug, d, was: a[i].fs, now: bi.fs, tag: bi.tag, cls: bi.cls, text: a[i].text }) }
  }
  console.log(`${pageBad ? 'FAIL' : 'ok  '} ${WIDTH} ${p.slug.padEnd(40)} ${a.length} text elements, max Δ ${pageMax.toFixed(2)}px${pageBad ? `, ${pageBad} past tolerance` : ''}${skipped ? `, ${skipped} not on the live page` : ''}`)
}
await browser.close()
A.close()
B.close()
worst.sort((x, y) => y.d - x.d)
if (worst.length) console.log('\nworst:\n' + worst.slice(0, 10).map((w) => `  ${w.page} <${w.tag} class="${w.cls}"> "${w.text}": ${w.was}px -> ${w.now}px (Δ ${w.d.toFixed(2)})`).join('\n'))
console.log(`\n${elements} text elements measured at ${WIDTH}${LIVE ? ' (live)' : ''}; ${bad} past tolerance (${STRICT ? '2px / 12%' : '4px / 20%'}); delta distribution ${JSON.stringify(hist)}`)
if (fails.length) { console.log('\nFAIL\n  ' + fails.join('\n  ')); process.exit(1) }
// Below 1440 the count is advisory (the roles normalise Sang's ad hoc phone sizes on purpose); 1440 gates.
console.log(bad ? (STRICT ? `\nFAIL  ${bad} element(s) past tolerance` : `\nWARN  ${bad} element(s) past the advisory bar\nFAIL  none`) : '\nFAIL  none')
process.exit(bad && STRICT ? 1 : 0)
