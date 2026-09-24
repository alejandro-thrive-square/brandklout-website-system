#!/usr/bin/env node
/**
 * Pre-handoff content QA: the two things a human reviewer otherwise catches by eye.
 *
 *   COPY FIT (per width) — every text box measured in the rendered page:
 *     overflow   text wider/taller than its box, or cut by an overflow:hidden ancestor
 *     runt       a heading, lead, button or caption whose last line is one short word
 *     button     a button / text link that wraps to a second line
 *     measure    body copy running wider than ~90 characters a line (desktop)
 *     tall       a heading taking more than 4 lines (h1/h2) or 5 (h3) at mobile
 *     tiny       body text under 14px
 *     uneven     sibling cards in one row whose copy differs >1.8x in length
 *
 *   IMAGE CONTEXT — every <img> placement with what surrounds it:
 *     the rendered crop at 1440 and 390 (clip screenshots), the section heading,
 *     the nearest card/figure text, alt, and pixel density (natural / rendered).
 *     Written to image-context.json and rendered into contact sheets
 *     (image-sheets/sheet-NN.png) for a reviewer — human or model — to judge
 *     "does this photo show what the copy says". Repeats are flagged mechanically:
 *     the same photo twice on one page, and a photo on more than 4 pages.
 *
 * Runs under prefers-reduced-motion so pins and scroll-written text sit still.
 *
 * Usage: node qa-fit.mjs [slug ...] [--base=https://host] [--widths=1440,991,390] [--no-images]
 * Output: 08-qa/.tmp/fit/copy-fit.json, fit/image-context.json, fit/image-sheets/*.png, fit/crops/*
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import { fileURLToPath } from 'node:url'

const PUPPETEER_DIR = process.env.PUPPETEER_DIR || 'C:/Users/ACER/orca/workspaces/Brandklout Website System/bk-stone/node_modules/'
const puppeteer = createRequire(PUPPETEER_DIR)('puppeteer-core')
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const HERE = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.resolve(HERE, '../../04-design/.tmp/site-src/dist')
const OUT = path.join(HERE, 'fit')
const CROPS = path.join(OUT, 'crops')
const SHEETS = path.join(OUT, 'image-sheets')

const args = process.argv.slice(2)
const widthsArg = args.find((a) => a.startsWith('--widths='))
const WIDTHS = widthsArg ? widthsArg.slice(9).split(',').map(Number) : [1440, 991, 390]
const IMAGES = !args.includes('--no-images')
const only = args.filter((a) => !a.startsWith('--'))
const BASE_ARG = (args.find((a) => a.startsWith('--base=')) || '').slice(7).replace(/\/$/, '')

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' }
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0])
  if (p === '/') p = '/index.html'
  const f = path.join(DIST, p)
  if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' })
  fs.createReadStream(f).pipe(res)
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const PORT = server.address().port
const urlFor = (slug) => (BASE_ARG ? `${BASE_ARG}/${slug === 'index' ? '' : slug}` : `http://127.0.0.1:${PORT}/${slug === 'index' ? '' : slug + '.html'}`)

const walk = (d, pre = '') => fs.readdirSync(d).flatMap((e) => (fs.statSync(path.join(d, e)).isDirectory() ? (e === 'assets' || e === 'media' ? [] : walk(path.join(d, e), pre + e + '/')) : e.endsWith('.html') ? [pre + e.replace(/\.html$/, '')] : []))
let slugs = walk(DIST).sort()
if (only.length) slugs = slugs.filter((s) => only.includes(s))

fs.mkdirSync(CROPS, { recursive: true })
fs.mkdirSync(SHEETS, { recursive: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, protocolTimeout: 300000, args: ['--no-sandbox', '--disable-gpu'] })

/* ---- in-page measurement (runs in the browser) ---- */
function measure(width) {
  const out = []
  const vis = (el) => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0.05 && r.width > 0 && r.height > 0 }
  const txt = (el) => (el.innerText || '').replace(/\s+/g, ' ').trim()
  const where = (el) => {
    const sec = el.closest('section, header, footer, nav')
    const id = sec ? (sec.id || sec.getAttribute('data-chapter') || sec.className.split(' ')[0] || sec.tagName.toLowerCase()) : '?'
    const cls = (el.className && typeof el.className === 'string') ? '.' + el.className.trim().split(/\s+/).join('.') : ''
    return `${id} > ${el.tagName.toLowerCase()}${cls}`
  }
  // line boxes of an element's text, one entry per word: [{w, top}]
  const words = (el) => {
    const res = []
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    let n
    while ((n = tw.nextNode())) {
      const re = /\S+/g
      let m
      while ((m = re.exec(n.data))) {
        const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length)
        const rc = r.getClientRects()[0]
        if (rc && rc.width) res.push({ w: m[0], top: Math.round(rc.top), bottom: Math.round(rc.bottom), right: rc.right, left: rc.left })
      }
    }
    return res
  }
  const lines = (ws) => {
    const L = []
    for (const w of ws) {
      const last = L[L.length - 1]
      if (last && Math.abs(last.top - w.top) < (w.bottom - w.top) * 0.5) last.words.push(w.w)
      else L.push({ top: w.top, words: [w.w] })
    }
    return L
  }
  const nav = (el) => !!el.closest('nav, .nav, .dx, .site-index, footer, .mbar, [aria-hidden="true"]')
  const main = document.querySelector('main') || document.body

  const clipAncestor = (el) => {
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      const s = getComputedStyle(a)
      if (/(hidden|clip)/.test(s.overflowX + s.overflowY)) return a
    }
    return null
  }

  const TEXT = 'h1,h2,h3,h4,p,li,blockquote,figcaption,.btn,.button,a.textlink,.chapter-tag,.lead,.eyebrow,label,dt,dd,td,th'
  for (const el of main.querySelectorAll(TEXT)) {
    if (nav(el) || !vis(el)) continue
    const t = txt(el)
    if (!t) continue
    const tag = el.tagName.toLowerCase()
    const s = getComputedStyle(el)
    const fs_ = parseFloat(s.fontSize)
    const isHead = /^h[1-4]$/.test(tag)
    const isBtn = el.matches('.btn,.button,a.textlink,button') || (tag === 'a' && /btn|cta/.test(el.className))
    const ws = words(el)
    const L = lines(ws)
    const r = el.getBoundingClientRect()

    // overflow: own box, or cut by a clipping ancestor
    if (el.scrollWidth > el.clientWidth + 2 && s.overflowX !== 'visible' && s.overflowX !== 'auto') out.push({ kind: 'overflow', where: where(el), text: t.slice(0, 90), detail: `scrollWidth ${el.scrollWidth} > ${el.clientWidth}` })
    const vw = document.documentElement.clientWidth
    const straddleV = ws.filter((w) => w.left < vw && w.right > vw + 1)
    if (straddleV.length && r.right <= vw + 1) out.push({ kind: 'overflow', where: where(el), text: t.slice(0, 90), detail: `"${straddleV[0].w}" runs past the viewport edge` })
    const ca = clipAncestor(el)
    if (ca) {
      const cr = ca.getBoundingClientRect()
      // a word straddling the clip edge is cut; a card parked wholly off-canvas (a rail) is not
      const cut = ws.filter((w) => (w.left < cr.right && w.right > cr.right + 1) || (w.right > cr.left && w.left < cr.left - 1) || (w.top < cr.bottom && w.bottom > cr.bottom + 1))
      const inside = r.left >= cr.left - 1 && r.right <= cr.right + 1 && r.top < cr.bottom // box inside the clip: a card peeking in from a rail is not a cut
      if (cut.length && inside && cr.height > 20) out.push({ kind: 'overflow', where: where(el), text: t.slice(0, 90), detail: `${cut.length} word(s) cut by ${ca.className || ca.tagName} (e.g. "${cut[0].w}")` })
    }

    // runt: one short word alone on the last line
    const runtScope = isHead || isBtn || el.matches('.st-big,.display,figcaption,blockquote,.chapter-tag,.lead') 
    if (runtScope && L.length >= 2) {
      const last = L[L.length - 1].words
      const prev = L[L.length - 2].words // one word under a one- or two-word line is a line break, not an orphan
      if (last.length === 1 && prev.length >= 3 && last[0].replace(/[^\w]/g, '').length <= 9) out.push({ kind: 'runt', where: where(el), text: t.slice(0, 90), detail: `last line is "${last[0]}" (${L.length} lines, ${Math.round(r.width)}px wide)` })
    }
    if (isBtn && L.length >= 2) out.push({ kind: 'button', where: where(el), text: t.slice(0, 90), detail: `wraps to ${L.length} lines at ${Math.round(r.width)}px` })
    if (isHead && width < 500) {
      const cap = tag === 'h3' || tag === 'h4' ? 5 : 4
      if (L.length > cap) out.push({ kind: 'tall', where: where(el), text: t.slice(0, 90), detail: `${L.length} lines at ${Math.round(fs_)}px` })
    }
    if (!isHead && !isBtn && (tag === 'p' || tag === 'li') && t.length > 120 && L.length >= 2 && width >= 1200) {
      const cpl = Math.round(t.length / L.length)
      if (cpl > 92) out.push({ kind: 'measure', where: where(el), text: t.slice(0, 90), detail: `~${cpl} characters a line` })
    }
    const tinyKey = 'tiny' + where(el).replace(/^.*> /, '')
    if (!isHead && (tag === 'p' || tag === 'li') && fs_ < 14 && t.length > 40 && !out.some((o) => o._k === tinyKey)) out.push({ kind: 'tiny', _k: tinyKey, where: where(el), text: t.slice(0, 90), detail: `${fs_}px` })
  }

  // uneven: siblings in one visual row (same class, same top) with lopsided copy
  if (width >= 900) {
    const seen = new Set()
    for (const parent of main.querySelectorAll('*')) {
      const kids = [...parent.children].filter((k) => vis(k) && k.className && typeof k.className === 'string')
      if (kids.length < 3) continue
      const cls = kids[0].className
      if (!kids.every((k) => k.className === cls)) continue
      const rows = {}
      for (const k of kids) { const top = Math.round(k.getBoundingClientRect().top / 8); (rows[top] ||= []).push(k) }
      for (const row of Object.values(rows)) {
        if (row.length < 2) continue
        const lens = row.map((k) => txt(k).length).filter((n) => n > 0)
        if (lens.length < 2) continue
        const mx = Math.max(...lens), mn = Math.min(...lens)
        const key = where(parent) + cls
        if (mn > 20 && mx / mn > 1.8 && !seen.has(key)) {
          seen.add(key)
          out.push({ kind: 'uneven', where: where(parent) + ' > .' + cls.split(' ')[0], text: txt(row[lens.indexOf(mx)]).slice(0, 60), detail: `copy lengths ${lens.join('/')} chars across one row` })
        }
      }
    }
  }
  return out
}

function collectImages() {
  const txt = (el) => (el ? (el.innerText || '').replace(/\s+/g, ' ').trim() : '')
  const out = []
  const imgs = [...document.querySelectorAll('main img, header img')].filter((i) => !i.closest('nav, footer, .dx, .mbar') && !/logo/.test(i.src))
  imgs.forEach((img, i) => {
    img.setAttribute('data-qa-img', i)
    const sec = img.closest('section') || img.closest('header')
    const heads = sec ? [...sec.querySelectorAll('h1,h2,h3')].slice(0, 2).map(txt) : []
    // the nearest ancestor that also holds text: that is the copy this photo illustrates
    let card = img.parentElement
    while (card && card !== sec && txt(card).length < 25) card = card.parentElement
    const r = img.getBoundingClientRect()
    const s = getComputedStyle(img)
    out.push({
      idx: i,
      src: decodeURIComponent((img.currentSrc || img.src).split('/').pop().split('?')[0]),
      alt: img.getAttribute('alt'),
      section: sec ? (sec.id || sec.getAttribute('data-chapter') || sec.className.split(' ')[0]) : '',
      headings: heads,
      context: txt(card).slice(0, 320),
      rendered: [Math.round(r.width), Math.round(r.height)],
      natural: [img.naturalWidth, img.naturalHeight],
      fit: s.objectFit, pos: s.objectPosition,
      hidden: !(r.width > 2 && r.height > 2 && s.display !== 'none' && s.visibility !== 'hidden'),
      docY: Math.round(r.top + scrollY), docX: Math.round(r.left)
    })
  })
  return out
}

const copy = []
const images = []
let n = 0
for (const slug of slugs) {
  for (const width of WIDTHS) {
    const page = await browser.newPage()
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
    if (BASE_ARG) { await page.setRequestInterception(true); page.on('request', (r) => (/sienna-accessibility/.test(r.url()) ? r.abort() : r.continue())) }
    await page.setViewport({ width, height: width < 700 ? 844 : 900, deviceScaleFactor: 1 })
    try {
      await page.goto(urlFor(slug), { waitUntil: 'networkidle0', timeout: 90000 })
    } catch (e) { copy.push({ slug, width, kind: 'load', detail: e.message }); await page.close(); continue }
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager' }) })
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)) } scrollTo(0, 0) })
    await page.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; setTimeout(r, 8000) })))))
    await page.evaluate(() => document.fonts && document.fonts.ready)
    await sleep(600)
    for (const f of await page.evaluate(measure, width)) copy.push({ slug, width, ...f })

    if (IMAGES && (width === 1440 || width === 390)) {
      await page.evaluate(() => { for (const e of document.querySelectorAll('body *')) { const p = getComputedStyle(e).position; if (p === 'fixed' || p === 'sticky') e.style.setProperty('visibility', 'hidden', 'important') } })
      const list = await page.evaluate(collectImages)
      for (const im of list) {
        const rec = images.find((x) => x.slug === slug && x.idx === im.idx) || (images.push({ slug, ...im, crops: {} }), images[images.length - 1])
        rec[`rendered${width}`] = im.rendered
        rec[`hidden${width}`] = im.hidden
        rec.density = rec.density || {}
        rec.density[width] = im.hidden || !im.rendered[0] ? null : +(Math.min(im.natural[0] / im.rendered[0], im.natural[1] / im.rendered[1]) || 0).toFixed(2)
        if (im.hidden) continue
        const file = `${slug.replace(/\//g, '__')}-${im.idx}-${width}.jpg`
        try {
          const el = await page.$(`[data-qa-img="${im.idx}"]`)
          await el.scrollIntoView()
          await sleep(60)
          await el.screenshot({ path: path.join(CROPS, file), type: 'jpeg', quality: 70 })
          rec.crops[width] = file
        } catch { /* off-canvas slide: judged from the other width */ }
      }
    }
    await page.close()
  }
  n++
  if (n % 10 === 0) console.log(`${n}/${slugs.length} pages`)
}

/* ---- mechanical image repeats ---- */
const bySrc = {}
for (const im of images) (bySrc[im.src] ||= new Set()).add(im.slug)
for (const im of images) {
  im.flags = []
  const same = images.filter((x) => x.slug === im.slug && x.src === im.src)
  if (same.length > 1 && same[0].idx === im.idx) im.flags.push(`used ${same.length}x on this page`)
  if (bySrc[im.src].size > 4) im.flags.push(`on ${bySrc[im.src].size} pages`)
  const d = Math.min(...Object.values(im.density || {}).filter((v) => v))
  if (isFinite(d) && d < 0.85) im.flags.push(`upscaled (${d}x source pixels per CSS pixel)`)
  if (im.alt === null) im.flags.push('no alt attribute')
}

fs.writeFileSync(path.join(OUT, 'copy-fit.json'), JSON.stringify(copy, null, 1))
if (IMAGES) fs.writeFileSync(path.join(OUT, 'image-context.json'), JSON.stringify(images, null, 1)) // --no-images must not blank the last image pass

/* ---- contact sheets: one row per distinct (photo, context) placement ---- */
if (IMAGES) {
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
  const seenKey = new Set()
  const rows = images.filter((im) => {
    if (!im.crops[1440] && !im.crops[390]) return false
    const k = im.src + '|' + im.context.slice(0, 80)
    if (seenKey.has(k)) return false
    seenKey.add(k); return true
  })
  const PER = 8
  const dataUri = (f) => (f ? 'data:image/jpeg;base64,' + fs.readFileSync(path.join(CROPS, f)).toString('base64') : '')
  const sheetIndex = []
  for (let s = 0; s * PER < rows.length; s++) {
    const chunk = rows.slice(s * PER, s * PER + PER)
    const html = `<html><body style="margin:0;font:13px/1.35 Arial;background:#fff;width:1400px">${chunk.map((im, i) => `
      <div style="display:grid;grid-template-columns:40px 360px 150px 1fr;gap:14px;padding:12px;border-bottom:2px solid #ccc;align-items:start">
        <div style="font:bold 22px Arial">${s * PER + i + 1}</div>
        <div>${im.crops[1440] ? `<img src="${dataUri(im.crops[1440])}" style="max-width:360px;max-height:240px;display:block">` : ''}</div>
        <div>${im.crops[390] ? `<img src="${dataUri(im.crops[390])}" style="max-width:150px;max-height:240px;display:block">` : ''}</div>
        <div><b>${esc(im.slug)}</b> · ${esc(im.section)} · <code>${esc(im.src)}</code><br>
          <b>Heading:</b> ${esc(im.headings.join(' / '))}<br>
          <b>Copy:</b> ${esc(im.context)}<br>
          <b>Alt:</b> ${esc(im.alt)}<br>
          <span style="color:#b00">${esc(im.flags.join(' · '))}</span></div>
      </div>`).join('')}</body></html>`
    const page = await browser.newPage()
    await page.setViewport({ width: 1400, height: 800 })
    await page.setContent(html, { waitUntil: 'load' })
    const name = `sheet-${String(s + 1).padStart(2, '0')}.png`
    await page.screenshot({ path: path.join(SHEETS, name), fullPage: true })
    await page.close()
    sheetIndex.push({ sheet: name, rows: chunk.map((im, i) => ({ n: s * PER + i + 1, slug: im.slug, idx: im.idx, src: im.src })) })
  }
  fs.writeFileSync(path.join(OUT, 'image-sheets.json'), JSON.stringify(sheetIndex, null, 1))
  console.log(`image placements ${images.length}, distinct ${rows.length}, sheets ${sheetIndex.length}`)
}

const tally = {}
for (const c of copy) tally[c.kind] = (tally[c.kind] || 0) + 1
console.log(JSON.stringify({ pages: slugs.length, widths: WIDTHS, copyFindings: tally }))
await browser.close()
server.close()
