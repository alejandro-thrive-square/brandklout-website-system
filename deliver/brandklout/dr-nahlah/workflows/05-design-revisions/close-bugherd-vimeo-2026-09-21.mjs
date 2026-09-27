#!/usr/bin/env node
/**
 * close-bugherd-vimeo-2026-09-21.mjs — close the two Vimeo pins after the
 * site-wide YouTube -> Vimeo swap, and answer the two that only look like
 * Vimeo pins.
 *
 *   node close-bugherd-vimeo-2026-09-21.mjs            # plan
 *   node close-bugherd-vimeo-2026-09-21.mjs --apply
 *
 * Same mechanics as close-bugherd-2026-09-21.mjs: comment by INTERNAL id, then
 * PUT the status. #41 and #42 keep their status deliberately — they ask for a
 * veneers film, which the host swap does not give them.
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

const SHA = '15b4c882'
const TAIL = ' Live on www.drnahlah.com and on staging. Commit ' + SHA
  + '; details in the 2026-09-21 runbook.'

const PLAN = {
  31: { status: 'done', comment:
    'Done \u2014 and not just this one. Every practice-owned film on the site is now served from '
    + 'the Brandklout Vimeo library instead of YouTube: 108 embeds across 15 pages (the home page, '
    + 'patient stories, the video library and all eighteen ads landing pages). This pin\u2019s film, '
    + 'Melanie\u2019s story, is a Vimeo player now. The click-to-play cards carry Vimeo thumbnails too, '
    + 'so the pages no longer call YouTube at all on load.' + TAIL },

  34: { status: 'done', comment:
    'Yes \u2014 it was already on Vimeo, and now the page uses it. The twelve practice-owned films '
    + 'were uploaded to the Dr. Nahlah folder back on 29 August; what was missing was the site '
    + 'pointing at them. This hero film (Restore Your Bad or Missing Teeth in One Day) and every '
    + 'other owned film across the site now play from Vimeo. All fourteen films in that folder also '
    + 'got their full descriptions written for SEO.\n\n'
    + 'One exception worth flagging: the eight THE WELLNESS HOUR clips in the video library stay on '
    + 'YouTube. They are third-party syndicated videos licensed for embedding, not the practice\u2019s '
    + 'own footage, so re-hosting them on your Vimeo is a rights question we will not answer on our '
    + 'own. The video library is intentionally mixed-host until someone confirms redistribution '
    + 'rights or they are replaced with practice footage.' + TAIL },

  // Not Vimeo pins. Status deliberately unchanged.
  41: { comment:
    'Not addressed by the Vimeo swap, so leaving this open. The film on this page is now a Vimeo '
    + 'player rather than a YouTube one, but it is still Yolanda\u2019s implant story \u2014 the host '
    + 'changed, the content did not. There is still no veneer patient film anywhere in the library; '
    + 'the only cosmetic clips feature a generic stock presenter rather than Dr. Nahlah, and we will '
    + 'not put one of those on a paid page. This needs one filmed veneer patient from the practice.' },

  42: { comment:
    'Same as #41 \u2014 still open, and for the same reason. The embed is Vimeo now, but the film is '
    + 'still an implant story on a veneers page. It needs a filmed veneer patient; nothing in the '
    + 'current library can stand in.' },
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
  if (!APPLY) { console.log('      ' + comment.split('\n')[0].slice(0, 110) + '...'); continue }
  await call('POST', '/projects/' + project.id + '/tasks/' + t.id + '/comments.json', { comment: { text: comment } })
  if (status && t.status !== status) {
    await call('PUT', '/projects/' + project.id + '/tasks/' + t.id + '.json', { task: { status } })
  }
  console.log('      written')
}

console.log(APPLY ? '\ndone' : '\nplan only \u2014 pass --apply')
