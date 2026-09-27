// Reply to each BugHerd task with what changed and move it to "done".
//   node reply-bugherd.mjs [--apply]     (reads BUGHERD from the worktree .env)
//
// REPLIES holds the CURRENT round only: a task listed there gets a comment and
// is moved to done. NOTES get a comment and keep their status (a closed task
// the agency re-opened in words, not in status). Earlier rounds' texts live in
// git history (round one: commit 43defebc) — never leave them here, or a re-run
// posts them again on tasks that are already closed.
import fs from 'node:fs'; import path from 'node:path';
const env = Object.fromEntries(fs.readFileSync(path.resolve('.env'),'utf8').split('\n').filter(l=>/^[A-Z_]+=/.test(l)).map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1).trim()]}));
const auth = 'Basic ' + Buffer.from(env.BUGHERD + ':x').toString('base64');
const APPLY = process.argv.includes('--apply');
const PROJECT = 541030;
const api = async (method, p, body) => { const r = await fetch('https://www.bugherd.com/api_v2/' + p, { method, headers: { authorization: auth, 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }); const t = await r.text(); if (!r.ok) throw new Error(`${method} ${p} -> ${r.status} ${t.slice(0,200)}`); return t ? JSON.parse(t) : null; };
// Round two, 2026-09-15.
const REPLIES = {
  14: 'Fixed, and this covers #11 too. Round one gave the reveal mask room below each line, but the line inside the mask was still clipping at its own edge, so the g, y and p tails stayed cut. Both now have room above and below, so descenders are complete on this headline and on every other split headline, including The Experience.',
  15: 'Done. The "Chapter 01" to "Chapter 07" numbering is gone from every section label. Each section keeps its short name (The Answer, Precision, The Surgeon and so on) as the small gold label above the headline. If you would rather drop those labels entirely, let us know and we will take them out.',
  16: 'Fixed. The photo is now framed on Dr. Barriere: his face is centred and complete, and the blurred foreground is cropped out. It also no longer drifts with the scroll, which was trimming the top of his head.',
  17: 'Fixed. In round one we changed Leslie\'s frame, but the photo on #7 was Emily\'s, so that was our misread. Emily now has the practice\'s own professional portrait of her (eyes open, full smile). The same blinking video frame was also on the Cosmetic Dentistry card in The Answer, so that card now shows the moment she sees her new smile in the mirror, taken from her B-roll.',
  18: 'Changed. The three review quotes are now set in Manrope, the site\'s text typeface, at regular weight with more line spacing, instead of the Bodoni headline face. Headlines keep Bodoni.',
};
const NOTES = {
  11: 'Picked up under #14: the line inside the reveal mask was still clipping. Fixed on every split headline, including this one.',
};
const tasks = (await api('GET', `projects/${PROJECT}/tasks.json`)).tasks;
for (const t of tasks) {
  const id = t.local_task_id, text = REPLIES[id], note = NOTES[id];
  if (!text && !note) continue;
  console.log(`#${id} [${t.status}] ${text ? '-> done' : '(comment only)'}: ${(text || note).slice(0,70)}…`);
  if (!APPLY) continue;
  await api('POST', `projects/${PROJECT}/tasks/${t.id}/comments.json`, { comment: { text: text || note } });
  if (text) await api('PUT', `projects/${PROJECT}/tasks/${t.id}.json`, { task: { status: 'done' } });
}
console.log(APPLY ? 'applied' : 'dry run — add --apply');
