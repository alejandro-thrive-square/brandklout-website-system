// Download every attachment of the open pins in <dir>/tasks.json into <dir>/att/.
//   node fetch-attachments.mjs <dir>
import fs from 'node:fs'; import path from 'node:path';
const DIR = process.argv[2];
const tasks = JSON.parse(fs.readFileSync(path.join(DIR, 'tasks.json'), 'utf8')).filter(t => t.status !== 'done');
const OUT = path.join(DIR, 'att'); fs.mkdirSync(OUT, { recursive: true });
const index = [];
for (const t of tasks) {
  for (const a of t.attachments || []) {
    const ext = path.extname(a.name) || '.bin';
    const file = `pin-${t.local_task_id}-${a.id}${ext.toLowerCase()}`;
    const r = await fetch(a.url);
    const b = Buffer.from(await r.arrayBuffer());
    fs.writeFileSync(path.join(OUT, file), b);
    index.push({ pin: t.local_task_id, id: a.id, name: a.name, file, bytes: b.length, status: r.status });
    console.log(`#${t.local_task_id} ${a.name} -> ${file} ${r.status} ${b.length}`);
  }
}
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 2));
