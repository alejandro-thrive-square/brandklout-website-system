#!/usr/bin/env node
/**
 * Drive every built page locally and assert the things a screenshot cannot:
 *   - zero console/page errors, no 4xx subresources
 *   - the runtime armed (WZ.ok, smoother at 1440)
 *   - at least N pinned ScrollTriggers (3 for a designed page, 0 for journal
 *     entries and legal pages — the standard's floor is architectural)
 *   - each pin scrubs: a sampled property differs at 25/50/75% of its range
 *   - no horizontal overflow at 390
 *   - optional: screenshots at six breakpoints (--shots) into
 *     08-qa/.tmp/screenshots/<slug>/<width>.png
 *
 * Usage: node check-local.mjs [slug ...] [--shots] [--widths=1440,390] [--base=https://host]
 *        --base drives the PUBLISHED site instead of the local dist (the live
 *        multi-page gate; verify-motion-live.mjs keeps the homepage's deeper asserts)
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import { fileURLToPath } from 'node:url'

const PUPPETEER_DIR = process.env.PUPPETEER_DIR || 'C:/Users/ACER/orca/workspaces/Brandklout Website System/bk-stone/node_modules/'
const puppeteer = createRequire(PUPPETEER_DIR)('puppeteer-core')
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const HERE = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.resolve(HERE, '../../04-design/.tmp/site-src/dist')
const SHOTS = path.join(HERE, 'screenshots')

const args = process.argv.slice(2)
const shots = args.includes('--shots')
const widthsArg = args.find((a) => a.startsWith('--widths='))
const WIDTHS = widthsArg ? widthsArg.slice(9).split(',').map(Number) : [1440, 390]
const SHOT_WIDTHS = [360, 390, 768, 1024, 1440, 1920]
const only = args.filter((a) => !a.startsWith('--'))
const BASE_ARG = (args.find((a) => a.startsWith('--base=')) || '').slice(7).replace(/\/$/, '')

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' }
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0])
  if (p === '/') p = '/index.html'
  const f = path.join(DIST, p)
  if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' })
  fs.createReadStream(f).pipe(res)
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const PORT = server.address().port
const urlFor = (slug) => (BASE_ARG ? `${BASE_ARG}/${slug === 'index' ? '' : slug}` : `http://127.0.0.1:${PORT}/${slug === 'index' ? '' : slug + '.html'}`)

const walk = (d, pre = '') => fs.readdirSync(d).flatMap((e) => (fs.statSync(path.join(d, e)).isDirectory() ? walk(path.join(d, e), pre + e + '/') : e.endsWith('.html') ? [pre + e.replace(/\.html$/, '')] : []))
let slugs = walk(DIST).sort()
if (only.length) slugs = slugs.filter((s) => only.includes(s))
// the ads set's consultation (form first) and thank-you (phone first) pages are short by design: scenario 3, 02-build-the-combo.md
const LIGHT = (s) => /^blog\/|^privacy-policy$|^hipaa-disclosure$|^accessibility$|^thank-you$|^blog$|^ads-landing-pages\/(.*-consultation|thank-you-.*)$/.test(s)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, protocolTimeout: 300000, args: ['--no-sandbox', '--disable-gpu', '--autoplay-policy=no-user-gesture-required'] })
const fails = []
const summary = []

for (const slug of slugs) {
  for (const width of WIDTHS) {
    const height = width < 700 ? 844 : 900
    const page = await browser.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message))
    page.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url().replace(/^http:\/\/127\.0\.0\.1:\d+/, '')}`) })
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') { const t = m.text(); if (!/Failed to load resource/i.test(t)) errors.push(m.type() + ' ' + t) } })
    if (BASE_ARG) { await page.setRequestInterception(true); page.on('request', (r) => (/sienna-accessibility/.test(r.url()) ? r.abort() : r.continue())) }
    await page.setViewport({ width, height })
    await page.goto(urlFor(slug), { waitUntil: 'networkidle0', timeout: 90000 })
    await sleep(1800)
    const info = await page.evaluate(() => ({
      ok: !!(window.WZ && WZ.ok), smoother: !!(window.WZ && WZ.smoother), active: window.WZ ? WZ.active : [],
      chapters: document.querySelectorAll('section[data-chapter]').length,
      pins: window.ScrollTrigger ? ScrollTrigger.getAll().filter((t) => t.pin).map((t) => ({ id: t.trigger.id || t.trigger.className, start: Math.round(t.start), end: Math.round(t.end) })) : [],
      h1: document.querySelectorAll('h1').length,
      title: document.title,
      seo: !!document.querySelector('link[rel="canonical"]') && !!document.querySelector('script[type="application/ld+json"]'),
      scrollWidth: document.documentElement.scrollWidth, client: document.documentElement.clientWidth,
      wide: [...document.querySelectorAll('body *')].filter((el) => el.getBoundingClientRect().right > document.documentElement.clientWidth + 1).slice(0, 6).map((el) => el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0] + ' r=' + Math.round(el.getBoundingClientRect().right)),
    }))
    const want = LIGHT(slug) ? 0 : 3
    const line = `${slug.padEnd(34)} ${String(width).padStart(4)}  ch=${info.chapters} pins=${info.pins.length} h1=${info.h1} ${info.ok ? 'ok' : 'NO-WZ'}${width >= 1440 ? (info.smoother ? ' smooth' : ' NOSMOOTH') : ''}${info.seo ? ' seo' : ' NOSEO'} ${info.scrollWidth > info.client + 1 ? 'OVERFLOW ' + info.scrollWidth : ''}`
    summary.push(line)
    if (!info.ok) fails.push(`[${slug} ${width}] runtime did not arm`)
    if (width >= 1440 && !info.smoother) fails.push(`[${slug} ${width}] no ScrollSmoother`)
    if (info.h1 !== 1) fails.push(`[${slug} ${width}] ${info.h1} <h1>`)
    if (!LIGHT(slug) && (info.chapters < 6 || info.chapters > 8)) fails.push(`[${slug}] ${info.chapters} chapters (need 6–8)`)
    if (width >= 1024 && info.pins.length < want) fails.push(`[${slug} ${width}] ${info.pins.length} pins, need ${want}`)
    if (info.scrollWidth > info.client + 1) fails.push(`[${slug} ${width}] horizontal overflow ${info.scrollWidth} > ${info.client}: ${info.wide.join(' | ')}`)

    /* scrub proof: for every pin, sample a fingerprint of the pinned element's
       subtree at 25/50/75% and demand three different states */
    if (width >= 1024) {
      const go = async (y) => { await page.evaluate((y) => { if (window.WZ && WZ.smoother) WZ.smoother.scrollTo(y, false); else window.scrollTo(0, y) }, y); await sleep(900) }
      for (const p of info.pins) {
        const states = []
        for (const f of [0.25, 0.5, 0.75]) {
          await go(p.start + (p.end - p.start) * f)
          states.push(await page.evaluate((id) => {
            const el = document.getElementById(id) || document.querySelector('.' + String(id).split(' ')[0])
            if (!el) return 'none'
            const fp = []
            el.querySelectorAll('*').forEach((n, i) => { if (i > 400) return; const cs = getComputedStyle(n); fp.push(cs.opacity + cs.transform + cs.clipPath + cs.display + n.textContent.length) })
            return fp.join('|')
          }, p.id))
        }
        if (states[0] === states[1] && states[1] === states[2]) fails.push(`[${slug} ${width}] pin "${p.id}" does not scrub (identical at 25/50/75%)`)
      }
      await go(0)
    }
    if (errors.length) fails.push(`[${slug} ${width}] ${errors.length} error(s): ` + errors.slice(0, 6).join(' || '))

    if (shots && width === WIDTHS[0]) {
      for (const w of SHOT_WIDTHS) {
        const pg = await browser.newPage()
        await pg.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
        await pg.setViewport({ width: w, height: w < 700 ? 844 : 900 })
        await pg.goto(urlFor(slug), { waitUntil: 'networkidle0', timeout: 90000 })
        await pg.evaluate(async () => { await new Promise((r) => { let y = 0; const t = setInterval(() => { y += 700; window.scrollTo(0, y); if (y > document.body.scrollHeight) { clearInterval(t); window.scrollTo(0, 0); r() } }, 60) }) })
        await sleep(800)
        const dir = path.join(SHOTS, slug.replace('/', '__'))
        fs.mkdirSync(dir, { recursive: true })
        await pg.screenshot({ path: path.join(dir, `${w}.png`), fullPage: true, captureBeyondViewport: true })
        await pg.close()
      }
    }
    await page.close()
  }
}
await browser.close()
server.close()
console.log(summary.join('\n'))
if (fails.length) { console.log('\nFAIL\n  ' + fails.join('\n  ')); process.exit(1) }
console.log('\nFAIL  none')
