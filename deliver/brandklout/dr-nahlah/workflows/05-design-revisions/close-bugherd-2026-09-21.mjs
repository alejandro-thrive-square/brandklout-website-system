#!/usr/bin/env node
/**
 * close-bugherd.mjs — post the outcome of the 2026-09-21 run to the Dr Nahlah
 * board: a comment on every pin this session touched, and `done` on the eleven
 * that shipped. The blockers keep their status and get the reason instead.
 *
 *   node close-bugherd.mjs            # plan
 *   node close-bugherd.mjs --apply
 *   node close-bugherd.mjs --apply --only 33
 *
 * The status flip is PUT /projects/:p/tasks/:id.json {"task":{"status":"..."}}.
 * `id` is the INTERNAL id, not the local_task_id the board shows; tasks.json
 * from pull-bugherd.mjs carries both, so the mapping comes from there.
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

const SHA = 'f1196277'
const LIVE = 'Fixed and live on www.drnahlah.com (and on staging). Commit ' + SHA + '; details in the 2026-09-21 runbook.'

/** pin -> { comment, status? }. No status means the pin stays where it is. */
const PLAN = {
  // ---- shipped, closing ----
  33: { status: 'done', comment: 'Removed. The hero note is now just "Serving <city> and Northern Virginia" on all three campaigns, both offices. ' + LIVE },

  35: { status: 'done', comment: 'Copy replaced with your wording, on both All-on-4 pages. ' + LIVE },

  36: { status: 'done', comment: 'Deck replaced with your wording: "Every post lands at an exact angle, depth and position, so the arch above it loads evenly, every time." ' + LIVE },

  37: { status: 'done', comment: 'Fixed \u2014 and it was not the grid. The cards are equal-height grid items; what you screenshotted was the scroll reveal caught part-way through. Each card is tweened up 30px with a 0.09s delay between them, so for about a second the four bordered boxes sit on a staircase. A row of cards now reveals as one block instead of staggering. Same cause as #38. ' + LIVE },

  38: { status: 'done', comment: 'Same cause and same fix as #37 \u2014 the staggered scroll reveal, not the layout. The card row now lands as one block. ' + LIVE },

  40: { status: 'done', comment: 'Removed. The section CTA is now the button on its own, on all three campaigns. ' + LIVE },

  43: { status: 'done', comment: 'Section removed from all three thank-you pages (All-on-4, implants, veneers \u2014 both offices, so six pages). The line above it that read "and why acting now matters" is gone too, and the column that was left over has been rebuilt as a three-across row so the band is not half empty. ' + LIVE },

  44: { status: 'done', comment: 'Fixed. The Nobel Biocare line is now conditional on the campaign and appears only on the six All-on-4 pages. We also checked the implants and veneers pages: they never use the term "All-on-4" anywhere, so you were right that it did not belong on them. ' + LIVE },

  45: { status: 'done', comment: 'All fixed. The two All-on-4 consultation titles lost the doubled city. The four Open Graph titles now follow your recommended format, e.g. "Dental Implants | Dr. Nahlah | Alexandria, VA". The six thank-you descriptions lost the office name they were already carrying mid-sentence. The two veneers consultation titles gained a missing comma. ' + LIVE },

  46: { status: 'done', comment: 'Both replaced with your recommended text, Alexandria and Tysons Corner. ' + LIVE },

  48: { status: 'done', comment: 'Reworded across all six veneers pages and their metadata. The H1 is now "See your smile designed before any enamel is touched". Every "Digital Smile Design preview of the result" is now just a Digital Smile Design. "You approve the result" is now "you approve the design". And the closing section says outright that it is a proposal, not a promise of the finished porcelain. ' + LIVE },

  // ---- answered / partial / blocked, staying open ----
  39: { comment: 'Yes, it is validated. The sentence is taken from the All-on-4 FAQ on the live site (/all-on-4): "Nitrous oxide, oral sedation and IV sedation. Oral and IV are administered by a medical anaesthesiologist and need transport arranged both ways." /sedation-dentistry backs it as well.\n\nOne wrinkle for your call, which we have NOT changed: /all-on-4 says oral sedation is "administered by" a medical anaesthesiologist, while /sedation-dentistry says "under the supervision of". Both are already live. The ads page mirrors the stronger of the two. If you would rather paid traffic saw the softer phrasing, it is a one-word change \u2014 just say so.' },

  47: { comment: 'Partly done, and the rest needs the practice.\n\nThere is no warranty terms sheet anywhere on the site to link to, and we are not going to write one out of marketing copy. What we have done instead: every mention of the five-year warranty on the paid pages now carries the one condition the All-on-4 pages already publish \u2014 "conditional on the Precare cleanings every six months". That is six mentions across the implants and All-on-4 pages, the hero stat included.\n\nTo finish this properly we need the actual warranty document from the practice: what is covered, what voids it, and who it applies to. Once we have that it is one terms page plus six links. ' + LIVE },

  32: { comment: 'This one is not on the page. Both the Continue step and the "Preferred Method of Contact" field belong to the LeadConnector form itself \u2014 the landing page only embeds it (form id 8jq7yzSeCzZrIkuA3sSG for Alexandria All-on-4). Removing them means editing the form in GHL; nothing on the website side can change it.\n\nWorth doing in the same GHL visit as the still-outstanding work of pointing each of the six forms at its own thank-you page.' },

  34: { comment: 'Technically yes, but it is not a one-off and it is not free.\n\nThat hero film is the page\u2019s only real YouTube iframe, and it is what makes the platform open its content-security policy for the click-to-play players further down the page. Swapping it for Vimeo means also adding player.vimeo.com to the site\u2019s allowed embed origins, and re-uploading the film.\n\nSo it is worth doing \u2014 but as a decision about the whole film library (fourteen clips) rather than this one hero. Tell us if you want that scheduled and we will do the lot at once.' },

  41: { comment: 'We cannot do this yet: there is no veneer patient film in the library.\n\nThe practice has fourteen films. Six are its own patients, filmed at the practice. The other eight feature a generic stock presenter who is not Dr. Nahlah \u2014 and all three cosmetic titles (Seven Steps of Veneers, Smile Makeovers, Fixing Grey Lines) are in that eight. Putting a stock presenter on a paid page is not something we are willing to do.\n\nSo this needs one filmed veneer patient from the practice. It has been on the outstanding-assets list since 18 September. Same blocker as #42.' },

  42: { comment: 'Same blocker as #41: there is no veneer patient film. The only cosmetic clips in the library feature a generic stock presenter rather than Dr. Nahlah, and we will not put one on a paid page. This needs one filmed veneer patient from the practice.' },
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

console.log('project ' + project.id + ' \u2014 ' + project.name + '   ' + (APPLY ? 'APPLY' : 'PLAN ONLY') + '\n')

for (const pin of Object.keys(PLAN).sort((a, b) => a - b)) {
  if (ONLY && !ONLY.includes(pin)) continue
  const t = byLocal.get(pin)
  if (!t) { console.log('#' + pin + '  MISSING from tasks.json \u2014 skipped'); continue }
  const { status, comment } = PLAN[pin]
  const move = status && t.status !== status ? t.status + ' -> ' + status : t.status + ' (unchanged)'
  console.log('#' + pin.padEnd(3) + ' id ' + t.id + '  ' + move + '  comment ' + comment.length + ' chars')
  if (!APPLY) { console.log('      ' + comment.split('\n')[0].slice(0, 100) + '...'); continue }
  await call('POST', '/projects/' + project.id + '/tasks/' + t.id + '/comments.json', { comment: { text: comment } })
  if (status && t.status !== status) {
    await call('PUT', '/projects/' + project.id + '/tasks/' + t.id + '.json', { task: { status } })
  }
  console.log('      written')
}

console.log(APPLY ? '\ndone' : '\nplan only \u2014 pass --apply')
