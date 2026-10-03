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
  // Only OUR errors. Two kinds of noise are dropped, both seen on the published page:
  //  - a third party's own console output (the GoHighLevel frame, the Sienna widget): judged by the
  //    script the message came from;
  //  - this workstation's VPN answering Cloudflare's beacon with an EMPTY body, which the browser
  //    reports as an SRI failure. The tell is the digest: z4PhNX7v... is SHA-512 of nothing.
  const ORIGIN = new URL(BASE).origin
  page.on('console', m => {
    if (m.type() !== 'error') return
    const from = m.location()?.url || ''
    if (from && !from.startsWith(ORIGIN)) return
    if (m.text().includes('z4PhNX7vuL3xVChQ1m2AB9Yg5AULVxXcg/SpIdNs6c5H0NE8XYXysP+DGNKHfuwvY7kxvUdBeoGlODJ6+SfaPg==')) return
    errors.push(m.text())
  })
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
  // A stage taller than the window pins from its bottom edge, so "still" means constant, not zero.
  ok(`${label}: holds still while it plays`, tops.every(t => Math.abs(t - tops[0]) <= 2) && tops[0] <= 2, tops)
  ok(`${label}: three distinct intermediate states`, new Set(states.map(s => JSON.stringify(s))).size === 3, states)
  await scrollTo(page, range.end + 900)
  const after = await page.evaluate(s => Math.round(document.querySelector(s).getBoundingClientRect().top), sel)
  ok(`${label}: releases cleanly`, after < -400, after)
}

const READ = {
  arrival: () => { const m = new DOMMatrix(getComputedStyle(document.querySelector('[data-arrival-media]')).transform); return [+m.a.toFixed(3), Math.round(m.e), Math.round(m.f)] },
  question: () => [...document.querySelectorAll('.statement .w')].filter(w => getComputedStyle(w).color !== 'rgb(103, 98, 93)').length,
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

  // the hero film: true 16:9 at rest (nothing cropped), and the opened film covers the whole window
  await scrollTo(page, 0)
  const rest = await page.evaluate(() => { const f = document.querySelector('[data-arrival-fig]').getBoundingClientRect(), v = document.querySelector('[data-hero-video]'); return { ratio: +(f.width / f.height).toFixed(3), video: v.videoWidth ? +(v.videoWidth / v.videoHeight).toFixed(3) : null, stage: document.querySelector('[data-arrival-stage]').offsetHeight, vh: innerHeight } })
  ok('Arrival: film frame is 16:9, same as the film', Math.abs(rest.ratio - 1.778) < .01 && (rest.video === null || Math.abs(rest.video - rest.ratio) < .01), rest)
  const ar = await pinRange(page, '[data-arrival-stage]')
  await scrollTo(page, ar.start + (ar.end - ar.start) * .7)
  const cover = await page.evaluate(() => { const r = document.querySelector('[data-arrival-media]').getBoundingClientRect(); return { l: Math.round(r.left), t: Math.round(r.top), r: Math.round(innerWidth - r.right), b: Math.round(innerHeight - r.bottom), ratio: +(r.width / r.height).toFixed(3) } })
  ok('Arrival: opened film covers the window and is still 16:9', cover.l <= 0 && cover.t <= 0 && cover.r <= 0 && cover.b <= 0 && Math.abs(cover.ratio - 1.778) < .01, cover)

  // scroll-written copy must be readable BEFORE it fills
  const unlit = await page.evaluate(() => {
    const lum = c => { const v = c.match(/[\d.]+/g).slice(0, 3).map(n => { n /= 255; return n <= .03928 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4 }); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2] }
    const a = lum('rgb(103, 98, 93)'), b = lum(getComputedStyle(document.querySelector('.ch-question')).backgroundColor)
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

  // reviews. On staging (since 2026-09-30) the rotator is the live Elfsight Google Reviews widget,
  // placed by 21-instatic-upload/home/add-elfsight-reviews.mjs; the local prototype still has the
  // three-quote rotator. The widget draws its reviews inside shadow roots on its own descendants,
  // so innerText on the host shows only the owner panel: the text is gathered shadow root by
  // shadow root.
  const hasWidget = await page.$('.rv-embed')
  if (hasWidget) {
    await page.evaluate(() => document.querySelector('.rv-embed').scrollIntoView({ block: 'center' })); await wait(6000)
    const rv = await page.evaluate(() => {
      const el = document.querySelector('.elfsight-app-7febe92d-b5da-447f-b53f-9593eec9da53')
      const deepText = (root) => { let t = root.textContent || ''; for (const e of root.querySelectorAll('*')) if (e.shadowRoot) t += ' ' + deepText(e.shadowRoot); return t }
      const t = el ? deepText(el).replace(/\s+/g, ' ') : ''
      return { found: !!el, lazy: !!el?.hasAttribute('data-elfsight-app-lazy'), h: el ? Math.round(el.getBoundingClientRect().height) : 0, google: /Reviews\s*\d\.\d\s*\(\d+\)/.test(t), rotator: document.querySelectorAll('[data-voices], .voice').length, text: t.slice(0, 120) }
    })
    ok('Reviews: the Google reviews widget boots (>0px, no lazy attribute, header with a count, old rotator gone)', rv.found && !rv.lazy && rv.h > 300 && rv.google && rv.rotator === 0, rv)
  } else {
    // write the click
    await page.evaluate(() => document.querySelector('[data-voices]').scrollIntoView({ block: 'center' })); await wait(1200)
    const before = await page.evaluate(() => document.querySelector('.voice.is-on cite').textContent)
    await page.click('button[data-voice-next]'); await wait(1600)
    const after = await page.evaluate(() => ({ who: document.querySelector('.voice.is-on cite').textContent, count: document.querySelector('[data-voice-count]').textContent, on: document.querySelectorAll('.voice.is-on').length }))
    ok('Reviews: next arrow changes the review', after.who !== before && after.count === '02 / 03' && after.on === 1, { before, after })
    await page.click('button[data-voice-prev]'); await wait(1600)
    ok('Reviews: previous arrow goes back', await page.evaluate(() => document.querySelector('.voice.is-on cite').textContent) === before)
  }

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
  // Local prototype: the design of the slot, which validates. Published: the practice's GoHighLevel
  // form in an Embed block. Its frame must fill the card, not sit at its 300px intrinsic width.
  if (await page.$('[data-ask] button[type="submit"]')) {
    await page.click('[data-ask] button[type="submit"]'); await wait(300)
    ok('Form: empty submit flags the fields', await page.evaluate(() => document.querySelectorAll('[data-ask] .is-bad').length) === 3)
  } else {
    await wait(2500)
    const f = await page.evaluate(() => { const c = document.querySelector('[data-ask]'), i = c.querySelector('iframe'); if (!i) return null; const r = i.getBoundingClientRect(), cr = c.getBoundingClientRect(); return { src: i.src, w: Math.round(r.width), h: Math.round(r.height), card: Math.round(cr.width) } })
    ok('Form: the GoHighLevel frame is in the slot and fills the card', !!f && /leadconnectorhq\.com\/widget\/form\//.test(f.src) && f.w >= f.card * .8 && f.h >= 300, f)
  }

  /* ---- BugHerd round 1 (2026-09-23): every change is proven by driving it, not by reading it ---- */
  const gone = await page.evaluate(() => ({
    chrome: [...document.querySelectorAll('.cursor, .rail, [data-rail], .arrival__frame')].length,
    numbers: [...document.querySelectorAll('.tag')].filter(t => /\b0\d\b/.test(t.textContent)).map(t => t.textContent.slice(0, 20)),
    fig: /\bFig\.\s*\d/.test(document.body.innerText),
    coords: /\d+\.\d+°/.test(document.body.innerText),
  }))
  ok('BugHerd: no cursor dot, chapter rail, hero frame, chapter numbers, Fig. labels or coordinates', !gone.chrome && !gone.numbers.length && !gone.fig && !gone.coords, gone)

  const q = await page.evaluate(() => { const s = document.querySelector('[data-question-stage]'), sp = s.parentElement; return { extra: sp.classList.contains('pin-spacer') ? sp.offsetHeight - s.offsetHeight : null, vh: innerHeight } })
  ok('BugHerd: The Question holds for about one screen of scrolling', q.extra !== null && q.extra <= q.vh * 1.1, q)

  // the steps are controls: click 03, then 01; then drag walks them
  const design = () => page.evaluate(() => ({ step: [...document.querySelectorAll('[data-design-step]')].findIndex(s => s.classList.contains('is-on')), pos: parseFloat(document.querySelector('[data-compare]').style.getPropertyValue('--pos')), lines: +getComputedStyle(document.querySelector('[data-draw]')).opacity, notes: [...document.querySelectorAll('[data-note]')].filter(n => +getComputedStyle(n).opacity > .9).length }))
  await page.evaluate(() => document.querySelector('.ch-design').scrollIntoView({ block: 'start' })); await wait(1200)
  await page.click('[data-design-step]:nth-child(3) [data-design-go]'); await wait(2500)
  const d3 = await design()
  ok('BugHerd: clicking step 03 plays the scene to the after', d3.step === 2 && d3.pos > 95, d3)
  ok('BugHerd: at "drag" the whole design shows, lines and labels', d3.lines === 1 && d3.notes === 4, d3)
  const cbox = await (await page.$('[data-compare]')).boundingBox()
  await page.mouse.move(cbox.x + cbox.width * .9, cbox.y + cbox.height / 2); await page.mouse.down()
  await page.mouse.move(cbox.x + cbox.width * .5, cbox.y + cbox.height / 2, { steps: 6 }); await page.mouse.up(); await wait(200)
  ok('BugHerd: dragging to the middle lights step 02', (await design()).step === 1, await design())
  await page.click('[data-design-step]:nth-child(1) [data-design-go]'); await wait(2500)
  const d1 = await design()
  ok('BugHerd: clicking step 01 goes back to the studied before', d1.step === 0 && d1.pos < 5, d1)

  // the memberships marquee stops under the pointer
  await page.evaluate(() => document.querySelector('[data-marquee]').scrollIntoView({ block: 'center' })); await wait(900)
  await page.hover('[data-marquee]'); await wait(900)
  const h1 = await mq(); await wait(600); const h2 = await mq()
  ok('BugHerd: marquee stops on hover', Math.abs(h1 - h2) < .5, [h1, h2])
  await page.mouse.move(5, 5); await wait(1500)
  ok('BugHerd: marquee runs again after', Math.abs((await mq()) - h2) > 1)

  // reviews turn on their own, and not under the pointer (the local rotator only: on staging the
  // Elfsight widget owns the reviews since 2026-09-30, see the check above)
  if (await page.$('[data-voices]')) {
    await page.evaluate(() => document.querySelector('[data-voices]').scrollIntoView({ block: 'center' })); await page.mouse.move(5, 5); await wait(800)
    const r0 = await page.evaluate(() => document.querySelector('.voice.is-on cite').textContent)
    await wait(8200)
    const r1 = await page.evaluate(() => document.querySelector('.voice.is-on cite').textContent)
    ok('BugHerd: reviews rotate on their own', r1 !== r0, [r0, r1])
    await page.hover('.voices__quotes'); await wait(8200)
    ok('BugHerd: reviews hold while hovered', await page.evaluate(() => document.querySelector('.voice.is-on cite').textContent) === r1)
    await page.mouse.move(5, 5)
  }

  // cards name the problem, then the procedure
  const meta = await page.evaluate(() => [...document.querySelectorAll('.card__meta')].map(m => [m.querySelector('b').textContent, (m.querySelector('.card__issue') || {}).textContent, m.querySelector('i').textContent]))
  ok('BugHerd: every story card shows the original issue, then the procedure', meta.length === 4 && meta.every(m => m[1] && /All-on-X/.test(m[2])), meta)

  // finance logos: links, equal boxes
  const fin = await page.evaluate(() => [...document.querySelectorAll('.finance__logo')].map(a => { const r = a.getBoundingClientRect(); return { href: a.getAttribute('href'), w: Math.round(r.width), h: Math.round(r.height) } }))
  ok('BugHerd: the three payment logos link to Payment Options, in equal boxes', fin.length === 3 && fin.every(f => f.href === '/about-our-practice/payment-options/' && f.w === fin[0].w && f.h === fin[0].h), fin)

  // FAQ opens and closes by click
  await page.evaluate(() => document.querySelector('[data-faq]').scrollIntoView({ block: 'center' })); await wait(900)
  const faq = () => page.evaluate(() => [...document.querySelectorAll('[data-faq-item]')].map(i => i.querySelector('[data-faq-btn]').getAttribute('aria-expanded') === 'true' && !i.querySelector('[data-faq-a]').hidden && i.querySelector('[data-faq-a]').offsetHeight > 20))
  const f0 = await faq()
  await page.click('[data-faq-item]:nth-child(2) [data-faq-btn]'); await wait(900)
  const f1 = await faq()
  await page.click('[data-faq-item]:nth-child(1) [data-faq-btn]'); await wait(400)
  const f2 = await faq()
  ok('BugHerd: FAQ has 7 questions, first open, and each opens and closes by click', f0.length === 7 && f0.join() === 'true,false,false,false,false,false,false' && f1[1] && !f2[0], { f0, f1, f2 })

  // footer
  const foot = await page.evaluate(() => { const f = document.querySelector('.foot'); return { tel: !!f.querySelector('a[href="tel:+16022422256"]'), maps: !!f.querySelector('a[href*="google.com/maps/dir"]'), fb: !!f.querySelector('a[href*="facebook.com/ifadentistry"]'), ig: !!f.querySelector('a[href*="instagram.com/doctor.bensoussan"]'), hours: /Monday to Thursday/.test(f.textContent), langs: /English, French and Dutch/.test(f.textContent) } })
  ok('BugHerd: footer has socials, directions, phone, hours and languages', Object.values(foot).every(Boolean), foot)

  // the hero film plays without any help
  await page.evaluate(() => window.scrollTo(0, 0)); await wait(2500)
  ok('BugHerd: hero film is playing at the top of the page', await page.evaluate(() => { const v = document.querySelector('[data-hero-video]'); return !v.paused && v.currentTime > 0 }))

  ok('Desktop: no console errors', errors.length === 0, errors)
  await page.close()
}

/* ------------------------------------------------------------ the live form, where there is one */
// A browser reloads an <iframe> every time it is moved in the DOM, and a ScrollTrigger pin moves its
// element on every refresh. Pinned, this form reloaded 25 times in 4 s. Budget: the first load, the
// consent bridge's one src write, and form_embed.js wrapping it once.
{
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
  let loads = 0
  page.on('request', r => { if (r.isNavigationRequest() && r.frame() !== page.mainFrame() && r.url().includes('/widget/form/')) loads++ })
  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 })
  if (await page.$('[data-ask] iframe')) {
    await page.evaluate(() => document.querySelector('[data-ask]').scrollIntoView({ block: 'start' }))
    await wait(12000)
    const settled = loads
    await page.evaluate(() => { window.scrollTo(0, 0); window.dispatchEvent(new Event('resize')); if (window.ScrollTrigger) ScrollTrigger.refresh() })
    await wait(3000)
    ok('Live form: the frame loads at most 3 times, and a refresh does not reload it', settled <= 3 && loads === settled, { loads: settled, afterRefresh: loads })
    await page.evaluate(() => document.querySelector('[data-ask]').scrollIntoView({ block: 'start' })); await wait(1500)
    const box = await page.evaluate(() => { const c = document.querySelector('[data-ask]'), i = c.querySelector('iframe'), cr = c.getBoundingClientRect(), r = i.getBoundingClientRect(), cs = getComputedStyle(c); return { over: Math.round(r.bottom - cr.bottom), right: Math.round(r.right - cr.right), opacity: cs.opacity, visibility: cs.visibility, pinned: c.parentElement.classList.contains('pin-spacer'), cardH: Math.round(cr.height), frameH: Math.round(r.height) } })
    ok('Live form: the frame sits inside its card, which is visible and not pinned', box.over <= 0 && box.right <= 0 && box.opacity === '1' && box.visibility === 'visible' && !box.pinned, box)
  }
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

  // The submit button locally; on the published page the form is a cross-origin frame, so the
  // bottom edge of its card stands in for the button.
  const cover = await page.evaluate(async () => {
    const t = document.querySelector('[data-ask] button[type="submit"]') || document.querySelector('[data-ask]')
    const isBtn = t.tagName === 'BUTTON'
    t.scrollIntoView({ block: isBtn ? 'center' : 'end' }); await new Promise(r => setTimeout(r, 1200))
    const b = t.getBoundingClientRect(), y = isBtn ? b.top + b.height / 2 : b.bottom - 40
    const el = document.elementFromPoint(b.left + b.width / 2, y)
    return !!(el && el.closest('[data-ask]'))
  })
  ok('Mobile: call bar never covers the submit area of the form', cover)

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
