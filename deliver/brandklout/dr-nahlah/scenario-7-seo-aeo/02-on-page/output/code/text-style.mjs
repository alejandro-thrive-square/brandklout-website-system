#!/usr/bin/env node
/**
 * text-style.mjs — computed style of elements found by their text, at 1440 and 390, so a tag change
 * (an <h1> becoming a <p>, a <span> becoming the keyword <h1>) can be proven invisible.
 *   node text-style.mjs snapshot <url> <file> "<text>" ["<text>" …]
 *   node text-style.mjs compare  <url> <file> "<text>" ["<text>" …]
 * A text given as "old=>new" is looked up by its old text in the snapshot and its new text in the
 * compare; its size (h, w) is not compared, since the words changed.
 * Run from a step folder (puppeteer-core via ../../tools/instatic-site/lib/browser.mjs).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
const [mode, url, file, ...texts] = process.argv.slice(2)
const { default: puppeteer, CHROME } = await import(pathToFileURL(resolve('../../tools/instatic-site/lib/browser.mjs')).href)
const KEYS = ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing', 'color', 'maxWidth', 'textTransform', 'marginTop', 'marginBottom']
const pairs = texts.map((t) => (t.includes('=>') ? t.split('=>') : [t, t]))
const want = pairs.map(([o, n]) => (mode === 'snapshot' ? o : n))
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
const out = {}
for (const width of [1440, 390]) {
  const page = await browser.newPage()
  await page.setViewport({ width, height: 900 })
  await page.goto(`${url}${url.includes('?') ? '&' : '?'}ts=${Date.now()}`, { waitUntil: 'networkidle2', timeout: 20000 }).catch((e) => { if (e.name !== 'TimeoutError') throw e })
  await new Promise((r) => setTimeout(r, 3000))
  out[width] = await page.evaluate((KEYS, want) => {
    const norm = (s) => s.replace(/\s+/g, ' ').trim()
    const pick = (t) => {
      // the first non-div element with exactly this text, in document order: the heading itself, not
      // the wrapper around a tagline nor the line divs a split headline puts inside itself
      const e = [...document.querySelectorAll('main *')].find((x) => x.tagName !== 'DIV' && norm(x.textContent) === t)
      if (!e) return null
      const c = getComputedStyle(e), b = e.getBoundingClientRect()
      return { tag: e.tagName, h: Math.round(b.height), w: Math.round(b.width), ...Object.fromEntries(KEYS.map((k) => [k, c[k]])) }
    }
    return { els: want.map(pick), h1s: [...document.querySelectorAll('h1')].map((h) => norm(h.textContent)) }
  }, KEYS, want)
  await page.close()
}
await browser.close()
if (mode === 'snapshot') { writeFileSync(file, JSON.stringify(out, null, 1)); console.log('snapshot', file); process.exit(0) }
const before = JSON.parse(readFileSync(file, 'utf8'))
let diff = 0
for (const w of [1440, 390]) pairs.forEach(([o, n], i) => {
  const a = before[w].els[i], b = out[w].els[i]
  if (!a || !b) { diff++; console.log(`MISSING  "${!a ? o : n}"@${w}`); return }
  for (const k of [...KEYS, ...(o === n ? ['h', 'w'] : [])]) if (a[k] !== b[k]) { diff++; console.log(`DIFF  "${n}"@${w} ${k}: ${a[k]} -> ${b[k]}`) }
  console.log(`@${w} "${n}": <${a.tag}> -> <${b.tag}>`)
})
for (const w of [1440, 390]) console.log(`@${w} H1s ${JSON.stringify(out[w].h1s)}`)
console.log(diff ? `STYLE CHANGED (${diff})` : 'STYLE IDENTICAL')
process.exit(diff ? 1 : 0)
