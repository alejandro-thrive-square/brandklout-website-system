/**
 * GATE — does every published page match the WordPress page it was cloned from?
 *
 * For EVERY page in .tmp/wp/pages.json (never a hand-written list: see the memory "gates with
 * hardcoded page lists go blind"), it opens the local mirror (file://, the WordPress render) and
 * the published Instatic page side by side in Chrome, both with prefers-reduced-motion: reduce
 * (Motion.page then skips its tweens and every element sits in its final state, so the two
 * renders are deterministic), scrolls to the bottom to trigger lazy images, and checks:
 *
 *   HARD (fails the gate)
 *   - HTTP 200 and the same <title>
 *   - the runtime ran: jQuery, gsap and bricksData defined; body visibility is not hidden
 *     (Motion.page's CSS hides <body> until its DOMContentLoaded listener runs)
 *   - no broken <img>, no same-origin request answering 4xx/5xx
 *   - the visible text is identical (innerText, whitespace collapsed)
 *   SOFT (reported, with the renders saved for anything over 2%)
 *   - document height difference
 *   - share of pixels that differ in the full-page render
 *   - page errors thrown live that the mirror does not throw
 *
 * Usage:
 *   node verify-live-wp.mjs [--mobile] [--only slug,slug] [--shots] > .tmp/verify.log 2>&1
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import puppeteer from 'puppeteer-core'
import { BASE } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const SITE = path.resolve(HERE, '../01-content-intake/.tmp/current-site-scrape/site')
const OUTDIR = path.join(HERE, '.tmp', 'visual')
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const mobile = process.argv.includes('--mobile')
const shots = process.argv.includes('--shots')
const onlyIx = process.argv.indexOf('--only')
const only = onlyIx > -1 ? new Set(process.argv[onlyIx + 1].split(',')) : null
const VIEW = mobile ? { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true } : { width: 1440, height: 900, deviceScaleFactor: 1 }
const HOST = new URL(BASE).host

fs.mkdirSync(OUTDIR, { recursive: true })
const pages = JSON.parse(fs.readFileSync(path.join(HERE, '.tmp', 'wp', 'pages.json'), 'utf8')).filter((p) => !only || only.has(p.slug))

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--allow-file-access-from-files'] })

async function capture(url, live) {
  const page = await browser.newPage()
  await page.setViewport(VIEW)
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  const errors = []
  const bad = []
  page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 160)))
  page.on('response', (r) => {
    try {
      const u = new URL(r.url())
      if (live && u.host === HOST && r.status() >= 400) bad.push(`${r.status()} ${u.pathname}`)
    } catch {}
  })
  // Only real HTTP failures count. A request the browser ABORTED (a smaller responsive variant
  // superseded by `sizes=auto`, or a script injected by the local network filter) is not the site.
  let status = 0
  try {
    const res = await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 })
    status = res ? res.status() : 0
  } catch (e) {
    errors.push('goto: ' + String(e.message).slice(0, 120))
  }
  // Smooth scrolling defeats scrollTo in headless (memory), so force it off, then walk down.
  await page.evaluate(async () => {
    document.documentElement.style.scrollBehavior = 'auto'
    const step = innerHeight * 0.8
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 120))
    }
    scrollTo(0, 0)
    const until = Date.now() + 8000
    while (Date.now() < until) {
      const pending = [...document.images].filter((i) => i.loading !== 'lazy' || i.getBoundingClientRect().top < document.documentElement.scrollHeight).filter((i) => !i.complete)
      if (!pending.length) break
      await new Promise((r) => setTimeout(r, 200))
    }
    await document.fonts.ready
  }).catch(() => {})
  await new Promise((r) => setTimeout(r, 1200))
  const info = await page.evaluate(() => {
    const text = (document.body.innerText || '').replace(/\s+/g, ' ').trim()
    const broken = [...document.images]
      .filter((i) => i.complete && i.naturalWidth === 0 && i.getAttribute('src') && !i.getAttribute('src').startsWith('data:'))
      .map((i) => i.getAttribute('src').slice(-80))
    return {
      title: document.title,
      height: document.documentElement.scrollHeight,
      text,
      broken,
      jq: typeof window.jQuery,
      gsap: typeof window.gsap,
      bricks: typeof window.bricksData,
      visibility: getComputedStyle(document.body).visibility,
      csp: document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute('content') || '',
      holders: document.querySelectorAll('x-wz-script').length,
    }
  }).catch((e) => ({ error: String(e.message) }))
  const png = await page.screenshot({ fullPage: true, type: 'png' }).catch(() => null)
  await page.close()
  return { status, errors, bad, png, ...info }
}

async function pixelDiff(a, b) {
  const page = await browser.newPage()
  const res = await page.evaluate(
    async (a64, b64) => {
      const load = (s) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + s })
      const [A, B] = await Promise.all([load(a64), load(b64)])
      const w = Math.min(A.width, B.width)
      const h = Math.min(A.height, B.height)
      const draw = (img) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.drawImage(img, 0, 0); return x.getImageData(0, 0, w, h).data }
      const da = draw(A)
      const db = draw(B)
      let diff = 0
      for (let i = 0; i < da.length; i += 4) {
        if (Math.abs(da[i] - db[i]) > 24 || Math.abs(da[i + 1] - db[i + 1]) > 24 || Math.abs(da[i + 2] - db[i + 2]) > 24) diff++
      }
      const total = Math.max(A.width * A.height, B.width * B.height)
      const extra = total - w * h
      return { pct: ((diff + extra) / total) * 100, w, h }
    },
    a.toString('base64'),
    b.toString('base64'),
  )
  await page.close()
  return res
}

const rows = []
let hardFails = 0
for (const p of pages) {
  const liveUrl = BASE + (p.slug === 'index' ? '/' : '/' + p.slug)
  // The reference is the LIVE WordPress page: the file:// mirror cannot run everything (a plugin
  // that fails on file:// leaves a widget uninitialised there and makes the clone look wrong).
  // --mirror compares against the mirror instead, e.g. once WordPress is gone.
  const localUrl = process.argv.includes('--mirror') ? pathToFileURL(path.join(SITE, ...p.rel.split('/'))).href : p.url
  const [L, R] = [await capture(localUrl, false), await capture(liveUrl, true)]
  const hard = []
  if (R.status !== 200) hard.push(`status ${R.status}`)
  if ((R.title || '').trim() !== (L.title || '').trim()) hard.push(`title "${(R.title || '').slice(0, 60)}" != "${(L.title || '').slice(0, 60)}"`)
  // The runtime ran iff every global WordPress defines on this page is defined here too
  // (not every page loads jQuery: no form, no jQuery).
  for (const k of ['jq', 'gsap', 'bricks']) if (L[k] !== 'undefined' && R[k] !== L[k]) hard.push(`runtime ${k}: wp ${L[k]}, live ${R[k]}`)
  if (R.visibility === 'hidden') hard.push('body still visibility:hidden (Motion.page reveal did not run)')
  if (R.holders) hard.push(`${R.holders} script placeholder(s) not replaced`)
  if (R.broken?.length) hard.push(`${R.broken.length} broken img: ${R.broken.slice(0, 3).join(', ')}`)
  if (R.bad?.length) hard.push(`${R.bad.length} bad request(s): ${[...new Set(R.bad)].slice(0, 3).join(', ')}`)
  if (L.text !== R.text) {
    let i = 0
    while (i < L.text.length && L.text[i] === R.text[i]) i++
    hard.push(`text differs at ${i}: wp "${L.text.slice(Math.max(0, i - 30), i + 50)}" | live "${(R.text || '').slice(Math.max(0, i - 30), i + 50)}"`)
  }
  let diff = null
  if (L.png && R.png) diff = await pixelDiff(L.png, R.png)
  const liveOnlyErrors = R.errors.filter((e) => !L.errors.includes(e))
  const heightPct = L.height ? ((R.height - L.height) / L.height) * 100 : 0
  if (hard.length) hardFails++
  if ((diff && diff.pct > 2) || shots) {
    fs.writeFileSync(path.join(OUTDIR, `${p.slug}-${VIEW.width}-wp.png`), L.png)
    fs.writeFileSync(path.join(OUTDIR, `${p.slug}-${VIEW.width}-live.png`), R.png)
  }
  rows.push({ slug: p.slug, hard, diff: diff?.pct ?? null, heightPct, liveOnlyErrors })
  console.log(
    `${hard.length ? 'FAIL' : 'ok  '} ${p.slug.padEnd(50)} px ${diff ? diff.pct.toFixed(2).padStart(6) + '%' : '   n/a'}  h ${heightPct >= 0 ? '+' : ''}${heightPct.toFixed(1)}%` +
      (liveOnlyErrors.length ? `  js: ${liveOnlyErrors.slice(0, 2).join(' | ')}` : '') +
      (hard.length ? `\n       ${hard.join('\n       ')}` : ''),
  )
}
await browser.close()

const px = rows.filter((r) => r.diff !== null).map((r) => r.diff)
console.log(`\n${rows.length} pages at ${VIEW.width}px: ${hardFails} hard failure(s); pixel diff median ${px.length ? px.sort((a, b) => a - b)[Math.floor(px.length / 2)].toFixed(2) : 'n/a'}%, max ${px.length ? Math.max(...px).toFixed(2) : 'n/a'}%`)
fs.writeFileSync(path.join(HERE, '.tmp', `verify-${VIEW.width}.json`), JSON.stringify(rows, null, 1))
process.exitCode = hardFails ? 1 : 0
