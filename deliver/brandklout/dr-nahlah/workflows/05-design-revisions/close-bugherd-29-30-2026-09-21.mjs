#!/usr/bin/env node
/**
 * close-bugherd-29-30-2026-09-21.mjs — close #29 and #30, the two 31 August
 * pins that had never been picked up by anyone.
 *
 *   node close-bugherd-29-30-2026-09-21.mjs            # plan
 *   node close-bugherd-29-30-2026-09-21.mjs --apply
 *
 * Both were fixed and published on 2026-09-21 and gated live by
 * `22-instatic-api-sync/verify-pin29-30.mjs`.
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

const PLAN = {
  29: { status: 'done', comment:
    'Done and live. All ten labels in "Ten things people come in with." are title case now — '
    + 'Loose Dentures, Bad Breath, Bleeding Gums, Cracked Teeth, Crooked Teeth, Gum Disease, '
    + 'A Gummy Smile, Missing or Failing Teeth, Toothache, Yellow or Discolored Teeth.\n\n'
    + 'Two small decisions worth stating, either of which we will reverse in a minute if you '
    + 'would rather:\n\n'
    + '1. The two "or"s are left lowercase, which is ordinary title case. Read absolutely '
    + 'literally, "capitalize all words" would give "Missing Or Failing Teeth" — say the word '
    + 'and it is a one-line change.\n'
    + '2. Only the accordion labels changed. The prose headings on that page ("Even the small '
    + 'things matter.", "Ten things people come in with.", "Where to go next.") are sentence '
    + 'case by design, across the whole site, so they were left alone. If you want those title '
    + 'case too it is a much larger change and a different decision, so it should be its own pin.\n\n'
    + 'Honest note on why this sat: this pin and #30 were filed on 31 August, three days after '
    + 'the last review round was worked through, and neither was ever picked up. That was our '
    + 'miss, not a disagreement.' },

  30: { status: 'done', comment:
    'Done and live, in every footer on the site.\n\n'
    + 'Half of it was already there — both new-patient numbers — but neither street address '
    + 'was, which is the half that matters for local search as much as for a reader. Each '
    + 'office is now a proper name/address/phone block:\n\n'
    + 'McLean\n7901 Jones Branch Drive, Suite 220\nMcLean, VA 22102\n(571) 702-9900\n\n'
    + 'Alexandria\n2855 Duke Street\nAlexandria, VA 22314\n(571) 253-7790\n\n'
    + 'The office name moved out of the link and into bold, which is the same shape the hours '
    + 'list directly above already uses, so the column reads as one thing. The addresses are '
    + 'taken from the contact pages rather than typed in, and the script refuses to run if they '
    + 'ever stop matching.\n\n'
    + 'This touched 37 pages plus the article template — the footer is a separate copy on every '
    + 'page on this platform, not one shared block — and was then checked on all 55 live pages '
    + 'and on an article. The eighteen ads landing pages already had both addresses in their own '
    + 'footer and were not changed.\n\n'
    + 'One thing to expect if you go and look: the Alexandria number renders as (571) 583-4820 '
    + 'in a browser rather than (571) 253-7790. That is your GHL call-tracking number pool '
    + 'swapping it at page load, which is what it is supposed to do — the page itself, and the '
    + 'number a search engine reads, is 253-7790. Worth someone checking why the pool covers '
    + 'Alexandria and not McLean, but that is a GHL setting, not a website one.\n\n'
    + 'Same honest note as #29: filed 31 August, never picked up until today. Our miss.' },
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
