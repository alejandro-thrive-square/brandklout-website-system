// Answer BugHerd round five (2026-09-23): the 143 notes filed on 2026-09-21
// and 09-22 (#110-#253). #3 and #66 are left alone (still waiting on the
// agency). `done` only for notes verify-2026-09-23.mjs found live; the ones
// that need something from the agency stay in todo.
//
//   node reply-2026-09-23.mjs > reply-dry-2026-09-23.log          # dry run
//   node reply-2026-09-23.mjs --send > reply-send-2026-09-23.log  # posts; skips a comment already there
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
    const res = await fetch(`${API}${p}`, { method, headers: { Authorization: AUTH, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    if (res.status === 429) { await sleep(5000 * (i + 1)); continue; }
    const text = await res.text();
    if (!res.ok) throw new Error(`${method} ${p}: ${res.status} ${text.slice(0, 200)}`);
    await sleep(1100);
    return text ? JSON.parse(text) : {};
  }
  throw new Error(`rate limited: ${method} ${p}`);
}

const HERE = import.meta.dirname;
const DIR = path.join(HERE, "plan-2026-09-23");
const plans = fs.readdirSync(DIR).filter((f) => /^[A-Z]-.*\.json$/.test(f) && !f.includes("targets"))
  .flatMap((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")));
const byN = new Map(plans.filter((p) => p.n != null).map((p) => [p.n, p]));
const fills = plans.filter((p) => p.n == null);

const LIVE = "Live on staging.masonparkdental.com.";
const D = (s) => ({ status: "done", text: `Done. ${s} ${LIVE}` });
const Q = (s) => ({ status: "todo", text: s });
const where = (p) => {
  const sec = { qualify: '"Is this the treatment you need?"', why: '"Why this one"', process: "the steps", compare: "the comparison", proof: "the reviews section", arrival: "the hero at the top of the page", invitation: "the invitation at the foot of the page", range: "the services range", treatment: "the treatment section", reach: '"How to reach us"', wall: "the photo wall", practices: "the practices section", building: "the building mosaic", people: "the team band" }[p.section] || p.section;
  return p.card ? `card ${String(p.card).replace(/^arc(\d) item(\d)$/, "$2 of arc $1")} of ${sec}` : sec;
};
const EMPTY = "BugHerd stored the photo on this note as an empty file (0 bytes), so there was nothing to download. Could you attach it again?";

const replies = {};
for (const [n, p] of byN) {
  if (p.action === "replace") replies[n] = D(`The photo you attached is in ${where(p)}, cropped to the frame's shape (${p.aspect}).`);
  if (p.action === "add-media") replies[n] = D(`This card now has the same format as 01: the photo you attached sits on top of it, cropped ${p.aspect} like the others.`);
}
// The notes that need more than the default line.
Object.assign(replies, {
  120: D("The building is now the invitation photo on every page that has one (57 pages, plus every blog page), and the caption under it reads \"Suite 104A, on the ground floor. Free parking at the door.\" About is the one exception: its hero is now the same building (#122), so its invitation keeps the corridor rather than showing the building twice."),
  179: D("The front-desk photo is now the portrait in the reviews section on every page that has one (37 pages). Three pages keep the photo you chose for them in their own notes: Patient Reviews (#126), Oral Cancer Screening (#139) and Contact (#165)."),
  160: D("The building is now the photo in the sidebar of every blog article (all 161, through the one article template)."),
  164: D("All three doctor cards now have the same format, each with that doctor's own front-facing portrait: Dr. Sung, Dr. Cho and Dr. Tam Nguyen. The three are portrait-shaped so faces are not cropped."),
  158: D("The four topic squares are now one height at every width, and every topic name holds one line from 992px up (checked at 1280, 1512 and 2560)."),
  159: D("The brown rectangle is gone. It was the grid's own background showing through the empty cells of an unfilled last row; the lines are now drawn by each article card, so an empty cell is just the page."),
  201: D("The photo now sits lower in the frame, so the patient in the chair shows under the scanner screen."),
  237: D("The photo you attached is on card 2, in the same format as 01. The crop stops above the bags the girls are holding, so no Colgate branding shows (the same thing #239 asked for on this page)."),
  239: D("The photo is replaced with the one you attached, which has no logos in it."),
  // Empty attachments. Where the note is a card of the grid, the card has a
  // photo of our own in the meantime so the grid is complete.
  112: Q(EMPTY),
  125: Q(EMPTY),
  185: Q(EMPTY),
  182: Q(`${EMPTY} In the meantime card 03 has a photo so the grid is complete (a dental mirror checking an adult's back teeth); send yours and it replaces it.`),
  195: Q(`${EMPTY} In the meantime card 03 has a photo so the grid is complete (close-up of chipped, uneven front teeth); send yours and it replaces it.`),
  228: Q(`${EMPTY} In the meantime card 03 has a photo so the grid is complete (inflamed lower gums); send yours and it replaces it.`),
  235: Q(`${EMPTY} In the meantime card 06 has a photo so the grid is complete (a man lifting his lip to show a swollen patch of gum); send yours and it replaces it.`),
  252: Q(EMPTY),
  // Duplicates on one page.
  178: Q("This is the same photo as #147, which is now on card 02 of \"Is this the treatment you need?\" on this same page. Two of one picture on a page reads as a mistake, so this one is not placed yet. Could you send a different photo for this spot?"),
  202: Q("This is the same shade-guide photo as #206, which is now on card 04 of \"Is this the treatment you need?\" on this same page. Could you send a different photo for this card, so the page does not show it twice?"),
});

const { tasks } = JSON.parse(fs.readFileSync(path.join(HERE, "tasks-2026-09-23.json"), "utf8"));
const open = tasks.filter((t) => !["done", "closed"].includes(t.task.status) && t.task.local_task_id >= 110);
const missing = open.map((t) => t.task.local_task_id).filter((n) => !replies[n]);
if (missing.length) { console.log(`NO REPLY for: ${missing.join(", ")}`); process.exit(1); }
console.log(`${open.length} open notes, ${Object.values(replies).filter((r) => r.status === "done").length} done, ${Object.values(replies).filter((r) => r.status === "todo").length} todo; ${fills.length} extra cards filled without a note`);

for (const rec of open) {
  const n = rec.task.local_task_id, id = rec.task.id, reply = replies[n];
  console.log(`\n#${n} [${rec.task.status} -> ${reply.status}] ${rec.task.url}\n  ${reply.text}`);
  if (!SEND) continue;
  const { comments } = await call("GET", `/tasks/${id}/comments.json`);
  if (!comments.some((c) => c.text === reply.text)) await call("POST", `/tasks/${id}/comments.json`, { comment: { text: reply.text } });
  if (rec.task.status !== reply.status) await call("PUT", `/tasks/${id}.json`, { task: { status: reply.status } });
}
