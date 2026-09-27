// BugHerd round five on production: markup checks read from the published pages.
//   node verify-0926.mjs > verify-0926.log
import fs from "node:fs";
const BASE = "https://masonparkpediatricdental.com";
const src = fs.readFileSync("bugherd-0926.py", "utf8");
const swaps = [...src.matchAll(/\((\d+), "([^"]+)", "([a-z0-9-]+)", "([^"]+)", "([a-z0-9-]+)"\),/g)].map(m => ({ n: m[1], p: m[2], key: m[5] }));
const get = async (p) => { const r = await fetch(`${BASE}/${p === "index" ? "" : p + "/"}`, { headers: { "user-agent": "Mozilla/5.0 Chrome/130" } }); return r.text(); };
const cache = {}; const page = async (p) => (cache[p] ??= await get(p));
let pass = 0, fail = 0;
const ok = (c, msg) => { c ? pass++ : (fail++, console.log("FAIL", msg)); };
for (const s of swaps) ok((await page(s.p)).includes(`-${s.key}-`), `#${s.n} ${s.p} has ${s.key}`);
ok((await page("index")).includes("badges-in"), "home keeps badges");
for (const p of ["services/night-guards", "technology", "financing", "blog/invisalign-or-braces-pros-cons-and-what-to-expect"]) {
  const h = await page(p);
  ok(!h.includes("badges-in"), `${p} no badges`);
  ok(!h.includes("Suite 104B, behind") && !h.includes("Suite 104B, free parking"), `${p} no Suite captions`);
  ok(h.includes("100080674540904") && !h.includes("100083179359693"), `${p} facebook`);
}
const checks = [
  ["financing", "ins-delta-dental"], ["financing", "goalphaeon.com/applydental"], ["about-us", "parks-youth-ranch-logo"],
  ["services/composite-fillings", "Silver Diamine Fluoride (SDF): stopping"], ["services/restorative-dentistry", "Six ways a tooth"],
  ["knee-to-knee-pediatric-dental-exam", "sq-shot"], ["knee-to-knee-pediatric-dental-exam", "visually-hidden"],
  ["our-services", "A personalized experience"], ["our-doctors", "Read them on Google"], ["services/pulp-therapy", "Book now"],
  ["services/mouth-guards", "st-guard-flip"], ["services/comprehensive-pediatric-dentistry", "img-7693"],
];
for (const [p, t] of checks) ok((await page(p)).includes(t), `${p} has ${t}`);
ok(!(await page("technology")).includes('id="count"'), "technology count section gone");
ok(!(await page("new-patients")).includes("The team, in the waiting room.</figcaption>"), "#371 caption gone");
console.log(`${pass} pass, ${fail} fail (${swaps.length} swaps)`);
