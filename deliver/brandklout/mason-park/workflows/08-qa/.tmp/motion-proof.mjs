// Proves motion actually PLAYS, rather than that classes were set.
//
// Samples the live computed style of animated elements over time and diffs
// consecutive viewport frames. A page whose motion is dead produces identical
// frames and static transforms; a page whose motion works produces changing
// transforms and visibly different frames.
//
// Usage: node motion-proof.mjs [page] [--reduced]
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
const PAGES = ["invisalign", "new-patient-special", "thank-you"];

const args = process.argv.slice(2);
const reduced = args.includes("--reduced");
const only = args.find((a) => !a.startsWith("--"));
const targets = only ? PAGES.filter((p) => p === only) : PAGES;

const fileUrl = (p) =>
  "file:///" + path.join(DESIGN, p, "index.html").replace(/\\/g, "/").replace(/ /g, "%20");
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let port = 9600;

async function run(page) {
  const PORT = port++;
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-proof-"));
  const chrome = spawn(CHROME, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--window-size=1440,900",
    `--remote-debugging-port=${PORT}`,
    "--remote-allow-origins=*",
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

  const evaluate = async (expr) => {
    const r = await send(
      "Runtime.evaluate",
      { expression: expr, returnByValue: true, awaitPromise: true },
      sessionId
    );
    return r?.result?.value;
  };
  const shot = async () => {
    const { data } = await send("Page.captureScreenshot", { format: "png" }, sessionId);
    return Buffer.from(data, "base64");
  };

  await send("Page.navigate", { url: fileUrl(page) }, sessionId);

  // Sample the hero entrance as it happens.
  const samples = [];
  const frames = [];
  for (const at of [120, 350, 700, 1200, 2200]) {
    await wait(at - (samples.length ? [120, 350, 700, 1200, 2200][samples.length - 1] : 0));
    const s = await evaluate(`(() => {
      const pick = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const cs = getComputedStyle(el);
        return { t: cs.transform, o: cs.opacity, c: cs.clipPath };
      };
      return JSON.stringify({
        headlineInner: pick('h1 .line > .anim-inner'),
        formCard: pick('.form-card'),
        price: (document.querySelector('.price-now') || {}).textContent || null,
        banner: pick('.status-mark')
      });
    })()`);
    samples.push({ at, s: JSON.parse(s || "{}") });
    frames.push(await shot());
  }

  // Scroll-triggered motion further down the page.
  const scrollSample = await evaluate(`(async () => {
    const media = document.querySelector('.split-media, .map-frame');
    if (!media) return JSON.stringify({ skip: true });
    const before = getComputedStyle(media).clipPath;
    media.scrollIntoView({ block: 'center' });
    await new Promise(r => setTimeout(r, 120));
    const during = getComputedStyle(media).clipPath;
    await new Promise(r => setTimeout(r, 1500));
    const after = getComputedStyle(media).clipPath;
    return JSON.stringify({ before, during, after });
  })()`);

  ws.close();
  chrome.kill();
  await new Promise((r) => {
    if (chrome.exitCode !== null) return r();
    chrome.once("exit", r);
    setTimeout(r, 2500);
  });

  // Frame-to-frame byte difference is a crude but honest liveness signal.
  const diffs = [];
  for (let i = 1; i < frames.length; i++) {
    const a = frames[i - 1];
    const b = frames[i];
    diffs.push(a.length === b.length && a.equals(b) ? "identical" : "changed");
  }

  return { page, samples, scrollSample: JSON.parse(scrollSample || "{}"), diffs };
}

for (const p of targets) {
  const r = await run(p);
  console.log(`\n=== ${r.page}${reduced ? "  [reduced motion]" : ""} ===`);
  r.samples.forEach((s) => {
    const h = s.s.headlineInner || s.s.banner;
    console.log(
      `  t=${String(s.at).padStart(4)}ms  headline/banner transform: ${
        h ? h.t : "n/a"
      }  price: ${s.s.price || "n/a"}`
    );
  });
  console.log(`  hero frames between samples: ${r.diffs.join(", ")}`);
  if (!r.scrollSample.skip) {
    console.log(
      `  media wipe clip-path  before: ${r.scrollSample.before}  ->  after: ${r.scrollSample.after}`
    );
  }
}
