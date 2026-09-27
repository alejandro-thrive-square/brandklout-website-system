// Contact sheet of the agency's Canva team portraits (2026-09-16), one tile each
// with its file name, so they can be looked at in one image.
//   node team-sheet.mjs <dir> <out.png>
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";
const [dir, out] = process.argv.slice(2);
const files = fs.readdirSync(dir).filter((f) => /.(png|jpe?g)$/i.test(f)).sort();
const tiles = files.map((f) => `<figure><img src="data:image/${f.match(/png$/i) ? "png" : "jpeg"};base64,${fs.readFileSync(path.join(dir, f)).toString("base64")}"><figcaption>${f}</figcaption></figure>`).join("");
const html = `<style>body{margin:0;background:#888;font:12px sans-serif}main{display:grid;grid-template-columns:repeat(5,300px);gap:8px;padding:8px}figure{margin:0;background:#fff}img{width:300px;height:300px;display:block}figcaption{padding:4px}</style><main>${tiles}</main>`;
const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const p = await b.newPage({ viewport: { width: 1556, height: 800 } });
await p.setContent(html);
await p.waitForTimeout(500);
await p.screenshot({ path: out, fullPage: true });
await b.close();
