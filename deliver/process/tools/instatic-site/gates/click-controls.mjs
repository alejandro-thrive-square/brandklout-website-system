#!/usr/bin/env node
/**
 * click-controls.mjs — CLICK every interactive control on every page and report the ones whose click
 * changes nothing. Markup, console, computed-style and pixel gates all pass on a control whose
 * listener was never attached; only a driven click finds it.
 *
 * Written 2026-09-23 for tools/instatic-site, generalizing the med spa's
 * workflows/04-design/.tmp/med-spa/site-src/drag-test.mjs (bk-stone-med-spa). The drag-rail arrows there
 * were dead for two weeks (bound with closest() to a SIBLING) while every other gate was green.
 *
 * What counts as a control: button:not([type=submit]), [role=button], [role=tab], summary,
 * [aria-controls], [aria-expanded], [data-drag-next], [data-drag-prev], a[href^="#"]:not([href="#"]).
 * What counts as "something changed", compared before/after each click (900 ms settle):
 *   scrollLeft/scrollTop of every scrollable element and the window, the `open` / aria-expanded /
 *   aria-selected / aria-hidden / class / style of the control, its aria-controls target and their
 *   parents, location.hash, and the number of visible elements.
 * tel: and mailto: links are listed as INFO, not clicked: on a desktop with no handler they look dead
 * and are not (prove with a real click on a phone, then say so).
 *
 * Usage:
 *   node click-controls.mjs [slug ...] [--base https://staging.example.com] [--widths 1440,390]
 *   without --base it serves the local build (SITE_SRC/dist via ../lib/paths.mjs).
 * Exit 1 if any control is dead. Smooth scroll is forced to auto (headless scrollTo is ignored
 * otherwise); the Sienna accessibility widget is blocked, as in the other gates.
 */
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import puppeteer, { CHROME } from '../lib/browser.mjs'
import * as P from '../lib/paths.mjs'

const argv = process.argv.slice(2)
const val = (n) => { const i = argv.indexOf('--' + n); return i >= 0 ? argv.splice(i, 2)[1] : undefined }
const BASE = (val('base') || '').replace(/\/$/, '')
const WIDTHS = (val('widths') || '1440').split(',').map(Number)
const only = argv.filter((a) => !a.startsWith('--'))

let server = null
let local = ''
let pages
if (BASE) {
  pages = only.length ? only.map((s) => ({ slug: s, route: s === 'index' ? '/' : '/' + s })) : P.distPages()
} else {
  const DIST = P.DIST
  const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp4': 'video/mp4' }
  server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0])
    const cands = [p, p + '.html', path.join(p, 'index.html')].map((c) => path.join(DIST, c))
    const f = cands.find((c) => c.startsWith(DIST) && fs.existsSync(c) && fs.statSync(c).isFile())
    if (!f) { res.writeHead(404); return res.end() }
    res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' })
    fs.createReadStream(f).pipe(res)
  })
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  local = `http://127.0.0.1:${server.address().port}`
  pages = P.distPages()
  if (only.length) pages = pages.filter((p) => only.includes(p.slug))
}

const SEL = 'button:not([type=submit]),[role=button],[role=tab],summary,[aria-controls],[aria-expanded],[data-drag-next],[data-drag-prev],a[href^="#"]:not([href="#"])'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
const dead = []
let clicked = 0

for (const pg of pages) {
  for (const width of WIDTHS) {
    const page = await browser.newPage()
    await page.setViewport({ width, height: width < 700 ? 844 : 900 })
    await page.setRequestInterception(true)
    page.on('request', (r) => (/sienna-accessibility/.test(r.url()) ? r.abort() : r.continue()))
    const url = (BASE || local) + pg.route
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 })
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto' })
    await sleep(1500)
    const info = await page.evaluate((SEL) => {
      const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' }
      const els = [...document.querySelectorAll(SEL)].filter(vis)
      els.forEach((el, i) => el.setAttribute('data-cc-id', String(i)))
      const tel = [...document.querySelectorAll('a[href^="tel:"],a[href^="mailto:"]')].map((a) => a.getAttribute('href'))
      return { n: els.length, tel: [...new Set(tel)] }
    }, SEL)
    if (info.tel.length) console.log(`INFO ${pg.route} ${width}: ${info.tel.join(' ')} (not clicked; desktop has no handler)`)

    for (let i = 0; i < info.n; i++) {
      const snap = () => page.evaluate((i) => {
        const el = document.querySelector(`[data-cc-id="${i}"]`)
        if (!el) return null
        const targets = [el, el.parentElement, ...(el.getAttribute('aria-controls') || '').split(/\s+/).filter(Boolean).map((id) => document.getElementById(id))].filter(Boolean)
        const scrolls = [...document.querySelectorAll('*')].filter((n) => n.scrollWidth > n.clientWidth + 1 || n.scrollHeight > n.clientHeight + 1).map((n) => n.scrollLeft + ':' + n.scrollTop)
        const visible = [...document.querySelectorAll('body *')].filter((n) => n.offsetParent !== null).length
        return JSON.stringify([window.scrollX, window.scrollY, location.hash, visible, scrolls,
          targets.map((t) => [t.className && String(t.className), t.getAttribute('style'), t.getAttribute('aria-expanded'), t.getAttribute('aria-selected'), t.getAttribute('aria-hidden'), t.hasAttribute('open'), t.hidden])])
      }, i)
      const label = await page.evaluate((i) => { const el = document.querySelector(`[data-cc-id="${i}"]`); return el ? `${el.tagName.toLowerCase()}${el.className ? '.' + String(el.className).trim().split(/\s+/)[0] : ''} "${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40)}"` : '?' }, i)
      const before = await snap()
      if (before === null) continue
      const ok = await page.evaluate((i) => { const el = document.querySelector(`[data-cc-id="${i}"]`); el.scrollIntoView({ block: 'center' }); return true }, i)
      await sleep(300)
      const mid = await snap()
      try { await page.click(`[data-cc-id="${i}"]`, { delay: 30 }) } catch { await page.evaluate((i) => document.querySelector(`[data-cc-id="${i}"]`)?.click(), i) }
      await sleep(900)
      const after = await snap()
      clicked++
      if (ok && after === mid) dead.push(`${pg.route} @${width}  ${label}`)
      await page.keyboard.press('Escape').catch(() => {})
      if (page.url().split('#')[0] !== url.split('#')[0]) { await page.goto(url, { waitUntil: 'networkidle2' }); await sleep(800) }
    }
    console.log(`${pg.route.padEnd(36)} ${String(width).padStart(4)}  ${info.n} controls`)
    await page.close()
  }
}
await browser.close()
if (server) server.close()
console.log(`\n${clicked} clicks`)
if (dead.length) { console.log(`DEAD (click changed nothing):\n  ${dead.join('\n  ')}`); process.exit(1) }
console.log('DEAD  none')
