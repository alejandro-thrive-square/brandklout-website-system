// Does the Elfsight reviews carousel rotate on its own, and does it hold under the pointer? (BugHerd 33, 22)
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
const HERE = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(path.resolve(HERE, '../../../../../../../package.json'))
const puppeteer = require('puppeteer-core')
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' })
const p = await b.newPage()
await p.setViewport({ width: 1512, height: 735 })
await p.goto('https://staging.ifadentistry.com/?smooth=off&cb=' + Date.now(), { waitUntil: 'networkidle2', timeout: 90000 })
await p.evaluate(() => { const e = document.querySelector('.rv-embed'); window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 100) })
await new Promise((r) => setTimeout(r, 6000))
// the first visible review author, read through every shadow root
const first = () => p.evaluate(() => {
  const all = []
  const walk = (root) => { for (const el of root.querySelectorAll('*')) { all.push(el); if (el.shadowRoot) walk(el.shadowRoot) } }
  walk(document.querySelector('.rv-embed'))
  const vw = innerWidth
  const names = all.filter((e) => e.childElementCount === 0 && /\S/.test(e.textContent) && e.textContent.length < 40).map((e) => ({ t: e.textContent.trim(), r: e.getBoundingClientRect() }))
    .filter((x) => x.r.width > 0 && x.r.left >= 0 && x.r.right <= vw && x.r.top > 0 && x.r.top < innerHeight && /\w+ \w+/.test(x.t) && !/ago|Review|Google|Read/.test(x.t))
  names.sort((a, b) => a.r.left - b.r.left)
  return names.slice(0, 2).map((n) => n.t).join(' | ')
})
const seq = []
for (let i = 0; i < 6; i++) { seq.push(await first()); await new Promise((r) => setTimeout(r, 3000)) }
console.log('no pointer, every 3 s:', JSON.stringify(seq))
const box = await p.evaluate(() => { const r = document.querySelector('.rv-embed').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } })
await p.mouse.move(box.x, box.y)
const held = []
for (let i = 0; i < 5; i++) { held.push(await first()); await new Promise((r) => setTimeout(r, 3000)) }
console.log('pointer on it, every 3 s:', JSON.stringify(held))
await b.close()
