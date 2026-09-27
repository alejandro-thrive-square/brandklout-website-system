// Answer BugHerd round three (2026-09-16): the 28 new notes (#50-#77) and the
// three the agency reopened (#1, #3, #43). Every other note is left alone.
// `done` only for notes verified live on staging; the rest stay in todo with
// a question for the agency.
//
//   node reply-2026-09-16.mjs > reply-dry-2026-09-16.log          # dry run
//   node reply-2026-09-16.mjs --send > reply-send-2026-09-16.log  # posts; skips a comment already there
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

const LIVE = "Live on staging.masonparkdental.com, checked in Safari's engine at your 1512 x 652 window.";
const D = (s) => ({ status: "done", text: `Done. ${s} ${LIVE}` });
const Q = (s) => ({ status: "todo", text: s });
const MOTION = "This is fixed across the whole site, not only here: words that fill in as you scroll are now readable before they fill in (at least 4.5:1 contrast), and they finish filling by the time the line reaches the middle of the screen.";
const REFRESH = "The cause was that opening a \"read more\" section made the page taller, but the scroll animations kept their old positions, so headings further down faded out while they were still on screen. The animations now recalculate whenever the page changes height, on every page.";
const COLOUR = "Photographs are now in full colour all the time across the site; nothing switches between black and white and colour any more.";

const REPLIES = {
  1: D("The home page now opens on the photograph of Dr. Nguyen and Dr. Sung with their children, from the Mason Park shared drive. On wide screens the family sits on the right, clear of the headline."),
  3: Q("We found the root cause: the logo image itself had no spare space around the letters, so any rounding when Safari scales it could shave the bottom of DENTAL. The logo file now has transparent space built in on every side, on all pages, which a browser cannot round away. We cannot run Safari 26 itself here: could you take one more look and close this if DENTAL is whole?"),
  43: D("Thank you for the Canva access. The Team page has a new chapter, \"The people you will meet\", with all thirteen portraits, named, grouped as Hygienists, Dental assistants and Front office. Dr. Cho's headshot from the same set is saved for when you want it used."),
  50: D(MOTION),
  51: D("The headline reads \"Your Lifetime Partner in Dental Health, Today and for Generations to Come\"."),
  52: D("The line under the headline reads \"From routine cleanings to complete smile makeovers, we care for every smile in your family and across Harris County.\""),
  53: D("Mason Park now stands on its own as a cosmetic and general practice. The hero strip reads Cosmetic and general dentistry and Katy, TX. On the home page, the opening story, the \"Under One Roof\" chapter (now \"The Practice\"), the comparison table, the photo wall and the team band are all rewritten around this practice. Dr. Nguyen's practice is named as Mason Park Dental for Kids and referenced, not presented as part of this site's offer. The Services page's pediatric panel is reworded the same way."),
  54: D("The button text was being covered by the hover colour sliding over it. The fill now sits behind the text on every button across the site, so the label stays readable (white on dark)."),
  55: D("Same fix: the outline button now shows dark text on a white fill when hovered."),
  56: D("The caption reads \"We are here to guide you and walk you through your treatment options. No rush, no pressure, we take the time to answer all of your questions.\""),
  57: D("The line now ends \"in one practice in Katy, TX\" instead of naming the street."),
  58: D("Rewritten as \"Seven kinds of care. Choose one to see every treatment in it.\""),
  59: D("The heading is now \"Find the care you need.\""),
  60: D("The treatment count is removed."),
  61: D("The headline reads \"Everything Your Smile Needs, From Preventive Care to Complete Smile Makeovers\"."),
  62: D("The button is now \"Start with a checkup\" and goes to Preventative Dentistry. The finder below is reframed the same way: \"Start with what you need\", and its first line is now \"A checkup and a cleaning, or it has been a while\". The closing line asks patients to book a checkup."),
  63: D("The pediatric panel now shows Dr. Nguyen's portrait."),
  64: D(`${MOTION} ${REFRESH}`),
  65: D("Using Jessica's Asana note: \"We accept all PPO insurance plans, and we also take Delta Dental and Medicaid.\" The table header says the same. If Medicaid applies only to the kids' practice, tell us and we will adjust the wording."),
  66: Q("We would like to link Cherry, but we cannot find Mason Park's own Cherry application link. It is not on the old site or in Asana, and Cherry's site blocks automated lookups. Could you send the practice's Cherry link (it usually looks like pay.withcherry.com/<practice-name>)? We will link the Cherry column and add an Apply button as soon as we have it."),
  67: D(`${COLOUR} Dr. Cho and Dr. Sung are both in colour, always.`),
  68: D("The heading reads \"Cosmetic and general dentistry.\""),
  69: D("Dr. Cho's title reads \"Cosmetic, Restorative, and General\" (also on his home page card)."),
  70: D("Dr. Sung's title reads \"Cosmetic, Restorative, and General\" (also on his home page card)."),
  71: D(REFRESH),
  72: D("Her title reads \"Board Certified Pediatric Dentist, Mason Park Dental for Kids and Mason Park Dental of Katy\", and her details say the same."),
  73: D("Opening \"Her story\" no longer resizes her photo. It keeps its size and stays in view while you read."),
  74: D("Same fix as #73: the photo keeps its size when the story opens."),
  75: D(COLOUR),
  76: D("Rewritten as \"The standards behind the care: training well past what Texas asks of a dentist, and a fellowship few general dentists hold.\""),
  77: D(`The reviews heading had already faded out before it reached you. ${REFRESH}`),
};

const { tasks } = JSON.parse(fs.readFileSync("tasks-2026-09-16.json", "utf8"));
const mine = tasks.filter(({ task: t }) => REPLIES[t.local_task_id]);
const unknown = Object.keys(REPLIES).map(Number).filter((n) => !tasks.some(({ task: t }) => t.local_task_id === n));
if (unknown.length) throw new Error(`no task for #${unknown.join(", #")}`);

const log = [];
for (const { task: t } of mine) {
  const n = t.local_task_id;
  const r = REPLIES[n];
  if (!SEND) { console.log(`#${n} ${t.status} -> ${r.status}  ${r.text}`); continue; }
  const { comments } = await call("GET", `/tasks/${t.id}/comments.json`);
  if (comments.some((c) => c.text === r.text)) console.log(`#${n} comment already there`);
  else { await call("POST", `/tasks/${t.id}/comments.json`, { comment: { text: r.text } }); console.log(`#${n} commented`); }
  if (r.status !== t.status) {
    const { task } = await call("PUT", `/tasks/${t.id}.json`, { task: { status: r.status } });
    console.log(`#${n} status ${t.status} -> ${task.status}`);
  }
  log.push({ n, id: t.id, status: r.status, text: r.text });
}
if (SEND) fs.writeFileSync("replies-2026-09-16.json", JSON.stringify(log, null, 1));
console.log(`${SEND ? "sent" : "dry run"}: ${mine.length} tasks, ${mine.filter(({ task: t }) => REPLIES[t.local_task_id].status === "done").length} to done`);
