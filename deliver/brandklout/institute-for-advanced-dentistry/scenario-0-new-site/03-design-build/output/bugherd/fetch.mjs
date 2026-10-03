/**
 * fetch.mjs — every BugHerd task on project 542527 (IFA staging) that is not closed, in full:
 * task by id (page URL, selector, description), its comments, its attachments (screenshots downloaded).
 * The list endpoint hides page, selector and screenshot (deliver/docs/BUGHERD.md), so each is fetched by id.
 *
 *   node fetch.mjs [--all] > fetch.log 2>&1        out: <date>/tasks.json, <date>/shots/<task>-<n>.<ext>
 *   --all includes closed/done tasks
 * Key: BUGHERD in the worktree .env (generated from ~/.webzite/.env; never printed).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const env = fs.readFileSync(path.resolve(HERE, '../../../../../../../.env'), 'utf8')
const KEY = (env.match(/^BUGHERD=(.*)$/m) || [])[1]?.trim().replace(/^["']|["']$/g, '')
if (!KEY) throw new Error('BUGHERD missing from .env')
const PROJECT = 542527
const AUTH = 'Basic ' + Buffer.from(KEY + ':x').toString('base64')
const all = process.argv.includes('--all')
const day = new Date().toISOString().slice(0, 10)
const OUT = path.join(HERE, day)
fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true })

async function get(url) {
  for (let i = 0; i < 5; i++) {
    const r = await fetch(url.startsWith('http') ? url : `https://www.bugherd.com/api_v2${url}`, { headers: { Authorization: AUTH } })
    if (r.status === 429) { await new Promise((s) => setTimeout(s, 2000 * (i + 1))); continue }
    if (!r.ok) throw new Error(`${r.status} ${url}`)
    return r.json()
  }
  throw new Error('rate limited: ' + url)
}

const list = []
for (let page = 1; ; page++) {
  const r = await get(`/projects/${PROJECT}/tasks.json?page=${page}`)
  list.push(...(r.tasks ?? []))
  if (!r.meta || list.length >= (r.meta.count ?? 0) || !(r.tasks ?? []).length) break
}
console.log(`list: ${list.length} task(s); statuses ${JSON.stringify(list.reduce((m, t) => (m[t.status] = (m[t.status] || 0) + 1, m), {}))}`)

const out = []
for (const t of list) {
  if (!all && /^(closed|done)$/i.test(t.status ?? '')) continue
  const full = (await get(`/projects/${PROJECT}/tasks/${t.id}.json`)).task
  const comments = (await get(`/projects/${PROJECT}/tasks/${t.id}/comments.json`)).comments ?? []
  const atts = (await get(`/projects/${PROJECT}/tasks/${t.id}/attachments.json`)).attachments ?? []
  const shots = []
  const urls = [full.screenshot_url, ...atts.map((a) => a.url)].filter(Boolean)
  for (const [i, u] of urls.entries()) {
    try {
      const r = await fetch(u)
      const buf = Buffer.from(await r.arrayBuffer())
      const ext = (u.split('?')[0].match(/\.(png|jpe?g|gif|webp)$/i) || [, 'png'])[1]
      const f = `${full.local_task_id ?? t.id}-${i}.${ext}`
      fs.writeFileSync(path.join(OUT, 'shots', f), buf)
      shots.push({ file: f, bytes: buf.length, url: u.split('?')[0] })
    } catch (e) { shots.push({ error: e.message, url: u }) }
  }
  out.push({
    id: t.id, local: full.local_task_id, status: full.status, priority: full.priority, created: full.created_at,
    by: full.requester?.display_name ?? full.requester_email, description: full.description,
    page: full.site + (full.url || ''), selector: full.selector_info?.path ?? full.selector_info, window: full.selector_info?.window ?? null,
    browser: full.requester_os ? `${full.requester_os} ${full.requester_browser} ${full.requester_resolution ?? ''}` : null,
    comments: comments.map((c) => ({ by: c.user?.display_name, at: c.created_at, text: c.text })), shots,
  })
}
fs.writeFileSync(path.join(OUT, 'tasks.json'), JSON.stringify(out, null, 1))
for (const t of out) console.log(`#${t.local} [${t.status}] ${t.page}\n   ${String(t.description).replace(/\s+/g, ' ').slice(0, 220)}${t.comments.length ? `\n   +${t.comments.length} comment(s)` : ''}  shots ${t.shots.map((s) => s.bytes ?? 'ERR').join(',')}`)
console.log(`\n${out.length} open task(s) -> ${path.relative(process.cwd(), OUT)}`)
