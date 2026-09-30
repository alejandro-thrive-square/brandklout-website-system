// Viewport screenshots of the review chapter in context, desktop and phone.
//   SHOT=<dir> node .tmp/elfsight-section-shots.mjs https://staging.westlaketxmedspa.com
import puppeteer from 'puppeteer-core'
const base = process.argv[2]
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--hide-scrollbars'] })
for (const [p, sel] of [['/', '.words_section'], ['/results', '.wall_component']]) {
  for (const w of [1440, 390]) {
    const pg = await browser.newPage()
    await pg.setViewport({ width: w, height: w === 390 ? 844 : 900 })
    await pg.goto(`${base}${p}?shot=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await pg.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto' })
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 1000))
      const ok = await pg.evaluate(() => { const e = document.querySelector('[class*="elfsight-app-"]'); return e && e.getBoundingClientRect().height > 300 })
      if (ok) break
    }
    await pg.evaluate((s) => { document.querySelector(s).scrollIntoView({ block: 'start' }); window.scrollBy(0, -80) }, sel)
    await new Promise((r) => setTimeout(r, 1500))
    const el = await pg.$(sel)
    const box = await el.boundingBox()
    console.log(`${p} @${w}: section ${Math.round(box.height)}px tall`)
    await el.screenshot({ path: `${process.env.SHOT}/${p.replace(/\W/g, '') || 'home'}-${w}.png` })
    await pg.close()
  }
}
await browser.close()
