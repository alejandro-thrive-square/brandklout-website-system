import puppeteer from 'puppeteer-core'
const out = process.argv[2]
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--hide-scrollbars'] })
const p = await b.newPage()
await p.setViewport({ width: 1440, height: 1400, deviceScaleFactor: 1 })
await p.goto('https://brandklout-production.up.railway.app/', { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 1200))
await p.screenshot({ path: `${out}/home-roles-1440.png` })
const info = await p.evaluate(() => ({ h1Font: getComputedStyle(document.querySelector('h1')).fontFamily, bodyFont: getComputedStyle(document.body).fontFamily, fontsLoaded: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family + ' ' + f.weight).slice(0, 8), brokenImgs: [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src).slice(0, 5), imgs: document.images.length }))
console.log(JSON.stringify(info))
await b.close()
