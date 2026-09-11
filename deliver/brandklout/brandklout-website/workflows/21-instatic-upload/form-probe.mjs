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
// The answer animates `max-height` over .3s, so measure after the transition, not on the click.
const faq = await page.evaluate(async () => {
  const item = document.querySelectorAll('.faq-item')[1]
  const before = item.classList.contains('open')
  item.querySelector('.faq-q').click()
  await new Promise((r) => setTimeout(r, 700))
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

/* --- /survey: the rebuilt 21-point assessment (overlay/survey/index.html, 2026-09-11) ----------
   Walks it the way a visitor would: presses Get My Results with nothing answered (every question
   should flag and the page should scroll to #1), answers all 21, opens the contact step, fills it
   and submits. The SheetDB POST is ABORTED, so nothing reaches Sang's sheet; what is recorded is
   the request itself (URL, method, headers, JSON body) and whether the browser's CSP let it leave:
   a CSP block never reaches request interception and shows up as a console error instead.
   The aborted fetch makes the page raise its own error alert, which is accepted and recorded. */
const sp = await browser.newPage()
const sTried = []
const sErrors = []
const dialogs = []
sp.on('pageerror', (e) => sErrors.push(e.message))
sp.on('console', (m) => ['error', 'warning'].includes(m.type()) && sErrors.push(`${m.type()}: ${m.text()}`))
sp.on('dialog', async (d) => { dialogs.push(d.message()); await d.dismiss() })
await sp.setRequestInterception(true)
sp.on('request', (r) => {
  // A JSON POST is cross-origin "non-simple", so Chrome sends a CORS preflight first. The
  // preflight carries no body and writes nothing; abort IT and the real POST is never formed, so
  // there is nothing to inspect. Let only SheetDB's preflight through; the POST is still aborted.
  if (r.method() === 'OPTIONS' && /^https:\/\/sheetdb\.io\//.test(r.url())) return r.continue()
  if (r.method() !== 'GET' && r.method() !== 'HEAD' && !/\/[A-Za-z0-9_-]{40,}$/.test(r.url())) {
    sTried.push({ method: r.method(), url: r.url(), contentType: r.headers()['content-type'], body: r.postData() ?? '' })
    return r.abort()
  }
  if (r.method() !== 'GET') return r.abort()
  r.continue()
})
await sp.goto(BASE + '/survey', { waitUntil: 'networkidle0' })
await sp.evaluate(() => (document.documentElement.style.scrollBehavior = 'auto'))
const boot = await sp.evaluate(() => ({
  questions: document.querySelectorAll('.q').length,
  radios: document.querySelectorAll('.q input[type="radio"]').length,
  progress: document.querySelector('.progress-text')?.textContent,
  modalHidden: document.getElementById('resultsModal')?.hidden,
  csp: document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content ?? '',
}))
await sp.click('#getResults')
await new Promise((r) => setTimeout(r, 900))
const emptyTry = await sp.evaluate(() => ({
  flagged: document.querySelectorAll('.q.invalid').length,
  firstFlaggedTop: Math.round(document.querySelector('.q.invalid')?.getBoundingClientRect().top ?? -1),
  modalHidden: document.getElementById('resultsModal').hidden,
}))
await sp.evaluate(() => {
  document.querySelectorAll('.q').forEach((q, i) => q.querySelectorAll('input')[i % 2].click())
})
const answered = await sp.evaluate(() => ({
  flagged: document.querySelectorAll('.q.invalid').length,
  progress: document.querySelector('.progress-text')?.textContent,
  bar: document.getElementById('progressBar').style.width,
}))
await sp.click('#getResults')
await new Promise((r) => setTimeout(r, 300))
const modalOpen = await sp.evaluate(() => !document.getElementById('resultsModal').hidden)
await sp.type('#fullName', 'Form Probe (aborted, never sent)')
await sp.type('#email', 'probe@example.com')
await sp.type('#phone', '5555555555')
await sp.click('#contactForm button[type="submit"]')
await new Promise((r) => setTimeout(r, 2500))
const sAfter = await sp.evaluate(() => ({
  askHidden: document.getElementById('askContact').hidden,
  doneHidden: document.getElementById('assessmentDone').hidden,
  button: document.querySelector('#contactForm button[type="submit"]').textContent,
}))
const sent = sTried.find((t) => /sheetdb\.io/.test(t.url) && t.method === 'POST')
let payloadKeys = null
try { payloadKeys = sent ? Object.keys(JSON.parse(sent.body)) : null } catch { payloadKeys = 'not JSON' }
const survey = {
  boot: { ...boot, cspAllowsSheetdb: /connect-src[^;]*https:\/\/sheetdb\.io/.test(boot.csp), csp: undefined },
  emptyTry, answered, modalOpen, after: sAfter,
  sheetdb: sent ? { method: sent.method, url: sent.url, contentType: sent.contentType, payloadKeys } : 'NO REQUEST — blocked by CSP or never sent',
  otherRequests: sTried.filter((t) => t !== sent).map((t) => `${t.method} ${t.url}`),
  dialogs, errors: sErrors,
}
console.log('\n=== survey\n' + JSON.stringify(survey, null, 1))
await browser.close()
