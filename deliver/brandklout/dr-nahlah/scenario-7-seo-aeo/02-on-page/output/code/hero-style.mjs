#!/usr/bin/env node
/**
 * hero-style.mjs — computed style of the home hero headline and its tagline at 1440 and 390, so the
 * H1 move (tagline becomes the keyword H1, #heroTitle becomes a <p>) can be proven invisible.
 *   node hero-style.mjs snapshot <origin> <file>   |   node hero-style.mjs compare <origin> <file>
 * Run from the client folder that has tools/ (puppeteer-core via tools/instatic-site/lib/browser.mjs).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
const [mode, origin, file] = process.argv.slice(2)
const { default: puppeteer, CHROME } = await import(pathToFileURL(resolve('../../tools/instatic-site/lib/browser.mjs')).href)
const KEYS = ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing', 'color', 'maxWidth', 'textTransform']
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
const out = {}
for (const width of [1440, 390]) {
  const page = await browser.newPage()
  await page.setViewport({ width, height: 900 })
  await page.goto(`${origin.replace(/\/$/, '')}/?hs=${Date.now()}`, { waitUntil: 'networkidle2', timeout: 20000 }).catch((e) => { if (e.name !== 'TimeoutError') throw e })
  await new Promise((r) => setTimeout(r, 3000))
  out[width] = await page.evaluate((KEYS) => {
    const pick = (e) => { if (!e) return null; const c = getComputedStyle(e); const b = e.getBoundingClientRect(); return { tag: e.tagName, text: e.textContent.replace(/\s+/g, ' ').trim(), h: Math.round(b.height), w: Math.round(b.width), ...Object.fromEntries(KEYS.map((k) => [k, c[k]])) } }
    const t = document.getElementById('heroTitle')
    return { title: pick(t), em: pick(t && t.querySelector('em')), tagline: pick(document.querySelector('.section_arrival .tagline_component .text-style-tagline')), h1s: [...document.querySelectorAll('h1')].map((h) => h.textContent.replace(/\s+/g, ' ').trim()) }
  }, KEYS)
  await page.close()
}
await browser.close()
if (mode === 'snapshot') { writeFileSync(file, JSON.stringify(out, null, 1)); console.log('snapshot', file); process.exit(0) }
const before = JSON.parse(readFileSync(file, 'utf8'))
let diff = 0
for (const w of [1440, 390]) for (const part of ['title', 'em']) for (const k of [...KEYS, 'h', 'w']) {
  if (before[w][part]?.[k] !== out[w][part]?.[k]) { diff++; console.log(`DIFF  ${part}@${w} ${k}: ${before[w][part]?.[k]} -> ${out[w][part]?.[k]}`) }
}
for (const w of [1440, 390]) console.log(`@${w}: title <${out[w].title?.tag}>, tagline <${out[w].tagline?.tag}> ${out[w].tagline?.fontSize} "${out[w].tagline?.text}", H1s ${JSON.stringify(out[w].h1s)}`)
console.log(diff ? `HEADLINE CHANGED (${diff})` : 'HEADLINE IDENTICAL')
process.exit(diff ? 1 : 0)
