/**
 * verify-r1.mjs — re-check every BugHerd round-1 note (project 542527) against the PUBLISHED staging home,
 * at the reviewer's viewport (1512x735), one line per note: ok / FAIL / LOOK (needs eyes; screenshot saved).
 *
 *   node verify-r1.mjs [base=https://staging.ifadentistry.com] > verify.log 2>&1
 *   out: <date>/verify/*.png  (the crops a person must look at)
 */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(path.resolve(HERE, '../../../../../../../package.json'))
const puppeteer = require('puppeteer-core')
const BASE = process.argv[2] || 'https://staging.ifadentistry.com'
const OUT = path.join(HERE, new Date().toISOString().slice(0, 10), 'verify')
fs.mkdirSync(OUT, { recursive: true })
const res = []
const say = (n, ok, msg) => { res.push([n, ok, msg]); console.log(`${String(ok === true ? 'ok' : ok === false ? 'FAIL' : 'LOOK').padEnd(5)} #${String(n).padEnd(3)} ${msg}`) }

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1512, height: 735 })
await page.goto(BASE + '/?smooth=off&cb=' + Date.now(), { waitUntil: 'networkidle2', timeout: 90000 })
await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto' })
await new Promise((r) => setTimeout(r, 3000))
const q = (fn, ...a) => page.evaluate(fn, ...a)
const scrollTo = async (sel, off = 0) => { await q((s, o) => { const e = document.querySelector(s); window.scrollTo(0, e.getBoundingClientRect().top + scrollY + o) }, sel, off); await new Promise((r) => setTimeout(r, 1400)) }
const shot = async (name, sel) => { const el = await page.$(sel); if (el) await el.screenshot({ path: path.join(OUT, name + '.png') }); else await page.screenshot({ path: path.join(OUT, name + '.png') }) }

const text = await q(() => document.body.innerText)
const tags = await q(() => [...document.querySelectorAll('.tag')].map((t) => t.innerText.replace(/\s+/g, ' ')))

say(1, await q(() => !document.querySelector('[data-cursor], .cursor, .cursor__dot')), 'no custom cursor dot')
say(31, await q(() => !document.querySelector('[data-cursor], .cursor__label')), 'no PLAY hover bubble on the films')
say(2, !/Fig\.\s*0/.test(text), 'no "Fig." labels anywhere')
say(8, !/Fig\.\s*01/.test(text), 'no "Fig. 01" in the question caption')
say(17, !/Fig\.\s*03/.test(text), 'no "Fig. 03" in the design caption')
say(5, await q(() => !document.querySelector('.arrival__frame, .frame, [data-frame], .coords')), 'no coordinates / frame around the hero film')
say(6, await q(() => !document.querySelector('.rail, [data-rail]')), 'no chapter rail of numbers and lines')
say(34, await q(() => !document.querySelector('.rail, [data-rail]')), 'no numbers on the right')
const numbered = tags.filter((t) => /^\s*0\d\s*[-·–]/.test(t))
for (const n of [3, 10, 16, 21, 23, 29, 35]) say(n, numbered.length === 0, `no "0N -" chapter numbers in tags (${tags.length} tags checked)`)
say(7, /Who is actually designing your new smile\?/.test(text), 'tag reads "Who is actually designing your new smile?"')
say(28, /surgical, cosmetic, and restorative treatment/.test(text), '"surgical, cosmetic, and restorative treatment."')
say(30, /Brighter smiles and brighter days/.test(text), '"Brighter smiles and brighter days."')
say(36, /Start with a free, no-obligation consultation/.test(text), '"Start with a free, no-obligation consultation."')
say(37, /No pressure, no judgment, just personalized guidance/.test(text), 'first-visit paragraph as written')
say(12, /Discipline 1/.test(text), '"Discipline 1", not A')
say(13, /Discipline 2/.test(text), '"Discipline 2", not B')

// 9: the question pin is one screen of scroll
const pin = await q(() => { const t = ScrollTrigger.getAll().find((s) => s.trigger && s.trigger.matches('[data-question-stage]') && s.pin); return t ? Math.round((t.end - t.start) / innerHeight * 100) : null })
say(9, pin !== null && pin <= 110, `question pin length ${pin}% of the viewport (was 240%)`)

// 18 / 19: steps are buttons; lines stay on at the end
say(18, await q(() => document.querySelectorAll('[data-design-step] .design__go').length === 3 && [...document.querySelectorAll('.design__go')].every((b) => b.tagName === 'BUTTON')), 'the three design steps are buttons')
const st = await q(() => { const t = ScrollTrigger.getAll().find((s) => s.trigger && s.trigger.matches('[data-design-stage]') && s.pin); return t ? [t.start, t.end] : null })
if (st) { await q((y) => window.scrollTo(0, y), st[1] - 5); await new Promise((r) => setTimeout(r, 1500)) }
const end = await q(() => ({ hint: document.querySelector('[data-design-hint]')?.textContent, lines: [...document.querySelectorAll('[data-line]')].filter((l) => parseFloat(getComputedStyle(l).opacity) > .5).length, notes: [...document.querySelectorAll('[data-note]')].filter((l) => parseFloat(getComputedStyle(l).opacity) > .5).length }))
say(19, end.hint === 'Drag to compare' && end.lines > 5 && end.notes >= 3, `at "${end.hint}": ${end.lines} guide lines and ${end.notes} labels visible`)
await shot('19-design-end', '[data-design-stage]')

// 11 / 14 / 15: faces in the disciplines; 20: the ear
await scrollTo('[data-disc]', -80)
await shot('11-14-15-disciplines', '[data-disc]')
say(11, null, 'disciplines photo crop (screenshot 11-14-15-disciplines.png)')
say(14, null, 'card no longer covers her face (same screenshot)')
say(15, null, 'face not cut off (same screenshot)')
await page.hover('[data-disc-panel]:nth-child(2)'); await new Promise((r) => setTimeout(r, 1200))
await shot('11-14-15-disciplines-panel2', '[data-disc]')
await scrollTo('.specialist', -60)
await shot('20-specialist', '.specialist__fig')
say(20, null, 'portrait shows both ears (screenshot 20-specialist.png)')

// 24-27: the four photos from the Drive
const srcs = await q(() => [...document.querySelectorAll('img')].map((i) => i.currentSrc || i.src))
say(24, srcs.some((s) => /dr-lab/.test(s)), 'specialist inset is DSC_3137 (dr-lab)')
say(25, srcs.some((s) => /path-3-lab/.test(s)), 'step 03 is DSC_3102 (path-3-lab)')
say(26, srcs.some((s) => /path-4-print/.test(s)), 'step 04 is DSC_3084 (path-4-print)')
say(27, srcs.some((s) => /path-6-design/.test(s)), 'step 06 is "Using technology to create smiles" (path-6-design)')

// 22: marquee stops on hover
await scrollTo('[data-marquee]', -200)
const mq = async () => q(() => new DOMMatrix(getComputedStyle(document.querySelector('[data-marquee-track]')).transform).m41)
await page.hover('[data-marquee]'); await new Promise((r) => setTimeout(r, 900))
const a = await mq(); await new Promise((r) => setTimeout(r, 1200)); const b = await mq()
say(22, Math.abs(a - b) < 1, `memberships marquee holds still under the pointer (moved ${Math.abs(a - b).toFixed(1)}px in 1.2 s)`)

// 32: issue under each name
const cards = await q(() => [...document.querySelectorAll('.card__meta')].map((m) => ({ name: m.querySelector('b')?.textContent, issue: m.querySelector('.card__issue')?.textContent, proc: m.querySelector('i')?.textContent })))
say(32, cards.length === 4 && cards.every((c) => c.issue && c.proc), `story cards: ${cards.map((c) => `${c.name}: ${c.issue}`).join('; ')}`)

// 33 / 34 now: the live Google reviews (Elfsight) replaced the static rotator on 2026-09-30
await scrollTo('.rv-embed', -100); await new Promise((r) => setTimeout(r, 4000))
const rv = await q(() => { const host = document.querySelector('.rv-embed [class*="elfsight-app"]'); const sr = host && (host.shadowRoot || host.querySelector('*')?.shadowRoot); const t = (sr ? sr.textContent : host?.textContent || ''); return { h: document.querySelector('.rv-embed')?.offsetHeight, chars: t.length, hasRotator: !!document.querySelector('[data-voices]') } })
say(33, rv.h > 200 && !rv.hasRotator ? null : false, `reviews are now the live Google widget (height ${rv.h}px, ${rv.chars} chars rendered); its own carousel: look (screenshot 33-reviews.png)`)
await shot('33-reviews', '.rv-embed')

// 39: payment logos
const fin = await q(() => [...document.querySelectorAll('.finance__logo')].map((a) => ({ href: a.getAttribute('href'), w: Math.round(a.getBoundingClientRect().width), h: Math.round(a.getBoundingClientRect().height), img: Math.round(a.querySelector('img').getBoundingClientRect().height) })))
say(39, fin.length === 3 && fin.every((f) => /payment-options/.test(f.href)) && new Set(fin.map((f) => f.w + 'x' + f.h)).size === 1, `logos link to the payment page, boxes ${fin.map((f) => f.w + 'x' + f.h).join(', ')}`)
await scrollTo('.finance', -120); await shot('39-finance', '.finance')

// 41: footer
const foot = await q(() => { const f = document.querySelector('.foot'); return { social: f.querySelectorAll('.foot__social a').length, dir: !!f.querySelector('a[href*="google.com/maps"]'), tel: !!f.querySelector('a[href^="tel:"]'), hours: /Monday to Thursday/.test(f.innerText), lang: /English, French and Dutch/.test(f.innerText) } })
say(41, foot.social === 2 && foot.dir && foot.tel && foot.hours && foot.lang, `footer: ${JSON.stringify(foot)}`)

// 42: FAQ
const faq = await q(() => [...document.querySelectorAll('#faq .faq__q')].map((h) => h.innerText.trim()))
say(42, faq.length === 7, `FAQ before the footer, ${faq.length} questions`)

// 38 / 40: the GoHighLevel form (fixed in GoHighLevel, not on the site)
say(38, null, 'procedure field: a GoHighLevel form setting (form cxtQ5q29TfUr3cYlMmDB)')
say(40, null, '"Submission in progress": GoHighLevel save-and-exit (enableSaveExitConfirmation), form setting')
say(4, null, 'hero film autoplay: verified separately in WebKit')

await browser.close()
const f = res.filter((r) => r[1] === false).length, l = res.filter((r) => r[1] === null).length
console.log(`\n${res.length} checks: ${res.length - f - l} ok, ${f} FAIL, ${l} LOOK -> ${OUT}`)
