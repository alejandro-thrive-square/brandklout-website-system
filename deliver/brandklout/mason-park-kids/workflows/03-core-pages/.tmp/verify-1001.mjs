// BugHerd round seven on staging: markup checks read from the published pages.
//   node verify-1001.mjs > verify-1001.log          (BASE=https://masonparkpediatricdental.com for production)
const BASE = process.env.BASE || "https://staging.masonparkpediatricdental.com";
const get = async (p) => { const r = await fetch(`${BASE}/${p === "index" ? "" : p + "/"}`, { headers: { "user-agent": "Mozilla/5.0 Chrome/130" } }); return r.text(); };
const cache = {}; const page = async (p) => (cache[p] ??= await get(p));
let pass = 0, fail = 0;
const ok = (c, msg) => { c ? pass++ : (fail++, console.log("FAIL", msg)); };
const has = [
  ["index", "Designed for them."], ["index", "designed for your child in mind"], ["index", "Book an appointment today"],
  ["index", "elfsight-app-d359c3c4"], ["services/dental-hygiene-education", "-as-1781157191-"],
];
for (const [p, t] of has) ok((await page(p)).includes(t), `${p} has ${t}`);
const hasnt = [
  ["index", "You stay in the room."], ["index", "Nobody is sent to the waiting room"],
  ["our-doctors", "Nothing here is rounded up"], ["our-doctors", "A knee-to-knee exam"], ["our-doctors", "Dr. Nguyen, with her patients"],
  ["services/dental-hygiene-education", "st-brush-"],
];
for (const [p, t] of hasnt) ok(!(await page(p)).includes(t), `${p} lacks ${t}`);
// #514: the published journey.js repeats the ticker words to fill the strip.
const js = await (await fetch(`${BASE}/`)).text();
const srcs = [...js.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => new URL(m[1], BASE).href);
let found = false;
for (const s of srcs) if ((await (await fetch(s)).text()).includes("BugHerd #514")) found = true;
ok(found, "a published script carries the #514 ticker fill");
console.log(`${pass} pass, ${fail} fail on ${BASE}`);
