/**
 * walk.mjs — look at a page the way a visitor scrolls it: viewport frames every N% of the page, motion ON
 * (?smooth=off so window.scrollTo is exact), plus console errors, failed requests and horizontal overflow.
 *
 *   node tools/walk.mjs <route> [width=1440] [frames=10] [--base=http://localhost:4180] [--full]
 *   out: ../../shots/<slug>-<width>-NN.jpg (and -full.jpg with --full, motion off), report on stdout
 *
 * Needs puppeteer-core (the worktree's, or PUPPETEER_DIR) and Chrome (CHROME_PATH).
 */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(process.env.PUPPETEER_DIR ? path.join(process.env.PUPPETEER_DIR, 'x.js') : import.meta.url)
let puppeteer
for (const p of [process.env.PUPPETEER_DIR, path.resolve(HERE, '../../../../../workflows/04-design/.tmp/qa'), process.cwd()].filter(Boolean)) {
  try { puppeteer = createRequire(path.join(p, 'x.js'))('puppeteer-core'); break } catch {}
}
if (!puppeteer) puppeteer = require('puppeteer-core')

const args = process.argv.slice(2)
const flag = (n, d) => { const a = args.find((x) => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d }
const pos = args.filter((a) => !a.startsWith('--'))
const route = pos[0] || '/'
const W = Number(pos[1] || 1440), N = Number(pos[2] || 10)
const BASE = flag('base', 'http://localhost:4180')
const OUT = path.resolve(HERE, '../../../shots')
fs.mkdirSync(OUT, { recursive: true })
const slug = route.replace(/^\/|\/$/g, '').replace(/\//g, '__') || 'index'
const H = W < 768 ? 844 : W < 1100 ? 1024 : 900

const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: W, height: H, isMobile: W < 768, hasTouch: W < 768, deviceScaleFactor: 1 })
const errors = [], failed = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)) })
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message.slice(0, 200)))
page.on('requestfailed', (r) => failed.push(r.url()))
page.on('response', (r) => { if (r.status() >= 400) failed.push(r.status() + ' ' + r.url()) })
await page.goto(BASE + route + '?smooth=off', { waitUntil: 'networkidle0', timeout: 60000 })
await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto' })
await new Promise((r) => setTimeout(r, 2600))
const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)
for (let i = 0; i < N; i++) {
  const y = Math.round(total * i / Math.max(1, N - 1))
  await page.evaluate((y) => window.scrollTo(0, y), y)
  await new Promise((r) => setTimeout(r, 1300))
  await page.screenshot({ path: path.join(OUT, `${slug}-${W}-${String(i).padStart(2, '0')}.jpg`), quality: 60, type: 'jpeg' })
}
const report = await page.evaluate(() => {
  const vw = document.documentElement.clientWidth
  const wide = [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.right > vw + 1 && getComputedStyle(e).position !== 'fixed' && r.width > 0 }).slice(0, 8).map((e) => e.tagName + '.' + [...e.classList].join('.'))
  return { scrollW: document.documentElement.scrollWidth, vw, wide, pins: window.ScrollTrigger ? ScrollTrigger.getAll().filter((t) => t.pin).length : 0, triggers: window.ScrollTrigger ? ScrollTrigger.getAll().length : 0, h1: document.querySelectorAll('h1').length }
})
if (args.includes('--full')) {
  await page.goto(BASE + route + '?motion=off', { waitUntil: 'networkidle0' })
  await new Promise((r) => setTimeout(r, 800))
  await page.screenshot({ path: path.join(OUT, `${slug}-${W}-full.jpg`), fullPage: true, quality: 50, type: 'jpeg' })
}
await browser.close()
console.log(JSON.stringify({ route, W, height: total + H, ...report, errors, failed: [...new Set(failed)].slice(0, 10) }, null, 1))
