#!/usr/bin/env node
/**
 * Recovers every blog post from the client's own site backup.
 *
 * WHY THIS EXISTS. The 2026-09-08 run recovered three articles from the Wayback
 * Machine, because that was all the intake CDX list exposed. The client then
 * supplied a full file backup of the old site, which turns out to hold THIRTY
 * NINE posts across two trees that Wayback never surfaced:
 *
 *   old-blog/   15 posts   patient-education pieces, the three already built
 *                          among them
 *   news/       24 posts   celebrity-angle SEO pieces, noticeably thinner
 *
 * A third tree, `blog/`, is a WordPress installation, not rendered pages. Its
 * posts live in a database that is not in the backup; every readable post is in
 * the two static trees above, so this reads those and ignores `blog/`.
 *
 * THE MARKUP. Not Elementor despite the size of the files: a custom theme whose
 * article container is `div.mw1200.animate.fadeIn`, holding the `h1.title-md`
 * and the body. Every one of the 39 pages agrees on that shape. The pages are
 * ~640KB each because the whole nav, footer and schema blob ship inline, which
 * is why this walks the DOM rather than pattern-matching the file.
 *
 * Pages are loaded with scripts disabled and every non-file:// request aborted,
 * so nothing here touches the network or runs the old site's tracking.
 *
 * OUTPUT, into .tmp/archive-text/, matching the three files the earlier run
 * left behind so the two sets are interchangeable:
 *
 *   blog-<slug>.html   the article container's innerHTML, nothing else
 *   blog-<slug>.txt    title, date if one was found, then the text
 *   archive-manifest.json   every post with its title, tree, date, word count
 *                           and headings — the inventory an editor works from
 *
 * This is RECOVERY ONLY. It deliberately makes no editorial judgement: the
 * dated statistics, guaranteed outcomes and celebrity framing all come through
 * untouched, because deciding what to do about them is a separate step with a
 * separate record in BLOG-CONTENT.md.
 *
 * Usage: node extract-archive-posts.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import puppeteer from 'puppeteer-core'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(HERE, '.tmp', 'website-files')
const OUT = path.join(HERE, '.tmp', 'archive-text')
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const TREES = ['old-blog', 'news']

fs.mkdirSync(OUT, { recursive: true })

/* The three already carried into blog-data.mjs, under the filenames the earlier
   run used. Recorded so the manifest can mark them and nothing is overwritten
   with a differently-named duplicate. */
const ALREADY_BUILT = new Set([
  'dermal-fillers-vs-botox-comparing-the-two-top-treatments',
  'what-are-the-top-types-of-plastic-surgery-in-the-world',
  'why-do-people-get-plastic-surgery-here-are-the-top-reasons',
])

const dirs = []
for (const tree of TREES) {
  const base = path.join(ROOT, tree)
  if (!fs.existsSync(base)) throw new Error('missing tree: ' + base)
  for (const name of fs.readdirSync(base)) {
    const idx = path.join(base, name, 'index.html')
    if (fs.statSync(path.join(base, name)).isDirectory() && fs.existsSync(idx)) dirs.push({ tree, name, idx })
  }
}
console.log(`${dirs.length} post directories across ${TREES.join(', ')}`)

const EXTRACT = () => {
  const h1 = document.querySelector('h1')
  const box = h1 && h1.closest('div.mw1200')
  if (!box) return { error: 'no h1.mw1200 container' }

  /* Strip the furniture the container also carries: breadcrumbs, share rails,
     the "recent posts" list and any script or style that rode along. */
  const clone = box.cloneNode(true)
  for (const sel of ['script', 'style', 'noscript', 'nav', 'form', '.breadcrumb', '.share', '.social', '.sidebar', '.recent-posts']) {
    for (const el of clone.querySelectorAll(sel)) el.remove()
  }

  const headings = [...clone.querySelectorAll('h2, h3')].map((h) => h.innerText.trim()).filter(Boolean)
  const blocks = []
  for (const el of clone.querySelectorAll('h1, h2, h3, p, li')) {
    const t = el.innerText.trim()
    if (t) blocks.push(el.tagName.toLowerCase() === 'li' ? '- ' + t : t)
  }

  /* No <time> element anywhere on these pages; the visible date, when there is
     one, is a bare line near the top. Take the first thing that parses as a
     date and sits in the first few blocks. */
  let date = null
  for (const b of blocks.slice(0, 4)) {
    if (/^[A-Z][a-z]+\s+\d{1,2},?\s+\d{4}$/.test(b.replace(/\s+/g, ' ').trim())) { date = b.replace(/\s+/g, ' ').trim(); break }
  }

  return {
    title: h1.innerText.trim(),
    docTitle: document.title,
    html: clone.innerHTML,
    text: blocks.join('\n'),
    headings,
    date,
    words: clone.innerText.trim().split(/\s+/).length,
    images: [...clone.querySelectorAll('img')].map((i) => i.getAttribute('src')).filter(Boolean),
    links: [...clone.querySelectorAll('a')].map((a) => a.getAttribute('href')).filter(Boolean),
  }
}

/* Chrome dies partway through a 39-page run: these are ~640KB documents and the
   renderer does not survive the whole list in one process. So the browser is
   recycled every RECYCLE pages, each page gets one retry on a fresh browser,
   and anything already on disk is skipped — the script is resumable. */
const RECYCLE = 6
let browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
const restart = async () => {
  try { await browser.close() } catch {}
  browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
}

const manifest = []
const failures = []

async function grab(idx) {
  const pg = await browser.newPage()
  try {
    await pg.setRequestInterception(true)
    pg.on('request', (r) => (r.url().startsWith('file:') ? r.continue() : r.abort()))
    await pg.setJavaScriptEnabled(false)
    await pg.goto(pathToFileURL(idx).href, { waitUntil: 'domcontentloaded', timeout: 60000 })
    const d = await pg.evaluate(EXTRACT)
    if (d.error) throw new Error(d.error)
    return d
  } finally {
    try { await pg.close() } catch {}
  }
}

let done = 0
for (const { tree, name, idx } of dirs) {
  /* The three Wayback recoveries from the 2026-09-08 run keep their original
     files: BLOG-CONTENT.md cites their capture timestamps, and rewriting them
     from a different source would quietly falsify that table. */
  if (ALREADY_BUILT.has(name)) {
    manifest.push({ slug: name, tree, title: null, source: 'wayback (2026-09-08 run, left untouched)', alreadyBuilt: true })
    console.log(`  keep ${tree}/${name}  (Wayback recovery, not overwritten)`)
    continue
  }

  if (done > 0 && done % RECYCLE === 0) await restart()
  done++

  let d = null
  for (const attempt of [1, 2]) {
    try { d = await grab(idx); break } catch (e) {
      if (attempt === 2) { failures.push({ tree, name, error: String(e.message || e) }); console.log(`  FAIL ${tree}/${name}  ${e.message || e}`); break }
      await restart()
    }
  }
  if (!d) continue

  fs.writeFileSync(path.join(OUT, `blog-${name}.html`), d.html, 'utf8')
  fs.writeFileSync(path.join(OUT, `blog-${name}.txt`), [d.title, d.date || '', d.text].filter(Boolean).join('\n'), 'utf8')

  manifest.push({
    slug: name, tree, title: d.title, docTitle: d.docTitle, date: d.date,
    words: d.words, headings: d.headings, images: d.images.length,
    externalLinks: d.links.filter((h) => /^https?:/.test(h)).length,
    alreadyBuilt: false,
  })
  console.log(`  ok   ${tree}/${name}  ${String(d.words).padStart(5)} words, ${d.headings.length} headings`)
}
try { await browser.close() } catch {}

manifest.sort((a, b) => (a.tree === b.tree ? b.words - a.words : a.tree < b.tree ? -1 : 1))
fs.writeFileSync(path.join(OUT, 'archive-manifest.json'), JSON.stringify({ recovered: manifest.length, failures, posts: manifest }, null, 2), 'utf8')

const byTree = {}
for (const m of manifest) (byTree[m.tree] ||= []).push(m)
console.log(`\nrecovered ${manifest.length}, failed ${failures.length}`)
for (const [tree, list] of Object.entries(byTree)) {
  const w = list.map((m) => m.words).filter(Boolean)
  console.log(`  ${tree}: ${list.length} posts, ${Math.min(...w)}-${Math.max(...w)} words, median ${w.sort((a, b) => a - b)[Math.floor(w.length / 2)]}`)
}
console.log(`\nwrote ${OUT}/archive-manifest.json`)
