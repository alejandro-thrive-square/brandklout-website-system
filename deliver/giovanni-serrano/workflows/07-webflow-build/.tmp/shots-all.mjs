import { chromium } from "playwright";
import fs from "node:fs";

const OUT = ".tmp/verify/qa-0707";
fs.mkdirSync(OUT, { recursive: true });
const pages = ["", "invest", "develop", "scale", "sell", "projects/4855-college-ave"];
const browser = await chromium.launch();

for (const [w, h, tag] of [[390, 844, "mobile"], [1440, 900, "desktop"]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: w < 500 });
  for (const p of pages) {
    const page = await ctx.newPage();
    try {
      await page.goto("https://giovanni-serrano.webflow.io/" + p, { waitUntil: "networkidle", timeout: 45000 });
    } catch (e) { console.log(p || "index", tag, "GOTO FAIL"); await page.close(); continue; }
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 350) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 45));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1300);
    const name = (p || "index").replace(/\//g, "_");
    await page.screenshot({ path: `${OUT}/${name}-${tag}.png`, fullPage: true });
    console.log("shot", name, tag);
    await page.close();
  }
  await ctx.close();
}
await browser.close();
console.log("DONE");
