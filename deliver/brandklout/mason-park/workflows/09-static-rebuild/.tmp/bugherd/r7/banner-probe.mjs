// Fixed/sticky elements near the bottom of an ad thank-you page, after a scroll, at the reviewer's window.
import { chromium } from "playwright-core";
const br = await chromium.launch({ channel: "chrome" });
for (const base of ["https://staging.masonparkdental.com", "https://www.masonparkdental.com"]) {
  const ctx = await br.newContext({ viewport: { width: 864, height: 906 } });
  const page = await ctx.newPage();
  await page.goto(`${base}/ads-landing-pages/invisalign-thank-you`, { waitUntil: "load" });
  await page.waitForTimeout(4000);
  await page.evaluate(() => window.scrollTo(0, 1500));
  await page.waitForTimeout(2000);
  const out = await page.evaluate(() => [...document.querySelectorAll("body *")].filter((e) => {
    const cs = getComputedStyle(e); if (!/fixed|sticky/.test(cs.position) || cs.display === "none" || cs.visibility === "hidden") return false;
    const r = e.getBoundingClientRect(); return r.height > 0 && r.bottom > innerHeight - 260;
  }).map((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return `${e.tagName.toLowerCase()}#${e.id}.${String(e.className).slice(0, 60)} z=${cs.zIndex} top=${Math.round(r.top)} bottom=${Math.round(r.bottom)} h=${Math.round(r.height)} op=${cs.opacity} "${e.innerText?.slice(0, 60).replace(/\s+/g, " ")}"`; }));
  console.log(`\n== ${base}`); for (const x of out) console.log("  " + x);
  await page.screenshot({ path: `bugherd/r7/banner-${base.includes("staging") ? "staging" : "www"}.png` });
  await ctx.close();
}
await br.close();
