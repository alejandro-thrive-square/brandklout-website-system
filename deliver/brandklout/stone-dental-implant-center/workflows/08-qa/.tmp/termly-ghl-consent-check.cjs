const fs = require('fs')
const { chromium } = require('C:/Users/ACER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core')
const SNIP = fs.readFileSync('C:/Users/ACER/orca/workspaces/Brandklout Website System/bk-stone-dental/deliver/brandklout/snippets/termly-ghl-consent/termly-ghl-consent.html', 'utf8')
const SITE = 'https://www.stonedentalimplantcenter.com'
const PATH = process.argv[2] || '/ads-landing-pages/all-on-x'
async function run(b, name, action) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' })
  await ctx.route(/termly\.io/, async (route) => { const r = route.request(); const res = await fetch(r.url(), { method: r.method(), headers: { ...r.headers(), origin: SITE }, body: r.postDataBuffer() || undefined }); const h = {}; res.headers.forEach((v, k) => { if (!/encoding|length/.test(k)) h[k] = v }); await route.fulfill({ status: res.status, headers: h, body: Buffer.from(await res.arrayBuffer()) }) })
  await ctx.route(u => u.pathname === PATH, async (route) => {
    const res = await fetch(route.request().url()); let html = await res.text()
    const n = html.length; html = html.replace(/<script>(?:(?!<\/script>)[\s\S])*?TERMLY_API_CACHE[\s\S]*?<\/script>/, '')
    if (html.length === n) console.log('(old bridge not found in HTML)')
    await route.fulfill({ status: 200, contentType: 'text/html', body: html.replace('</body>', SNIP + '</body>') })
  })
  const page = await ctx.newPage()
  await page.goto(SITE + PATH, { waitUntil: 'load' })
  await page.waitForTimeout(7000)
  if (action) { await page.getByRole('button', { name: action }).first().click(); await page.waitForTimeout(6000) }
  console.log("SCRIPTS", await page.evaluate(() => [...document.scripts].filter(s => /msgsndr|leadconnector/.test(s.src + (s.dataset.src||""))).map(s => [s.getAttribute("src"), s.type, s.dataset.src, s.dataset.categories, s.dataset.autoblocked].join(" "))))
  const vis = await page.evaluate(() => { const f = [...document.querySelectorAll('iframe')].find(f => /widget\/form/.test(f.getAttribute('src') || f.getAttribute('data-src') || ''))
    const r = f.getBoundingClientRect(); const box = [...document.querySelectorAll('.termly-blocked-content')].filter(b => /leadconnector/.test(b.textContent)).map(b => b.getBoundingClientRect().height)
    const vids = [...document.querySelectorAll('.termly-blocked-content')].filter(b => !/leadconnector/.test(b.textContent) && b.getBoundingClientRect().height > 0).length
    return { formH: Math.round(r.height), display: getComputedStyle(f).display, enableBoxHeights: box, otherPlaceholdersStillShown: vids } })
  const frame = page.frames().find(f => /widget\/form/.test(f.url()))
  let fields = 'NO FRAME'
  if (frame) { await frame.waitForSelector('.form-field-wrapper', { timeout: 15000 }).catch(() => {}); await page.waitForTimeout(1500)
    fields = (await frame.evaluate(() => [...document.querySelectorAll('.form-field-wrapper')].map(w => {
      const l = (w.querySelector('label')?.textContent || '').trim(); if (!/^(privacy|marketing)_/.test(l)) return null
      const cb = [...w.querySelectorAll('input[type=checkbox]')].filter(e => e.checked).map(e => e.value)
      const t = w.querySelector('input[type=text]'); const dd = w.querySelector('.multiselect__single')?.textContent?.trim()
      return l + '=' + (cb.length ? cb.join() : dd || t?.value || '')
    }).filter(Boolean))).join('  ') }
  const f = await page.$('iframe[data-bk-consent-form], iframe[src*="widget/form"]'); await f.scrollIntoViewIfNeeded(); await page.waitForTimeout(800)
  await page.screenshot({ path: 'lp-' + name.replace(/\W/g, '') + '.png' })
  console.log('\n=== ' + name, JSON.stringify(vis), '\n' + fields)
  await ctx.close()
}
;(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' })
  await run(b, 'NO CHOICE', null)
  await run(b, 'DECLINE', /^decline$/i)
  await run(b, 'ACCEPT', /^accept$/i)
  await b.close()
})()
