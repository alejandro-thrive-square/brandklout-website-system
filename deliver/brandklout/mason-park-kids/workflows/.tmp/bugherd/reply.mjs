// Post one reply per BugHerd task, and move a task to done only when the plan says so.
//   node reply.mjs            dry run: prints what it would send
//   node reply.mjs --send     posts the comments and the status changes
// The plan is replies.json: [{ "n": 1, "text": "...", "done": true }, ...]
// (never pipe stdout: Node 24 on Windows dies on a piped stdout)
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SEND = process.argv.includes('--send');
const env = fs.readFileSync(path.join(os.homedir(), '.webzite', '.env'), 'utf8');
const key = (env.match(/^BUGHERD\s*=\s*"?([^"\r\n]+)"?/m) || [])[1];
if (!key) throw new Error('BUGHERD not in master .env');
const auth = 'Basic ' + Buffer.from(key + ':x').toString('base64');
const PROJECT = 540564;
const call = async (method, p, body) => {
  for (let i = 0; i < 5; i++) {
    const r = await fetch(`https://www.bugherd.com/api_v2/${p}`, {
      method, headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (r.status === 429) { await new Promise((s) => setTimeout(s, 3000)); continue; }
    const t = await r.text();
    if (!r.ok) throw new Error(`${method} ${p} ${r.status} ${t.slice(0, 300)}`);
    return t ? JSON.parse(t) : {};
  }
  throw new Error(`${p} rate limited`);
};

const tasks = JSON.parse(fs.readFileSync(path.join(here, 'tasks.json'), 'utf8'));
const byNo = Object.fromEntries(tasks.map((t) => [t.local_task_id, t]));
const plan = JSON.parse(fs.readFileSync(path.join(here, 'replies.json'), 'utf8'));
const log = [];
for (const { n, text, done } of plan) {
  const t = byNo[n];
  if (!t) { console.log(`#${n} not in tasks.json, skipped`); continue; }
  console.log(`#${n} (id ${t.id}) ${done ? 'DONE' : 'stays open'}\n  ${text}`);
  if (!SEND) continue;
  await call('POST', `projects/${PROJECT}/tasks/${t.id}/comments.json`, { comment: { text } });
  if (done) await call('PUT', `projects/${PROJECT}/tasks/${t.id}.json`, { task: { status: 'done' } });
  const { task } = await call('GET', `projects/${PROJECT}/tasks/${t.id}.json`);
  log.push({ n, id: t.id, status: task.status, at: new Date().toISOString() });
  console.log(`  -> status now ${task.status}`);
}
if (SEND) fs.writeFileSync(path.join(here, 'reply-log.json'), JSON.stringify(log, null, 2));
console.log(SEND ? 'sent' : 'dry run, nothing sent');
