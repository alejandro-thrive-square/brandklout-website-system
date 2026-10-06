#!/usr/bin/env node
/**
 * SUPPLEMENTARY GATE, Brandklout website only (not a shared tool; nothing here writes to the site).
 *
 * css-parity/runtime-parity `--all-pages` walk the page ROWS. A collection's template row
 * (`legal-template`) is never served at its own slug, and the entries it renders (/legal/terms,
 * /legal/sms, /legal/baa, /legal/privacy) are not page rows, so the shared gates never load them.
 * This captures exactly those URLs, the same way: every element by structural path, its whole
 * computed style, its box, and its own text; scripts off AND on (legal-tables.js builds the tables
 * at runtime); 1440, 390, 1920; two passes per label so capture noise can be told from a change.
 *
 *   PUPPETEER_DIR=<node_modules/> node legal-gate.mjs snapshot <label>
 *   node legal-gate.mjs diff <a> <b>          # exit 1 on any real difference
 */
import { createRequire } from 'node:module'
import { writeFileSync, readFileSync, mkdirSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const BASE = 'https://staging.brandklout.ai'
const PATHS = (process.env.GATE_PATHS || '/legal/terms,/legal/sms,/legal/baa,/legal/privacy').split(',')
const WIDTHS = [1440, 390, 1920]
const [cmd, a, b] = process.argv.slice(2)
// one file per capture (a single file was 266 MB: too much to parse twice on a busy machine)
const dir = (label) => join(HERE, `legal-gate-${label}`)
const fileOf = (label, key) => join(dir(label), key.replace(/[^a-z0-9#]+/gi, '_') + '.json')
const load = (label, key) => { try { return JSON.parse(readFileSync(fileOf(label, key), 'utf8')).data } catch { return null } }

const CAPTURE = `(() => {
  const path = (el) => {
    const parts = []
    for (let n = el; n && n.nodeType === 1 && n !== document.documentElement; n = n.parentElement) {
      const i = [...n.parentElement.children].indexOf(n) + 1
      parts.unshift(n.tagName.toLowerCase() + ':nth-child(' + i + ')')
    }
    return 'html>' + parts.join('>')
  }
  const bag = (cs) => { let s = ''; for (let i = 0; i < cs.length; i++) s += cs[i] + ':' + cs.getPropertyValue(cs[i]) + ';'; return s }
  const out = { __doc: { h: document.documentElement.scrollHeight, w: document.documentElement.scrollWidth, title: document.title, rootFont: getComputedStyle(document.documentElement).fontSize } }
  for (const el of document.querySelectorAll('html, body, body *')) {
    if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'].includes(el.tagName)) continue
    const r = el.getBoundingClientRect()
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.nodeValue.replace(/\\s+/g, ' ').trim()).join('|')
    const key = path(el)
    out[key] = { box: [r.x + scrollX, r.y + scrollY, r.width, r.height].map((v) => Math.round(v * 100) / 100).join(','), text: own, cs: bag(getComputedStyle(el)) }
    for (const pseudo of ['::before', '::after']) {
      const pcs = getComputedStyle(el, pseudo)
      if (pcs.content && pcs.content !== 'none' && pcs.content !== 'normal') out[key + pseudo] = { box: '', text: pcs.content, cs: bag(pcs) }
    }
  }
  return out
})()`

async function snapshot(label) {
  const require = createRequire(join(process.env.PUPPETEER_DIR || '', 'x.js'))
  const puppeteer = require('puppeteer-core')
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--hide-scrollbars'] })
  mkdirSync(dir(label), { recursive: true })
  try {
    for (const pass of [1, 2]) {
      for (const width of WIDTHS) {
        for (const js of [false, true]) {
          for (const p of PATHS) {
            const page = await browser.newPage()
            await page.setViewport({ width, height: 900 })
            await page.setJavaScriptEnabled(js)
            let status = 0
            for (let attempt = 0; attempt < 3 && status !== 200; attempt++) {
              const res = await page.goto(BASE + p, { waitUntil: 'load', timeout: 90000 }).catch(() => null)
              status = res?.status() ?? 0
            }
            for (let t = 0; t < 40; t++) {
              const done = await page.evaluate(`document.fonts.status === 'loaded' && ![...document.fonts].some((f) => f.status === 'loading')`).catch(() => true)
              if (done) break
              await new Promise((r) => setTimeout(r, 250))
            }
            await new Promise((r) => setTimeout(r, js ? 3000 : 1500))
            const data = await page.evaluate(CAPTURE)
            data.__doc.status = status
            const key = `${p} @${width} js:${js ? 'on' : 'off'} #${pass}`
            writeFileSync(fileOf(label, key), JSON.stringify({ key, data }))
            console.log(`  ${key.padEnd(40)} status ${status}, ${Object.keys(data).length - 1} elements, height ${data.__doc.h}, root ${data.__doc.rootFont}`)
            await page.close()
          }
        }
      }
    }
  } finally {
    await browser.close()
  }
  console.log(`wrote ${dir(label)}`)
}

const tokenText = new Map()
/** every (element, property) that differs between two captures of one URL/width/js state */
function differences(x, y) {
  const out = new Map()
  if (!x || !y) return out.set('CAPTURE MISSING', 'one side has no capture')
  for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) {
    if (k === '__doc') {
      for (const f of ['h', 'w', 'title', 'rootFont', 'status']) if (x.__doc[f] !== y.__doc[f]) out.set(`document  ${f}`, `${x.__doc[f]}  ->  ${y.__doc[f]}`)
      continue
    }
    if (!x[k]) { out.set(`${k}  ELEMENT`, 'ADDED'); continue }
    if (!y[k]) { out.set(`${k}  ELEMENT`, 'GONE'); continue }
    if (x[k].box !== y[k].box) out.set(`${k}  box`, `${x[k].box}  ->  ${y[k].box}`)
    if (x[k].text !== y[k].text) out.set(`${k}  text`, `${x[k].text.slice(0, 60)}  ->  ${y[k].text.slice(0, 60)}`)
    if (x[k].cs !== y[k].cs) {
      const px = Object.fromEntries(x[k].cs.split(';').filter(Boolean).map((d) => [d.slice(0, d.indexOf(':')), d.slice(d.indexOf(':') + 1)]))
      const py = Object.fromEntries(y[k].cs.split(';').filter(Boolean).map((d) => [d.slice(0, d.indexOf(':')), d.slice(d.indexOf(':') + 1)]))
      for (const prop of new Set([...Object.keys(px), ...Object.keys(py)])) {
        if (px[prop] === py[prop]) continue
        // A custom property's own TEXT (`--paper: #f7f9fc` -> `hsla(216, 45.45%, 97.84%, 1)` once the
        // Framework emits it) is not something rendered: every use of it is compared through the
        // property that reads it (color, width …). Listed by name, not counted.
        if (prop.startsWith('--')) { tokenText.set(prop, `${px[prop]}  ->  ${py[prop]}`); continue }
        out.set(`${k}  ${prop}`, `${px[prop]}  ->  ${py[prop]}`)
      }
    }
  }
  return out
}

if (cmd === 'snapshot' && a) {
  await snapshot(a)
  process.exit(0) // puppeteer leaves a handle open after close(): the first run wrote its file and never exited
} else if (cmd === 'diff' && a && b) {
  const keys = readdirSync(dir(a)).map((f) => JSON.parse(readFileSync(join(dir(a), f), 'utf8')).key)
  let real = 0
  let noise = 0
  let states = 0
  const lines = []
  for (const key1 of keys.filter((k) => k.endsWith('#1'))) {
    const key2 = key1.replace(/#1$/, '#2')
    states++
    const A1 = load(a, key1), A2 = load(a, key2), B1 = load(b, key1), B2 = load(b, key2)
    const first = differences(A1, B1)
    const second = differences(A2, B2)
    const flips = new Set([...differences(A1, A2).keys(), ...differences(B1, B2).keys()])
    for (const [k, v] of first) {
      if (second.has(k) && !flips.has(k)) { real++; lines.push(`${key1.replace(/ #1$/, '')}  ${k}:  ${v}`) } else noise++
    }
  }
  for (const l of lines.slice(0, 200)) console.log(l)
  if (lines.length > 200) console.log(`… ${lines.length - 200} more`)
  if (tokenText.size) console.log(`custom properties whose own text differs (not counted, their uses are): ${[...tokenText].map(([k, v]) => `${k}: ${v}`).join(' | ')}`)
  console.log(`${real ? 'FAIL' : 'ok  '}  legal-gate ${a} -> ${b}: ${real} real difference(s) over ${states} captures (4 legal pages x 3 widths x scripts off/on); ${noise} not counted (seen in one pass only, or flipping between two passes of one state)`)
  process.exit(real ? 1 : 0)
} else if (cmd === 'split' && a) {
  // one-time: turn a single-file snapshot from the first version into the per-capture folder
  const all = JSON.parse(readFileSync(join(HERE, `legal-gate-${a}.json`), 'utf8'))
  mkdirSync(dir(a), { recursive: true })
  for (const [key, data] of Object.entries(all)) writeFileSync(fileOf(a, key), JSON.stringify({ key, data }))
  console.log(`split ${Object.keys(all).length} captures into ${dir(a)}`)
} else {
  console.error('usage: legal-gate.mjs snapshot <label> | diff <a> <b>')
  process.exit(2)
}
