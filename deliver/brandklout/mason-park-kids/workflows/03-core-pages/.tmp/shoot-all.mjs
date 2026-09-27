// Full-page captures of EVERY page under home/, at one width, into one folder.
//   node shoot-all.mjs ../home <outdir> [width]
// This is how the 2026-09-09 evening pass found the sixteen dangling figures
// and the overlap fault: the per-page gates were all clean, and it took
// looking at all 57 pages side by side to see what a parent sees. Pinned
// scenes photograph as empty space at full page - that is the pin spacer,
// not a fault; judge those with viewport-probe.mjs.
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const HOME = process.argv[2]; const OUT = process.argv[3]; const width = +(process.argv[4] || 1440);
const files = [];
(function walk(d){ for (const e of fs.readdirSync(d,{withFileTypes:true})) { if (e.isDirectory() && e.name!=="assets") walk(path.join(d,e.name)); else if (e.name==="index.html") files.push(path.join(d,e.name)); } })(HOME);
const browser = await chromium.launch({ executablePath: CHROME, args: ["--allow-file-access-from-files"] });
const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
for (const f of files) {
  const url = "file:///" + f.split(path.sep).join("/");
  const slug = path.relative(HOME, path.dirname(f)).split(path.sep).join("--") || "home";
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: "load", timeout: 60000 });
    await page.waitForTimeout(1200);
    await page.evaluate(async () => {
      document.documentElement.style.scrollBehavior = "auto";
      const step = Math.round(window.innerHeight * 0.7);
      for (let y = 0; y < document.body.scrollHeight + window.innerHeight; y += step) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 90)); }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(600);
    const h = await page.evaluate(() => document.body.scrollHeight);
    await page.screenshot({ path: path.join(OUT, `${slug}-${width}.png`), fullPage: true });
    console.log(slug, h);
  } catch (e) { console.log("FAIL", slug, e.message.slice(0,100)); }
  await page.close();
}
await browser.close();
