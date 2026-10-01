import { chromium } from "playwright-core";
import path from "node:path";
import { pathToFileURL } from "node:url";
const u = pathToFileURL(path.resolve("../home/ads-landing-pages/new-patient-special/index.html")).href;
const br = await chromium.launch({ channel: "chrome" });
for (const w of [864, 1440]) {
  const page = await br.newPage({ viewport: { width: w, height: 900 } });
  await page.goto(u, { waitUntil: "load" }); await page.waitForTimeout(1000);
  console.log(w, await page.evaluate(() => {
    const s = document.querySelector("#dentist .cp-split"), f = s.querySelector(".cp-split_ink"), i = f.querySelector("img");
    return { cols: getComputedStyle(s).gridTemplateColumns, fDisp: getComputedStyle(f).display, iW: getComputedStyle(i).width, iStyle: i.getAttribute("style"), fStyle: f.getAttribute("style"), sectionClass: s.closest("section").className, sheetHas: [...document.styleSheets].some((ss) => { try { return [...ss.cssRules].some((r) => r.cssText.includes("560px")); } catch { return false; } }) };
  }));
  await page.close();
}
await br.close();
