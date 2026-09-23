// Live gate for BugHerd round five (2026-09-23). Reads the PUBLISHED pages,
// never the local build:
//
//   1. every planned placement: the page serves the note's new frame, and a
//      "replace" no longer serves the frame it replaced in that slot's page;
//   2. #120 / #179 expansions: every page with an invitation photo / proof
//      portrait serves the building / the front desk (except the pages
//      decisions.json leaves out);
//   3. #164: the three doctors' portraits on /contacts;
//   4. #160 / #120 on the blog: the rail and the invitation on sample articles
//      and on /blog;
//   5. rendered: #158 tiles equal and one line, #159 grid clear, #201 hero
//      position, and every 3- and 6-card qualify grid fully photographed.
//
//   node verify-2026-09-23.mjs [base] > verify-live-2026-09-23.log
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const BASE = process.argv[2] || "https://staging.masonparkdental.com";
const HERE = import.meta.dirname;
const DIR = path.join(HERE, "plan-2026-09-23");
const manifest = JSON.parse(fs.readFileSync(path.join(HERE, "..", "album-manifest.json"), "utf8"));
const decisions = JSON.parse(fs.readFileSync(path.join(DIR, "decisions.json"), "utf8"));
const plans = fs.readdirSync(DIR).filter((f) => /^[A-Z]-.*\.json$/.test(f) && !f.includes("targets"))
  .flatMap((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")));
const skip = new Set(decisions.skip.map(String));

let fails = 0;
const fail = (s) => { fails++; console.log(`FAIL ${s}`); };
const cache = new Map();
async function html(p) {
  if (cache.has(p)) return cache.get(p);
  const res = await fetch(BASE + p.replace(/\/$/, "") || BASE + "/", { headers: { "cache-control": "no-cache" } });
  const t = await res.text();
  if (res.status !== 200) fail(`${p} status ${res.status} (${t.length} bytes)`);
  cache.set(p, t);
  return t;
}
// Instatic serves /uploads/<id>-mp-<key>-<w>x<h>.<ext>; the key is what matters.
const serves = (h, key) => h.includes(`mp-${key}-`);

// 1. placements
let placed = 0;
for (const p of plans) {
  if (!["replace", "add-media"].includes(p.action) || (p.n != null && skip.has(String(p.n)))) continue;
  const h = await html(p.page);
  if (!serves(h, p.key)) fail(`#${p.n ?? "fill"} ${p.page} ${p.section} card ${p.card ?? "-"}: ${p.key} not served`);
  else placed++;
}
console.log(`placements served: ${placed}`);

// 2. expansions, over every published page that is not a blog article
const urls = fs.readFileSync(path.join(HERE, "live-urls-2026-09-21.txt"), "utf8").split(/\r?\n/).filter(Boolean)
  .map((u) => new URL(u).pathname.replace(/\/?$/, "/"));
for (const [n, rule] of Object.entries(decisions.expand)) {
  const key = plans.find((p) => String(p.n) === n).key;
  const cls = rule.slot === "iv-shot" ? 'class="iv-shot' : 'class="pr-portrait';
  let has = 0, ok = 0;
  for (const u of urls) {
    if (rule.except.includes(u)) continue;
    const h = await html(u);
    const i = h.indexOf(cls);
    if (i < 0) continue;
    has++;
    if (h.slice(i, i + 3000).includes(`mp-${key}-`)) ok++; else fail(`#${n} ${u}: ${rule.slot} is not ${key}`);
  }
  console.log(`#${n} ${rule.slot}: ${ok}/${has} pages`);
}

// 3. the doctors
{
  const h = await html("/contacts/");
  for (const k of ["dr-sung-standing-2", "dr-cho-portrait", "dr-nguyen-portrait-2"]) if (!serves(h, k)) fail(`#164 /contacts/: ${k} not served`);
  if ((h.match(/svc-card is-shot/g) || []).length < 3) fail("#164 /contacts/: fewer than three is-shot cards");
}

// 4. the blog
{
  const b = await html("/blog/");
  const arts = [...new Set([...b.matchAll(/href="(\/blog\/[a-z0-9-]+)\/?"/g)].map((m) => m[1]))].slice(0, 4);
  arts.push("/blog/tooth-replacement-that-looks-real-exploring-natural-implants");
  for (const a of arts) {
    const h = await html(a + "/");
    if (!serves(h, "n160-building-exterior-blog")) fail(`#160 ${a}: rail is not the building`);
    if (!serves(h, "n120-building-exterior")) fail(`#120 ${a}: invitation is not the building`);
  }
  console.log(`blog articles checked: ${arts.length}`);
}

// 5. rendered checks
const browser = await chromium.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" });
for (const w of [1280, 1512, 2560]) {
  const page = await browser.newPage({ viewport: { width: w, height: 1000 } });
  await page.goto(`${BASE}/blog`, { waitUntil: "load" });
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => ({
    h: [...document.querySelectorAll(".bl-topic")].map((t) => Math.round(t.getBoundingClientRect().height)),
    lines: [...document.querySelectorAll(".bl-topic_name")].map((n) => Math.round(n.getBoundingClientRect().height / parseFloat(getComputedStyle(n).lineHeight))),
    bg: getComputedStyle(document.querySelector(".bl-grid")).backgroundColor,
  }));
  if (new Set(r.h).size !== 1) fail(`#158 /blog @${w}: tile heights ${r.h.join("/")}`);
  if (r.lines.some((l) => l !== 1)) fail(`#158 /blog @${w}: name lines ${r.lines.join("/")}`);
  if (r.bg !== "rgba(0, 0, 0, 0)") fail(`#159 /blog @${w}: grid background ${r.bg}`);
  console.log(`/blog @${w}: tiles ${r.h.join("/")}, lines ${r.lines.join("/")}, grid ${r.bg}`);
  await page.close();
}
{
  const page = await browser.newPage({ viewport: { width: 1920, height: 1000 } });
  await page.goto(`${BASE}/services/dental-implant-restorations`, { waitUntil: "load" });
  const pos = await page.evaluate(() => getComputedStyle(document.querySelector(".ar-bg img")).objectPosition);
  if (pos !== "50% 85%") fail(`#201 hero object-position ${pos}`);
  console.log(`#201 hero object-position: ${pos}`);
  await page.close();
}
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  for (const u of urls.filter((u) => u.startsWith("/services/"))) {
    await page.goto(BASE + u, { waitUntil: "load" });
    const r = await page.evaluate(() => {
      const cards = [...document.querySelectorAll("#qualify .svc-grid > .svc-card")];
      return { n: cards.length, bare: cards.map((c, i) => (c.querySelector(".svc-card_media img") ? 0 : i + 1)).filter(Boolean) };
    });
    if ((r.n === 3 || r.n === 6) && r.bare.length) fail(`qualify ${u}: ${r.n} cards, bare ${r.bare.join(",")}`);
  }
  console.log("qualify grids checked");
  await page.close();
}
await browser.close();
console.log(`${fails} failures`);
process.exit(fails ? 1 : 0);
