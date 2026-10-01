/**
 * sweep.mjs — every page in seo.json, at 1440 and 390: console errors from our code, failed same-origin
 * requests, horizontal overflow, h1 count, and every internal link resolving to a built page (and every
 * #anchor to an id on its page). Third-party noise (GoHighLevel, Elfsight, Google, Cloudflare challenges)
 * is reported separately, not counted.
 *
 *   node tools/sweep.mjs [--base=http://localhost:4180] [--widths=1440,390] > ../sweep.log 2>&1
 *   exit 1 when anything fails
 */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(path.resolve(HERE, '../../../../../../../../package.json'))
const puppeteer = require('puppeteer-core')
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d }
const BASE = arg('base', 'http://localhost:4180')
const WIDTHS = arg('widths', '1440,390').split(',').map(Number)
const seo = JSON.parse(fs.readFileSync(path.join(HERE, '../seo.json'), 'utf8')).pages
const routes = Object.values(seo).map((p) => p.route)
const known = new Set(routes)
const THIRD = /leadconnectorhq|msgsndr|elfsight|google|gstatic|cloudflare|challenges|bugherd|termly|%c%d/i
// Cloudflare's bot beacon on the zone: a same-origin request to a long random path, failing under headless Chrome
const BEACON = /^\/[A-Za-z0-9_-]{80,}/
const NOT_FOUND_ROUTE = '/404/'   // answers 404 on purpose

const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' })
let fails = 0
const third = new Set()
for (const route of routes) {
  for (const W of WIDTHS) {
    const page = await browser.newPage()
    await page.setViewport({ width: W, height: W < 768 ? 844 : 900, isMobile: W < 768, hasTouch: W < 768 })
    const errs = [], bad = []
    page.on('console', (m) => { if (m.type() === 'error') (THIRD.test(m.text()) || (route === NOT_FOUND_ROUTE && /status of 404/.test(m.text())) ? third.add(m.text().slice(0, 80)) : errs.push(m.text().slice(0, 160))) })
    page.on('pageerror', (e) => errs.push('pageerror ' + e.message.slice(0, 160)))
    page.on('response', (r) => { if (r.status() >= 400) (r.url().startsWith(BASE) && !BEACON.test(r.url().slice(BASE.length)) && !(route === NOT_FOUND_ROUTE && r.url().slice(BASE.length).startsWith(NOT_FOUND_ROUTE)) ? bad.push(r.status() + ' ' + r.url().slice(BASE.length)) : third.add(r.status() + ' ' + r.url().slice(0, 60))) })
    page.on('requestfailed', (r) => { if (r.url().startsWith(BASE) && !BEACON.test(r.url().slice(BASE.length))) bad.push('failed ' + r.url().slice(BASE.length)) })
    try {
      await page.goto(BASE + route + '?smooth=off', { waitUntil: 'networkidle2', timeout: 60000 })
      await new Promise((r) => setTimeout(r, 1500))
      await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)) } })
      await new Promise((r) => setTimeout(r, 800))
      const info = await page.evaluate(() => ({
        over: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        h1: document.querySelectorAll('h1').length,
        links: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')),
        ids: [...document.querySelectorAll('[id]')].map((e) => e.id),
      }))
      const problems = []
      if (info.over > 1) problems.push(`overflow ${info.over}px`)
      if (info.h1 !== 1) problems.push(`${info.h1} h1`)
      if (W === WIDTHS[0]) {
        for (const h of new Set(info.links)) {
          if (/^(https?:|tel:|mailto:)/.test(h)) continue
          if (h.startsWith('#')) { if (h.length > 1 && !info.ids.includes(h.slice(1))) problems.push(`anchor ${h} missing`); continue }
          const p = h.split('#')[0].split('?')[0]
          if (!known.has(p)) problems.push(`link ${h} not built`)
        }
      }
      problems.push(...errs.map((e) => 'console ' + e), ...bad)
      if (problems.length) { fails++; console.log(`FAIL ${route} @${W}: ${problems.join(' | ')}`) }
      else console.log(`ok   ${route} @${W}`)
    } catch (e) { fails++; console.log(`FAIL ${route} @${W}: ${e.message.slice(0, 120)}`) }
    await page.close()
  }
}
await browser.close()
console.log(`\nthird-party noise (not counted): ${[...third].slice(0, 12).join(' ; ')}`)
console.log(`\n${routes.length} pages x ${WIDTHS.length} widths, ${fails} failing`)
process.exit(fails ? 1 : 0)
