// Screenshot the review panels (/ .words_reviews, /results .wall_reviews) with some context.
import puppeteer from 'puppeteer-core'
const [host, w = '1440', tag = 'x'] = process.argv.slice(2)
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' })
for (const [p, sel] of [['/', '.words_reviews'], ['/results', '.wall_reviews']]) {
  const pg = await b.newPage()
  await pg.setBypassCSP(true)
  await pg.setViewport({ width: +w, height: 1000 })
  await pg.goto(host + p, { waitUntil: 'networkidle2', timeout: 90000 })
  await pg.evaluate((s) => { document.documentElement.style.scrollBehavior = 'auto'; const e = document.querySelector(s); window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 200) }, sel)
  await new Promise(r => setTimeout(r, 7000))
  const m = await pg.evaluate((s) => {
    const e = document.querySelector(s), r = e.getBoundingClientRect(), cs = getComputedStyle(e)
    const inner = e.querySelector('[class*="elfsight-app"]') || e.firstElementChild
    const ir = inner.getBoundingClientRect()
    window.scrollTo(0, r.top + scrollY - 120)
    return { h: Math.round(r.height), pad: cs.padding, innerTopGap: Math.round(ir.top - r.top), innerBottomGap: Math.round(r.bottom - ir.bottom), innerH: Math.round(ir.height) }
  }, sel)
  await new Promise(r => setTimeout(r, 1500))
  console.log(p, JSON.stringify(m))
  await pg.screenshot({ path: `.tmp/reviews-${tag}-${p === '/' ? 'home' : 'results'}-${w}.png` })
  await pg.close()
}
await b.close()
