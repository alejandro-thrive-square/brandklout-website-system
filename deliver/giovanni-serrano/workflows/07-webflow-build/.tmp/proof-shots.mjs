import { chromium } from "playwright";
import fs from "node:fs";
fs.mkdirSync(".tmp/verify/proof", { recursive: true });
const browser = await chromium.launch();

// desktop portfolio
let page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("https://giovanni-serrano.webflow.io/", { waitUntil: "networkidle" });
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); }
});
await page.waitForTimeout(1200);
await page.evaluate(() => document.querySelector(".project-card")?.scrollIntoView({ block: "start" }));
await page.evaluate(() => window.scrollBy(0, -120));
await page.waitForTimeout(900);
await page.screenshot({ path: ".tmp/verify/proof/portfolio-desktop-fixed.png" });
await page.close();

// template footer desktop
page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("https://giovanni-serrano.webflow.io/projects/4855-college-ave", { waitUntil: "networkidle" });
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); }
});
await page.waitForTimeout(800);
await page.evaluate(() => document.querySelector("footer").scrollIntoView({ block: "center" }));
await page.waitForTimeout(700);
await page.screenshot({ path: ".tmp/verify/proof/template-footer-fixed.png" });
await page.close();
await browser.close();
console.log("done");
