import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] })
for (const [route, w] of [['/market-opportunity', 768], ['/market-opportunity', 1024], ['/', 390]]) {
  const p = await b.newPage(); await p.setViewport({ width: w, height: 900 })
  await p.goto('https://brandklout-production.up.railway.app' + route + '?_=' + Date.now(), { waitUntil: 'networkidle0' })
  const r = await p.evaluate(() => { const wrap = document.querySelector('.offer-grid')?.parentElement; return { scrollW: document.documentElement.scrollWidth, vw: innerWidth, wrap: wrap ? { cls: String(wrap.className).slice(0, 40), w: Math.round(wrap.getBoundingClientRect().width), box: getComputedStyle(wrap).boxSizing, width: getComputedStyle(wrap).width } : null } })
  console.log('LIVE', route, w, JSON.stringify(r)); await p.close()
}
await b.close()
