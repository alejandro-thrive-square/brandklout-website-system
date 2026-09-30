// Headless check: does the Elfsight widget render (>0px) on a fresh load of each page?
//   node .tmp/elfsight-live-check.mjs https://staging.westlaketxmedspa.com / /results
import puppeteer from 'puppeteer-core'
const [base, ...paths] = process.argv.slice(2)
const SEL = '[class*="elfsight-app-"]'
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] })
let bad = 0
for (const p of paths.length ? paths : ['/']) {
  const pg = await browser.newPage()
  await pg.setViewport({ width: 1440, height: 900 })
  const reqs = []
  pg.on('response', (r) => { if (/elfsight|googleusercontent/.test(r.url())) reqs.push(`${r.status()} ${new URL(r.url()).host}${new URL(r.url()).pathname.slice(0, 40)}`) })
  pg.on('requestfailed', (r) => { if (/elfsight/.test(r.url())) reqs.push(`FAILED ${r.failure()?.errorText} ${new URL(r.url()).host}`) })
  const errs = []
  pg.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)) })
  await pg.goto(`${base}${p}?check=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await pg.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto' })
  pg.on('response', (r) => { if (r.status() === 404) errs.push(`404 ${r.url().slice(0, 100)}`) })
  let h = 0, text = '', none = false
  // Wait for the REVIEWS, not just the header: the header alone is ~164px.
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 1000))
    // The widget renders in a shadow root: innerText is empty while it shows reviews.
    const m = await pg.evaluate((sel) => { const w = document.querySelector(sel); if (!w) return null; w.scrollIntoView({ block: 'center' }); const r = w.getBoundingClientRect(); const deep = (n) => [...n.querySelectorAll('*')].map((e) => e.shadowRoot ? deep(e.shadowRoot) : '').join(' ') + ' ' + (n.textContent || ''); return { h: r.height, t: deep(w).replace(/\s+/g, ' ').trim().slice(0, 400) } }, SEL)
    if (!m) { none = true; break }
    h = m.h; text = m.t
    if (/review/i.test(text) && /\d/.test(text) && h > 300) break
  }
  const csp = await pg.evaluate(() => document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content?.match(/script-src[^;]*/)?.[0]?.slice(0, 120) ?? '(no meta CSP)')
  if (!none && process.env.SHOT) {
    const el = await pg.$(SEL)
    await el.screenshot({ path: `${process.env.SHOT}/${p.replace(/\W/g, '') || 'home'}.png` })
  }
  console.log(`${p.padEnd(10)} ${none ? 'NO WIDGET DIV' : `widget ${Math.round(h)}px  ${h > 0 ? 'RENDERS' : 'ZERO'}`}\n   text: ${text}\n   reqs: ${reqs.join(' | ')}\n   csp:  ${csp}\n   errs: ${errs.join(' | ') || 'none'}`)
  if (!none && !(h > 0)) bad++
  await pg.close()
}
await browser.close()
process.exit(bad ? 1 : 0)
