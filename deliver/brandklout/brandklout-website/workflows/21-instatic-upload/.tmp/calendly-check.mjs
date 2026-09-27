import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => fs.existsSync(p))
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' })
const out = []
for (const width of [1440, 390]) {
  const page = await browser.newPage()
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36')
  await page.setViewport({ width, height: 900 })
  const errors = []
  page.on('console', (m) => { if (/Content Security Policy|frame-src|Refused/i.test(m.text())) errors.push(m.text().slice(0, 200)) })
  await page.goto('https://brandklout-production.up.railway.app/book', { waitUntil: 'networkidle2', timeout: 60000 })
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelector('#calendar')?.scrollIntoView() })
  await new Promise((r) => setTimeout(r, 6000))
  const info = await page.evaluate(() => {
    const f = document.querySelector('.calendly-shell iframe')
    const w = document.querySelector('.calendly-shell .wz-embed')
    return { hasEmbed: !!w, iframeSrc: f?.src ?? null, iframeH: f?.getBoundingClientRect().height ?? null, iframeW: f?.getBoundingClientRect().width ?? null, csp: document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content?.match(/frame-src[^;]*/)?.[0] ?? null }
  })
  const frames = page.frames().map((f) => f.url()).filter((u) => /calendly/.test(u))
  await page.screenshot({ path: `calendly-${width}.png`, clip: await page.evaluate(() => { const r = document.querySelector('.calendly-shell').getBoundingClientRect(); return { x: 0, y: r.top + scrollY, width: innerWidth, height: Math.min(r.height, 900) } }) })
  out.push({ width, ...info, calendlyFrames: frames.length, cspErrors: errors })
  await page.close()
}
await browser.close()
fs.writeFileSync('calendly-check.json', JSON.stringify(out, null, 1))
