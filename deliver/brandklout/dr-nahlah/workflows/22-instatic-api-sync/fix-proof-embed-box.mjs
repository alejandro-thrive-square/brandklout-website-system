#!/usr/bin/env node
/**
 * fix-proof-embed-box.mjs — stop the home page story film being clipped.
 *
 *   node fix-proof-embed-box.mjs           # plan
 *   node fix-proof-embed-box.mjs --apply
 *
 * `.ch-proof .pf-embed` carried `padding-top:56.25%` to reserve a 16:9 box for
 * a BARE YouTube <iframe> — the comment in site.css says so: it "holds the
 * shot's height before the frame loads, which is what stops the pinned chapter
 * jumping".
 *
 * The Vimeo embed block brings its own `padding:56.25% 0 0 0` wrapper, so after
 * the 2026-09-21 host swap the box was reserved TWICE: `.pf-embed` measured
 * 721px inside a `.pf-shot` that is 480px tall with `overflow:hidden`, and the
 * film — pushed 361px down by the outer padding — was clipped to its top third
 * under a black band.
 *
 * The fix is to drop the outer reservation and let the snippet's own wrapper be
 * the aspect box. `.ch-proof .pf-embed iframe` stays absolute/inset:0 and now
 * resolves against that wrapper, which is `position:relative`, so the geometry
 * comes out identical to the pre-swap YouTube layout: 641x360 centred in the
 * 480px slot. The anti-jump guarantee survives — the wrapper reserves the
 * height before the player loads exactly as the padding box did.
 *
 * The declaration lives in THREE places, so all three move together or a stale
 * value resurfaces the next time scoping changes:
 *   - src/styles/site.css        (code asset; served after the registry, wins)
 *   - the `.ch-proof .pf-embed` registry styleRule
 *   - src/styles/runtime-states.css sets no padding-top; left alone
 */
import { getSite, saveShell, BASE } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const APPLY = process.argv.includes('--apply')

const CSS_FROM = '.ch-proof .pf-embed{position:relative;padding-top:56.25%;overflow:hidden}'
const CSS_TO   = '.ch-proof .pf-embed{position:relative;overflow:hidden}'
const NOTE_FROM = 'The story shot is a filmed testimonial on YouTube.'
const NOTE_TO   = 'The story shot is a filmed testimonial on Vimeo (moved off YouTube 2026-09-21).'
const NOTE2_FROM = 'The 16:9 padding box holds the shot\'s height before the frame loads, which is what stops the pinned chapter jumping.'
const NOTE2_TO   = 'The Vimeo embed block supplies its own 16:9 padding box, which holds the shot\'s height before the player loads and is what stops the pinned chapter jumping. Do NOT re-add padding-top here: the box would be reserved twice and .pf-shot (4/3, overflow:hidden) would clip the film to its top third.'

const site = await getSite()
const shell = site.site
console.log('BASE', BASE)

const css = shell.files.find(f => f.path === 'src/styles/site.css')
if (!css) { console.error('no src/styles/site.css'); process.exit(2) }

const rule = Object.values(shell.styleRules || {}).find(r => r.selector === '.ch-proof .pf-embed')
if (!rule) { console.error('no .ch-proof .pf-embed registry rule'); process.exit(2) }

const cssHits = css.content.split(CSS_FROM).length - 1
console.log('\nsite.css anchor matches:', cssHits)
console.log('registry paddingTop currently:', JSON.stringify(rule.styles.paddingTop))

if (cssHits === 0 && rule.styles.paddingTop === undefined) {
  console.log('already fixed — nothing to do'); process.exit(0)
}
if (cssHits !== 1) { console.error('expected exactly 1 css anchor'); process.exit(1) }

let next = css.content.replace(CSS_FROM, CSS_TO)
for (const [from, to] of [[NOTE_FROM, NOTE_TO], [NOTE2_FROM, NOTE2_TO]]) {
  if (next.includes(from)) { next = next.replace(from, to); console.log('  comment updated') }
  else console.log('  NOTE anchor not found (comment left as-is)')
}

console.log('\n- ' + CSS_FROM)
console.log('+ ' + CSS_TO)
console.log('\nregistry .ch-proof .pf-embed: paddingTop ' + JSON.stringify(rule.styles.paddingTop) + ' -> removed')

if (!APPLY) { console.log('\nplan only — pass --apply'); process.exit(0) }

css.content = next
delete rule.styles.paddingTop

const res = await saveShell(shell, site.seq)
console.log('\nsaved, seq ' + (res.seq ?? JSON.stringify(res).slice(0, 120)))

const after = await getSite()
const css2 = after.site.files.find(f => f.path === 'src/styles/site.css')
const rule2 = Object.values(after.site.styleRules || {}).find(r => r.selector === '.ch-proof .pf-embed')
const ok = css2.content.includes(CSS_TO) && !css2.content.includes(CSS_FROM)
  && rule2.styles.paddingTop === undefined
  && rule2.styles.display === 'grid' && rule2.styles.overflow === 'hidden'
console.log('verified in draft: ' + ok
  + ' | registry keeps display:' + rule2.styles.display + ' placeItems:' + rule2.styles.placeItems)
if (!ok) process.exit(1)
