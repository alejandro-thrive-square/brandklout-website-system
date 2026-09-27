#!/usr/bin/env node
/**
 * patch-facade-vimeo.mjs — teach the click-to-play facade in site.js to play a
 * Vimeo film as well as a YouTube one.
 *
 *   node patch-facade-vimeo.mjs            # plan (prints the diff)
 *   node patch-facade-vimeo.mjs --apply
 *
 * Both hosts have to keep working. The eight Wellness Hour films on
 * /video-library are third-party and stay on YouTube, so `data-yt` cannot just
 * be renamed away — the handler reads whichever attribute the card carries.
 *
 * Idempotent: if the Vimeo branch is already in the file it exits without
 * writing. `styleFile`-adjacent edits go through saveShell, which ships the
 * whole shell, so the read-modify-write must carry the seq it read at.
 */
import { getSite, saveShell, BASE } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const APPLY = process.argv.includes('--apply')
const PATH = 'src/scripts/site.js'

const EDITS = [
  { name: 'guard reads either attribute',
    from: "  if (!document.querySelector('.vl-card[data-yt]')) return;",
    to:   "  if (!document.querySelector('.vl-card[data-yt], .vl-card[data-vimeo]')) return;" },
  { name: 'cardOf accepts either attribute',
    from: "    return card && card.getAttribute('data-yt') ? card : null;",
    to:   "    return card && (card.getAttribute('data-yt') || card.getAttribute('data-vimeo')) ? card : null;" },
  { name: 'read both ids',
    from: "    var id = card.getAttribute('data-yt');",
    to:   "    var yt = card.getAttribute('data-yt');\n    var vimeo = card.getAttribute('data-vimeo');" },
  { name: 'build the right player src',
    from: "    f.src = 'https://www.youtube.com/embed/' + id + '?autoplay=1';",
    to:   "    f.src = vimeo\n      ? 'https://player.vimeo.com/video/' + vimeo + '?autoplay=1&badge=0&autopause=0'\n      : 'https://www.youtube.com/embed/' + yt + '?autoplay=1';" },
]

const site = await getSite()
const shell = site.site
const file = shell.files.find(f => f.path === PATH)
if (!file) { console.error('no ' + PATH + ' in the shell'); process.exit(2) }

console.log('BASE', BASE, '|', PATH, file.content.length + 'ch')

if (file.content.includes("player.vimeo.com/video/' + vimeo")) {
  console.log('already patched — nothing to do')
  process.exit(0)
}

let next = file.content
for (const e of EDITS) {
  const n = next.split(e.from).length - 1
  if (n !== 1) { console.error('FAIL "' + e.name + '": anchor matched ' + n + ' times, expected 1'); process.exit(1) }
  next = next.replace(e.from, e.to)
  console.log('  ok  ' + e.name)
}

console.log('\n--- before ---\n' + EDITS.map(e => e.from).join('\n'))
console.log('\n--- after ---\n' + EDITS.map(e => e.to).join('\n'))
console.log('\nlength ' + file.content.length + ' -> ' + next.length)

if (!APPLY) { console.log('\nplan only — pass --apply to write'); process.exit(0) }

file.content = next
const res = await saveShell(shell, site.seq)
console.log('\nsaved, seq ' + (res.seq ?? JSON.stringify(res).slice(0, 120)))

const after = await getSite()
const back = after.site.files.find(f => f.path === PATH)
const ok = back.content.includes("player.vimeo.com/video/' + vimeo")
  && back.content.includes("'.vl-card[data-yt], .vl-card[data-vimeo]'")
console.log('verified in draft: ' + ok)
if (!ok) process.exit(1)
