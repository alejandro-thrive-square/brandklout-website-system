import puppeteer from 'puppeteer-core'
const out = process.argv[2]
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--hide-scrollbars'] })
for (const [w, h] of [[1440, 1600], [390, 1800]]) {
  const p = await b.newPage()
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 1 })
  await p.goto('https://brandklout-production.up.railway.app/legal/privacy', { waitUntil: 'networkidle0' })
  await new Promise((r) => setTimeout(r, 800))
  await p.screenshot({ path: `${out}/legal-privacy-${w}.png` })
  const info = await p.evaluate(() => ({ h1: getComputedStyle(document.querySelector('h1')).fontSize, h3: getComputedStyle(document.querySelector('.legal h3')).fontSize, p: getComputedStyle(document.querySelector('.legal p')).fontSize, li: getComputedStyle(document.querySelector('.legal li')).listStyleType, noteDisplay: getComputedStyle(document.querySelector('.legal-note')).display, scrollW: document.documentElement.scrollWidth, innerW: innerWidth }))
  console.log(w, JSON.stringify(info))
  await p.close()
}
await b.close()
