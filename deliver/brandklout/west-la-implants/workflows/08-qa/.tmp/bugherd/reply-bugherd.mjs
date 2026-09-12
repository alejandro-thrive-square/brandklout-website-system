// Reply to each BugHerd task with what changed and move it to "done".
//   node reply-bugherd.mjs [--apply]     (reads BUGHERD from the worktree .env)
import fs from 'node:fs'; import path from 'node:path';
const env = Object.fromEntries(fs.readFileSync(path.resolve('.env'),'utf8').split('\n').filter(l=>/^[A-Z_]+=/.test(l)).map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1).trim()]}));
const auth = 'Basic ' + Buffer.from(env.BUGHERD + ':x').toString('base64');
const APPLY = process.argv.includes('--apply');
const PROJECT = 541030;
const api = async (method, p, body) => { const r = await fetch('https://www.bugherd.com/api_v2/' + p, { method, headers: { authorization: auth, 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }); const t = await r.text(); if (!r.ok) throw new Error(`${method} ${p} -> ${r.status} ${t.slice(0,200)}`); return t ? JSON.parse(t) : null; };
const REPLIES = {
  1: 'Fixed. The Bodoni headline now renders at weight 500 with a lower optical size, so the hairlines hold up on screen, and the not-yet-revealed words sit at 32% instead of 14% before the scroll lights them.',
  2: 'Fixed. The treatment cards are narrower, so four and a half of them are on screen at once and the rail travels about half as far. The "Not sure which is right for you?" card arrives with a short scroll now.',
  3: 'Fixed. The portrait no longer drifts with the scroll and is anchored near the top of the frame, so the head stays in view.',
  4: 'Fixed. The three photos in that strip now share one height, so top and bottom edges are flush.',
  5: 'Fixed. Headlines have more line height and the reveal masks leave room for descenders, so the g and y no longer clip.',
  6: 'Fixed. The patient quotes now use the sturdier weight and optical size of the headline face.',
  7: 'Fixed. Leslie now has a different frame from the same footage — full smile, eyes open, tablet clear.',
  8: 'Fixed. That was the story progress dots landing over the link once the story text grew taller than its container; the container is now sized from the tallest story and the dots sit below the link.',
  9: 'Fixed, same cause as #8 — the progress dots were overlapping the link. Resolved on all three stories.',
  10: 'Fixed. Michael\'s photo is now cropped from further left, so his face is fully in frame.',
  11: 'Fixed. More line height on the headline and room for descenders in the reveal masks.',
  12: 'Fixed. Hovering the reviews strip eases it to a stop; it resumes when the pointer leaves.',
  13: 'Fixed. The first answer now opens with Dr. Barriere: Ohio State, the NYU Langone surgical residency, 1,000+ hours of continuing education, and that surgery, restoration and cosmetic work happen under one roof.',
};
const tasks = (await api('GET', `projects/${PROJECT}/tasks.json`)).tasks;
for (const t of tasks) {
  const text = REPLIES[t.local_task_id]; if (!text) { console.log(`#${t.local_task_id} no reply prepared, skipped`); continue; }
  console.log(`#${t.local_task_id} [${t.status}] -> done: ${text.slice(0,70)}…`);
  if (!APPLY) continue;
  await api('POST', `projects/${PROJECT}/tasks/${t.id}/comments.json`, { comment: { text } });
  await api('PUT', `projects/${PROJECT}/tasks/${t.id}.json`, { task: { status: 'done' } });
}
console.log(APPLY ? 'applied' : 'dry run — add --apply');
