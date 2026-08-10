// height-diff.mjs — WHERE is the built page taller than the design?
//
// A whole-page height delta is not a finding, it is a prompt. Last session it
// was attributed to the registered-trademark marks breaking lines, on the
// strength of a correlation (thank-you has no marks and no delta). Collapsing
// those wrappers to inline changed the height by +36px, which refutes it. So
// measure per section instead of reasoning from a total.
//
// Reports every chapter's height on both sides, and inside the worst offender
// walks its children so the extra pixels have an address.
//
// Usage: node height-diff.mjs [page]   (MPD_BASE_URL to retarget)
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
const WIDTH = Number(process.env.MPD_WIDTH || 1440);
const ALL = ["invisalign", "new-patient-special", "thank-you"];
const PAGES = process.argv[2] ? ALL.filter((p) => p === process.argv[2]) : ALL;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let port = 9700;
async function session(url, fn) {
  const PORT = port++;
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-height-"));
  const chrome = spawn(CHROME, [
    "--headless=new", "--use-gl=angle", "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader", "--hide-scrollbars", `--window-size=${WIDTH},1000`,
    `--remote-debugging-port=${PORT}`, "--remote-allow-origins=*",
    "--force-device-scale-factor=1", "--no-first-run",
    "--disable-background-timer-throttling", "--disable-backgrounding-occluded-windows",
    "--disable-renderer-backgrounding", `--user-data-dir=${profile}`, "about:blank",
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
  await send("Emulation.setDeviceMetricsOverride",
    { width: WIDTH, height: 1000, deviceScaleFactor: 1, mobile: false }, sessionId);
  // Surface in-page errors. Swallowing them returns undefined, which then fails
  // far away as "cannot read properties of undefined" and hides the real cause.
  const evaluate = (expr) =>
    send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }, sessionId)
      .then((r) => {
        if (r?.exceptionDetails) {
          throw new Error("in-page: " + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
        }
        return r?.result?.value;
      });
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

// Pinned chapters are taller than their content on purpose — ScrollTrigger adds
// a pin-spacer sized to the scroll distance. Measure AFTER the page has settled
// and at scroll 0, so both sides are in the same state.
const MEASURE = `(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const t0 = Date.now(); let last = -1, stable = 0;
  while (Date.now() - t0 < 30000) {
    const h = document.documentElement.scrollHeight;
    if (Math.abs(h - last) <= 4) { stable++; if (stable >= 6) break; } else { stable = 0; last = h; }
    await sleep(400);
  }
  const step = innerHeight * 0.7;
  for (let y = 0; y < document.documentElement.scrollHeight; y += step) { scrollTo(0, y); await sleep(110); }
  scrollTo(0, 0); await sleep(1200);

  const out = { total: document.documentElement.scrollHeight, sections: [], detail: {}, chips: [] };
  out.chips = [...document.querySelectorAll(".chip")].slice(0,4).map(c => {
    const w = c.querySelector(".w-embed");
    const s = c.querySelector("svg");
    const r = c.getBoundingClientRect();
    return {
      chipBox: Math.round(r.width) + "x" + Math.round(r.height),
      chipDisplay: getComputedStyle(c).display,
      wrapper: w ? getComputedStyle(w).display : "(no wrapper)",
      wrapperTag: w ? w.tagName.toLowerCase() + "." + w.className : "-",
      svgDisplay: s ? getComputedStyle(s).display : "-",
      childCount: c.children.length,
      kids: [...c.children].map(k => k.tagName.toLowerCase() + "." + (typeof k.className === "string" ? k.className.trim().split(/\s+/)[0] : "")).join(" "),
      cs: (function () { var g = getComputedStyle(c);
        return "w=" + g.width + " ws=" + g.whiteSpace + " lh=" + g.lineHeight +
               " fs=" + g.fontSize + " pad=" + g.paddingTop + "/" + g.paddingLeft +
               " maxw=" + g.maxWidth + " flex=" + g.flex; })(),
      parentCs: (function () { var pp = c.parentElement; if (!pp) return "-"; var g = getComputedStyle(pp);
        return "<" + pp.tagName.toLowerCase() + "> w=" + Math.round(pp.getBoundingClientRect().width) +
               " disp=" + g.display + " wrap=" + g.flexWrap + " gap=" + g.gap; })(),
      boxes: (function () { var rows = [];
        for (var k = 0; k < c.childNodes.length; k++) {
          var n = c.childNodes[k];
          if (n.nodeType === 1) { var r = n.getBoundingClientRect();
            rows.push("EL <" + n.tagName.toLowerCase() + "> " + Math.round(r.width) + "x" +
                      Math.round(r.height) + " disp=" + getComputedStyle(n).display); }
          else if (n.nodeType === 3 && n.nodeValue.trim()) {
            var rg = document.createRange(); rg.selectNodeContents(n);
            var rects = rg.getClientRects(); var br = rg.getBoundingClientRect();
            rows.push("TXT [" + n.nodeValue.trim().slice(0, 24) + "] " + Math.round(br.width) +
                      "x" + Math.round(br.height) + " lines=" + rects.length); }
        } return rows; })(),
    };
  });
  const secs = [...document.querySelectorAll("[data-chapter-name], header, footer")];
  for (const s of secs) {
    // A pinned section sits inside a pin-spacer; the spacer is what occupies
    // document flow, so that is the honest number.
    const box = s.closest(".pin-spacer") || s;
    out.sections.push({
      id: s.id || s.tagName.toLowerCase(),
      name: s.getAttribute("data-chapter-name") || s.tagName.toLowerCase(),
      h: Math.round(box.getBoundingClientRect().height),
    });
    // One level down, so a bad section can be narrowed without a second run.
    out.detail[s.id || s.tagName.toLowerCase()] = [...s.children].map((c, i) => ({
      i, tag: c.tagName.toLowerCase(),
      cls: (typeof c.className === "string" ? c.className : "").trim().split(/\\s+/)[0] || "",
      h: Math.round(c.getBoundingClientRect().height),
    }));
  }
  return out;
})()`;

for (const page of PAGES) {
  console.log("\n" + "=".repeat(74));
  console.log("HEIGHT DIFF  " + page);
  console.log("=".repeat(74));
  const localPath = path.join(DESIGN, page, "index.html").split(path.sep).join("/").split(" ").join("%20");
  const L = await session("file:///" + localPath, ({ evaluate }) => evaluate(MEASURE));
  await wait(4000);
  const S = await session(`${STAGING}/${page}`, ({ evaluate }) => evaluate(MEASURE));

  console.log(`  total   design ${L.total}   staging ${S.total}   delta ${S.total - L.total}`);
  console.log("  --- chip anatomy ---");
  const dump = (tag, arr) => (arr || []).slice(0,2).forEach((c, i) => {
    console.log(`   ${tag} #${i} ${c.chipBox} wrapper=${c.wrapper}`);
    console.log(`        self   ${c.cs}`);
    console.log(`        parent ${c.parentCs}`);
    (c.boxes || []).forEach(b => console.log(`        ${b}`));
  });
  dump("design ", L.chips); dump("staging", S.chips);
  console.log("");
  const sm = new Map(S.sections.map((s) => [s.id, s]));
  let accounted = 0;
  for (const l of L.sections) {
    const s = sm.get(l.id);
    const d = s ? s.h - l.h : NaN;
    if (s) accounted += d;
    const flag = !s ? "  MISSING on staging" : Math.abs(d) > 8 ? `  <-- ${d > 0 ? "+" : ""}${d}` : "";
    console.log(`  ${String(l.id).padEnd(14)} ${String(l.name).padEnd(18)} design ${String(l.h).padStart(6)}  staging ${String(s ? s.h : "-").padStart(6)}${flag}`);
  }
  console.log(`\n  sections account for ${accounted} of the ${S.total - L.total}px delta`);

  // Narrow the worst section without needing another run.
  const worst = L.sections
    .map((l) => ({ l, s: sm.get(l.id) }))
    .filter((x) => x.s)
    .sort((a, b) => (b.s.h - b.l.h) - (a.s.h - a.l.h))[0];
  if (worst && worst.s.h - worst.l.h > 8) {
    console.log(`\n  inside #${worst.l.id} (+${worst.s.h - worst.l.h}px):`);
    const ld = L.detail[worst.l.id] || [], sd = S.detail[worst.l.id] || [];
    for (let i = 0; i < Math.max(ld.length, sd.length); i++) {
      const a = ld[i], b = sd[i];
      const d = a && b ? b.h - a.h : NaN;
      console.log(`     #${i} design ${a ? `<${a.tag}.${a.cls}> ${a.h}` : "-"}  |  staging ${b ? `<${b.tag}.${b.cls}> ${b.h}` : "-"}` +
        (Number.isFinite(d) && Math.abs(d) > 8 ? `   <-- ${d > 0 ? "+" : ""}${d}` : ""));
    }
  }
}
