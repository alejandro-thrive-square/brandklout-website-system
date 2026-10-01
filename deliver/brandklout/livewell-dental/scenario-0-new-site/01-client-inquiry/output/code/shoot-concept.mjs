#!/usr/bin/env node
/**
 * shoot-concept.mjs: screenshot a concept page (local file or URL) at 1440 and 390, full page,
 * after scrolling it end to end so every ScrollTrigger has fired. Also reports console errors,
 * failed requests, horizontal overflow and broken images, which is what a reviewer would hit.
 *
 *   node shoot-concept.mjs <file.html|url> <outDir> [--widths 1440,390] [--slices]
 *
 * --slices also writes viewport-height JPEG slices (<name>-<w>-NN.jpg) small enough to read.
 * puppeteer-core is borrowed from the capture step's scripts/node_modules (run npm install there).
 * Redirect output to a file on Windows; never pipe Node output.
 */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL, fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const req = createRequire(path.resolve(here, '../../../../scenario-1-migration/01-old-site-capture/scripts/package.json'))
const puppeteer = req('puppeteer-core')

const [target, outDir] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
if (!target || !outDir) { console.error('usage: node shoot-concept.mjs <file|url> <outDir> [--widths 1440,390] [--slices]'); process.exit(2) }
const wi = process.argv.indexOf('--widths')
const WIDTHS = (wi > 0 ? process.argv[wi + 1] : '1440,390').split(',').map(Number)
const SLICES = process.argv.includes('--slices')
const url = /^https?:/.test(target) ? target : pathToFileURL(path.resolve(target)).href
const name = path.basename(target).replace(/\.html?$/, '') || 'page'
fs.mkdirSync(outDir, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--hide-scrollbars', '--autoplay-policy=no-user-gesture-required'],
})
let problems = 0
for (const w of WIDTHS) {
  const page = await browser.newPage()
  const errs = []
  page.on('console', (m) => { if (m.type() === 'error') errs.push(`console: ${m.text()}`) })
  page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`))
  page.on('requestfailed', (r) => { if (!/\.(mp4|webm)/.test(r.url())) errs.push(`failed: ${r.url().slice(0, 140)} ${r.failure()?.errorText}`) })
  await page.setViewport({ width: w, height: w > 600 ? 900 : 844, deviceScaleFactor: 1 })
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 })
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto' })
  // walk the page so scrubbed and triggered chapters reach their end state
  const H = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y <= H; y += 400) { await page.evaluate((v) => window.scrollTo(0, v), y); await new Promise((r) => setTimeout(r, 60)) }
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await new Promise((r) => setTimeout(r, 1200))
  const report = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth
    const wide = [...document.querySelectorAll('body *')].filter((el) => {
      const r = el.getBoundingClientRect(); const cs = getComputedStyle(el)
      return r.right > vw + 2 && cs.position !== 'fixed' && r.width > 0 && !el.closest('[data-allow-overflow]')
    }).slice(0, 8).map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].join('.')} right=${Math.round(el.getBoundingClientRect().right)}`)
    const broken = [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src.slice(0, 120))
    return { scrollW: document.documentElement.scrollWidth, vw, wide, broken, height: document.documentElement.scrollHeight }
  })
  // freeze the end state for a full-page shot: ScrollTrigger pins would otherwise stack
  await page.evaluate(() => window.scrollTo(0, 0))
  await new Promise((r) => setTimeout(r, 600))
  const file = path.join(outDir, `${name}-${w}.png`)
  await page.screenshot({ path: file, fullPage: true })
  if (SLICES) {
    const vh = w > 600 ? 900 : 844
    for (let i = 0, y = 0; y < report.height && i < 40; i++, y += vh) {
      await page.evaluate((v) => window.scrollTo(0, v), y)
      await new Promise((r) => setTimeout(r, 450))
      await page.screenshot({ path: path.join(outDir, `${name}-${w}-${String(i).padStart(2, '0')}.jpg`), type: 'jpeg', quality: 70 })
    }
  }
  const overflow = report.scrollW > report.vw + 1
  if (overflow || report.broken.length || errs.length) problems++
  console.log(`\n== ${name} @${w}: height ${report.height}px, ${overflow ? `OVERFLOW scrollWidth ${report.scrollW} > ${report.vw}` : 'no horizontal overflow'}`)
  for (const x of report.wide) console.log(`  wide: ${x}`)
  for (const x of report.broken) console.log(`  broken image: ${x}`)
  for (const x of errs.slice(0, 15)) console.log(`  ${x}`)
  console.log(`  shot: ${file}`)
  await page.close()
}
await browser.close()
console.log(problems ? `\n${problems} width(s) with problems` : '\nclean')
