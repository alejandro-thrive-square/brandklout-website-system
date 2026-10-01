import { chromium } from "playwright-core";
import path from "node:path";
import { pathToFileURL } from "node:url";
const u = pathToFileURL(path.resolve("../home/ads-landing-pages/new-patient-special/index.html")).href;
const br = await chromium.launch({ channel: "chrome" });
for (const [w, h] of [[864, 906], [1440, 900], [390, 844]]) {
  const page = await br.newPage({ viewport: { width: w, height: h } });
  await page.goto(u, { waitUntil: "load" });
  await page.addStyleTag({ content: "html{scroll-behavior:auto!important}" });
  await page.waitForTimeout(800);
  const y = await page.evaluate(() => document.querySelector("#dentist .cp-split").getBoundingClientRect().top + scrollY - 90);
  for (let s = 0; s <= y; s += 300) { await page.evaluate((v) => window.scrollTo(0, v), s); await page.waitForTimeout(60); }
  await page.evaluate((v) => window.scrollTo(0, v), y);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `bugherd/r7/local-dentist-${w}.png` });
  await page.close();
}
await br.close();
