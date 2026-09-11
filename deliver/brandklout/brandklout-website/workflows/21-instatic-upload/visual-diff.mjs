#!/usr/bin/env node
/**
 * Step 8 — LOOK at the published site next to the build, pixel for pixel.
 *
 * `compare-live.mjs` asks whether the computed styles and boxes agree. That is
 * a strong question and it is not the only one: it compares a fixed list of
 * properties on elements it can pair by class, it deliberately suppresses a
 * whole family of `img` differences as benign, and it cannot see anything that
 * is wrong INSIDE a picture — a photograph that failed to decode, a variant
 * that came back at the wrong crop, a section that renders but renders empty.
 *
 * So this one just takes the two full-page screenshots and subtracts them.
 * No pairing, no property list, no suppressions. Whatever is different shows up,
 * including the things nobody thought to assert.
 *
 * The diff runs in the browser on a canvas rather than through an image library,
 * because this repo has no image dependency and adding one for a screenshot
 * comparison is not worth it.
 *
 * Output, in `.tmp/visual/`:
 *   <slug>-<width>-local.png   full page, as built
 *   <slug>-<width>-live.png    full page, as published
 *   <slug>-<width>-diff.png    live, with changed pixels painted magenta
 * and on stdout, per page, the percentage of pixels that differ and the y-bands
 * where the difference is concentrated — which is what to go and look at.
 *
 * Usage:
 *   node visual-diff.mjs                 # 11 pages at 1440
 *   node visual-diff.mjs 390             # 11 pages at 390
 *   node visual-diff.mjs botox 1440      # one page
 */
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const LOCAL_ROOT = path.resolve(HERE, '../04-design/.tmp/med-spa/final-site')
const OUT = path.join(HERE, '.tmp', 'visual')
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'

function loadEnv() {
  let dir = HERE
  for (let i = 0; i < 12; i++) {
    const c = path.join(dir, '.env')
    if (fs.existsSync(c)) {
      for (const line of fs.readFileSync(c, 'utf8').split(/\r?\n/)) {
        const m = line.match(/^([A-Z_]+)=(.*)$/)
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
      }
      return
    }
    const up = path.dirname(dir)
    if (up === dir) break
    dir = up
  }
}
loadEnv()
const REMOTE = (process.env.INSTATIC_BASE_URL || '').replace(/\/$/, '')
if (!REMOTE) throw new Error('INSTATIC_BASE_URL is not set')

const ALL = ['index', 'treatments', 'botox', 'results', 'membership', 'financing', 'meet-the-doctor', 'team', 'about', 'book', 'thank-you']
const args = process.argv.slice(2)
const PAGES = args.find((a) => /^[a-z-]+$/.test(a)) ? [args.find((a) => /^[a-z-]+$/.test(a))] : ALL
const WIDTH = Number(args.find((a) => /^\d+$/.test(a)) ?? 1440)

/* A pixel counts as different only past this per-channel distance. Text
   antialiasing and a font served from a different origin move single channels
   by a few units on glyph edges and that is not a finding; a wrong colour, a
   missing picture or a shifted block moves them by tens. */
const THRESHOLD = 24

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' }
const server = http.createServer((req, res) => {
  const f = path.join(LOCAL_ROOT, decodeURIComponent(req.url.split('?')[0]))
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) return res.writeHead(404).end()
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] ?? 'application/octet-stream' })
  fs.createReadStream(f).pipe(res)
})
await new Promise((r) => server.listen(0, r))
const port = server.address().port

fs.mkdirSync(OUT, { recursive: true })
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', protocolTimeout: 300000, args: ['--no-sandbox', '--hide-scrollbars'] })

const VIEW = 900

/* Both sides are captured the same way and the way matters:

   - reduced motion, so what is compared is the settled page and not a frame of
     an animation (the same reason shot.mjs does it);
   - a full scroll first, because everything below the fold is lazy and an
     unscrolled capture is a page of empty frames;
   - a bounded wait for the images to arrive, and for the document to stop
     growing, because the two sides load from different origins;
   - and then TILES, not `fullPage: true`.

   > [!WARNING]
   > **`fullPage: true` IS NOT WHAT A VISITOR SEES, and on this site it invents
   > differences that are not there.** Chrome takes a full-page screenshot by
   > resizing the viewport to the whole document — 8,600px tall here — and
   > re-rendering. Every scroll-driven effect then evaluates against a viewport
   > no human has: the home page's `data-wipe` frame published EMPTY in a
   > full-page capture and is perfectly present at 1440x900, and a portrait on
   > /about did the same. Two rounds were spent chasing photographs that were
   > never missing.
   >
   > So scroll a real viewport down the page and stitch the tiles. Fixed
   > elements are hidden after the first tile so the navbar does not repeat down
   > the seam — done identically on both sides, so the comparison stays honest. */
async function shoot(url, file) {
  const pg = await browser.newPage()
  await pg.setViewport({ width: WIDTH, height: VIEW })
  await pg.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await pg.goto(url, { waitUntil: 'networkidle0', timeout: 120000 })
  await pg.evaluate(async () => {
    document.documentElement.style.scrollBehavior = 'auto'
    await new Promise((r) => {
      let y = 0
      const t = setInterval(() => {
        window.scrollBy(0, 700)
        y += 700
        if (y > document.body.scrollHeight) { clearInterval(t); r() }
      }, 25)
    })
    window.scrollTo({ top: 0, behavior: 'instant' })

    /* WAIT FOR EVERY <img> TO ACTUALLY ARRIVE, not just for the layout to
       settle. Every photograph on this site is `loading="lazy"`, and the
       published copies additionally carry `sizes="auto"`, so the browser picks
       a responsive candidate only once the element has a layout box. A capture
       taken before that lands gets the blurhash placeholder — a faint ghost of
       the right picture, in the right frame, at the right size — which
       subtracts against the local build as a SOLID BLOCK and reads exactly like
       a missing image. It cost a round of chasing a portrait on /about at 390
       that was never missing.

       Poll `complete && naturalWidth`, do NOT await `decode()`: on a lazy image
       that the browser has decided not to fetch yet, `decode()` never settles,
       and awaiting them all deadlocks the evaluate until the protocol timeout
       kills the run. Bounded either way. */
    const pending = () =>
      [...document.images].filter((im) => {
        const r = im.getBoundingClientRect()
        if (!r.width && !r.height) return false // not laid out; nothing to paint
        return !(im.complete && im.naturalWidth > 0)
      }).length
    for (let i = 0; i < 150 && pending() > 0; i++) {
      await new Promise((r) => setTimeout(r, 100))
    }

    const dims = () => document.documentElement.scrollHeight + 'x' + document.documentElement.scrollWidth
    let last = dims()
    let stable = 0
    for (let i = 0; i < 60 && stable < 3; i++) {
      await new Promise((r) => setTimeout(r, 100))
      const now = dims()
      stable = now === last ? stable + 1 : 0
      last = now
    }
  })
  const docH = await pg.evaluate(() => document.documentElement.scrollHeight)
  const tiles = []
  for (let y = 0, n = 0; y < docH; y += VIEW, n++) {
    await pg.evaluate(
      (top, first) => {
        window.scrollTo(0, top)
        for (const el of document.querySelectorAll('body *')) {
          const cs = getComputedStyle(el)
          if (cs.position === 'fixed') el.style.visibility = first ? '' : 'hidden'
        }
      },
      y, n === 0,
    )
    await new Promise((r) => setTimeout(r, 220))
    tiles.push((await pg.screenshot({ encoding: 'base64' })))
  }
  await pg.close()

  // Stitch. The last tile overlaps the one before it wherever the page does not
  // divide evenly by the viewport, so it is drawn at its true offset.
  const stitched = await canvasPage.evaluate(
    async (tileSrcs, w, view, docHeight) => {
      const load = (src) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.src = 'data:image/png;base64,' + src })
      const ims = await Promise.all(tileSrcs.map(load))
      const c = document.createElement('canvas')
      c.width = w
      c.height = docHeight
      const x = c.getContext('2d')
      const maxScroll = Math.max(0, docHeight - view)
      ims.forEach((im, n) => {
        const top = Math.min(n * view, maxScroll)
        x.drawImage(im, 0, top)
      })
      return c.toDataURL('image/png')
    },
    tiles, WIDTH, VIEW, docH,
  )
  fs.writeFileSync(file, Buffer.from(stitched.split(',')[1], 'base64'))
  return docH
}

// The comparison itself, run inside a blank page so canvas does the decoding.
const canvasPage = await browser.newPage()
await canvasPage.goto('about:blank')

async function diff(localFile, liveFile, diffFile) {
  const a = 'data:image/png;base64,' + fs.readFileSync(localFile).toString('base64')
  const b = 'data:image/png;base64,' + fs.readFileSync(liveFile).toString('base64')
  const result = await canvasPage.evaluate(
    async (aSrc, bSrc, threshold) => {
      const load = (src) => new Promise((res, rej) => {
        const im = new Image()
        im.onload = () => res(im)
        im.onerror = rej
        im.src = src
      })
      const [ia, ib] = await Promise.all([load(aSrc), load(bSrc)])
      const w = Math.min(ia.width, ib.width)
      const h = Math.min(ia.height, ib.height)
      const grab = (im) => {
        const c = document.createElement('canvas')
        c.width = w
        c.height = h
        const x = c.getContext('2d', { willReadFrequently: true })
        x.drawImage(im, 0, 0)
        return x.getImageData(0, 0, w, h)
      }
      const da = grab(ia)
      const db = grab(ib)

      const out = document.createElement('canvas')
      out.width = w
      out.height = h
      const octx = out.getContext('2d')
      octx.drawImage(ib, 0, 0)
      const od = octx.getImageData(0, 0, w, h)

      let changed = 0
      const rows = new Int32Array(h)
      for (let i = 0, p = 0; i < da.data.length; i += 4, p++) {
        const d =
          Math.abs(da.data[i] - db.data[i]) +
          Math.abs(da.data[i + 1] - db.data[i + 1]) +
          Math.abs(da.data[i + 2] - db.data[i + 2])
        if (d > threshold) {
          changed++
          rows[(p / w) | 0]++
          od.data[i] = 255
          od.data[i + 1] = 0
          od.data[i + 2] = 255
          od.data[i + 3] = 255
        }
      }
      octx.putImageData(od, 0, 0)

      // Bands: contiguous runs of rows where more than 1% of the width differs.
      const bands = []
      let start = -1
      for (let y = 0; y <= h; y++) {
        const hot = y < h && rows[y] > w * 0.01
        if (hot && start < 0) start = y
        if (!hot && start >= 0) {
          if (y - start > 4) bands.push([start, y, Math.max(...Array.from(rows.slice(start, y)))])
          start = -1
        }
      }
      bands.sort((p, q) => (q[1] - q[0]) * q[2] - (p[1] - p[0]) * p[2])
      return {
        w, h,
        aH: ia.height, bH: ib.height,
        pct: (changed / (w * h)) * 100,
        bands: bands.slice(0, 8),
        png: out.toDataURL('image/png'),
      }
    },
    a, b, THRESHOLD,
  )
  fs.writeFileSync(diffFile, Buffer.from(result.png.split(',')[1], 'base64'))
  delete result.png
  return result
}

const summary = []
for (const slug of PAGES) {
  const route = slug === 'index' ? '' : slug
  const localFile = path.join(OUT, `${slug}-${WIDTH}-local.png`)
  const liveFile = path.join(OUT, `${slug}-${WIDTH}-live.png`)
  const diffFile = path.join(OUT, `${slug}-${WIDTH}-diff.png`)

  await shoot(`http://127.0.0.1:${port}/${slug}.html`, localFile)
  await shoot(`${REMOTE}/${route}`, liveFile)
  const r = await diff(localFile, liveFile, diffFile)

  const heightNote = r.aH === r.bH ? '' : `  HEIGHT local ${r.aH} vs live ${r.bH} (${r.bH - r.aH >= 0 ? '+' : ''}${r.bH - r.aH})`
  console.log(`${slug.padEnd(18)} ${r.pct.toFixed(3).padStart(7)}% differ${heightNote}`)
  for (const [y0, y1, peak] of r.bands) {
    console.log(`    y ${String(y0).padStart(5)}-${String(y1).padStart(5)}  (${y1 - y0}px tall, peak ${((peak / r.w) * 100).toFixed(0)}% of the width)`)
  }
  summary.push({ slug, pct: r.pct, bands: r.bands, dh: r.bH - r.aH })
}

console.log('\nworst first:')
for (const s of [...summary].sort((a, b) => b.pct - a.pct)) {
  console.log(`  ${s.pct.toFixed(3).padStart(7)}%  ${s.slug}${s.dh ? `  (${s.dh > 0 ? '+' : ''}${s.dh}px tall)` : ''}`)
}
console.log(`\nimages in ${OUT}`)

await browser.close()
server.close()
