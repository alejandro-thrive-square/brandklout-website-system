#!/usr/bin/env node
/**
 * verify-form.mjs - does each campaign's GoHighLevel form actually load, fill its card and stay
 * unclipped on the PUBLISHED pages? Headless Chrome over raw CDP, no npm dependencies.
 *
 * Origin: mason-park/workflows/10-lp-instatic/output/verify-form.mjs (bk-mason-park, 2026-09-18),
 * merged with mason-park/workflows/09-static-rebuild/output/probe-ad-form-box.mjs. Generalized from
 * the hardcoded six-slug CASES map to the combo manifest. The box and clipping checks exist
 * because both earlier gates only asserted "non-zero size":
 *   - Mason Park 2026-09-18: the placeholder's centring grid survived onto the Embed block and
 *     left the iframe at its 300px intrinsic width in a 578px card. verify-form printed 300x905
 *     on every run and nobody read the width.
 *   - Dr. Nahlah 2026-09-21: an embed measured perfectly against its own wrapper while its
 *     overflow:hidden ancestor cut it in half. Measure against the clipping ancestor.
 *
 * Visibility is NOT asserted: behind Cloudflare Turnstile the GHL frame stays at opacity 0 /
 * left -9999px in any automated browser (error 600010), even on the client's own live forms. It
 * does reveal on the deployed domain after ~10 s at 1440 and up to ~25 s at 390, never on
 * localhost. A human in a real browser on the real domain is the only proof of the visible form.
 *
 * Per landing + consultation page: exactly one form iframe with this campaign's id, the form
 * request and form_embed.js answer 200, nothing blocked by CSP, iframe width >= 90% of its
 * parent's content box (and never the 300px fallback), no overflow:hidden / aspect-ratio
 * ancestor clipping it. Per thank-you page: no form iframe at all.
 *
 *   node verify-form.mjs --combo combo.json [--origin https://staging.example.com] [--widths 1440,390] [--wait 14000] > output/verify-form.log 2>&1
 */
import { parseArgs, loadCombo, comboUrls } from '../../../tools/ads-combo/lib/combo.mjs'
import { launch, wait } from '../../../tools/ads-combo/lib/cdp.mjs'

const { flags } = parseArgs()
const c = loadCombo(flags.combo, flags.origin)
const widths = String(flags.widths || '1440').split(',').map(Number)
const settle = Number(flags.wait || 14000) // the GHL frame arrives at 150px and grows seconds later

const MEASURE = `(() => {
  const fs = [...document.querySelectorAll('iframe')].filter((f) => /widget\\/form\\//.test(f.src || f.getAttribute('data-src') || ''))
  const f = fs[0]
  if (!f) return { count: 0 }
  const r = f.getBoundingClientRect()
  const p = f.parentElement, pcs = getComputedStyle(p)
  const pInner = p.getBoundingClientRect().width - parseFloat(pcs.paddingLeft) - parseFloat(pcs.paddingRight)
  let clipped = 0, clipper = null
  for (let el = p; el && el !== document.body; el = el.parentElement) {
    const cs = getComputedStyle(el)
    // A position:fixed overflow:hidden ancestor is a scroll viewport (GSAP ScrollSmoother's
    // #smooth-wrapper), not a clip: the page scrolls inside it. West LA, 2026-10-05.
    if (cs.position === 'fixed') continue
    if (/hidden|clip/.test(cs.overflow + cs.overflowY) || cs.aspectRatio !== 'auto') {
      const a = el.getBoundingClientRect()
      const px = Math.max(0, r.bottom - a.bottom) + Math.max(0, a.top - r.top) + Math.max(0, r.right - a.right)
      if (px > clipped) { clipped = Math.round(px); clipper = el.tagName.toLowerCase() + '.' + String(el.className).split(/\\s+/).slice(0, 3).join('.') }
    }
  }
  const chain = []
  for (let el = f; el && chain.length < 6; el = el.parentElement) {
    const b = el.getBoundingClientRect(), cs = getComputedStyle(el)
    chain.push(el.tagName.toLowerCase() + '.' + String(el.className || '').slice(0, 40) + ' ' + Math.round(b.width) + 'x' + Math.round(b.height) + ' ' + cs.display)
  }
  return { count: fs.length, src: f.getAttribute('src') || f.getAttribute('data-src'), w: Math.round(r.width), h: Math.round(r.height),
    pInner: Math.round(pInner), clipped, clipper, chain, loader: !!document.querySelector('script[src*="form_embed.js"]') }
})()`

const problems = []
for (const width of widths) {
  const b = await launch({ width, mobile: width < 768 })
  let net = [], csp = []
  b.on((m) => {
    if (m.method === 'Network.responseReceived') net.push([m.params.response.status, m.params.response.url])
    if (m.method === 'Network.loadingFailed' && m.params.blockedReason === 'csp') csp.push(m.params.type)
  })
  for (const u of comboUrls(c)) {
    net = []; csp = []
    await b.S('Page.navigate', { url: u.url })
    await wait(3000)
    await b.evalJs(`(document.querySelector('iframe[src*="widget/form/"]')||{scrollIntoView(){}}).scrollIntoView({block:'center'})`)
    await wait(u.kind === 'thankYou' ? 2000 : settle)
    const d = await b.evalJs(MEASURE)
    const tag = `${u.path} @${width}`
    const gotId = d.src ? d.src.split('/').pop().split('?')[0] : '-' // the consent bridge appends privacy_* params
    const formReq = net.find(([, x]) => /widget\/form\//.test(x))
    const loaderReq = net.find(([, x]) => /form_embed\.js/.test(x))
    console.log(`${tag.padEnd(60)} forms ${d.count}  id ${gotId}  ${d.w ?? 0}x${d.h ?? 0} in ${d.pInner ?? '-'}  clipped ${d.clipped ?? 0}`)
    if (u.kind === 'thankYou') { if (d.count) problems.push(`${tag}: a thank-you page must carry no form, found ${gotId}`); continue }
    if (d.count !== 1) problems.push(`${tag}: expected exactly one form iframe, found ${d.count}`)
    if (!d.count) continue
    if (gotId !== u.campaign.formId) problems.push(`${tag}: form id ${gotId}, expected ${u.campaign.formId} (${u.campaign.name})`)
    if (!formReq || formReq[0] !== 200) problems.push(`${tag}: the form request returned ${formReq ? formReq[0] : 'nothing'}`)
    if (!d.loader || (loaderReq && loaderReq[0] !== 200)) problems.push(`${tag}: form_embed.js missing or ${loaderReq ? loaderReq[0] : 'not requested'}`)
    if (!d.w || !d.h) problems.push(`${tag}: the form iframe has no size`)
    if (d.w && d.pInner > 400 && (d.w <= 310 || d.w < 0.9 * d.pInner)) problems.push(`${tag}: iframe ${d.w}px wide in a ${d.pInner}px box (placeholder CSS on the .wz-embed slot?) chain: ${d.chain.join(' < ')}`)
    if (d.clipped > 0) problems.push(`${tag}: ${d.clipped}px of the form clipped by ${d.clipper}`)
    if (csp.length) problems.push(`${tag}: ${csp.length} request(s) blocked by CSP (${[...new Set(csp)].join(', ')})`)
  }
  b.close()
}
console.log(`\n${problems.length} problem(s)`)
for (const p of problems) console.log('  PROBLEM ' + p)
process.exitCode = problems.length ? 1 : 0
