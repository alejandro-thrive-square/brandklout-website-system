// What changed on the board between two exports: description, status, url,
// selector, screenshot, attachments, comments, and every other field whose value moved.
//
//   node diff-rounds.mjs tasks-2026-09-10.json tasks-2026-09-15.json > diff-2026-09-15.txt
import fs from "node:fs";

const [a, b] = process.argv.slice(2);
const old = new Map(JSON.parse(fs.readFileSync(a, "utf8")).map((t) => [t.n, t]));
const cur = JSON.parse(fs.readFileSync(b, "utf8")).tasks;

for (const { task: t, comments, attachments } of cur) {
  const n = t.local_task_id;
  const o = old.get(n);
  const lines = [];
  if (!o) lines.push("NEW TASK");
  else {
    if (o.description !== t.description) lines.push(`description:\n    was: ${o.description}\n    now: ${t.description}`);
    if (o.status !== t.status) lines.push(`status ${o.status} -> ${t.status}`);
    if (o.url !== t.site_url && o.url !== t.url && o.url !== (t.selector_info?.url)) lines.push(`url ${o.url} -> ${t.selector_info?.url ?? t.url}`);
    if (o.path !== t.selector_info?.path) lines.push(`selector ${o.path} -> ${t.selector_info?.path}`);
    if (o.screenshot !== t.screenshot_url) lines.push(`screenshot ${o.screenshot} -> ${t.screenshot_url}`);
  }
  for (const c of comments) lines.push(`comment ${c.created_at} ${c.user?.display_name ?? c.user_id}: ${c.text}`);
  for (const x of attachments ?? []) lines.push(`attachment ${x.created_at} ${x.file_name ?? ""} ${x.url}`);
  const extra = ["priority_id", "tag_names", "assigned_to_id", "due_at", "external_id", "status_id", "admin_link"]
    .filter((k) => t[k] != null && !(Array.isArray(t[k]) && !t[k].length))
    .map((k) => `${k}=${JSON.stringify(t[k])}`);
  console.log(`#${n} upd ${t.updated_at} ${extra.join(" ")}`);
  for (const l of lines) console.log(`  ${l}`);
}
