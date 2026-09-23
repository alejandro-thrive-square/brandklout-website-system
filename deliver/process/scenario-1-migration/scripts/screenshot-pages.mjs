#!/usr/bin/env node
/**
 * Full-page screenshots of every old-site page at desktop AND mobile width, plus a rendered-text
 * markdown extract per page (what the visitor actually saw, after JavaScript).
 *
 * Origin: bk-ifa-dentistry institute-for-advanced-dentistry/workflows/01-content-intake/.tmp/
 * current-site-scrape/scrapers/screenshots.mjs (2026-09-10, 56 pages at 1440). Generalized
 * 2026-09-23: URL list and output are arguments, a mobile width was added (no client had captured
 * the old site on mobile), motion is reduced, and shots are clipped to the viewport width.
 *
 *   node screenshot-pages.mjs --urls <scrape>/site-data.json --out <client>/.../old-site/screenshots > shots.log
 *   node screenshot-pages.mjs --urls urls.txt --out <dir> --widths 1440,390 --shard 0/2 > shots-0.log
 *   node screenshot-pages.mjs --urls urls.txt --out <dir> --local-root <mirror-dir>   # shoot a file:// mirror
 *
 * --urls takes scrape_site.py's site-data.json (records with url), a mirror's site-data.json
 * ({ pages: [{ url, status }] }), or a text file with one URL per line.
 * Writes <out>/w<width>/<slug>.png, <out>/pages/<slug>.md and <out>/shots-manifest.json.
 * Needs puppeteer-core (npm install in this folder) and Chrome; CHROME_PATH overrides the default.
 * Redirect stdout to a file (Node 24 on Windows dies on a piped stdout). It exits 1 when any page
 * fails: read the log, a few failures on dead URLs are normal.
 */
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import puppeteer from 'puppeteer-core'

const val = (n, d = null) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d }
const URLS = val('urls'), OUT = path.resolve(val('out', 'screenshots'))
const WIDTHS = val('widths', '1440,390').split(',').map(Number)
const LOCAL_ROOT = val('local-root')
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
if (!URLS) { console.error('usage: node screenshot-pages.mjs --urls <site-data.json|urls.txt> --out <dir> [--widths 1440,390] [--shard k/n] [--local-root dir]'); process.exit(2) }

const raw = fs.readFileSync(URLS, 'utf8')
let urls
if (URLS.endsWith('.json')) {
  const j = JSON.parse(raw)
  const list = Array.isArray(j) ? j : j.pages ?? []
  urls = list.filter((r) => !r.error && (!r.status || r.status === 'ok')).map((r) => r.url)
} else urls = raw.split(/\r?\n/).map((s) => s.trim()).filter((s) => /^https?:\/\//.test(s))
urls = [...new Set(urls)]
const [shardK, shardN] = (val('shard', '0/1')).split('/').map(Number)
urls = urls.filter((_, i) => i % shardN === shardK)

const slugOf = (u) => { const p = new URL(u).pathname.replace(/^\/|\/$/g, ''); return p ? p.replace(/\//g, '__') : 'home' }
for (const w of WIDTHS) fs.mkdirSync(path.join(OUT, `w${w}`), { recursive: true })
fs.mkdirSync(path.join(OUT, 'pages'), { recursive: true })

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--hide-scrollbars', '--disable-blink-features=AutomationControlled', '--force-prefers-reduced-motion'],
})
const results = []
for (const u of urls) {
  const slug = slugOf(u)
  const target = LOCAL_ROOT ? pathToFileURL(path.join(LOCAL_ROOT, ...new URL(u).pathname.split('/').filter(Boolean), 'index.html')).href : u
  const rec = { url: u, slug, shots: {} }
  for (const width of WIDTHS) {
    const page = await browser.newPage()
    try {
      await page.setUserAgent(width < 768
        ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
        : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36')
      await page.setViewport({ width, height: width < 768 ? 844 : 900, deviceScaleFactor: 1, isMobile: width < 768, hasTouch: width < 768 })
      await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
      /* domcontentloaded, then a capped wait: "load" blocks on hero video, iframes and beacons. */
      await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 60000 })
      await page.evaluate(() => Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 8000))]))
      await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.body.style.scrollBehavior = 'auto' })
      /* Walk the page so lazy images and scroll-triggered motion resolve, then force the rest. */
      await page.evaluate(async () => {
        const step = Math.floor(innerHeight * 0.7)
        for (let y = 0; y < document.body.scrollHeight + step; y += step) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 150)) }
        scrollTo(0, 0)
        document.querySelectorAll("img[loading='lazy']").forEach((i) => { i.loading = 'eager' })
        await Promise.race([
          Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }) })))),
          new Promise((r) => setTimeout(r, 15000)),
        ])
      })
      /* Scroll-revealed blocks sit at opacity 0 until triggered; show the designed state (content only). */
      await page.evaluate(() => {
        document.querySelectorAll('[style]').forEach((el) => {
          if (el.closest('header, nav, footer, [role=dialog], .modal, .popup')) return
          const cs = getComputedStyle(el)
          if (cs.opacity === '0' || cs.visibility === 'hidden') { el.style.setProperty('opacity', '1', 'important'); el.style.setProperty('visibility', 'visible', 'important'); el.style.setProperty('transform', 'none', 'important') }
        })
      })
      await new Promise((r) => setTimeout(r, 800))
      const height = await page.evaluate(() => Math.max(document.documentElement.scrollHeight, document.body.scrollHeight))
      const file = path.join(OUT, `w${width}`, `${slug}.png`)
      /* Clip to the viewport width: an overflowing element otherwise widens the shot. */
      await page.screenshot({ path: file, captureBeyondViewport: true, clip: { x: 0, y: 0, width, height: Math.min(height, 30000) } })
      rec.shots[width] = path.relative(OUT, file).replace(/\\/g, '/')

      if (width === WIDTHS[0]) {
        const x = await page.evaluate(() => {
          const q = (s) => document.querySelector(s)
          const meta = (n) => q(`meta[name='${n}']`)?.content || q(`meta[property='${n}']`)?.content || ''
          const main = q('main') || document.body
          const clone = main.cloneNode(true)
          clone.querySelectorAll('script,style,noscript,svg').forEach((n) => n.remove())
          const text = clone.innerText.replace(/\n{3,}/g, '\n\n').trim()
          return {
            title: document.title, description: meta('description'), ogImage: meta('og:image'),
            canonical: q('link[rel=canonical]')?.href || '', h1: q('h1')?.innerText.trim() || '',
            heads: [...main.querySelectorAll('h1,h2,h3')].map((h) => `${'#'.repeat(+h.tagName[1])} ${h.innerText.trim()}`),
            imgs: [...main.querySelectorAll('img')].map((i) => ({ src: i.currentSrc || i.src, alt: i.alt })),
            embeds: [...document.querySelectorAll('video source, video[src], iframe')].map((v) => v.src).filter(Boolean),
            forms: [...document.querySelectorAll('form, iframe[src*="leadconnector"], iframe[src*="form"]')].length,
            phones: [...new Set([...document.querySelectorAll('a[href^="tel:"]')].map((a) => a.getAttribute('href')))],
            text, words: text.split(/\s+/).filter(Boolean).length,
          }
        })
        rec.title = x.title; rec.words = x.words
        fs.writeFileSync(path.join(OUT, 'pages', `${slug}.md`), [
          `# ${x.h1 || x.title}`, '',
          `- URL: ${u}`, `- Title: ${x.title}`, `- Meta description: ${x.description}`, `- Canonical: ${x.canonical}`,
          `- OG image: ${x.ogImage}`, `- Words: ${x.words}`, `- Forms: ${x.forms}`, `- Phone links: ${x.phones.join(', ') || 'none'}`,
          `- Screenshots: ${WIDTHS.map((w) => `w${w}/${slug}.png`).join(', ')}`, '',
          '## Outline', ...x.heads.map((h) => `- ${h}`), '',
          '## Images on page', ...x.imgs.map((i) => `- ${i.src}${i.alt ? ` (alt: "${i.alt}")` : ''}`),
          ...(x.embeds.length ? ['', '## Video and embeds', ...x.embeds.map((v) => `- ${v}`)] : []),
          '', '## Text', '', x.text, '',
        ].join('\n'))
      }
      console.log(`shot ${slug} @${width}`)
    } catch (e) {
      rec.error = `${width}: ${e.message}`
      console.log(`FAIL ${slug} @${width}: ${e.message}`)
    } finally { await page.close() }
  }
  results.push(rec)
}
await browser.close()
const manifest = path.join(OUT, shardN > 1 ? `shots-manifest-${shardK}.json` : 'shots-manifest.json')
fs.writeFileSync(manifest, JSON.stringify(results, null, 2))
const failed = results.filter((r) => r.error)
console.log(`done: ${results.length - failed.length}/${results.length} pages at ${WIDTHS.join(' + ')} px; manifest ${manifest}`)
process.exit(failed.length ? 1 : 0)
