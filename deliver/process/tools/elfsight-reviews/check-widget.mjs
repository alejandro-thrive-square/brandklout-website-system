#!/usr/bin/env node
/**
 * The in-section reviews standard (README.md, "In-section widget standard"), checked without a login.
 * Settings come from Elfsight's public boot API; --render also loads a page and reads what a visitor sees.
 *
 *   node check-widget.mjs <widgetId> [--style ../ghl-forms/output/site-style.json] [--render <page url>] > output/elfsight-check.log 2>&1
 *
 * --style  compares the button, cards and text with the site (the JSON site-style.mjs prints).
 * --render needs the widget on that page: Google logo, rating, review count, button, cards, no widget title.
 * Each PROBLEM line is one thing to fix; the last line is "ok" when there is none.
 * Redirect stdout to a file, never pipe it (Node 24 on Windows dies on a piped stdout).
 */
import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const args = process.argv.slice(2)
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args.splice(i, 2)[1] : undefined }
const stylePath = opt('--style')
const renderUrl = opt('--render')
const id = args[0]
if (!/^[0-9a-f-]{36}$/.test(id || '')) { console.error('usage: node check-widget.mjs <widgetId> [--style site-style.json] [--render <page url>]'); process.exit(2) }

const problems = []
const problem = (s) => { problems.push(s); console.log(`PROBLEM ${s}`) }

// ---- settings (boot API) ----
const boot = await (await fetch(`https://core.service.elfsight.com/p/boot/?w=${id}`, { headers: { 'user-agent': 'Mozilla/5.0' } })).json()
const w = boot?.data?.widgets?.[id]
const s = w?.data?.settings
if (!s) { console.log(`PROBLEM widget ${id} not found: ${JSON.stringify(boot).slice(0, 200)}`); process.exit(1) }
const t = s.theme?.themeSettings || {}
console.log(`widget ${id} app ${w.data.app} layout ${s.layout} header ${s.headerLayout} ${JSON.stringify(s.headerElements)}`)

// All-in-One Reviews (Mason Park's) has the same settings for one Google source.
if (!['google-reviews', 'all-in-one-reviews'].includes(w.data.app)) problem(`app is ${w.data.app}, not google-reviews`)
if (!['carousel', 'slider', 'grid', 'masonry', 'list'].includes(s.layout)) problem(`layout ${s.layout}: a badge is not an in-section widget (use carousel)`)
if (s.widgetTitle !== false) problem(`widget title is on ("${s.widgetTitleTitle}"): the section has the heading, turn Widget Title off`)
if (s.headerLayout !== 'header1') problem(`header layout ${s.headerLayout}, standard is header1 (logo + rating + count left, button right)`)
for (const [el, what] of [['title', 'Google logo + "Reviews"'], ['rating', 'rating'], ['reviewsNumber', 'review count']]) {
  if (!(s.headerElements || []).includes(el)) problem(`header element ${el} off (${what})`)
}
if (s.showOverallRating === false) problem('overall rating hidden in the header')
if (s.showWriteReviewButton !== true) problem('write-a-review button off')
if (s.AISummary !== false) problem('AI summary on: it adds its own label and block above the cards')
if (s.showElfsightLogo === true) problem('Elfsight logo shown')
if (s.widgetWidth && s.widgetWidth.auto !== true) problem(`widget width fixed at ${s.widgetWidth.customValue}px: set Width to Full Width (auto) so the widget fills its section (Mason Park, 2026-10-09: 1280px left a gap each side of a 1525px section)`)
// Reviews with photos skip the short-text cut: one card runs 14 lines next to 3-line ones.
if (s.reviewDisplayImages === true) problem('review photos on: those cards are not shortened (Carousel template default)')
if (s.reviewDisplaySource === false) problem('Google icon on the cards hidden')
// An empty font object is the editor's "Default (Apply from Website)".
if (t.font?.name && t.font.name !== 'Apply from Website') problem(`font ${t.font.name}, must be "Apply from Website" (Default)`)
if (t.headerSourceImageColor?.type !== 'native') problem('header logo recoloured: keep Google\'s own colours (native)')

const rgba = (c) => {
  if (!c) return null
  if (c === 'transparent') return [0, 0, 0, 0]
  const h = c.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (h) { const x = h[1].length === 3 ? h[1].replace(/./g, '$&$&') : h[1]; return [0, 2, 4].map((i) => parseInt(x.slice(i, i + 2), 16)).concat(1) }
  const m = c.match(/rgba?\(([^)]+)\)/)
  if (!m) return null
  const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number)
  return [p[0], p[1], p[2], p[3] ?? 1]
}
const same = (a, b) => { const x = rgba(a), y = rgba(b); return x && y && x.every((v, i) => Math.abs(v - y[i]) <= (i === 3 ? 0.05 : 3)) }
const clear = (c) => (rgba(c) || [0, 0, 0, 1])[3] === 0
const BLUE = 'rgba(0, 109, 255, 1)' // Elfsight's default accent

const lum = (c) => { const [r, g, b] = rgba(c).map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
const bg = t.widgetBackground || {}
// Transparent, so the section is the plate. Or the colour of a site card the embed sits in (Stone Med
// Spa: a white padless card on a dark section), with padding: --render checks it matches.
const plate = bg.type === 'color' && !clear(bg.color) ? bg.color : null
if (plate && !renderUrl) problem(`widget background ${plate}: transparent, or the colour of the card it sits in (prove with --render)`)
if (!clear(t.headerBackgroundColor)) problem(`header background ${t.headerBackgroundColor}: transparent`)
const btn = t.writeReviewButton || {}
// Text on the cards must read (ADA): a brand gold that fills a button is often too light as text.
for (const [k, c] of [['review text', t.reviewTextColor], ['read more', t.reviewReadMoreColor]]) {
  const card = t.reviewBackgroundColor
  if (c && card && rgba(c) && rgba(card) && contrast(c, card) < 4.5) problem(`${k} ${c} on card ${card}: contrast ${contrast(c, card).toFixed(1)}:1, needs 4.5 (use the site's text-safe accent)`)
}
if (btn.color && btn.fontColor && contrast(btn.color, btn.fontColor) < 4.5) problem(`button text ${btn.fontColor} on ${btn.color}: contrast ${contrast(btn.color, btn.fontColor).toFixed(1)}:1`)
for (const [k, v] of [['button', btn.color], ['read more', t.reviewReadMoreColor], ['verified badge', t.reviewVerifiedBadgeColor]].concat(s.theme?.type === 'custom' ? [] : [['accent', s.theme?.accentColor]])) { // a Custom theme hides the accent
  if (same(v, BLUE)) problem(`${k} colour is Elfsight's default blue ${v}`)
}

if (stylePath) {
  const raw = JSON.parse(readFileSync(stylePath, 'utf8'))
  const site = raw.site || raw // site-style.mjs nests it under site
  const b = site.button || {}
  const px = (v) => Math.round(parseFloat(v) || 0)
  const want = [
    ['button background', btn.color, b.backgroundColor],
    ['button text', btn.fontColor, b.color],
    // Read more: the button colour when it reads on the card; otherwise any accent that does (checked above).
    ...(contrast(b.backgroundColor || '#000', t.reviewBackgroundColor || '#fff') >= 4.5 ? [['read more', t.reviewReadMoreColor, b.backgroundColor]] : []),
    ['review text', t.reviewTextColor, site.body?.color],
  ]
  for (const [k, have, need] of want) if (need && !same(have, need)) problem(`${k} ${have}, site ${need}`)
  const radius = Math.min(px(b.borderRadius), 999)
  if (b.borderRadius && Math.abs((btn.borderRadius ?? 0) - radius) > 1 && !(radius >= 100 && btn.borderRadius >= 100)) problem(`button radius ${btn.borderRadius}px, site ${radius}px`)
  if (b.fontWeight && String(btn.font?.fontWeight ?? '') !== '' && !/bold/.test(btn.font.fontWeight) && Math.abs(+btn.font.fontWeight - +b.fontWeight) >= 100) problem(`button weight ${btn.font.fontWeight}, site ${b.fontWeight}`)
  const card = t.reviewBackgroundColor
  if (same(card, '#f6f6f8')) problem(`card background is Elfsight's default grey ${card}`)
  const wantCase = b.textTransform && b.textTransform !== 'none'
  if (wantCase && !new RegExp(`text-transform:\\s*${b.textTransform}`).test(s.customCSS || '')) problem(`button case: site is ${b.textTransform}, set it in Custom CSS`)
}
// Elfsight's own class rules outrank plain Custom CSS: every declaration needs !important.
const bare = (s.customCSS || '').replace(/\/\*[\s\S]*?\*\//g, '').match(/[a-z-]+\s*:[^;{}]+(;|(?=\s*}))/g)?.filter((d) => !/!important/.test(d) && !/^opacity/.test(d))
if (bare?.length) problem(`Custom CSS without !important (Elfsight's own rules win): ${bare.join(' ')}`)
let siteButton = null
if (stylePath) {
  siteButton = (JSON.parse(readFileSync(stylePath, 'utf8')).site || JSON.parse(readFileSync(stylePath, 'utf8'))).button || null
}

// ---- render (what a visitor sees) ----
if (renderUrl) {
  const CHROME = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((p) => p && existsSync(p))
  // Elfsight renders near the viewport and into shadow roots: scroll the mount in, then walk every root.
  const PROBE = `(async () => {
    document.documentElement.style.scrollBehavior = 'auto'
    const mount = document.querySelector('.elfsight-app-${id}')
    if (!mount) return JSON.stringify({ mount: false })
    mount.scrollIntoView({ block: 'center' })
    const all = () => { const out = []; const walk = (r) => { for (const e of r.querySelectorAll('*')) { out.push(e); if (e.shadowRoot) walk(e.shadowRoot) } }; walk(mount); return out }
    // Cards can land before the header text: wait for both (or 30 s), then a beat for late re-renders.
    const ready = () => { const a = all(); const on = (c) => a.some((e) => e.classList.contains(c) && e.getBoundingClientRect().width > 0 && e.textContent.trim()); return on('es-review-container') && on('es-header-rating-reviews-count') }
    for (let i = 0; i < 60 && !ready(); i++) await new Promise((r) => setTimeout(r, 500))
    await new Promise((r) => setTimeout(r, 1500))
    const els = all()
    const shown = (e) => { if (!e) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden' }
    // Elfsight renders hidden copies (mobile/desktop) too: take the first one that is on screen.
    const one = (c) => els.find((e) => e.classList.contains(c) && shown(e)) || els.find((e) => e.classList.contains(c))
    const cs = (e) => e && getComputedStyle(e)
    const b = one('es-header-write-review-button')
    return JSON.stringify({ mount: true,
      title: shown(one('es-widget-title-container')) ? one('es-widget-title-container').textContent.trim() : null,
      logo: shown(one('es-header-heading-logo')), count: shown(one('es-header-rating-reviews-count')) ? one('es-header-rating-reviews-count').textContent.trim() : null,
      rating: (one('es-header-container')?.textContent.match(/[0-9][.,][0-9]/) || [null])[0], button: shown(b) ? b.textContent.trim() : null,
      buttonStyle: b && { bg: cs(b).backgroundColor, color: cs(b).color, radius: cs(b).borderTopLeftRadius, font: cs(b).fontFamily.split(',')[0].replace(/["']/g, ''), transform: cs(b).textTransform },
      inset: (() => { const h = one('es-header-container'); if (!h) return null; const a = mount.getBoundingClientRect(), c = h.getBoundingClientRect(); return { left: Math.round(c.left - a.left), top: Math.round(c.top - a.top) } })(),
      textLines: Math.max(0, ...els.filter((e) => e.classList.contains('es-text-shortener') && shown(e)).map((e) => Math.round(e.getBoundingClientRect().height / (parseFloat(cs(e).lineHeight) || 23)))),
      cards: els.filter((e) => e.classList.contains('es-review-container')).length,
      section: (() => { let e = mount; while (e && e !== document.body && !/^(SECTION|MAIN)$/.test(e.tagName)) e = e.parentElement
        let b = mount; while (b && cs(b).backgroundColor.match(/rgba\\(.*, 0\\)|transparent/)) b = b.parentElement
        const h = e && e.querySelector('h2'); return { heading: h ? h.textContent.trim().slice(0, 50) : null, headingColor: h && cs(h).color, bg: b ? cs(b).backgroundColor : 'rgb(255, 255, 255)',
          // Gap between the mount and the edge of the coloured box behind it (a site card or the section).
          edge: b ? Math.round(Math.min(mount.getBoundingClientRect().left - b.getBoundingClientRect().left, b.getBoundingClientRect().right - mount.getBoundingClientRect().right)) : null } })(),
      cardBg: (() => { const c = one('es-review-background-container') || one('es-review-container'); return c && cs(c).backgroundColor })(),
      cardFont: cs(one('es-review-content'))?.fontFamily.split(',')[0].replace(/["']/g, ''), pageFont: cs(document.body).fontFamily.split(',')[0].replace(/["']/g, '') })
  })()`
  const dir = mkdtempSync(path.join(tmpdir(), 'elfsight-check-'))
  const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--no-first-run', '--window-size=1440,1000', '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] })
  try {
    const wsUrl = await new Promise((ok, no) => { let b = ''; const tm = setTimeout(() => no(new Error('Chrome did not start')), 20000); chrome.stderr.on('data', (d) => { b += d; const m = b.match(/ws:\/\/[^\s]+/); if (m) { clearTimeout(tm); ok(m[0]) } }) })
    const target = (await (await fetch(`http://127.0.0.1:${new URL(wsUrl).port}/json/list`)).json()).find((x) => x.type === 'page')
    const ws = new WebSocket(target.webSocketDebuggerUrl)
    await new Promise((ok) => ws.addEventListener('open', ok, { once: true }))
    let n = 0; const waiting = new Map(); let loaded = false
    ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id) } else if (m.method === 'Page.loadEventFired') loaded = true })
    const send = (method, params = {}) => new Promise((ok) => { const i = ++n; waiting.set(i, ok); ws.send(JSON.stringify({ id: i, method, params })) })
    await send('Page.enable')
    await send('Page.navigate', { url: renderUrl })
    for (let i = 0; i < 60 && !loaded; i++) await new Promise((r) => setTimeout(r, 500))
    const r = JSON.parse((await send('Runtime.evaluate', { expression: PROBE, awaitPromise: true, returnByValue: true })).result.result.value)
    console.log(`render ${JSON.stringify(r)}`)
    if (!r.mount) problem(`no .elfsight-app-${id} on ${renderUrl}`)
    else {
      if (r.title) problem(`widget title visible on the page: "${r.title}"`)
      if (!r.logo) problem('Google logo not visible in the header')
      if (!r.count) problem('review count not visible in the header')
      if (!r.button) problem('write-a-review button not visible')
      if (!plate && r.section.edge !== null && r.section.edge < 12) problem(`widget touches the edge of its ${r.section.bg} box (${r.section.edge}px): give the widget that background and padding`)
      if (plate && !same(plate, r.section.bg)) problem(`widget background ${plate} on a ${r.section.bg} section: transparent or the same colour`)
      if (!plate && r.inset && (r.inset.left > 12 || r.inset.top > 12)) problem(`widget sits ${r.inset.left}px / ${r.inset.top}px inside its mount: padding should be 0`)
      // The 'Read more' line counts too: preview lines + 1, plus one of slack.
      if (r.textLines > (s.reviewPreviewLinesNumber ?? 3) + 2) problem(`a card shows ${r.textLines} lines of text, preview is ${s.reviewPreviewLinesNumber} (review photos on, or full text mode)`)
      if (!r.cards) problem('no review cards rendered (lazy attribute, CSP or widget off?)')
      if (r.cardFont && r.pageFont && r.cardFont !== r.pageFont) problem(`cards in ${r.cardFont}, page in ${r.pageFont}`)
      if (r.buttonStyle && same(r.buttonStyle.bg, BLUE)) problem('button renders in Elfsight blue')
      if (r.buttonStyle && siteButton) {
        if (siteButton.textTransform && siteButton.textTransform !== r.buttonStyle.transform) problem(`button renders ${r.buttonStyle.transform}, site ${siteButton.textTransform}`)
        if (siteButton.fontFamily && siteButton.fontFamily !== r.buttonStyle.font) problem(`button renders in ${r.buttonStyle.font}, site ${siteButton.fontFamily}`)
      }
      if (!r.section.heading) problem('no H2 in the section around the widget: the section must carry the heading')
      // Header text = the section's H2 colour, unless that H2 sits on another background (a hero
      // above the card); either way it must read on what is behind the widget.
      if (contrast(t.headerTextColor, r.section.bg) < 4.5) problem(`header text ${t.headerTextColor} on ${r.section.bg}: contrast ${contrast(t.headerTextColor, r.section.bg).toFixed(1)}:1, needs 4.5`)
      else if (r.section.headingColor && contrast(r.section.headingColor, r.section.bg) >= 4.5 && !same(t.headerTextColor, r.section.headingColor)) problem(`header text ${t.headerTextColor}, section heading ${r.section.headingColor}`)
      if (r.cardBg && same(r.cardBg, r.section.bg)) problem(`cards ${r.cardBg} on a ${r.section.bg} section: set them apart`)
    }
  } finally { chrome.kill() }
}

console.log(problems.length ? `${problems.length} problem(s)` : 'ok')
process.exit(problems.length ? 1 : 0)
