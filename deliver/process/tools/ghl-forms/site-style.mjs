#!/usr/bin/env node
/**
 * The site's form styling, read from the live page and mapped onto GoHighLevel's form style settings
 * (tools/ghl-forms/README.md, "Styling"). Read-only; no dependencies: it drives the installed Chrome
 * over the DevTools protocol with Node's own WebSocket.
 *
 *   node site-style.mjs <page url> > output/site-style.json
 *   node site-style.mjs --compare <formId> <page url> > output/site-style.log 2>&1
 *
 * --compare also reads the form's public payload and prints each GHL setting that differs from the site.
 * Redirect stdout to a file, never pipe it (Node 24 on Windows dies on a piped stdout).
 */
import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
const CHROME = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((p) => p && existsSync(p))

/** Runs in the page: the computed styles a form should copy. */
const PROBE = `(() => {
  const cs = (el) => el && getComputedStyle(el)
  const first = (fam) => String(fam || '').split(',')[0].replace(/["']/g, '').trim()
  const opaque = (c) => c && !/rgba\\(.*,\\s*0\\)$/.test(c) && c !== 'transparent'
  const visible = (el) => { const r = el.getBoundingClientRect(); return r.width > 40 && r.height > 20 }
  const body = cs(document.body)
  const h = document.querySelector('h1, h2')
  const btn = [...document.querySelectorAll('a, button')].filter(visible).find((el) => opaque(cs(el).backgroundColor) && /book|schedule|appointment|call|contact|request|claim|consult/i.test(el.textContent))
    || [...document.querySelectorAll('a.button, .button, .btn, button')].filter(visible).find((el) => opaque(cs(el).backgroundColor))
  const input = [...document.querySelectorAll('input[type=text], input[type=email], input:not([type]), textarea, select')].find(visible)
  const pick = (s) => s && ({ fontFamily: first(s.fontFamily), fontSize: s.fontSize, fontWeight: s.fontWeight, color: s.color, backgroundColor: s.backgroundColor, borderRadius: s.borderTopLeftRadius, border: s.borderTopWidth + ' ' + s.borderTopStyle + ' ' + s.borderTopColor, textTransform: s.textTransform, letterSpacing: s.letterSpacing, padding: s.paddingTop + ' ' + s.paddingRight })
  return JSON.stringify({ url: location.href, body: pick(body), heading: pick(cs(h)), button: btn ? { text: btn.textContent.trim().slice(0, 40), ...pick(cs(btn)) } : null, input: pick(cs(input)) })
})()`

async function probe(url) {
  if (!CHROME) throw new Error('Chrome not found (set CHROME_PATH)')
  const dir = mkdtempSync(path.join(tmpdir(), 'site-style-'))
  const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--no-first-run', '--window-size=1440,1000', `--user-agent=${UA}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] })
  try {
    const wsUrl = await new Promise((ok, no) => {
      let buf = ''
      const t = setTimeout(() => no(new Error('Chrome did not start')), 20000)
      chrome.stderr.on('data', (d) => { buf += d; const m = buf.match(/ws:\/\/[^\s]+/); if (m) { clearTimeout(t); ok(m[0]) } })
    })
    const port = new URL(wsUrl).port
    const target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((x) => x.type === 'page')
    const ws = new WebSocket(target.webSocketDebuggerUrl)
    await new Promise((ok) => ws.addEventListener('open', ok, { once: true }))
    let n = 0
    const waiting = new Map()
    const events = []
    ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id) } else if (m.method) events.push(m.method) })
    const send = (method, params = {}) => new Promise((ok) => { const id = ++n; waiting.set(id, ok); ws.send(JSON.stringify({ id, method, params })) })
    await send('Page.enable')
    await send('Page.navigate', { url })
    for (let i = 0; i < 60 && !events.includes('Page.loadEventFired'); i++) await new Promise((r) => setTimeout(r, 500))
    // Fonts and late CSS: document.fonts.ready resolves too early on some builds, so wait a beat too.
    await send('Runtime.evaluate', { expression: 'document.fonts.ready.then(() => new Promise((r) => setTimeout(r, 1500)))', awaitPromise: true })
    const r = await send('Runtime.evaluate', { expression: PROBE, returnByValue: true })
    ws.close()
    return JSON.parse(r.result.result.value)
  } finally {
    chrome.kill()
    try { rmSync(dir, { recursive: true, force: true }) } catch {}
  }
}

const hex = (c) => {
  const m = String(c || '').match(/rgba?\(([^)]+)\)/)
  if (!m) return String(c || '').replace('#', '').toUpperCase()
  const [r, g, b, a = 1] = m[1].split(',').map((x) => parseFloat(x))
  return [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('').toUpperCase() + (a < 1 ? Math.round(a * 255).toString(16).padStart(2, '0').toUpperCase() : '')
}
const px = (v) => Math.round(parseFloat(v) || 0)
// Labels sit on the form's white card: take the darker of the heading and body colours (a hero
// heading is often white on a photo).
const lum = (c) => { const h = hex(c); return ['0', '2', '4'].map((k) => parseInt(h.slice(+k, +k + 2), 16) || 0).reduce((x, y, k) => x + y * [0.299, 0.587, 0.114][k], 0) }
const darker = (a, b) => (!a ? b : !b ? a : lum(a) <= lum(b) ? a : b)

/** What to set in the GHL builder (Styles panel), from the site. */
function ghlSettings(s) {
  const b = s.button || {}
  const i = s.input || {}
  return {
    'Form background': 'transparent / ' + (hex(s.body.backgroundColor) || 'FFFFFF'),
    'Label font': `${s.body.fontFamily} 500 ${px(s.body.fontSize)}px #${hex(darker(s.heading?.color, s.body.color))}`,
    'Input font / placeholder': `${s.body.fontFamily} ${px(s.body.fontSize)}px #${hex(s.body.color)}`,
    'Input background': '#' + (i.backgroundColor ? hex(i.backgroundColor) : 'FFFFFF'),
    'Input border': i.border ? `${i.border.split(' ')[0]} #${hex(i.border.split(' ').slice(2).join(' '))}` : `1px #${hex(s.body.color)}33`,
    'Input corner radius': px(i.borderRadius ?? b.borderRadius) + 'px',
    'Button background': '#' + hex(b.backgroundColor),
    'Button text': `${b.fontFamily || s.body.fontFamily} ${b.fontWeight || 600} ${px(b.fontSize || s.body.fontSize)}px #${hex(b.color)}${b.textTransform && b.textTransform !== 'none' ? ' ' + b.textTransform : ''}`,
    'Button corner radius': px(b.borderRadius) + 'px',
    'Button width': 'full width',
    'Consent + links text': `${s.body.fontFamily} 14px #${hex(s.body.color)}`,
  }
}

/** The form's current styling, from its public payload. */
async function formStyle(id) {
  const html = await (await fetch(`https://api.leadconnectorhq.com/widget/form/${id}`, { headers: { 'user-agent': UA } })).text()
  const d = JSON.parse(html.match(/<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)[1])
  const R = (v) => (typeof v === 'number' ? d[v] : v)
  const deep = (v, k = 0) => { const x = R(v); if (k > 6 || x === null || typeof x !== 'object') return x; if (Array.isArray(x)) return x.map((y) => deep(y, k + 1)); return Object.fromEntries(Object.entries(x).map(([a, b]) => [a, deep(b, k + 1)])) }
  const node = deep(d.find((n) => n && typeof n === 'object' && !Array.isArray(n) && 'fieldStyle' in n))
  const submit = (node.fields || []).find((f) => f.type === 'submit') || {}
  return { fieldStyle: node.fieldStyle || {}, style: node.style || {}, submit }
}

const argv = process.argv.slice(2)
const ci = argv.indexOf('--compare')
const formId = ci >= 0 ? argv[ci + 1] : null
const url = argv.filter((a, k) => !a.startsWith('--') && !(ci >= 0 && k === ci + 1))[0]
if (!url) { console.error('usage: site-style.mjs [--compare <formId>] <page url>'); process.exit(2) }
const site = await probe(url)
const want = ghlSettings(site)
if (!formId) { console.log(JSON.stringify({ site, ghl: want }, null, 1)); process.exit(0) }

const f = await formStyle(formId)
const fs_ = f.fieldStyle
const norm = (x) => String(x || '').toLowerCase().replace(/[^a-z0-9]/g, '')
const problems = []
const fam = (x) => norm(String(x).split(',')[0])
if (fam(fs_.labelFontFamily) !== fam(site.body.fontFamily)) problems.push(`label font ${fs_.labelFontFamily}, site ${site.body.fontFamily}`)
if (fam(fs_.placeholderFontFamily) !== fam(site.body.fontFamily)) problems.push(`input font ${fs_.placeholderFontFamily}, site ${site.body.fontFamily}`)
const btnBg = hex(site.button?.backgroundColor)
const formBtn = JSON.stringify(f.submit).match(/"(?:background|bgColor|backgroundColor)"\s*:\s*"#?([0-9A-Fa-f]{6})/)
if (btnBg && (!formBtn || formBtn[1].toUpperCase() !== btnBg.slice(0, 6))) problems.push(`button colour #${formBtn ? formBtn[1].toUpperCase() : '?'}, site #${btnBg.slice(0, 6)}`)
const r = fs_.border?.radius
const siteR = px(site.input?.borderRadius ?? site.button?.borderRadius)
if (r !== undefined && Math.abs(r - siteR) > 2) problems.push(`input corner radius ${r}px, site ${siteR}px`)
console.log(`${formId} vs ${site.url}`)
for (const [k, v] of Object.entries(want)) console.log(`  ${k.padEnd(26)} ${v}`)
for (const p of problems) console.log('  PROBLEM ' + p)
console.log(problems.length ? `\n${problems.length} style difference(s)` : '\nstyle ok')
process.exitCode = problems.length ? 1 : 0
