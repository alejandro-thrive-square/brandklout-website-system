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
  // A glass button on a hero photo (rgba white at 0.18) is not the brand colour: need alpha >= 0.5.
  const opaque = (c) => c && c !== 'transparent' && !(/rgba\\(/.test(c) && parseFloat(c.split(',')[3]) < 0.5)
  // Cookie banners (Termly's Accept/Decline) are not the site's call to action.
  const visible = (el) => { const r = el.getBoundingClientRect(); return r.width > 40 && r.height > 20 && !el.closest('[id*=termly i], [class*=termly i], [id*=cookie i], [class*=cookie i], [class*=consent i]') }
  // A gradient button (Dr. Nahlah's gold) has a transparent background-color: use the gradient's first stop.
  const fill = (el) => { const s = cs(el); const g = /gradient/.test(s.backgroundImage) && s.backgroundImage.match(/rgba?\\([^)]+\\)/); return g ? g[0] : s.backgroundColor }
  const body = cs(document.body)
  const h = document.querySelector('h1, h2')
  const btn = [...document.querySelectorAll('a, button')].filter(visible).find((el) => opaque(fill(el)) && /book|schedule|appointment|call|contact|request|claim|consult/i.test(el.textContent))
    || [...document.querySelectorAll('a.button, .button, .btn, button')].filter(visible).find((el) => opaque(fill(el)))
  const input = [...document.querySelectorAll('input[type=text], input[type=email], input:not([type]), textarea, select')].find(visible)
  const pick = (s) => s && ({ fontFamily: first(s.fontFamily), fontSize: s.fontSize, fontWeight: s.fontWeight, color: s.color, backgroundColor: s.backgroundColor, borderRadius: s.borderTopLeftRadius, border: s.borderTopWidth + ' ' + s.borderTopStyle + ' ' + s.borderTopColor, textTransform: s.textTransform, letterSpacing: s.letterSpacing, padding: s.paddingTop + ' ' + s.paddingRight })
  const gradient = btn && /gradient/.test(cs(btn).backgroundImage) ? cs(btn).backgroundImage : undefined
  return JSON.stringify({ url: location.href, body: pick(body), heading: pick(cs(h)), button: btn ? { text: btn.textContent.trim().slice(0, 40), ...pick(cs(btn)), backgroundColor: fill(btn), gradient } : null, input: pick(cs(input)) })
})()`

/** Runs in the public form: the rendered font sizes of each SMS consent box's text. */
const CONSENT_PROBE = `JSON.stringify([...document.querySelectorAll('*')]
  .filter((e) => e.getClientRects().length && /^By checking this box/.test((e.textContent || '').trim()) && ![...e.children].some((c) => /^By checking this box/.test((c.textContent || '').trim())))
  .map((e) => [...new Set([e, ...e.querySelectorAll('*')].filter((x) => x.textContent.trim()).map((x) => getComputedStyle(x).fontSize))]))`

/** Runs in the public form: the rendered "family size" of each SMS consent box's text leaves. */
const CONSENT_FONTS = `JSON.stringify([...document.querySelectorAll('*')]
  .filter((e) => e.getClientRects().length && /^By checking this box/.test((e.textContent || '').trim()) && ![...e.children].some((c) => /^By checking this box/.test((c.textContent || '').trim())))
  .map((e) => [...new Set([e, ...e.querySelectorAll('*')].filter((x) => x.textContent.trim()).map((x) => { const s = getComputedStyle(x); return s.fontFamily.split(',')[0].replace(/["']/g, '').trim() + ' ' + s.fontSize }))]))`

/** Runs in the public form: what a visitor actually sees. */
const FORM_PROBE = `(() => {
  const cs = (el) => el && getComputedStyle(el)
  const first = (f) => String(f || '').split(',')[0].replace(/["']/g, '').trim()
  const label = [...document.querySelectorAll('label')].find((l) => l.textContent.trim() && !/^By checking/.test(l.textContent.trim()))
  const text = document.querySelector('input[type=text], input[type=email], input[type=tel]')
  const area = document.querySelector('textarea')
  const btn = document.querySelector('#submit-button, .form-builder--btn-submit button, button[type=submit]')
  const radii = {}
  if (text) radii['text input'] = cs(text).borderTopLeftRadius
  if (area) radii['message box'] = cs(area).borderTopLeftRadius
  return JSON.stringify({ label: first(cs(label)?.fontFamily), input: first(cs(text || area)?.fontFamily), button: btn && (/gradient/.test(cs(btn).backgroundImage) ? (cs(btn).backgroundImage.match(/rgba?\\([^)]+\\)/) || [])[0] : cs(btn).backgroundColor), radii, boxes: JSON.parse(${CONSENT_PROBE}) })
})()`

async function probe(url, expression = PROBE, width = 1440) {
  if (!CHROME) throw new Error('Chrome not found (set CHROME_PATH)')
  const dir = mkdtempSync(path.join(tmpdir(), 'site-style-'))
  const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--no-first-run', `--window-size=${width},1000`, `--user-agent=${UA}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] })
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
    // A headless window does not shrink below ~500px; emulate a phone for narrow probes.
    if (width < 1000) await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: true })
    await send('Page.navigate', { url })
    for (let i = 0; i < 60 && !events.includes('Page.loadEventFired'); i++) await new Promise((r) => setTimeout(r, 500))
    // Fonts and late CSS: document.fonts.ready resolves too early on some builds, so wait a beat too.
    await send('Runtime.evaluate', { expression: 'document.fonts.ready.then(() => new Promise((r) => setTimeout(r, 1500)))', awaitPromise: true })
    const r = await send('Runtime.evaluate', { expression, returnByValue: true })
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

// No input on the page: borrow the button radius, but a pill button (999px) would make a pill textarea.
const inputRadius = (s) => (s.input ? px(s.input.borderRadius) : Math.min(px(s.button?.borderRadius), 12))

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
    'Input corner radius': inputRadius(s) + 'px',
    'Button background': '#' + hex(b.backgroundColor),
    'Button text': `${b.fontFamily || s.body.fontFamily} ${b.fontWeight || 600} ${px(b.fontSize || s.body.fontSize)}px #${hex(b.color)}${b.textTransform && b.textTransform !== 'none' ? ' ' + b.textTransform : ''}`,
    'Button corner radius': px(b.borderRadius) + 'px',
    'Button width': 'full width',
    'Consent + links text': `${s.body.fontFamily} 14px #${hex(s.body.color)}`,
  }
}

const argv = process.argv.slice(2)
const ci = argv.indexOf('--compare')
const formId = ci >= 0 ? argv[ci + 1] : null
const url = argv.filter((a, k) => !a.startsWith('--') && !(ci >= 0 && k === ci + 1))[0]
if (!url) { console.error('usage: site-style.mjs [--compare <formId>] <page url>'); process.exit(2) }
const site = await probe(url)
const want = ghlSettings(site)
if (!formId) { console.log(JSON.stringify({ site, ghl: want }, null, 1)); process.exit(0) }

// The form as a visitor sees it: rendered in Chrome, so Styles-panel settings and custom CSS both count.
const form = await probe(`https://api.leadconnectorhq.com/widget/form/${formId}`, FORM_PROBE)
const norm = (x) => String(x || '').toLowerCase().replace(/[^a-z0-9]/g, '')
const problems = []
// A self-hosted variable build ("Figtree VF", "Montserrat Variablefont Wght") is the same family
// as the Google font GHL lists ("Figtree", "Montserrat").
const fam = (x) => norm(String(x).split(',')[0]).replace(/(variablefont.*|variable|vf)$/, '')
if (fam(form.label) !== fam(site.body.fontFamily)) problems.push(`label font ${form.label}, site ${site.body.fontFamily}`)
if (fam(form.input) !== fam(site.body.fontFamily)) problems.push(`input font ${form.input}, site ${site.body.fontFamily}`)
const btnBg = hex(site.button?.backgroundColor).slice(0, 6)
if (btnBg && hex(form.button).slice(0, 6) !== btnBg) problems.push(`button colour #${hex(form.button).slice(0, 6)}, site #${btnBg}`)
const siteR = inputRadius(site)
for (const [k, r] of Object.entries(form.radii)) if (Math.abs(px(r) - siteR) > 2) problems.push(`${k} corner radius ${px(r)}px, site ${siteR}px`)
console.log(`${formId} vs ${site.url}`)
for (const [k, v] of Object.entries(want)) console.log(`  ${k.padEnd(26)} ${v}`)
console.log(`  ${'Form renders'.padEnd(26)} labels ${form.label} · inputs ${form.input} · button #${hex(form.button).slice(0, 6)} · radii ${Object.entries(form.radii).map(([k, r]) => k + ' ' + r).join(', ')}`)
// The two SMS consent boxes render at one size (GHL keeps an inline 16px on box 1).
const boxes = form.boxes
const sizes = [...new Set(boxes.flat())]
console.log(`  ${'Consent boxes rendered'.padEnd(26)} ${boxes.map((x) => x.join('/')).join(' | ') || '-'}`)
if (boxes.length >= 2 && sizes.length > 1) problems.push(`the consent boxes render at different sizes (${sizes.join(', ')}): set both to 14px`)
// GHL renders a separate mobile copy of the consent text with the builder's inline fonts (Inter 16px /
// Roboto 14px on Mason Park's landing forms, 2026-10-04): off-brand on phones, and it reflows the form
// on load. Only a Custom CSS rule on .tnc / .terms-text-container reaches it.
const mobile = await probe(`https://api.leadconnectorhq.com/widget/form/${formId}`, CONSENT_FONTS, 375)
console.log(`  ${'Consent text at 375px'.padEnd(26)} ${mobile.map((x) => x.join('/')).join(' | ') || '-'}`)
const offBrand = [...new Set(mobile.flat())].filter((x) => fam(x.replace(/ [\d.]+px$/, '')) !== fam(site.body.fontFamily) || !/ 14px$/.test(x))
if (offBrand.length) problems.push(`on phones the consent text renders ${offBrand.join(', ')}: add a Custom CSS rule for .tnc / .terms-text-container (${site.body.fontFamily} 14px !important)`)
for (const p of problems) console.log('  PROBLEM ' + p)
console.log(problems.length ? `\n${problems.length} style difference(s)` : '\nstyle ok')
process.exitCode = problems.length ? 1 : 0
