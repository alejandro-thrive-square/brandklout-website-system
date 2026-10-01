// Local renders of the round-seven changes. file:// works: the ad pages use relative asset paths.
import { chromium } from "playwright-core";
import path from "node:path";
import { pathToFileURL } from "node:url";
const HOME = path.resolve("../home/ads-landing-pages");
const url = (p) => pathToFileURL(path.join(HOME, p, "index.html")).href;
const br = await chromium.launch({ channel: "chrome" });
const shot = async (w, h, p, fn, name) => {
  const ctx = await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(url(p), { waitUntil: "load" });
  await page.addStyleTag({ content: "html{scroll-behavior:auto!important}" });
  await page.waitForTimeout(1200);
  const out = await fn(page);
  await page.screenshot({ path: `bugherd/r7/local-${name}.png` });
  console.log(name, JSON.stringify(out));
  await ctx.close();
};
// #255: click the header Form link / What happens next, then where is the target's top vs the header bottom?
const anchor = (sel, target) => async (page) => {
  await page.click(sel); await page.waitForTimeout(1500);
  return page.evaluate((t) => ({ header: Math.round(document.querySelector(".navbar_component").getBoundingClientRect().bottom), target: Math.round(document.querySelector(t).getBoundingClientRect().top) }), target);
};
for (const [w, h] of [[864, 906], [1440, 900], [390, 844]]) {
  await shot(w, h, "invisalign-consultation", anchor('.navbar_component a[href="#form"]', "#form"), `form-${w}`);
  await shot(w, h, "invisalign-thank-you", anchor('a[href="#call"]', "#call"), `call-${w}`);
  await shot(w, h, "new-patient-special", async (p) => { await p.evaluate(() => window.scrollTo(0, 0)); return p.evaluate(() => [...document.querySelectorAll(".lp-terms")].map((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.height), getComputedStyle(e).color]; })); }, `np-hero-${w}`);
  await shot(w, h, "new-patient-special", async (p) => { const r = await p.evaluate(() => { const f = document.querySelector("#dentist .cp-split"); f.scrollIntoView(); const i = f.querySelector("img").getBoundingClientRect(); return [Math.round(i.width), Math.round(i.height)]; }); await p.waitForTimeout(800); return r; }, `dentist-${w}`);
}
// #260: a stand-in Termly banner hides the rail; removing it brings it back.
await shot(864, 906, "invisalign-thank-you", async (p) => {
  await p.evaluate(() => window.scrollTo(0, 1500)); await p.waitForTimeout(1200);
  const st = () => p.evaluate(() => { const r = document.querySelector(".lp-rail"); return getComputedStyle(r).opacity + " " + getComputedStyle(r).pointerEvents; });
  const before = await st();
  await p.evaluate(() => { const d = document.createElement("div"); d.className = "termly-styles-root-b0aebb termly-styles-termly-banner-e1ed59"; d.id = "fake"; document.body.appendChild(d); });
  await p.waitForTimeout(900); const during = await st();
  await p.evaluate(() => document.getElementById("fake").remove()); await p.waitForTimeout(900);
  return { before, during, after: await st() };
}, "rail-termly");
await br.close();
