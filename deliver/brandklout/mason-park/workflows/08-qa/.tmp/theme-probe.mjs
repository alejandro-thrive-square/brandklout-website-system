// theme-probe.mjs — does each chapter carry its design theme on staging?
//
// The design themes per SECTION with `data-theme="dark|light"`, which flips a
// block of custom properties. Webflow has no way to express an attribute
// selector as a class, so the question is whether the attribute (and therefore
// the whole dark palette) survived the paste. Reads the attribute AND the
// resolved tokens, because an attribute that is present but unstyled looks
// identical in the DOM and completely different on screen.
//
// Usage: node theme-probe.mjs [page]   (MPD_BASE_URL to retarget)
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
const STAGING = (process.env.MPD_BASE_URL || "https://mason-park-dental.webflow.io").replace(/\/+$/, "");
const ALL = ["invisalign", "new-patient-special", "thank-you"];
const PAGES = process.argv[2] ? ALL.filter((p) => p === process.argv[2]) : ALL;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let port = 9880;
async function session(url, fn) {
  const PORT = port++;
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-theme-"));
  const chrome = spawn(CHROME, [
    "--headless=new", "--use-gl=angle", "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader", "--hide-scrollbars", "--window-size=1440,1000",
    `--remote-debugging-port=${PORT}`, "--remote-allow-origins=*",
    "--force-device-scale-factor=1", "--no-first-run",
    `--user-data-dir=${profile}`, "about:blank",
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
  const ws = new WebSocket(wsUrl);
  let id = 0; const pend = new Map();
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); }
  });
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  const send = (m, p = {}, s) => new Promise((res) => {
    const i = ++id; pend.set(i, res);
    ws.send(JSON.stringify({ id: i, method: m, params: p, sessionId: s }));
  });
  const { targetInfos } = await send("Target.getTargets");
  const t = targetInfos.find((x) => x.type === "page");
  const { sessionId } = await send("Target.attachToTarget", { targetId: t.targetId, flatten: true });
  await send("Page.enable", {}, sessionId);
  await send("Runtime.enable", {}, sessionId);
  const evaluate = (expr) =>
    send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }, sessionId)
      .then((r) => r?.result?.value);
  await send("Page.navigate", { url }, sessionId);
  for (let i = 0; i < 150; i++) {
    const st = await evaluate(`document.documentElement ? document.readyState : ""`).catch(() => "");
    if (st === "interactive" || st === "complete") break;
    await wait(200);
  }
  try { return await fn({ evaluate }); }
  finally {
    ws.close(); chrome.kill();
    await new Promise((r) => { if (chrome.exitCode !== null) return r(); chrome.once("exit", r); setTimeout(r, 2500); });
  }
}

const READ = `(async () => {
  await new Promise(r => setTimeout(r, 6000));
  const secs = [...document.querySelectorAll("section, .chapter, [data-chapter]")];
  const seen = new Set();
  return secs.filter(s => { const k = s.id || s.className; if (seen.has(k)) return false; seen.add(k); return true; })
    .map(s => {
      const cs = getComputedStyle(s);
      return {
        id: s.id || "(no id)",
        cls: (typeof s.className === "string" ? s.className : "").trim(),
        theme: s.getAttribute("data-theme") || "(none)",
        chapter: s.getAttribute("data-chapter") ?? "(none)",
        chapterName: s.getAttribute("data-chapter-name") || "(none)",
        bg: cs.backgroundColor,
        color: cs.color,
        tokBg: cs.getPropertyValue("--bg").trim(),
        tokFg: cs.getPropertyValue("--fg-body").trim(),
        tokAccent: cs.getPropertyValue("--accent").trim(),
      };
    });
})()`;

for (const page of PAGES) {
  console.log("\n" + "=".repeat(78));
  console.log("PAGE  " + page);
  console.log("=".repeat(78));
  const local = await session(
    "file:///" + path.join(DESIGN, page, "index.html").replace(/\\/g, "/").replace(/ /g, "%20"),
    ({ evaluate }) => evaluate(READ));
  await wait(3000);
  const live = await session(`${STAGING}/${page}`, ({ evaluate }) => evaluate(READ));

  const row = (s) => `${(s.id || "").padEnd(14)} theme=${String(s.theme).padEnd(7)} ch=${String(s.chapter).padEnd(6)} bg=${String(s.bg).padEnd(22)} --bg=${String(s.tokBg).padEnd(16)} --accent=${s.tokAccent}`;
  console.log("\n-- LOCAL --");
  (local || []).forEach((s) => console.log("  " + row(s)));
  console.log("\n-- STAGING --");
  (live || []).forEach((s) => console.log("  " + row(s)));

  console.log("\n-- VERDICT --");
  for (const l of local || []) {
    const m = (live || []).find((x) => x.id === l.id);
    if (!m) { console.log(`  MISSING on staging: section #${l.id}`); continue; }
    const bad = [];
    if (l.theme !== m.theme) bad.push(`data-theme design=${l.theme} staging=${m.theme}`);
    if (l.bg !== m.bg) bad.push(`background design=${l.bg} staging=${m.bg}`);
    if (l.tokAccent !== m.tokAccent) bad.push(`--accent design=${l.tokAccent} staging=${m.tokAccent}`);
    if (l.chapter !== m.chapter) bad.push(`data-chapter design=${l.chapter} staging=${m.chapter}`);
    console.log(bad.length ? `  #${l.id}\n      ${bad.join("\n      ")}` : `  #${l.id}  OK`);
  }
}
