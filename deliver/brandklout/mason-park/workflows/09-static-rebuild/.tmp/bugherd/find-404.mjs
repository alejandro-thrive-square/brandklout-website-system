// Print every 4xx/5xx response a page makes. node find-404.mjs <url> > find-404.log
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on("response", (r) => { if (r.status() >= 400) console.log(r.status(), r.url()); });
p.on("console", (m) => { if (m.type() === "error") console.log("console", m.text().slice(0, 200), JSON.stringify(m.location())); });
await p.goto(process.argv[2], { waitUntil: "domcontentloaded" });
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo({ top: y, behavior: "instant" }); await new Promise((r) => setTimeout(r, 120)); } });
await p.waitForTimeout(2500);
await b.close();
