#!/usr/bin/env node
/**
 * The hero headline must LOOK the same after it stops being the H1 (keyword-H1 change, 2026-10-06).
 * For the 11 treatment pages at 1440 and 390 wide: the headline's ([data-split] in the hero)
 * computed font, size, line-height, spacing, colour, max-width, its box height, and its <em>'s
 * style; plus the page's H1 count and text.
 *
 *   node seo-v3/hero-look.mjs snapshot [host]   → .tmp/hero-look-<host>.json
 *   node seo-v3/hero-look.mjs compare  [host]   exit 1 on any headline difference, or not exactly one H1
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
const require = createRequire('C:/Users/ACER/orca/workspaces/Brandklout Website System/bk-brandklout-website/node_modules/')
const puppeteer = require('puppeteer-core')

const MODE = process.argv[2]
const S = process.argv[3] || 'https://www.drnahlah.com'
export const SLUGS = ['dental-implants', 'all-on-4', 'implant-supported-dentures', 'crowns-and-bridges', 'veneers', 'teeth-whitening', 'smile-makeover', 'cosmetic-dentistry', 'oral-surgery', 'sedation-dentistry', 'emergency-dentistry']
const FILE = `.tmp/hero-look-${S.replace(/^https?:\/\//, '')}.json`
mkdirSync('.tmp', { recursive: true })

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] })
const out = {}
for (const width of [1440, 390]) {
  const page = await browser.newPage()
  await page.setViewport({ width, height: 900 })
  for (const slug of SLUGS) {
    await page.goto(`${S}/${slug}?look=${Date.now()}`, { waitUntil: 'networkidle2', timeout: 60000 })
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto' })
    await new Promise((r) => setTimeout(r, 2500))   // let the split / reveal animation settle
    out[`${slug}@${width}`] = await page.evaluate(() => {
      const hero = document.querySelector('#hero')
      const el = hero.querySelector('[data-split]')
      const pick = (e) => { const c = getComputedStyle(e); return ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing', 'color', 'maxWidth', 'textTransform', 'marginTop', 'marginBottom'].reduce((o, k) => (o[k] = c[k], o), {}) }
      const em = el.querySelector('em')
      return {
        tag: el.tagName, text: el.textContent.replace(/\s+/g, ' ').trim(), style: pick(el), height: Math.round(el.getBoundingClientRect().height), width: Math.round(el.getBoundingClientRect().width),
        em: em ? pick(em) : null,
        h1s: [...document.querySelectorAll('h1')].map((h) => ({ text: h.textContent.replace(/\s+/g, ' ').trim(), size: getComputedStyle(h).fontSize, inHero: hero.contains(h) })),
        leadTop: Math.round(hero.querySelector('p[class*="lead"]')?.getBoundingClientRect().top ?? -1),
      }
    })
  }
  await page.close()
}
await browser.close()

if (MODE === 'snapshot') { writeFileSync(FILE, JSON.stringify(out, null, 1)); console.log('snapshot', Object.keys(out).length, '→', FILE); process.exit(0) }
const before = JSON.parse(readFileSync(FILE, 'utf8'))
const bad = []
for (const [k, now] of Object.entries(out)) {
  const was = before[k]
  for (const p of Object.keys(was.style)) if (was.style[p] !== now.style[p]) bad.push(`${k}: headline ${p} ${was.style[p]} → ${now.style[p]}`)
  if (JSON.stringify(was.em) !== JSON.stringify(now.em)) bad.push(`${k}: em style changed`)
  if (was.text !== now.text) bad.push(`${k}: headline text changed`)
  if (Math.abs(was.height - now.height) > 1 || Math.abs(was.width - now.width) > 1) bad.push(`${k}: headline box ${was.width}x${was.height} → ${now.width}x${now.height}`)
  if (now.h1s.length !== 1) bad.push(`${k}: ${now.h1s.length} h1`)
  console.log(`${k.padEnd(34)} ${now.tag} | h1: ${now.h1s.map((h) => `"${h.text}" ${h.size}`).join(', ')} | lead moved ${now.leadTop - was.leadTop}px`)
}
console.log(bad.length ? bad.join('\n') : 'HEADLINES IDENTICAL, ONE H1 EACH')
process.exit(bad.length ? 1 : 0)
