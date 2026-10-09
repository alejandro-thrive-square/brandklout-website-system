#!/usr/bin/env node
// Phase 2 step B on the LOCAL source (`home/`): the same combo classes context-combo.mjs put on
// staging, on the same elements, so the next push does not undo them. The map is the spec.
//
//   node apply-combos-to-source.mjs --src <home dir> --map combo-map.json [--apply] [--link assets/framework.css]
//
// Chrome (puppeteer-core, PUPPETEER_DIR) parses each page with JavaScript OFF, so the DOM is the
// source as written: every element the old selector matches gets `<combo>` appended to its class
// attribute, by rewriting that element's exact start tag in the file text (n-th occurrence in
// document order; a file whose serialised start tags do not match its text is refused). `--link`
// adds `<link rel="stylesheet" href="…/<file>">` before the site.css link (the Framework mirror the
// live site loads first). After a write the file is parsed again and the combo must match exactly
// the old selector's nodes, no more, no fewer. Rewriting the CSS selectors is a separate, exact edit
// (see the run file). Touches nothing on any site.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url' // for the tools import only; pages load via setContent (file:// + puppeteer hangs here)

const argOf = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined }
const SRC = argOf('--src'), MAP = argOf('--map'), APPLY = process.argv.includes('--apply'), LINK = argOf('--link')
if (!SRC || !MAP) { console.error('usage: apply-combos-to-source.mjs --src <dir> --map <combo-map.json> [--apply] [--link assets/framework.css]'); process.exit(2) }
const map = JSON.parse(readFileSync(MAP, 'utf8'))
const TOOLS = process.env.WEBZITE_TOOLS ?? 'C:/Users/ACER/Documents/Webzite Studio/Brandklout Website System/deliver/process/tools'
const { default: puppeteer, CHROME } = await import(pathToFileURL(join(TOOLS, 'instatic-site/lib/browser.mjs')).href)

const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : /\.html$/i.test(n) ? [p] : [] })
const files = walk(resolve(SRC))
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--disable-crash-reporter', '--allow-file-access-from-files'] })
const page = await browser.newPage()
await page.setJavaScriptEnabled(false)

const nth = (text, needle, k) => { let i = -1; for (let c = 0; c <= k; c++) { i = text.indexOf(needle, i + 1); if (i < 0) return -1 } return i }
const count = (text, needle) => { let n = 0, i = -1; while ((i = text.indexOf(needle, i + 1)) >= 0) n++; return n }

const scan = async (file) => {
  await page.setContent(readFileSync(file, 'utf8'), { waitUntil: 'domcontentloaded' })
  return page.evaluate((map) => {
    const start = (el) => { const o = el.outerHTML; return o.slice(0, o.indexOf('>') + 1) }
    const all = [...document.querySelectorAll('*')]
    const hits = []
    for (const [sel, combo] of Object.entries(map)) {
      const subject = sel.trim().split(/\s+/).at(-1).replace(/^\./, '').split('.')
      for (const el of document.querySelectorAll(sel)) {
        const tag = start(el)
        const same = all.filter((x) => start(x) === tag)
        hits.push({ sel, combo, subject, tag, cls: el.getAttribute('class') ?? '', index: same.indexOf(el), total: same.length, already: el.classList.contains(combo) })
      }
    }
    return hits
  }, map)
}
const verify = async (file) => {
  await page.setContent(readFileSync(file, 'utf8'), { waitUntil: 'domcontentloaded' })
  return page.evaluate((map) => Object.entries(map).map(([sel, combo]) => {
    const old = [...document.querySelectorAll(sel)]
    const subject = sel.trim().split(/\s+/).at(-1)
    const now = [...document.querySelectorAll(`${subject}.${combo}`)]
    const ok = old.length === now.length && old.every((e) => e.classList.contains(combo)) && now.every((e) => e.matches(sel))
    return { sel, combo, old: old.length, now: now.length, ok }
  }), map)
}

let touched = 0, nodes = 0, problems = 0
const perSel = {}
for (const file of files) {
  const hits = await scan(file)
  let text = readFileSync(file, 'utf8')
  let changed = false
  // group by exact start tag; every occurrence index that is matched gets the combo
  const groups = new Map()
  for (const h of hits) {
    if (h.already) continue
    const g = groups.get(h.tag) ?? { tag: h.tag, cls: h.cls, total: h.total, idx: new Map() }
    g.idx.set(h.index, [...(g.idx.get(h.index) ?? []), h.combo])
    groups.set(h.tag, g)
    perSel[h.sel] = (perSel[h.sel] ?? 0) + 1
    nodes++
  }
  for (const g of groups.values()) {
    const inText = count(text, g.tag)
    if (inText !== g.total) { console.log(`REFUSE ${file}: start tag ${g.tag.slice(0, 80)} appears ${g.total}x in the DOM but ${inText}x in the text`); problems++; continue }
    // replace from the last occurrence backwards so earlier offsets stay valid
    for (const k of [...g.idx.keys()].sort((a, b) => b - a)) {
      const at = nth(text, g.tag, k)
      const combos = g.idx.get(k).filter((c) => !g.cls.split(/\s+/).includes(c))
      const newTag = g.tag.replace(`class="${g.cls}"`, `class="${[g.cls, ...combos].join(' ').trim()}"`)
      if (newTag === g.tag) { console.log(`REFUSE ${file}: cannot find class="${g.cls}" in ${g.tag.slice(0, 80)}`); problems++; continue }
      text = text.slice(0, at) + newTag + text.slice(at + g.tag.length)
      changed = true
    }
  }
  if (LINK) {
    const m = text.match(/<link rel="stylesheet" href="((?:\.\.\/)*)assets\/site\.css">/)
    if (!m) { console.log(`REFUSE ${file}: no site.css link`); problems++ }
    else if (!text.includes(`href="${m[1]}${LINK}"`)) { text = text.replace(m[0], `<link rel="stylesheet" href="${m[1]}${LINK}">\n${m[0]}`); changed = true }
  }
  if (!changed) continue
  touched++
  if (!APPLY) continue
  writeFileSync(file, text)
  const v = await verify(file)
  for (const r of v) if (!r.ok) { console.log(`VERIFY FAIL ${file}: ${r.sel} -> ${r.combo}: old ${r.old}, combo ${r.now}`); problems++ }
}
await browser.close()
for (const [s, n] of Object.entries(perSel)) console.log(`  ${s.padEnd(45)} -> ${map[s]}   ${n} node(s)`)
console.log(`${files.length} file(s) scanned; ${touched} would change; ${nodes} node(s) gain a combo${LINK ? `; link ${LINK} inserted where missing` : ''}${problems ? `; ${problems} PROBLEM(S)` : ''}  ${APPLY ? 'APPLIED + verified' : 'DRY RUN'}`)
process.exit(problems ? 1 : 0)
