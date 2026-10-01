// /patient-reviews rebuild + the GHL contact form, checked on the published site.
//   node verify-1001b.mjs > verify-1001b.log      (BASE=https://masonparkpediatricdental.com for production)
// Markup and CSP from the raw HTML, then a real browser: the form iframe loads, fills its card
// (not the 300px intrinsic width) and grows past the 150px it arrives at. GHL's Turnstile can keep
// the frame hidden under automation; that is reported, not failed (see the memory on it).
import { chromium } from "playwright-core";
const BASE = process.env.BASE || "https://staging.masonparkpediatricdental.com";
const FORM = "pyYcEmfIvtv5LwB1s4X6";
let pass = 0, fail = 0;
const ok = (c, msg) => { c ? pass++ : (fail++, console.log("FAIL", msg)); };
const html = async (p) => (await fetch(`${BASE}/${p}/`, { headers: { "user-agent": "Mozilla/5.0 Chrome/130" } })).text();

const pr = await html("patient-reviews");
for (const t of ["Real stories from Katy parents.", "There&rsquo;s a reason parents choose us.", "Kids&rsquo; dentistry, done right.",
  "Have a question, or ready to book?", "st-next", "elfsight-app-d359c3c4", `widget/form/${FORM}`, "Read their stories"])
  ok(pr.includes(t) || pr.includes(t.replace(/&rsquo;/g, "’")), `patient-reviews has ${t}`);
ok(!pr.includes("The short ones first"), "patient-reviews lacks the old wall lede");
const ct = await html("contacts");
for (const t of ["Send us a message.", `widget/form/${FORM}`, "form_embed.js"]) ok(ct.includes(t), `contacts has ${t}`);
for (const [p, s] of [["contacts", ct], ["patient-reviews", pr]]) {
  const csp = (s.match(/<meta http-equiv="Content-Security-Policy" content="([^"]*)"/) || [])[1] || "(no CSP meta)";
  ok(!/frame-src 'none'/.test(csp), `${p} CSP lets frames in: ${csp.slice(0, 160)}`);
}

const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
for (const [p, sid, w] of [["contacts", "message", 1440], ["patient-reviews", "question", 1440], ["contacts", "message", 390]]) {
  const page = await b.newPage({ viewport: { width: w, height: 900 }, userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36" });
  const csp = [];
  page.on("console", (m) => { if (/Content Security Policy|Refused/.test(m.text())) csp.push(m.text().slice(0, 160)); });
  await page.goto(`${BASE}/${p}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.addStyleTag({ content: "html,body{scroll-behavior:auto!important}" });
  await page.evaluate((sid) => document.getElementById(sid).scrollIntoView(), sid);
  await page.waitForTimeout(14000);
  const m = await page.evaluate((FORM) => {
    const f = document.querySelector(`iframe[src*="${FORM}"]`);
    if (!f) return null;
    const card = f.closest(".ms-card"), r = f.getBoundingClientRect(), c = card?.getBoundingClientRect();
    const cs = getComputedStyle(f);
    return { w: Math.round(r.width), h: Math.round(r.height), card: c && Math.round(c.width), vis: cs.visibility, op: cs.opacity, host: f.closest(".wz-embed")?.className };
  }, FORM);
  ok(m, `${p} ${w}: form iframe present`);
  if (m) {
    console.log(`${p} ${w}: iframe ${m.w}x${m.h} in card ${m.card}, host "${m.host}", visibility ${m.vis} opacity ${m.op}`);
    ok(m.card && m.w >= m.card * 0.85, `${p} ${w}: iframe fills its card (${m.w} of ${m.card})`);
    if (m.vis === "hidden" || m.op === "0") console.log(`  note: frame still hidden (Turnstile under automation?) - check by hand`);
    else ok(m.h > 300, `${p} ${w}: iframe grew past its arrival height (${m.h})`);
  }
  ok(!csp.length, `${p} ${w}: no CSP errors ${csp.join(" | ")}`);
  await page.close();
}
await b.close();
console.log(`${pass} pass, ${fail} fail on ${BASE}`);
