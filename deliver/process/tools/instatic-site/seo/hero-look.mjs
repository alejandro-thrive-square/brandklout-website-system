#!/usr/bin/env node
/**
 * hero-look.mjs — the proof gate of push-keyword-h1.mjs: the designed headline must LOOK the same
 * after it stops being the H1. Per page and width (keywordH1.widths, default 1440 and 390): the
 * headline's computed font, size, weight, style, line-height, spacing, colour, max-width,
 * text-transform and margins, its box, its <em>'s style, the page's H1s, and how far the lead line
 * below moved.
 *
 *   node hero-look.mjs snapshot [host] [--pages /a,/b | --map keyword-map.csv]   → <out>/hero-look-<host>.json
 *   node hero-look.mjs compare  [host]      exit 1 on any headline difference, or not exactly one H1
 *
 * Take the snapshot BEFORE --apply, compare after the publish (staging first). Pages: --pages, else
 * the keyword map's target rows. A page with no headline ([keywordH1.headlineAttr] inside the hero:
 * keywordH1.heroSelector, else a .heroClass) is recorded as such and not compared.
 * Needs puppeteer-core and Chrome (../lib/browser.mjs). Read-only.
 * Promoted 2026-10-07 from bk-dr-nahlah workflows/22-instatic-api-sync/seo-v3/hero-look.mjs.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import puppeteer, { CHROME } from '../lib/browser.mjs'
import { loadConfig, configPath, outDir, arg, pagePaths } from './lib/seo-config.mjs'
import { readCsv } from '../../seo-aeo/lib.mjs'

const C = loadConfig()
const K = C.keywordH1
const MODE = process.argv[2]
if (!['snapshot', 'compare'].includes(MODE)) { console.error('mode: snapshot | compare'); process.exit(2) }
const S = (process.argv[3] && /^https?:\/\//.test(process.argv[3]) ? process.argv[3] : C.site.origin).replace(/\/+$/, '')
const OUT = outDir()
mkdirSync(OUT, { recursive: true })
const FILE = join(OUT, `hero-look-${S.replace(/^https?:\/\//, '')}.json`)
const before = MODE === 'compare' ? (existsSync(FILE) ? JSON.parse(readFileSync(FILE, 'utf8')) : null) : null
if (MODE === 'compare' && !before) { console.error(`no snapshot ${FILE}: run snapshot before the change`); process.exit(2) }

let paths
if (before) paths = [...new Set(Object.keys(before).map((k) => k.split('@')[0]))]
else if (arg('--pages')) paths = pagePaths(arg('--pages'))
else {
  const f = resolve(process.cwd(), arg('--map', configPath(C, C.files.keywordMap)))
  if (!existsSync(f)) { console.error(`no keyword map at ${f}: pass --pages or --map`); process.exit(2) }
  paths = readCsv(readFileSync(f, 'utf8')).filter((r) => r.status.toLowerCase() === 'target').map((r) => r.path)
}
const heroSel = K.heroSelector || K.heroClass.map((c) => '.' + c).join(', ')
const attr = K.headlineAttr
const leadSel = K.leadSelector || 'p[class*="lead"]'

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
const out = {}
for (const width of K.widths) {
  const page = await browser.newPage()
  await page.setViewport({ width, height: 900 })
  for (const p of paths) {
    await page.goto(`${S}${p === '/' ? '/' : p}?look=${Date.now()}`, { waitUntil: 'networkidle2', timeout: 60000 })
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto' })
    await new Promise((r) => setTimeout(r, 2500)) // let the split / reveal animation settle
    out[`${p}@${width}`] = await page.evaluate((heroSel, attr, leadSel) => {
      const hero = document.querySelector(heroSel)
      const el = hero && hero.querySelector(`[${attr}]`)
      const h1s = [...document.querySelectorAll('h1')].map((h) => ({ text: h.textContent.replace(/\s+/g, ' ').trim(), size: getComputedStyle(h).fontSize, inHero: !!hero && hero.contains(h) }))
      if (!el) return { missing: !hero ? 'no hero' : 'no headline', h1s }
      const pick = (e) => { const c = getComputedStyle(e); return ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing', 'color', 'maxWidth', 'textTransform', 'marginTop', 'marginBottom'].reduce((o, k) => (o[k] = c[k], o), {}) }
      const em = el.querySelector('em')
      const b = el.getBoundingClientRect()
      return {
        tag: el.tagName, text: el.textContent.replace(/\s+/g, ' ').trim(), style: pick(el), height: Math.round(b.height), width: Math.round(b.width),
        em: em ? pick(em) : null, h1s, leadTop: Math.round(hero.querySelector(leadSel)?.getBoundingClientRect().top ?? -1),
      }
    }, heroSel, attr, leadSel)
  }
  await page.close()
}
await browser.close()

if (MODE === 'snapshot') {
  writeFileSync(FILE, JSON.stringify(out, null, 1))
  const miss = Object.entries(out).filter(([, v]) => v.missing)
  console.log(`snapshot ${Object.keys(out).length} → ${FILE}${miss.length ? `\n${miss.length} without a headline (not compared later): ${[...new Set(miss.map(([k]) => k.split('@')[0]))].join(', ')}` : ''}`)
  process.exit(0)
}
const bad = []
for (const [k, now] of Object.entries(out)) {
  const was = before[k]
  if (!was || was.missing) { console.log(`${k.padEnd(40)} not compared (${was ? was.missing : 'not in the snapshot'})`); continue }
  if (now.missing) { bad.push(`${k}: ${now.missing} now`); continue }
  for (const p of Object.keys(was.style)) if (was.style[p] !== now.style[p]) bad.push(`${k}: headline ${p} ${was.style[p]} → ${now.style[p]}`)
  if (JSON.stringify(was.em) !== JSON.stringify(now.em)) bad.push(`${k}: em style changed`)
  if (was.text !== now.text) bad.push(`${k}: headline text changed`)
  if (Math.abs(was.height - now.height) > 1 || Math.abs(was.width - now.width) > 1) bad.push(`${k}: headline box ${was.width}x${was.height} → ${now.width}x${now.height}`)
  if (now.h1s.length !== 1) bad.push(`${k}: ${now.h1s.length} h1`)
  console.log(`${k.padEnd(40)} ${now.tag} | h1: ${now.h1s.map((h) => `"${h.text}" ${h.size}`).join(', ')} | lead moved ${now.leadTop - was.leadTop}px`)
}
console.log(bad.length ? bad.join('\n') : 'HEADLINES IDENTICAL, ONE H1 EACH')
process.exit(bad.length ? 1 : 0)
