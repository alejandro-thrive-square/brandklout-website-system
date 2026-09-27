#!/usr/bin/env node
/**
 * close-bugherd-august-backlog-2026-09-21.mjs — close the ten pins from the
 * 27–28 August review rounds that were fixed, published and verified live at
 * the time but never written back to the board.
 *
 *   node close-bugherd-august-backlog-2026-09-21.mjs            # plan
 *   node close-bugherd-august-backlog-2026-09-21.mjs --apply
 *   node close-bugherd-august-backlog-2026-09-21.mjs --apply --only 13,14
 *
 * Why they were open: sessions 19/20/21 treated BugHerd as read-only input and
 * said so in the runbook ("The BugHerd board was NOT touched — the pins are
 * still open there for whoever normally closes them"). Nobody did. Every claim
 * below was re-verified against the LIVE site on 2026-09-21 before this ran.
 *
 * Same mechanics as close-bugherd-2026-09-21.mjs: comment by INTERNAL id, then
 * PUT the status. #21/#22/#23 move from `doing`, the rest from `todo`.
 */
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'

const ROOT = 'C:/Users/ACER/orca/workspaces/Brandklout Website System/bk-dr-nahlah'
const TASKS = join(ROOT, 'deliver/brandklout/dr-nahlah/workflows/05-design-revisions/.tmp/bugherd/tasks.json')

function loadEnv (start) {
  let dir = start
  for (let i = 0; i < 8; i++) {
    const c = join(dir, '.env')
    if (existsSync(c)) {
      for (const line of readFileSync(c, 'utf8').split(/\r?\n/)) {
        const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line)
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
      }
      return
    }
    const up = dirname(dir); if (up === dir) break; dir = up
  }
}
loadEnv(join(ROOT, 'deliver/brandklout/dr-nahlah/workflows/05-design-revisions'))

const KEY = process.env.BUGHERD
if (!KEY) { console.error('BUGHERD not set'); process.exit(1) }
const AUTH = 'Basic ' + Buffer.from(KEY + ':x').toString('base64')
const API = 'https://www.bugherd.com/api_v2'

// The three publishes that carried this work, quoted verbatim in the comments.
const S19 = '27 August 13:25 UTC'
const S20 = '27 August 14:04 UTC'
const S21 = '28 August 05:21 UTC'

const LATE = '\n\nApologies for the late close: the fix shipped on the date above, '
  + 'but the board was not being written back to at the time. It is now — this and '
  + 'the other nine August pins were all re-checked against the live site today '
  + 'before being marked done.'

const PLAN = {
  13: { status: 'done', comment:
    'Fixed and live since ' + S20 + ', in two passes.\n\n'
    + 'The first pass moved the crop to the top of the frame (object-position 50% 0%), '
    + 'which kept her face in shot at 1440 but could not stop the photograph being '
    + 'magnified on a larger display — at 2560 only 36% of the source height was still '
    + 'visible. Your follow-up comment was the more precise diagnosis, so the second pass '
    + 'capped the band itself: max-width 120rem, centred, filling the full screen width '
    + 'below that. It holds the frame at roughly the 1440 proportion the design was drawn '
    + 'at however large the display gets, and it was applied to all five pages that use '
    + 'the band, which is what "across the site" asked for.\n\n'
    + 'Verified in the published stylesheet today: .mband { max-width:120rem; margin-inline:auto }.' + LATE },

  14: { status: 'done', comment:
    'Added and live since ' + S21 + '. The review widget is on /patient-stories, '
    + 'directly under the paragraph that claims 4.9 out of 5 — the widget is the evidence '
    + 'for that claim, so it sits with it. It is copied from the home page\u2019s embed at run '
    + 'time rather than pasted in as a second copy, so the two can never drift apart.\n\n'
    + 'One thing worth knowing if you ever screenshot it with a tool rather than a browser: '
    + 'the vendor renders the widget client-side from reputationhub.site, so it photographs '
    + 'as an empty white box in automated capture. Exactly the same is true of the home page '
    + 'instance you already approved. In a real browser both paint normally.' + LATE },

  21: { status: 'done', comment:
    'Replaced and live since ' + S19 + '. Card 02 "Intraoral scanner" was holding a '
    + 'stereo microscope. It now carries a licensed photograph of a scanner wand actually '
    + 'in the mouth.\n\n'
    + 'Timing note, because it explains the silence: this went live at 13:25 and your '
    + '"can you attach the correct photo here please?" comment was written at 13:21. The '
    + 'replacement was already on its way out when you wrote it — you were looking at the '
    + 'pre-publish page.\n\n'
    + 'It also cleared a repeat nothing else would have caught: card 04 "In-house digital lab" '
    + 'held the same photograph as this card at a different crop and a different byte count, '
    + 'so the duplicate-image sweep could not see it.' + LATE },

  22: { status: 'done', comment:
    'Replaced and live since ' + S19 + '. Card 03 "Guided implant surgery" was holding '
    + 'a consultation photo — a dentist pointing at a tooth model — which is not guided '
    + 'surgery. It now carries two gowned clinicians placing an implant with the CBCT scan '
    + 'on the monitor behind them, which is the card\u2019s own sentence in one frame.\n\n'
    + 'For the record, the most literal search result was rejected deliberately: an implant '
    + 'driven through a surgical template. Accurate, and it reads as raw anatomy on a page a '
    + 'nervous patient is browsing.\n\n'
    + 'Same timing as #21 — live at 13:25, your comment written at 13:21.' + LATE },

  23: { status: 'done', comment:
    'Replaced and live since ' + S19 + '. Card 06 "Zirconia & porcelain oven" was '
    + 'holding a crown on a model rather than an oven. It now carries a technician placing '
    + 'a crown into the furnace with tweezers — the card\u2019s actual subject.\n\n'
    + 'Same timing as #21 and #22 — live at 13:25, your comment written at 13:23.' + LATE },

  24: { status: 'done', comment:
    'Done and live since ' + S20 + '. Card 05 "Milling machine" was a licensed stock '
    + 'model who read as a member of staff. It now holds a composite built through the '
    + 'Magnific API as you asked: the same laboratory, the same body, with Dr. Nahlah\u2019s '
    + 'face from his own headshot.\n\n'
    + 'We raised the question once at the time — a synthetic photograph of a real, named '
    + 'clinician on a medical site — and you confirmed the call. Recording it here so the '
    + 'decision is on the pin and not only in a chat.' + LATE },

  25: { status: 'done', comment:
    'Fixed and live since ' + S20 + '. The CTA heading on /smile-makeover was '
    + 'orphaning its last word ("See it before you commit to / it."). The heading now uses '
    + 'text-wrap: balance, which lets the browser even the lines out itself rather than '
    + 'breaking at a width we guessed — "See it before you / commit to it." at 1440, and it '
    + 'stays symmetrical at 1024 and below too.\n\n'
    + 'Verified in the published stylesheet today: .pk-cta h2 carries text-wrap: balance.' + LATE },

  26: { status: 'done', comment:
    'Fixed and live since ' + S21 + '. Worth saying what was actually wrong, because '
    + 'it was not what it looked like.\n\n'
    + 'The topics and the filter both existed. The dropdown prunes itself against the topics '
    + 'the article cards actually carry, and every published card was carrying an empty topic, '
    + 'so it pruned every option away and left you the single "All topics" you saw. The topics '
    + 'had been written to the draft rows only — publishing the site does not publish post '
    + 'rows, they are a separate step that had never been run.\n\n'
    + 'Live now, verified today: Implants 16, Aftercare 11, All-on-4 8, Dentures 3, '
    + 'Technology 3, Cost 1, Veneers 1.' + LATE },

  27: { status: 'done', comment:
    'Done and live since ' + S21 + '. It was worse than the pin said: across 43 '
    + 'articles there were only 22 distinct pictures — patient_hero.jpg and pt-hero-4.jpg '
    + 'were each on four articles. (Identity was settled by hashing the actual image bytes, '
    + 'not by asset name, which is why the earlier sweep missed them.)\n\n'
    + 'All 21 redundant images were re-shot from Freepik against each article\u2019s curated '
    + 'topic phrase rather than its title, and every candidate was scored before it could be '
    + 'chosen: it has to read as dentistry, it gains points for the topic\u2019s own vocabulary, '
    + 'and it is rejected outright on children, surgical fields, blood, braces or render '
    + 'language. No page repeats an image now.' + LATE },

  28: { status: 'done', comment:
    'Fixed and live since ' + S21 + ', and it needed a different picture rather than '
    + 'a crop.\n\n'
    + 'The frame there is 4:5 portrait, drawn for a 4:5 portrait of Dr. Nahlah. A '
    + 'de-duplication pass had swapped in a landscape photograph of him with Yolanda, '
    + '1.5:1 — 46% of that frame was being thrown away, his arm off one side and her '
    + 'shoulder off the other. No amount of repositioning fixes that; half the picture has '
    + 'nowhere to go. The 4:5 portrait is back in the 4:5 frame, so there is no crop at all.\n\n'
    + 'This did not undo the no-repeated-images rule — that rule is per page, and the home '
    + 'page carries this portrait nowhere else. The photograph with Yolanda stays on /about '
    + 'and /implant-supported-dentures.' + LATE },
}

const argv = process.argv.slice(2)
const APPLY = argv.includes('--apply')
const ONLY = argv.includes('--only') ? argv[argv.indexOf('--only') + 1].split(',') : null

const { project, tasks } = JSON.parse(readFileSync(TASKS, 'utf8'))
const byLocal = new Map(tasks.map(t => [String(t.local_task_id), t]))

async function call (method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  if (!res.ok) throw new Error(method + ' ' + path + ' -> ' + res.status + ' ' + text.slice(0, 300))
  return text ? JSON.parse(text) : null
}

console.log('project ' + project.id + ' — ' + project.name + '   ' + (APPLY ? 'APPLY' : 'PLAN ONLY') + '\n')

for (const pin of Object.keys(PLAN).sort((a, b) => a - b)) {
  if (ONLY && !ONLY.includes(pin)) continue
  const t = byLocal.get(pin)
  if (!t) { console.log('#' + pin + '  MISSING from tasks.json — skipped'); continue }
  const { status, comment } = PLAN[pin]
  const move = status && t.status !== status ? t.status + ' -> ' + status : t.status + ' (unchanged)'
  console.log('#' + pin.padEnd(3) + ' id ' + t.id + '  ' + move + '  comment ' + comment.length + ' chars')
  if (!APPLY) { console.log('      ' + comment.split('\n')[0].slice(0, 110) + '...'); continue }
  await call('POST', '/projects/' + project.id + '/tasks/' + t.id + '/comments.json', { comment: { text: comment } })
  if (status && t.status !== status) {
    await call('PUT', '/projects/' + project.id + '/tasks/' + t.id + '.json', { task: { status } })
  }
  console.log('      written')
}

console.log(APPLY ? '\ndone' : '\nplan only — pass --apply')
