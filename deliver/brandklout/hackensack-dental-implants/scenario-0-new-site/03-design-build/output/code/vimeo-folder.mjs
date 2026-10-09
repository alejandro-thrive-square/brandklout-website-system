// Client script, 2026-10-09. Lists the agency Vimeo folder "Hackensack Center" (project 29482006 on
// the owner account 248712727) and optionally downloads each film's best rendition to a scratch dir.
// Token: VIMEO in the worktree .env (a team member's token; content hangs off the owner account).
//
// Usage (from the step's output/ folder; never pipe Node on Windows):
//   node code/vimeo-folder.mjs > vimeo-folder.txt                 list (writes vimeo-folder.json)
//   node code/vimeo-folder.mjs --download <dir> [--ids a,b]      fetch the files (skips existing)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, '..');
let dir = OUT;
for (let i = 0; i < 12 && !fs.existsSync(path.join(dir, '.env')); i++) dir = path.dirname(dir);
for (const line of fs.readFileSync(path.join(dir, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}
const TOKEN = process.env.VIMEO;
if (!TOKEN) throw new Error('VIMEO is not in the worktree .env');
const arg = (n) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : null; };
const H = { Authorization: `bearer ${TOKEN}`, Accept: 'application/vnd.vimeo.*+json;version=3.4' };
const get = async (u) => {
  for (let t = 0; t < 4; t++) {
    const r = await fetch(u.startsWith('http') ? u : `https://api.vimeo.com${u}`, { headers: H });
    if (r.status === 429) { await new Promise((s) => setTimeout(s, 25000)); continue; }
    if (!r.ok) throw new Error(`${r.status} ${u}`);
    return r.json();
  }
  throw new Error(`rate limited: ${u}`);
};

const videos = [];
let next = '/users/248712727/projects/29482006/videos?per_page=50&fields=uri,name,duration,width,height,created_time,download,description';
while (next) {
  const page = await get(next);
  videos.push(...page.data);
  next = page.paging?.next || null;
}
const rows = videos.map((v) => {
  const best = (v.download || []).filter((d) => d.type === 'video/mp4').sort((a, b) => (b.height || 0) - (a.height || 0))[0];
  return { id: v.uri.split('/').pop(), name: v.name, duration: v.duration, w: v.width, h: v.height, created: v.created_time, best: best ? { height: best.height, size: best.size, link: best.link } : null, description: (v.description || '').slice(0, 400) };
});
fs.writeFileSync(path.join(OUT, 'vimeo-folder.json'), JSON.stringify(rows.map(({ best, ...r }) => ({ ...r, best: best ? { height: best.height, size: best.size } : null })), null, 2));
for (const r of rows) console.log(`${r.id}  ${String(r.duration).padStart(4)}s  ${r.w}x${r.h}  ${r.best ? r.best.height + 'p ' + Math.round(r.best.size / 1e6) + 'MB' : 'no download'}  ${r.name}`);

const to = arg('download');
if (to) {
  const ids = arg('ids') ? arg('ids').split(',') : null;
  fs.mkdirSync(to, { recursive: true });
  for (const r of rows) {
    if (ids && !ids.includes(r.id)) continue;
    if (!r.best) continue;
    const f = path.join(to, `${r.id}.mp4`);
    if (fs.existsSync(f) && fs.statSync(f).size > 1000) { console.log(`have ${f}`); continue; }
    const res = await fetch(r.best.link);
    if (!res.ok) { console.log(`FAILED ${r.id} ${res.status}`); continue; }
    fs.writeFileSync(f, Buffer.from(await res.arrayBuffer()));
    console.log(`saved ${f} ${Math.round(fs.statSync(f).size / 1e6)} MB`);
  }
}
process.exitCode = 0;
