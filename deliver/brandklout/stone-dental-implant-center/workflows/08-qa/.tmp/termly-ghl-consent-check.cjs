const fs = require('fs')
const { chromium } = require('C:/Users/ACER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core')
const T = 'C:/Users/ACER/orca/workspaces/Brandklout Website System/bk-stone-dental/deliver/brandklout/stone-dental-implant-center/workflows/08-qa/.tmp/'
const HEAD = fs.readFileSync(T + 'head-v2-2026-09-16.html', 'utf8'), FOOT = fs.readFileSync(T + 'footer-v2-2026-09-16.html', 'utf8')
const SITE = 'https://www.stonedentalimplantcenter.com'
const MODE = process.argv[2] || 'sim'   // sim = inject v2 into live HTML; live = as served
const PAGES = (process.argv[3] || '/,/ads-landing-pages/all-on-x,/contact').split(',')
;(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' })
  for (const path of PAGES) for (const act of [null, 'decline', 'accept']) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' })
    await ctx.route(/termly\.io/, async (route) => { const r = route.request(); const res = await fetch(r.url(), { method: r.method(), headers: { ...r.headers(), origin: SITE }, body: r.postDataBuffer() || undefined }); const h = {}; res.headers.forEach((v, k) => { if (!/encoding|length/.test(k)) h[k] = v }); await route.fulfill({ status: res.status, headers: h, body: Buffer.from(await res.arrayBuffer()) }) })
    if (MODE === 'sim') await ctx.route(u => u.origin === SITE && u.pathname === path, async (route) => {
      let html = await (await fetch(route.request().url())).text()
      const h0 = html.indexOf('<!-- Brandklout: Termly allowlist'), h1 = html.lastIndexOf('<!-- Keep this css code to improve the font quality-->') + 55
      const f0 = html.indexOf('<!-- Google Tag Manager (noscript) -->'), f1 = html.lastIndexOf('</script>', html.lastIndexOf('</body>')) + 9
      if (h0 < 0 || f0 < 0 || !html.slice(f0, f1).includes('consent bridge (v1.1.0)')) throw new Error('markers ' + [h0, f0])
      html = html.slice(0, h0) + HEAD + html.slice(h1, f0) + FOOT + html.slice(f1)
      await route.fulfill({ status: 200, contentType: 'text/html', body: html })
    })
    const page = await ctx.newPage()
    const trk = new Set(), errs = []
    page.on('request', r => { const m = r.url().match(/(number_pool\.js|user_session\.js|appengine\/user_session\/create_session)/); if (m) trk.add(m[1]) })
    page.on('pageerror', e => errs.push(e.message.slice(0, 100)))
    await page.goto(SITE + path, { waitUntil: 'load' }); await page.waitForTimeout(6000)
    if (act) { await page.getByRole('button', { name: new RegExp('^' + act + '$', 'i') }).first().click(); await page.waitForTimeout(6000) }
    const r = await page.evaluate(() => {
      const f = document.querySelector('iframe[src*="widget/form"],iframe[src*="widget/survey"]')
      const q = f ? new URL(f.getAttribute('src')).searchParams : null
      return {
        Webflow: typeof Webflow, autoblocked: document.querySelectorAll('[data-autoblocked]').length,
        embeds: [...document.querySelectorAll('iframe')].filter(x => x.getAttribute('src') && x.getBoundingClientRect().height > 20).length,
        placeholders: [...document.querySelectorAll('.termly-blocked-content')].filter(x => x.getBoundingClientRect().height > 0).length,
        form: q ? [q.get('privacy_analytics_consent'), q.get('privacy_advertising_consent'), 'optout=' + q.get('privacy_sale_share_opt_out'), q.get('privacy_cmp_receipt_id') ? 'receipt' : 'noreceipt'].join(' ') + ' h=' + Math.round(f.getBoundingClientRect().height) : 'no form',
        gcm: (window.dataLayer || []).filter(x => x && x[0] === 'consent').map(x => x[1] + ':' + x[2].analytics_storage).join(',')
      }
    })
    console.log(MODE, path, act || 'none', JSON.stringify(r), '| tracking:', [...trk].join(',') || 'none', errs.length ? '| ERR ' + errs : '')
    if (!act && path === '/') await page.screenshot({ path: 'v2-' + MODE + '-home.png' })
    await ctx.close()
  }
  await b.close()
})()
