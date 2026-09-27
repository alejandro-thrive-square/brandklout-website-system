/* v16: the new market-prequalification form at the foot of each page. Fills it, lets site.js submit,
   and ABORTS the POST (no email is sent), reporting where it was going and what it carried. */
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' })
const out = []
for (const slug of ['solutions', 'customer-story-ava-dental-launch', 'hipaa', 'book', '']) {
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 900 })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)))
  await page.setRequestInterception(true)
  let post = null
  page.on('request', (r) => {
    if (r.method() === 'POST' && /formsubmit/.test(r.url())) { post = { url: r.url(), body: (r.postData() ?? '').slice(0, 400) }; r.abort() } else r.continue()
  })
  await page.goto('https://brandklout-production.up.railway.app/' + slug, { waitUntil: 'networkidle2', timeout: 60000 })
  const r = await page.evaluate(async () => {
    const sec = document.querySelector('#market-prequalification')
    const form = sec?.querySelector('form')
    if (!form) return { form: false }
    const set = (sel, v) => { const el = form.querySelector(sel); if (el) { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })) } return !!el }
    const filled = {
      name: set('[name="name"]', 'PROBE — do not contact'), email: set('[name="email"]', 'probe@example.com'), practice: set('[name="practice"]', 'Probe'),
      market: set('[name="market"]', 'Austin, TX'),
    }
    const sel = form.querySelector('select[name="priority"]'); if (sel) sel.selectedIndex = 1
    const labels = [...form.querySelectorAll('label')].filter((l) => l.htmlFor && !form.querySelector('#' + CSS.escape(l.htmlFor))).length
    return { form: true, leadForm: form.hasAttribute('data-lead-form'), filled, brokenLabels: labels, submit: !!form.querySelector('[type="submit"]') }
  })
  if (r.form) {
    await page.evaluate(() => document.querySelector('#market-prequalification form [type="submit"]').click())
    await new Promise((res) => setTimeout(res, 3000))
  }
  out.push({ slug: '/' + slug, ...r, post, status: await page.evaluate(() => document.querySelector('#market-prequalification [data-form-status]')?.textContent?.trim() ?? null), errors })
  await page.close()
}
await browser.close()
fs.writeFileSync('prequal-probe.json', JSON.stringify(out, null, 1))
