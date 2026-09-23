#!/usr/bin/env node
/**
 * Recover old pages from the Wayback Machine when the old host is down, blocked or compromised:
 * raw HTML, a text extract, and optionally full-page screenshots, one capture per URL.
 *
 * Origin: bk-stone stone-surgical-arts/workflows/01-content-intake/.tmp/wayback-screenshots/capture.mjs
 * and archive-text/refetch-stubs.mjs (2026-08 and 2026-09: 112 of 119 pages recovered). Generalized
 * 2026-09-23 into one script that takes the domain and path list as arguments.
 *
 *   node wayback-capture.mjs --domain old.com --paths wayback/wayback-paths.txt --out <dir> > capture.log
 *   node wayback-capture.mjs --domain old.com --paths paths.txt --out <dir> --shots --width 1440
 *
 * Rules learned on Stone:
 *   - Pick the LARGEST 200 capture per URL from the CDX `length` column, not the newest. Recent
 *     captures are often the site's own bot page ("One moment, please...", ~5.6 KB) baked in.
 *   - Walk the candidates until one renders real content (text > 200 chars, taller than a viewport).
 *   - web.archive.org rate-limits: 7 s between requests, backoff 45/120/240 s. The run is resumable:
 *     pages already in <out>/html are skipped.
 *   - Record the capture date with every page: a 2023 capture is older content than the rest.
 * Writes <out>/html/<slug>.html (id_ raw capture), <out>/text/<slug>.md, <out>/shots/<slug>.png
 * (--shots, needs puppeteer-core + Chrome) and <out>/capture-manifest.json.
 */
import fs from 'node:fs'
import path from 'node:path'

const val = (n, d = null) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d }
const DOMAIN = val('domain'), PATHS = val('paths'), OUT = path.resolve(val('out', 'wayback-capture'))
const SHOTS = process.argv.includes('--shots'), WIDTH = Number(val('width', '1440'))
const DELAY = Number(process.env.WB_DELAY ?? 7000)
if (!DOMAIN || !PATHS) { console.error('usage: node wayback-capture.mjs --domain <old.com> --paths <file> --out <dir> [--shots] [--width 1440]'); process.exit(2) }
for (const d of ['html', 'text', 'shots']) fs.mkdirSync(path.join(OUT, d), { recursive: true })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const BOT = /One moment, please|being verified|Checking your browser|Please wait while|Just a moment/i
const slugOf = (p) => (p.replace(/^\/|\/$/g, '').replace(/\//g, '__') || 'home')
async function get(url) {
  for (const wait of [0, 45000, 120000, 240000]) {
    if (wait) { console.log(`  backoff ${wait / 1000}s`); await sleep(wait) }
    try {
      const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (migration recovery)' } })
      if (r.status === 429 || r.status >= 500) continue
      return { status: r.status, body: await r.text() }
    } catch { /* retry */ }
  }
  return { status: 0, body: '' }
}
function textFrom(html) {
  let s = html.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<(script|style|noscript|svg|iframe)\b[\s\S]*?<\/\1>/gi, ' ')
  s = s.replace(/<div id="wm-ipp[\s\S]*?<\/div>\s*<\/div>/gi, ' ')
  const title = (s.match(/<title[^>]*>([^<]*)<\/title>/i) || [, ''])[1].trim()
  const desc = (s.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i) || [, ''])[1]
  s = s.replace(/<h([1-6])[^>]*>/gi, (m, n) => '\n\n' + '#'.repeat(+n) + ' ').replace(/<\/(p|div|section|li|h[1-6]|tr|br|td)>/gi, '\n')
  s = s.replace(/<li[^>]*>/gi, '- ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#8217;|&rsquo;/g, "'")
  s = s.split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n')
  return { title, desc, text: s }
}

const paths = fs.readFileSync(PATHS, 'utf8').split(/\r?\n/).map((s) => s.trim()).filter(Boolean).map((p) => (p.startsWith('http') ? new URL(p).pathname : p))
const manifestPath = path.join(OUT, 'capture-manifest.json')
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {}
let browser = null
if (SHOTS) {
  const puppeteer = (await import('puppeteer-core')).default
  browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--hide-scrollbars'] })
}

for (const p of [...new Set(paths)]) {
  const slug = slugOf(p)
  if (manifest[p]?.ok) continue
  const cdx = await get(`https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(DOMAIN + p)}&output=json&filter=statuscode:200&fl=timestamp,original,length`)
  await sleep(DELAY)
  let rows = []
  try { rows = JSON.parse(cdx.body || '[]').slice(1) } catch {}
  rows.sort((a, b) => Number(b[2]) - Number(a[2]))
  let done = null
  for (const [ts, original] of rows.slice(0, 5)) {
    const cap = await get(`https://web.archive.org/web/${ts}id_/${original}`)
    await sleep(DELAY)
    const { title, desc, text } = textFrom(cap.body)
    if (cap.status !== 200 || BOT.test(title) || BOT.test(text.slice(0, 600)) || text.length < 200) continue
    fs.writeFileSync(path.join(OUT, 'html', `${slug}.html`), cap.body)
    fs.writeFileSync(path.join(OUT, 'text', `${slug}.md`), `# ${title}\n\n- SOURCE: ${original}\n- CAPTURE: ${ts} (web.archive.org)\n- Meta description: ${desc}\n\n${text}\n`)
    done = { ok: true, ts, original, title, chars: text.length }
    if (browser) {
      const page = await browser.newPage()
      try {
        await page.setViewport({ width: WIDTH, height: 1000 })
        await page.goto(`https://web.archive.org/web/${ts}if_/${original}`, { waitUntil: 'networkidle2', timeout: 90000 })
        await page.evaluate(() => ['#wm-ipp-base', '#wm-ipp', '#donato'].forEach((s) => document.querySelectorAll(s).forEach((e) => e.remove())))
        await page.screenshot({ path: path.join(OUT, 'shots', `${slug}.png`), fullPage: true })
      } catch (e) { done.shotError = e.message } finally { await page.close() }
      await sleep(DELAY)
    }
    break
  }
  manifest[p] = done ?? { ok: false, candidates: rows.length }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 1))
  console.log(`${done ? 'ok  ' : 'MISS'} ${p}${done ? ` @${done.ts} ${done.chars} chars` : ` (${rows.length} captures, none usable)`}`)
}
if (browser) await browser.close()
const vals = Object.values(manifest)
console.log(`done: ${vals.filter((v) => v.ok).length}/${vals.length} recovered; manifest ${manifestPath}`)
