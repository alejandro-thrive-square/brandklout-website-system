// measure.mjs — the numeric half of the spec. For each LIVE reference page, render it at
// 1440 / 991 / 767 / 478 and dump the computed styles of every element, keyed by its class
// chain, so the v2 client-first classes can be authored to the reference's own values
// instead of guessed from screenshots.
//
// One record per DISTINCT class chain (first element wins; count says how many share it).
// Only the properties a rebuild actually has to reproduce are kept.
//
// A load whose stylesheet failed produces plausible-looking garbage, so every run asserts a
// sentinel first: the header must compute position:sticky|fixed. If it does not, the run is
// discarded and retried.
//
// Usage: node measure.mjs [slug ...]  ->  <slug>/styles.json
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

const OUT = path.dirname(fileURLToPath(import.meta.url));
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "https://grandmissiondentistry.webflow.io/ads-landing-pages";
const ALL = ["cosmetic", "cosmetic-consultation", "cosmetic-thank-you",
  "dental-implants", "dental-implants-consultation", "dental-implants-thank-you"];
const PAGES = process.argv.length > 2 ? process.argv.slice(2) : ALL;
const WIDTHS = [1920, 1440, 1280, 1100, 991, 767, 478];
// The default filter keys off the converter's own prefixes. A few sections (the header, the
// "how it works" band, the FAQ accordion chrome) carry generic class names instead, so they
// are measured by a second pass: MATCH=<regex> OUT=<file> node measure.mjs <slug>
// NB the double backslash: in a JS string "\s" collapses to a literal "s", which turned this
// into (^|s)... and silently dropped every element whose matching prefix was not the first
// class on the attribute (the hero CTA, `vnr-a lw-btn lw-btn--gold`, was the one that showed it).
const MATCH = process.env.MATCH || "(^|\\s)(imp|csm|ty|landing|qz|lw)-";
const OUTNAME = process.env.OUT || "styles.json";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

const PROPS = ["display", "position", "grid-template-columns", "grid-template-rows",
  "flex-direction", "flex-wrap", "align-items", "justify-content", "gap",
  "width", "max-width", "min-height", "height", "aspect-ratio",
  "padding-top", "padding-right", "padding-bottom", "padding-left",
  "margin-top", "margin-right", "margin-bottom", "margin-left",
  "font-family", "font-size", "font-weight", "line-height", "letter-spacing",
  "text-transform", "text-align", "color", "background-color", "background-image",
  "border-radius", "border-top-width", "border-top-color", "border-left-width",
  "border-left-color", "box-shadow", "opacity", "overflow", "object-fit"];

const EXTRACT = `(() => {
  const PROPS = ${JSON.stringify(PROPS)};
  const out = {}; let n = 0;
  for (const el of document.querySelectorAll('body *')) {
    const cls = (el.getAttribute('class') || '').trim();
    if (!cls) continue;
    if (!new RegExp(${JSON.stringify(MATCH)}).test(cls)) continue;
    const key = el.tagName.toLowerCase() + '.' + cls.split(/\\s+/).join('.');
    if (out[key]) { out[key].count++; continue; }
    const cs = getComputedStyle(el);
    const v = {};
    for (const p of PROPS) { const x = cs.getPropertyValue(p); if (x && x !== 'none' && x !== 'normal' && x !== 'auto' && x !== '0px') v[p] = x; }
    const r = el.getBoundingClientRect();
    out[key] = { count: 1, rect: { w: Math.round(r.width), h: Math.round(r.height) }, css: v };
    n++;
  }
  const hdr = document.querySelector('.header, header');
  const sentinel = hdr ? getComputedStyle(hdr).position : 'no-header';
  return { sentinel, distinct: n, styles: out };
})()`;

// Lazy images report 0x0 (or a collapsed height) until they are scrolled to, and a rebuild
// that bakes those numbers ships a 46px-tall banner. Walk the whole page first, wait for
// every <img> to report complete, then return to the top before measuring.
const settleImages = async (ev) => {
  await ev(`(async () => {
    const step = Math.round(window.innerHeight * 0.8);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 600));
    for (let i = 0; i < 60; i++) {
      const imgs = [...document.images];
      if (imgs.every((im) => im.complete)) break;
      await new Promise((r) => setTimeout(r, 250));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 500));
    return [...document.images].filter((im) => !im.complete).length;
  })()`);
};

async function session(fn, width) {
  const PORT = 9750 + Math.floor(Math.random() * 90);
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-measure-"));
  const chrome = spawn(CHROME, ["--headless=new", "--hide-scrollbars",
    "--force-prefers-reduced-motion", "--disable-smooth-scrolling",
    `--window-size=${Math.max(width, 520)},1000`, "--no-first-run",
    `--remote-debugging-port=${PORT}`, "--remote-allow-origins=*",
    `--user-data-dir=${profile}`, "about:blank"]);
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
  try {
    const { targetInfos } = await send("Target.getTargets");
    const t = targetInfos.find((x) => x.type === "page");
    const { sessionId } = await send("Target.attachToTarget", { targetId: t.targetId, flatten: true });
    await send("Page.enable", {}, sessionId);
    await send("Runtime.enable", {}, sessionId);
    // Chrome floors the WINDOW at ~500px on Windows, so the layout viewport has to be
    // forced through the emulation override or every sub-500 measurement is a lie.
    await send("Emulation.setDeviceMetricsOverride",
      { width, height: 1000, deviceScaleFactor: 1, mobile: width < 768 }, sessionId);
    return await fn(send, sessionId);
  } finally {
    ws.close(); chrome.kill();
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
  }
}

for (const slug of PAGES) {
  const acc = {};
  for (const width of WIDTHS) {
    let res = null;
    for (let attempt = 0; attempt < 3 && !res; attempt++) {
      const r = await session(async (send, sessionId) => {
        const ev = (e) => send("Runtime.evaluate",
          { expression: e, returnByValue: true, awaitPromise: true }, sessionId).then((x) => x?.result?.value);
        await send("Page.navigate", { url: `${BASE}/${slug}?m=${width}` }, sessionId);
        for (let k = 0; k < 300; k++) {
          if (await ev("document.readyState==='complete'")) break;
          await wait(100);
        }
        await wait(1200);
        await settleImages(ev);
        return await ev(EXTRACT);
      }, width);
      if (r && /sticky|fixed|absolute|relative/.test(r.sentinel)) res = r;
      else { log(`${slug} @${width}: sentinel "${r?.sentinel}" — discarding, retry`); await wait(20000); }
    }
    if (!res) throw new Error(`${slug} @${width}: no styled load after 3 attempts`);
    for (const [k, v] of Object.entries(res.styles)) {
      (acc[k] ||= { count: v.count, byWidth: {} }).byWidth[width] = { rect: v.rect, css: v.css };
    }
    log(`${slug} @${width}: ${res.distinct} distinct chains (sentinel ${res.sentinel})`);
    await wait(6000);
  }
  fs.writeFileSync(path.join(OUT, slug, OUTNAME), JSON.stringify(acc, null, 1));
  log(`${slug}: ${OUTNAME} ${Object.keys(acc).length} chains`);
  await wait(20000);
}
