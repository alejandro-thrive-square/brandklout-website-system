// THE EMBEDDED FORM, CLICKED. Loads a page carrying [data-embed="ghl-form"],
// waits for the vendor's frame, and asserts the visitor can actually use it:
// the frame exists, it is taller than the slot's minimum, it carries input
// fields, and typing into the first one sticks. Written after the drag-rail
// arrows shipped dead for two weeks — a form is exactly the same kind of thing.
//
// WHAT THIS CANNOT PROVE, AND WHY. The form is behind Cloudflare Turnstile, and
// Turnstile refuses an automated browser: the console says
// "[Cloudflare Turnstile] Error: 600010" and the vendor's script then leaves the
// iframe hidden (opacity 0, left -9999px). That happens under puppeteer whether
// headless or headful, on OUR page and equally on the client's own live form at
// stonedentalimplantcenter.com — so it is the bot check, not the integration.
// This gate therefore asserts everything up to visibility: the slot, the frame,
// its URL, its size, its fields, and that typing into one sticks. SEEING IT is a
// job for a real browser on the real domain, and it is the last step of a push.
//
// Usage: node form-test.mjs [../final-site | https://site]
import puppeteer from 'puppeteer-core'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const target = process.argv[2] || '../final-site'
const live = /^https?:/.test(target)
const MIME = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.png':'image/png','.jpg':'image/jpeg' }
let base = target
let server = null
if (!live) {
  const ROOT = path.resolve(HERE, target)
  server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html'
    const f = path.join(ROOT, p)
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('nf') }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' })
    fs.createReadStream(f).pipe(res)
  })
  await new Promise((r) => server.listen(0, r))
  base = `http://127.0.0.1:${server.address().port}`
}
const ROUTE = live ? '/book' : '/book.html'
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] })
const pg = await browser.newPage()
await pg.setViewport({ width: 1440, height: 900 })
/* NOT networkidle0. The vendor's form holds connections open, so the page never
   goes idle and the navigation times out on a form that is working perfectly. */
await pg.goto(base + ROUTE, { waitUntil: 'domcontentloaded', timeout: 60000 })
const fails = []

const slot = await pg.$('[data-embed="ghl-form"]')
if (!slot) fails.push('no [data-embed="ghl-form"] slot on the page')

// the vendor's frame, by URL, whatever wraps it
await pg.waitForFunction(() => !!document.querySelector('iframe[src*="leadconnectorhq.com/widget/form/"]'), { timeout: 30000 }).catch(() => fails.push('no GHL iframe appeared'))
const box = await pg.evaluate(() => {
  const f = document.querySelector('iframe[src*="leadconnectorhq.com/widget/form/"]')
  if (!f) return null
  const r = f.getBoundingClientRect()
  return { w: Math.round(r.width), h: Math.round(r.height), src: f.getAttribute('src') }
})
if (!box) fails.push('no iframe to measure')
else {
  if (box.h < 300) fails.push(`iframe is ${box.h}px tall — the form collapsed`)
  if (box.w < 300) fails.push(`iframe is ${box.w}px wide`)
}

// inside the frame: real fields, and typing sticks
const frame = pg.frames().find((f) => /leadconnectorhq\.com\/widget\/form\//.test(f.url()))
if (!frame) fails.push('the GHL frame never attached')
else {
  await frame.waitForSelector('input, textarea', { timeout: 30000 }).catch(() => fails.push('no input fields inside the form'))
  const typed = await frame.evaluate(async () => {
    const el = document.querySelector('input[type="text"], input:not([type="hidden"]), textarea')
    if (!el) return null
    el.focus(); el.value = ''
    return { tag: el.tagName.toLowerCase(), name: el.getAttribute('name') || el.getAttribute('data-q') || '(unnamed)' }
  })
  if (!typed) fails.push('no visible field to type into')
  else {
    await frame.type('input[type="text"], input:not([type="hidden"]), textarea', 'Test').catch(() => {})
    const val = await frame.evaluate(() => {
      const el = document.querySelector('input[type="text"], input:not([type="hidden"]), textarea')
      return el ? el.value : null
    })
    if (val !== 'Test') fails.push(`typing did not stick (field ${typed.name} holds ${JSON.stringify(val)})`)
  }
  const fieldCount = await frame.evaluate(() => document.querySelectorAll('input:not([type="hidden"]), textarea, select').length)
  const consent = await frame.evaluate(() => location.search.includes('privacy_'))
  console.log(`frame     ${frame.url().slice(0, 70)}`)
  console.log(`fields    ${fieldCount} visible`)
  console.log(`consent   privacy_* params on the frame URL: ${consent}`)
}
if (box) console.log(`iframe    ${box.w} x ${box.h}`)
await browser.close(); if (server) server.close()
console.log(fails.length ? `\nFAIL\n  ${fails.join('\n  ')}` : '\nFAIL  none — the form renders and accepts input')
process.exitCode = fails.length ? 1 : 0
