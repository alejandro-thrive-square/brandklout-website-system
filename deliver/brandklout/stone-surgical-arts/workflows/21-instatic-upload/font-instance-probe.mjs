#!/usr/bin/env node
/**
 * WHY THE PUBLISHED PROSE REFLOWS AND THE LOCAL BUILD DOES NOT.
 *
 * Symptom, first seen on the blog article pages on 2026-09-08: with scripts ON,
 * the published article measures ~30px shorter than the local build. One body
 * paragraph sets in two lines live and three lines locally. `verify-live.mjs`
 * is clean, and `compare-live.mjs` with scripts OFF reports no differences at
 * all — the two pages agree to the pixel until JavaScript runs.
 *
 * It is NOT any of the things it looks like, each of which was tested and ruled
 * out on 2026-09-08. Do not re-chase them:
 *
 *   - NOT the font FILES. Instatic ignores assets/fonts entirely and serves its
 *     own /uploads/fonts/<family>/<weight>-latin-0.woff2. Those binaries differ
 *     from ours (one variable file covers all four Inter weights; ours are four
 *     static subsets). Swapping the local files for Instatic's changes nothing,
 *     because with scripts off the two already measure IDENTICALLY.
 *   - NOT BugHerd. Blocking bugherd.com leaves the difference exactly as it was.
 *   - NOT an injected stylesheet. The four Instatic stylesheets carry seven
 *     @font-face rules between them, all same-origin, no local() source.
 *   - NOT document.fonts.add(). Hooking it before any page script records zero
 *     calls, and document.adoptedStyleSheets is empty.
 *   - NOT a third-party webfont. The published page makes no request to
 *     fonts.gstatic.com; the same six font files load with scripts on and off.
 *   - NOT a layout difference. The paragraph is 640px wide either way, same
 *     font-size, line-height, letter-spacing, word-spacing and weight.
 *
 * WHAT IT ACTUALLY IS: the same downloaded file resolves to a different font
 * INSTANCE. CSS.getPlatformFontsForNode reports the paragraph rasterised as
 * postScriptName "Inter" (171 glyphs) with scripts off and "Inter-Regular"
 * (172 glyphs) with scripts on. A 64-character string measures 480.41px against
 * 479.80px — 0.13% narrower, about 0.6px per line. That is under a pixel a line
 * and invisible on its own; it only becomes visible where a long paragraph sits
 * near a line-break boundary, which is why the twelve original pages never
 * showed it and the first long-prose pages did.
 *
 * CONSEQUENCE FOR THE GATES. `compare-live.mjs` with scripts off stays the
 * gate: it is deterministic and it passes. `--runtime-layout` re-measures
 * geometry with scripts on and therefore reports this difference on every
 * prose-heavy page; treat that flag as a DIAGNOSTIC, not a gate, and read its
 * findings against this file before believing you have a regression.
 *
 *   node font-instance-probe.mjs                     # the article page
 *   node font-instance-probe.mjs neck-lift           # any other slug
 */
import puppeteer from 'puppeteer-core'

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const LIVE = (process.env.INSTATIC_BASE_URL || 'https://stone-surgical-arts-production.up.railway.app').replace(/\/$/, '')
const SLUG = process.argv[2] || 'dermal-fillers-vs-botox'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

/* A fixed string measured in the paragraph's own computed font. Canvas and a
   hidden span are measured separately because they can disagree when a fallback
   is in play; here they agree, which is what makes the result trustworthy. */
const MEASURE = (s) => {
  const sec = document.querySelectorAll('section.journal_section')[1]
  const ps = sec ? sec.querySelectorAll('p') : []
  const p = ps[ps.length - 1]
  if (!p) return null
  const cs = getComputedStyle(p)
  const c = document.createElement('canvas').getContext('2d')
  c.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight} ${cs.fontFamily}`
  const span = document.createElement('span')
  span.textContent = s
  span.style.cssText = 'position:absolute;white-space:nowrap;visibility:hidden'
  p.appendChild(span)
  const spanW = span.getBoundingClientRect().width
  span.remove()
  return {
    paraW: +p.getBoundingClientRect().width.toFixed(2),
    paraH: +p.getBoundingClientRect().height.toFixed(2),
    fontSize: cs.fontSize, lineHeight: cs.lineHeight, fontWeight: cs.fontWeight,
    canvasW: +c.measureText(s).width.toFixed(2), spanW: +spanW.toFixed(2),
    faces: document.fonts.size,
  }
}

const SAMPLE = 'A filler does not relax a muscle in the way botulinum toxin does.'
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--hide-scrollbars'] })

for (const withJs of [false, true]) {
  const pg = await browser.newPage()
  const cdp = await pg.target().createCDPSession()
  await cdp.send('DOM.enable')
  await cdp.send('CSS.enable')
  await pg.setJavaScriptEnabled(withJs)
  await pg.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await pg.setViewport({ width: 1440, height: 900 })
  await pg.goto(`${LIVE}/${SLUG}`, { waitUntil: 'networkidle0', timeout: 90000 })
  await wait(withJs ? 2200 : 700)

  const m = await pg.evaluate(MEASURE, SAMPLE)
  const { root } = await cdp.send('DOM.getDocument')
  const { nodeId } = await cdp.send('DOM.querySelector', {
    nodeId: root.nodeId,
    selector: 'section.journal_section:nth-of-type(2) p:last-of-type',
  })
  const platform = nodeId ? (await cdp.send('CSS.getPlatformFontsForNode', { nodeId })).fonts : []

  console.log(`\n--- ${LIVE}/${SLUG}   scripts ${withJs ? 'ON' : 'off'}`)
  if (m) {
    console.log(`    paragraph    ${m.paraW}px wide, ${m.paraH}px tall  (${Math.round(m.paraH / parseFloat(m.lineHeight))} lines)`)
    console.log(`    type         ${m.fontSize}/${m.lineHeight} weight ${m.fontWeight}, ${m.faces} faces registered`)
    console.log(`    sample width canvas ${m.canvasW}px, span ${m.spanW}px`)
  }
  for (const f of platform) console.log(`    rasterised   ${f.familyName}  postScript=${f.postScriptName || '-'}  glyphs=${f.glyphCount}`)
  await pg.close()
}

console.log('\nA differing postScriptName between the two blocks above is the known')
console.log('font-instance difference described at the top of this file, not a regression.')
await browser.close()
