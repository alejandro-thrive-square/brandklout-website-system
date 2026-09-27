// Render pay.withcherry.com/<slug> headless and report what the app says: a practice
// name or a not-found. Usage: node cherry-probe.mjs slug1 slug2 ... > cherry-probe.log
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
for (const s of process.argv.slice(2)) {
  const p = await b.newPage({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36" });
  const api = [];
  p.on("response", async (r) => { if (/api|graphql/i.test(r.url()) && r.request().resourceType() !== "script") api.push(`${r.status()} ${r.url().slice(0, 140)}`); });
  await p.goto(`https://pay.withcherry.com/${s}`, { waitUntil: "networkidle", timeout: 45000 }).catch((e) => api.push("goto " + e.message));
  await p.waitForTimeout(3000);
  const text = (await p.evaluate(() => document.body.innerText)).replace(/\s+/g, " ").slice(0, 300);
  console.log(`== ${s} -> ${p.url()}\n${text}\n${api.join("\n")}`);
  await p.close();
}
await b.close();
