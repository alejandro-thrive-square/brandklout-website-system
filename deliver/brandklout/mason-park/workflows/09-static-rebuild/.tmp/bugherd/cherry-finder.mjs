// Open Cherry's provider finder from its not-found page, search Katy TX, and print any
// Mason Park entry with its links. node cherry-finder.mjs > cherry-finder.log
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const p = await b.newPage({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36" });
const json = [];
p.on("response", async (r) => { const ct = r.headers()["content-type"] || ""; if (ct.includes("json") && /cherry/.test(r.url())) { try { const t = await r.text(); if (/mason/i.test(t)) json.push(r.url() + "\n" + t.slice(0, 3000)); } catch {} } });
await p.goto("https://pay.withcherry.com/masonparkdental/not-found", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(6000);
const links = await p.$$eval("a", (as) => as.map((a) => `${a.innerText.trim()} -> ${a.href}`));
console.log(links.join("\n"));
const finder = links.map((l) => l.split(" -> ")[1]).find((h) => /find/i.test(h));
if (finder) {
  await p.goto(finder, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(6000);
  const input = await p.$("input");
  if (input) { await input.fill("Mason Park Dental"); await p.keyboard.press("Enter"); await p.waitForTimeout(8000); }
  console.log("URL", p.url());
  console.log((await p.evaluate(() => document.body.innerText)).replace(/\s+/g, " ").slice(0, 1500));
  console.log((await p.$$eval("a", (as) => as.map((a) => `${a.innerText.trim()} -> ${a.href}`))).filter((l) => /mason|katy|pay\.withcherry/i.test(l)).join("\n"));
}
console.log(json.join("\n----\n"));
await b.close();
