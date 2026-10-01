// Pull only the open notes (not done/closed) of BugHerd project 539151, by id,
// with comments and attachments. Lists every project too, in case a new one appeared.
//   node open-2026-10-01.mjs > open-pull-2026-10-01.log
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const PROJECT = 539151;
const env = fs.readFileSync(path.join(os.homedir(), ".webzite", ".env"), "utf8");
const KEY = env.match(/^BUGHERD=(.*)$/m)[1].trim().replace(/^["']|["']$/g, "");
const AUTH = "Basic " + Buffer.from(`${KEY}:x`).toString("base64");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url) {
  for (let i = 0; i < 5; i++) {
    const res = await fetch(url, { headers: { Authorization: AUTH } });
    if (res.status === 429) { await sleep(5000 * (i + 1)); continue; }
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    await sleep(1100);
    return res.json();
  }
  throw new Error(`rate limited: ${url}`);
}
const projects = await get("https://www.bugherd.com/api_v2/projects.json");
for (const p of projects.projects ?? []) console.log(`project ${p.id} ${p.name} ${p.devurl ?? ""}`);
const API = `https://www.bugherd.com/api_v2/projects/${PROJECT}`;
const ids = new Map();
for (const s of ["feedback", "backlog", "todo", "doing"]) {
  for (let page = 1; page < 20; page++) {
    const j = await get(`${API}/tasks.json?status=${s}&page=${page}`);
    for (const t of j.tasks ?? []) ids.set(t.id, t);
    if (!(j.tasks ?? []).length || !j.meta || ids.size >= j.meta.count) break;
  }
  console.log(`status ${s}: running total ${ids.size}`);
}
const dir = "screens-2026-10-01";
fs.mkdirSync(dir, { recursive: true });
const tasks = [];
for (const id of ids.keys()) {
  const { task } = await get(`${API}/tasks/${id}.json`);
  const { comments } = await get(`${API}/tasks/${id}/comments.json`);
  const { attachments } = await get(`${API}/tasks/${id}/attachments.json`).catch(() => ({ attachments: [] }));
  const shot = task.screenshot_url || task.screenshot;
  if (shot) { const r = await fetch(shot); if (r.ok) fs.writeFileSync(path.join(dir, `${task.local_task_id}.jpg`), Buffer.from(await r.arrayBuffer())); }
  for (const [i, a] of (attachments ?? []).entries()) {
    const r = await fetch(a.url).catch(() => null);
    const buf = r?.ok ? Buffer.from(await r.arrayBuffer()) : null;
    if (buf) fs.writeFileSync(path.join(dir, `${task.local_task_id}-att${i + 1}-${path.basename(new URL(a.url).pathname)}`), buf);
    console.log(`  att ${a.url} ${buf ? buf.length : "FAIL"} bytes`);
  }
  tasks.push({ task, comments, attachments });
  const m = task.site ? "" : "";
  console.log(`\n#${task.local_task_id} [${task.status}] ${task.created_at} by ${task.requester_email ?? task.requester?.email ?? "?"}`);
  console.log(`  page: ${task.site ?? ""}${task.url ?? ""}`);
  console.log(`  selector: ${task.selector_info?.path ?? task.selector_info?.selector ?? JSON.stringify(task.selector_info ?? null)}`);
  console.log(`  window: ${JSON.stringify(task.requester_os ?? "")} ${task.requester_browser ?? ""} ${task.requester_resolution ?? ""} ${task.requester_browser_size ?? ""}`);
  console.log(`  text: ${task.description}`);
  for (const c of comments) console.log(`  comment ${c.created_at} ${c.user?.email ?? c.user_id}: ${c.text}`);
}
fs.writeFileSync("tasks-open-2026-10-01.json", JSON.stringify({ pulled: new Date().toISOString(), tasks }, null, 1));
console.log(`\nopen tasks: ${tasks.length}`);
