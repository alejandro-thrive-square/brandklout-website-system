// Site-wide functional + contrast audit across every page in final-site/.
//
// The home journey has its own deep test (interaction-test-gsap.mjs). This one
// asks the questions that only appear once there is more than one page: do the
// links go anywhere, does every page carry the same shell, does the reveal
// system actually leave content visible, and does any text fail WCAG contrast.
//
// Usage: node site-test.mjs <baseUrl> [page,page,...]
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";

const base = (process.argv[2] || "http://127.0.0.1:8902").replace(/\/$/, "");
const PAGES = (process.argv[3] || [
  "index", "dental-implants", "all-on-4", "implant-cost", "sedation-dentistry",
  "smile-makeover", "veneers", "smile-gallery", "patient-stories", "meet-dr-nahlah", "contact",
  // 2026-08-10 build-out from the old site's IA. Keep this list in step with
  // PAGES in site-src/build-site.mjs — a page missing here is a page whose
  // links, contrast and overflow nobody is checking.
  "about", "our-team", "our-facility",
].join(",")).split(",");

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9100 + Math.floor(Math.random() * 250);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-site-"));
const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--hide-scrollbars",
  `--remote-debugging-port=${PORT}`, "--remote-allow-origins=*",
  "--force-device-scale-factor=1", "--window-size=1440,900",
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
const consoleErrors = [];
ws.addEventListener("message", async (ev) => {
  const raw = typeof ev.data === "string" ? ev.data : await ev.data.text();
  const m = JSON.parse(raw);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Log.entryAdded" && m.params?.entry?.level === "error") {
    const e = m.params.entry;
    // Local-server transport blips are environmental, not page defects.
    if (!/ERR_CONNECTION_RESET|ERR_ABORTED|ERR_NETWORK_CHANGED/.test(e.text + (e.url || ""))) {
      consoleErrors.push((e.url || "") + " :: " + e.text);
    }
  }
  // Log.entryAdded does NOT carry console.error() calls, and WZ.run swallows a
  // failing section's exception into exactly that. Without this the harness
  // would report a clean page while half the motion setup never ran.
  if (m.method === "Runtime.consoleAPICalled" && m.params?.type === "error") {
    consoleErrors.push("console.error :: " +
      (m.params.args || []).map((a) => a.value ?? a.description ?? a.type).join(" "));
  }
});
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
function send(method, params = {}, sessionId) {
  return new Promise((res, rej) => {
    const mid = ++id;
    const t = setTimeout(() => rej(new Error("timeout " + method)), 40000);
    pending.set(mid, (m) => { clearTimeout(t); m.error ? rej(new Error(m.error.message)) : res(m.result); });
    ws.send(JSON.stringify({ id: mid, method, params, sessionId }));
  });
}
const { targetInfos } = await send("Target.getTargets");
const pt = targetInfos.find((t) => t.type === "page");
const { sessionId } = await send("Target.attachToTarget", { targetId: pt.targetId, flatten: true });
await send("Page.enable", {}, sessionId);
await send("Runtime.enable", {}, sessionId);
await send("Log.enable", {}, sessionId).catch(() => {});
const evalJs = async (expr) => {
  const r = await send("Runtime.evaluate",
    { expression: expr, returnByValue: true, awaitPromise: true }, sessionId);
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " :: " + expr.slice(0, 90));
  return r.result.value;
};

let pass = 0; const failures = [];
function check(page, name, ok, detail) {
  const line = `${ok ? "PASS" : "FAIL"}  [${page}] ${name}${detail ? "  — " + detail : ""}`;
  console.log(line);
  ok ? pass++ : failures.push(line);
}

const existing = new Set(PAGES.map((p) => p + ".html"));

// Contrast auditing, run inside the page. Walks up for the first opaque
// background; anything sitting over a photo is reported separately rather than
// scored against a background it does not really have.
const CONTRAST_JS = `(function(){
  function parse(c){
    var m = c.match(/rgba?\\(([^)]+)\\)/); if(!m) return null;
    var p = m[1].split(',').map(function(x){return parseFloat(x)});
    return {r:p[0],g:p[1],b:p[2],a:p.length>3?p[3]:1};
  }
  function lum(c){
    var s=[c.r,c.g,c.b].map(function(v){v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)});
    return 0.2126*s[0]+0.7152*s[1]+0.0722*s[2];
  }
  function ratio(a,b){var l1=lum(a),l2=lum(b);var hi=Math.max(l1,l2),lo=Math.min(l1,l2);
    return (hi+0.05)/(lo+0.05);}
  function blend(fg,bg){ // fg over bg
    var a=fg.a; return {r:fg.r*a+bg.r*(1-a),g:fg.g*a+bg.g*(1-a),b:fg.b*a+bg.b*(1-a),a:1};
  }
  var fails=[], overImage=0, tested=0;
  var els = document.querySelectorAll('body *');
  for (var i=0;i<els.length;i++){
    var el = els[i];
    // only elements with their own visible text
    var text='';
    for (var n=0;n<el.childNodes.length;n++){
      if (el.childNodes[n].nodeType===3) text += el.childNodes[n].textContent;
    }
    text = text.trim();
    if (!text) continue;
    var cs = getComputedStyle(el);
    if (cs.visibility==='hidden' || cs.display==='none') continue;
    if (parseFloat(cs.opacity) < 0.1) continue;
    var r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    var fg = parse(cs.color); if(!fg) continue;

    // find first ancestor with an opaque-ish background; bail if an image sits between
    var bg=null, node=el, imageBetween=false;
    while(node && node!==document.documentElement){
      var ns = getComputedStyle(node);
      if (ns.backgroundImage && ns.backgroundImage!=='none') imageBetween=true;
      var nb = parse(ns.backgroundColor);
      if (nb && nb.a >= 0.85){ bg = nb; break; }
      // a translucent layer over an unknown backdrop is not scorable either
      if (nb && nb.a > 0.05) imageBetween = true;
      // an <img> painted behind this text
      if (node.querySelector && node.querySelector(':scope > img, :scope > video')) {
        var im = node.querySelector(':scope > img, :scope > video');
        var ims = getComputedStyle(im);
        if (ims.position==='absolute' || ims.position==='fixed') imageBetween = true;
      }
      node = node.parentElement;
    }
    if (imageBetween){ overImage++; continue; }
    if (!bg) bg = {r:255,g:255,b:255,a:1};
    var eff = fg.a < 1 ? blend(fg,bg) : fg;
    var cr = ratio(eff,bg);
    tested++;
    var size = parseFloat(cs.fontSize);
    var weight = parseInt(cs.fontWeight,10) || 400;
    var large = size >= 24 || (size >= 18.66 && weight >= 700);
    var min = large ? 3 : 4.5;
    if (cr < min){
      fails.push({
        sel: el.tagName.toLowerCase() + (el.className && typeof el.className==='string' ? '.'+el.className.trim().split(/\\s+/).slice(0,2).join('.') : ''),
        text: text.slice(0,48),
        ratio: Math.round(cr*100)/100, min: min, size: Math.round(size),
        color: cs.color, bg: 'rgb('+Math.round(bg.r)+','+Math.round(bg.g)+','+Math.round(bg.b)+')'
      });
    }
  }
  return {tested: tested, overImage: overImage, fails: fails.slice(0,14), failCount: fails.length};
})()`;

for (const page of PAGES) {
  const url = `${base}/${page}.html`;
  consoleErrors.length = 0;
  await send("Emulation.setDeviceMetricsOverride",
    { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
  await send("Page.navigate", { url }, sessionId);
  await wait(2600);
  await evalJs(`document.fonts ? document.fonts.ready.then(()=>1) : 1`);
  await wait(600);

  check(page, "page loaded with the shared shell",
    await evalJs(`!!(document.getElementById('nav') && document.getElementById('drawer')
      && document.querySelector('footer.foot') && document.getElementById('smooth-wrapper'))`));

  check(page, "exactly one h1",
    (await evalJs(`document.querySelectorAll('h1').length`)) === 1,
    (await evalJs(`document.querySelectorAll('h1').length`)) + " found");

  const title = await evalJs(`document.title`);
  check(page, "unique page title + meta description",
    !!title && title.length > 15 &&
    (await evalJs(`(document.querySelector('meta[name=description]')||{}).content || ''`)).length > 40,
    title.slice(0, 52));

  // internal links must point at a page that exists
  const badLinks = await evalJs(`(function(){
    var out=[];
    document.querySelectorAll('a[href]').forEach(function(a){
      var h=a.getAttribute('href');
      if(!h || /^(https?:|tel:|mailto:|#)/.test(h)) return;
      out.push(h.split('#')[0]);
    });
    return Array.from(new Set(out));
  })()`);
  const missing = badLinks.filter((h) => !existing.has(h));
  check(page, "every internal link resolves to a real page",
    missing.length === 0, missing.length ? missing.join(", ") : `${badLinks.length} distinct targets`);

  // in-page anchors must exist
  const badAnchors = await evalJs(`(function(){
    var out=[];
    document.querySelectorAll('a[href^="#"]').forEach(function(a){
      var h=a.getAttribute('href');
      if(h.length<2) return;
      if(!document.querySelector(h)) out.push(h);
    });
    return out;
  })()`);
  check(page, "in-page anchors all have targets",
    badAnchors.length === 0, badAnchors.join(", "));

  // Walk the whole page so lazy images load and reveals fire.
  //
  // ScrollSmoother eases toward the target rather than jumping, so a fast walk
  // arrives with triggers still catching up — which reads as "content never
  // revealed" when the page is fine. Step, let it settle, and give the tail of
  // the page a long beat at the end.
  const maxScroll = await evalJs(`window.ScrollTrigger ? ScrollTrigger.maxScroll(window)
    : (document.documentElement.scrollHeight - window.innerHeight)`);
  for (let y = 0; y <= maxScroll; y += 600) {
    await evalJs(`(function(){var s=window.WZ&&WZ.smoother;
      if(s&&s.scrollTop)s.scrollTop(${y}); else window.scrollTo(0,${y});
      if(window.ScrollTrigger)ScrollTrigger.update(); return 1})()`);
    await wait(140);
  }
  await wait(2600);
  await evalJs(`window.ScrollTrigger && ScrollTrigger.update()`);
  await wait(400);

  const broken = await evalJs(`(function(){
    var b=[];
    document.querySelectorAll('img').forEach(function(i){
      if(i.complete && i.naturalWidth===0) b.push(i.getAttribute('src'));
    });
    return b;
  })()`);
  check(page, "no broken images", broken.length === 0, broken.join(", "));

  // A fast scripted walk can outrun ScrollSmoother's easing, leaving the last
  // section's triggers still catching up. Anything still hidden gets a second
  // chance: park on it deliberately, the way a reader would, and re-check.
  // Only something that stays invisible after that is a real defect.
  let hidden = await evalJs(`(function(){
    var h=[];
    document.querySelectorAll('[data-rv]').forEach(function(el,i){
      if(parseFloat(getComputedStyle(el).opacity) < 0.9) h.push(i);
    });
    return h;
  })()`);
  for (const idx of hidden.slice()) {
    await evalJs(`(function(){
      var el=document.querySelectorAll('[data-rv]')[${idx}];
      var s=window.WZ&&WZ.smoother;
      var y=(s&&s.offset)?s.offset(el,'top 60%'):el.getBoundingClientRect().top+window.scrollY-400;
      if(s&&s.scrollTop)s.scrollTop(y); else window.scrollTo(0,y);
      if(window.ScrollTrigger)ScrollTrigger.update(); return 1})()`);
    await wait(900);
  }
  hidden = await evalJs(`(function(){
    var h=[];
    document.querySelectorAll('[data-rv]').forEach(function(el){
      if(parseFloat(getComputedStyle(el).opacity) < 0.9)
        h.push(el.className || el.tagName);
    });
    return h;
  })()`);
  check(page, "every revealed block ends up visible",
    hidden.length === 0, hidden.slice(0, 4).join(" | "));

  // before/after sliders, where the page has them
  const baCount = await evalJs(`document.querySelectorAll('.pk-ba input[type=range]').length`);
  if (baCount) {
    const moved = await evalJs(`(function(){
      var ba=document.querySelector('.pk-ba'), r=ba.querySelector('input[type=range]');
      r.value=18; r.dispatchEvent(new Event('input',{bubbles:true}));
      var a=ba.style.getPropertyValue('--pos');
      r.value=82; r.dispatchEvent(new Event('input',{bubbles:true}));
      return a + ' -> ' + ba.style.getPropertyValue('--pos');
    })()`);
    check(page, `${baCount} before/after sliders respond`, moved === "18% -> 82%", moved);
  }

  const overflow = await evalJs(`document.documentElement.scrollWidth`);
  check(page, "no horizontal overflow @1440", overflow <= 1440, "scrollWidth=" + overflow);

  const contrast = await evalJs(CONTRAST_JS);
  check(page, "text contrast meets WCAG AA",
    contrast.failCount === 0,
    contrast.failCount
      ? contrast.fails.map((f) => `${f.sel} "${f.text}" ${f.ratio}:1 <${f.min}`).join(" || ")
      : `${contrast.tested} nodes scored, ${contrast.overImage} over imagery (unscorable)`);

  check(page, "no console errors", consoleErrors.length === 0, consoleErrors.slice(0, 2).join(" | "));

  // mobile pass
  await send("Emulation.setDeviceMetricsOverride",
    { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }, sessionId);
  await evalJs(`window.dispatchEvent(new Event('resize'))`);
  await wait(900);
  await evalJs(`window.ScrollTrigger && ScrollTrigger.refresh()`);
  await wait(600);
  const mOverflow = await evalJs(`document.documentElement.scrollWidth`);
  check(page, "no horizontal overflow @390", mOverflow <= 391, "scrollWidth=" + mOverflow);
  check(page, "menu button reachable on mobile",
    await evalJs(`getComputedStyle(document.getElementById('burger')).display !== 'none'`));
}

console.log(`\n${pass}/${pass + failures.length} checks passed`);
if (failures.length) {
  console.log("\nFAILED:\n" + failures.join("\n"));
}
ws.close(); chrome.kill();
process.exit(failures.length ? 1 : 0);
