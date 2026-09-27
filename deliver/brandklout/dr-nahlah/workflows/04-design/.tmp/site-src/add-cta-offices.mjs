#!/usr/bin/env node
/**
 * add-cta-offices.mjs — put BOTH offices in every call-to-action band.
 *
 *   node add-cta-offices.mjs           # report what it would change
 *   node add-cta-offices.mjs --apply   # rewrite pages/*.body.html
 *
 * ## Why
 *
 * Every CTA on this site ended in one button. The two practices keep SEPARATE
 * Flexbook calendars, so one button cannot serve both — it sends every reader
 * to whichever office is hardcoded in it. The home page's did exactly that:
 * "Book Your Free Consult" pointed at flexbook.me/drnahlah, the ALEXANDRIA
 * calendar, so a reader who had just read the McLean address booked McLean's
 * competitor down the road by accident.
 *
 * The Webflow build fixed it on 2026-08-24 by replacing that button with its
 * two office cards (`.location-cta` > `.of`), each carrying its own booking
 * link. This applies the same fix to all 24 CTA bands here: 23 `.pk-cta`
 * sections on the interior pages and the home page's `.iv-cta`.
 *
 * ## What it replaces, exactly
 *
 * On a `.pk-cta` band: the lone `.btn-dark` and the `.cta-phones` row after it.
 * The phone row goes because the cards carry the same two numbers, labelled by
 * office and by new-versus-current patient, which the row never distinguished.
 *
 * On the home page: the lone `.btn-dark`, AND the separate `.iv-locs` block
 * above the band. Both offices appearing twice, once in a locations strip and
 * again in the CTA, is not what Webflow does and reads as a mistake. `#locs`
 * moves onto the new grid so `sections/ch-invitation.js` keeps its trigger.
 *
 * This script is idempotent: a band that already carries `.cta-offices` is left
 * alone, so it can be re-run after a page is edited by hand.
 *
 * Addresses and numbers are the same ones in pages/contact*.body.html and in
 * partials/footer.html. Change them in all of those together.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = path.dirname(fileURLToPath(import.meta.url))
const PAGES = path.join(SRC, 'pages')
const APPLY = process.argv.includes('--apply')

const OFFICES = [
  {
    name: 'Tysons Corner &middot; McLean',
    lines: ['7901 Jones Branch Drive, Suite 220', 'McLean, VA 22102'],
    newTel: ['+17034483312', '(703) 448-3312'],
    curTel: ['+17034483312', '(703) 448-3312'],
    maps: 'https://www.google.com/maps/search/?api=1&amp;query=7901+Jones+Branch+Drive+Suite+220+McLean+VA+22102',
    book: 'https://www.flexbook.me/DrNahlahTy/1',
  },
  {
    name: 'Alexandria',
    lines: ['2855 Duke Street', 'Alexandria, VA 22314'],
    newTel: ['+15716177245', '(571) 617-7245'],
    curTel: ['+17039405410', '(703) 940-5410'],
    maps: 'https://www.google.com/maps/search/?api=1&amp;query=2855+Duke+Street+Alexandria+VA+22314',
    book: 'https://flexbook.me/drnahlah',
  },
]

const card = (o, indent) => {
  const i = ' '.repeat(indent)
  return `${i}<article class="ct-office">
${i}  <h3>${o.name}</h3>
${i}  <address>Dr. Nahlah Implants and Prosthodontics Specialists<br>
${i}    ${o.lines[0]}<br>
${i}    ${o.lines[1]}</address>
${i}  <div class="ct-office-line"><span>New patients</span>
${i}    <a href="tel:${o.newTel[0]}">${o.newTel[1]}</a></div>
${i}  <div class="ct-office-line"><span>Current patients</span>
${i}    <a href="tel:${o.curTel[0]}">${o.curTel[1]}</a></div>
${i}  <a class="pk-more ct-office-dirs" href="${o.maps}"
${i}     target="_blank" rel="noopener">Directions</a>
${i}  <a class="btn btn-primary magnetic" href="${o.book}"
${i}     target="_blank" rel="noopener"><span>Book now</span></a>
${i}</article>`
}

const block = (indent, id = '') => {
  const i = ' '.repeat(indent)
  return `${i}<!-- BOTH offices, each with its OWN Flexbook calendar. One shared button here
${i}     books every reader into one office; see add-cta-offices.mjs. -->
${i}<div class="cta-offices"${id ? ` id="${id}"` : ''} data-rv="stagger">
${OFFICES.map((o) => card(o, indent + 2)).join('\n')}
${i}</div>`
}

/* The lone button plus the phone row that followed it, on a .pk-cta band. */
const PK_CTA = /([ \t]*)<a class="btn btn-dark magnetic"[^>]*>[\s\S]*?<\/a>\s*\n[ \t]*<div class="cta-phones"[^>]*>[\s\S]*?<\/div>/

/**
 * Remove one whole element, opening tag to MATCHING close, by walking tag depth.
 *
 * `.iv-locs` contains two `.iv-loc` children, so a lazy `[\s\S]*?</div>` closes
 * on the first inner div and leaves the outer one dangling — the page then has
 * an unbalanced tree that still builds and still renders, wrongly. Counting is
 * the only thing that gets this right.
 */
function cutElement(s, openTagRe) {
  const open = openTagRe.exec(s)
  if (!open) return null
  const tag = /<\s*([a-zA-Z][a-zA-Z0-9-]*)/.exec(open[0])[1]
  const scan = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'g')
  scan.lastIndex = open.index
  let depth = 0, m
  while ((m = scan.exec(s))) {
    depth += m[1] ? -1 : 1
    if (depth === 0) {
      let end = m.index + m[0].length
      if (s[end] === '\n') end++
      let start = open.index
      while (start > 0 && (s[start - 1] === ' ' || s[start - 1] === '\t')) start--
      return s.slice(0, start) + s.slice(end)
    }
  }
  return null
}

const changed = []
for (const file of fs.readdirSync(PAGES).filter((f) => f.endsWith('.body.html')).sort()) {
  const full = path.join(PAGES, file)
  const raw = fs.readFileSync(full, 'utf8')

  /* These files are CRLF. Every pattern below is written against \n, so the
     text is normalised on the way in and the original ending restored on the
     way out — otherwise a pattern anchored on `-->\n` silently fails to match
     `-->\r\n`, the file is left HALF transformed, and the run still reports
     success because some other replacement did fire. That happened. */
  const crlf = raw.includes('\r\n')
  let s = crlf ? raw.replace(/\r\n/g, '\n') : raw
  const before = s

  if (s.includes('class="cta-offices"')) { changed.push([file, 'already done']); continue }

  if (file === 'home.body.html') {
    // 1. the standalone locations strip goes; the CTA band carries the offices.
    const cut = cutElement(s, /<div class="iv-locs" id="locs">/)
    if (!cut) { changed.push([file, 'NO CHANGE — .iv-locs not found']); continue }
    s = cut
    // 2. the lone button in the gold band becomes the two cards. Matched on the
    //    button itself, not on any comment above it, so this survives editing.
    const IV_CTA = /([ \t]*)<a class="btn btn-dark magnetic"[^>]*>[\s\S]*?<\/a>/
    if (!IV_CTA.test(s)) { changed.push([file, 'NO CHANGE — no .btn-dark in .iv-cta']); continue }
    s = s.replace(IV_CTA, (_m, indent) => block(indent.length, 'locs'))
  } else if (PK_CTA.test(s)) {
    s = s.replace(PK_CTA, (_m, indent) => block(indent.length))
  } else {
    continue
  }

  if (s === before) { changed.push([file, 'NO CHANGE — pattern did not match']); continue }
  if (s.includes('btn btn-dark magnetic')) { changed.push([file, 'NO CHANGE — a lone CTA button survived']); continue }
  changed.push([file, 'rewritten'])
  if (APPLY) fs.writeFileSync(full, crlf ? s.replace(/\n/g, '\r\n') : s)
}

for (const [f, what] of changed) console.log(`  ${f.padEnd(34)} ${what}`)
const rewritten = changed.filter(([, w]) => w === 'rewritten').length
const failed = changed.filter(([, w]) => w.startsWith('NO CHANGE')).length
console.log(`\n${rewritten} rewritten, ${failed} failed`)
if (failed) process.exit(1)
if (!APPLY) console.log('dry run — re-run with --apply')
