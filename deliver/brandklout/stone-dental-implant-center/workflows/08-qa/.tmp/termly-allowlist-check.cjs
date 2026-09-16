const fs = require('fs')
const { chromium } = require('C:/Users/ACER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core')
const D = 'C:/Users/ACER/orca/workspaces/Brandklout Website System/bk-stone-dental/deliver/brandklout/snippets/termly-ghl-consent/'
const ALLOWJS = fs.readFileSync(D + 'termly-allowlist.html', 'utf8')
const BRIDGE = fs.readFileSync(D + 'termly-ghl-consent.html', 'utf8')
const NEWHEAD = fs.readFileSync('C:/Users/ACER/orca/workspaces/Brandklout Website System/bk-stone-dental/deliver/brandklout/stone-dental-implant-center/workflows/08-qa/.tmp/head-after-2026-09-16.html','utf8')
const SITE = 'https://www.stonedentalimplantcenter.com'
const PATH = process.argv[2] || '/'
const MODE = process.argv[3] || 'first'   // first = allowlist + termly moved to top; asis = allowlist first, termly where it is; none = live
;(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' })
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' })
  await ctx.route(/termly\.io/, async (route) => { const r = route.request(); const res = await fetch(r.url(), { method: r.method(), headers: { ...r.headers(), origin: SITE }, body: r.postDataBuffer() || undefined }); const h = {}; res.headers.forEach((v, k) => { if (!/encoding|length/.test(k)) h[k] = v }); await route.fulfill({ status: res.status, headers: h, body: Buffer.from(await res.arrayBuffer()) }) })
  await ctx.route(u => u.origin === SITE && u.pathname === PATH, async (route) => {
    const res = await fetch(route.request().url()); let html = await res.text()
    if (MODE === 'newhead') { const a = html.indexOf('<!-- Google Tag Manager -->'); const z = html.lastIndexOf('<!-- Keep this css code to improve the font quality-->') + 55; if (a < 0 || z < 60) console.log('HEAD MARKERS MISSING'); html = html.slice(0, a) + NEWHEAD + html.slice(z) }
    else if (MODE !== 'none') {
      html = html.replace(/<script>(?:(?!<\/script>)[\s\S])*?TERMLY_API_CACHE[\s\S]*?<\/script>/, '').replace('</body>', BRIDGE + '</body>')
      const tm = html.match(/<script[^>]*app\.termly\.io\/resource-blocker[^>]*><\/script>/)[0]
      if (MODE === 'first') html = html.replace(tm, '')
      html = html.replace(/<head[^>]*>/, m => m + ALLOWJS + (MODE === 'first' ? tm : ''))
    }
    await route.fulfill({ status: 200, contentType: 'text/html', body: html })
  })
  const page = await ctx.newPage()
  const errs = []; page.on('pageerror', e => errs.push(e.message.slice(0, 150)))
  await page.goto(SITE + PATH, { waitUntil: 'load' })
  await page.waitForTimeout(8000)
  const info = await page.evaluate(() => ({
    blockedScripts: [...document.querySelectorAll('script[data-autoblocked]')].map(s => (s.dataset.src || s.src || '').slice(0, 90) + ' ' + s.dataset.categories + ' type=' + s.type),
    blockedFrames: [...document.querySelectorAll('iframe[data-autoblocked]')].map(f => (f.dataset.src || '').slice(0, 70) + ' ' + f.dataset.categories + ' src=' + !!f.getAttribute('src')),
    placeholdersShown: [...document.querySelectorAll('.termly-blocked-content')].filter(b => b.getBoundingClientRect().height > 0).length,
    iframesLoaded: [...document.querySelectorAll('iframe')].filter(f => f.getAttribute('src') && f.getBoundingClientRect().height > 20).map(f => f.getAttribute('src').slice(0, 60)),
    globals: { Webflow: typeof Webflow, gsap: typeof gsap, Swiper: typeof Swiper },
    termlyFirst: document.head.querySelector('script[src]')?.src.slice(0, 50),
    gaBlocked: [...document.scripts].some(s => /gtag\/js/.test(s.dataset.src || '') && s.type === 'text/plain'),
    ghlTrackingBlocked: [...document.scripts].filter(s => /number_pool|user_session/.test(s.dataset.src || s.src) && s.type === 'text/plain').length
  }))
  console.log(MODE, PATH, JSON.stringify(info, null, 1), '\nPAGEERRORS', errs)
  await page.screenshot({ path: 'allow-' + MODE + PATH.replace(/\W/g, '_') + '.png' })
  await b.close()
})()
