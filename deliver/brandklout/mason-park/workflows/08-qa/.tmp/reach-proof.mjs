// Is every pinned chapter actually REACHABLE by scrolling?
//
// A pin can register, report a sane start/end, hold the viewport and release
// cleanly — and still be dead, because the document is not tall enough to scroll
// to it. That is invisible to every other gate: scrub-proof scrolls to
// `start + span*f`, the browser clamps that to maxScroll, and the probe then
// reads an unchanged state and calls it "not scrubbing".
//
//   node reach-proof.mjs [baseUrl]      default: staging
// Source Asana task GID: 1217040406855582
import { spawn } from "node:child_process";
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import http from "node:http";

const BASE = (process.argv[2] || "https://mason-park-dental.webflow.io").replace(/\/+$/, "");
const PAGES = ["invisalign", "new-patient-special", "thank-you"];
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let port = 9880, failures = 0;

for (const page of PAGES) {
  const PORT = port++;
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-reach-"));
  const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`, "--window-size=1440,900", "--no-first-run",
    `${BASE}/${page}`], { stdio: "ignore" });
  const getJSON = (p) => new Promise((res, rej) => { const t = setTimeout(() => rej(new Error("t")), 4000);
    http.get({ host: "127.0.0.1", port: PORT, path: p }, (r) => { let b = ""; r.on("data", d => b += d);
      r.on("end", () => { clearTimeout(t); try { res(JSON.parse(b)); } catch (e) { rej(e); } }); })
      .on("error", e => { clearTimeout(t); rej(e); }); });
  let ws, id = 0; const pending = new Map();
  for (let i = 0; i < 40; i++) { try { const tabs = await getJSON("/json/list");
    const tab = tabs.find(t => t.type === "page" && t.webSocketDebuggerUrl);
    if (tab) { ws = new WebSocket(tab.webSocketDebuggerUrl); break; } } catch {} await wait(300); }
  await new Promise(r => (ws.onopen = r));
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
  const send = (m, p) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
  const evaluate = async (x) => (await send("Runtime.evaluate", { expression: x, returnByValue: true, awaitPromise: true })).result?.result?.value;

  await wait(7000);
  // Scroll to the bottom first: pin spacers settle, and THAT is the height that
  // matters. Measuring at rest overstates how far the page can actually go.
  await evaluate(`window.scrollTo(0, document.documentElement.scrollHeight)`);
  await wait(1500);
  const r = await evaluate(`(function(){
    var max = Math.round(document.documentElement.scrollHeight - innerHeight);
    return { max: max, pins: ScrollTrigger.getAll().filter(function(s){return s.pin;})
      .map(function(s){ return { id: s.trigger && s.trigger.id,
        start: Math.round(s.start), end: Math.round(s.end) }; }) };
  })()`);

  console.log(`\n== ${page} ==  max scroll ${r.max}px`);
  for (const p of r.pins) {
    const reachable = p.start <= r.max;
    const fully = p.end <= r.max;
    const verdict = !reachable ? "UNREACHABLE" : !fully ? "TRUNCATED" : "ok";
    if (verdict !== "ok") failures++;
    console.log(`  ${verdict.padEnd(11)} #${String(p.id).padEnd(10)} start ${String(p.start).padStart(6)}  end ${String(p.end).padStart(6)}` +
      (reachable ? (fully ? "" : `   — last ${p.end - r.max}px of the scene cannot be scrolled to`)
                 : `   — starts ${p.start - r.max}px past the end of the document`));
  }
  ws.close(); chrome.kill();
}
console.log(failures ? `\n${failures} pinned scene(s) cannot be fully reached.` : "\nEvery pinned scene is reachable.");
process.exit(failures ? 1 : 0);
