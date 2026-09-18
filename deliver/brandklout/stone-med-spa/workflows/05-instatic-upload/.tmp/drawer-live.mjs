/* The drawer's logo, on the live site. visual-diff never opens the drawer, so
   nothing else checks that the published drawer head has a logo in it. */
import puppeteer from 'puppeteer-core'
const BASE = (process.argv[2] || process.env.INSTATIC_BASE_URL || '').replace(/\/$/, '')
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--hide-scrollbars'] })
const p = await b.newPage()
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 })
await p.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 60000 })
await new Promise(r => setTimeout(r, 3000))
await p.evaluate(() => document.querySelector('.navbar_burger').click())
await new Promise(r => setTimeout(r, 1500))
const info = await p.evaluate(() => {
  const img = document.querySelector('.drawer_panel .brand_logo img')
  if (!img) return { found: false }
  const r = img.getBoundingClientRect()
  const cs = getComputedStyle(img)
  return { found: true, w: Math.round(r.width), h: Math.round(r.height), visible: cs.display !== 'none' && cs.opacity !== '0' && r.width > 0, complete: img.complete && img.naturalWidth > 0, src: (img.currentSrc || img.src).split('/').pop() }
})
console.log(BASE, JSON.stringify(info))
import { fileURLToPath } from 'node:url'
await p.screenshot({ path: fileURLToPath(new URL('./drawer-live.png', import.meta.url)), clip: { x: 0, y: 0, width: 390, height: 180 } })
await b.close()
console.log(info.found && info.visible && info.complete ? 'FAIL  none — the drawer head carries the logo' : 'FAIL  the drawer logo is missing or not loaded')
process.exitCode = info.found && info.visible && info.complete ? 0 : 1
