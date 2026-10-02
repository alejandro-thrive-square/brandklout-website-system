// Client script, 2026-10-02. Moves the BugHerd 544349 tasks given on the command line (local task
// numbers) to "done", and only those. Before each write it re-reads the task and skips it if it is no
// longer in "todo" or has a comment (someone touched it since the pull); after the write it reads the
// task back. Status only: it never posts a comment.
// Usage (from the step folder): node output/code/bugherd-mark-done.mjs 1 2 3 ... > output/bugherd/<date>/mark-done.txt
import fs from 'node:fs';
import os from 'node:os';

const PROJECT = 544349;
const want = process.argv.slice(2).map(Number).filter(Boolean);
if (!want.length) throw new Error('give the local task numbers to mark done');
const env = fs.readFileSync(os.homedir() + '/.webzite/.env', 'utf8');
const key = (env.match(/^BUGHERD=(.*)$/m) || [])[1]?.trim();
const H = { Authorization: 'Basic ' + Buffer.from(key + ':x').toString('base64'), Accept: 'application/json', 'Content-Type': 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const api = async (u, opt = {}) => {
  for (let i = 0; i < 5; i++) {
    const r = await fetch('https://www.bugherd.com/api_v2/' + u, { headers: H, ...opt });
    if (r.status === 429) { await sleep(3000); continue; }
    const body = await r.text();
    if (!r.ok) throw new Error(`${r.status} ${u} ${body.slice(0, 200)}`);
    return body ? JSON.parse(body) : {};
  }
  throw new Error('429 x5 ' + u);
};

const list = (await api(`projects/${PROJECT}/tasks.json`)).tasks;
let failed = 0;
for (const n of want) {
  const t = list.find((x) => x.local_task_id === n);
  if (!t) { console.log(`#${n}  SKIP  not in the open list`); continue; }
  const now = (await api(`projects/${PROJECT}/tasks/${t.id}.json`)).task;
  const comments = (await api(`projects/${PROJECT}/tasks/${t.id}/comments.json`)).comments || [];
  if (now.status !== 'todo' || comments.length) { console.log(`#${n}  SKIP  status ${now.status}, ${comments.length} comment(s): someone touched it`); continue; }
  await api(`projects/${PROJECT}/tasks/${t.id}.json`, { method: 'PUT', body: JSON.stringify({ task: { status: 'done' } }) });
  await sleep(600);
  const back = (await api(`projects/${PROJECT}/tasks/${t.id}.json`)).task;
  const ok = back.status === 'done';
  if (!ok) failed++;
  console.log(`#${n}  ${ok ? 'DONE' : 'FAIL'}  ${String(now.description).replace(/\s+/g, ' ').slice(0, 70)}  (read back: ${back.status})`);
  await sleep(400);
}
console.log(failed ? `\n${failed} FAILED` : '\nall written and read back');
process.exitCode = failed ? 1 : 0;
