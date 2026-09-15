// Answer every note of BugHerd project 539151 after the 2026-09-15 push.
// One comment per task; `done` only for notes verified live on staging, the
// rest stay in todo with a question for the agency.
//
//   node reply-2026-09-15.mjs          # dry run: prints what it would send
//   node reply-2026-09-15.mjs --send   # posts; skips a task that already has the same comment
//
// Output goes to a file, not a pipe (Node on Windows dies on a pipe).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const SEND = process.argv.includes("--send");
const PROJECT = 539151;
const env = fs.readFileSync(path.join(os.homedir(), ".webzite", ".env"), "utf8");
const KEY = env.match(/^BUGHERD=(.*)$/m)[1].trim().replace(/^["']|["']$/g, "");
const AUTH = "Basic " + Buffer.from(`${KEY}:x`).toString("base64");
const API = `https://www.bugherd.com/api_v2/projects/${PROJECT}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function call(method, p, body) {
  for (let i = 0; i < 5; i++) {
    const res = await fetch(`${API}${p}`, {
      method,
      headers: { Authorization: AUTH, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 429) { await sleep(5000 * (i + 1)); continue; }
    const text = await res.text();
    if (!res.ok) throw new Error(`${method} ${p}: ${res.status} ${text.slice(0, 200)}`);
    await sleep(1100);
    return text ? JSON.parse(text) : {};
  }
  throw new Error(`rate limited: ${method} ${p}`);
}

const LIVE = "Live on staging.masonparkdental.com, checked in Safari's engine at your 1512 px window.";
const D = (s) => ({ status: "done", text: `Done. ${s} ${LIVE}` });
const Q = (s) => ({ status: "todo", text: s });

const REPLIES = {
  1: Q("We looked for the photo of Dr. Nguyen and Dr. Sung with their kids in the practice's 212-photo marketing album, the old site's uploads and Grand Mission's site, and it is not in any of them. Could you send it at full size? It goes straight into the home page's first photograph. Leaving this open until then."),
  2: D("The photo stack in the hero links to the Team page, and its top photo flips through the three frames."),
  3: Q("Thanks for the screenshot. It showed this was Safari 26.6 on a Mac at 1512 px, which is why we could not reproduce it in Chrome. The logo now has a few pixels of room inside its box, so Safari cannot clip the bottom of DENTAL when it rounds the box. Safari's engine renders the logo whole on our side, but we cannot run Safari 26 itself here: could you take one more look in Safari and close this if the logo is whole?"),
  4: D("The lede reads \"sharing one building and serving families across Harris County.\""),
  5: D("The caption under the waiting room photo now has clear space between it and the picture."),
  6: D("Reworked this round: the sentence \"It is the reason a child's check gets postponed...\" now has a photograph of the front counter beside it, so it no longer hangs on its own in white space."),
  7: D("\"Sit back, relax, and watch your favorite show.\""),
  8: D("The heading is now positive: \"How one building saves your family time.\""),
  10: D("It now says two specialties under one roof, each with its own suite and its own waiting area."),
  11: D("It now describes a dedicated adult practice with its own waiting area, for adults coming in their own right and not only as part of a family."),
  12: D("\"Inside the adult practice\"."),
  13: D("It now says a specialized team focused on adult needs, with a separate waiting area for adults."),
  14: D("\"Lifelong beautiful healthy smiles.\""),
  15: D("The heading is about the doctors now, and the cards run Dr. Nguyen, Dr. Cho, then Dr. Sung."),
  16: D("Dr. Sung's portrait is a Grand Mission photograph with his arms down, here and on About, Our Doctors, Our Team and every treatment page."),
  17: D("The sedation line is removed; the card uses a line from his own bio instead."),
  18: D("Dr. Sung's note reads \"Fellow of the Academy of General Dentistry.\""),
  19: D("Dr. Nguyen's note reads \"Board certified. The children's side of the hall.\""),
  20: D("\"Behind the doctors, a dedicated and specialized team that keeps both the general and the pediatric practice running.\""),
  21: D("Changed again this round: the band uses a different album frame, with the team member in front laughing, cropped to faces rather than heads bowed over paper."),
  22: D("Rewritten as \"Then your next visit is booked before you leave, with the same hygienist.\""),
  23: D("The first card is now a real Google review that names Dr. Nguyen (Erica Marrero, August 2026)."),
  24: D("The \"Credentialed by\" label is brighter against the dark strip."),
  25: D("The Seattle Study Club mark is larger and readable."),
  26: D("The AAPD mark is larger and readable."),
  27: D("\"Come and see for yourself.\""),
  28: D("The answer names the practice: Mason Park Dental of Katy."),
  29: D("The practice is called Mason Park Dental of Katy in every answer."),
  30: D("The answer links to the page on the site that covers it."),
  31: D("The answer is rewritten and names the practice correctly."),
  32: D("The name is corrected to Mason Park Dental of Katy."),
  33: D("The answer links to New Patients, Patient Resources and Contact instead of only saying to call."),
  34: D("The order is Dr. Nguyen, Dr. Cho, then Dr. Sung."),
  35: D("\"Two practices - Two addresses, one building\"."),
  36: D("The seal's centre is the tree from the logo."),
  37: D("The credential strip is off About and every other inner page; it stays on the home page only."),
  38: D("The three doctor portraits are the same size and appear together."),
  39: D("That paragraph is rewritten in plain terms."),
  40: D("The photograph is a landscape frame, so nobody's head is cut off."),
  41: D("The inner pages now open on a split layout, copy on dark with the photograph to the right, so they no longer look like the home page's opening."),
  42: D("The two doctor columns share rows, so the titles, names, bios and credentials line up across both."),
  43: Q("We have not received these yet. Could you share the Canva team photos, either an export of the originals or view access to the design? The slot on the Team page where the named team section used to be is ready for them. Leaving this open until then."),
  44: D("The section naming team members is removed; the Team page names nobody."),
  45: D("Reworked this round. The tall photo beside \"Low turnover...\" is now a portrait photograph, so nobody is cut off at the edge. And yes, there were others: the practice's album has 212 photos, and the Team page now uses ten that appear nowhere else on the site, so none of its team photos repeat the home page."),
  46: D("The page leads with the three doctors: the opening, the byline strip, the statement and the invitation."),
  47: D("Under Emergencies: \"Youth sports season? Ask about our mouthguards. #momlife #youthsports #askaboutourmouthguards\", linked to the mouth guards page."),
  48: D("The seal's centre is the tree, not the star."),
  49: D("Rewritten as \"Every review on this page is a patient's own words, taken from the practice's Google profile and shown whole.\""),
};

const { tasks } = JSON.parse(fs.readFileSync("tasks-2026-09-15.json", "utf8"));
const missing = tasks.map((t) => t.task.local_task_id).filter((n) => !REPLIES[n]);
if (missing.length) throw new Error(`no reply written for #${missing.join(", #")}`);

const log = [];
for (const { task: t } of tasks) {
  const n = t.local_task_id;
  const r = REPLIES[n];
  if (!SEND) { console.log(`#${n} -> ${r.status}  ${r.text}`); continue; }
  const { comments } = await call("GET", `/tasks/${t.id}/comments.json`);
  if (comments.some((c) => c.text === r.text)) console.log(`#${n} comment already there`);
  else { await call("POST", `/tasks/${t.id}/comments.json`, { comment: { text: r.text } }); console.log(`#${n} commented`); }
  if (r.status !== t.status) {
    const { task } = await call("PUT", `/tasks/${t.id}.json`, { task: { status: r.status } });
    console.log(`#${n} status ${t.status} -> ${task.status}`);
  }
  log.push({ n, id: t.id, status: r.status, text: r.text });
}
if (SEND) fs.writeFileSync("replies-2026-09-15.json", JSON.stringify(log, null, 1));
console.log(`${SEND ? "sent" : "dry run"}: ${tasks.length} tasks, ${Object.values(REPLIES).filter((r) => r.status === "done").length} to done`);
