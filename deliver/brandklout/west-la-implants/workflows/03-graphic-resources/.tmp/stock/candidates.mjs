#!/usr/bin/env node
/**
 * Stock candidates per brief, laid out for a reviewer.
 *
 *   node candidates.mjs briefs.json
 *
 * briefs.json: [{ "key": "implant-cost-hero", "brief": "what the photo must show",
 *                 "query": "freepik search term", "orientation": "landscape|portrait|square",
 *                 "queries": ["optional extra terms"] }]
 * For each brief: Freepik photo search (AI-generated excluded, orientation filtered), 12 previews
 * per term into search/<key>/, then sheets/<key>.png — the brief on top, every candidate numbered
 * with its Freepik id. A reviewer picks ids; fetch.mjs downloads them at full resolution.
 */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../../../../../../..')
for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const H = { 'x-freepik-api-key': process.env.MAGNIFIC, 'accept-language': 'en-US' }
const puppeteer = createRequire(process.env.PUPPETEER_DIR || 'C:/Users/ACER/orca/workspaces/Brandklout Website System/bk-stone/node_modules/')('puppeteer-core')
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'

const briefs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const SHEETS = path.join(HERE, 'sheets')
fs.mkdirSync(SHEETS, { recursive: true })

async function search(term, orientation, n = 12) {
  const q = new URLSearchParams({ term, limit: String(n), order: 'relevance' })
  q.append('filters[content_type][photo]', '1')
  q.append('filters[ai-generated][excluded]', '1')
  if (orientation) q.append(`filters[orientation][${orientation}]`, '1')
  for (let i = 0; i < 3; i++) {
    const r = await fetch(`https://api.freepik.com/v1/resources?${q}`, { headers: H })
    if (r.status >= 500 || r.status === 429) { await new Promise((s) => setTimeout(s, 2000 * (i + 1))); continue }
    if (!r.ok) throw new Error(`${r.status} ${term}: ${(await r.text()).slice(0, 200)}`)
    return (await r.json()).data || []
  }
  return []
}

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] })
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
for (const b of briefs) {
  const dir = path.join(HERE, 'search', b.key)
  fs.mkdirSync(dir, { recursive: true })
  const seen = new Set()
  const cands = []
  for (const term of [b.query, ...(b.queries || [])].filter(Boolean)) {
    for (const r of await search(term, b.orientation)) {
      if (seen.has(r.id) || !r.image?.source?.url) continue
      seen.add(r.id)
      const file = path.join(dir, `${r.id}.jpg`)
      if (!fs.existsSync(file)) fs.writeFileSync(file, Buffer.from(await (await fetch(r.image.source.url)).arrayBuffer()))
      cands.push({ id: r.id, title: r.title, file })
    }
  }
  fs.writeFileSync(path.join(dir, 'results.json'), JSON.stringify({ ...b, candidates: cands.map(({ file, ...c }) => c) }, null, 1))
  const cells = cands.slice(0, 16).map((c, i) => `<div style="position:relative"><img src="data:image/jpeg;base64,${fs.readFileSync(c.file).toString('base64')}" style="width:100%;height:230px;object-fit:contain;background:#eee;display:block"><div style="font:bold 15px Arial;padding:3px 0">${i + 1}. id ${c.id}</div><div style="font:11px Arial;color:#555;height:28px;overflow:hidden">${esc(c.title)}</div></div>`).join('')
  const html = `<html><body style="margin:0;padding:14px;width:1372px;font:14px Arial;background:#fff"><div style="font:bold 18px Arial">${esc(b.key)}</div><div style="margin:4px 0 12px"><b>Brief:</b> ${esc(b.brief)} <br><b>Box:</b> ${esc(b.orientation)} · <b>Search:</b> ${esc([b.query, ...(b.queries || [])].join(' | '))}</div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">${cells}</div></body></html>`
  const page = await browser.newPage()
  await page.setViewport({ width: 1400, height: 800 })
  await page.setContent(html, { waitUntil: 'load' })
  await page.screenshot({ path: path.join(SHEETS, `${b.key}.png`), fullPage: true })
  await page.close()
  console.log(`${b.key}: ${cands.length} candidates`)
}
await browser.close()
