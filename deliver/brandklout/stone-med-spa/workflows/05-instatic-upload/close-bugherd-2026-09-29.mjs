// BugHerd round 2 (tasks filed 2026-09-28 on production, project 540569): one
// reply per task with the scope of the fix, then status "done" — except the
// ones in OPEN, which get the reply only. Fixes are on STAGING
// (https://staging.westlaketxmedspa.com) and reach production with the next push.
//   node close-bugherd-2026-09-29.mjs          dry run
//   node close-bugherd-2026-09-29.mjs --apply
import fs from 'node:fs';
import path from 'node:path';

const APPLY = process.argv.includes('--apply');
const env = fs.readFileSync(path.resolve('../../../../../.env'), 'utf8');
const key = env.match(/^BUGHERD[A-Z_]*=(.*)$/m)[1].trim().replace(/^["']|["']$/g, '');
const auth = 'Basic ' + Buffer.from(key + ':x').toString('base64');
const API = 'https://www.bugherd.com/api_v2/projects/540569';
const call = async (method, p, body) => {
  const r = await fetch(API + p, { method, headers: { Authorization: auth, 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
  if (!r.ok) throw new Error(`${method} ${p} ${r.status} ${await r.text()}`);
  return r.json();
};

const ADDR = 'Updated to 72 Andorra Dr #110B, Westlake, TX 76262. Scope: site-wide: footer, mobile menu, home, about, book, both legal pages and the Google business data.';
const HRS = 'Hours updated (Mon/Tue/Thu 9-5, Wed 9-3, Fri 9-4, Sat and Sun closed). Scope: site-wide: footer, home, about, book and the Google business data. The "Monday to Friday, 9 to 5" lines on /book now say "during office hours".';
const R = {
  9: 'The home paragraph now says more about Brooke (every injection, assessment first, conservative first treatment, two-week check), with Abby kept to one line. Scope: this section only. Abby\'s photo still needs exporting from Canva (see #10).',
  27: 'Cover photo is now AdobeStock_650016960. Scope: /book only.',
  43: ADDR, 48: ADDR, 71: ADDR,
  44: 'Hover text is dark on the pale hover ground now. Scope: site-wide (it is the footer).',
  45: HRS, 49: HRS, 72: HRS,
  46: 'Removed the three counters. Scope: this section only.',
  47: 'Added AdobeStock_1239857524 beside the heading. Scope: home only.',
  50: 'Removed "4 categories". Scope: /treatments only.',
  51: 'The concern buttons are now links: a click filters the menu to the treatments for that concern and scrolls to it, and hovering shows a short description plus the treatments that address it. Scope: /treatments.',
  52: 'Removed. Scope: /results only.',
  53: 'Removed. Scope: /results only.',
  54: 'Hidden. The markup is kept so it can come back when the photos exist. Scope: /results. The same "coming soon" before-and-after block was also removed from every treatment page (#84).',
  55: 'Added more space above the button. The section is hidden for now (#54), so this shows when it returns.',
  56: 'Replaced with AdobeStock_762330323. Scope: /results only.',
  57: 'Added AdobeStock_787188527 as a fourth photo in this group. Scope: /results only.',
  58: 'The FAQ now has your four questions, with answers. Scope: /results only.',
  59: 'Replaced with AdobeStock_215075562. Scope: /membership only.',
  60: 'Replaced with AdobeStock_499428126. Scope: /membership only.',
  61: 'Text updated as written. Scope: /about only.',
  62: 'Removed the counters. Scope: /about only.',
  63: 'Replaced with AdobeStock_53030805. Scope: /about only.',
  64: 'The photo now links to Stone Surgical Arts (stonesurgicalarts.com forwards to dfwsurgicalarts.com, so it links there directly, like the other Stone Surgical Arts links on the site).',
  65: 'Replaced with AdobeStock_1897564576. Scope: /about only.',
  66: 'Replaced with AdobeStock_488415212. Scope: /about only.',
  67: 'Replaced with AdobeStock_464662801. Scope: /about only.',
  68: 'Replaced with AdobeStock_841023051. Scope: /about only.',
  69: 'Replaced with AdobeStock_463678093. Scope: /about only.',
  70: 'Cover photo is now AdobeStock_852584205. Scope: /about only.',
  73: 'Still open. The form\'s colors (the blue Submit button and the blue dropdown highlight) are set inside Go High Level\'s form builder, not on the website. Someone with GHL access needs to change the button and highlight to the site green (#8FBC46). The consent text there still names Stone Surgical Arts PLLC too.',
  74: 'Removed. Scope: /book only.',
  75: 'The form has no visit-type field, so the "By video" card now says to call and its button calls the office; the in-person card sends people to the form. If you want the form to ask in person vs video, a field can be added in Go High Level.',
  76: 'Replaced with AdobeStock_641655757. Scope: /book only.',
  77: '"Stone Surgical Arts" in this sentence now links to the Stone Surgical Arts site (stonesurgicalarts.com forwards to dfwsurgicalarts.com).',
  78: 'Replaced with AdobeStock_447146038. Scope: /meet-the-doctor only.',
  79: 'Replaced with AdobeStock_411774974. Scope: /meet-the-doctor only.',
  80: 'Removed. Scope: /meet-the-doctor only.',
  81: 'Removed (the markup is kept for when there is something to show). Scope: /meet-the-doctor only.',
  82: 'The photo is now centered in its half of the section. Scope: site-wide: every treatment page shares this section, so all twelve changed.',
  83: 'Replaced with AdobeStock_249940566. Scope: Botox and Dysport & Jeuveau (both are neuromodulator injections, and the photo fits both). The other treatment pages keep their own photos.',
  84: 'Removed. Scope: site-wide: the same placeholder was on every treatment page and is gone from all twelve.',
  85: 'Every question now names its treatment ("Does Botox hurt?", "How long do dermal fillers last?", and so on). Scope: site-wide: the FAQs on all twelve treatment pages and on /financing.',
  86: 'Replaced with AdobeStock_544821297. Scope: site-wide: this is the membership card, and it shows the new photo on every page that carries it.',
  87: 'Treatments in the top menu now opens a dropdown with all twelve treatment pages, grouped by category; the mobile menu lists them under All treatments. Scope: site-wide.',
};
const OPEN = new Set([73]);
const STAGING = ' Live on staging now; it goes to the live site with the next production push.';

const list = [];
for (let page = 1; ; page++) { const r = await call('GET', `/tasks.json?page=${page}`); list.push(...r.tasks); if (r.tasks.length < 100) break; }
const byLocal = Object.fromEntries(list.map((t) => [t.local_task_id, t]));
for (const [n, text] of Object.entries(R)) {
  const t = byLocal[n];
  if (!t) { console.log(`#${n} not open, skipped`); continue; }
  const body = OPEN.has(+n) ? text : text + STAGING;
  console.log(`#${n} ${OPEN.has(+n) ? 'reply only' : 'reply + done'}`);
  if (!APPLY) continue;
  await call('POST', `/tasks/${t.id}/comments.json`, { comment: { text: body } });
  if (!OPEN.has(+n)) await call('PUT', `/tasks/${t.id}.json`, { task: { status: 'done' } });
}
