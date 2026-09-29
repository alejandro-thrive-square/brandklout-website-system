// BugHerd round six on staging: markup checks read from the published pages.
//   node verify-0929.mjs > verify-0929.log          (BASE=https://masonparkpediatricdental.com for production)
import fs from "node:fs";
const BASE = process.env.BASE || "https://staging.masonparkpediatricdental.com";
const src = fs.readFileSync("bugherd-0929.py", "utf8");
const block = (name) => src.slice(src.indexOf(`${name} = [`), src.indexOf("\n]\n", src.indexOf(`${name} = [`)));
const swaps = [...block("SWAP").matchAll(/\((\d+), "([^"]+)", "([a-z0-9-]+)", "([^"]+)", "([a-z0-9-]+)"\),/g)].map((m) => ({ n: m[1], p: m[2], key: m[5] }));
const inserts = [...block("PATH_INSERTS").matchAll(/\((\d+), "([^"]+)", \d+, "([a-z0-9-]+)"/g), ...block("GRID_INSERTS").matchAll(/\((\d+), "([^"]+)", "[^"]+", "([a-z0-9-]+)"/g)].map((m) => ({ n: m[1], p: m[2], key: m[3] }));
const get = async (p) => { const r = await fetch(`${BASE}/${p === "index" ? "" : p + "/"}`, { headers: { "user-agent": "Mozilla/5.0 Chrome/130" } }); return r.text(); };
const cache = {}; const page = async (p) => (cache[p] ??= await get(p));
let pass = 0, fail = 0;
const ok = (c, msg) => { c ? pass++ : (fail++, console.log("FAIL", msg)); };
for (const s of [...swaps, ...inserts]) ok((await page(s.p)).includes(`-${s.key}-`), `#${s.n} ${s.p} has ${s.key}`);
const has = [
  ["index", "Platinum provider"], ["about-us", "shares the same building as our sister practice"], ["about-us", "Sit back and unwind"],
  ["about-us", "Lay back, relax, and enjoy the show."], ["about-us", "www.masonparkdental.com"], ["our-team", "Our dedicated team."],
  ["our-team", "personalized shoutout"], ["our-team", "Billing"], ["our-services", "Platinum Invisalign"], ["our-services", "$89"],
  ["our-services", "lost crowns, and soft tissue"], ["our-services", "Pricing is subject to change"], ["our-services", "unplanned and unexpected"],
  ["special-offers", "$89"], ["new-patients", "$89"], ["dental-saving-plan", "sealants, and fluoride treatments"],
  ["special-offers", "At Mason Park Dental for Kids, educating"], ["patient-reviews", "parent or guardian on our review profiles"],
  ["patient-reviews", "Love us? Please share!"], ["patient-reviews", "A few reviews, all unedited."], ["patient-reviews", "elfsight-app-d359c3c4"],
  ["index", "elfsight-app-d359c3c4"], ["invisalign-faqs-katy-tx", "What areas near Katy do you serve?"],
  ["invisalign-faqs-katy-tx", "Will Invisalign affect my speech?"], ["services/invisalign", "Platinum Invisalign"], ["our-services", "Invisalign®"],
];
for (const [p, t] of has) ok((await page(p)).includes(t), `${p} has ${t}`);
const hasnt = [
  ["index", "with you in the room the whole time"], ["index", "Can I stay with my child"], ["faq-page", "Can I stay in the room"],
  ["new-patients", "Can I stay with my child"], ["pediatric-dentistry-faqs-katy-tx", "Can I stay in the room"],
  ["our-team", "Gia"], ["our-team", "Kebra"], ["our-team", "Lizzie"], ["our-team", "Karen"], ["our-team", 'id="reason"'],
  ["our-team", "Everyone below is named"], ["patient-reviews", 'id="count"'], ["our-services", "In the practice</figcaption>"],
  ["our-services", "confirms the offer on the day</figcaption>"], ["dental-saving-plan", "Gia or Kebra"], ["thank-you", "Gia or Kebra"],
  ["our-services", "$85"], ["special-offers", "$85"], ["new-patients", "$85"], ["dental-saving-plan", "veneers"],
];
for (const [p, t] of hasnt) ok(!(await page(p)).includes(t), `${p} lacks ${t}`);
console.log(`${pass} pass, ${fail} fail (${swaps.length} swaps, ${inserts.length} inserts) on ${BASE}`);
