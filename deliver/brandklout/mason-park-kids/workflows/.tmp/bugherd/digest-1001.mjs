import fs from 'node:fs';
const all = JSON.parse(fs.readFileSync('tasks.json','utf8'));
const t = all.filter(x=>!['done','closed'].includes(x.status) || x.local_task_id===508);
const out=[];
for (const x of t){
  const s = x.selector_info||{};
  const recent = x.comments.filter(c=>c.created_at>'2026-09-29T20');
  out.push(`## #${x.local_task_id} [${x.status}] ${x.url}  ${x.created_at}
desc: ${x.description}
sel: ${(s.path||'').slice(-220)}
html: ${(s.html||'').slice(0,300)}
win: ${s.window_size?.width||''}x${s.window_size?.height||''}  data: ${JSON.stringify(s.data||'').slice(0,200)}
att: ${x.attachments.map(a=>a.file_name+' '+(a.file_size||'')).join(' | ')}
comments(since 9/29): ${recent.map(c=>c.created_at.slice(0,16)+' '+(c.user?.display_name||'')+': '+c.text).join(' || ')}
`);}
fs.writeFileSync('digest-1001.md', out.join('\n'));
console.log(t.length);
