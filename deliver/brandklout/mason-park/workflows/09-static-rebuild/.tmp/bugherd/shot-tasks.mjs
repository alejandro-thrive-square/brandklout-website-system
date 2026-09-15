// Each BugHerd note, re-shot where the reviewer stood: their page, their
// viewport (requester_browser_size), their element (selector_info.path)
// scrolled to the middle of the screen. The reviewer works in Safari, so run
// it with webkit as well as chromium.
//
//   node shot-tasks.mjs <engine> <origin> <out-dir> [n,n,...] > log
//   node shot-tasks.mjs webkit https://staging.masonparkdental.com shots-live-webkit
//   node shot-tasks.mjs chromium http://127.0.0.1:8089 shots-local-chromium 5,6
import fs from "node:fs";
import { chromium, webkit } from "playwright-core";

const [engine = "webkit", origin = "https://staging.masonparkdental.com", out = `shots-${engine}`, only] = process.argv.slice(2);
const pick = only ? new Set(only.split(",").map(Number)) : null;
const { tasks } = JSON.parse(fs.readFileSync("tasks-2026-09-15.json", "utf8"));
fs.mkdirSync(out, { recursive: true });

const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = engine === "webkit" ? await webkit.launch() : await chromium.launch({ executablePath: CHROME });

let ctx = null, page = null, at = "";
for (const { task: t } of tasks) {
  const n = t.local_task_id;
  if (pick && !pick.has(n)) continue;
  const [w, h] = t.requester_browser_size.match(/\d+/g).map(Number);
  const key = `${t.url}|${w}x${h}`;
  if (key !== at) {
    if (ctx) await ctx.close();
    ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
    page = await ctx.newPage();
    page.on("pageerror", (e) => console.log(`  pageerror ${e.message}`));
    await page.goto(origin + t.url, { waitUntil: "load" });
    await page.waitForTimeout(2500);
    at = key;
  }
  const sel = t.selector_info?.path ?? "";
  const found = await page.evaluate(async (sel) => {
    document.documentElement.style.scrollBehavior = "auto";
    let el = null;
    try { el = document.querySelector(sel); } catch {}
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const top = r.top + window.scrollY;
    window.scrollTo(0, Math.max(0, top - Math.max(0, (innerHeight - r.height) / 2)));
    return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(top) };
  }, sel);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${out}/${n}.png` });
  console.log(`#${n} ${t.url} ${w}x${h} ${found ? `el ${found.w}x${found.h} @${found.top}` : "SELECTOR GONE"} :: ${t.description.replace(/\s+/g, " ").trim().slice(0, 70)}`);
}
if (ctx) await ctx.close();
await browser.close();
