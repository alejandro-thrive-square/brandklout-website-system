// Full-page DESKTOP screenshots of every bestdentistinkatytx.com page.
//
// Companion to crawl.mjs — same zero-dependency CDP approach, same SiteGround
// bot-wall handling, same throwaway Chrome profile (the live site is
// compromised, so nothing here touches the user's real browser profile).
//
// Reads the URL list from .state/pages.json (deduped by slug) and writes
// ../site-screenshots/desktop/<slug>.png + manifest.json.
//
// Structural pages (home, services, team, contact…) are captured FIRST so the
// flow-critical set is on disk even if SiteGround pulls the site mid-run.
// Re-running skips slugs already captured, so it resumes cleanly.
//
//   node screenshot.mjs [--width 1440] [--settle MS] [--limit N] [--only substr]
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

const argv = process.argv.slice(2);
const num = (name, def) => {
  const i = argv.indexOf(name);
  return i === -1 ? def : Number(argv[i + 1]);
};
const str = (name, def) => {
  const i = argv.indexOf(name);
  return i === -1 ? def : argv[i + 1];
};
const WIDTH = num("--width", 1440);
const VH = num("--height", 900);
const SETTLE = num("--settle", 4000);
const LIMIT = num("--limit", Infinity);
const ONLY = str("--only", null);
const PROBE = str("--probe", null);
// Chrome's compositor tops out around 16384px; stay under it.
const MAX_H = 16000;

const OUT = path.join(HERE, "..", "site-screenshots");
const SHOTS = path.join(OUT, "desktop");
fs.mkdirSync(SHOTS, { recursive: true });
// These are binary media — the repo rules say don't commit them.
fs.writeFileSync(path.join(OUT, ".gitignore"), "desktop/\n*.png\n");

// ------------------------------------------------------------------ page list
const raw = JSON.parse(fs.readFileSync(path.join(HERE, ".state", "pages.json"), "utf8"));
const bySlug = new Map();
for (const p of raw) if (!bySlug.has(p.slug)) bySlug.set(p.slug, p);

// Flow-critical first, then everything else (mostly blog posts on one template).
const RANK = (s) =>
  s === "home" ? 0 :
  /^(our-services|services-|our-doctors|team-|about|contacts|appointment|before-after|special-offers|financing|pricing|patient-resources|virtual-consultation|technology|new-patient|dental-savings-plan|shop|faq|thank-you)/.test(s) ? 1 :
  /^(blog|category-|dental-library|dental-dictionary|sitemap|town-resource|product-recommendations|toothpaste|invisalign-faqs|dental-implants-faqs|mpd-|pearl-ai|ceramill|terms-of-service|privacy-policy|sample)/.test(s) ? 2 :
  3;

let pages = [...bySlug.values()].sort((a, b) => RANK(a.slug) - RANK(b.slug) || a.slug.localeCompare(b.slug));
if (ONLY) pages = pages.filter((p) => p.slug.includes(ONLY));
const captured = (slug) =>
  fs.existsSync(path.join(SHOTS, slug + ".png")) || fs.existsSync(path.join(SHOTS, slug + "-part1.png"));
if (!PROBE) pages = pages.filter((p) => !captured(p.slug));
const already = bySlug.size - pages.length;
pages = pages.slice(0, LIMIT);
console.log(`${bySlug.size} unique pages — ${already} already captured, ${pages.length} to go @ ${WIDTH}px wide`);
if (!pages.length) {
  console.log("Nothing to do.");
  process.exit(0);
}

// ---------------------------------------------------------------- CDP plumbing
const PORT = 9400 + Math.floor(Math.random() * 400);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "mpd-shot-"));
const chrome = spawn(CHROME, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  `--remote-debugging-port=${PORT}`,
  "--remote-allow-origins=*",
  "--force-device-scale-factor=1",
  `--window-size=${WIDTH},${VH}`,
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
  new Promise((resolve, reject) => {
    http
      .get({ host: "127.0.0.1", port: PORT, path: p }, (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => resolve(JSON.parse(d)));
      })
      .on("error", reject);
  });

async function findWs() {
  for (let i = 0; i < 60; i++) {
    try {
      const v = await getJSON("/json/version");
      if (v.webSocketDebuggerUrl) return v.webSocketDebuggerUrl;
    } catch {}
    await wait(200);
  }
  throw new Error("Chrome CDP did not come up\n" + chromeErr.slice(0, 800));
}

const ws = new WebSocket(await findWs());
let id = 0;
const pending = new Map();
ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg.result);
    pending.delete(msg.id);
  }
});
await new Promise((r) => ws.addEventListener("open", r, { once: true }));

let sessionId;
const call = (method, params, root) =>
  new Promise((resolve) => {
    const mid = ++id;
    pending.set(mid, resolve);
    ws.send(JSON.stringify({ id: mid, method, params, ...(root ? {} : { sessionId }) }));
  });
const send = (m, p = {}) => call(m, p, false);
const sendRoot = (m, p = {}) => call(m, p, true);

const { targetInfos } = await sendRoot("Target.getTargets");
let pageTarget = targetInfos.find((t) => t.type === "page");
if (!pageTarget) {
  const created = await sendRoot("Target.createTarget", { url: "about:blank" });
  pageTarget = { targetId: created.targetId };
}
({ sessionId } = await sendRoot("Target.attachToTarget", { targetId: pageTarget.targetId, flatten: true }));
await send("Page.enable");
await send("Runtime.enable");
await send("Network.enable");
await send("Network.setUserAgentOverride", {
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  acceptLanguage: "en-US,en;q=0.9",
});
await send("Emulation.setDeviceMetricsOverride", {
  width: WIDTH,
  height: VH,
  deviceScaleFactor: 1,
  mobile: false,
});

const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  return r?.result?.value;
};

// ------------------------------------------------------------- bot wall + nav
const WALLED = (title, url) =>
  /robot challenge|just a moment|attention required|checking your browser/i.test(title || "") ||
  /\/\.well-known\/(sgcaptcha|captcha)/.test(url || "");

async function goto(url, settle = SETTLE) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await send("Page.navigate", { url });
    await wait(Math.min(settle, 2500));
    for (let i = 0; i < 30; i++) {
      const title = await evaluate("document.title");
      const here = await evaluate("location.href");
      if (!WALLED(title, here) && title) {
        await wait(Math.max(0, settle - 2500));
        return true;
      }
      if (i === 0) console.log("    … bot wall, waiting it out");
      await wait(2000);
    }
    console.log(`    ! still walled (attempt ${attempt + 1}/3), backing off`);
    await wait(15000);
  }
  return false;
}

// Reveal-on-scroll sections sit at opacity:0 until they enter the viewport, and
// a full-page capture does not scroll. So: neutralise animation, walk the page
// to fire every lazy-load / IntersectionObserver, then come back to the top.
// The live site is compromised: an injected third-party iframe is laid over the
// full viewport on every page (it renders that host's own Cloudflare challenge,
// which is what covers the real header). Strip any full-viewport overlay iframe
// so the capture shows the actual design. Legit inline embeds — the Maps iframe,
// the booking widget — are small and in-flow, so the size test leaves them be.
// Whatever is removed is reported in the manifest as `stripped`.
const PREP = `
(async () => {
  const stripped = [];
  for (const f of [...document.querySelectorAll('iframe')]) {
    const r = f.getBoundingClientRect();
    const pos = getComputedStyle(f).position;
    const overlay = (pos === 'fixed' || pos === 'absolute') &&
      r.width >= innerWidth * 0.9 && r.height >= innerHeight * 0.9;
    let sameOrigin = true;
    try { sameOrigin = !f.src || new URL(f.src, location.href).hostname.endsWith('bestdentistinkatytx.com'); } catch {}
    if (overlay && !sameOrigin) {
      stripped.push(f.src.slice(0, 120));
      (f.closest('div[style*="fixed"]') || f).remove();
    }
  }
  // The injector also leaves the page scroll-locked behind the overlay.
  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';

  // The theme keeps the main nav at visibility:hidden until its own JS adds
  // .inited to the menu wrapper. On the broken/compromised site that init never
  // finishes, so every page would screenshot with no navigation — the one thing
  // a flow rebuild needs most. Add the class the theme would have added.
  // Submenus are display:none in their own right, so they stay closed.
  document.querySelectorAll('.sc_layouts_menu').forEach(e => e.classList.add('inited'));
  document.documentElement.classList.remove('no-js');

  const css = document.createElement('style');
  css.textContent = \`
    *,*::before,*::after{animation:none!important;transition:none!important;
      animation-delay:0s!important;transition-delay:0s!important}
    html{scroll-behavior:auto!important}
    .elementor-invisible{visibility:visible!important}
    [data-aos],[data-animation],.sc_animated,.trx_addons_inview,.wpb_animate_when_almost_visible{
      opacity:1!important;transform:none!important;visibility:visible!important}
  \`;
  document.documentElement.appendChild(css);
  document.querySelectorAll('img[loading="lazy"]').forEach(i => i.loading = 'eager');
  const step = window.innerHeight * 0.8;
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise(r => setTimeout(r, 120));
  }
  window.scrollTo(0, 0);
  await new Promise(r => setTimeout(r, 400));
  document.querySelectorAll('img[data-src]:not([src])').forEach(i => i.src = i.dataset.src);
  return { stripped, height: Math.max(
    document.body.scrollHeight, document.documentElement.scrollHeight,
    document.body.offsetHeight, document.documentElement.offsetHeight) };
})()`;

// ------------------------------------------------------------------- the loop
const manifestPath = path.join(OUT, "manifest.json");
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : [];

console.log("Warming the session against the bot wall…");
await goto("https://bestdentistinkatytx.com/", 8000);
console.log("  session ready —", await evaluate("document.title"));

if (PROBE) {
  // --scan repeats the probe across every selected page instead of just the first.
  const targets = argv.includes("--scan") ? pages : [pages[0]];
  for (const t of targets) {
    await goto(t.url, argv.includes("--scan") ? SETTLE : 8000);
    const v = await evaluate(PROBE);
    if (argv.includes("--scan")) console.log(t.slug + "	" + JSON.stringify(v));
    else {
      console.log("URL:", await evaluate("location.href"));
      console.log("TITLE:", await evaluate("document.title"));
      console.log(JSON.stringify(v, null, 2));
    }
  }
  ws.close();
  chrome.kill();
  process.exit(0);
}

let n = 0;
for (const p of pages) {
  n++;
  const label = `[${n}/${pages.length}] ${p.slug}`;
  try {
    const ok = await goto(p.url);
    if (!ok) {
      console.log(`${label} — FAILED (bot wall)`);
      manifest.push({ slug: p.slug, url: p.url, status: "walled" });
      continue;
    }
    const title = await evaluate("document.title");
    const prep = (await evaluate(PREP)) || {};
    const stripped = prep.stripped || [];
    const height = Math.ceil(prep.height || VH);

    // A page taller than the compositor limit (the blog index runs ~70k px) is
    // captured as sequential full-width slices rather than silently cut off.
    const parts = Math.ceil(height / MAX_H);
    const files = [];
    for (let i = 0; i < parts; i++) {
      const y = i * MAX_H;
      const h = Math.min(MAX_H, height - y);
      const shot = await send("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: true,
        clip: { x: 0, y, width: WIDTH, height: h, scale: 1 },
      });
      if (!shot?.data) throw new Error("empty screenshot payload");
      const name = parts === 1 ? p.slug : `${p.slug}-part${i + 1}`;
      const file = path.join(SHOTS, name + ".png");
      fs.writeFileSync(file, Buffer.from(shot.data, "base64"));
      files.push(name + ".png");
    }
    const kb = Math.round(files.reduce((a, f) => a + fs.statSync(path.join(SHOTS, f)).size, 0) / 1024);
    console.log(`${label} — ${WIDTH}x${height}${parts > 1 ? ` (${parts} parts)` : ""} ${kb}KB${stripped.length ? " [overlay stripped]" : ""}`);
    manifest.push({ slug: p.slug, url: p.url, title, width: WIDTH, height, parts, files, stripped, status: "ok" });
  } catch (e) {
    console.log(`${label} — ERROR ${e.message}`);
    manifest.push({ slug: p.slug, url: p.url, status: "error", error: e.message });
  }
  if (n % 10 === 0) fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
const ok = manifest.filter((m) => m.status === "ok").length;
console.log(`\nDone — ${ok}/${manifest.length} captured. → ${SHOTS}`);
ws.close();
chrome.kill();
process.exit(0);
