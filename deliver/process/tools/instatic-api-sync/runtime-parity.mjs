#!/usr/bin/env node
/**
 * Does the site still BEHAVE the same? The scripts-on twin of css-parity.mjs.
 *
 *   node runtime-parity.mjs snapshot <label> --site <client>:staging [--widths 1440,390] [--only a,b]
 *   node runtime-parity.mjs diff <before> <after> --site <client>:staging
 *
 * A class rename can leave every style intact (css-parity = 0) and still break the menu, the slider
 * or the scroll reveals, because scripts find elements by class. So, per page and width, with
 * scripts ON, this records:
 *   - console errors and uncaught exceptions;
 *   - the page after a full scroll-through (reveals fire): document height, visible elements,
 *     elements still at opacity 0 (a reveal that never ran), classes the runtime added to <html>/<body>;
 *   - every control (the click-controls.mjs set: buttons, [aria-expanded], summaries, # links,
 *     drag arrows), clicked, and whether the click changed anything.
 * Controls are labelled by tag, role and text, never by class (classes are what changed).
 * `diff` fails on: a new error, a control that worked and is now dead, a control that vanished,
 * more elements stuck at opacity 0, a visible-element count or height that moved > 2%.
 * Needs puppeteer-core (PUPPETEER_DIR or any worktree's node_modules, see ../instatic-site/lib/browser.mjs).
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { connect, argOf } from './target.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(HERE, 'output')
mkdirSync(OUT, { recursive: true })
const [cmd, a, b] = process.argv.slice(2).filter((x, i, all) => !x.startsWith('--') && !['--site', '--widths', '--only'].includes(all[i - 1]))
const { api, target } = await connect()
const host = new URL(target.url).hostname
const file = (label) => join(OUT, `runtime-${host}-${label}.json`)

if (cmd === 'diff') {
  const A = JSON.parse(readFileSync(file(a), 'utf8'))
  const B = JSON.parse(readFileSync(file(b), 'utf8'))
  const fails = []
  const notes = []
  for (const [key, x] of Object.entries(A)) {
    const y = B[key]
    if (!y) { fails.push(`${key}: not captured after`); continue }
    const newErr = y.errors.filter((e) => !x.errors.includes(e))
    for (const e of newErr) fails.push(`${key}: NEW ERROR ${e.slice(0, 160)}`)
    if (y.stuck > x.stuck) fails.push(`${key}: ${y.stuck - x.stuck} more element(s) stuck at opacity 0 after scrolling (a reveal no longer runs)`)
    const rel = (p, q) => Math.abs(p - q) / Math.max(1, p)
    if (rel(x.visible, y.visible) > 0.02) fails.push(`${key}: visible elements ${x.visible} -> ${y.visible}`)
    if (rel(x.height, y.height) > 0.02) fails.push(`${key}: page height ${x.height} -> ${y.height}`)
    const htmlA = x.rootClasses.length, htmlB = y.rootClasses.length
    if (htmlA !== htmlB) notes.push(`${key}: runtime classes on html/body ${htmlA} -> ${htmlB}`)
    const ctrlB = new Map(y.controls.map((c) => [c.label, c]))
    for (const c of x.controls) {
      const d = ctrlB.get(c.label)
      if (!d) fails.push(`${key}: control gone: ${c.label}`)
      else if (c.changed && !d.changed) fails.push(`${key}: control DEAD now: ${c.label}`)
      else if (!c.changed && d.changed) notes.push(`${key}: control works now (was dead): ${c.label}`)
    }
  }
  for (const n of notes) console.log(`note  ${n}`)
  for (const f of fails) console.log(`FAIL  ${f}`)
  console.log(`\ncompared ${Object.keys(A).length} page/width captures`)
  console.log(fails.length ? `${fails.length} BEHAVIOUR DIFFERENCE(S)` : 'RUNTIME PARITY OK — same errors, same controls working, same reveals')
  process.exit(fails.length ? 1 : 0)
}

if (cmd !== 'snapshot' || !a) {
  console.error('usage: runtime-parity.mjs snapshot <label> | diff <before> <after>   --site <client>:staging [--widths] [--only]')
  process.exit(2)
}

const { default: puppeteer, CHROME } = await import('../instatic-site/lib/browser.mjs')
const { rows } = await api.getPages()
let slugs = rows.map((r) => String(r.cells?.slug ?? '')).filter((s) => s && !s.includes('[') && s !== '404')
if (argOf('--only')) slugs = slugs.filter((s) => argOf('--only').split(',').includes(s))
const WIDTHS = (argOf('--widths') ?? '1440,390').split(',').map(Number)
const SEL = 'button:not([type=submit]),[role=button],[role=tab],summary,[aria-controls],[aria-expanded],[data-drag-next],[data-drag-prev],a[href^="#"]:not([href="#"])'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] })
const out = {}
const base = target.url.replace(/\/$/, '')

for (const slug of slugs) {
  for (const width of WIDTHS) {
    const key = `${slug} @${width}`
    const page = await browser.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(`pageerror: ${String(e.message ?? e).split('\n')[0]}`))
    page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|favicon|net::ERR|Content Security Policy|third-party cookie/i.test(m.text())) errors.push(`console: ${m.text().split('\n')[0]}`) })
    await page.setViewport({ width, height: width < 700 ? 844 : 900 })
    await page.setRequestInterception(true)
    page.on('request', (r) => (/sienna-accessibility|googletagmanager|google-analytics|facebook|doubleclick|clarity\.ms|hotjar/.test(r.url()) ? r.abort() : r.continue()))
    const url = `${base}/${slug === 'index' ? '' : slug}`
    let loaded = false
    let loadError = ''
    for (let attempt = 1; attempt <= 3 && !loaded; attempt++) {
      try {
        // networkidle2 can starve on a busy machine (third-party iframes keep polling); a page that
        // loaded its document and settled is good enough, so fall back to `load` on the retries.
        await page.goto(url, { waitUntil: attempt === 1 ? 'networkidle2' : 'load', timeout: 120000 })
        loaded = true
      } catch (e) {
        loadError = e.message
        await sleep(3000)
      }
    }
    if (!loaded) {
      out[key] = { errors: [`load: ${loadError}`], visible: 0, height: 0, stuck: 0, rootClasses: [], controls: [] }
      await page.close()
      continue
    }
    errors.length = 0
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto' })
    await sleep(1500)
    // scroll through, so scroll-triggered reveals run, then back to the top
    await page.evaluate(async () => {
      const step = Math.max(300, Math.floor(innerHeight * 0.7))
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)) }
      scrollTo(0, document.documentElement.scrollHeight)
      await new Promise((r) => setTimeout(r, 600))
    })
    await sleep(800)
    const state = await page.evaluate(() => {
      const els = [...document.querySelectorAll('body *')].filter((n) => !n.closest('script,style,noscript,svg,iframe'))
      const visible = els.filter((n) => n.offsetParent !== null || getComputedStyle(n).position === 'fixed').length
      const stuck = els.filter((n) => {
        if (n.offsetParent === null) return false
        const r = n.getBoundingClientRect()
        if (r.width < 20 || r.height < 10) return false
        return getComputedStyle(n).opacity === '0' && !n.closest('[aria-hidden="true"],[hidden],dialog:not([open])')
      }).length
      return {
        visible, stuck,
        height: document.documentElement.scrollHeight,
        rootClasses: [...document.documentElement.classList, ...document.body.classList].sort(),
      }
    })
    await page.evaluate(() => scrollTo(0, 0))
    await sleep(500)
    const n = await page.evaluate((SEL) => {
      const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' }
      const els = [...document.querySelectorAll(SEL)].filter(vis)
      els.forEach((el, i) => el.setAttribute('data-rp-id', String(i)))
      return els.length
    }, SEL)
    const controls = []
    const seen = new Map()
    for (let i = 0; i < n; i++) {
      const snap = () => page.evaluate((i) => {
        const el = document.querySelector(`[data-rp-id="${i}"]`)
        if (!el) return null
        const targets = [el, el.parentElement, ...(el.getAttribute('aria-controls') || '').split(/\s+/).filter(Boolean).map((id) => document.getElementById(id))].filter(Boolean)
        const scrolls = [...document.querySelectorAll('*')].filter((m) => m.scrollWidth > m.clientWidth + 1 || m.scrollHeight > m.clientHeight + 1).map((m) => m.scrollLeft + ':' + m.scrollTop)
        const visible = [...document.querySelectorAll('body *')].filter((m) => m.offsetParent !== null).length
        return JSON.stringify([scrollX, scrollY, location.hash, visible, scrolls, [...document.documentElement.classList, ...document.body.classList],
          targets.map((t) => [t.className && String(t.className), t.getAttribute('style'), t.getAttribute('aria-expanded'), t.getAttribute('aria-selected'), t.getAttribute('aria-hidden'), t.hasAttribute('open'), t.hidden])])
      }, i)
      const label0 = await page.evaluate((i) => {
        const el = document.querySelector(`[data-rp-id="${i}"]`)
        if (!el) return '?'
        const text = (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40)
        return `${el.tagName.toLowerCase()}[${el.getAttribute('role') || el.getAttribute('href') || el.getAttribute('aria-controls') || ''}] "${text}"`
      }, i)
      const nth = (seen.get(label0) ?? 0) + 1
      seen.set(label0, nth)
      const label = `${label0} #${nth}`
      if ((await snap()) === null) continue
      await page.evaluate((i) => document.querySelector(`[data-rp-id="${i}"]`)?.scrollIntoView({ block: 'center' }), i)
      await sleep(300)
      const mid = await snap()
      try { await page.click(`[data-rp-id="${i}"]`, { delay: 30 }) } catch { await page.evaluate((i) => document.querySelector(`[data-rp-id="${i}"]`)?.click(), i) }
      await sleep(900)
      const after = await snap()
      controls.push({ label, changed: after !== mid })
      await page.keyboard.press('Escape').catch(() => {})
      if (page.url().split('#')[0] !== url.split('#')[0]) { await page.goto(url, { waitUntil: 'networkidle2' }).catch(() => {}); await sleep(800) }
    }
    out[key] = { errors: [...new Set(errors)], ...state, controls }
    console.log(`${key.padEnd(48)} ${controls.length} controls (${controls.filter((c) => !c.changed).length} inert), ${state.stuck} stuck, ${errors.length} error(s)`)
    await page.close()
  }
}
await browser.close()
writeFileSync(file(a), JSON.stringify(out))
console.log(`\nwrote ${file(a)}`)
