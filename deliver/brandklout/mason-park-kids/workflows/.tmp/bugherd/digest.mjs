import fs from 'node:fs';
const t = JSON.parse(fs.readFileSync('tasks.json','utf8')).filter(x=>x.local_task_id>=42 && !['done','closed'].includes(x.status));
const out=[];
for (const x of t){
  const s = x.selector_info||{};
  out.push(`## #${x.local_task_id} ${x.url}  [${x.requester?.display_name||x.requester_email||''}] ${x.created_at}
desc: ${x.description}
sel: ${(s.path||'').slice(-160)}
win: ${s.window_size?.width||''}x${s.window_size?.height||''} ${x.requester_os||''} ${x.requester_browser||''}
att: ${x.attachments.map(a=>a.file_name+' '+(a.file_size||'')).join(' | ')}
comments: ${x.comments.map(c=>c.text).join(' || ')}
`);}
fs.writeFileSync('digest-0924.md', out.join('\n'));
console.log(t.length);
