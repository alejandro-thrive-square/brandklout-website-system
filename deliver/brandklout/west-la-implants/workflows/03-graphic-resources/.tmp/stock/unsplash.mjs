#!/usr/bin/env node
/**
 * Unsplash candidates for briefs Freepik cannot fill (named places). Unsplash Licence: free for
 * commercial use, no attribution required. curl gets a 401, so the public search page is read
 * in headless Chrome; Unsplash+ (plus.unsplash.com) results are skipped — they are not free.
 *
 *   node unsplash.mjs <key> "<search>" ["<search>" ...]
 * -> search/<key>/u-<photoId>.jpg previews, results-unsplash.json, sheets/<key>-unsplash.png
 * Download a pick: node unsplash.mjs --get <photoUrlId> <name.jpg>  (2400px wide into media/img)
 */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const puppeteer = createRequire(process.env.PUPPETEER_DIR || 'C:/Users/ACER/orca/workspaces/Brandklout Website System/bk-stone/node_modules/')('puppeteer-core')
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const IMG = path.resolve(HERE, '../../../04-design/.tmp/site-src/media/img')
const args = process.argv.slice(2)

if (args[0] === '--get') {
  const [, base, name] = args
  const r = await fetch(`${base.split('?')[0]}?w=2400&fm=jpg&q=82`)
  if (!r.ok) throw new Error(r.status + ' ' + base)
  fs.writeFileSync(path.join(IMG, name), Buffer.from(await r.arrayBuffer()))
  console.log('ok', name)
  process.exit(0)
}

const [key, ...terms] = args
const dir = path.join(HERE, 'search', key)
fs.mkdirSync(dir, { recursive: true })
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36')
await page.setViewport({ width: 1400, height: 1000 })
const found = new Map()
for (const t of terms) {
  await page.goto(`https://unsplash.com/s/photos/${encodeURIComponent(t.replace(/\s+/g, '-'))}?orientation=landscape`, { waitUntil: 'networkidle2', timeout: 90000 })
  // a search can redirect (to a collection or a topic) mid-scroll; settle and read what is there
  try { await page.evaluate(async () => { for (let i = 0; i < 4; i++) { scrollBy(0, 1500); await new Promise((r) => setTimeout(r, 700)) } }) } catch { await new Promise((r) => setTimeout(r, 3000)) }
  const items = await page.evaluate(() => [...document.querySelectorAll('figure img[src*="images.unsplash.com/photo-"]')].map((i) => {
    const a = i.closest('a[href*="/photos/"]')
    return { base: i.src.split('?')[0], alt: i.alt, href: a ? a.href : '' }
  }))
  for (const it of items) if (!found.has(it.base)) found.set(it.base, { ...it, term: t })
}
const list = [...found.values()].slice(0, 20)
for (const it of list) {
  it.file = 'u-' + it.base.split('/').pop() + '.jpg'
  fs.writeFileSync(path.join(dir, it.file), Buffer.from(await (await fetch(it.base + '?w=640&fm=jpg')).arrayBuffer()))
}
fs.writeFileSync(path.join(dir, 'results-unsplash.json'), JSON.stringify(list, null, 1))
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
const html = `<html><body style="margin:0;padding:14px;width:1372px;font:14px Arial"><div style="font:bold 18px Arial">${esc(key)} (Unsplash)</div><div style="margin:4px 0 12px">${esc(terms.join(' | '))}</div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">${list.map((c, i) => `<div><img src="data:image/jpeg;base64,${fs.readFileSync(path.join(dir, c.file)).toString('base64')}" style="width:100%;height:230px;object-fit:contain;background:#eee"><div style="font:bold 14px Arial">U${i + 1}</div><div style="font:11px Arial;color:#444;height:42px;overflow:hidden">${esc(c.alt)}</div></div>`).join('')}</div></body></html>`
await page.setContent(html, { waitUntil: 'load' })
await page.screenshot({ path: path.join(HERE, 'sheets', `${key}-unsplash.png`), fullPage: true })
await browser.close()
console.log(`${key}: ${list.length} unsplash candidates`)
