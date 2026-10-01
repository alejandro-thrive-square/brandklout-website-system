import { chromium } from "playwright-core";
import path from "node:path";
import { pathToFileURL } from "node:url";
const u = pathToFileURL(path.resolve("../home/ads-landing-pages/invisalign-consultation/index.html")).href;
const br = await chromium.launch({ channel: "chrome" });
const page = await br.newPage({ viewport: { width: 864, height: 906 } });
await page.goto(u, { waitUntil: "load" }); await page.waitForTimeout(1500);
const m = () => page.evaluate(() => { const f = document.querySelector("#form"); const chain = []; for (let e = f; e && e !== document.body; e = e.parentElement) { const t = getComputedStyle(e).transform; if (t !== "none") chain.push(`${e.className.split(" ")[0]} ${t}`); } return { y: scrollY, top: Math.round(f.getBoundingClientRect().top), sm: getComputedStyle(f).scrollMarginTop, chain, html: getComputedStyle(document.documentElement).scrollBehavior }; });
console.log("load", JSON.stringify(await m()));
await page.click('.navbar_component a[href="#form"]');
for (const t of [100, 500, 1500, 3000]) { await page.waitForTimeout(t); console.log(t, JSON.stringify(await m())); }
await br.close();
