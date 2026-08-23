// outline.mjs — turn a captured page.html into a per-section BUILD OUTLINE:
// for each <section>, the ordered list of headings / paragraphs / list items /
// images / links / buttons it contains, with the asset id parsed out of every
// image URL. This is what the v2 build is authored from — never the class names.
//
// Structure only: the file is loaded from disk with no stylesheet, so nothing here
// depends on the CDN or on the page's CSS.
//
// Usage: node outline.mjs [slug ...]   (default: all six) -> <slug>/outline.json
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

const OUT = path.dirname(fileURLToPath(import.meta.url));
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const ALL = ["cosmetic", "cosmetic-consultation", "cosmetic-thank-you",
  "dental-implants", "dental-implants-consultation", "dental-implants-thank-you"];
const PAGES = process.argv.length > 2 ? process.argv.slice(2) : ALL;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const PORT = 9700 + Math.floor(Math.random() * 90);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-outline-"));
const chrome = spawn(CHROME, ["--headless=new", "--hide-scrollbars", "--no-first-run",
  "--allow-file-access-from-files", `--remote-debugging-port=${PORT}`,
  "--remote-allow-origins=*", `--user-data-dir=${profile}`, "about:blank"]);
const getJSON = (p) => new Promise((res, rej) => {
  http.get({ host: "127.0.0.1", port: PORT, path: p }, (r) => {
    let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res(JSON.parse(d)));
  }).on("error", rej);
});
let wsUrl = null;
for (let i = 0; i < 80 && !wsUrl; i++) {
  try { wsUrl = (await getJSON("/json/version")).webSocketDebuggerUrl; } catch {}
  if (!wsUrl) await wait(200);
}
const ws = new WebSocket(wsUrl);
let id = 0; const pend = new Map();
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
});
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
  const i = ++id;
  pend.set(i, (m) => (m.error ? rej(new Error(`${method}: ${m.error.message}`)) : res(m.result)));
  ws.send(JSON.stringify({ id: i, method, params, sessionId }));
});
const { targetInfos } = await send("Target.getTargets");
const t = targetInfos.find((x) => x.type === "page");
const { sessionId } = await send("Target.attachToTarget", { targetId: t.targetId, flatten: true });
await send("Page.enable", {}, sessionId);
await send("Runtime.enable", {}, sessionId);
const ev = (e) => send("Runtime.evaluate",
  { expression: e, returnByValue: true, awaitPromise: true }, sessionId).then((r) => r?.result?.value);

const EXTRACT = `(() => {
  const assetId = (u) => { const m = (u||'').match(/website-files\\.com\\/[0-9a-f]{24}\\/([0-9a-f]{24})_/); return m ? m[1] : null; };
  const clean = (s) => (s||'').replace(/\\s+/g,' ').trim();
  const roots = [...document.querySelectorAll('body > *')].filter(n => n.nodeType === 1);
  const sections = [];
  const walk = (el, out, depth) => {
    for (const c of el.children) {
      const tag = c.tagName.toLowerCase();
      if (/^h[1-6]$/.test(tag)) { out.push({ k: 'h', lvl: +tag[1], t: clean(c.innerText), html: clean(c.innerHTML).slice(0,400) }); continue; }
      if (tag === 'p') { const t = clean(c.innerText); if (t) out.push({ k: 'p', t, html: clean(c.innerHTML).slice(0,600) }); continue; }
      if (tag === 'img') { out.push({ k: 'img', asset: assetId(c.currentSrc || c.src), src: (c.src||'').split('/').pop(), alt: c.alt || '', w: c.getAttribute('width'), h: c.getAttribute('height') }); continue; }
      if (tag === 'a') { out.push({ k: 'a', t: clean(c.innerText), href: c.getAttribute('href'), cls: c.className }); walk(c, out, depth+1); continue; }
      if (tag === 'li') { const t = clean(c.innerText); if (t) out.push({ k: 'li', t }); walk(c, out, depth+1); continue; }
      if (tag === 'button') { out.push({ k: 'btn', t: clean(c.innerText) }); continue; }
      if (tag === 'iframe') { out.push({ k: 'iframe', src: c.getAttribute('src') }); continue; }
      if (tag === 'script' || tag === 'style' || tag === 'noscript' || tag === 'svg') continue;
      if (tag === 'section' && depth > 0) { out.push({ k: 'nested-section', cls: c.className }); }
      // a leaf div/span whose only content is text
      if (!c.children.length) { const t = clean(c.innerText); if (t) out.push({ k: 't', tag, t }); continue; }
      walk(c, out, depth + 1);
    }
  };
  const collect = (el, i) => {
    const items = [];
    walk(el, items, 0);
    sections.push({ i, tag: el.tagName.toLowerCase(), cls: el.className || null, domId: el.id || null, items });
  };
  let i = 0;
  const secs = [...document.querySelectorAll('body section, body header, body footer, body main > div')];
  const top = secs.filter(s => !secs.some(o => o !== s && o.contains(s)));
  for (const s of top) collect(s, i++);
  return { count: top.length, sections };
})()`;

for (const slug of PAGES) {
  const f = path.resolve(OUT, slug, "page.html").replace(/\\/g, "/");
  await send("Page.navigate", { url: "file:///" + f }, sessionId);
  for (let k = 0; k < 200; k++) {
    if (await ev("document.readyState==='complete'")) break;
    await wait(100);
  }
  await wait(300);
  const res = await ev(EXTRACT);
  fs.writeFileSync(path.join(OUT, slug, "outline.json"), JSON.stringify(res, null, 1));
  console.log(slug, "sections", res.count, "items",
    res.sections.reduce((a, s) => a + s.items.length, 0));
}
ws.close(); chrome.kill();
try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
