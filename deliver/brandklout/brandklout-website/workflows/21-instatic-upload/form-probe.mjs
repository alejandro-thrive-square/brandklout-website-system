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

/* --- the survey (v2, 2026-09-11) --------------------------------------------------------------
   Walks all four steps the way a visitor would — fills the active step, presses Continue — then
   presses Submit. Every non-GET request is aborted, so no answer ever reaches a server; what is
   recorded is where the page TRIES to send them. Also records the things the importer is known
   to drop from form controls and site.js puts back (prepare-source.mjs): the slider's type, the
   numbered labels, the submit button's id. */
const sp = await browser.newPage()
const sTried = []
const sErrors = []
sp.on('pageerror', (e) => sErrors.push(e.message))
sp.on('console', (m) => ['error', 'warning'].includes(m.type()) && sErrors.push(`${m.type()}: ${m.text()}`))
await sp.setRequestInterception(true)
sp.on('request', (r) => {
  if (r.method() !== 'GET') {
    sTried.push(`${r.method()} ${r.url()} ${(r.postData() ?? '').slice(0, 200)}`)
    return r.abort()
  }
  r.continue()
})
await sp.goto(BASE + '/survey', { waitUntil: 'networkidle0' })
const boot = await sp.evaluate(() => {
  const form = document.getElementById('growthSurvey')
  return {
    stepText: document.getElementById('stepText')?.textContent,
    activeStep: [...document.querySelectorAll('.step')].findIndex((s) => s.classList.contains('active')) + 1,
    rangeType: document.getElementById('marketing_satisfaction')?.type,
    numberedLabels: `${document.querySelectorAll('.question-label[data-number]').length}/${document.querySelectorAll('.question-label').length}`,
    submitButton: !!document.getElementById('submitButton'),
    form: form && Object.fromEntries([...form.attributes].map((a) => [a.name, a.value])),
  }
})
const fillStep = () =>
  sp.evaluate(() => {
    const step = document.querySelector('.step.active')
    for (const el of step.querySelectorAll('input, select, textarea')) {
      if (el.type === 'checkbox' || el.type === 'radio') continue
      if (el.tagName === 'SELECT') el.selectedIndex = 1
      else if (el.type === 'email') el.value = 'probe@example.com'
      else if (el.type === 'url') el.value = 'https://example.com'
      else if (el.type === 'tel') el.value = '5555555555'
      else if (el.type === 'range') el.value = '7'
      else el.value = 'form probe - aborted, never sent'
      el.dispatchEvent(new Event('input', { bubbles: true }))
      el.dispatchEvent(new Event('change', { bubbles: true }))
    }
    for (const g of step.querySelectorAll('.choice-group')) g.querySelector('input').click()
    return document.getElementById('stepText')?.textContent
  })
const steps = []
for (let i = 0; i < 3; i++) {
  steps.push(await fillStep())
  await sp.click('#nextButton')
  await new Promise((r) => setTimeout(r, 400))
}
steps.push(await fillStep())
const beforeSubmit = await sp.evaluate(() => ({
  stepText: document.getElementById('stepText')?.textContent,
  submitVisible: !document.getElementById('submitButton')?.hidden,
  satisfaction: document.getElementById('satisfactionValue')?.textContent,
}))
await sp.click('#submitButton').catch((e) => sErrors.push('click submit: ' + e.message))
await new Promise((r) => setTimeout(r, 3000))
const survey = { boot, steps, beforeSubmit, tried: sTried, urlAfter: sp.url(), errors: sErrors }
console.log('\n=== survey\n' + JSON.stringify(survey, null, 1))
await browser.close()
