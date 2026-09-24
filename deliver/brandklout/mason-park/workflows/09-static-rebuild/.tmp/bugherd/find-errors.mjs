// Every 4xx/5xx response, console error and page error on one URL, with sources.
//   node find-errors.mjs <url> [width] > find-errors.log
import { chromium } from "playwright-core";
const [url, w = "1440"] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const p = await b.newPage({ viewport: { width: +w, height: 900 } });
p.on("response", (r) => { if (r.status() >= 400) console.log("HTTP", r.status(), r.url()); });
p.on("console", (m) => { if (m.type() === "error") console.log("console", m.text().slice(0, 200), JSON.stringify(m.location()).slice(0, 200)); });
p.on("pageerror", (e) => console.log("pageerror", e.message, (e.stack || "").split("\n").slice(1, 4).join(" | ")));
await p.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
await p.waitForTimeout(2000);
await p.evaluate(async () => { document.documentElement.style.scrollBehavior = "auto"; for (let y = 0; y < document.body.scrollHeight; y += innerHeight) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 150)); } });
await p.waitForTimeout(2500);
await b.close();
