// BugHerd round seven (2026-10-01): the eleven notes gauge@ left on the six /ads-landing-pages/
// on 09-28. Ten go to done. #256 stays in todo: the label it asks for is the Submit button of a
// GoHighLevel form, which is set in GHL's form builder, not on our page.
//
//   node reply-2026-10-01.mjs > reply-dry-2026-10-01.log          # dry run
//   node reply-2026-10-01.mjs --send > reply-send-2026-10-01.log  # posts; skips a comment already there
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

const LIVE = "Live on staging and on www.masonparkdental.com.";
const D = (s) => ({ status: "done", text: `Done. ${s} ${LIVE}` });
const replies = {
  254: D("Step 01 on both Invisalign pages now reads your text: \"The front desk will ask what you'd like to change and schedule your consultation. Dr. Dave Cho will determine whether Invisalign is appropriate after examining your teeth and scan.\" (Full name, per the practice's rule for the doctors.)"),
  255: D("\"Form\" in the header now lands with the form's title and explanation below the header, at every width, and \"What happens next\" does the same on both thank-you pages. Besides a 7rem scroll margin on #form and #call, the hero no longer lifts and fades when it holds the form. That lift moved the card 72px after the jump, which is why the margin alone was not enough. A click made while the form is still loading also used to bounce back to the top now and then, and it no longer does."),
  257: D("There is no larger photo of Dr. Dave Cho: the practice's headshot is 750px square, and the AI upscale we tried changed his face, so we did not use it. On a screen under 900px wide the portrait no longer spans the full width (it was stretched about 3x there). It now stops at 480px, framed by the dark panel, and on desktop its column stops at 560px. If the practice can send a high-resolution original (2000px or more), we will swap it in."),
  258: D("\"The $189 visit is the same either way\" is gone. \"New patients • self-pay • periodontal cases excluded\" now sits under the hero buttons, beside the first price and CTA, and in the form card above the form on both $189 pages. The disclaimer still spells out the rest, including the separate $129 children's exam."),
  259: D("The row is now labelled \"Practice affiliations and credentials\" on all six pages, so the pediatric marks no longer read as Dr. Dave Cho's. His schooling is right: Tufts University (DMD), per his bio on the practice's own Our Doctors page (UC Riverside biochemistry, five years in pharma, then Tufts). Dr. Tam Nguyen's degree and pediatric residency are from Boston University."),
  260: D("While Termly's cookie banner is on screen, the bottom rail now steps aside, and it comes back as soon as the visitor chooses Accept, Decline or Preferences. (Staging has no Termly, so you will only see this on www.)"),
  261: D("The second reason now reads \"Teeth can continue to shift; treatment timing varies by case.\""),
  262: D("The Adults card now ends \"Invisalign can treat many common alignment concerns.\""),
  263: D("Fixed across the whole site, not only these six pages: every image now carries exactly one alt. Instatic's image block always writes the alt from the media library, and our import added a second one on top. The descriptions now live on the media files themselves, so each image has one alt, with the same text it had before."),
  264: D("Both causes are fixed. The icon font was a leftover stylesheet from the old Webflow ad pages (134 KB, loaded on every page and used by none), and it is removed. The Cloudflare Insights beacon is now allowed by the pages' security policy, so those visits are counted again. This applied to every page without a form, not only the two thank-you pages."),
  256: { status: "todo", text: "Leaving this open for one step in GoHighLevel. The button is the Submit button of the GHL form inside the page, and its label is set in GHL's form builder, not on our page. This note is on the Invisalign consultation page, whose visit is free, so \"Claim My $189 Visit\" would not fit there. We suggest \"Claim My $189 Visit\" on the \"Contact Form New Patient Special\" form and \"Book My Free Consultation\" on the Invisalign form. Whoever has GHL access can change both in a minute. If you would rather have us do it, please send us access." },
};

const HERE = import.meta.dirname;
const { tasks } = JSON.parse(fs.readFileSync(path.join(HERE, "tasks-open-2026-10-01.json"), "utf8"));
const open = tasks.filter((t) => !["done", "closed"].includes(t.task.status));
const missing = open.map((t) => t.task.local_task_id).filter((n) => !replies[n]);
if (missing.length) { console.log(`NO REPLY for: ${missing.join(", ")}`); process.exit(1); }
console.log(`${open.length} open notes`);

for (const rec of open) {
  const n = rec.task.local_task_id, id = rec.task.id, reply = replies[n];
  console.log(`\n#${n} [${rec.task.status} -> ${reply.status}] ${rec.task.url}\n  ${reply.text}`);
  if (!SEND) continue;
  const { comments } = await call("GET", `/tasks/${id}/comments.json`);
  if (!comments.some((c) => c.text === reply.text)) await call("POST", `/tasks/${id}/comments.json`, { comment: { text: reply.text } });
  if (rec.task.status !== reply.status) await call("PUT", `/tasks/${id}.json`, { task: { status: reply.status } });
}
