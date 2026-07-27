import { chromium } from "playwright";
import fs from "node:fs";

const OUT = ".tmp/verify/qa-0707";
fs.mkdirSync(OUT, { recursive: true });
const pages = (process.argv[2] || ",invest,develop,scale,sell,projects/4855-college-ave").split(",");
const [W, H, tag] = process.argv[3] === "desktop" ? [1440, 900, "desktop"] : [390, 844, "mobile"];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, hasTouch: W < 500 });

for (const p of pages) {
  const page = await ctx.newPage();
  try {
    await page.goto("https://giovanni-serrano.webflow.io/" + p, { waitUntil: "networkidle", timeout: 45000 });
  } catch (e) { console.log(p || "index", "GOTO FAIL"); await page.close(); continue; }
  // prime reveals
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 350) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 45));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1200);
  const total = await page.evaluate(() => document.body.scrollHeight);
  const name = (p || "index").replace(/\//g, "_");
  const step = Math.max(H, Math.ceil(total / 14 / H) * H);
  let i = 0;
  for (let y = 0; y < total; y += step) {
    await page.evaluate(yy => window.scrollTo(0, yy), y);
    await page.waitForTimeout(450);
    await page.screenshot({ path: `${OUT}/${name}-${tag}-${String(i).padStart(2, "0")}.png` });
    i++;
  }
  console.log(name, tag, "height", total, "shots", i);
  await page.close();
}
await browser.close();
console.log("DONE");
