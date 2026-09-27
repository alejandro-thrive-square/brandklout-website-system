const { chromium } = require('playwright-core')
;(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' })
  const out = []
  for (const p of (process.argv[3] ? process.argv[3].split(',').map(x => '/' + x) : ['/', '/about-us', '/privacy-policy'])) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' })
    await ctx.route(/termly.io/, async (route) => { const r = route.request(); const res = await fetch(r.url(), { method: r.method(), headers: { ...r.headers(), origin: 'https://www.masonparkdental.com' }, body: r.postDataBuffer() || undefined }); const h = {}; res.headers.forEach((v, k) => { if (!/encoding|length/.test(k)) h[k] = v }); await route.fulfill({ status: res.status, headers: h, body: Buffer.from(await res.arrayBuffer()) }) })
    const page = await ctx.newPage()
    const errs = [], reqs = []
    page.on('console', m => { if (/termly|Content Security Policy.*(termly)/i.test(m.text()) || (/Content Security Policy/.test(m.text()) && !/email-decode|cloudflareinsights|data:application/.test(m.text()))) errs.push(m.type() + ': ' + m.text().slice(0, 220)) })
    page.on('requestfailed', r => { if (/termly/.test(r.url())) reqs.push('FAIL ' + r.url().slice(0, 120) + ' ' + r.failure()?.errorText) })
    page.on('response', r => { if (/termly/.test(r.url())) reqs.push(r.status() + ' ' + r.url().slice(0, 120)) })
    await page.goto('https://www.masonparkdental.com' + p + '?t=' + Date.now(), { waitUntil: 'load' })
    await page.waitForTimeout(6000); if (process.env.ACCEPT) { await page.getByRole('button', { name: 'Accept' }).first().click(); await page.waitForTimeout(3000); reqs.push('cookies: ' + (await ctx.cookies()).map(c => c.name).join(',')) }
    const banner = await page.evaluate(() => {
      const el = [...document.querySelectorAll('[id*="termly"],[class*="termly"],[data-tid]')].filter(e => e.getBoundingClientRect().height > 0)
      return { visible: el.length, text: (document.body.innerText.match(/.{0,60}cookie.{0,60}/i) || [''])[0], hasTermlyGlobal: typeof window.Termly }
    })
    await page.screenshot({ path: process.argv[2] + '/termly' + p.replace(/\W/g, '_') + '.png' })
    out.push({ p, banner, errs, reqs })
    await ctx.close()
  }
  console.log(JSON.stringify(out, null, 1))
  await b.close()
})()
