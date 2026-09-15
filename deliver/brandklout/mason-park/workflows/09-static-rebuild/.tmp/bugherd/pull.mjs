// Pull every task of BugHerd project 539151 by id, with its comments and
// attachments, and download each screenshot. The list endpoint hides page and
// selector, so every task is fetched on its own.
//
//   node pull.mjs 2026-09-15 > pull-2026-09-15.log
//
// Writes tasks-<date>.json (raw per-task records) and screens-<date>/<n>.jpg.
// Do not pipe stdout: Node on Windows dies on a pipe; redirect to a file.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const DATE = process.argv[2] || new Date().toISOString().slice(0, 10);
const PROJECT = 539151;
const env = fs.readFileSync(path.join(os.homedir(), ".webzite", ".env"), "utf8");
const KEY = env.match(/^BUGHERD=(.*)$/m)[1].trim().replace(/^["']|["']$/g, "");
const AUTH = "Basic " + Buffer.from(`${KEY}:x`).toString("base64");
const API = `https://www.bugherd.com/api_v2/projects/${PROJECT}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(p) {
  for (let i = 0; i < 5; i++) {
    const res = await fetch(`${API}${p}`, { headers: { Authorization: AUTH } });
    if (res.status === 429) { await sleep(5000 * (i + 1)); continue; }
    if (!res.ok) throw new Error(`${res.status} ${p}`);
    await sleep(1100);
    return res.json();
  }
  throw new Error(`rate limited: ${p}`);
}

async function list(query) {
  const out = [];
  for (let page = 1; page < 20; page++) {
    const j = await get(`/tasks.json?${query}${query ? "&" : ""}page=${page}`);
    out.push(...(j.tasks ?? []));
    if (!j.meta || out.length >= j.meta.count || (j.tasks ?? []).length === 0) break;
  }
  return out;
}

const ids = new Map();
for (const q of ["", "status=feedback", "status=backlog", "status=todo", "status=doing", "status=done", "status=closed"]) {
  const got = await list(q);
  console.log(`list ${q || "(default)"}: ${got.length}`);
  for (const t of got) ids.set(t.id, t);
}
const columns = await get("/columns.json").catch((e) => ({ error: String(e) }));

const dir = `screens-${DATE}`;
fs.mkdirSync(dir, { recursive: true });
const tasks = [];
for (const id of [...ids.keys()].sort((a, b) => ids.get(a).local_task_id - ids.get(b).local_task_id)) {
  const { task } = await get(`/tasks/${id}.json`);
  const { comments } = await get(`/tasks/${id}/comments.json`);
  const { attachments } = await get(`/tasks/${id}/attachments.json`).catch(() => ({ attachments: [] }));
  const shot = task.screenshot_url || task.screenshot;
  if (shot) {
    const r = await fetch(shot);
    if (r.ok) fs.writeFileSync(path.join(dir, `${task.local_task_id}.jpg`), Buffer.from(await r.arrayBuffer()));
  }
  for (const [i, a] of (attachments ?? []).entries()) {
    const r = await fetch(a.url).catch(() => null);
    if (r?.ok) fs.writeFileSync(path.join(dir, `${task.local_task_id}-att${i + 1}-${path.basename(new URL(a.url).pathname)}`), Buffer.from(await r.arrayBuffer()));
  }
  tasks.push({ task, comments, attachments });
  console.log(`#${task.local_task_id} ${task.status} upd ${task.updated_at} comments ${comments.length} att ${(attachments ?? []).length}`);
}
fs.writeFileSync(`tasks-${DATE}.json`, JSON.stringify({ pulled: new Date().toISOString(), columns, tasks }, null, 1));
console.log(`wrote tasks-${DATE}.json with ${tasks.length} tasks`);
