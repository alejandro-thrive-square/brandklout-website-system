// List the locations on a Cherry practice page's "Select Location" control.
// node cherry-locations.mjs <slug> > cherry-locations.log
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const p = await b.newPage({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36" });
const seen = [];
p.on("response", async (r) => { const ct = r.headers()["content-type"] || ""; if (ct.includes("json")) { try { const t = await r.text(); if (/location|address|katy/i.test(t)) seen.push(r.url().slice(0, 120) + "\n" + t.slice(0, 4000)); } catch {} } });
await p.goto(`https://pay.withcherry.com/${process.argv[2]}`, { waitUntil: "domcontentloaded" });
await p.waitForTimeout(8000);
const sel = await p.$("select");
if (sel) console.log("SELECT", await sel.$$eval("option", (o) => o.map((x) => x.textContent.trim()).join(" | ")));
else {
  const c = p.locator("button[aria-haspopup=dialog]").first();
  await c.click().catch((e) => console.log("click", e.message));
  await p.waitForTimeout(2000);
  console.log("OPTIONS", (await p.$$eval('[role="option"], li', (o) => o.map((x) => x.textContent.trim()).filter(Boolean))).join(" | "));
}
console.log(seen.join("\n----\n"));
await b.close();
