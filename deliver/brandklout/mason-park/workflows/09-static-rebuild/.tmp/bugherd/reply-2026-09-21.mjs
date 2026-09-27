// Answer BugHerd round four (2026-09-21): the 32 notes filed on 2026-09-16,
// 09-18 and 09-19 (#78-#109), and the two still open from earlier rounds
// (#3, #66). Every other note is left alone. `done` only for notes verified
// live on staging by verify-2026-09-21.mjs; the two that need something from
// the agency stay in todo.
//
//   node reply-2026-09-21.mjs > reply-dry-2026-09-21.log          # dry run
//   node reply-2026-09-21.mjs --send > reply-send-2026-09-21.log  # posts; skips a comment already there
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

const LIVE = "Live on staging.masonparkdental.com, checked in Chrome at your 2560 x 1305 window.";
const D = (s) => ({ status: "done", text: `Done. ${s} ${LIVE}` });
const Q = (s) => ({ status: "todo", text: s });

// Seven notes, one cause. The same answer goes on all of them.
const PHONE =
  "This one is worth explaining, because the link was never broken. Every phone number on the site is a `tel:` link, which is what a phone number has to be: on a phone it opens the dialler, and that is how most people reach the practice. On a desktop the browser hands `tel:` to Windows, and if nothing on that machine is registered to answer phone links, Windows does nothing at all — no page, no error, no dialler. From your side that is indistinguishable from a dead button, and you were right to file it. " +
  "We checked it properly rather than guessing: on the published pages nothing intercepts or cancels the click, so the link itself is sound. What was missing was an answer. Clicking a phone number on a computer now copies it to your clipboard and shows a short “Copied (281) 769-8878” confirmation next to the button, so the click always does something you can see. On a phone nothing changed — it still dials. The number is unchanged everywhere: (281) 769-8878.";

const HOURS =
  "The opening hours now read Monday to Wednesday 9am to 6pm, Thursday 9am to 5pm, Friday to Sunday closed. They were in five different places on every page — the strip at the very top, the hours list in the footer, the details block in the closing section, the list on the Contact page, and the hidden data Google reads for the practice's listing — and all five are updated on all 61 pages, the blog included. The Google listing data matters most: it is what a search result shows under the practice's name.";

const SUNG =
  "This was the photograph itself, not the layout. Dr. Sung's portrait was cut from a photograph of him standing next to Dr. Nguyen, and the crop left him off to one side of his own frame, so no amount of positioning could centre him. The picture is re-cut from the original: he is now on the centre line, with Dr. Nguyen fully out of frame. It is the same file everywhere he appears, so About, Meet the Team, Meet the Doctors and every service page are all corrected at once. It is a tighter crop than Dr. Nguyen's and Dr. Cho's, because that is as wide as the original allows without her appearing beside him — if the practice can take a proper solo portrait of him, send it and we will drop it in.";

const REPLIES = {
  /* --- still open from earlier rounds ----------------------------------- */
  3: Q("Still in place after today's update: the logo file carries transparent space on every side, which no rounding can cut into, and it is the file serving on every page. We cannot run Safari 26 here. Could you take one more look and close this if DENTAL is whole?"),
  66: Q("Still waiting on one thing from the practice: Mason Park's own Cherry application link (it usually looks like pay.withcherry.com/<practice-name>). Cherry's site blocks automated lookups and the link is not on the old site or in Asana. Send it over and the Cherry column becomes a link with an Apply button the same day."),

  /* --- the hours -------------------------------------------------------- */
  78: D(HOURS),
  83: D(HOURS),

  /* --- the phone number ------------------------------------------------- */
  79: D(PHONE),
  80: D(PHONE),
  81: D(PHONE),
  82: D(PHONE),
  84: D(PHONE),
  97: D(PHONE),
  100: D(PHONE),

  /* --- framing ---------------------------------------------------------- */
  85: D(SUNG),
  88: D(SUNG),
  92: D(SUNG),
  106: D(SUNG),
  86: D("The frame is taller than the photograph is, so it was cutting the sides, and the two hygienists stand right of the middle of the shot — which put the second one half outside the frame. The crop is shifted to follow them; both are fully in the picture now, chart included."),
  91: D("Same cause as the one on the Doctors page: a square tile cropping a wide photograph down the middle, with the pair standing to the right of it. The crop follows them now and both are whole."),

  90: D("It was telling you, but somewhere you would never look: the caption was written into the single line of small type under the whole grid, several hundred pixels away from the photograph your pointer was on. It now appears on the photograph itself, across the bottom of the tile you are hovering, and the line under the grid still follows along for anyone reading with a keyboard."),

  /* --- type ------------------------------------------------------------- */
  87: D("You were reading a real bug, not a design choice. A styling rule meant for the small caption underneath was also catching the number, so “100” was being set at caption size while “hrs” stayed at heading size. Fixed at the source, so all four figures now read the way they were meant to: the number large, the unit small beside it."),
  93: D("All seven group names sit on one line now, from laptop width up. They were wrapping because the row needed about two pixels more than it had at your window size — the names are set slightly smaller and closer together, which leaves 13% to 20% of the row empty at every width instead of two pixels. Below laptop width the row is genuinely too narrow for seven names at that size and still wraps, which is the right behaviour there."),

  /* --- the services finder --------------------------------------------- */
  94: D("Row 02 now opens Root Canal Therapy."),
  95: D("Row 03 now opens Bonding."),
  96: D("Row 04 now opens Dental Implant Restorations."),
  98: D("Row 08 now opens Sedation Dentistry."),
  99: D("Row 09 now opens Extractions. Two more rows had the same problem and you had not got to them yet, so they are done too: row 06 (a cracked tooth or an old filling) opens Composite Fillings and row 07 (jaw pain or grinding) opens TMJ and TMD. Row 10, the free second opinion, has no treatment page of its own, so it still goes to the booking section at the foot of the page — tell us if you would rather it went to Contact."),

  /* --- the photographs -------------------------------------------------- */
  89: D("Replaced with your photograph of the two patients on the waiting room sofa. The caption line beside it now reads “The wait, and the desk”, so it still describes what the two pictures show."),
  101: D("Replaced with the photograph you attached."),
  102: D("Added to card 02."),
  104: D("Added to card 04."),
  105: D("Added to the “Gum disease caught early” card."),
  107: D("Replaced with your photograph of the front desk taking a call. The card below it in the section above was a second picture of the same person on the same phone, so that one is now a photograph of an examination instead — two near-identical shots on one page read as a mistake."),
  108: D("Replaced with the photograph you attached."),
  109: D("Added to the “It is documented” card. One thing to flag: the screen in that photograph is the practice's appointment book. Nothing is legible at the size it appears on the page, but if the practice would rather not publish it at all, say so and we will swap it."),
  103: D("Every card in that row now carries a photograph, in the same format as card 01: 02 and 04 use the pictures you attached, and 03 and 06 had none attached, so they use two of the practice's own — an examination for “lose or shifting teeth”, and the front counter for the six month recall panel. Send replacements for either and we will swap them in."),
};

const tasks = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, "tasks-2026-09-21.json"), "utf8")).tasks;
const byLocal = new Map(tasks.map((t) => [t.task.local_task_id, t]));
const columns = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, "tasks-2026-09-21.json"), "utf8")).columns;

let posted = 0, moved = 0, skipped = 0;
for (const [nStr, reply] of Object.entries(REPLIES)) {
  const n = Number(nStr);
  const rec = byLocal.get(n);
  if (!rec) { console.log(`#${n}: NOT ON THE BOARD, skipped`); continue; }
  const id = rec.task.id;
  const already = (rec.comments ?? []).some((c) => (c.text || "").slice(0, 60) === reply.text.slice(0, 60));
  console.log(`\n#${n} [${rec.task.status} -> ${reply.status}] ${rec.task.url}`);
  console.log(`  ${reply.text.slice(0, 160)}${reply.text.length > 160 ? "…" : ""}`);
  if (already) { console.log("  (this comment is already on the task)"); skipped++; continue; }
  if (!SEND) continue;
  await call("POST", `/tasks/${id}/comments.json`, { comment: { text: reply.text } });
  posted++;
  if (rec.task.status !== reply.status) {
    await call("PUT", `/tasks/${id}.json`, { task: { status: reply.status } });
    moved++;
  }
}
console.log(`\n${SEND ? "posted" : "would post"} ${SEND ? posted : Object.keys(REPLIES).length - skipped} comment(s), moved ${moved}, skipped ${skipped}`);
console.log(`columns: ${JSON.stringify(columns).slice(0, 200)}`);
