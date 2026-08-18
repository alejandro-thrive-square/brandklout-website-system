// v2-reference capture — visual + content reference of the 6 LIVE staging pages,
// so the v2 rebuild can work from screenshots and a content inventory instead of
// the pages' code. Read-only: plain GETs and headless-Chrome rendering only.
//
// Per page:  page.html, 1440.png / 768.png / 390.png (full page, reduced motion),
//            content.json (sections/texts/images/links/forms from the rendered DOM),
//            metrics.json (bodyHeight per width, sections at 1440).
//
// Gotchas respected (see the task brief):
//   - settle on body height: 4px tolerance, quiet >= 3s, cap 30s
//   - 70s between PAGES (CDN throttles back-to-back runs); 3 widths share one session
//   - --force-prefers-reduced-motion so GSAP pins don't distort captureBeyondViewport
//   - poll readyState after Page.navigate before evaluating anything
//   - throttle signature (img 0x0 / ~1000px body with no text) => discard + retry
//
// Usage: node capture.mjs [slug ...]   (default: all six pages)
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

const OUT = path.dirname(fileURLToPath(import.meta.url));
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "https://grandmissiondentistry.webflow.io/ads-landing-pages";
const ALL = [
  "cosmetic",
  "cosmetic-consultation",
  "cosmetic-thank-you",
  "dental-implants",
  "dental-implants-consultation",
  "dental-implants-thank-you",
];
const PAGES = process.argv.length > 2 ? process.argv.slice(2) : ALL;
const WIDTHS = [1440, 768, 390];
const GAP_MS = 70_000; // between pages, not widths

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

async function fetchHtml(slug) {
  const res = await fetch(`${BASE}/${slug}`, {
    headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) v2-reference-capture" },
  });
  if (!res.ok) throw new Error(`GET /${slug} -> ${res.status}`);
  return await res.text();
}

async function session(fn, { width, height }) {
  const PORT = 9820 + Math.floor(Math.random() * 100);
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-v2ref-"));
  const chrome = spawn(CHROME, [
    "--headless=new",
    // Keep the GPU path: the map embed draws its tiles through WebGL.
    "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
    "--hide-scrollbars",
    "--force-prefers-reduced-motion", // GSAP pins would distort captureBeyondViewport
    "--disable-smooth-scrolling",
    `--window-size=${width},${height}`,
    `--remote-debugging-port=${PORT}`,
    "--remote-allow-origins=*",
    "--force-device-scale-factor=1",
    "--no-first-run",
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
    "--disable-renderer-backgrounding",
    `--user-data-dir=${profile}`,
    "about:blank",
  ]);
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
  if (!wsUrl) { chrome.kill(); throw new Error("Chrome DevTools endpoint never came up"); }
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pend = new Map();
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
  await send("Page.bringToFront", {}, sessionId);
  // Belt and braces alongside the launch flag.
  await send("Emulation.setEmulatedMedia",
    { features: [{ name: "prefers-reduced-motion", value: "reduce" }] }, sessionId);

  const evaluate = (expr) =>
    send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }, sessionId)
      .then((r) => r?.result?.value);
  const setWidth = (w, h, dsf = 1) =>
    send("Emulation.setDeviceMetricsOverride",
      { width: w, height: h, deviceScaleFactor: dsf, mobile: w <= 430 }, sessionId);
  const capture = async () => {
    const { data } = await send("Page.captureScreenshot",
      { format: "png", captureBeyondViewport: true }, sessionId);
    return Buffer.from(data, "base64");
  };

  try {
    return await fn({ send, sessionId, evaluate, capture, setWidth });
  } finally {
    try { ws.close(); } catch {}
    chrome.kill();
    await new Promise((r) => {
      if (chrome.exitCode !== null) return r();
      chrome.once("exit", r);
      setTimeout(r, 2500);
    });
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
  }
}

// Page.navigate then immediate evaluate races the commit — poll readyState first.
async function waitReady(evaluate, capMs = 25_000) {
  const start = Date.now();
  while (Date.now() - start < capMs) {
    let state = null;
    try { state = await evaluate("document.readyState"); } catch {}
    if (state === "complete") return true;
    await wait(300);
  }
  return false;
}

// Walk the page so lazy images decode, then settle on a body height that has
// stopped moving: 4px tolerance, quiet window >= 3s, cap 30s.
const WALK = `(async () => {
  const step = Math.max(300, innerHeight * 0.7);
  const max = () => document.documentElement.scrollHeight;
  for (let y = 0; y < max(); y += step) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
  scrollTo(0, max()); await new Promise(r => setTimeout(r, 600));
  scrollTo(0, 0); await new Promise(r => setTimeout(r, 400));
  return true;
})()`;

async function settle(evaluate) {
  const start = Date.now();
  let prev = -1, quietSince = Date.now(), h = 0;
  while (Date.now() - start < 30_000) {
    h = await evaluate("document.body ? document.body.scrollHeight : 0");
    if (Math.abs(h - prev) > 4) quietSince = Date.now();
    prev = h;
    if (h > 0 && Date.now() - quietSince >= 3_000) break;
    await wait(500);
  }
  return h;
}

const EXTRACT = `(function () {
  function vis(el) {
    if (!el) return false;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") return false;
    return true;
  }
  // sections: prefer real <section>s; fall back to tall structural children.
  let secEls = Array.from(document.querySelectorAll("section"));
  if (secEls.length < 3) {
    const root = document.querySelector("main") || document.body;
    secEls = Array.from(root.children).filter(
      (el) => el.offsetHeight > 80 && !/^(script|style|link)$/i.test(el.tagName)
    );
  }
  const sections = secEls.map((el) => {
    const r = el.getBoundingClientRect();
    const head = el.querySelector("h1,h2,h3");
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      class: (typeof el.className === "string" ? el.className : "").trim() || null,
      offsetTop: Math.round(r.top + scrollY),
      height: Math.round(r.height),
      heading: head ? head.textContent.trim().replace(/\\s+/g, " ") : null,
    };
  });
  // texts: every visible text run, DOM order.
  const texts = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      const p = n.parentElement;
      if (!p || /^(script|style|noscript|template)$/i.test(p.tagName)) return NodeFilter.FILTER_REJECT;
      if (!n.textContent.trim()) return NodeFilter.FILTER_REJECT;
      if (!vis(p)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let n;
  while ((n = walker.nextNode())) texts.push(n.textContent.replace(/\\s+/g, " ").trim());
  // images
  const images = Array.from(document.images).map((img) => {
    const r = img.getBoundingClientRect();
    return {
      src: img.currentSrc || img.src,
      alt: img.alt || "",
      renderedSize: { w: Math.round(r.width), h: Math.round(r.height) },
      naturalSize: { w: img.naturalWidth, h: img.naturalHeight },
      hidden: !vis(img),
    };
  });
  // links
  const links = Array.from(document.querySelectorAll("a[href]")).map((a) => ({
    text: a.textContent.replace(/\\s+/g, " ").trim(),
    href: a.getAttribute("href"),
  }));
  // forms
  const forms = Array.from(document.querySelectorAll("form")).map((f) => ({
    id: f.id || null,
    name: f.getAttribute("data-name") || f.getAttribute("name") || null,
    action: f.getAttribute("action") || null,
    method: f.getAttribute("method") || null,
    fields: Array.from(f.querySelectorAll("input,textarea,select"))
      .filter((el) => el.type !== "hidden")
      .map((el) => ({
        tag: el.tagName.toLowerCase(),
        type: el.type || null,
        name: el.name || null,
        placeholder: el.placeholder || null,
        required: !!el.required,
        label: (el.labels && el.labels[0] && el.labels[0].textContent.trim()) || null,
        options: el.tagName === "SELECT"
          ? Array.from(el.options).map((o) => o.text.trim())
          : undefined,
      })),
  }));
  const embeds = Array.from(document.querySelectorAll("iframe")).map((i) => ({
    src: i.src || i.getAttribute("data-src") || null, title: i.title || null,
  }));
  return {
    title: document.title,
    bodyHeight: document.body.scrollHeight,
    sections, texts, images, links, forms, embeds,
  };
})()`;

function throttleSigns(content, bodyHeight) {
  const problems = [];
  const deadImgs = content.images.filter(
    (i) => !i.hidden && i.renderedSize.w === 0 && i.renderedSize.h === 0 && i.naturalSize.w === 0
  );
  if (deadImgs.length) problems.push(`${deadImgs.length} visible img(s) at 0x0/unloaded`);
  if (bodyHeight < 1200 && content.texts.length < 5)
    problems.push(`body ${bodyHeight}px with ${content.texts.length} text runs (throttled load)`);
  return problems;
}

async function capturePage(slug) {
  const dir = path.join(OUT, slug);
  fs.mkdirSync(dir, { recursive: true });
  const issues = [];

  const html = await fetchHtml(slug);
  fs.writeFileSync(path.join(dir, "page.html"), html);
  log(`${slug}: page.html (${(html.length / 1024).toFixed(0)}KB)`);

  const result = await session(async ({ evaluate, capture, setWidth, send, sessionId }) => {
    const metrics = { bodyHeight: {}, sectionsAt1440: [] };
    let content = null;

    for (const width of WIDTHS) {
      const vh = width <= 430 ? 844 : 900;
      await setWidth(width, vh, 1);
      if (width === WIDTHS[0]) {
        await send("Page.navigate", { url: `${BASE}/${slug}` }, sessionId);
        const ready = await waitReady(evaluate);
        if (!ready) issues.push(`readyState never completed at ${width}`);
      } else {
        await wait(800); // let re-layout kick off before settling fresh
      }
      await evaluate(WALK);
      const bodyH = await settle(evaluate);
      metrics.bodyHeight[width] = bodyH;

      const c = await evaluate(EXTRACT);
      if (!c) { issues.push(`extract returned nothing at ${width}`); continue; }
      const sick = throttleSigns(c, bodyH);
      if (sick.length) issues.push(`${width}px: ${sick.join("; ")}`);

      if (width === 1440) {
        content = c;
        metrics.sectionsAt1440 = c.sections.map((s) => ({
          id: s.id, class: s.class, offsetTop: s.offsetTop, height: s.height, heading: s.heading,
        }));
      }

      // captureBeyondViewport silently wraps past its internal height limit on
      // very tall documents — halve the scale there; layout is identical.
      const dsf = bodyH > 12_000 ? 0.5 : 1;
      if (dsf !== 1) await setWidth(width, vh, dsf);
      await wait(400);
      const png = await capture();
      if (dsf !== 1) await setWidth(width, vh, 1);
      const file = path.join(dir, `${width}.png`);
      fs.writeFileSync(file, png);
      if (png.length < 50 * 1024) issues.push(`${width}.png only ${(png.length / 1024).toFixed(0)}KB`);
      log(`${slug}: ${width}.png (${(png.length / 1024).toFixed(0)}KB, body ${bodyH}px)`);
    }
    return { metrics, content };
  }, { width: 1440, height: 900 });

  const { metrics, content } = result;
  if (content) {
    fs.writeFileSync(path.join(dir, "content.json"), JSON.stringify({
      sections: content.sections,
      texts: content.texts,
      images: content.images.map(({ src, alt, renderedSize }) => ({ src, alt, renderedSize })),
      links: content.links,
      forms: content.forms,
      embeds: content.embeds,
      title: content.title,
    }, null, 2));
    const isThankYou = /thank-you/.test(slug);
    if (!isThankYou && content.texts.length <= 20)
      issues.push(`only ${content.texts.length} text runs on a main LP`);
  } else {
    issues.push("no content extracted at 1440");
  }
  fs.writeFileSync(path.join(dir, "metrics.json"), JSON.stringify(metrics, null, 2));

  return {
    slug,
    ok: issues.length === 0,
    issues,
    bodyHeight: metrics.bodyHeight,
    sections: metrics.sectionsAt1440.length,
    texts: content ? content.texts.length : 0,
    images: content ? content.images.length : 0,
    formFields: content ? content.forms.reduce((n, f) => n + f.fields.length, 0) : 0,
    title: content ? content.title : null,
  };
}

const summary = [];
for (let i = 0; i < PAGES.length; i++) {
  if (i > 0) { log(`waiting ${GAP_MS / 1000}s before next page (CDN throttle)`); await wait(GAP_MS); }
  const slug = PAGES[i];
  log(`=== ${slug} ===`);
  try {
    summary.push(await capturePage(slug));
  } catch (e) {
    summary.push({ slug, ok: false, issues: [`crashed: ${e.message}`] });
    log(`${slug}: CRASH ${e.message}`);
  }
}

// One retry pass for anything that failed, after a 75s cool-down.
const failed = summary.filter((s) => !s.ok);
if (failed.length) {
  log(`retrying ${failed.length} page(s) after 75s: ${failed.map((f) => f.slug).join(", ")}`);
  for (const f of failed) {
    await wait(75_000);
    log(`=== RETRY ${f.slug} ===`);
    try {
      const r = await capturePage(f.slug);
      r.retried = true;
      summary[summary.findIndex((s) => s.slug === f.slug)] = r;
    } catch (e) {
      f.issues.push(`retry crashed: ${e.message}`);
    }
  }
}

fs.writeFileSync(path.join(OUT, "capture-summary.json"), JSON.stringify(summary, null, 2));
log("DONE");
for (const s of summary) {
  log(`${s.ok ? "OK  " : "FAIL"} ${s.slug} heights=${JSON.stringify(s.bodyHeight)} sections=${s.sections} texts=${s.texts} imgs=${s.images} fields=${s.formFields}${s.issues?.length ? " issues: " + s.issues.join(" | ") : ""}`);
}
process.exit(summary.every((s) => s.ok) ? 0 : 1);
