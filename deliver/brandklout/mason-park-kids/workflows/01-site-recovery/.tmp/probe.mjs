// Reachability probe for pediatricdentistkatytx.com (Dr. Tam Nguyen's pediatric practice).
//
// The site sits behind SiteGround's `sgcaptcha` bot wall exactly like
// bestdentistinkatytx.com, so plain HTTP gets a 202 + meta-refresh. Everything
// runs through a real headless Chrome on a throwaway profile, which resolves
// the wall by itself.
//
// This answers one question before any crawl is built: does the origin still
// serve real pages, or has SiteGround suspended it the way it did the main
// site? It also reports the ClickFix IOCs, because this domain shared a server
// with the compromised one.
//
//   node probe.mjs [--url https://…] [--settle MS]
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

const argv = process.argv.slice(2);
const strFlag = (name, def) => {
  const i = argv.indexOf(name);
  return i === -1 ? def : argv[i + 1];
};
const SITE = strFlag("--url", "https://pediatricdentistkatytx.com");
const SETTLE = Number(strFlag("--settle", "8000"));

const PORT = 9400 + Math.floor(Math.random() * 400);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "pdk-probe-"));
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
({ sessionId } = await sendRoot("Target.attachToTarget", {
  targetId: pageTarget.targetId,
  flatten: true,
}));
await send("Page.enable");
await send("Runtime.enable");
await send("Network.enable");
await send("Network.setUserAgentOverride", {
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  acceptLanguage: "en-US,en;q=0.9",
});

const responses = [];
ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.method === "Network.responseReceived") {
    const r = msg.params.response;
    if (r?.url && !r.url.startsWith("data:")) {
      responses.push({ url: r.url, status: r.status, mime: r.mimeType });
    }
  }
});

const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r?.exceptionDetails) console.log("  ! eval error:", r.exceptionDetails.text);
  return r?.result?.value;
};

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
      if (i === 0) console.log("  … bot wall, waiting it out");
      await wait(2000);
    }
    console.log(`  ! still walled after 60s (attempt ${attempt + 1}/3), backing off`);
    await wait(15000);
  }
  return false;
}

console.log(`Probing ${SITE} …`);
const passed = await goto(SITE + "/");

// Everything below reads out of the live DOM, in one round trip.
const report = await evaluate(`(() => {
  const abs = (h) => { try { return new URL(h, location.href).href; } catch { return null; } };
  const links = [...document.querySelectorAll('a[href]')].map(a => abs(a.getAttribute('href'))).filter(Boolean);
  const host = location.hostname.replace(/^www\\./, '');
  const internal = [...new Set(links.filter(u => {
    try { const p = new URL(u); return p.protocol.startsWith('http') && p.hostname.replace(/^www\\./,'') === host; } catch { return false; }
  }))];
  const html = document.documentElement.outerHTML;
  return {
    url: location.href,
    title: document.title,
    generator: (document.querySelector('meta[name=generator]') || {}).content || null,
    htmlBytes: html.length,
    textChars: (document.body ? document.body.innerText : '').length,
    textHead: (document.body ? document.body.innerText : '').slice(0, 700),
    h1: [...document.querySelectorAll('h1')].map(h => h.innerText.trim()).slice(0, 5),
    linksTotal: links.length,
    internalLinks: internal.length,
    internalSample: internal.slice(0, 60),
    images: document.images.length,
    iframes: [...document.querySelectorAll('iframe')].map(f => f.src).slice(0, 20),
    isWordPress: /wp-content|wp-includes/.test(html),
    ioc: {
      overlay: !!document.querySelector('div[data-sm="1"], iframe[src*="yourbodybydesign"]'),
      yourbodybydesign: html.includes('yourbodybydesign'),
      maxZ: html.includes('2147483647'),
      cdnSbs: html.includes('webanalytics-cdn.sbs'),
    },
  };
})()`);

const out = {
  probedAt: new Date().toISOString(),
  site: SITE,
  wallPassed: passed,
  report,
  topResponses: responses.slice(0, 40),
};
fs.writeFileSync(path.join(HERE, "probe-report.json"), JSON.stringify(out, null, 2));

console.log("\n================ RESULT ================");
console.log("wall passed :", passed);
console.log("final url   :", report?.url);
console.log("title       :", report?.title);
console.log("generator   :", report?.generator);
console.log("WordPress   :", report?.isWordPress);
console.log("html bytes  :", report?.htmlBytes);
console.log("text chars  :", report?.textChars);
console.log("h1          :", JSON.stringify(report?.h1));
console.log("links       :", report?.linksTotal, "internal:", report?.internalLinks);
console.log("images      :", report?.images);
console.log("IOC         :", JSON.stringify(report?.ioc));
console.log("\n--- first 700 chars of visible text ---");
console.log(report?.textHead);
console.log("\n--- internal links (up to 60) ---");
(report?.internalSample || []).forEach((u) => console.log("  " + u));
console.log("\nwrote probe-report.json");

ws.close();
chrome.kill();
fs.rmSync(profile, { recursive: true, force: true });
process.exit(0);
