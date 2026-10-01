/**
 * Render /hipaa-disclosure the way a visitor sees it and check what a raw-HTML read cannot: the
 * replayed <head> (no canonical pointing at another page), the header bar, the h1 and the entity.
 *
 *   node verify-hipaa.mjs [origin]      default https://www.ifadentistry.com; screenshots to .tmp/
 */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(path.resolve(HERE, '../../../../../../package.json'))
const puppeteer = require('puppeteer-core')
const origin = (process.argv[2] || 'https://www.ifadentistry.com').replace(/\/+$/, '')
const ENTITY = 'Institute for Advanced Dentistry PLLC'
fs.mkdirSync(path.join(HERE, '.tmp'), { recursive: true })

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
let fail = 0
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const page = await browser.newPage()
  await page.setViewport({ width: w, height: h })
  const res = await page.goto(`${origin}/hipaa-disclosure`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 8000))
  const r = await page.evaluate((entity) => {
    const header = document.querySelector('#brx-header > *')
    let bg = ''
    for (const el of document.querySelectorAll('#brx-header > *')) { const c = getComputedStyle(el).backgroundColor; if (c && c !== 'rgba(0, 0, 0, 0)') { bg = c; break } }
    return {
      title: document.title,
      h1: document.querySelector('main h1')?.textContent.trim(),
      canonical: document.querySelector('link[rel=canonical]')?.href ?? null,
      ogUrl: document.querySelector('meta[property="og:url"]')?.content ?? null,
      robots: document.querySelector('meta[name=robots]')?.content ?? null,
      entity: document.body.innerText.includes(entity),
      effective: /Effective Date:\s*October 1, 2026/.test(document.body.innerText),
      stone: /stone|westlake/i.test(document.body.innerText),
      headerBg: bg,
      hasHeader: !!header,
    }
  }, ENTITY)
  const ok = res.status() === 200 && r.h1 === 'HIPAA Disclosure' && r.entity && r.effective && !r.stone &&
    (!r.canonical || /hipaa-disclosure/.test(r.canonical)) && (!r.ogUrl || /hipaa-disclosure/.test(r.ogUrl)) && !/noindex/.test(r.robots ?? '') && r.headerBg
  if (!ok) fail++
  console.log(`${ok ? 'PASS' : 'FAIL'} ${w}px status ${res.status()} ${JSON.stringify(r)}`)
  await page.screenshot({ path: path.join(HERE, '.tmp', `hipaa-${w}.png`) })
  await page.close()
}
await browser.close()
process.exit(fail ? 1 : 0)
