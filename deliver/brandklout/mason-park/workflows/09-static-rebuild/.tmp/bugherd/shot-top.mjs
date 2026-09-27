// Screenshot the first 1800px of a page, motion settled. node shot-top.mjs <url> <out.png> [width]
import { chromium } from "playwright-core";
const [url, out, w = "1440"] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const p = await b.newPage({ viewport: { width: +w, height: 1800 } });
await p.goto(url, { waitUntil: "load", timeout: 60000 });
await p.waitForTimeout(3000);
await p.screenshot({ path: out });
await b.close();
