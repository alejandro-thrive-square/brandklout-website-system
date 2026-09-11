/**
 * GATE for the contact form. The Fluent Forms that posted to WordPress (#1 on 57 pages, #6 on
 * dental-implants) are replaced by the practice's GoHighLevel form; #3 (Refer a Patient) is not.
 *
 *   1. every published route: the GHL iframe appears exactly where a contact form was, and no
 *      contact Fluent Form is left;
 *   2. in Chrome, on a sample of pages at 1440 and 390: the iframe loads GHL's form, GHL's
 *      form_embed.js ran, the iframe has a real height (not the 150px default or 0), and the page
 *      raised no CSP violation. A screenshot of each form box goes to .tmp/ghl/.
 *
 * Usage: node verify-ghl-form.mjs [base] > .tmp/verify-ghl.log 2>&1
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const BASE = (process.argv[2] || 'https://institute-for-advanced-dentistry-production.up.railway.app').replace(/\/$/, '')
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const FORM = 'api.leadconnectorhq.com/widget/form/cxtQ5q29TfUr3cYlMmDB'
const OUT = path.join(HERE, '.tmp', 'ghl')
fs.mkdirSync(OUT, { recursive: true })

const pages = JSON.parse(fs.readFileSync(path.join(HERE, '.tmp', 'wp', 'pages.json'), 'utf8'))
const urlOf = (slug) => BASE + (slug === 'index' ? '/' : '/' + slug)
const NO_CONTACT_FORM = new Set(['dental-services-cosmetic-dentistry-ppc']) // WordPress had none there
let fail = 0
const say = (ok, msg) => { if (!ok) fail++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`) }

/* 1. markup on every route */
for (const p of pages) {
  const html = await (await fetch(urlOf(p.slug))).text()
  const ghl = html.split(FORM).length - 1
  const fluent = (html.match(/frm-fluent-form/g) || []).length
  const want = NO_CONTACT_FORM.has(p.slug) ? 0 : 1
  const wantFluent = p.slug === 'patient-referrals' ? 1 : 0
  say(ghl === want && fluent === wantFluent, `${p.slug.padEnd(50)} ghl ${ghl}/${want}  fluent ${fluent}/${wantFluent}`)
}

/* 2. the form really renders */
const SAMPLE = ['index', 'contact-us', 'dental-services-dental-implants', 'patient-referrals']
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true })
for (const width of [1440, 390]) {
  for (const slug of SAMPLE) {
    const tab = await browser.newPage()
    await tab.setViewport({ width, height: 900 })
    const csp = []
    tab.on('console', (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) csp.push(m.text().slice(0, 160)) })
    const scripts = []
    tab.on('requestfinished', (r) => { if (/form_embed\.js/.test(r.url())) scripts.push(r.response()?.status()) })
    await tab.goto(urlOf(slug), { waitUntil: 'networkidle2', timeout: 90000 })
    await tab.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto' })
    const sel = `iframe[src*="${FORM}"]`
    const el = await tab.$(sel)
    if (!el) { await tab.close(); continue }
    await tab.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'center' }), sel)
    await new Promise((r) => setTimeout(r, 4000)) // GHL resizes the iframe by postMessage once its form has laid out
    const box = await tab.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) } }, sel)
    const frame = (await el.contentFrame())
    const fields = frame ? await frame.evaluate(() => document.querySelectorAll('input, textarea, select').length).catch(() => -1) : -1
    const holder = await tab.evaluateHandle((s) => document.querySelector(s).closest('.card-contact-section, .brxe-shortcode, .wz-embed') || document.querySelector(s), sel)
    await holder.asElement().screenshot({ path: path.join(OUT, `${slug}-${width}.png`) }).catch(() => {})
    say(box.h > 300 && box.w > 200 && fields > 0 && scripts.includes(200) && csp.length === 0,
      `${slug} @${width}: iframe ${box.w}x${box.h}, ${fields} fields inside, form_embed.js ${scripts.join(',') || 'not loaded'}${csp.length ? ', CSP: ' + csp[0] : ''}`)
    await tab.close()
  }
}
await browser.close()
console.log(`\n${fail ? fail + ' FAIL' : 'all ok'}`)
process.exitCode = fail ? 1 : 0
