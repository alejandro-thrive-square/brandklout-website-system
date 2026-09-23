// BugHerd round 1: one frame per changed area, at the reviewer's Safari window (1512x652).
import puppeteer from 'puppeteer-core'
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const BASE = process.argv[2] || 'http://localhost:4173/home/'
const OUT = process.argv[3] || '.'
const W = +(process.argv[4] || 1512), H = +(process.argv[5] || 652)
const wait = ms => new Promise(r => setTimeout(r, ms))
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new' })
const p = await b.newPage(); await p.setViewport({ width: W, height: H })
await p.goto(BASE + '?motion=off', { waitUntil: 'networkidle2' })
const at = async (sel, name, block = 'start', off = 0) => { await p.evaluate((s, bl, o) => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelector(s).scrollIntoView({ block: bl }); scrollBy(0, o) }, sel, block, off); await wait(700); await p.screenshot({ path: `${OUT}/${W}-${name}.png` }) }
await at('.ch-arrival', 'hero')
await at('.disc', 'disc-a', 'center')
await p.hover('[data-disc-panel]:nth-child(2)'); await wait(1200); await p.screenshot({ path: `${OUT}/${W}-disc-b.png` })
await at('.specialist', 'specialist', 'start', -80)
await at('.path__rail', 'path', 'center')
await p.evaluate(() => { const v = document.querySelector('.path__viewport'); v.scrollLeft = v.scrollWidth }); await wait(500); await p.screenshot({ path: `${OUT}/${W}-path-end.png` })
await at('.deck', 'proof', 'center')
await at('.invitation', 'invitation', 'start', -40)
await at('.finance', 'finance', 'center')
await at('[data-faq]', 'faq', 'start', -60)
await at('.foot', 'foot', 'end')
await b.close()
