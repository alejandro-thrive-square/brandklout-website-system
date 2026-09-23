// Visual reference capture for lakenonadentist.com (the template Dr. Nahlah approved).
//
// VISUAL ONLY: this drives a headless Chrome and writes PNG/JPEG screenshots.
// It deliberately does not save HTML, CSS or JS from the reference site — the
// reference informs layout, rhythm and art direction, not markup.
//
// Per page it scrolls top -> bottom in viewport steps (firing lazy-loaded images
// and IntersectionObserver reveals), returns to the top, then takes one
// full-page capture with captureBeyondViewport so reveals are already in their
// end state.
//
// Usage: node capture.mjs <urls.txt> <outDir> [--width 1440] [--height 900]
//                         [--start N] [--limit N] [--label mobile]
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";

const argv = process.argv.slice(2);
const positional = argv.filter((a) => !a.startsWith("--"));
const flag = (name, dflt) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? dflt : argv[i + 1];
};

const urlsFile = positional[0];
const outDir = positional[1];
const width = Number(flag("width", 1440));
const height = Number(flag("height", 900));
const start = Number(flag("start", 0));
const limit = Number(flag("limit", 0));
const label = flag("label", "");
const MAX_FULLPAGE_H = 15000; // Chrome refuses/garbles captures much beyond this

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9400 + Math.floor(Math.random() * 500);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-shot-"));

let urls = fs
  .readFileSync(urlsFile, "utf8")
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("#"));
if (start) urls = urls.slice(start);
if (limit) urls = urls.slice(0, limit);

fs.mkdirSync(outDir, { recursive: true });

const chrome = spawn(CHROME, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  `--remote-debugging-port=${PORT}`,
  "--remote-allow-origins=*",
  "--force-device-scale-factor=1",
  `--window-size=${width},${height}`,
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-features=CalculateNativeWinOcclusion",
  `--user-data-dir=${profile}`,
  "about:blank",
]);
let chromeErr = "";
chrome.stderr.on("data", (d) => (chromeErr += d));

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function getJSON(p) {
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
  for (let i = 0; i < 150; i++) {
    try {
      const v = await getJSON("/json/version");
      if (v.webSocketDebuggerUrl) return v.webSocketDebuggerUrl;
    } catch {}
    await wait(300);
  }
  throw new Error("Chrome CDP did not come up\n" + chromeErr.slice(0, 800));
}

const ws = new WebSocket(await findWs());
let id = 0;
const pending = new Map();

ws.addEventListener("message", async (ev) => {
  const raw = typeof ev.data === "string" ? ev.data : await ev.data.text();
  const msg = JSON.parse(raw);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
});
await new Promise((r) => ws.addEventListener("open", r, { once: true }));

function send(method, params = {}, sessionId, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    const mid = ++id;
    const t = setTimeout(() => reject(new Error(`CDP timeout: ${method}`)), timeoutMs);
    pending.set(mid, (msg) => {
      clearTimeout(t);
      if (msg.error) reject(new Error(`${method}: ${msg.error.message}`));
      else resolve(msg.result);
    });
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
await send("Emulation.setDeviceMetricsOverride", {
  width,
  height,
  deviceScaleFactor: 1,
  mobile: width < 600,
}, sessionId);

const evalJs = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, sessionId);
  return r?.result?.value;
};

const slug = (u) => {
  const p = new URL(u).pathname.replace(/^\/|\/$/g, "");
  return (p || "home").replace(/[^a-z0-9._/-]+/gi, "-").replace(/\//g, "__").toLowerCase();
};

const manifest = [];
for (let i = 0; i < urls.length; i++) {
  const url = urls[i];
  const name = slug(url) + (label ? `.${label}` : "");
  const out = path.join(outDir, `${name}.jpg`);
  process.stdout.write(`[${i + 1}/${urls.length}] ${url} `);

  try {
    await send("Page.navigate", { url }, sessionId);
    await wait(3500); // fonts + hero media

    // Walk the page so lazy images and scroll-reveals fire, then return to top.
    const docH = await evalJs(
      "Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)"
    );
    const steps = Math.min(30, Math.ceil(docH / height));
    for (let s = 1; s <= steps; s++) {
      await evalJs(`window.scrollTo(0, ${s * height})`);
      await wait(450);
    }
    await evalJs("window.scrollTo(0, 0)");
    await wait(1200);

    const finalH = await evalJs(
      "Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)"
    );

    // Chrome garbles/times out on single captures much past MAX_FULLPAGE_H, so
    // pages taller than that are captured as consecutive vertical segments
    // (name.p1.jpg, name.p2.jpg, ...) rather than silently losing the footer.
    const segCount = Math.ceil(finalH / MAX_FULLPAGE_H);
    const files = [];
    for (let s = 0; s < segCount; s++) {
      const y = s * MAX_FULLPAGE_H;
      const segH = Math.min(MAX_FULLPAGE_H, finalH - y);
      const segOut =
        segCount === 1 ? out : out.replace(/\.jpg$/, `.p${s + 1}.jpg`);
      const { data } = await send(
        "Page.captureScreenshot",
        {
          format: "jpeg",
          quality: 78,
          captureBeyondViewport: true,
          clip: { x: 0, y, width, height: segH, scale: 1 },
        },
        sessionId,
        120000
      );
      fs.writeFileSync(segOut, Buffer.from(data, "base64"));
      files.push({ file: path.basename(segOut), y, height: segH, kb: Math.round(fs.statSync(segOut).size / 1024) });
    }
    const totalKb = files.reduce((a, f) => a + f.kb, 0);
    manifest.push({ url, file: files[0].file, segments: files, pageHeight: finalH, truncated: false, kb: totalKb });
    console.log(
      `-> ${files.map((f) => f.file).join(" + ")} (${finalH}px${segCount > 1 ? ` in ${segCount} parts` : ""}, ${totalKb}KB)`
    );
  } catch (err) {
    console.log(`-> FAILED: ${err.message}`);
    manifest.push({ url, file: null, error: err.message });
  }
}

fs.writeFileSync(
  path.join(outDir, `capture-manifest${label ? "." + label : ""}.json`),
  JSON.stringify({ width, height, capturedAt: null, pages: manifest }, null, 2)
);

ws.close();
chrome.kill();
console.log(`\nDone: ${manifest.filter((m) => m.file).length}/${manifest.length} captured into ${outDir}`);
process.exit(0);
