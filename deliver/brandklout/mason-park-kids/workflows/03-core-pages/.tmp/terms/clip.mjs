import { chromium } from "playwright-core";
const [url, sel, width, out] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const p = await b.newPage({ viewport: { width: +width, height: 900 } });
await p.goto(url, { waitUntil: "load" });
await p.addStyleTag({ content: "html{scroll-behavior:auto!important}#termly-code-snippet-support{display:none!important}" });
const h = await p.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < h; y += 400) { await p.evaluate((yy) => scrollTo(0, yy), y); await p.waitForTimeout(80); }
const el = p.locator(sel); await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(1500);
await el.screenshot({ path: out }); await b.close();
