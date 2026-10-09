// Round three, 2026-10-09: reply to each pin with what changed and move it to "done".
//   node reply-round3.mjs [--apply]     (run from the worktree root: reads BUGHERD from .env)
// Pins are addressed by their global id from 2026-10-09/tasks.json, not by a list call: the list
// endpoint returns 100 tasks a page and this board has 112.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(fs.readFileSync(path.resolve('.env'), 'utf8').split('\n').filter((l) => /^[A-Z_]+=/.test(l)).map((l) => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).trim()]; }));
const auth = 'Basic ' + Buffer.from(env.BUGHERD + ':x').toString('base64');
const APPLY = process.argv.includes('--apply');
const PROJECT = 541030;
const SITE = 'https://west-la-implants-production.up.railway.app';
const api = async (method, p, body) => { const r = await fetch('https://www.bugherd.com/api_v2/' + p, { method, headers: { authorization: auth, 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }); const t = await r.text(); if (!r.ok) throw new Error(`${method} ${p} -> ${r.status} ${t.slice(0, 200)}`); return t ? JSON.parse(t) : null; };
const ids = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(HERE, '2026-10-09', 'tasks.json'), 'utf8')).map((t) => [t.local_task_id, t.id]));

const IMG = 'Replaced with the image you attached.';
const TOP = 'Done: this section is now the first one after the hero, and The Reality is second.';
const LORA = 'Changed to Lora SemiBold on every "The Proof" heading across the site.';
const REPLIES = {
  39: 'Done on every page with this section: it no longer pins or scrolls. The three boxes show at once, all with the gold border, and Full arch keeps its highlight.',
  40: IMG, 48: IMG, 57: IMG, 58: IMG, 61: IMG, 62: IMG, 67: IMG, 70: IMG, 71: IMG, 73: IMG, 75: IMG, 77: IMG, 79: IMG, 81: IMG,
  83: IMG, 84: IMG, 85: IMG, 86: IMG, 87: IMG, 93: IMG, 99: IMG, 100: IMG, 101: IMG, 102: IMG, 104: IMG, 105: IMG, 106: IMG,
  107: IMG, 108: IMG, 110: IMG, 112: IMG,
  41: 'Done: The Reality on the home page no longer pins; the whole statement shows at once.',
  42: 'Done on every page with this banner: it no longer pins or writes itself on scroll. The whole text shows at once.',
  43: 'Added: a gold "Scroll" cue with a moving line under the step counter, on every steps section that pins. It fades out once the last step is reached.',
  44: 'Done: The Workflow is now the first section after the hero, and The Reality is second.',
  45: 'Done on every page with this list: the rows no longer light up with the scroll. Every row is shown, and the row under the mouse is highlighted (gold title and bar, the other rows dim).',
  46: 'Added on every page with this section (same cue as #43).',
  47: 'Replaced with the front desk photo on Dental Implants and on the six neighbourhood pages that carry the same four-visit plan.',
  49: 'Done on every page with the before/after: the photo no longer changes with the scroll. Hovering swaps it to the after, and moving the mouse away swaps it back. On phones a tap swaps it.',
  50: LORA, 51: LORA, 96: LORA,
  52: 'Changed to "Your questions about our technology, answered."',
  53: 'Changed to "Frequently asked questions".',
  54: 'Centred: Dr. Barriere\'s whole head is in the frame now, and the photo no longer drifts with the scroll (the drift was cutting off the top).',
  55: 'Done, same as #42: no pinning, the whole text shows at once.',
  56: 'Done: The Training is now the first section after the hero, and The Philosophy is second.',
  59: `Done: a new page, Surgery & Care (${SITE}/surgery-and-care), in the top menu after Implants. It has a photo card for each of IV sedation; Bone, sinus & ridge grafting; Tooth extractions; Periodontics; Missing teeth & loose dentures; Cosmetic dentistry; and General dentistry.`,
  60: `Done: a new page, The Practice (${SITE}/the-practice), in the top menu before Contact, with cards for Our team, Your first visit, Questions, Journal, Referring doctors and Contact. To make room for the two new links, the phone number left the top bar (it stays on the buttons, in the footer and on the phone bar). Below 1280px wide, the links fold into the menu.`,
  63: TOP, 72: TOP, 74: TOP, 76: TOP, 78: TOP, 80: TOP, 82: TOP, 88: TOP, 89: TOP, 92: TOP, 103: TOP, 111: TOP,
  64: 'Changed to Playfair Display SemiBold on the questions heading of every page, the same face as the main titles.',
  65: 'Done on every page: the name and the line sit centred on top, on two lines. Below them, the five columns (Los Angeles office, Hours, Dental implants, Surgery & care, The practice) share one row.',
  66: 'Changed to Lora SemiBold on this banner on every page, and on the matching Reality statement on the home page, so they stay consistent.',
  68: 'Centred: the denture now sits in the middle of the frame.',
  90: 'Fixed: the comma now stays on the line with "back". The same fix went onto three other headings with the same pattern (Financing, Sedation, Zirconia).',
  91: 'Centred: the denture is now fully in the frame.',
  94: 'Done: the statement sits on the left, and the six services are a list on the right that opens like the FAQ rows, as in your screenshot. The separate scrolling services section is gone.',
  95: 'Centred: the whole team is in the frame now.',
  97: 'Changed to Cormorant Garamond SemiBold on every proof quote.',
  98: 'Done: The Team now comes before The Rooms.',
  109: 'Fixed: the comma now stays on the line with "surgery" (see #90).',
};
const NOTES = {
  69: 'This pin came through without an attachment, so the image is unchanged for now. Could you attach the replacement for the "How a hybrid is built" image? We will swap it as soon as it arrives.',
};
for (const [n, text] of [...Object.entries(REPLIES).map(([n, t]) => [n, t]), ...Object.entries(NOTES)]) {
  const id = ids[n];
  if (!id) throw new Error(`#${n}: no id in tasks.json`);
  const done = !!REPLIES[n];
  console.log(`#${n} ${done ? '-> done' : '(comment only)'}: ${text.slice(0, 80)}`);
  if (!APPLY) continue;
  await api('POST', `projects/${PROJECT}/tasks/${id}/comments.json`, { comment: { text } });
  if (done) await api('PUT', `projects/${PROJECT}/tasks/${id}.json`, { task: { status: 'done' } });
}
console.log(`${Object.keys(REPLIES).length} done, ${Object.keys(NOTES).length} comment only. ${APPLY ? 'applied' : 'dry run: add --apply'}`);
