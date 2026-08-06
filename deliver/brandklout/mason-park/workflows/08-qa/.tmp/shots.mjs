// Screenshot QA for the three landing pages.
//
// Produces, per page: desktop full-page, mobile full-page, a viewport shot at
// depth (so the fixed offer rail is captured in place, which a full-page
// capture cannot show), and a reduced-motion full-page shot.
//
// Full-page captures scroll the page first so lazy images load and every
// reveal has fired — otherwise the shot records the test's impatience rather
// than the page.
//
// Usage: node shots.mjs [outDir]
// Source Asana task GID: 1217040406855582
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const DESIGN = path.resolve(here, "../../04-design/.tmp");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const OUT = process.argv[2] || path.join(here, "shots");
const ALL = ["invisalign", "new-patient-special", "thank-you"];
// Optional third arg runs a single page, which keeps each invocation short
// enough to finish in the foreground rather than being backgrounded mid-run.
const PAGES = process.argv[3] ? ALL.filter((p) => p === process.argv[3]) : ALL;

fs.mkdirSync(OUT, { recursive: true });
const fileUrl = (p) =>
  "file:///" + path.join(DESIGN, p, "index.html").replace(/\\/g, "/").replace(/ /g, "%20");
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let port = 9700;

async function session(fn, { width, height, mobile, reduced }) {
  const PORT = port++;
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-shot-"));
  const chrome = spawn(CHROME, [
    "--headless=new",
    // NOT --disable-gpu. The Google Maps embed draws its tiles through WebGL,
    // so with the GPU off the map captures as an empty grey box and reads as a
    // page defect when it is only a capture artifact. SwiftShader renders it in
    // software.
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--hide-scrollbars",
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
  let wsUrl = null;
  for (let i = 0; i < 60 && !wsUrl; i++) {
    try {
      wsUrl = (await getJSON("/json/version")).webSocketDebuggerUrl;
    } catch {}
    if (!wsUrl) await wait(200);
  }
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pend = new Map();
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) {
      pend.get(m.id)(m.result);
      pend.delete(m.id);
    }
  });
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  const send = (m, p = {}, s) =>
    new Promise((res) => {
      const i = ++id;
      pend.set(i, res);
      ws.send(JSON.stringify({ id: i, method: m, params: p, sessionId: s }));
    });

  const { targetInfos } = await send("Target.getTargets");
  const t = targetInfos.find((x) => x.type === "page");
  const { sessionId } = await send("Target.attachToTarget", {
    targetId: t.targetId,
    flatten: true,
  });
  await send("Page.enable", {}, sessionId);
  await send("Runtime.enable", {}, sessionId);
  await send("Page.bringToFront", {}, sessionId);
  await send(
    "Emulation.setEmulatedMedia",
    { features: reduced ? [{ name: "prefers-reduced-motion", value: "reduce" }] : [] },
    sessionId
  );
  await send(
    "Emulation.setDeviceMetricsOverride",
    { width, height, deviceScaleFactor: 1, mobile: !!mobile },
    sessionId
  );

  const evaluate = (expr) =>
    send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }, sessionId)
      .then((r) => r?.result?.value);
  const capture = async (beyond) => {
    const { data } = await send(
      "Page.captureScreenshot",
      { format: "png", captureBeyondViewport: !!beyond },
      sessionId
    );
    return Buffer.from(data, "base64");
  };

  try {
    await fn({ send, sessionId, evaluate, capture });
  } finally {
    ws.close();
    chrome.kill();
    await new Promise((r) => {
      if (chrome.exitCode !== null) return r();
      chrome.once("exit", r);
      setTimeout(r, 2500);
    });
  }
}

const settle = `(async () => {
  const step = innerHeight * 0.7;
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    scrollTo(0, y); await new Promise(r => setTimeout(r, 130));
  }
  scrollTo(0, document.body.scrollHeight);
  await new Promise(r => setTimeout(r, 1500));
  scrollTo(0, 0);
  await new Promise(r => setTimeout(r, 900));
})()`;

for (const page of PAGES) {
  // Desktop full page
  await session(
    async ({ send, sessionId, evaluate, capture }) => {
      await send("Page.navigate", { url: fileUrl(page) }, sessionId);
      await wait(3200);
      await evaluate(settle);
      fs.writeFileSync(path.join(OUT, `${page}-desktop.png`), await capture(true));
      console.log(`  ${page}-desktop.png`);
    },
    { width: 1440, height: 900 }
  );

  // Mobile full page
  await session(
    async ({ send, sessionId, evaluate, capture }) => {
      await send("Page.navigate", { url: fileUrl(page) }, sessionId);
      await wait(3200);
      await evaluate(settle);
      fs.writeFileSync(path.join(OUT, `${page}-mobile.png`), await capture(true));
      console.log(`  ${page}-mobile.png`);
    },
    { width: 390, height: 844, mobile: true }
  );

  // Viewport at depth — the fixed rail / sticky bar only render in place here
  for (const [label, frac, w, h, mob] of [
    ["rail", 0.45, 1440, 900, false],
    ["mobilebar", 0.45, 390, 844, true],
  ]) {
    await session(
      async ({ send, sessionId, evaluate, capture }) => {
        await send("Page.navigate", { url: fileUrl(page) }, sessionId);
        await wait(3200);
        await evaluate(`(async () => {
          const target = document.body.scrollHeight * ${frac};
          const step = innerHeight * 0.6;
          for (let y = 0; y < target; y += step) {
            scrollTo(0, y); await new Promise(r => setTimeout(r, 130));
          }
          scrollTo(0, target);
          await new Promise(r => setTimeout(r, 1800));
        })()`);
        fs.writeFileSync(path.join(OUT, `${page}-${label}.png`), await capture(false));
        console.log(`  ${page}-${label}.png`);
      },
      { width: w, height: h, mobile: mob }
    );
  }

  // Reduced motion, full page — content must be complete and unclipped
  await session(
    async ({ send, sessionId, evaluate, capture }) => {
      await send("Page.navigate", { url: fileUrl(page) }, sessionId);
      await wait(2600);
      await evaluate(settle);
      fs.writeFileSync(path.join(OUT, `${page}-reduced.png`), await capture(true));
      console.log(`  ${page}-reduced.png`);
    },
    { width: 1440, height: 900, reduced: true }
  );
}

console.log(`\nshots written to ${OUT}`);
