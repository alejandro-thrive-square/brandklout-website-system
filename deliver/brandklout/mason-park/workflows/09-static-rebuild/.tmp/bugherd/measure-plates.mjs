// Are the three doctor plates on the home the same height once every image has loaded?
import { chromium } from "playwright-core";
import path from "node:path";
import { pathToFileURL } from "node:url";
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
await page.goto(pathToFileURL(path.resolve(process.argv[2])).href, { waitUntil: "load" });
await page.evaluate(() => document.querySelector("#people").scrollIntoView());
await page.waitForTimeout(2500);
console.log(await page.evaluate(() => [...document.querySelectorAll(".pe-plate")].map((p) => { const r = p.getBoundingClientRect(); const i = p.querySelector("img"); return `${i.alt}: ${Math.round(r.width)}x${Math.round(r.height)} img ${i.naturalWidth}x${i.naturalHeight} complete=${i.complete}`; })));
console.log(await page.evaluate(() => [...document.querySelectorAll(".cp-dossier_shot")].map((p) => { const r = p.getBoundingClientRect(); return `${p.querySelector("img").alt}: ${Math.round(r.width)}x${Math.round(r.height)}`; })));
await browser.close();
