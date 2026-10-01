// Round seven on a live instance: copy, terms line, label, anchors, portrait width, rail vs a banner.
import { chromium } from "playwright-core";
const BASE = process.argv[2];
const P = (s) => `${BASE}/ads-landing-pages/${s}`;
const br = await chromium.launch({ channel: "chrome" });
const out = [];
const ok = (c, m) => out.push(`${c ? "ok  " : "FAIL"} ${m}`);
const html = async (s) => (await (await fetch(P(s), { headers: { "user-agent": "Mozilla/5.0 r7" } })).text());
const ty = await html("invisalign-thank-you"), inv = await html("invisalign"), np = await html("new-patient-special"), npc = await html("new-patient-special-consultation");
ok(ty.includes("will determine whether Invisalign is appropriate after examining your teeth and scan"), "#254 step 1");
ok(ty.includes("Teeth can continue to shift; treatment timing varies by case."), "#261 risk 2");
ok(inv.includes("Invisalign can treat many common alignment concerns."), "#262 adults card");
ok(!np.includes("same either way") && (np.match(/class="lp-terms/g) || []).length === 2 && (npc.match(/class="lp-terms/g) || []).length === 1, "#258 terms x2 landing, x1 consult");
ok([ty, inv, np, npc].every((h) => h.includes("Practice affiliations and credentials") && !h.includes("Credentialed by")), "#259 label");
ok([ty, inv, np].every((h) => !/<img[^>]*alt=[^>]*alt=/.test(h)), "#263 single alt");
for (const [w, h] of [[864, 906], [1440, 900], [390, 844]]) {
  for (const [s, sel, t] of [["invisalign-consultation", '.navbar_component a[href="#form"]', "#form"], ["new-patient-thank-you", 'a[href="#call"]', "#call"]]) {
    const page = await br.newPage({ viewport: { width: w, height: h } });
    await page.goto(P(s), { waitUntil: "load" }); await page.waitForTimeout(2500);
    await page.click(sel); await page.waitForTimeout(2500);
    const r = await page.evaluate((t) => ({ hb: document.querySelector(".navbar_component").getBoundingClientRect().bottom, top: document.querySelector(t).getBoundingClientRect().top, op: getComputedStyle(document.querySelector(t).closest(".ar-in") || document.body).opacity }), t);
    ok(r.top >= r.hb && r.top < r.hb + 80 && +r.op === 1, `#255 ${s} ${t} @${w}: header ${Math.round(r.hb)}, target ${Math.round(r.top)}, opacity ${r.op}`);
    await page.close();
  }
}
for (const w of [864, 1440]) {
  const page = await br.newPage({ viewport: { width: w, height: 900 } });
  await page.goto(P("invisalign"), { waitUntil: "load" }); await page.waitForTimeout(1500);
  const iw = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector("#dentist .cp-split_ink img")).width));
  ok(iw <= 560, `#257 portrait ${iw}px @${w}`);
  await page.close();
}
const page = await br.newPage({ viewport: { width: 864, height: 906 } });
await page.goto(P("invisalign-thank-you"), { waitUntil: "load" }); await page.waitForTimeout(3000);
await page.evaluate(() => window.scrollTo(0, 1500)); await page.waitForTimeout(1500);
const banner = await page.evaluate(() => !!document.querySelector('[class*="termly-styles-termly-banner"]'));
if (!banner) await page.evaluate(() => { const d = document.createElement("div"); d.className = "termly-styles-termly-banner-x"; document.body.appendChild(d); });
await page.waitForTimeout(900);
const rail = await page.evaluate(() => getComputedStyle(document.querySelector(".lp-rail")).opacity);
ok(rail === "0", `#260 rail hidden under ${banner ? "the real Termly banner" : "a stand-in banner"} (opacity ${rail})`);
await br.close();
console.log(out.join("\n"));
