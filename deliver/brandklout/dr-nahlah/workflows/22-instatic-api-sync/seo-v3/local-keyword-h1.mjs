#!/usr/bin/env node
// The keyword-H1 change of push-keyword-h1.mjs, in the local source (04-design/.tmp/site-src):
// the 11 treatment heroes and the three CSS rules (css/20-pagekit.css). Idempotent.
//   node seo-v3/local-keyword-h1.mjs
import { readFileSync, writeFileSync } from 'node:fs'
const SRC = new URL('../../04-design/.tmp/site-src/', import.meta.url)
const META = JSON.parse(readFileSync(new URL('../seo-v2/meta.json', import.meta.url), 'utf8'))
const SLUGS = ['dental-implants', 'all-on-4', 'implant-supported-dentures', 'crowns-and-bridges', 'veneers', 'teeth-whitening', 'smile-makeover', 'cosmetic-dentistry', 'oral-surgery', 'sedation-dentistry', 'emergency-dentistry']
const kw = (s) => META[s][0].replace(/\s*\|\s*Dr\. Nahlah$/, '').replace(/&/g, '&amp;').replace(/, VA$/, ',&nbsp;VA')
for (const s of SLUGS) {
  const f = new URL(`pages/${s}.body.html`, SRC)
  let h = readFileSync(f, 'utf8')
  if (h.includes('<p data-split>')) { console.log(`${s}: already done`); continue }
  const i = h.indexOf('<h1 data-split>')
  if (i < 0 || h.indexOf('<h1 data-split>', i + 1) >= 0) throw new Error(`${s}: expected one <h1 data-split>`)
  const indent = h.slice(h.lastIndexOf('\n', i) + 1, i)
  const close = h.indexOf('</h1>', i)
  h = h.slice(0, i) + `<h1 class="text-style-tagline" data-rv>${kw(s)}</h1>\n${indent}<p data-split>` + h.slice(i + '<h1 data-split>'.length, close) + '</p>' + h.slice(close + 5)
  writeFileSync(f, h)
  console.log(`${s}: keyword h1 + headline <p>`)
}
const css = new URL('css/20-pagekit.css', SRC)
let c = readFileSync(css, 'utf8')
const anchor = '.section_page-hero h1 em{font-style:italic;color:var(--accent-lg)}'
const add = [
  '/* Treatment heroes (SEO 2026-10-06): a keyword <h1> in the eyebrow style, the designed headline as',
  '   <p data-split> with exactly the look the hero h1 gave it. Mirrors the Instatic registry rules. */',
  '.section_page-hero p[data-split]{font-family:var(--f-display);font-weight:500;line-height:1.02;letter-spacing:-.02em;color:var(--fg);font-size:var(--d2);max-width:17ch}',
  '.section_page-hero p[data-split] em{font-style:italic;color:var(--accent-lg)}',
  '.section_page-hero h1.text-style-tagline{font-size:var(--label);max-width:none;line-height:1.5;margin-bottom:1rem}',
].join('\n')
if (!c.includes('p[data-split]')) {
  if (!c.includes(anchor)) throw new Error('css anchor not found')
  c = c.replace(anchor, anchor + '\n' + add)
  writeFileSync(css, c)
  console.log('css: three rules added')
} else console.log('css: already there')
