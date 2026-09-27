/* "Not scaling properly": open live at one width, resize, and see whether the headings follow.
   With the site-wide sienna widget and with it blocked. */
import puppeteer from 'puppeteer-core'
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' })
const measure = (page) => page.evaluate(() => ({
  h1: getComputedStyle(document.querySelector('h1')).fontSize,
  whyUs: getComputedStyle(document.querySelector('#why-brandklout h2')).fontSize,
  inline: document.querySelector('h1').getAttribute('style'),
  root: getComputedStyle(document.documentElement).fontSize,
}))
for (const [label, block] of [['widget', false], ['no-widget', true]]) {
  for (const [from, to] of [[1440, 390], [390, 1440], [1440, 1920]]) {
    const page = await browser.newPage()
    await page.setRequestInterception(true)
    page.on('request', (r) => (block && /sienna|jsdelivr/.test(r.url()) ? r.abort() : r.continue()))
    await page.setViewport({ width: from, height: 900 })
    await page.goto('https://brandklout-production.up.railway.app/', { waitUntil: 'networkidle2', timeout: 60000 })
    await new Promise((r) => setTimeout(r, 3000))
    const a = await measure(page)
    await page.setViewport({ width: to, height: 900 })
    await new Promise((r) => setTimeout(r, 2000))
    const b = await measure(page)
    console.log(`${label.padEnd(9)} ${from}->${to}: h1 ${a.h1} -> ${b.h1} | whyUs ${a.whyUs} -> ${b.whyUs} | root ${a.root} -> ${b.root} | inline ${b.inline}`)
    await page.close()
  }
}
await browser.close()
