// Brand extraction — the palette and type actually rendered by the live site.
//
// Screenshots and stylesheet greps both lie: a stylesheet lists colours that are
// never used, and a screenshot cannot tell you a swatch's hex or which weight a
// heading resolved to. So this walks the real DOM and reads getComputedStyle,
// weighting each colour by how much of the page it actually covers (background
// area in px^2, text by rendered character count). It also pulls the theme's
// :root custom properties, every @font-face, and the webfont files in use.
//
//   node extract-brand.mjs [url ...]     (defaults to a spread of key pages)
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const SITE = "https://bestdentistinkatytx.com";

const URLS = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [
      `${SITE}/`,
      `${SITE}/invisalign`,
      `${SITE}/special-offers`,
      `${SITE}/our-doctors`,
      `${SITE}/financing`,
      `${SITE}/contact-us`,
    ];

const PORT = 9400 + Math.floor(Math.random() * 400);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "mpd-brand-"));
const chrome = spawn(CHROME, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  `--remote-debugging-port=${PORT}`,
  "--remote-allow-origins=*",
  "--force-device-scale-factor=1",
  "--window-size=1600,1000",
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-blink-features=AutomationControlled",
  `--user-data-dir=${profile}`,
  "about:blank",
]);
let chromeErr = "";
chrome.stderr.on("data", (d) => (chromeErr += d));

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const getJSON = (p) =>
  new Promise((res, rej) => {
    http
      .get({ host: "127.0.0.1", port: PORT, path: p }, (r) => {
        let d = "";
        r.on("data", (c) => (d += c));
        r.on("end", () => res(JSON.parse(d)));
      })
      .on("error", rej);
  });

let wsUrl;
for (let i = 0; i < 60; i++) {
  try {
    const v = await getJSON("/json/version");
    if (v.webSocketDebuggerUrl) {
      wsUrl = v.webSocketDebuggerUrl;
      break;
    }
  } catch {}
  await wait(200);
}
if (!wsUrl) {
  console.error("Chrome CDP did not come up\n" + chromeErr.slice(0, 600));
  process.exit(1);
}
const ws = new WebSocket(wsUrl);
let id = 0;
const pending = new Map();
ws.addEventListener("message", (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result);
    pending.delete(m.id);
  }
});
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let sessionId;
const send = (method, params = {}, root = false) =>
  new Promise((res) => {
    const mid = ++id;
    pending.set(mid, res);
    ws.send(JSON.stringify({ id: mid, method, params, sessionId: root ? undefined : sessionId }));
  });
const { targetInfos } = await send("Target.getTargets", {}, true);
const t = targetInfos.find((x) => x.type === "page") || (await send("Target.createTarget", { url: "about:blank" }, true));
({ sessionId } = await send("Target.attachToTarget", { targetId: t.targetId, flatten: true }, true));
await send("Page.enable");
await send("Runtime.enable");
await send("Network.enable");
await send("Network.setUserAgentOverride", {
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  acceptLanguage: "en-US,en;q=0.9",
});
const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r?.exceptionDetails) console.log("  ! eval:", r.exceptionDetails.text || r.exceptionDetails.exception?.description);
  return r?.result?.value;
};

const EXTRACT = String.raw`(() => {
  const toHex = (c) => {
    if (!c) return null;
    const m = c.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.%]+))?\s*\)/i);
    if (!m) return null;
    let a = m[4] == null ? 1 : (String(m[4]).endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]));
    if (a === 0) return null;
    const h = (n) => Math.round(Number(n)).toString(16).padStart(2, '0');
    return { hex: ('#' + h(m[1]) + h(m[2]) + h(m[3])).toLowerCase(), alpha: a };
  };

  const bg = new Map();     // hex -> area covered
  const fg = new Map();     // hex -> characters rendered
  const accent = new Map(); // hex -> weight, from buttons/links/icons
  const border = new Map();
  const bump = (map, key, n) => { if (key) map.set(key, (map.get(key) || 0) + n); };

  const typeSamples = new Map(); // role -> {family, weight, size, ...}
  const noteType = (role, el) => {
    if (typeSamples.has(role)) return;
    const cs = getComputedStyle(el);
    const txt = (el.innerText || '').trim();
    if (!txt) return;
    typeSamples.set(role, {
      family: cs.fontFamily,
      weight: cs.fontWeight,
      size: cs.fontSize,
      lineHeight: cs.lineHeight,
      letterSpacing: cs.letterSpacing,
      transform: cs.textTransform,
      color: cs.color,
      sample: txt.replace(/\s+/g, ' ').slice(0, 60)
    });
  };

  const els = document.querySelectorAll('body *');
  for (const el of els) {
    let rect;
    try { rect = el.getBoundingClientRect(); } catch (e) { continue; }
    const area = Math.max(0, rect.width) * Math.max(0, rect.height);
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') continue;

    const b = toHex(cs.backgroundColor);
    if (b && area > 0) bump(bg, b.hex, area * b.alpha);

    // Gradient stops count as brand colour too.
    const bi = cs.backgroundImage || '';
    if (bi && bi !== 'none' && /gradient/i.test(bi)) {
      const stops = bi.match(/rgba?\([^)]+\)/g) || [];
      for (const s of stops) { const c = toHex(s); if (c) bump(bg, c.hex, area * c.alpha * 0.5); }
    }

    // Only count text colour where this element owns the text.
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join('');
    if (own.length) { const c = toHex(cs.color); if (c) bump(fg, c.hex, own.length); }

    const tag = el.tagName.toLowerCase();
    const isBtn = tag === 'button' || /btn|button|cta/i.test(el.className || '') || el.getAttribute('role') === 'button';
    if (isBtn || tag === 'a') {
      const c = toHex(cs.backgroundColor);
      if (c && area > 0 && area < 120000) bump(accent, c.hex, area * c.alpha);
      const tc = toHex(cs.color);
      if (tc && own.length) bump(accent, tc.hex, own.length * 20);
    }
    if (tag === 'svg' || tag === 'path') {
      const f = toHex(cs.fill); if (f) bump(accent, f.hex, 400);
      const st = toHex(cs.stroke); if (st) bump(accent, st.hex, 200);
    }
    for (const side of ['borderTopColor','borderBottomColor','borderLeftColor','borderRightColor']) {
      const w = parseFloat(cs[side.replace('Color','Width')]) || 0;
      if (w > 0) { const c = toHex(cs[side]); if (c) bump(border, c.hex, w * Math.max(rect.width, rect.height)); }
    }

    if (tag === 'h1') noteType('h1', el);
    if (tag === 'h2') noteType('h2', el);
    if (tag === 'h3') noteType('h3', el);
    if (tag === 'h4') noteType('h4', el);
    if (tag === 'p') noteType('body', el);
    if (isBtn) noteType('button', el);
    if (tag === 'a' && !isBtn) noteType('link', el);
    if (/nav/i.test(el.className || '') && tag === 'a') noteType('nav', el);
    if (/blockquote/.test(tag)) noteType('quote', el);
  }

  // Theme tokens declared on :root / html / body.
  const vars = {};
  const fontFaces = [];
  const importedSheets = [];
  for (const sheet of document.styleSheets) {
    let rules;
    try { rules = sheet.cssRules; } catch (e) { importedSheets.push({ href: sheet.href, blocked: true }); continue; }
    if (!rules) continue;
    const walk = (list) => {
      for (const rule of list) {
        if (rule.type === 1 && /^(:root|html|body)\b/.test(rule.selectorText || '')) {
          for (const p of rule.style) if (p.startsWith('--')) vars[p] = rule.style.getPropertyValue(p).trim();
        }
        if (rule.type === 5) {
          fontFaces.push({
            family: (rule.style.getPropertyValue('font-family') || '').replace(/['"]/g, ''),
            weight: rule.style.getPropertyValue('font-weight'),
            style: rule.style.getPropertyValue('font-style'),
            display: rule.style.getPropertyValue('font-display'),
            src: (rule.style.getPropertyValue('src') || '').slice(0, 400)
          });
        }
        if (rule.cssRules) walk(rule.cssRules);
      }
    };
    walk(rules);
  }

  // What the browser actually downloaded as a font.
  const fontFiles = performance.getEntriesByType('resource')
    .map((e) => e.name)
    .filter((n) => /\.(woff2?|ttf|otf|eot)(\?|$)/i.test(n));

  const googleLinks = [...document.querySelectorAll('link[href*="fonts.googleapis"], link[href*="fonts.gstatic"]')]
    .map((l) => l.href);

  const top = (m, n) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([hex, w]) => ({ hex, weight: Math.round(w) }));

  return JSON.stringify({
    url: location.href,
    title: document.title,
    bg: top(bg, 20),
    fg: top(fg, 20),
    accent: top(accent, 20),
    border: top(border, 12),
    type: Object.fromEntries(typeSamples),
    vars,
    fontFaces,
    fontFiles: [...new Set(fontFiles)],
    googleLinks,
    bodyFont: getComputedStyle(document.body).fontFamily,
    bodyBg: getComputedStyle(document.body).backgroundColor
  });
})()`;

const WALLED = (title, url) =>
  /robot challenge|just a moment|checking your browser/i.test(title || "") || /\/\.well-known\//.test(url || "");

async function grab(url) {
  await send("Page.navigate", { url });
  await wait(2500);
  for (let i = 0; i < 30; i++) {
    const title = await evaluate("document.title");
    const here = await evaluate("location.href");
    if (title && !WALLED(title, here)) break;
    await wait(2000);
  }
  await wait(2500);
  await evaluate(`(async () => {
    const step = innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
    scrollTo(0, 0); await new Promise(r => setTimeout(r, 500));
  })()`);
  try {
    return JSON.parse((await evaluate(EXTRACT)) || "null");
  } catch (e) {
    console.log("  ! parse failed:", e.message);
    return null;
  }
}

// A cold profile spends its first navigations behind the wall, and the
// challenge page extracts as a near-empty document that silently looks like a
// result. Warm the session first, then treat a thin result as a retry signal
// rather than as data.
console.log("Warming the session…");
await grab(SITE + "/");

const out = [];
for (const u of URLS) {
  console.log("→", u);
  let r = await grab(u);
  if (!r || r.bg.length < 3 || !r.fontFaces.length) {
    console.log("  thin result, retrying");
    r = await grab(u);
  }
  if (r) {
    out.push(r);
    console.log(`  ${r.bg.length} bg, ${r.fg.length} fg, ${r.fontFaces.length} @font-face, ${Object.keys(r.vars).length} css vars`);
  }
}

fs.mkdirSync(path.join(HERE, ".state"), { recursive: true });
fs.writeFileSync(path.join(HERE, ".state", "brand-raw.json"), JSON.stringify(out, null, 2), "utf8");
console.log(`\nWrote .state/brand-raw.json (${out.length} pages)`);
ws.close();
chrome.kill();
process.exit(0);
