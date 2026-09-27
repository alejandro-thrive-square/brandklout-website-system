import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const env = fs.readFileSync(path.join(os.homedir(), '.webzite', '.env'), 'utf8');
const key = env.match(/^BUGHERD\s*=\s*"?([^"\r\n]+)"?/m)[1];
const auth = 'Basic ' + Buffer.from(key + ':x').toString('base64');
const api = async (p) => { for (let i=0;i<6;i++){ const r = await fetch(`https://www.bugherd.com/api_v2/${p}`, { headers: { Authorization: auth } }); if (r.status===429){await new Promise(s=>setTimeout(s,4000));continue;} if(!r.ok) return {err:r.status}; return r.json(); } };
const since = '2026-09-15T19:51:00Z';
const ps = []; for (let page=1;;page++){ const j = await api(`projects.json?page=${page}`); ps.push(...(j.projects||[])); if(!j.projects?.length || ps.length >= (j.meta?.count||0)) break; }
console.log('projects', ps.length);
for (const p of ps) {
  const j = await api(`projects/${p.id}/tasks.json?updated_since=${since}`);
  const n = j.tasks?.length || 0;
  if (n) { console.log(`${p.id} ${p.name}: ${n} updated`); for (const t of j.tasks) console.log(`   #${t.local_task_id} ${t.updated_at} ${String(t.description).replace(/\s+/g,' ').slice(0,100)}`); }
}
// also check kids project with archived / all statuses
for (const s of ['closed','archived']) { const j = await api(`projects/540564/tasks.json?status=${s}`); console.log('kids', s, j.tasks?.length ?? j.err); }
