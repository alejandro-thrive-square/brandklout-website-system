// Full-page reference screenshots, walked in steps so scroll reveals fire.
//   node ref-shot.mjs <url> <out.png> [width]
import { chromium } from 'playwright-core';
const [url, out, w = '1440'] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const p = await b.newPage({ viewport: { width: +w, height: 900 }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36' });
await p.goto(url, { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {});
await p.addStyleTag({ content: 'html,body{scroll-behavior:auto!important}' });
const H = await p.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < H; y += 600) { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(250); }
await p.waitForTimeout(1500);
await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(800);
await p.screenshot({ path: out, fullPage: true });
console.log(out, await p.evaluate(() => document.documentElement.scrollHeight));
await b.close();
