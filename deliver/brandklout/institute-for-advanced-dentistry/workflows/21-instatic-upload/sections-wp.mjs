/**
 * DIAGNOSTIC — where does one page's layout diverge between WordPress and the clone?
 *
 * verify-live-wp.mjs says HOW MUCH a page differs; this says WHERE. It measures the box of every
 * Bricks element (`[id^="brxe-"]`, ids survive the import) on the live WordPress page and on the
 * published clone, at one width, with reduced motion, and prints each element whose size differs
 * by more than 2px, top-down. The first line is almost always the cause; the rest are its parents
 * and everything it pushed. Found trap 51 (a portrait 595px instead of 451px) and trap 52 (the map
 * iframe's missing 7px baseline gap).
 *
 * Usage: node sections-wp.mjs <slug> [width] > .tmp/sections.log 2>&1
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'
import { BASE } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const slug = process.argv[2]
const width = Number(process.argv[3] || 1440)
const page = JSON.parse(fs.readFileSync(path.join(HERE, '.tmp', 'wp', 'pages.json'), 'utf8')).find((p) => p.slug === slug)
if (!page) throw new Error(`no page "${slug}" in .tmp/wp/pages.json`)
const WP = page.url
const LIVE = BASE + (slug === 'index' ? '/' : '/' + slug)
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true })

async function measure(url) {
  const tab = await browser.newPage()
  await tab.setViewport(width < 700 ? { width, height: 844, isMobile: true, hasTouch: true } : { width, height: 900 })
  await tab.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await tab.goto(url, { waitUntil: 'networkidle2', timeout: 90000 })
  await tab.evaluate(async () => {
    document.documentElement.style.scrollBehavior = 'auto'
    for (let y = 0; y < document.documentElement.scrollHeight; y += 700) {
      scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 100))
    }
    scrollTo(0, 0)
  })
  await new Promise((r) => setTimeout(r, 2000))
  const rows = await tab.evaluate(() =>
    [...document.querySelectorAll('[id^="brxe-"]')].map((el) => {
      const r = el.getBoundingClientRect()
      return { id: el.id, tag: el.tagName.toLowerCase(), cls: String(el.className).slice(0, 70), top: Math.round(r.top + scrollY), h: Math.round(r.height), w: Math.round(r.width) }
    }),
  )
  await tab.close()
  return rows
}

const [a, b] = [await measure(WP), await measure(LIVE)]
const B = new Map(b.map((r) => [r.id, r]))
let shown = 0
for (const r of a) {
  const o = B.get(r.id)
  if (!o) {
    if (shown++ < 25) console.log('MISSING on the clone', r.id, r.tag, r.cls)
    continue
  }
  if (Math.abs(o.h - r.h) > 2 || Math.abs(o.w - r.w) > 2) {
    if (shown++ < 25) console.log(`${r.id} ${r.tag}.${r.cls}  wp ${r.w}x${r.h}@${r.top}  live ${o.w}x${o.h}@${o.top}`)
  }
}
console.log(`${slug} at ${width}px: compared ${a.length} WordPress elements; ${shown} differ`)
await browser.close()
