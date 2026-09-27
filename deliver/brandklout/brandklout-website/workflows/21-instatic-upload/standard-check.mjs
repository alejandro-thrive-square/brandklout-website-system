/**
 * Gate for the standard breakpoints and type scale (2026-09-15): what class-parity.mjs cannot judge.
 *
 * class-system.mjs snaps Sang's widths to the four standard breakpoints and re-bases every font-size
 * on the house fluid root, so below 1440 the class site differs from Sang's file by design, and
 * class-parity.mjs is only meaningful at 1440. This loads both sites at each width and fails on
 * what must never happen:
 *   - the root is not the house root (rootPxAt, scripts/fluid-root.mjs);
 *   - the page scrolls sideways where Sang's did not;
 *   - an element pokes out of the viewport where Sang's did not (ancestors below <body> that clip
 *     are respected; body's own overflow-x is not, or it would hide everything);
 *   - a heading's text overflows its own box (the longest word, fluid-root.md) where Sang's did not.
 * Elements pair by document order: the two DOMs are the same markup with different classes.
 * It also prints the home h1 and first paragraph, class site vs Sang's, at each width.
 *
 * Usage: node standard-check.mjs [width…] [--page slug]
 *        (default widths 1920 1440 1280 1024 768 600 480 390 360)
 */
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'
import { rootPxAt } from '../../../../../scripts/fluid-root.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const SITE = path.join(HERE, '.tmp', 'site')
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const args = process.argv.slice(2)
const flag = (name) => { const i = args.indexOf(name); return i < 0 ? null : args.splice(i, 2)[1] }
const onlyPage = flag('--page')
const widths = args.length ? args.map(Number) : [1920, 1440, 1280, 1024, 768, 600, 480, 390, 360]
const manifest = JSON.parse(fs.readFileSync(path.join(SITE, 'site-src', 'pages.json'), 'utf8'))
const pages = manifest.pages.filter((p) => !onlyPage || p.slug === onlyPage)

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' }
const serve = (root) =>
  new Promise((r) => {
    const s = http.createServer((req, res) => {
      let f = path.join(root, decodeURIComponent(req.url.split('?')[0]))
      if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html')
      if (!fs.existsSync(f)) { res.writeHead(404); return res.end() }
      res.writeHead(200, { 'content-type': MIME[path.extname(f)] ?? 'application/octet-stream' })
      res.end(fs.readFileSync(f))
    })
    s.listen(0, () => r(s))
  })
const A = await serve(path.join(SITE, 'final-site'))
const B = await serve(path.join(SITE, manifest.classSite ?? 'class-site'))
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', protocolTimeout: 600000, args: ['--no-sandbox', '--hide-scrollbars'] })

async function probe(port, file, width) {
  const tab = await browser.newPage()
  await tab.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await tab.setViewport({ width, height: 900 })
  await tab.goto(`http://localhost:${port}/${file}`, { waitUntil: 'networkidle0', timeout: 120000 })
  const r = await tab.evaluate(async () => {
    document.documentElement.style.scrollBehavior = 'auto'
    await document.fonts.ready
    await new Promise((res) => setTimeout(res, 400))
    if (!document.querySelector('h1, h2')) return null // not a real page: about:blank reports a 16px root too
    const vw = document.documentElement.clientWidth
    const els = [...document.querySelectorAll('body *')]
    const clipCache = new Map()
    const clipped = (e) => {
      const p = e.parentElement
      if (!p || p === document.body || p === document.documentElement) return false
      if (clipCache.has(p)) return clipCache.get(p)
      const cs = getComputedStyle(p)
      const v = cs.overflowX !== 'visible' || cs.display === 'none' || clipped(p)
      clipCache.set(p, v)
      return v
    }
    const d = (e) => `${e.localName}.${[...e.classList].slice(0, 2).join('.')} "${(e.textContent || '').trim().slice(0, 30)}"`
    const pokes = []
    const heads = []
    els.forEach((e, i) => {
      if (e.closest('svg') && e.localName !== 'svg') return
      const cs = getComputedStyle(e)
      if (cs.visibility === 'hidden' || cs.display === 'none' || cs.position === 'fixed') return
      const r = e.getBoundingClientRect()
      if (r.width > 0 && r.height > 0 && (r.right > vw + 1 || r.left < -1) && !clipped(e)) pokes.push([i, d(e) + ` ${Math.round(r.left)}..${Math.round(r.right)}`])
      if (/^h[1-4]$/.test(e.localName) && cs.overflowX === 'visible' && e.scrollWidth > e.clientWidth + 1) heads.push([i, d(e) + ` ${e.scrollWidth}>${e.clientWidth}`])
    })
    const h1 = document.querySelector('h1')
    const p = document.querySelector('main p, section p')
    return {
      root: parseFloat(getComputedStyle(document.documentElement).fontSize),
      side: document.documentElement.scrollWidth - vw,
      pokes,
      heads,
      h1: h1 && getComputedStyle(h1).fontSize,
      p: p && getComputedStyle(p).fontSize,
    }
  })
  await tab.close()
  return r
}

let failed = 0
const sizes = []
for (const width of widths) {
  for (const p of pages) {
    const [a, b] = await Promise.all([probe(A.address().port, p.file, width), probe(B.address().port, p.file, width)])
    const issues = []
    if (!a || !b) issues.push(`page did not load (${!a ? "Sang's" : 'class site'})`)
    else {
      const want = rootPxAt(width)
      if (Math.abs(b.root - want) > 0.05) issues.push(`root ${b.root}px, want ${want.toFixed(2)}px`)
      if (b.side > 1 && a.side <= 1) issues.push(`scrolls sideways by ${b.side}px`)
      const had = new Set(a.pokes.map(([i]) => i))
      const newPokes = b.pokes.filter(([i]) => !had.has(i))
      if (newPokes.length) issues.push(`${newPokes.length} element(s) out of the viewport: ${newPokes.slice(0, 3).map(([, s]) => s).join(' | ')}`)
      const hadH = new Set(a.heads.map(([i]) => i))
      const newHeads = b.heads.filter(([i]) => !hadH.has(i))
      if (newHeads.length) issues.push(`${newHeads.length} heading(s) overflow their box: ${newHeads.slice(0, 3).map(([, s]) => s).join(' | ')}`)
      if (p.slug === pages[0].slug) sizes.push(`${String(width).padStart(4)}  root ${b.root.toFixed(2)}  h1 ${a.h1} -> ${b.h1}  p ${a.p} -> ${b.p}`)
    }
    if (issues.length) failed++
    console.log(`${issues.length ? 'FAIL' : 'ok  '} ${String(width).padStart(4)} ${p.slug.padEnd(38)}${issues.length ? '\n      ' + issues.join('\n      ') : ''}`)
  }
}
await browser.close()
A.close()
B.close()
console.log(`\n${pages[0].slug}: Sang's -> class site\n${sizes.join('\n')}`)
console.log(failed ? `\n${failed} page/width(s) fail` : '\nall ok')
process.exit(failed ? 1 : 0)
