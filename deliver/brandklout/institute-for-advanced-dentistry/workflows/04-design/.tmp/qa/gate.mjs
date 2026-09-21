#!/usr/bin/env node
// Behaviour gate for the home prototype. Drives the page; never trusts a screenshot.
//   node gate.mjs [baseUrl]            -> writes gate-report.json, exits 1 on any failure
// Proves: every pinned chapter pins and is at a DIFFERENT state at 25/50/75% (a scene that snaps
// between two states is a trigger in costume), controls answer real clicks, the progress bar
// tracks the document, reduced motion hides nothing, and text clears 4.5:1 (3:1 when large) —
// including the scroll-written statement BEFORE it fills.
import puppeteer from 'puppeteer-core'
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const BASE = process.argv[2] || 'http://localhost:4173/home/'
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const results = []
const ok = (name, pass, detail) => { results.push({ name, pass: !!pass, detail }); console.log(`${pass ? 'ok  ' : 'FAIL'}  ${name}${detail !== undefined ? '  ' + JSON.stringify(detail) : ''}`) }
const wait = ms => new Promise(r => setTimeout(r, ms))

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--autoplay-policy=no-user-gesture-required'] })

async function open (w, h, query, reduced) {
  const page = await browser.newPage()
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: w < 768, hasTouch: w < 768 })
  if (reduced) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  await page.goto(BASE + query, { waitUntil: 'networkidle2', timeout: 60000 })
  await wait(3200)
  return { page, errors }
}
const scrollTo = async (page, y) => { await page.evaluate(v => window.scrollTo({ top: v, behavior: 'instant' }), y); await wait(350) }

// Scroll range of a pinned stage = its pin-spacer's box.
const pinRange = (page, sel) => page.evaluate(s => {
  const el = document.querySelector(s), sp = el.parentElement
  if (!sp.classList.contains('pin-spacer')) return null
  const top = sp.getBoundingClientRect().top + window.pageYOffset
  return { start: Math.round(top), end: Math.round(top + sp.offsetHeight - el.offsetHeight) }
}, sel)

async function scrubProof (page, label, sel, read) {
  await scrollTo(page, 0)
  const range = await pinRange(page, sel)
  if (!range) return ok(`${label}: pinned`, false, 'no pin-spacer')
  const states = [], tops = []
  for (const f of [0.25, 0.5, 0.75]) {
    await scrollTo(page, range.start + (range.end - range.start) * f)
    states.push(await page.evaluate(read))
    tops.push(await page.evaluate(s => Math.round(document.querySelector(s).getBoundingClientRect().top), sel))
  }
  ok(`${label}: holds still while it plays`, tops.every(t => Math.abs(t) <= 2), tops)
  ok(`${label}: three distinct intermediate states`, new Set(states.map(s => JSON.stringify(s))).size === 3, states)
  await scrollTo(page, range.end + 900)
  const after = await page.evaluate(s => Math.round(document.querySelector(s).getBoundingClientRect().top), sel)
  ok(`${label}: releases cleanly`, after < -400, after)
}

const READ = {
  arrival: () => getComputedStyle(document.querySelector('[data-arrival-media]')).clipPath,
  question: () => [...document.querySelectorAll('.statement .w')].filter(w => getComputedStyle(w).color !== 'rgb(143, 140, 135)').length,
  design: () => ({ pos: document.querySelector('[data-compare]').style.getPropertyValue('--pos'), step: [...document.querySelectorAll('[data-design-step]')].findIndex(s => s.classList.contains('is-on')) }),
  path: () => ({ x: Math.round(new DOMMatrix(getComputedStyle(document.querySelector('[data-path-rail]')).transform).m41), now: document.querySelector('[data-path-now]').textContent }),
}

/* ------------------------------------------------------------ desktop, motion on */
{
  const { page, errors } = await open(1440, 900, '?smooth=off')
  await scrubProof(page, 'Arrival', '[data-arrival-stage]', READ.arrival)
  await scrubProof(page, 'The Question', '[data-question-stage]', READ.question)
  await scrubProof(page, 'The Design', '[data-design-stage]', READ.design)
  await scrubProof(page, 'The Path', '[data-path-stage]', READ.path)

  // scroll-written copy must be readable BEFORE it fills
  const unlit = await page.evaluate(() => {
    const lum = c => { const v = c.match(/[\d.]+/g).slice(0, 3).map(n => { n /= 255; return n <= .03928 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4 }); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2] }
    const a = lum('rgb(143, 140, 135)'), b = lum(getComputedStyle(document.querySelector('.ch-question')).backgroundColor)
    return +((Math.max(a, b) + .05) / (Math.min(a, b) + .05)).toFixed(2)
  })
  ok('The Question: unlit words already clear 4.5:1', unlit >= 4.5, unlit)

  // reading progress tracks the document
  const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)
  await scrollTo(page, Math.round(max * .5))
  const bar = await page.evaluate(() => new DOMMatrix(getComputedStyle(document.querySelector('[data-progress]')).transform).a)
  ok('Progress bar tracks real document progress', Math.abs(bar - .5) < .02, bar)

  // velocity-reactive marquee moves on its own
  const mq = () => page.evaluate(() => new DOMMatrix(getComputedStyle(document.querySelector('[data-marquee-track]')).transform).m41)
  const m1 = await mq(); await wait(500); const m2 = await mq()
  ok('Memberships marquee is running', m1 !== m2, [m1, m2])

  // discipline panels answer the pointer
  await page.evaluate(() => document.querySelector('.ch-disciplines').scrollIntoView({ block: 'center' })); await wait(900)
  const panels = await page.$$('[data-disc-panel]')
  await panels[1].hover(); await wait(300)
  ok('Disciplines: hovering B opens B', await page.evaluate(() => [...document.querySelectorAll('[data-disc-panel]')].map(p => p.classList.contains('is-open')).join()) === 'false,true')

  // reviews: write the click
  await page.evaluate(() => document.querySelector('[data-voices]').scrollIntoView({ block: 'center' })); await wait(1200)
  const before = await page.evaluate(() => document.querySelector('.voice.is-on cite').textContent)
  await page.click('button[data-voice-next]'); await wait(1600)
  const after = await page.evaluate(() => ({ who: document.querySelector('.voice.is-on cite').textContent, count: document.querySelector('[data-voice-count]').textContent, on: document.querySelectorAll('.voice.is-on').length }))
  ok('Reviews: next arrow changes the review', after.who !== before && after.count === '02 / 03' && after.on === 1, { before, after })
  await page.click('button[data-voice-prev]'); await wait(1600)
  ok('Reviews: previous arrow goes back', await page.evaluate(() => document.querySelector('.voice.is-on cite').textContent) === before)

  // patient story opens, plays from a real source, closes
  await page.evaluate(() => document.querySelector('[data-deck]').scrollIntoView({ block: 'center' })); await wait(1200)
  await page.click('button[data-story-name="Helen"]'); await wait(1500)
  const modal = await page.evaluate(() => { const m = document.querySelector('[data-modal]'), v = m.querySelector('video'); return { open: !m.hidden, src: v.getAttribute('src'), ready: v.readyState, err: v.error && v.error.code } })
  ok('Patient story: opens with a playable video', modal.open && /story-helen\.mp4$/.test(modal.src) && modal.ready >= 1 && !modal.err, modal)
  await page.keyboard.press('Escape'); await wait(400)
  ok('Patient story: Escape closes it', await page.evaluate(() => document.querySelector('[data-modal]').hidden))

  // compare slider by keyboard and by drag
  await page.evaluate(() => document.querySelector('[data-compare]').scrollIntoView({ block: 'center' })); await wait(900)
  const pos = () => page.evaluate(() => parseFloat(document.querySelector('[data-compare]').style.getPropertyValue('--pos')))
  const box = await (await page.$('[data-compare]')).boundingBox()
  await page.mouse.move(box.x + box.width * .2, box.y + box.height / 2); await page.mouse.down()
  await page.mouse.move(box.x + box.width * .7, box.y + box.height / 2, { steps: 6 }); await page.mouse.up(); await wait(200)
  const dragged = await pos()
  ok('Compare: dragging moves the divider', Math.abs(dragged - 70) < 3, dragged)
  await page.focus('[data-handle]'); await page.keyboard.press('ArrowLeft'); await wait(150)
  ok('Compare: arrow keys move the divider', Math.abs((await pos()) - (dragged - 5)) < .6, await pos())

  // form slot validates and says what it is
  await page.evaluate(() => document.querySelector('[data-ask]').scrollIntoView({ block: 'center' })); await wait(900)
  await page.click('[data-ask] button[type="submit"]'); await wait(300)
  ok('Form: empty submit flags the fields', await page.evaluate(() => document.querySelectorAll('[data-ask] .is-bad').length) === 3)

  ok('Desktop: no console errors', errors.length === 0, errors)
  await page.close()
}

/* ------------------------------------------------------------ desktop, ScrollSmoother on */
{
  const { page, errors } = await open(1440, 900, '')
  const s = await page.evaluate(() => ({ smoother: !!(window.ScrollSmoother && ScrollSmoother.get()), pins: document.querySelectorAll('.pin-spacer').length }))
  ok('ScrollSmoother registered and running', s.smoother, s)
  ok('Smoother on: no console errors', errors.length === 0, errors)
  await page.close()
}

/* ------------------------------------------------------------ mobile, motion on */
{
  const { page, errors } = await open(390, 844, '?smooth=off')
  ok('Mobile: no horizontal overflow', await page.evaluate(() => Math.max(document.documentElement.scrollWidth, innerWidth)) <= 390)
  await scrubProof(page, 'Mobile · The Question', '[data-question-stage]', READ.question)
  await scrubProof(page, 'Mobile · The Design', '[data-design-stage]', READ.design)
  await scrubProof(page, 'Mobile · The Path', '[data-path-stage]', READ.path)

  await scrollTo(page, 0)
  const bar = await page.evaluate(() => { const r = document.querySelector('[data-callbar]').getBoundingClientRect(); return { bottom: Math.round(r.bottom), h: Math.round(r.height), vh: innerHeight } })
  ok('Mobile: call bar on screen from the first pixel', bar.bottom === bar.vh && bar.h >= 56, bar)
  await page.tap('[data-burger]'); await wait(1300)
  ok('Mobile: burger opens the drawer', await page.evaluate(() => !document.querySelector('[data-drawer]').hidden && document.querySelector('[data-burger]').getAttribute('aria-expanded') === 'true'))
  await page.tap('[data-burger]'); await wait(900)
  ok('Mobile: burger closes it again', await page.evaluate(() => document.querySelector('[data-drawer]').hidden))

  await page.evaluate(() => document.querySelector('[data-ask] button[type="submit"]').scrollIntoView({ block: 'center' })); await wait(900)
  const cover = await page.evaluate(() => { const b = document.querySelector('[data-ask] button[type="submit"]').getBoundingClientRect(); const el = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return !!el.closest('[data-ask]') })
  ok('Mobile: call bar never covers the submit button', cover)

  const small = await page.evaluate(() => {
    const bad = []
    document.querySelectorAll('main p, main li, main a, main dd, main label, main cite, main span').forEach(e => {
      if (!e.childNodes.length || ![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return
      const cs = getComputedStyle(e), px = parseFloat(cs.fontSize)
      if (px < 12.5 && e.getClientRects().length) bad.push(`${e.className || e.tagName}: ${px.toFixed(1)}px`)
    })
    return [...new Set(bad)]
  })
  ok('Mobile: no text under 12.5px', small.length === 0, small)
  const body = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.step p:last-child')).fontSize))
  ok('Mobile: body copy renders at 16px or more', body >= 16, body)
  ok('Mobile: no console errors', errors.length === 0, errors)
  await page.close()
}

/* ------------------------------------------------------------ reduced motion */
{
  const { page, errors } = await open(1440, 900, '', true)
  const r = await page.evaluate(() => {
    const hidden = []
    document.querySelectorAll('main h1, main h2, main h3, main p, main li, main a, main img, main blockquote').forEach(e => {
      if (e.closest('[aria-hidden="true"], .voice:not(.is-on)')) return   // the other reviews are one arrow-click away
      const cs = getComputedStyle(e)
      let op = 1, p = e
      while (p && p !== document.body) { op *= parseFloat(getComputedStyle(p).opacity); p = p.parentElement }
      if (cs.visibility === 'hidden' || op < .99) hidden.push((e.className || e.tagName) + ':' + (e.textContent || '').trim().slice(0, 30))
    })
    return { pins: document.querySelectorAll('.pin-spacer').length, hidden, pos: document.querySelector('[data-compare]').style.getPropertyValue('--pos'), smoother: !!(window.ScrollSmoother && ScrollSmoother.get()) }
  })
  ok('Reduced motion: nothing pins, no smoother', r.pins === 0 && !r.smoother, { pins: r.pins, smoother: r.smoother })
  ok('Reduced motion: no content hidden', r.hidden.length === 0, r.hidden.slice(0, 8))
  ok('Reduced motion: before/after rests at the midpoint, still draggable', r.pos === '50.00%', r.pos)

  // Contrast, measured where the page renders complete. Ground = nearest opaque ancestor background.
  const contrast = await page.evaluate(() => {
    const parse = c => (c.match(/[\d.]+/g) || []).map(Number)
    const lum = ([r, g, b]) => { const v = [r, g, b].map(n => { n /= 255; return n <= .03928 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4 }); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2] }
    const over = (top, under) => { const a = top[3] === undefined ? 1 : top[3]; return [0, 1, 2].map(i => top[i] * a + under[i] * (1 - a)) }
    const ground = el => {
      const stack = []
      for (let p = el; p; p = p.parentElement) { const c = parse(getComputedStyle(p).backgroundColor); if (c.length && (c[3] === undefined || c[3] > 0)) { stack.push(c); if (c[3] === undefined || c[3] === 1) break } }
      let g = [18, 17, 18]
      for (let i = stack.length - 1; i >= 0; i--) g = over(stack[i], g)
      return g
    }
    const bad = []
    document.querySelectorAll('body *').forEach(e => {
      if (e.closest('[aria-hidden="true"], [hidden], svg, .modal, .drawer, .cursor')) return
      if (![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return
      const cs = getComputedStyle(e)
      if (cs.visibility === 'hidden' || cs.display === 'none' || !e.getClientRects().length) return
      const fg = over(parse(cs.color), ground(e)), bg = ground(e)
      const a = lum(fg), b = lum(bg), ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05)
      const px = parseFloat(cs.fontSize), large = px >= 24 || (px >= 18.66 && parseInt(cs.fontWeight) >= 700)
      if (ratio < (large ? 3 : 4.5)) bad.push(`${e.className || e.tagName} "${e.textContent.trim().slice(0, 24)}" ${ratio.toFixed(2)}:1 @${px}px`)
    })
    return [...new Set(bad)]
  })
  ok('Contrast: every text node clears AA on its real ground', contrast.length === 0, contrast.slice(0, 12))
  ok('Reduced motion: no console errors', errors.length === 0, errors)
  await page.close()
}

await browser.close()
const failed = results.filter(r => !r.pass)
writeFileSync(join(HERE, 'gate-report.json'), JSON.stringify({ base: BASE, passed: results.length - failed.length, failed: failed.length, results }, null, 2))
console.log(`\n${results.length - failed.length}/${results.length} passed`)
process.exit(failed.length ? 1 : 0)
