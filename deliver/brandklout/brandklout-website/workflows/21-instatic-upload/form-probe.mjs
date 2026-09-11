/**
 * What does the published "Check my market" form actually do on submit?
 *
 * Fills every field, clicks submit, and records every request the page tries to make — then
 * ABORTS any non-GET request, so no submission ever reaches a server. Also checks the FAQ toggle.
 *
 * Usage: node form-probe.mjs
 */
import puppeteer from 'puppeteer-core'

const BASE = (process.env.INSTATIC_BASE_URL || 'https://brandklout-production.up.railway.app').replace(/\/$/, '')
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' })
const page = await browser.newPage()
const tried = []
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
await page.setRequestInterception(true)
page.on('request', (r) => {
  if (r.method() !== 'GET') {
    tried.push(`${r.method()} ${r.url()} ${(r.postData() ?? '').slice(0, 160)}`)
    return r.abort()
  }
  r.continue()
})

await page.goto(BASE + '/', { waitUntil: 'networkidle0' })
await page.evaluate(() => (document.documentElement.style.scrollBehavior = 'auto'))

// FAQ: the second item starts closed; one click should open it.
const faq = await page.evaluate(() => {
  const item = document.querySelectorAll('.faq-item')[1]
  const before = item.classList.contains('open')
  item.querySelector('.faq-q').click()
  return { before, after: item.classList.contains('open'), height: item.querySelector('.faq-a').getBoundingClientRect().height }
})

await page.type('input[name="name"]', 'Probe Test')
await page.type('input[name="email"]', 'probe@example.com')
await page.type('input[name="practice"]', 'Probe Practice')
await page.type('input[name="market"]', 'Austin, TX')
await page.type('textarea[name="problem"]', 'form probe — aborted, never sent')
await new Promise((r) => setTimeout(r, 2500)) // Instatic's minSubmitSeconds is 2
const urlBefore = page.url()
await page.click('#leadForm [type="submit"]')
await new Promise((r) => setTimeout(r, 2500))

const after = await page.evaluate(() => ({
  success: (() => { const s = document.getElementById('success'); return s ? getComputedStyle(s).display + ' | ' + s.textContent.trim() : 'no #success' })(),
  formText: document.getElementById('leadForm')?.innerText.slice(-300),
  attrs: Object.fromEntries([...document.getElementById('leadForm').attributes].map((a) => [a.name, a.value])),
}))

console.log(JSON.stringify({ faq, tried, urlBefore, urlAfter: page.url(), ...after, errors }, null, 1))
await browser.close()
