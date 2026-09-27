/* Does the navbar's logo pair survive Instatic's `sizes="auto"`?
 *
 * The importer rewrites every <img> into its image module, which forces
 * `loading="lazy"` and `sizes="auto, 100vw"` (upload directive trap 24 and the
 * `sizes` note). `auto` resolves against the element's RENDERED width — and
 * exactly one of the navbar's two logos is `display:none` at any moment, whose
 * rendered width is 0. A hidden image can therefore pick the 64px variant and
 * still be showing it in the instant after the bar flips from transparent to
 * solid, which is a blurred wordmark on the first scroll of every visit.
 *
 * This asserts the visible logo's `currentSrc` is a full-width variant both
 * before and after the flip, on the live site.
 *
 * Usage: node .tmp/logo-swap-check.mjs [base]   (default: INSTATIC_BASE_URL)
 */
import puppeteer from 'puppeteer-core'

const BASE = (process.argv[2] || process.env.INSTATIC_BASE_URL || '').replace(/\/$/, '')
if (!BASE) {
  console.error('no base: pass one or export INSTATIC_BASE_URL')
  process.exit(1)
}
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--hide-scrollbars'] })
const pg = await browser.newPage()
await pg.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 })
await pg.goto(`${BASE}/`, { waitUntil: 'networkidle0', timeout: 60000 })
await pg.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto' })

/* `naturalWidth` is NOT the test. With `w` descriptors and a `sizes` value
   Chrome density-corrects it, so a 640px variant in a 184px box reports 184
   and every image looks like it is exactly 1x. Read the chosen variant's own
   width out of the `-w<NNN>` filename instead. */
const variantWidth = (src) => Number((src.match(/-w(\d+)\.webp/) ?? [])[1] ?? 0)

const read = () =>
  pg.evaluate(() => {
    const nav = document.querySelector('.navbar_component')
    const out = []
    for (const img of nav.querySelectorAll('.brand_logo img')) {
      const r = img.getBoundingClientRect()
      out.push({
        cls: img.className,
        shown: getComputedStyle(img).opacity !== '0' && getComputedStyle(img).display !== 'none',
        w: Math.round(r.width),
        complete: img.complete && img.naturalWidth > 0,
        src: (img.currentSrc || img.src).split('/').pop(),
      })
    }
    return { solid: nav.classList.contains('is-solid'), imgs: out }
  })

const fails = []
for (const [label, scrollY] of [['transparent', 0], ['solid', 600]]) {
  await pg.evaluate((y) => window.scrollTo(0, y), scrollY)
  await new Promise((r) => setTimeout(r, 1500))
  const s = await read()
  const vis = s.imgs.find((i) => i.shown)
  console.log(`\n${label}  (is-solid=${s.solid})`)
  for (const i of s.imgs) {
    console.log(
      `  ${i.shown ? 'SHOWN ' : 'hidden'} ${i.cls.padEnd(17)} box ${String(i.w).padStart(4)}px` +
        `  variant ${String(variantWidth(i.src) || '-').padStart(4)}px  loaded ${i.complete ? 'yes' : 'NO '}  ${i.src}`,
    )
  }
  if (!vis) {
    fails.push(`${label}: neither logo is visible`)
    continue
  }
  const box = vis.w || s.imgs[0].w
  if (variantWidth(vis.src) < box * 2) {
    fails.push(`${label}: ${vis.cls} took a ${variantWidth(vis.src)}px variant for a ${box}px box — under 2x`)
  }
  // The whole point of shipping both files is that neither has to be fetched
  // at the moment the bar flips. If one is still unloaded, the swap flashes.
  for (const i of s.imgs) {
    if (!i.complete) fails.push(`${label}: ${i.cls} has not loaded — the swap will flash`)
  }
}

await browser.close()
console.log(fails.length ? `\nFAIL\n  ${fails.join('\n  ')}` : '\nFAIL  none — both states serve a full-resolution logo')
process.exitCode = fails.length ? 1 : 0
