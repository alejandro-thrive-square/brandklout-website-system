/**
 * Gate for class-system.mjs: does the class system render exactly what Sang's stylesheet rendered?
 *
 * Loads every page twice, from .tmp/site/final-site (Sang's CSS, verbatim) and from
 * .tmp/site/class-site (the new classes, emitted the way Instatic emits the registry), and compares
 * element by element: the box (x, y, width, height) and a list of computed properties, for the
 * element and for its ::before and ::after. The two DOMs are the same markup with different class
 * attributes, so elements pair by document order. Reduced motion is emulated so both pages settle.
 *
 * Usage: node class-parity.mjs [width…] [--page slug] [--show N]
 *        (default widths 1440 1024 820 600 390 360)
 * Exit 1 if any page differs. SINCE 2026-09-15 ONLY 1440 MUST BE IDENTICAL: the class system snaps
 * Sang's widths to the standard breakpoints and re-bases type on the house fluid root, so every other
 * width differs by design. Run `class-parity.mjs 1440`, then standard-check.mjs for the rest.
 */
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const SITE = path.join(HERE, '.tmp', 'site')
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const args = process.argv.slice(2)
const flag = (name) => { const i = args.indexOf(name); return i < 0 ? null : args.splice(i, 2)[1] }
const onlyPage = flag('--page')
const show = Number(flag('--show') ?? 6)
const widths = args.length ? args.map(Number) : [1440, 1024, 820, 600, 390, 360]
const manifest = JSON.parse(fs.readFileSync(path.join(SITE, 'site-src', 'pages.json'), 'utf8'))
const pages = manifest.pages.filter((p) => !onlyPage || p.slug === onlyPage)

const PROPS = [
  'display', 'position', 'top', 'right', 'bottom', 'left', 'float', 'z-index', 'box-sizing',
  'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'min-width', 'max-width', 'min-height', 'max-height',
  'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'text-transform', 'text-align', 'text-decoration-line', 'white-space', 'word-break',
  'color', 'background-color', 'background-image', 'background-size', 'background-position', 'background-clip', '-webkit-text-fill-color',
  'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width', 'border-top-style', 'border-top-color', 'border-bottom-color', 'border-left-color', 'border-right-color',
  'border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius',
  'box-shadow', 'opacity', 'visibility', 'transform', 'filter', 'backdrop-filter', 'mix-blend-mode', 'clip-path',
  'overflow-x', 'overflow-y', 'object-fit', 'object-position',
  'flex-direction', 'flex-wrap', 'flex-grow', 'flex-shrink', 'flex-basis', 'justify-content', 'align-items', 'align-self', 'order',
  'grid-template-columns', 'grid-template-rows', 'grid-column-start', 'grid-column-end', 'row-gap', 'column-gap',
  'list-style-type', 'content', 'cursor', 'pointer-events', 'aspect-ratio', 'scroll-snap-type', 'transition-duration', 'animation-name',
]

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

async function capture(port, file, width) {
  const tab = await browser.newPage()
  await tab.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await tab.setViewport({ width, height: 900 })
  await tab.goto(`http://localhost:${port}/${file}`, { waitUntil: 'networkidle0', timeout: 120000 })
  const snap = await tab.evaluate(async (PROPS) => {
    document.documentElement.style.scrollBehavior = 'auto'
    await document.fonts.ready
    await new Promise((r) => setTimeout(r, 500))
    const els = [...document.querySelectorAll('body, body *')].filter((e) => !e.closest('svg') || e.localName === 'svg')
    const out = []
    for (const e of els) {
      const r = e.getBoundingClientRect()
      const rec = { d: `${e.localName}${e.id ? '#' + e.id : ''}.${[...e.classList].slice(0, 3).join('.')} "${(e.textContent || '').trim().slice(0, 40)}"`, box: [r.x, r.y + scrollY, r.width, r.height].map((n) => Math.round(n * 2) / 2).join(','), s: {} }
      for (const pe of [null, '::before', '::after']) {
        const cs = getComputedStyle(e, pe)
        if (pe && (cs.content === 'none' || cs.content === 'normal')) continue
        for (const p of PROPS) rec.s[(pe ?? '') + p] = cs.getPropertyValue(p)
      }
      out.push(rec)
    }
    return { height: document.documentElement.scrollHeight, els: out }
  }, PROPS)
  await tab.close()
  return snap
}

let failed = 0
for (const width of widths) {
  for (const p of pages) {
    const [a, b] = await Promise.all([capture(A.address().port, p.file, width), capture(B.address().port, p.file, width)])
    const diffs = []
    if (a.els.length !== b.els.length) diffs.push(`element count ${a.els.length} vs ${b.els.length}`)
    const n = Math.min(a.els.length, b.els.length)
    let props = 0
    let boxes = 0
    for (let i = 0; i < n; i++) {
      const x = a.els[i]
      const y = b.els[i]
      // A margin reading on an unmoved box is trap 30's noise (`auto` resolved on one side only).
      const bad = Object.keys({ ...x.s, ...y.s }).filter((k) => x.s[k] !== y.s[k] && !(x.box === y.box && /^margin-/.test(k)))
      if (x.box !== y.box) boxes++
      if (bad.length) props++
      // Show the causes, not the containers they pushed: elements whose own properties differ.
      if (bad.length && diffs.length < show) {
        diffs.push(`${x.d}\n        box ${x.box} vs ${y.box}` + bad.slice(0, 6).map((k) => `\n        ${k}: ${x.s[k]} | ${y.s[k]}`).join(''))
      }
    }
    const ok = a.height === b.height && !props && !boxes && a.els.length === b.els.length
    if (!ok) failed++
    console.log(`${ok ? 'ok  ' : 'DIFF'} ${String(width).padStart(4)} ${p.slug.padEnd(38)} height ${a.height}${a.height === b.height ? '' : ' vs ' + b.height}  ${props} el(s) with property differences, ${boxes} moved${diffs.length ? '\n      ' + diffs.join('\n      ') : ''}`)
  }
}
await browser.close()
A.close()
B.close()
console.log(failed ? `\n${failed} page/width(s) differ` : '\nall identical')
process.exit(failed ? 1 : 0)
