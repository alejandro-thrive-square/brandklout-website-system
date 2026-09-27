#!/usr/bin/env node
/**
 * close-bugherd-41-42-47-2026-09-21.mjs — close the three pins the client
 * unblocked on 2026-09-21: the veneers films (#41, #42) and the warranty terms
 * sheet (#47).
 *
 *   node close-bugherd-41-42-47-2026-09-21.mjs            # plan
 *   node close-bugherd-41-42-47-2026-09-21.mjs --apply
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

const VENEERS = 'Done and live. The films section is gone from both veneers consultation '
  + 'pages, and what replaced it is better than what was asked for.\n\n'
  + 'Rather than general practice testimonials, the section now carries the practice\u2019s own '
  + 'five-star Google reviews FROM VENEER PATIENTS \u2014 four of them, each one a review whose own '
  + 'text names veneer treatment:\n\n'
  + '\u2022 "I had veneers done 8 months ago and results have exceeded expectations coming for a '
  + 'perfectionist. Teeth designed in house with their team to with a natural appearance." '
  + '\u2014 Benjamin Sturms\n'
  + '\u2022 "He has completely improved my smile with 8 top veneers well beyond whatever I expected. '
  + 'My teeth look amazing and are a perfect match with my lower teeth!" \u2014 Angela Kelley\n'
  + '\u2022 "Had some porcelain veneers done and very pleased with the results. It\u2019s all been '
  + 'thorough and meticulous." \u2014 Daniel Bethea Jr\n'
  + '\u2022 "Today, I have a beautiful smile because of him. My veneers are perfect!" '
  + '\u2014 Patricia Araujo\n\n'
  + 'How they were found, since it is worth knowing: the review widget\u2019s page only serves eight '
  + 'reviews, and none of those eight mention veneers \u2014 which is why a veneers filter looks '
  + 'impossible at first. The widget\u2019s own data API serves all 319. We read the full set and '
  + 'filtered it, so the wall is a genuine treatment filter and not a hand-picked selection.\n\n'
  + 'They are rendered as native cards rather than as the vendor\u2019s embedded widget, for two '
  + 'reasons that are not going to change: the platform\u2019s security policy only permits YouTube '
  + 'iframes, so a third-party review widget cannot render on the published site at all; and '
  + 'inside an iframe those reviews count for the vendor\u2019s domain rather than for '
  + 'drnahlah.com. The cards are refreshed by re-running the generator.\n\n'
  + 'No review is edited or trimmed \u2014 each is printed whole, with its star rating, its date and '
  + 'its author, as Google has it.'

const PLAN = {
  41: { status: 'done', comment: VENEERS },
  42: { status: 'done', comment: VENEERS + '\n\nSame section as #41; both offices\u2019 veneers '
    + 'consultation pages carry it.' },

  47: { status: 'done', comment:
    'Done and live: www.drnahlah.com/five-year-warranty, linked from every claim that needed one.\n\n'
    + 'ELEVEN LINKS across nine pages: both dental implants pages (twice each, the body claim and '
    + 'the FAQ answer), both All-on-4 pages, all four thank-you pages, and /about. On the paid '
    + 'pages the link opens in a new tab deliberately, so a visitor who is part-way through the '
    + 'form does not lose it.\n\n'
    + 'WHAT THE PAGE SAYS, and where every line of it came from. We did not write a warranty. '
    + 'Every commitment on that page is one the practice already publishes somewhere on this site, '
    + 'and nothing is stated more confidently than its source states it:\n\n'
    + '\u2022 "Any part that fails inside five years is replaced free of charge" \u2014 /about\n'
    + '\u2022 "conditional on Precare: general cleanings every six months" \u2014 /all-on-4\n'
    + '\u2022 "5-Year warranty on implant procedures" \u2014 /dental-implants\n'
    + '\u2022 "Free second opinions" \u2014 /our-team\n\n'
    + 'The page sets out what is covered (implant work, cosmetic work, full arches), what '
    + '"replaced free of charge" means, the one condition, and how to claim \u2014 which is to call '
    + 'the office, because there is no form and no claims department.\n\n'
    + 'WHAT IT DELIBERATELY DOES NOT SAY, and this is the bit for Dr. Nahlah\u2019s team. There is no '
    + 'exclusion list, no transferability clause and no "what voids it", because the practice has '
    + 'not published any and a warranty is the one document where inventing a limitation is worse '
    + 'than omitting one \u2014 an invented exclusion takes away something a patient was promised. '
    + 'Where the page cannot answer, it says to call the office.\n\n'
    + 'So please do put it in front of the practice. If they want exclusions, a transfer rule, or '
    + 'anything else added or corrected, send the wording and it is a ten-minute change. As it '
    + 'stands the page commits them to exactly what the site already committed them to, and '
    + 'nothing more.' },
}

const argv = process.argv.slice(2)
const APPLY = argv.includes('--apply')

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
  const t = byLocal.get(pin)
  if (!t) { console.log('#' + pin + '  MISSING from tasks.json — skipped'); continue }
  const { status, comment } = PLAN[pin]
  console.log('#' + pin + '  id ' + t.id + '  ' + t.status + ' -> ' + status + '  comment ' + comment.length + ' chars')
  if (!APPLY) continue
  await call('POST', '/projects/' + project.id + '/tasks/' + t.id + '/comments.json', { comment: { text: comment } })
  if (t.status !== status) {
    await call('PUT', '/projects/' + project.id + '/tasks/' + t.id + '.json', { task: { status } })
  }
  console.log('      written')
}

console.log(APPLY ? '\ndone' : '\nplan only — pass --apply')
