/**
 * resolve.mjs — reply on every round-1 BugHerd task (project 542527) and move the verified ones to done.
 * Each reply says what changed and its scope (deliver/docs/BUGHERD.md). Verified 2026-10-01 on the published
 * staging home (seq 12) at 1512x735: verify-r1.mjs, probe-reviews.mjs, WebKit film check, GHL form read.
 *
 *   node resolve.mjs            dry run: prints every reply and status change
 *   node resolve.mjs --apply    posts the comments and sets the statuses
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const env = fs.readFileSync(path.resolve(HERE, '../../../../../../../.env'), 'utf8')
const KEY = (env.match(/^BUGHERD=(.*)$/m) || [])[1]?.trim().replace(/^["']|["']$/g, '')
const AUTH = 'Basic ' + Buffer.from(KEY + ':x').toString('base64')
const PROJECT = 542527
const APPLY = process.argv.includes('--apply')
const tasks = JSON.parse(fs.readFileSync(path.join(HERE, '2026-10-01/tasks.json'), 'utf8'))

const HOME = 'Scope: the home page (this element exists only there).'
const SITE = 'Scope: site-wide; the same rule holds on all 57 staging pages.'
const R = {
  1: ['done', `The custom cursor (the gold dot and its label) is removed completely. ${SITE}`],
  31: ['done', `The cursor's PLAY bubble is gone with the custom cursor; the films keep their own play button. ${SITE}`],
  2: ['done', `"Fig." labels removed. ${SITE}`],
  8: ['done', `"Fig. 01" removed from the caption. ${HOME}`],
  17: ['done', `"Fig. 03" removed from the caption. ${HOME}`],
  5: ['done', `The frame, coordinates and numbers around the hero film are removed. ${HOME}`],
  6: ['done', `The chapter rail (numbers and lines down the side) is removed. ${SITE}`],
  34: ['done', `The numbers on the right (the chapter rail) are removed. ${SITE}`],
  ...Object.fromEntries([3, 10, 16, 21, 23, 29, 35].map((n) => [n, ['done', `Chapter numbers removed from every section label; the label now reads the chapter name only. ${SITE}`]])),
  7: ['done', `Now reads "Who is actually designing your new smile?" ${HOME}`],
  28: ['done', `Now reads "...a results-based warranty on qualifying surgical, cosmetic, and restorative treatment." ${HOME}`],
  30: ['done', `Heading now "Brighter smiles and brighter days." ${HOME}`],
  36: ['done', `Heading now "Start with a free, no-obligation consultation." ${HOME}`],
  37: ['done', `Paragraph replaced word for word with your text. ${HOME}`],
  4: ['done', `The film now starts as soon as it is visible: it retries on load, at the end of the entrance, on the first scroll or tap, and whenever it comes back on screen. Checked in WebKit at 1512x735 (playing from 1.5 s, no scroll). Please re-check in your Safari; if it still waits, Low Power Mode or the site's "Never Auto-Play" Safari setting will hold any video. ${HOME}`],
  9: ['done', `This section now advances in one screen of scrolling (it was 2.4). ${HOME}`],
  11: ['done', `Re-laid out: the open panel gives the text card its own column and the photo starts where the card ends, cropped on her face. ${HOME}`],
  14: ['done', `The card no longer sits over her face: it has its own column, and a closed panel keeps only a slim title bar below the chin. Below 1280 px the two disciplines become two cards, photo above text. ${HOME}`],
  15: ['done', `Face no longer cut off: new layout (see the reply on the panel above) with each crop centred on the face. ${HOME}`],
  12: ['done', `Now "Discipline 1". ${HOME}`],
  13: ['done', `Now "Discipline 2". ${HOME}`],
  18: ['done', `The three steps are now clickable: a click moves the scene to that step. ${HOME}`],
  19: ['done', `At "Drag to compare" the whole design now shows (all guide lines and labels stay on), and dragging walks through steps 1 to 3 on the left. ${HOME}`],
  20: ['done', `Portrait moved so both ears are in frame. ${HOME}`],
  22: ['done', `The memberships marquee stops on hover and on keyboard focus. Scope: site-wide: the marquee stops on hover wherever it appears (home, Meet Dr. Bensoussan); nothing else on the site moves on its own, every other moving section moves only while you scroll, and the review widget does not auto-rotate.`],
  24: ['done', `Replaced with DSC_3137 from the Drive. ${HOME}`],
  25: ['done', `Replaced with DSC_3102. ${HOME}`],
  26: ['done', `Replaced with DSC_3084. ${HOME}`],
  27: ['done', `Replaced with "Using technology to create smiles", shown whole (it is a square collage). ${HOME}`],
  32: ['done', `Each card now shows the name, then the patient's original issue, then the procedure (e.g. Helen: failed implants, years of struggling to eat; All-on-X full-arch implants). The issues come from each patient's own words in their film. ${HOME}`],
  33: ['todo', `Update: since 2026-09-30 this is no longer our rotator but the live Google reviews (Elfsight, 5.0 / 96, real reviews instead of three fixed quotes). It has arrows and dots, and it does not move on its own, so nothing needs stopping on hover. Auto-rotate is a setting on the Elfsight widget (its autoplay pauses on hover); left open for a decision on whether to switch it on.`],
  39: ['done', `The three logos link to the payment options page, in three equal boxes, each logo sized to read the same (Alphaeon is no longer small). Scope: the consultation section, which is on every page: all 57 pages.`],
  40: ['done', `"Submission in progress" was GoHighLevel's save-and-exit option on the form. It is now off on form cxtQ5q29TfUr3cYlMmDB (read from the form's settings today). Scope: the form, on all 57 pages.`],
  41: ['done', `Footer now has Facebook and Instagram, the address with a directions link, the phone, hours (Monday to Thursday, 7:00 AM to 4:00 PM; Friday to Sunday closed) and languages (English, French and Dutch). Please confirm the closed days and whether the office speaks other languages. Scope: the footer, on all 57 pages.`],
  42: ['done', `FAQ added before the footer with your seven questions; answers use only the practice's own information (no prices). The new service pages carry their own FAQs too. Please have the practice approve the answers, especially sedation and cost. ${HOME}`],
  38: ['todo', `This is a field in the GoHighLevel form itself (cxtQ5q29TfUr3cYlMmDB), which today has first name, last name, phone and email only. It needs a "procedure interested in" dropdown added in GoHighLevel (e.g. smile makeover, dental implants, Teeth in a Day, second opinion); the site will show it automatically on every page. Left open until it is added in GoHighLevel.`],
}

async function call(method, url, body) {
  for (let i = 0; i < 5; i++) {
    const r = await fetch(`https://www.bugherd.com/api_v2${url}`, { method, headers: { Authorization: AUTH, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
    if (r.status === 429) { await new Promise((s) => setTimeout(s, 2000 * (i + 1))); continue }
    if (!r.ok) throw new Error(`${r.status} ${method} ${url}: ${(await r.text()).slice(0, 200)}`)
    return r.json().catch(() => ({}))
  }
  throw new Error('rate limited')
}

const missing = tasks.filter((t) => !R[t.local]).map((t) => t.local)
if (missing.length) throw new Error('no reply written for #' + missing.join(', #'))
let done = 0, kept = 0
for (const t of tasks.sort((a, b) => a.local - b.local)) {
  const [status, text] = R[t.local]
  console.log(`#${t.local} -> ${status}\n   ${text}`)
  if (APPLY) {
    await call('POST', `/projects/${PROJECT}/tasks/${t.id}/comments.json`, { comment: { text } })
    if (status !== t.status) await call('PUT', `/projects/${PROJECT}/tasks/${t.id}.json`, { task: { status } })
  }
  status === 'done' ? done++ : kept++
}
console.log(`\n${tasks.length} tasks: ${done} to done, ${kept} left open with a reply${APPLY ? ' (APPLIED)' : ' (dry run)'}`)
