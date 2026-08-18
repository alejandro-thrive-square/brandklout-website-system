// tree.mjs — the STRUCTURAL half of the spec. outline.json says what copy a section holds
// and in what order; it does not say what is nested inside what, and a rebuild cannot infer
// a two-column layout from a flat list. This renders the LIVE page at one width and emits a
// pruned nested tree per section: tag, class chain, rect, and the layout facts that decide
// the markup (display, grid tracks, flex direction), plus text/asset on leaves.
//
// Pruning: a wrapper that adds no layout and no content (single child, same box) is collapsed,
// so the tree reads as the structure a person would build rather than the converter's stack.
//
// Usage: node tree.mjs <slug> [width=1440]  ->  <slug>/tree-<width>.json
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

const OUT = path.dirname(fileURLToPath(import.meta.url));
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "https://grandmissiondentistry.webflow.io/ads-landing-pages";
const SLUG = process.argv[2];
const WIDTH = +(process.argv[3] || 1440);
if (!SLUG) { console.error("usage: node tree.mjs <slug> [width]"); process.exit(1); }
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const EXTRACT = `(() => {
  const R = (el) => { const r = el.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; };
  const clean = (s) => (s || '').replace(/\\s+/g, ' ').trim();
  const assetId = (u) => { const m = (u||'').match(/website-files\\.com\\/[0-9a-f]{24}\\/([0-9a-f]{24})_/); return m ? m[1] : null; };
  const SKIP = new Set(['SCRIPT','STYLE','NOSCRIPT','SVG','PATH','BR']);

  const node = (el, depth) => {
    if (SKIP.has(el.tagName)) return null;
    const cs = getComputedStyle(el);
    if (cs.display === 'none') return null;
    const tag = el.tagName.toLowerCase();
    const o = { tag, cls: el.getAttribute('class') || undefined, box: R(el) };
    if (cs.display === 'grid' || cs.display === 'inline-grid') {
      o.layout = 'grid';
      o.cols = cs.gridTemplateColumns;
      if (cs.gap && cs.gap !== 'normal') o.gap = cs.gap;
    } else if (cs.display === 'flex' || cs.display === 'inline-flex') {
      o.layout = 'flex';
      o.dir = cs.flexDirection;
      if (cs.flexWrap !== 'nowrap') o.wrap = cs.flexWrap;
      o.align = cs.alignItems; o.justify = cs.justifyContent;
      if (cs.gap && cs.gap !== 'normal') o.gap = cs.gap;
    }
    if (cs.position !== 'static') o.pos = cs.position;
    if (tag === 'img') { o.asset = assetId(el.currentSrc || el.src); o.alt = el.alt || ''; return o; }
    if (tag === 'iframe') { o.src = el.getAttribute('src'); return o; }
    if (tag === 'a') { o.href = el.getAttribute('href'); }
    if (/^h[1-6]$/.test(tag)) { o.text = clean(el.innerText); return o; }

    const kids = [];
    for (const c of el.children) { const k = node(c, depth + 1); if (k) kids.push(k); }
    // direct text of this element, ignoring what the children carry
    const own = clean([...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(' '));
    if (own) o.text = own;
    if (kids.length) o.kids = kids;
    else if (!o.text) { const t = clean(el.innerText); if (t) o.text = t; }

    // collapse a wrapper that adds nothing: one child, same box, no layout/position of its own
    if (o.kids && o.kids.length === 1 && !o.text && !o.layout && !o.pos && !o.href) {
      const k = o.kids[0];
      if (Math.abs(k.box[0] - o.box[0]) < 2 && Math.abs(k.box[1] - o.box[1]) < 2) return k;
    }
    return o;
  };

  const secs = [...document.querySelectorAll('body section, body header, body footer')];
  const top = secs.filter((s) => !secs.some((o) => o !== s && o.contains(s)));
  return { width: window.innerWidth, sections: top.map((s, i) => ({ i, ...node(s, 0) })) };
})()`;

const PORT = 9840 + Math.floor(Math.random() * 60);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-tree-"));
const chrome = spawn(CHROME, ["--headless=new", "--hide-scrollbars", "--force-prefers-reduced-motion",
  `--window-size=${Math.max(WIDTH, 520)},1000`, "--no-first-run",
  `--remote-debugging-port=${PORT}`, "--remote-allow-origins=*", `--user-data-dir=${profile}`, "about:blank"]);
const getJSON = (p) => new Promise((res, rej) => {
  http.get({ host: "127.0.0.1", port: PORT, path: p }, (r) => {
    let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res(JSON.parse(d)));
  }).on("error", rej);
});
let wsUrl = null;
for (let i = 0; i < 100 && !wsUrl; i++) {
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
await send("Emulation.setDeviceMetricsOverride",
  { width: WIDTH, height: 1000, deviceScaleFactor: 1, mobile: WIDTH < 768 }, sessionId);
const ev = (e) => send("Runtime.evaluate",
  { expression: e, returnByValue: true, awaitPromise: true }, sessionId).then((r) => r?.result?.value);
await send("Page.navigate", { url: `${BASE}/${SLUG}?t=${WIDTH}` }, sessionId);
for (let k = 0; k < 300; k++) { if (await ev("document.readyState==='complete'")) break; await wait(100); }
await wait(2500);
// Sentinel: an unstyled load yields a plausible-looking tree with the wrong layout everywhere.
const sentinel = await ev("getComputedStyle(document.querySelector('.header, header')).position");
if (!/fixed|sticky|absolute|relative/.test(sentinel || "")) throw new Error(`unstyled load (header position ${sentinel})`);
const res = await ev(EXTRACT);
fs.writeFileSync(path.join(OUT, SLUG, `tree-${WIDTH}.json`), JSON.stringify(res, null, 1));
const count = (n) => 1 + (n.kids || []).reduce((a, k) => a + count(k), 0);
console.log(SLUG, WIDTH, "sections", res.sections.length, "nodes", res.sections.reduce((a, s) => a + count(s), 0));
ws.close(); chrome.kill();
try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
