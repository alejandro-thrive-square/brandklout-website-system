// Record CSP violations and failed requests on the ad pages.
//   node bugherd/r7/csp-probe.mjs <base> > out.log
import { chromium } from "playwright-core";
const BASE = process.argv[2] || "https://www.masonparkdental.com";
const PAGES = ["invisalign", "invisalign-consultation", "invisalign-thank-you", "new-patient-special", "new-patient-special-consultation", "new-patient-thank-you"];
const br = await chromium.launch({ channel: "chrome" });
for (const p of PAGES) {
  const ctx = await br.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const v = new Set();
  page.on("console", (m) => { const t = m.text(); if (/Content Security Policy|Refused/i.test(t)) v.add(t.slice(0, 260)); });
  page.on("requestfailed", (r) => v.add(`FAILED ${r.url().slice(0, 140)} ${r.failure()?.errorText}`));
  await page.goto(`${BASE}/ads-landing-pages/${p}`, { waitUntil: "load" });
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } });
  await page.waitForTimeout(3000);
  console.log(`\n== ${p}: ${v.size}`);
  for (const x of v) console.log("  " + x);
  await ctx.close();
}
await br.close();
