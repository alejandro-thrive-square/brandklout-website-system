// Pull every task in BugHerd project 540564 by id, with comments, attachments and screenshots.
// node fetch.mjs > fetch.log   (never pipe: Node 24 on Windows dies on a piped stdout)
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const env = fs.readFileSync(path.join(os.homedir(), '.webzite', '.env'), 'utf8');
const key = (env.match(/^BUGHERD\s*=\s*"?([^"\r\n]+)"?/m) || [])[1];
if (!key) throw new Error('BUGHERD not in master .env');
const auth = 'Basic ' + Buffer.from(key + ':x').toString('base64');
const PROJECT = 540564;
const api = async (p) => {
  for (let i = 0; i < 5; i++) {
    const r = await fetch(`https://www.bugherd.com/api_v2/${p}`, { headers: { Authorization: auth } });
    if (r.status === 429) { await new Promise((s) => setTimeout(s, 3000)); continue; }
    if (!r.ok) throw new Error(`${p} ${r.status}`);
    return r.json();
  }
  throw new Error(`${p} rate limited`);
};
const dl = async (url, file) => {
  if (!url || fs.existsSync(file)) return;
  const r = await fetch(url);
  if (!r.ok) { console.log('  download failed', r.status, url); return; }
  fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
};

const shots = path.join(here, 'shots');
fs.mkdirSync(shots, { recursive: true });
const list = [];
for (let page = 1; ; page++) {
  const j = await api(`projects/${PROJECT}/tasks.json?page=${page}`);
  list.push(...j.tasks);
  if (!j.meta || list.length >= j.meta.count || !j.tasks.length) break;
}
console.log('tasks in list', list.length);
const out = [];
for (const t of list.sort((a, b) => a.local_task_id - b.local_task_id)) {
  const { task } = await api(`projects/${PROJECT}/tasks/${t.id}.json`);
  const { comments } = await api(`projects/${PROJECT}/tasks/${t.id}/comments.json`);
  let attachments = [];
  try { attachments = (await api(`projects/${PROJECT}/tasks/${t.id}/attachments.json`)).attachments || []; } catch (e) { console.log('  attachments', e.message); }
  const n = task.local_task_id;
  await dl(task.screenshot_url, path.join(shots, `${n}.jpg`));
  for (const [i, a] of attachments.entries()) {
    const ext = path.extname(new URL(a.url).pathname) || '.bin';
    await dl(a.url, path.join(shots, `${n}-att${i}${ext}`));
  }
  out.push({ ...task, comments, attachments });
  console.log(`#${n} ${task.status} ${task.url} | ${String(task.description).replace(/\s+/g, ' ').slice(0, 120)}`);
}
fs.writeFileSync(path.join(here, 'tasks.json'), JSON.stringify(out, null, 2));
console.log('saved', out.length);
