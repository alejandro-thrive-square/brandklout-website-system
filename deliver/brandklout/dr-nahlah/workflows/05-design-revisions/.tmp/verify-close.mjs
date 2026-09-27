import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
const ROOT='C:/Users/ACER/orca/workspaces/Brandklout Website System/bk-dr-nahlah'
let dir=join(ROOT,'deliver/brandklout/dr-nahlah/workflows/05-design-revisions')
for(let i=0;i<8;i++){const c=join(dir,'.env');if(existsSync(c)){for(const l of readFileSync(c,'utf8').split(/\r?\n/)){const m=/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(l);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].trim().replace(/^["']|["']$/g,'')}break}const u=dirname(dir);if(u===dir)break;dir=u}
const AUTH='Basic '+Buffer.from(process.env.BUGHERD+':x').toString('base64')
for (const id of [30950443,31166718,31167139,31167146]) {
  const r = await fetch('https://www.bugherd.com/api_v2/projects/537587/tasks/'+id+'.json',{headers:{Authorization:AUTH}})
  const t = (await r.json()).task
  console.log('#'+t.local_task_id, '->', t.status, '| comments:', (t.comment_count ?? '?'), '|', (t.description||'').slice(0,46))
}
