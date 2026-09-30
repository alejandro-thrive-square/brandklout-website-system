#!/usr/bin/env node
/**
 * Click what a visitor clicks on each landing and consultation page. The other
 * gates never click anything, and a control that is unbound passes all of them.
 *   - every CTA on the landing page points at its own consultation page
 *   - the FAQ opens
 *   - the before/after slider moves under a drag
 *   - the prototype form (no GHL form yet) forwards to the campaign's thank-you page
 *   - the thank-you page has a tel: link above the fold and no form
 * Reads combo.json; --base overrides its origin. Writes nothing.
 *
 * Usage: node lp-click.mjs [--base=https://host] > ../lp-click.log 2>&1
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(HERE, '../../../../../../..')
const puppeteer = createRequire(process.env.PUPPETEER_DIR || path.join(REPO, 'node_modules') + path.sep)('puppeteer-core')
const combo = JSON.parse(fs.readFileSync(path.resolve(HERE, '../../../01-campaign-intake/output/combo.json'), 'utf8'))
const base = ((process.argv.find((a) => a.startsWith('--base=')) || '').slice(7) || combo.origin).replace(/\/$/, '')
const u = (slug) => `${base}/${combo.prefix}${slug}`
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const fails = []
const note = (ok, msg) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg) }

const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox', '--disable-gpu'] })
for (const c of combo.campaigns) {
  for (const role of ['landing', 'consultation']) {
    const page = await browser.newPage()
    await page.setRequestInterception(true)
    page.on('request', (r) => (/sienna-accessibility|termly/.test(r.url()) ? r.abort() : r.continue()))
    await page.setViewport({ width: 1440, height: 900 })
    await page.goto(u(c[role]), { waitUntil: 'networkidle0', timeout: 90000 })
    await sleep(2500)
    if (role === 'landing') {
      const ctas = await page.evaluate(() => [...document.querySelectorAll('a.btn, a.nav-cta')].map((a) => ({ t: a.textContent.trim(), h: a.getAttribute('href') })))
      const book = ctas.filter((a) => /book|meet/i.test(a.t))
      note(book.length >= 5 && book.every((a) => a.h.endsWith('/' + c.consultation)), `${c.landing}: ${book.length} booking CTAs, all to /${c.consultation}`)
      const faq = await page.evaluate(async () => {
        const q = document.querySelector('.faq-q'); if (!q) return 'no faq'
        q.scrollIntoView({ block: 'center' }); q.click(); await new Promise((r) => setTimeout(r, 1200))
        return q.getAttribute('aria-expanded') + ' ' + Math.round(q.parentElement.querySelector('.faq-a').getBoundingClientRect().height)
      })
      note(/^true [1-9]/.test(faq), `${c.landing}: first question opens (${faq})`)
      const ba = await page.evaluate(async () => {
        const st = document.querySelector('.lp-ba-stage'); if (!st) return 'no slider'
        st.scrollIntoView({ block: 'center' }); await new Promise((r) => setTimeout(r, 2600))
        const r = st.getBoundingClientRect(), after = st.querySelector('.lp-ba-after')
        const fire = (type, x) => st.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: r.top + r.height / 2, pointerType: 'mouse', pointerId: 1, bubbles: true }))
        fire('pointermove', r.left + r.width * 0.2); const a = after.style.clipPath
        fire('pointermove', r.left + r.width * 0.8); const b = after.style.clipPath
        return a + ' -> ' + b
      })
      note(/20%.*->.*80%/.test(ba), `${c.landing}: the slider follows the pointer (${ba})`)
    }
    const hasProto = await page.$('.lp-proto')
    if (hasProto) {
      await page.evaluate(() => document.querySelector('.lp-card').scrollIntoView({ block: 'center' }))
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => null),
        page.evaluate(() => { const f = document.querySelector('.lp-proto'); const b = f.querySelector('button, [type=submit]'); b ? b.click() : f.requestSubmit() }),
      ])
      await sleep(800)
      note(page.url().replace(/\.html$/, '').endsWith('/' + c.thankYou), `${c[role]}: prototype form forwards to ${page.url().replace(base, '')}`)
    } else {
      const frames = await page.$$eval('.lp-slot iframe', (f) => f.map((x) => x.src))
      note(frames.length === 1, `${c[role]}: one embedded form (${frames.join(', ') || 'none'})`)
    }
    await page.close()
  }
  const ty = await browser.newPage()
  await ty.setViewport({ width: 1440, height: 900 })
  await ty.goto(u(c.thankYou), { waitUntil: 'networkidle0', timeout: 90000 })
  const t = await ty.evaluate(() => ({ forms: document.querySelectorAll('form, iframe').length, tel: [...document.querySelectorAll('a[href^="tel:"]')].filter((a) => a.getBoundingClientRect().top < 900 && a.getBoundingClientRect().height > 0).length }))
  note(t.forms === 0 && t.tel >= 1, `${c.thankYou}: no form (${t.forms}), ${t.tel} tel: link(s) above the fold`)
  await ty.close()
}
await browser.close()
console.log(fails.length ? `\nFAIL  ${fails.length}` : '\nFAIL  none')
process.exitCode = fails.length ? 1 : 0
