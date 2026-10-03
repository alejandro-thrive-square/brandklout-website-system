// Client script, 2026-10-01. Pulls every task of BugHerd project 544349 by id, with its comments and
// attachments (the list endpoint hides the page, the selector and the screenshot), into
// output/bugherd/<date>/: tasks.json, one folder per task with task.json, comments.json and the
// attachment files. Read-only: it never comments on, moves or completes a task.
// Usage (from the step folder): node output/code/bugherd-pull.mjs [YYYY-MM-DD]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PROJECT = 544349;
const day = process.argv[2] || new Date().toISOString().slice(0, 10);
const out = path.resolve('output/bugherd', day);
fs.mkdirSync(out, { recursive: true });

const env = fs.readFileSync(path.join(os.homedir(), '.webzite/.env'), 'utf8');
const key = (env.match(/^BUGHERD=(.*)$/m) || [])[1]?.trim();
if (!key) throw new Error('BUGHERD missing from ~/.webzite/.env');
const H = { Authorization: 'Basic ' + Buffer.from(key + ':x').toString('base64'), Accept: 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const get = async (u) => {
  for (let i = 0; i < 5; i++) {
    const r = await fetch('https://www.bugherd.com/api_v2/' + u, { headers: H });
    if (r.status === 429) { await sleep(3000); continue; }
    if (!r.ok) throw new Error(`${r.status} ${u}`);
    return r.json();
  }
  throw new Error('429 x5 ' + u);
};

const all = [];
for (let page = 1; ; page++) {
  const j = await get(`projects/${PROJECT}/tasks.json?page=${page}`);
  all.push(...j.tasks);
  if (!j.meta || all.length >= j.meta.count || !j.tasks.length) break;
}
const summary = [];
for (const t of all) {
  const dir = path.join(out, String(t.local_task_id ?? t.id));
  fs.mkdirSync(dir, { recursive: true });
  const task = (await get(`projects/${PROJECT}/tasks/${t.id}.json`)).task;
  fs.writeFileSync(path.join(dir, 'task.json'), JSON.stringify(task, null, 1));
  const comments = (await get(`projects/${PROJECT}/tasks/${t.id}/comments.json`)).comments || [];
  fs.writeFileSync(path.join(dir, 'comments.json'), JSON.stringify(comments, null, 1));
  const atts = (await get(`projects/${PROJECT}/tasks/${t.id}/attachments.json`)).attachments || [];
  const files = [];
  for (const a of atts) {
    const r = await fetch(a.url);
    const buf = Buffer.from(await r.arrayBuffer());
    const name = String(a.file_name || a.id).replace(/[^\w.-]+/g, '_').slice(-60);
    fs.writeFileSync(path.join(dir, name), buf);
    files.push(`${name} ${buf.length}B`);
  }
  if (task.screenshot_url) {
    const r = await fetch(task.screenshot_url);
    const buf = Buffer.from(await r.arrayBuffer());
    fs.writeFileSync(path.join(dir, 'screenshot.png'), buf);
    files.push(`screenshot.png ${buf.length}B`);
  }
  summary.push({ id: t.id, local: task.local_task_id, status: task.status, created: task.created_at, by: task.requester_email || task.requester?.display_name, url: task.site + (task.url || ''), selector: task.selector_info?.path || task.selector_info?.data, text: task.description, comments: comments.map((c) => `${c.user?.display_name || c.user_id}: ${c.text}`), files });
}
fs.writeFileSync(path.join(out, 'tasks.json'), JSON.stringify(summary, null, 1));
console.log(`${summary.length} task(s) -> ${out}`);
for (const s of summary) console.log(`#${s.local} [${s.status}] ${s.created} ${s.by}\n  ${s.url}\n  ${s.selector}\n  ${String(s.text).replace(/\s+/g, ' ')}\n  comments: ${s.comments.length}  files: ${s.files.join(', ')}`);
process.exitCode = 0;
