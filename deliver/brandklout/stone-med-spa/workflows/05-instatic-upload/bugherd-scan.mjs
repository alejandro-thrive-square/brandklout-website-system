// BugHerd project 540569: every open task in full, and any task with a comment since a date.
//   node bugherd-scan.mjs [since ISO date]   (run from this folder; reads the worktree .env)
// Comments are fetched per task: the list endpoint hides page and selector.
import fs from 'node:fs'
import path from 'node:path'
const SINCE = process.argv[2] || '2026-09-29T12:00:00Z'
const env = fs.readFileSync(path.resolve('../../../../../.env'), 'utf8')
const key = env.match(/^BUGHERD[A-Z_]*=(.*)$/m)[1].trim().replace(/^["']|["']$/g, '')
const auth = 'Basic ' + Buffer.from(key + ':x').toString('base64')
const API = 'https://www.bugherd.com/api_v2/projects/540569'
const get = async (p) => { const r = await fetch(API + p, { headers: { Authorization: auth } }); if (!r.ok) throw new Error(`${p} ${r.status}`); return r.json() }
const tasks = []
for (const status of ['', '?status=archived']) {
  for (let page = 1; page < 30; page++) {
    const j = await get(`/tasks.json${status ? status + '&' : '?'}page=${page}`)
    tasks.push(...j.tasks)
    if (!j.meta || tasks.length >= j.meta.count || !j.tasks.length) break
  }
}
const seen = new Set(); const all = tasks.filter(t => !seen.has(t.id) && seen.add(t.id))
const counts = {}
for (const t of all) counts[t.status] = (counts[t.status] || 0) + 1
console.log('tasks', all.length, JSON.stringify(counts))
for (const t0 of all.sort((a, b) => a.local_task_id - b.local_task_id)) {
  const open = !['done', 'closed', 'archived'].includes(t0.status)
  const fresh = t0.updated_at > SINCE || t0.created_at > SINCE
  if (!open && !fresh) continue
  const t = (await get(`/tasks/${t0.id}.json`)).task
  const cm = (await get(`/tasks/${t0.id}/comments.json`)).comments
  const newC = cm.filter(c => c.created_at > SINCE)
  if (!open && !newC.length) continue
  console.log(`\n#${t.local_task_id} [${t.status}] created ${t.created_at} by ${t.requester_email || t.requester?.email || '?'} page ${t.site}${t.url}`)
  console.log('  selector', (t.selector_info?.path || '').slice(-120))
  console.log('  TEXT', (t.description || '').replace(/\s+/g, ' ').slice(0, 600))
  for (const a of t.attachments || []) console.log('  ATT', a.file_name, a.url)
  if (t.screenshot_url) console.log('  SHOT', t.screenshot_url)
  for (const c of cm) console.log(`  ${c.created_at > SINCE ? 'NEW ' : '    '}${c.created_at} ${c.user?.email || c.user?.display_name || '?'}: ${(c.text || '').replace(/\s+/g, ' ').slice(0, 400)}`)
}
