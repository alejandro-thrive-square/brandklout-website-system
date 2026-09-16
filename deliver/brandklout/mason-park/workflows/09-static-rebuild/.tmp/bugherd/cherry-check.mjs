// Which pay.withcherry.com slug is Mason Park's? (BugHerd #66, 2026-09-16)
//   node cherry-check.mjs > cherry-check.log
import { chromium } from "playwright-core";
const slugs = ["grand-mission-dentistry", "mason-park-dental", "mason-park-dental-of-katy", "masonparkdental", "mason-park-dental-katy", "mason-park-dental-for-kids"];
const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
const ctx = await b.newContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36" });
const p = await ctx.newPage();
for (const s of slugs) {
  try {
    const r = await p.goto(`https://pay.withcherry.com/${s}`, { waitUntil: "networkidle", timeout: 45000 });
    await p.waitForTimeout(3000);
    const text = (await p.evaluate(() => document.body.innerText)).replace(/\s+/g, " ").slice(0, 200);
    console.log(s, r?.status(), p.url(), "|", await p.title(), "|", text);
  } catch (e) { console.log(s, "ERR", e.message.slice(0, 100)); }
}
await b.close();
