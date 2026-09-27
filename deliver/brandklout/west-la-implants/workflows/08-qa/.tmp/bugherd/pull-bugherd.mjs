// Pull every task + comment + screenshot for the West LA Implants BugHerd project.
//   node pull-bugherd.mjs            (reads BUGHERD from the worktree .env)
import fs from 'node:fs'; import path from 'node:path';
const env = Object.fromEntries(fs.readFileSync(path.resolve('.env'),'utf8').split('\n').filter(l=>/^[A-Z_]+=/.test(l)).map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1).trim()]}));
const KEY = env.BUGHERD; if(!KEY) throw new Error('BUGHERD missing from .env');
const auth = 'Basic ' + Buffer.from(KEY + ':x').toString('base64');
const OUT = process.argv[2];
const get = async (p) => { const r = await fetch('https://www.bugherd.com/api_v2/' + p, { headers: { authorization: auth } }); if(!r.ok) throw new Error(p+' -> '+r.status); return r.json(); };
const projects = (await get('projects.json')).projects;
console.log('projects:', projects.map(p=>`${p.id} "${p.name}" ${p.devurl||''}`).join(' | '));
const proj = projects.find(p => /west\s*la/i.test(p.name) || /west-la-implants/i.test(p.devurl||'')) ;
if(!proj) { console.log('no West LA project found'); process.exit(1); }
console.log('using', proj.id, proj.name);
let tasks = [], page = 1;
while (true) { const j = await get(`projects/${proj.id}/tasks.json?page=${page}`); tasks.push(...j.tasks); if (j.tasks.length < 100) break; page++; }
console.log('tasks:', tasks.length);
const full = [];
for (const t of tasks) {
  const d = (await get(`projects/${proj.id}/tasks/${t.id}.json`)).task;
  const c = (await get(`projects/${proj.id}/tasks/${t.id}/comments.json`)).comments || [];
  d.comments = c;
  if (d.screenshot_url) { try { const b = Buffer.from(await (await fetch(d.screenshot_url)).arrayBuffer()); fs.writeFileSync(path.join(OUT, `task-${d.local_task_id}.png`), b); d._shot = `task-${d.local_task_id}.png`; } catch(e){ d._shot = 'download failed'; } }
  full.push(d);
}
fs.writeFileSync(path.join(OUT,'tasks.json'), JSON.stringify(full,null,2));
for (const d of full.sort((a,b)=>a.local_task_id-b.local_task_id)) {
  console.log(`\n#${d.local_task_id} [${d.status}] ${d.priority||''} by ${d.requester?.email||d.requester_email||'?'} ${d.created_at}`);
  console.log(`  page: ${d.site||d.url||''}  selector: ${d.selector_info?.path||''}  browser: ${d.description_browser||''} ${d.screen_size||''}`);
  console.log(`  desc: ${(d.description||'').replace(/\s+/g,' ').slice(0,600)}`);
  for (const c of d.comments) console.log(`  comment (${c.user?.email||'?'} ${c.created_at}): ${(c.text||'').replace(/\s+/g,' ').slice(0,500)}`);
  console.log(`  shot: ${d._shot||'none'}  tags: ${(d.tag_names||[]).join(',')}`);
}
