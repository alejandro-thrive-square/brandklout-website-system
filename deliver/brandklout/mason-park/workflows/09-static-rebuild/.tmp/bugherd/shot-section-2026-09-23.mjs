// Screenshot one section of one page, with every reveal forced visible, so a
// grid can be looked at as a whole. Base defaults to serve.mjs on :8089.
//
//   node shot-section-2026-09-23.mjs /services/crown-lengthening/ qualify [width] [base] > log
import { chromium } from "playwright-core";
import fs from "node:fs";

const [page_, id, w = "1440", base = "http://127.0.0.1:8089"] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" });
const page = await browser.newPage({ viewport: { width: +w, height: 1000 } });
await page.goto(base + page_, { waitUntil: "load" });
await page.addStyleTag({ content: "*{transition:none!important;animation:none!important}[data-el],[data-split],.svc-card,.svc-card_media,.svc-card_media img{opacity:1!important;transform:none!important;clip-path:none!important;visibility:visible!important}" });
await page.evaluate(async () => {
  document.documentElement.style.scrollBehavior = "auto";
  for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
  for (const i of document.images) { i.loading = "eager"; }
  await Promise.all([...document.images].map((i) => i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; })));
});
await page.waitForTimeout(800);
const el = await page.$(`section#${id}, section.${id}`);
fs.mkdirSync("shots-2026-09-23", { recursive: true });
const out = `shots-2026-09-23/${page_.replace(/\W+/g, "_")}${id}-${w}.png`;
await el.screenshot({ path: out });
console.log(out);
await browser.close();
