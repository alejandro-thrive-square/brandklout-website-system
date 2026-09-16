const fs = require('fs')
const { chromium } = require('C:/Users/ACER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core')
const SNIP = fs.readFileSync('C:/Users/ACER/orca/workspaces/Brandklout Website System/bk-stone-dental/deliver/brandklout/snippets/termly-ghl-consent/termly-ghl-consent.html', 'utf8')
const SITE = 'https://www.stonedentalimplantcenter.com'
async function run(b, name, action, gpc) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' })
  if (gpc) await ctx.addInitScript(() => Object.defineProperty(Navigator.prototype, 'globalPrivacyControl', { get: () => true }))
  await ctx.route(/termly\.io/, async (route) => { const r = route.request(); const res = await fetch(r.url(), { method: r.method(), headers: { ...r.headers(), origin: SITE }, body: r.postDataBuffer() || undefined }); const h = {}; res.headers.forEach((v, k) => { if (!/encoding|length/.test(k)) h[k] = v }); await route.fulfill({ status: res.status, headers: h, body: Buffer.from(await res.arrayBuffer()) }) })
  await ctx.route(u => u.pathname === '/contact', async (route) => { const res = await fetch(route.request().url()); let html = await res.text(); html = html.replace('</body>', SNIP + '</body>'); await route.fulfill({ status: 200, contentType: 'text/html', body: html }) })
  const page = await ctx.newPage()
  await page.goto(SITE + '/contact', { waitUntil: 'load' })
  await page.waitForTimeout(6000)
  if (action) { await page.getByRole('button', { name: action }).first().click(); await page.waitForTimeout(6000) }
  const src = await page.evaluate(() => document.querySelector('iframe[id^="inline-"]').getAttribute('src'))
  const frame = page.frames().find(f => /widget\/form/.test(f.url()))
  let fields = 'NO FRAME'
  if (frame) { await frame.waitForSelector('.form-field-wrapper', { timeout: 15000 }).catch(() => {}); await page.waitForTimeout(1500)
    fields = await frame.evaluate(() => [...document.querySelectorAll('.form-field-wrapper')].map(w => {
      const l = (w.querySelector('label')?.textContent || '').trim(); if (!/^(privacy|marketing)_/.test(l)) return null
      const cb = [...w.querySelectorAll('input[type=checkbox]')].filter(e => e.checked).map(e => e.value)
      const t = w.querySelector('input[type=text]'); const dd = w.querySelector('.multiselect__single')?.textContent?.trim()
      return l + ' = ' + (cb.length ? cb.join() : dd || t?.value || '')
    }).filter(Boolean)) }
  console.log('\n=== ' + name, '\nsrc:', decodeURIComponent(src || ''), '\n' + (Array.isArray(fields) ? fields.join('\n') : fields))
  await ctx.close()
}
;(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' })
  await run(b, 'NO CHOICE', null)
  await run(b, 'DECLINE', /^decline$/i)
  await run(b, 'ACCEPT', /^accept$/i)
  await run(b, 'GPC + ACCEPT', /^accept$/i, true)
  await b.close()
})()
