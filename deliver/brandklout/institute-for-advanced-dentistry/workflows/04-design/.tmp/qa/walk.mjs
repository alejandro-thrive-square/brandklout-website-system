#!/usr/bin/env node
// Walks the page with motion ON, one viewport-step at a time, and saves what the visitor
// actually sees at each stop. A full-page capture cannot show a pinned, scrubbed page.
//   node walk.mjs <width> <height> [stepFraction] [url]
// ScrollSmoother is switched off (?smooth=off) so the scroll position is exact; nothing else changes.
import puppeteer from 'puppeteer-core'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const W = Number(process.argv[2]) || 1440
const H = Number(process.argv[3]) || 900
const STEP = Number(process.argv[4]) || 0.5
const URL_ = process.argv[5] || 'http://localhost:4173/home/?smooth=off'
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const OUT = join(HERE, 'walk', String(W))
mkdirSync(OUT, { recursive: true })

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--autoplay-policy=no-user-gesture-required', '--hide-scrollbars'] })
const page = await browser.newPage()
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1, isMobile: W < 768, hasTouch: W < 768 })
const log = []
page.on('console', m => { if (['error', 'warning'].includes(m.type())) log.push(`${m.type()}: ${m.text()}`) })
page.on('pageerror', e => log.push(`pageerror: ${e.message}`))
page.on('requestfailed', r => log.push(`failed: ${r.url()} ${r.failure()?.errorText}`))
page.on('response', r => { if (r.status() >= 400) log.push(`${r.status()}: ${r.url()}`) })

await page.goto(URL_, { waitUntil: 'networkidle2', timeout: 60000 })
await new Promise(r => setTimeout(r, 3500))

const total = await page.evaluate(() => document.documentElement.scrollHeight)
// Against the configured width, not innerWidth: on mobile an overflowing page widens innerWidth with it.
const overflow = await page.evaluate(w => Math.max(document.documentElement.scrollWidth, window.innerWidth) - w, W)
let n = 0
for (let y = 0; y <= total - H + 1; y += Math.round(H * STEP)) {
  await page.evaluate(v => window.scrollTo({ top: v, behavior: 'instant' }), y)
  await new Promise(r => setTimeout(r, 450))
  await page.screenshot({ path: join(OUT, `${String(n).padStart(3, '0')}-y${y}.jpg`), type: 'jpeg', quality: 72 })
  n++
}
writeFileSync(join(OUT, '_report.json'), JSON.stringify({ width: W, height: H, documentHeight: total, horizontalOverflowPx: overflow, stops: n, log }, null, 2))
await browser.close()
