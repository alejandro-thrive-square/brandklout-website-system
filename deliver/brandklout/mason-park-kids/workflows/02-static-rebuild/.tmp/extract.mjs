// Pull structured content out of the workflow-01 recovery snapshots.
//
// SAFETY: `rendered.html` is a snapshot of a host that was ACTIVELY COMPROMISED
// while it was taken (see docs/security-incident-2026-08-27.md). Nothing here
// ever executes it: every <script>/<link>/<iframe> is stripped from a throwaway
// sanitised copy BEFORE it reaches the browser, <img src> is renamed so no
// request is made, and Chrome additionally runs with script execution disabled.
// The DOM we need is already rendered in the snapshot, so no JS has to run for
// the parse to be correct.
//
//   node extract.mjs [--only substr] [--limit N]
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { fileURLToPath, pathToFileURL } from "node:url";
import { CORE_SLUGS, EXTRA_EXTRACT } from "./pages.config.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PAGES = path.resolve(HERE, "../../01-site-recovery/.tmp/pages");
const OUT = path.join(HERE, "content");
fs.mkdirSync(OUT, { recursive: true });

const argv = process.argv.slice(2);
const str = (n, d) => { const i = argv.indexOf(n); return i === -1 ? d : argv[i + 1]; };
const num = (n, d) => { const i = argv.indexOf(n); return i === -1 ? d : Number(argv[i + 1]); };
const ONLY = str("--only", null);
const LIMIT = num("--limit", Infinity);

const WANTED = [...CORE_SLUGS, ...EXTRA_EXTRACT];
let slugs = WANTED.filter((s) => fs.existsSync(path.join(PAGES, s, "rendered.html")));
const missing = WANTED.filter((s) => !slugs.includes(s));
if (ONLY) slugs = slugs.filter((s) => s.includes(ONLY));
slugs = slugs.slice(0, LIMIT);
console.log(`${slugs.length} pages to extract${missing.length ? ` — MISSING from the recovery: ${missing.join(", ")}` : ""}`);

// ------------------------------------------------------------------ sanitiser
// Belt and braces with --disable-javascript: physically remove every executable
// or network-fetching node before the file is handed to the browser.
const sanitise = (html) =>
  html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<script\b[^>]*\/?>/gi, "")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, "")
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, (m) =>
      // keep the tag so the extractor can record the embed, but neuter the load
      m.replace(/\bsrc=/gi, "data-embed-src=").replace(/<iframe/i, "<iframe data-neutered=\"1\""))
    .replace(/<link\b[^>]*rel=["']?stylesheet[^>]*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "")
    // <img src> would hit the network for a host that is still compromised
    .replace(/<img\b([^>]*?)\bsrc=/gi, "<img$1 data-img-src=")
    .replace(/\bsrcset=/gi, "data-srcset=");

// The snapshots keep no description field, so read it out of the head. Yoast
// and the theme both write one; take whichever is present.
const descriptionOf = (html) => {
  const head = html.slice(0, 60000);
  const m = head.match(/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']\s*\/?>/i)
    || head.match(/<meta\s+property=["']og:description["']\s+content=["']([\s\S]*?)["']\s*\/?>/i);
  if (!m) return "";
  return m[1].replace(/&amp;/g, "&").replace(/&#0?39;/g, "'").replace(/&quot;/g, '"')
    .replace(/&#8217;/g, "\u2019").replace(/\s+/g, " ").trim();
};

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mpk-extract-"));

// ---------------------------------------------------------------- CDP plumbing
const PORT = 9800 + Math.floor(Math.random() * 150);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "mpk-extract-profile-"));
const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--disable-javascript",
  `--remote-debugging-port=${PORT}`, "--remote-allow-origins=*",
  "--no-first-run", "--no-default-browser-check",
  `--user-data-dir=${profile}`, "about:blank",
]);
let chromeErr = "";
chrome.stderr.on("data", (d) => (chromeErr += d));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const getJSON = (p) => new Promise((res, rej) => {
  http.get({ host: "127.0.0.1", port: PORT, path: p }, (r) => {
    let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res(JSON.parse(d)));
  }).on("error", rej);
});
async function findWs() {
  for (let i = 0; i < 60; i++) {
    try { const v = await getJSON("/json/version"); if (v.webSocketDebuggerUrl) return v.webSocketDebuggerUrl; } catch {}
    await wait(200);
  }
  throw new Error("Chrome CDP did not come up\n" + chromeErr.slice(0, 800));
}
const ws = new WebSocket(await findWs());
let id = 0;
const pending = new Map();
ws.addEventListener("message", (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
});
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let sessionId;
const call = (method, params, root) => new Promise((resolve) => {
  const mid = ++id; pending.set(mid, resolve);
  ws.send(JSON.stringify({ id: mid, method, params, ...(root ? {} : { sessionId }) }));
});
const send = (m, p = {}) => call(m, p, false);
const sendRoot = (m, p = {}) => call(m, p, true);
const { targetInfos } = await sendRoot("Target.getTargets");
let pageTarget = targetInfos.find((t) => t.type === "page")
  || { targetId: (await sendRoot("Target.createTarget", { url: "about:blank" })).targetId };
({ sessionId } = await sendRoot("Target.attachToTarget", { targetId: pageTarget.targetId, flatten: true }));
await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setScriptExecutionDisabled", { value: true });
const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: false });
  if (r?.exceptionDetails) throw new Error(r.exceptionDetails.text + " " + (r.exceptionDetails.exception?.description || ""));
  return r?.result?.value;
};

// ------------------------------------------------------------------ extraction
const EXTRACT = fs.readFileSync(path.join(HERE, "extract-in-page.js"), "utf8");

const results = [];
for (const [i, slug] of slugs.entries()) {
  const src = path.join(PAGES, slug, "rendered.html");
  const raw = fs.readFileSync(src, "utf8");
  const tmp = path.join(tmpDir, slug + ".html");
  fs.writeFileSync(tmp, sanitise(raw));
  await send("Page.navigate", { url: pathToFileURL(tmp).href });
  await wait(180);
  let data;
  try {
    data = await evaluate(`(function(){${EXTRACT}})()`);
  } catch (e) {
    console.log(`  ! ${slug}: ${String(e).slice(0, 200)}`);
    continue;
  }
  const meta = JSON.parse(fs.readFileSync(path.join(PAGES, slug, "meta.json"), "utf8"));
  const out = {
    slug,
    url: `https://pediatricdentistkatytx.com/${slug === "home" ? "" : slug + "/"}`,
    title: meta.title,
    description: descriptionOf(raw),
    ...data,
  };
  fs.writeFileSync(path.join(OUT, slug + ".json"), JSON.stringify(out, null, 1));
  results.push({ slug, kind: out.kind, blocks: out.blocks?.length ?? 0, words: out.words });
  console.log(`  ${String(i + 1).padStart(3)}/${slugs.length}  ${slug.padEnd(36)} ${out.kind.padEnd(10)} ${out.blocks?.length ?? 0} blocks  ${out.words}w`);
}

fs.writeFileSync(path.join(OUT, "_index.json"), JSON.stringify(results, null, 1));
console.log(`\nDone — ${results.length} pages -> content/`);
ws.close();
chrome.kill();
try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}  // Chrome may still hold the profile on Windows
process.exit(0);
