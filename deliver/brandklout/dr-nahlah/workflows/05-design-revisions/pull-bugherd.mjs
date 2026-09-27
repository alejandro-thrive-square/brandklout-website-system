#!/usr/bin/env node
/**
 * BugHerd feedback extractor — pulls every task, comment and attachment on the
 * Dr Nahlah board into `.tmp/bugherd/` so revisions can be applied to the
 * Instatic site without anyone re-reading the board by hand.
 *
 * The one thing that bites: **the task LIST endpoint is not the task**. It
 * returns description/status/tags and stops there. The fields that say *where*
 * a pin actually sits — `url`, `selector_info.path`, `screenshot_url`,
 * `attachments` — exist only on `GET /tasks/:id.json`. A pin without those is
 * just a sentence with no address, so we always fan out to the detail call.
 *
 * Auth is HTTP Basic with the API key as the username and a literal `x` as the
 * password (BugHerd ignores the password). Key comes from the environment:
 *
 *   BUGHERD   — from the repo-root .env, never from source
 *
 * Statuses are enumerated explicitly. The default listing returns only open
 * work, so a closed task would silently vanish from the export.
 *
 * Usage:  node pull-bugherd.mjs [--project <id>] [--no-media]
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(HERE, '.tmp', 'bugherd')
const MEDIA = join(OUT, 'media')

const API = 'https://www.bugherd.com/api_v2'
const STATUSES = ['backlog', 'todo', 'doing', 'done', 'closed']

// ---------------------------------------------------------------- environment

/** Walk up for the repo-root .env — the API client is run from the workflow
 *  folder, but the credentials live at the top of the worktree. */
function loadEnv (start = HERE) {
  let dir = start
  for (let i = 0; i < 8; i++) {
    const candidate = join(dir, '.env')
    if (existsSync(candidate)) {
      for (const line of readFileSync(candidate, 'utf8').split(/\r?\n/)) {
        const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line)
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
      }
      return
    }
    const up = dirname(dir)
    if (up === dir) break
    dir = up
  }
}
loadEnv()

const KEY = process.env.BUGHERD
if (!KEY) {
  console.error('BUGHERD is not set. Add it to the repo-root .env (see .env.example).')
  process.exit(1)
}
const AUTH = 'Basic ' + Buffer.from(`${KEY}:x`).toString('base64')

// ---------------------------------------------------------------------- fetch

async function api (path) {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: AUTH } })
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status} ${await res.text()}`)
  return res.json()
}

/** BugHerd pages at 100; keep asking until a page comes back short. */
async function apiAll (path, key) {
  const out = []
  for (let page = 1; ; page++) {
    const sep = path.includes('?') ? '&' : '?'
    const body = await api(`${path}${sep}page=${page}`)
    const rows = body[key] || []
    out.push(...rows)
    if (rows.length < 100) return out
  }
}

async function download (url, file) {
  const res = await fetch(url, { headers: { Authorization: AUTH } })
  if (!res.ok) return null
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, Buffer.from(await res.arrayBuffer()))
  return file
}

// ----------------------------------------------------------------------- main

const argv = process.argv.slice(2)
const wantMedia = !argv.includes('--no-media')
let projectId = argv[argv.indexOf('--project') + 1]
if (!argv.includes('--project')) projectId = null

mkdirSync(MEDIA, { recursive: true })

const { projects } = await api('/projects.json')
if (!projectId) {
  const hit = projects.find(p => /nahlah/i.test(p.name)) || projects[0]
  if (!hit) throw new Error('No BugHerd projects visible to this API key.')
  projectId = hit.id
}
const project = projects.find(p => String(p.id) === String(projectId)) || { id: projectId }
console.log(`project ${project.id} — ${project.name || '(unknown)'}`)

// Enumerate by status: the default listing hides closed work.
const seen = new Map()
for (const status of STATUSES) {
  const rows = await apiAll(`/projects/${projectId}/tasks.json?status=${status}`, 'tasks')
  for (const t of rows) seen.set(t.id, t)
  console.log(`  ${status.padEnd(8)} ${rows.length}`)
}

const tasks = []
for (const stub of [...seen.values()].sort((a, b) => a.local_task_id - b.local_task_id)) {
  const { task } = await api(`/projects/${projectId}/tasks/${stub.id}.json`)
  const comments = await apiAll(`/projects/${projectId}/tasks/${stub.id}/comments.json`, 'comments')
  const attachments = await apiAll(`/projects/${projectId}/tasks/${stub.id}/attachments.json`, 'attachments')

  const media = []
  if (wantMedia) {
    if (task.screenshot_url) {
      const f = join(MEDIA, `task-${task.local_task_id}-screenshot.jpg`)
      if (await download(task.screenshot_url, f)) media.push(f)
    }
    for (const a of attachments) {
      const safe = String(a.file_name || `attachment-${a.id}`).replace(/[^\w.\-]+/g, '_')
      const f = join(MEDIA, `task-${task.local_task_id}-${safe}`)
      if (await download(a.url, f)) media.push(f)
    }
  }

  tasks.push({ ...task, comments, attachments, local_media: media })
  console.log(`  #${task.local_task_id} ${task.status.padEnd(8)} ${comments.length} comment(s)  ${task.url || '(no url)'}`)
}

writeFileSync(join(OUT, 'tasks.json'), JSON.stringify({ project, pulled_tasks: tasks.length, tasks }, null, 2))

// ------------------------------------------------------------------- markdown

const esc = s => String(s ?? '').trim()
const lines = [
  `# BugHerd feedback — ${project.name || project.id}`,
  '',
  `Project \`${project.id}\` · ${tasks.length} task(s) · generated by \`pull-bugherd.mjs\``,
  '',
]

for (const t of tasks) {
  lines.push(`## #${t.local_task_id} — ${esc(t.title) || esc(t.description).split('\n')[0].slice(0, 80)}`)
  lines.push('')
  lines.push(`- **Status**: ${t.status} · **Priority**: ${t.priority} · **Tags**: ${t.tag_names?.join(', ') || '—'}`)
  lines.push(`- **Page**: \`${t.url || '—'}\`  (${t.site || ''})`)
  lines.push(`- **From**: ${t.requester_email || '—'} · ${t.created_at}`)
  if (t.requester_browser_size) lines.push(`- **Viewport**: ${t.requester_browser_size} · ${t.requester_browser}`)
  if (t.selector_info?.path) lines.push(`- **Element**: \`${t.selector_info.path}\``)
  if (t.admin_link) lines.push(`- **Board**: ${t.admin_link}`)
  for (const f of t.local_media) lines.push(`- **Media**: \`${f.replace(OUT + '\\', '').replace(OUT + '/', '')}\``)
  lines.push('')
  lines.push(esc(t.description) || '_(no description)_')
  lines.push('')
  if (t.comments.length) {
    lines.push('**Comments**')
    lines.push('')
    for (const c of t.comments) {
      lines.push(`- *${c.user?.email || c.user_id || 'unknown'}* (${c.created_at}): ${esc(c.text)}`)
    }
    lines.push('')
  }
}

writeFileSync(join(OUT, 'feedback.md'), lines.join('\n'))
console.log(`\nwrote ${join(OUT, 'tasks.json')}`)
console.log(`wrote ${join(OUT, 'feedback.md')}`)
