// Fluid-root responsive QA. The static gate in scripts/fluid-root.mjs proves the
// snippet is in the file; only this proves it is LIVE and that the type scale that
// replaced clamp() actually renders.
//
// Per breakpoint it asserts:
//   - computed document.documentElement font-size == scripts/fluid-root.mjs --verify
//   - zero horizontal overflow, after a full scroll sweep (lazy rows and pinned
//     tracks can widen a page only once they have been scrolled through)
//   - body copy stays legible on a phone
// and captures the hero and one mid-page viewport so the result can be looked at.
//
// Usage: node fluid-qa.mjs <baseUrl> [outDir]
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";

// The scale is imported rather than re-derived — scripts/fluid-root.mjs is the
// single source of truth, so this test cannot drift from the CSS it verifies.
// That module also has a CLI block at top level which prints the <style> block
// on import, so stdout is muted for the duration of the import only.
const _w = process.stdout.write.bind(process.stdout);
process.stdout.write = () => true;
const { rootPxAt } = await import("../../../../../../scripts/fluid-root.mjs");
process.stdout.write = _w;

const base = (process.argv[2] || "http://127.0.0.1:8903").replace(/\/$/, "");
const OUT = path.resolve(process.argv[3] || "screenshots-fluid");
const WIDTHS = [360, 390, 768, 991, 1280, 1440, 1920];
const PAGES = process.env.ONLY ? process.env.ONLY.split(",") : [
  "index", "dental-implants", "all-on-4", "implant-cost", "sedation-dentistry",
  "smile-makeover", "veneers", "smile-gallery", "patient-stories", "meet-dr-nahlah", "contact",
  // 2026-08-10 build-out. our-team and our-facility each carry a page-local
  // <style> block (the portrait grid, the asymmetric tour grid), so they are
  // the two new pages with a CSS path the kit does not already cover.
  "about", "our-team", "our-facility",
  // teeth-whitening carries the only <table> on the site — the one page-local
  // CSS path in batch 2, and the one at real risk of overflowing a 360px view.
  "cosmetic-dentistry", "teeth-whitening", "crowns-and-bridges", "oral-surgery",
  "emergency-dentistry", "dental-conditions", "implant-supported-dentures", "dental-implant-faq",
  // privacy-policy-mclean carries the site's only single-column legal-prose
  // layout. It replaced the retired "privacy-policy" on 2026-08-19, and until
  // this line was updated the run measured Chrome's 404 page instead: a 404 has
  // a 16px root at every width, so it reported the fluid type scale as broken
  // at 390 and at 1920. A hardcoded page list that 404s fails as a LAYOUT bug.
  "patient-center", "financing", "doctor-referral", "privacy-policy-mclean",
  // The video library is the only page whose cards are third-party thumbnails
  // at a fixed aspect, so it is the one most likely to overflow a 360px view.
  "video-library",
  // 2026-09-17 ads landing pages. All nine are here rather than one per shape,
  // because css/70-landing.css is the newest CSS path on the site and the three
  // page shapes have different overflow risks at 360: the landing page has the
  // two-column `.lp-stakes` and the `.lp-tiers` spec rows, the consultation
  // page has a third-party form iframe that sets its own width, and the
  // thank-you page has the `.lp-next-list` numeral column. All nine also carry
  // the two-row fixed header, which is the one piece of chrome on this site
  // whose height the hero has to clear by hand.
  // 2026-09-17c: one set per office. Same nine bodies, two locations, so the
  // eighteen are listed rather than nine: a body that overflows only when the
  // longer office name in the form note wraps is a real failure on a real page.
  "ads-alexandria-all-on-4", "ads-alexandria-all-on-4-consultation", "ads-alexandria-all-on-4-thank-you",
  "ads-alexandria-dental-implants", "ads-alexandria-dental-implants-consultation", "ads-alexandria-dental-implants-thank-you",
  "ads-alexandria-veneers", "ads-alexandria-veneers-consultation", "ads-alexandria-veneers-thank-you",
  "ads-tysons-all-on-4", "ads-tysons-all-on-4-consultation", "ads-tysons-all-on-4-thank-you",
  "ads-tysons-dental-implants", "ads-tysons-dental-implants-consultation", "ads-tysons-dental-implants-thank-you",
  "ads-tysons-veneers", "ads-tysons-veneers-consultation", "ads-tysons-veneers-thank-you",
];
// Shooting all 11 at 7 widths is 77 images nobody will open. These three cover the
// three distinct CSS paths: the journey, the shared page kit, and the one page with
// the 11vw display figure.
const SHOOT = new Set(["index", "dental-implants", "patient-stories"]);

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9400 + Math.floor(Math.random() * 250);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-fluid-"));
fs.mkdirSync(OUT, { recursive: true });

const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--hide-scrollbars",
  `--remote-debugging-port=${PORT}`, "--remote-allow-origins=*",
  "--force-device-scale-factor=1", "--window-size=1920,1080",
  "--no-first-run", "--no-default-browser-check",
  "--autoplay-policy=no-user-gesture-required",
  `--user-data-dir=${profile}`, "about:blank",
]);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const getJSON = (p) => new Promise((res, rej) => {
  http.get({ host: "127.0.0.1", port: PORT, path: p }, (r) => {
    let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res(JSON.parse(d)));
  }).on("error", rej);
});
let wsUrl;
for (let i = 0; i < 150; i++) {
  try { const v = await getJSON("/json/version"); if (v.webSocketDebuggerUrl) { wsUrl = v.webSocketDebuggerUrl; break; } } catch {}
  await wait(300);
}
const ws = new WebSocket(wsUrl);
let id = 0; const pending = new Map();
ws.addEventListener("message", async (ev) => {
  const raw = typeof ev.data === "string" ? ev.data : await ev.data.text();
  const m = JSON.parse(raw);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
await new Promise((r) => ws.addEventListener("open", r));
const send = (method, params = {}, sessionId) => new Promise((res) => {
  const mid = ++id;
  pending.set(mid, res);
  ws.send(JSON.stringify({ id: mid, method, params, ...(sessionId ? { sessionId } : {}) }));
});
const { result: { targetId } } = await send("Target.createTarget", { url: "about:blank" });
const { result: { sessionId } } = await send("Target.attachToTarget", { targetId, flatten: true });
await send("Page.enable", {}, sessionId);
await send("Runtime.enable", {}, sessionId);

// Runtime.evaluate can land while the page is still committing a navigation, which
// comes back as an undefined result rather than an error. Retry once before
// treating that as a real answer, and surface a thrown exception instead of
// silently reading `undefined` off it.
const evalJs = async (expr, tries = 3) => {
  for (let i = 0; i < tries; i++) {
    const r = await send("Runtime.evaluate",
      { expression: expr, returnByValue: true, awaitPromise: true }, sessionId);
    if (r.result?.exceptionDetails) {
      throw new Error("page threw: " + (r.result.exceptionDetails.exception?.description ||
        r.result.exceptionDetails.text));
    }
    const v = r.result?.result?.value;
    if (v !== undefined) return v;
    await wait(600);
  }
  return undefined;
};

const results = [];
const fail = [];
const ok = (cond, label, detail) => {
  results.push({ cond, label, detail });
  if (!cond) fail.push(`${label}${detail ? " — " + detail : ""}`);
};

for (const w of WIDTHS) {
  const expected = rootPxAt(w);
  for (const page of PAGES) {
    await send("Emulation.setDeviceMetricsOverride",
      { width: w, height: w < 768 ? 844 : 900, deviceScaleFactor: 1, mobile: w < 768 }, sessionId);
    await send("Page.navigate", { url: `${base}/${page}.html` }, sessionId);
    await wait(w < 768 ? 2600 : 2200);
    /* A fixed sleep is a bet on parse time, and the bet loses as pages grow: the
       moment all-on-4 crossed ~34KB this harness started evaluating before the
       body existed and died with "Cannot read properties of null (reading
       'scrollHeight')" -- which reads like a site defect and is not one.
       Wait for the body, then continue. */
    for (let i = 0; i < 60; i++) {
      if (await evalJs(`!!document.body`)) break;
      await wait(250);
    }

    // Scroll the whole page: a pinned horizontal track or a lazy row can only
    // widen the document once it has actually been scrolled into view.
    await evalJs(`(async()=>{const h=document.body.scrollHeight;
      for(let y=0;y<h;y+=Math.round(window.innerHeight*0.9)){window.scrollTo(0,y);
        await new Promise(r=>setTimeout(r,90));}
      window.scrollTo(0,0);await new Promise(r=>setTimeout(r,350));})()`);

    const m = await evalJs(`(()=>{
      const cs=getComputedStyle(document.documentElement);
      const bodyEl=document.querySelector('main p, .pk-lede p, .lc-body p, p');
      const h1=document.querySelector('h1');
      return {
        root: parseFloat(cs.fontSize),
        scrollW: document.documentElement.scrollWidth,
        inner: window.innerWidth,
        body: bodyEl?parseFloat(getComputedStyle(bodyEl).fontSize):null,
        bodyBase: parseFloat(getComputedStyle(document.body).fontSize),
        h1: h1?parseFloat(getComputedStyle(h1).fontSize):null,
      };})()`);

    if (!m) { ok(false, `measurable @${w} [${page}]`, "page never returned metrics"); continue; }
    ok(Math.abs(m.root - expected) < 0.12, `root font-size @${w} [${page}]`,
      `computed ${m.root.toFixed(2)}px vs --verify ${expected.toFixed(2)}px`);
    ok(m.scrollW <= m.inner, `no horizontal overflow @${w} [${page}]`,
      `scrollWidth=${m.scrollW} vs ${m.inner}`);
    if (w === 390) {
      ok(m.bodyBase >= 15.9, `body copy >= 16px @390 [${page}]`, `${m.bodyBase.toFixed(2)}px`);
    }

    if (SHOOT.has(page)) {
      // The nav cross-fades .nav-links out and .nav-chapter in (they are stacked
      // on purpose) over 0.45s whenever .solid toggles. Returning to the top
      // starts that fade, so a shot taken too early catches both at half opacity
      // and reads as a collision. Wait the transition out before capturing.
      await evalJs(`document.getElementById('nav')?.classList.contains('solid')`);
      await wait(1100);
      const shot = await send("Page.captureScreenshot", { format: "jpeg", quality: 82 }, sessionId);
      fs.writeFileSync(path.join(OUT, `${page}-${w}-hero.jpg`),
        Buffer.from(shot.result.data, "base64"));
      await evalJs(`window.scrollTo(0,Math.round(document.body.scrollHeight*0.45))`);
      await wait(700);
      const shot2 = await send("Page.captureScreenshot", { format: "jpeg", quality: 82 }, sessionId);
      fs.writeFileSync(path.join(OUT, `${page}-${w}-mid.jpg`),
        Buffer.from(shot2.result.data, "base64"));
      await evalJs(`window.scrollTo(0,0)`);
    }
    if (page === "index" || page === "dental-implants") {
      console.log(`  ${String(w).padStart(4)} ${page.padEnd(17)} root=${m.root.toFixed(2)}px  ` +
        `h1=${m.h1 ? m.h1.toFixed(1) : "-"}px  body=${m.bodyBase.toFixed(1)}px  sw=${m.scrollW}`);
    }
  }
}

console.log(`\n${results.filter((r) => r.cond).length}/${results.length} checks passed`);
if (fail.length) { console.log("FAILED:\n  " + fail.join("\n  ")); }
console.log(`screenshots -> ${path.relative(process.cwd(), OUT)}`);
ws.close(); chrome.kill();
process.exit(fail.length ? 1 : 0);
