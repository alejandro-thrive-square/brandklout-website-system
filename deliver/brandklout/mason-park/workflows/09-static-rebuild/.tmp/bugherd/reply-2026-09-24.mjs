// Close BugHerd round six (2026-09-24): the twelve notes left in todo after
// round five. Eight had an empty attachment and two repeated a photo already
// on their page; each now has a photograph chosen for its card's copy
// (plan-2026-09-24/G-open.json), or keeps the stand-in placed on 09-23. #3 is
// re-checked in WebKit, #66 links Cherry. All twelve go to done.
//
//   node reply-2026-09-24.mjs > reply-dry-2026-09-24.log          # dry run
//   node reply-2026-09-24.mjs --send > reply-send-2026-09-24.log  # posts; skips a comment already there
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

const LIVE = "Live on staging.masonparkdental.com.";
const NOFILE = "Your attachment never reached us (BugHerd stored it as an empty file), so we chose one for the card's copy.";
const AGAIN = "If you had a different photo in mind, open a new note with it attached and we will swap it.";
const D = (s) => ({ status: "done", text: `Done. ${s} ${LIVE}` });
const replies = {
  3: D("Checked again today in Safari's engine at your 1512 px width, and at 1440 and 1920, at the top of the page and with the header stuck after a scroll: the logo is whole every time, with DENTAL fully visible, and nothing around it clips it. Closing this one. If Safari 26 still cuts it on your Mac, reopen it with a screenshot and we will look again."),
  66: D("Cherry is now linked. The Cherry heading in the table and a new \"Apply with Cherry\" button both open the practice's Cherry page (pay.withcherry.com/grand-mission-dentistry), the same one the old Mason Park site used. It is Grand Mission Dentistry's Cherry account, and Mason Park Dental (21830 Kingsland Blvd, Ste 104A) is one of its locations, so the row now tells patients to choose Mason Park Dental as their location."),
  112: D(`${NOFILE} The Hygiene and Gum Care thumbnail is now a hygienist's hand with a mirror and scaler at a patient's teeth. ${AGAIN}`),
  125: D(`${NOFILE} The hero is now a patient laughing in the dental chair, placed on the right so she sits clear of the headline. ${AGAIN}`),
  178: D(`The photo you attached is the one #147 already put on this page, so we chose a different one for "What grinding costs if you leave it": a close-up of teeth worn down and broken at the edges. ${AGAIN}`),
  182: D(`${NOFILE} Card 03 has had its photo since 09-23: a mirror checking an adult's back teeth, in the same format as 01. ${AGAIN}`),
  185: D(`${NOFILE} Step 01, "Oral examination", is now a dentist checking a patient's teeth and gums with a mouth mirror. ${AGAIN}`),
  195: D(`${NOFILE} Card 03 has had its photo since 09-23: a close-up of chipped, uneven front teeth, in the same format as 01. ${AGAIN}`),
  202: D(`The photo you attached is the shade guide #206 already put on card 04 of this page, so we chose a different one for "It looks and feels like a tooth": an implant crown shaped and shaded to match the teeth beside it. ${AGAIN}`),
  228: D(`${NOFILE} Card 03 has had its photo since 09-23: inflamed lower gums, in the same format as the others. ${AGAIN}`),
  235: D(`${NOFILE} Card 06 has had its photo since 09-23: a man lifting his lip to show a swollen patch of gum. ${AGAIN}`),
  252: D(`${NOFILE} Card 01, "Jaw pain or tenderness", is now a woman pressing her hand to a sore jaw. ${AGAIN}`),
};

const HERE = import.meta.dirname;
const { tasks } = JSON.parse(fs.readFileSync(path.join(HERE, "tasks-2026-09-24.json"), "utf8"));
const open = tasks.filter((t) => !["done", "closed"].includes(t.task.status));
const missing = open.map((t) => t.task.local_task_id).filter((n) => !replies[n]);
if (missing.length) { console.log(`NO REPLY for: ${missing.join(", ")}`); process.exit(1); }
console.log(`${open.length} open notes, all to done`);

for (const rec of open) {
  const n = rec.task.local_task_id, id = rec.task.id, reply = replies[n];
  console.log(`\n#${n} [${rec.task.status} -> ${reply.status}] ${rec.task.url}\n  ${reply.text}`);
  if (!SEND) continue;
  const { comments } = await call("GET", `/tasks/${id}/comments.json`);
  if (!comments.some((c) => c.text === reply.text)) await call("POST", `/tasks/${id}/comments.json`, { comment: { text: reply.text } });
  if (rec.task.status !== reply.status) await call("PUT", `/tasks/${id}.json`, { task: { status: reply.status } });
}
