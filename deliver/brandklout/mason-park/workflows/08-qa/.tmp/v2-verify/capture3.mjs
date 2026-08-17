// Phase-3 QA capture — adapted from v2-reference/capture.mjs (original untouched).
// Differences from the reference harness:
//   - output dir is a CLI arg, so the same code captures v2 pages and the legacy re-run
//   - scrollWidth vs innerWidth recorded per width (mobile horizontal-overflow assertion)
//   - the reshoot.mjs scaling rule is folded in (dsf = 8100 / bodyHeight when tall),
//     so no separate reshoot pass is needed
// Usage: node capture2.mjs <outDirAbs> <slug> [slug ...]
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";

const OUT = process.argv[2];
const PAGES = process.argv.slice(3);
if (!OUT || !PAGES.length) { console.error("usage: node capture2.mjs <outDir> <slug>..."); process.exit(2); }
fs.mkdirSync(OUT, { recursive: true });

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "https://mason-park-dental.webflow.io";
const WIDTHS = [1440, 768, 390];
const GAP_MS = 70_000;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

async function fetchHtml(slug) {
  const res = await fetch(`${BASE}/${slug}`, {
    headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) v2-qa-capture" },
  });
  if (!res.ok) throw new Error(`GET /${slug} -> ${res.status}`);
  return await res.text();
}

async function session(fn, { width, height }) {
  const PORT = 9700 + Math.floor(Math.random() * 100);
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-v2qa-"));
  const chrome = spawn(CHROME, [
    "--headless=new",
    "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
    "--hide-scrollbars",
    "--force-prefers-reduced-motion",
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
  const images = Array.from(document.images).map((img) => {
    const r = img.getBoundingClientRect();
    return {
      src: img.currentSrc || img.src,
      alt: img.alt || "",
      renderedSize: { w: Math.round(r.width), h: Math.round(r.height) },
      naturalSize: { w: img.naturalWidth, h: img.naturalHeight },
      complete: img.complete,
      hidden: !vis(img),
    };
  });
  const links = Array.from(document.querySelectorAll("a[href]")).map((a) => ({
    text: a.textContent.replace(/\\s+/g, " ").trim(),
    href: a.getAttribute("href"),
  }));
  const forms = Array.from(document.querySelectorAll("form")).map((f) => ({
    id: f.id || null,
    name: f.getAttribute("data-name") || f.getAttribute("name") || null,
    action: f.getAttribute("action") || null,
    method: f.getAttribute("method") || null,
    rect: (() => { const r = f.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; })(),
    fields: Array.from(f.querySelectorAll("input,textarea,select"))
      .filter((el) => el.type !== "hidden")
      .map((el) => {
        const r = el.getBoundingClientRect();
        return {
          tag: el.tagName.toLowerCase(),
          type: el.type || null,
          name: el.name || null,
          placeholder: el.placeholder || null,
          required: !!el.required,
          visibleSize: { w: Math.round(r.width), h: Math.round(r.height) },
          label: (el.labels && el.labels[0] && el.labels[0].textContent.trim()) || null,
          options: el.tagName === "SELECT"
            ? Array.from(el.options).map((o) => o.text.trim())
            : undefined,
        };
      }),
  }));
  const embeds = Array.from(document.querySelectorAll("iframe")).map((i) => ({
    src: i.src || i.getAttribute("data-src") || null, title: i.title || null,
  }));
  // horizontal overflow assertion — BOX GEOMETRY against documentElement.clientWidth.
  // scrollWidth is vacuous here: body{overflow-x:clip} caps it at the viewport.
  // window.innerWidth is NOT the layout viewport under mobile emulation (it reports the
  // zoomed-out width), so every comparison below uses documentElement.clientWidth.
  const overflow = (() => {
    const cw = document.documentElement.clientWidth;
    const out = [];
    let widest = 0, widestEl = null;
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none") continue;
      const right = r.right + scrollX;
      if (right > widest) {
        widest = right;
        widestEl = {
          tag: el.tagName.toLowerCase(),
          cls: (typeof el.className === "string" ? el.className : "").trim().slice(0, 90),
          left: Math.round(r.left + scrollX), right: Math.round(right),
        };
      }
      if (right > cw + 1 || r.left + scrollX < -1) {
        if (out.length <= 25) out.push({
          tag: el.tagName.toLowerCase(),
          cls: (typeof el.className === "string" ? el.className : "").trim().slice(0, 90),
          left: Math.round(r.left + scrollX), right: Math.round(right),
        });
      }
    }
    return {
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      innerWidth: window.innerWidth,
      clientWidth: cw,
      widestRight: Math.round(widest),
      widestEl,
      offenders: out,
    };
  })();
  // hero <h1> contrast (S2 gate)
  const headingContrast = (() => {
    const h1 = document.querySelector("h1");
    if (!h1) return null;
    const srgb = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    const lum = ([r, g, b]) => 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
    const parse = (s) => { const m = s.match(/[\\d.]+/g); return m ? m.slice(0, 3).map(Number) : null; };
    const alpha = (s) => { const m = s.match(/rgba?\\(([^)]+)\\)/); if (!m) return 1; const p = m[1].split(","); return p.length > 3 ? parseFloat(p[3]) : 1; };
    const fg = parse(getComputedStyle(h1).color);
    let bgEl = h1, bg = null;
    while (bgEl) {
      const cs = getComputedStyle(bgEl);
      if (cs.backgroundColor && cs.backgroundColor !== "transparent" && alpha(cs.backgroundColor) > 0.05) { bg = parse(cs.backgroundColor); break; }
      bgEl = bgEl.parentElement;
    }
    if (!bg) bg = [255, 255, 255];
    const l1 = lum(fg), l2 = lum(bg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    return {
      text: h1.textContent.replace(/\\s+/g, " ").trim().slice(0, 80),
      color: getComputedStyle(h1).color,
      bg: "rgb(" + bg.join(", ") + ")",
      bgFrom: bgEl ? (bgEl.tagName.toLowerCase() + "." + (typeof bgEl.className === "string" ? bgEl.className.trim().split(/\\s+/)[0] : "")) : "default-white",
      contrast: Math.round(ratio * 100) / 100,
    };
  })();
  return {
    title: document.title,
    bodyHeight: document.body.scrollHeight,
    sections, texts, images, links, forms, embeds, overflow, headingContrast,
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

// hard throttle signature -> discard the whole page run and retry
function throttled(content, bodyHeight) {
  if (!content) return true;
  if (bodyHeight > 0 && bodyHeight < 1200) return true;
  if (content.texts.length < 15) return true;
  return false;
}

async function capturePage(slug) {
  const dir = path.join(OUT, slug);
  fs.mkdirSync(dir, { recursive: true });
  const issues = [];

  const html = await fetchHtml(slug);
  fs.writeFileSync(path.join(dir, "page.html"), html);
  log(`${slug}: page.html (${(html.length / 1024).toFixed(0)}KB)`);

  const result = await session(async ({ evaluate, capture, setWidth, send, sessionId }) => {
    const metrics = { bodyHeight: {}, overflow: {}, sectionsAt1440: [], sectionsByWidth: {} };
    let content = null;
    let hardThrottle = false;

    for (const width of WIDTHS) {
      const vh = width <= 430 ? 844 : 900;
      await setWidth(width, vh, 1);
      if (width === WIDTHS[0]) {
        await send("Page.navigate", { url: `${BASE}/${slug}` }, sessionId);
        const ready = await waitReady(evaluate);
        if (!ready) issues.push(`readyState never completed at ${width}`);
      } else {
        await wait(800);
      }
      await evaluate(WALK);
      const bodyH = await settle(evaluate);
      metrics.bodyHeight[width] = bodyH;

      const c = await evaluate(EXTRACT);
      if (!c) { issues.push(`extract returned nothing at ${width}`); hardThrottle = true; continue; }
      if (throttled(c, bodyH)) hardThrottle = true;
      metrics.overflow[width] = c.overflow;
      metrics.headingContrast = metrics.headingContrast || {};
      metrics.headingContrast[width] = c.headingContrast;
      metrics.sectionsByWidth[width] = c.sections.map((s) => ({ class: s.class, height: s.height, heading: s.heading }));
      const sick = throttleSigns(c, bodyH);
      if (sick.length) issues.push(`${width}px: ${sick.join("; ")}`);
      // box-geometry assertion (scrollWidth is vacuous under body{overflow-x:clip})
      if (c.overflow.widestRight > c.overflow.clientWidth + 1)
        issues.push(`${width}px: HORIZONTAL OVERFLOW widest box ${c.overflow.widestRight} > clientWidth ${c.overflow.clientWidth} (${c.overflow.widestEl?.tag}.${c.overflow.widestEl?.cls})`);

      if (width === 1440) {
        content = c;
        metrics.sectionsAt1440 = c.sections.map((s) => ({
          id: s.id, class: s.class, offsetTop: s.offsetTop, height: s.height, heading: s.heading,
        }));
      }

      const dsf = bodyH > 8100 ? 8100 / bodyH : 1;
      if (dsf !== 1) await setWidth(width, vh, dsf);
      await wait(400);
      const png = await capture();
      if (dsf !== 1) await setWidth(width, vh, 1);
      const file = path.join(dir, `${width}.png`);
      fs.writeFileSync(file, png);
      if (png.length < 50 * 1024) issues.push(`${width}.png only ${(png.length / 1024).toFixed(0)}KB`);
      log(`${slug}: ${width}.png (${(png.length / 1024).toFixed(0)}KB, body ${bodyH}px, dsf ${dsf.toFixed(2)})`);
    }
    return { metrics, content, hardThrottle };
  }, { width: 1440, height: 900 });

  const { metrics, content, hardThrottle } = result;
  if (content) {
    fs.writeFileSync(path.join(dir, "content.json"), JSON.stringify({
      sections: content.sections,
      texts: content.texts,
      images: content.images.map(({ src, alt, renderedSize, naturalSize, complete }) => ({ src, alt, renderedSize, naturalSize, complete })),
      links: content.links,
      forms: content.forms,
      embeds: content.embeds,
      title: content.title,
    }, null, 2));
  } else {
    issues.push("no content extracted at 1440");
  }
  fs.writeFileSync(path.join(dir, "metrics.json"), JSON.stringify(metrics, null, 2));

  return {
    slug,
    ok: issues.length === 0,
    hardThrottle,
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
    summary.push({ slug, ok: false, hardThrottle: true, issues: [`crashed: ${e.message}`] });
    log(`${slug}: CRASH ${e.message}`);
  }
}

// retry only genuine throttled/crashed runs (never cosmetic issues)
const failed = summary.filter((s) => s.hardThrottle);
if (failed.length) {
  log(`retrying ${failed.length} throttled page(s): ${failed.map((f) => f.slug).join(", ")}`);
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
  log(`${s.ok ? "OK  " : "NOTE"} ${s.slug} heights=${JSON.stringify(s.bodyHeight)} sections=${s.sections} texts=${s.texts} imgs=${s.images} fields=${s.formFields}${s.issues?.length ? " issues: " + s.issues.join(" | ") : ""}`);
}
