#!/usr/bin/env node
/**
 * fix-proof-embed-note.mjs — correct the stale comment above
 * `.ch-proof .pf-embed` in site.css after the padding box moved into the Vimeo
 * snippet. Separate from fix-proof-embed-box.mjs only because the comment is
 * hard-wrapped and its anchor has to match the line breaks.
 *
 *   node fix-proof-embed-note.mjs [--apply]
 */
import { getSite, saveShell, BASE } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const APPLY = process.argv.includes('--apply')

const FROM = "   styled from here, so all this does is reserve the right box and keep the\n"
  + "   surrounding rhythm. The 16:9 padding box holds the shot's height before the\n"
  + "   frame loads, which is what stops the pinned chapter jumping. */"

const TO = "   styled from here, so all this does is reserve the right box and keep the\n"
  + "   surrounding rhythm. The Vimeo embed block supplies its OWN 16:9 padding\n"
  + "   box, and that is what holds the shot's height before the player loads and\n"
  + "   stops the pinned chapter jumping.\n"
  + "   Do NOT re-add padding-top here. Until 2026-09-21 this rule carried\n"
  + "   padding-top:56.25% for a bare YouTube <iframe>; with the snippet's wrapper\n"
  + "   inside it the box got reserved twice, .pf-embed measured 721px inside a\n"
  + "   480px .pf-shot (4/3, overflow:hidden), and the film was clipped to its top\n"
  + "   third under a black band. */"

const site = await getSite()
const shell = site.site
const css = shell.files.find(f => f.path === 'src/styles/site.css')
console.log('BASE', BASE)

if (css.content.includes('Do NOT re-add padding-top here')) {
  console.log('already corrected — nothing to do'); process.exit(0)
}
const hits = css.content.split(FROM).length - 1
console.log('anchor matches:', hits)
if (hits !== 1) { console.error('expected exactly 1'); process.exit(1) }

css.content = css.content.replace(FROM, TO)
console.log('\n' + TO)

if (!APPLY) { console.log('\nplan only — pass --apply'); process.exit(0) }
const res = await saveShell(shell, site.seq)
console.log('\nsaved, seq ' + (res.seq ?? ''))
const after = await getSite()
const ok = after.site.files.find(f => f.path === 'src/styles/site.css').content.includes('Do NOT re-add padding-top here')
console.log('verified: ' + ok)
if (!ok) process.exit(1)
