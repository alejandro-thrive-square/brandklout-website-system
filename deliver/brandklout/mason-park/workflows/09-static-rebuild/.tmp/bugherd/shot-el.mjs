// Screenshot the first element matching a selector, reveals forced visible.
//   node shot-el.mjs <url> "<selector>" <out.png> [width]
import { chromium } from "playwright-core";
const [url, sel, out, w = "1440"] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const p = await b.newPage({ viewport: { width: +w, height: 1000 } });
await p.goto(url, { waitUntil: "load" });
await p.addStyleTag({ content: "*{transition:none!important;animation:none!important}[data-el],[data-split],[data-anim]{opacity:1!important;transform:none!important;clip-path:none!important;visibility:visible!important}" });
await p.waitForTimeout(800);
const el = p.locator(sel).first();
await el.scrollIntoViewIfNeeded();
await p.waitForTimeout(1200);
await el.screenshot({ path: out });
await b.close();
