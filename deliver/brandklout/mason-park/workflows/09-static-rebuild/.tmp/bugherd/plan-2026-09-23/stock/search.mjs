// node search.mjs <slug> "<query>" [limit]  -> prev/<slug>/<id>.jpg + sheet-<slug>.png + prev/<slug>/meta.json
// node search.mjs --dl <id> <key>            -> <key>.<ext>
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { chromium } from "playwright-core";

const here = import.meta.dirname;
const envTxt = fs.readFileSync(path.join(os.homedir(), ".webzite", ".env"), "utf8");
const KEY = (envTxt.match(/^\s*MAGNIFIC\s*=\s*"?([^"\r\n]+)"?/m) || [])[1];
if (!KEY) throw new Error("no MAGNIFIC key");
const H = { "x-freepik-api-key": KEY, "Accept-Language": "en-US" };

async function get(url, json = true) {
  for (let i = 0; i < 5; i++) {
    const r = await fetch(url, { headers: url.includes("freepik.com") ? H : {} });
    if (r.status >= 500 || r.status === 429) { await new Promise((s) => setTimeout(s, 1500 * (i + 1))); continue; }
    if (!r.ok) throw new Error(url.replace(KEY, "***") + " -> " + r.status + " " + (await r.text()).slice(0, 300));
    return json ? r.json() : Buffer.from(await r.arrayBuffer());
  }
  throw new Error("retries exhausted " + url);
}

const a = process.argv.slice(2);
if (a[0] === "--dl") {
  const [, id, key] = a;
  const j = await get(`https://api.freepik.com/v1/resources/${id}/download`);
  const d = j.data || j;
  const url = d.url || d.signed_url;
  const buf = await get(url, false);
  const ext = (d.filename || url).split("?")[0].split(".").pop().toLowerCase();
  if (ext === "zip") throw new Error("zip download " + d.filename);
  const out = path.join(here, `${key}.${ext}`);
  fs.writeFileSync(out, buf);
  console.log("saved", out, buf.length, d.filename);
  process.exit(0);
}

const [slug, q, limit = "24"] = a;
const u = `https://api.freepik.com/v1/resources?term=${encodeURIComponent(q)}&filters[content_type][photo]=1&limit=${limit}`;
const j = await get(u);
const dir = path.join(here, "prev", slug);
fs.mkdirSync(dir, { recursive: true });
const meta = [];
for (const it of j.data || []) {
  const src = it.image?.source?.url;
  if (!src) continue;
  try {
    const b = await get(src, false);
    fs.writeFileSync(path.join(dir, `${it.id}.jpg`), b);
    meta.push({ id: it.id, title: it.title, ai: !!(it.meta?.is_ai_generated ?? it.image?.type === "ai"), size: it.image?.source?.size, orient: it.image?.orientation, licenses: (it.licenses || []).map((l) => l.type) });
  } catch (e) { console.log("prev fail", it.id, e.message); }
}
fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify(meta, null, 1));
const cells = meta.map((m) => {
  const b64 = fs.readFileSync(path.join(dir, `${m.id}.jpg`)).toString("base64");
  return `<div class=c><img src="data:image/jpeg;base64,${b64}"><b>${m.id}${m.ai ? " AI" : ""}</b></div>`;
}).join("");
const html = `<style>body{margin:0;background:#fff;font:14px sans-serif}.g{display:grid;grid-template-columns:repeat(6,260px);gap:4px}.c{position:relative;height:200px;background:#eee}.c img{width:100%;height:100%;object-fit:contain}.c b{position:absolute;left:0;top:0;background:#000;color:#ff0;padding:1px 4px}</style><div class=g>${cells}</div>`;
const browser = await chromium.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" });
const page = await browser.newPage({ viewport: { width: 6 * 264, height: 400 } });
await page.setContent(html);
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(here, `sheet-${slug}.png`), fullPage: true });
await browser.close();
console.log(slug, meta.length, meta.map((m) => `${m.id}${m.ai ? "(AI)" : ""}: ${m.title}`).join("\n"));
