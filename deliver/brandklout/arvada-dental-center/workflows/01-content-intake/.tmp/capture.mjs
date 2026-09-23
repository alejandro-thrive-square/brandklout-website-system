// Rendered-HTML + full-page-screenshot capture over CDP.
// Handles JS bot challenges (SiteGround sgcaptcha) that defeat plain curl.
//
// Usage:
//   node capture.mjs <jobsJson> <outDir>
// jobsJson: [{ "url": "...", "slug": "home", "widths": [1440, 390] }, ...]
//
// Writes per job:  <outDir>/<slug>/rendered.html, <slug>-<width>.png, meta.json
// Asana GID for this client's work: 1217040406855586
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";

const [, , jobsPath, outDir] = process.argv;
const jobs = JSON.parse(fs.readFileSync(jobsPath, "utf8"));
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9400 + Math.floor(Math.random() * 400);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-scrape-"));

// HEADED=1 runs a real visible window. Cloudflare's bot check fingerprints headless
// Chrome and 403s it (greenspotcrossingsdentistry.com does exactly this), so some
// references can only be captured with a real window.
const HEADED = process.env.HEADED === "1";

const chrome = spawn(CHROME, [
  ...(HEADED ? ["--window-position=-2400,0"] : ["--headless=new"]),
  "--disable-gpu",
  "--hide-scrollbars",
  `--remote-debugging-port=${PORT}`,
  "--remote-allow-origins=*",
  "--force-device-scale-factor=1",
  "--window-size=1440,1000",
  "--no-first-run",
  "--no-default-browser-check",
  `--user-data-dir=${profile}`,
  "about:blank",
]);
let chromeErr = "";
chrome.stderr.on("data", (d) => (chromeErr += d));

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJSON(p) {
  return new Promise((resolve, reject) => {
    http
      .get({ host: "127.0.0.1", port: PORT, path: p }, (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => resolve(JSON.parse(d)));
      })
      .on("error", reject);
  });
}

async function findWs() {
  for (let i = 0; i < 40; i++) {
    try {
      const v = await getJSON("/json/version");
      if (v.webSocketDebuggerUrl) return v.webSocketDebuggerUrl;
    } catch {}
    await wait(200);
  }
  throw new Error("Chrome CDP did not come up\n" + chromeErr.slice(0, 800));
}

const wsUrl = await findWs();
const ws = new WebSocket(wsUrl);
let id = 0;
const pending = new Map();
ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg.result ?? msg.error);
    pending.delete(msg.id);
  }
});
await new Promise((r) => ws.addEventListener("open", r, { once: true }));

function send(method, params = {}, sessionId) {
  return new Promise((resolve) => {
    const mid = ++id;
    pending.set(mid, resolve);
    ws.send(JSON.stringify({ id: mid, method, params, sessionId }));
  });
}

const { targetInfos } = await send("Target.getTargets");
let pageTarget = targetInfos.find((t) => t.type === "page");
if (!pageTarget) {
  const created = await send("Target.createTarget", { url: "about:blank" });
  pageTarget = { targetId: created.targetId };
}
const { sessionId } = await send("Target.attachToTarget", {
  targetId: pageTarget.targetId,
  flatten: true,
});
await send("Page.enable", {}, sessionId);
await send("Runtime.enable", {}, sessionId);
await send("Network.enable", {}, sessionId);
await send(
  "Network.setUserAgentOverride",
  {
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    acceptLanguage: "en-US,en;q=0.9",
  },
  sessionId
);
// smilecenter.com sniffs Accept-Language and will serve Spanish without this.
await send(
  "Network.setExtraHTTPHeaders",
  { headers: { "Accept-Language": "en-US,en;q=0.9" } },
  sessionId
);

async function evaluate(expression) {
  const r = await send(
    "Runtime.evaluate",
    { expression, returnByValue: true, awaitPromise: true },
    sessionId
  );
  return r?.result?.value;
}

async function setViewport(width, height = 1000, mobile = false) {
  await send(
    "Emulation.setDeviceMetricsOverride",
    { width, height, deviceScaleFactor: 1, mobile },
    sessionId
  );
}

for (const job of jobs) {
  const dir = path.join(outDir, job.slug);
  fs.mkdirSync(dir, { recursive: true });
  const widths = job.widths || [1440];
  console.log(`\n=== ${job.slug} :: ${job.url}`);

  await setViewport(widths[0], 1000, widths[0] < 700);
  await send("Page.navigate", { url: job.url }, sessionId);
  await wait(job.settleMs || 5000);

  // SiteGround sgcaptcha / generic JS-challenge: the challenge page self-redirects
  // once its cookie is set. Wait on the *identity* of the document, not its size —
  // the interstitial is ~12KB, so a byte-length check sails straight past it.
  for (let i = 0; i < 12; i++) {
    const state = await evaluate(
      "JSON.stringify({u: location.href, t: document.title, n: document.querySelectorAll('h1,h2,h3,p,img').length})"
    );
    const s = JSON.parse(state || "{}");
    const challenged = /sgcaptcha|Robot Challenge|Just a moment|Checking your browser/i.test(
      (s.u || "") + " " + (s.t || "")
    );
    if (!challenged && (s.n || 0) > 5) break;
    console.log(`  challenge in progress (${s.t}) — waiting…`);
    await wait(2500);
    if (i === 5) await send("Page.navigate", { url: job.url }, sessionId); // retry with cookie set
  }

  // Scroll through to trigger lazy images and reveal animations.
  await evaluate(`(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 180));
    }
    window.scrollTo(0, 0);
    await new Promise(r => setTimeout(r, 600));
  })()`);

  const html = await evaluate("document.documentElement.outerHTML");
  fs.writeFileSync(path.join(dir, "rendered.html"), html || "", "utf8");

  const meta = await evaluate(`(() => {
    const abs = (u) => { try { return new URL(u, location.href).href } catch { return u } };
    const cs = getComputedStyle(document.body);
    const colorCount = {};
    document.querySelectorAll('*').forEach(el => {
      const s = getComputedStyle(el);
      for (const p of ['color','backgroundColor','borderTopColor']) {
        const v = s[p];
        if (!v || v === 'rgba(0, 0, 0, 0)' || v === 'transparent') continue;
        colorCount[v] = (colorCount[v] || 0) + 1;
      }
    });
    const fontCount = {};
    document.querySelectorAll('h1,h2,h3,h4,p,a,button,li,span').forEach(el => {
      const f = getComputedStyle(el).fontFamily;
      if (f) fontCount[f] = (fontCount[f] || 0) + 1;
    });
    const top = (o, n) => Object.entries(o).sort((a,b) => b[1]-a[1]).slice(0, n);
    return {
      url: location.href,
      title: document.title,
      metaDescription: document.querySelector('meta[name=description]')?.content || null,
      bodyFont: cs.fontFamily,
      bodyBg: cs.backgroundColor,
      topColors: top(colorCount, 22),
      topFonts: top(fontCount, 8),
      cssVars: (() => {
        const out = {};
        for (const sheet of document.styleSheets) {
          let rules; try { rules = sheet.cssRules } catch { continue }
          for (const r of rules || []) {
            if (r.style) for (const p of r.style) if (p.startsWith('--')) out[p] = r.style.getPropertyValue(p).trim();
          }
        }
        return out;
      })(),
      stylesheets: [...document.querySelectorAll('link[rel=stylesheet]')].map(l => abs(l.href)),
      headings: [...document.querySelectorAll('h1,h2,h3,h4')].map(h => ({ tag: h.tagName, text: h.innerText.trim().slice(0,220) })).filter(h => h.text),
      links: [...new Set([...document.querySelectorAll('a[href]')].map(a => abs(a.getAttribute('href'))))].filter(u => u.startsWith('http')),
      navLinks: [...document.querySelectorAll('nav a, header a, .menu a, #menu a')].map(a => ({ text: a.innerText.trim(), href: abs(a.getAttribute('href')) })).filter(l => l.text),
      phones: [...new Set([...document.querySelectorAll('a[href^="tel:"]')].map(a => a.getAttribute('href').replace('tel:','')))],
      emails: [...new Set([...document.querySelectorAll('a[href^="mailto:"]')].map(a => a.getAttribute('href').replace('mailto:','')))],
      images: [...document.querySelectorAll('img')].map(i => ({ src: abs(i.currentSrc || i.src), alt: i.alt || '', w: i.naturalWidth, h: i.naturalHeight })).filter(i => i.src && !i.src.startsWith('data:')),
      bgImages: [...new Set([...document.querySelectorAll('*')].map(el => {
        const b = getComputedStyle(el).backgroundImage;
        const m = b && b.match(/url\\(["']?(.*?)["']?\\)/);
        return m ? abs(m[1]) : null;
      }).filter(Boolean))].filter(u => !u.startsWith('data:')),
      videos: [...document.querySelectorAll('video source, video')].map(v => abs(v.src || v.getAttribute('src') || '')).filter(u => u && u.startsWith('http')),
      iframes: [...document.querySelectorAll('iframe')].map(f => abs(f.src || '')).filter(Boolean),
      jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => s.textContent),
      text: document.body.innerText.replace(/\\n{3,}/g, '\\n\\n')
    };
  })()`);
  fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify(meta, null, 2), "utf8");

  for (const w of widths) {
    await setViewport(w, 1000, w < 700);
    await wait(1200);
    const shot = await send(
      "Page.captureScreenshot",
      { format: "png", captureBeyondViewport: true },
      sessionId
    );
    if (shot?.data) {
      fs.writeFileSync(path.join(dir, `${job.slug}-${w}.png`), Buffer.from(shot.data, "base64"));
      console.log(`  shot ${w}px`);
    } else {
      console.log(`  shot ${w}px FAILED`, JSON.stringify(shot).slice(0, 200));
    }
  }
  console.log(`  html ${(html || "").length} bytes, ${meta?.headings?.length ?? 0} headings`);
}

ws.close();
chrome.kill();
process.exit(0);
