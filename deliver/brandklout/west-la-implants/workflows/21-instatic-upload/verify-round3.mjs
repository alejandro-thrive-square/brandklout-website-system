#!/usr/bin/env node
/**
 * verify-round3.mjs: renders the BugHerd round-3 changes on the published site and writes
 * screenshots + facts to <out>/ (headless Chrome through puppeteer-core).
 *
 *   node verify-round3.mjs <out> [--base <origin>] [--only sections|images|mobile|nav]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const OUT = process.argv[2]
const bi = process.argv.indexOf('--base')
const BASE = bi > -1 ? process.argv[bi + 1] : 'https://west-la-implants-production.up.railway.app'
const oi = process.argv.indexOf('--only')
const ONLY = oi > -1 ? process.argv[oi + 1] : null
fs.mkdirSync(OUT, { recursive: true })
const facts = []
const fact = (s) => { facts.push(s); console.log(s) }
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--hide-scrollbars'] })
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

async function open(url, w, h, mobile = false) {
  const page = await browser.newPage()
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile })
  if (mobile) await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1')
  await page.evaluateOnNewDocument(() => { document.documentElement.style.scrollBehavior = 'auto' })
  await page.goto(BASE + url, { waitUntil: 'networkidle2', timeout: 90000 })
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto' })
  await wait(1500)
  // the Termly banner covers the lower third of every frame
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Accept'); if (b) b.click() })
  await wait(400)
  // walk the page once so every once-only reveal has fired
  await page.evaluate(async () => {
    const H = () => document.documentElement.scrollHeight
    for (let y = 0; y < H(); y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)) }
    window.scrollTo(0, 0)
  })
  await wait(1200)
  return page
}
async function goTo(page, sel, offset = 0) {
  const ok = await page.evaluate((sel, offset) => {
    const el = document.querySelector(sel); if (!el) return false
    const top = el.getBoundingClientRect().top + window.scrollY + offset
    window.scrollTo(0, Math.max(0, top)); return true
  }, sel, offset)
  await wait(1700)
  return ok
}
async function shot(page, name) { await page.screenshot({ path: path.join(OUT, name + '.jpg'), type: 'jpeg', quality: 72 }) }

if (!ONLY || ONLY === 'sections') {
  const p = await open('/technology', 1440, 900)
  fact(`/technology pins left: ${await page_pins(p)}; chapters: ${await p.evaluate(() => [...document.querySelectorAll('main > section, main > div > section')].map((s) => s.id + ':' + s.dataset.chapter).join(' '))}`)
  fact(`/technology fonts: Lora ${await p.evaluate(() => document.fonts.check('600 32px "Lora WLA"'))}, statement family ${await p.evaluate(() => getComputedStyle(document.querySelector('.st-big, .statement_text')).fontFamily)}; word opacity ${await p.evaluate(() => getComputedStyle(document.querySelector('.st-big .wz-word, .statement_text .wz-word') || document.querySelector('.st-big, .statement_text')).opacity)}`)
  for (const id of ['steps', 'statement', 'ledger', 'proof', 'questions']) { await goTo(p, '#' + id); await shot(p, `tech-${id}`) }
  fact(`/technology scroll cue: ${await p.evaluate(() => { const c = document.querySelector('.steps_scroll-cue'); return c ? getComputedStyle(c).display + ' "' + c.textContent + '"' : 'none' })}`)
  await goTo(p, '#ledger')
  const li = await p.$('#ledger li:nth-of-type(3)'); if (li) { await li.hover(); await wait(700); await shot(p, 'tech-ledger-hover') }
  await goTo(p, '#proof')
  const st = await p.$('#proof .ba-stage, #proof .before-after_stage'); if (st) { await st.hover(); await wait(1200); await shot(p, 'tech-proof-hover') }
  fact(`/technology proof after clip on hover: ${await p.evaluate(() => getComputedStyle(document.querySelector('.ba-after, .before-after_after')).clipPath)}`)
  await p.close()

  const d = await open('/dental-implants', 1440, 900)
  fact(`/dental-implants pins left: ${await page_pins(d)}`)
  for (const id of ['arrival', 'statement', 'steps', 'compare', 'strip', 'proof']) { await goTo(d, '#' + id); await shot(d, `di-${id}`) }
  fact(`/dental-implants compare columns: ${await d.evaluate(() => [...document.querySelectorAll('.cp-col, .compare_column')].map((c) => getComputedStyle(c).opacity + '/' + getComputedStyle(c).borderTopColor).join(' '))}`)
  await goTo(d, 'footer'); await shot(d, 'di-footer')
  await d.close()

  const h = await open('/', 1440, 900)
  fact(`/ pins left: ${await page_pins(h)}`)
  await goTo(h, '#reality'); await shot(h, 'home-reality')
  await h.close()

  for (const [url, ids] of [['/general-dentistry', ['statement', 'strip']], ['/surgery-and-care', ['arrival', 'treatments', 'invitation']], ['/the-practice', ['arrival', 'practice']], ['/missing-teeth', ['arrival']], ['/referring-doctors', ['arrival']], ['/our-practice', ['team']], ['/dr-tony-barriere', ['arrival', 'proof']], ['/hybrid-dentures', ['arrival']], ['/faq', ['arrival']]]) {
    const q = await open(url, 1440, 900)
    for (const id of ids) { await goTo(q, '#' + id); await shot(q, `${url.slice(1) || 'home'}-${id}`) }
    await q.close()
  }
}

if (!ONLY || ONLY === 'nav') {
  for (const w of [1920, 1440, 1280, 1100]) {
    const p = await open('/technology', w, 900)
    const r = await p.evaluate(() => {
      const nav = document.querySelector('.nav-links, .nav_links'); const inn = document.querySelector('.nav-in, .nav_container')
      if (!nav) return 'no nav'
      const cs = getComputedStyle(nav)
      return `display ${cs.display}; nav ${Math.round(nav.getBoundingClientRect().width)} of ${Math.round(inn.getBoundingClientRect().width)}; overflow ${inn.scrollWidth > inn.clientWidth + 1}; links ${[...nav.querySelectorAll('a')].map((a) => a.textContent).join(' | ')}`
    })
    fact(`nav @${w}: ${r}`)
    await p.screenshot({ path: path.join(OUT, `nav-${w}.jpg`), type: 'jpeg', quality: 72, clip: { x: 0, y: 0, width: w, height: 90 } })
    await p.close()
  }
}

if (!ONLY || ONLY === 'mobile') {
  for (const [url, ids] of [['/general-dentistry', ['statement']], ['/surgery-and-care', ['arrival', 'treatments']], ['/dental-implants', ['proof', 'compare']]]) {
    const q = await open(url, 390, 844, true)
    for (const id of ids) { await goTo(q, '#' + id); await shot(q, `m-${url.slice(1)}-${id}`) }
    if (url === '/dental-implants') {
      const st = await q.$('#proof .ba-stage, #proof .before-after_stage')
      if (st) { await st.tap(); await wait(1200); await goTo(q, '#proof'); await shot(q, 'm-dental-implants-proof-tapped') }
    }
    await goTo(q, 'footer'); await shot(q, `m-${url.slice(1)}-footer`)
    await q.close()
  }
}

if (!ONLY || ONLY === 'images') {
  const slots = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '.tmp', 'round3-slots.json'), 'utf8'))
  const byUrl = {}
  for (const s of slots) (byUrl[s.slug] ||= []).push(s)
  for (const [slug, list] of Object.entries(byUrl)) {
    const p = await open('/' + slug, 1440, 900)
    for (const s of list) {
      const sel = s.slot === 'cover' ? '#arrival .cv-media, #arrival .cover_image-wrapper'
        : s.slot === 'steps' ? '#steps .sp-shot, #steps .steps_image-wrapper'
        : s.slot.startsWith('strip') ? `#strip .ph-shot--${s.slot.split(':')[1]}, #strip .is-photo-${+s.slot.split(':')[1] + 1}`
        : `#entries .px-card:nth-of-type(${s.slot.split(':')[1]}) figure, #entries .post-index_card:nth-of-type(${s.slot.split(':')[1]}) figure`
      const el = await p.$(sel)
      if (!el) { fact(`image ${s.pin} /${slug} ${s.slot}: NOT FOUND`); continue }
      await p.evaluate((e) => { const r = e.getBoundingClientRect(); window.scrollTo(0, r.top + window.scrollY - 120) }, el)
      await wait(1500)
      await el.screenshot({ path: path.join(OUT, `img-${s.pin.replace('#', '')}-${slug}-${s.slot.replace(':', '')}.jpg`), type: 'jpeg', quality: 70 })
    }
    await p.close()
  }
}

async function page_pins(p) { return p.evaluate(() => window.ScrollTrigger ? ScrollTrigger.getAll().filter((s) => s.pin).map((s) => (s.trigger.closest('section') || s.trigger).id).join(',') || 'none' : 'no ST') }
fs.writeFileSync(path.join(OUT, 'facts.txt'), facts.join('\n') + '\n')
await browser.close()
