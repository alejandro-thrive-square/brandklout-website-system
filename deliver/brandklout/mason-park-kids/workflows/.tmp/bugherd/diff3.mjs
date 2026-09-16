import fs from 'node:fs';
const a = JSON.parse(fs.readFileSync('tasks-0915.json','utf8'));
const b = JSON.parse(fs.readFileSync('tasks.json','utf8'));
const old = new Map(a.map(t => [t.id, t]));
for (const t of b) {
  const o = old.get(t.id);
  const oc = new Set((o?.comments||[]).map(c => c.id));
  const nc = t.comments.filter(c => !oc.has(c.id));
  const na = t.attachments.length - (o?.attachments.length||0);
  const flag = !o ? 'NEW TASK' : '';
  console.log(`#${t.local_task_id} ${t.status} upd ${t.updated_at} comments ${t.comments.length} (+${nc.length}) att +${na} ${flag}`);
  for (const c of t.comments.slice(-3)) console.log(`    ${c.created_at} ${c.user?.display_name||c.user_id}: ${String(c.text).replace(/\s+/g,' ').slice(0,160)}`);
}
