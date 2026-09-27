// Screenshots for the eye: the top of any live route, or a full page.
//   node peek.mjs contacts technology services/invisalign
//   node peek.mjs --full --width 390 contacts
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = process.env.PEEK_BASE || "https://mason-park-kids.up.railway.app";
const args = process.argv.slice(2);
const full = args.includes("--full");
const width = args.includes("--width") ? Number(args[args.indexOf("--width") + 1]) : 1440;
const height = args.includes("--height") ? Number(args[args.indexOf("--height") + 1]) : 1400;
const outDir = path.resolve(args.includes("--out") ? args[args.indexOf("--out") + 1] : "shots/peek");
const skip = new Set(["--full", "--width", "--height", "--out", String(width), String(height), outDir]);
const routes = args.filter((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));

fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME, args: ["--allow-file-access-from-files"] });
for (const r of routes) {
  const url = /^(https?:|file:)/.test(r) ? r : `${BASE}/${r.replace(/^\//, "")}`;
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(1500);
  if (full) {
    await page.evaluate(async () => {
      document.documentElement.style.scrollBehavior = "auto";
      const step = Math.round(window.innerHeight * 0.8);
      for (let y = 0; y < document.body.scrollHeight + window.innerHeight; y += step) {
        window.scrollTo(0, y); await new Promise((x) => setTimeout(x, 80));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(700);
  }
  const name = (r.replace(/^https?:\/\/[^/]+/, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "home") + `-${width}`;
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: full });
  console.log(`${url}  ->  ${file}`);
  await ctx.close();
}
await browser.close();
