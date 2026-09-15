/* Seq 24: each restored admin edit on the live site, and the hero paragraph's margin. Elements are
   found by content and ids, not Sang's class names: the class system renamed those. */
import puppeteer from 'puppeteer-core'
const base = 'https://brandklout-production.up.railway.app'
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.goto(base + '/', { waitUntil: 'networkidle2', timeout: 60000 })
const home = await page.evaluate(() => {
  const txt = (el) => el?.textContent.replace(/\s+/g, ' ').trim() ?? null
  const quote = [...document.querySelectorAll('blockquote')].find((b) => /monthly calls|quarterly call/.test(b.textContent))
  const h1 = document.querySelector('h1')
  const lead = h1?.parentElement.querySelector('p')
  return {
    wordmarks: txt(document.querySelector('.client-strip')),
    whyUs: txt(document.querySelector('#why-brandklout h2')),
    quote: txt(quote)?.slice(0, 70),
    quoteStyle: quote ? getComputedStyle(quote).fontStyle : null,
    storiesH2: txt(document.querySelector('#stories h2')),
    resultsH2: txt(document.querySelector('#results h2')),
    leadMargin: lead ? getComputedStyle(lead).marginBottom : null,
  }
})
await page.goto(base + '/guarantee', { waitUntil: 'networkidle2', timeout: 60000 })
const guarantee = await page.evaluate(() => document.querySelector('h1')?.textContent.trim())
await browser.close()
console.log(JSON.stringify({ home, guarantee }, null, 1))
