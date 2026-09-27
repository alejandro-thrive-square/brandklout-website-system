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
// The page list is DERIVED from site-src/build-site.mjs, not restated here.
// It used to be a hand-kept copy with a comment asking the next person to keep
// it in step, and on 2026-08-19 it drifted: two retired legal pages were still
// in the list and five new ones were not. The run then fetched a 404, whose
// document has no #burger, and the harness threw `Uncaught` instead of failing
// a named check. One source, and a page cannot quietly stop being tested.
const PAGES = (process.argv[3] || (() => {
  const src = fs.readFileSync(
    path.resolve(import.meta.dirname, "site-src", "build-site.mjs"), "utf8");
  const block = /const PAGES = \[([\s\S]*?)\];/.exec(src);
  if (!block) throw new Error("could not find PAGES in build-site.mjs");
  const slugs = [...block[1].matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]);
  if (slugs.length < 20) throw new Error(`only ${slugs.length} slugs parsed from build-site.mjs`);
  return slugs.join(",");
})()).split(",");

/* The ads landing pages carry a DIFFERENT shell on purpose: `lp-nav` instead of
   the site header, no `#drawer` and no `#burger`, and `lp-foot` instead of the
   site footer. That is the whole point of them — a paid landing page must not
   leak the click into the site — so the four drawer checks below cannot apply,
   and the shared-shell check has to ask a different question.
   Derived from build-site.mjs the same way PAGES is, so a tenth landing page
   cannot quietly get tested as an editorial one. Absent that file (an explicit
   page list on the command line), the set is empty and every page is treated as
   editorial, which is the stricter of the two. */
const LANDING = new Set((() => {
  try {
    const src = fs.readFileSync(
      path.resolve(import.meta.dirname, "site-src", "build-site.mjs"), "utf8");
    const block = /const PAGES = \[([\s\S]*?)\];/.exec(src)[1];
    return [...block.matchAll(/slug:\s*"([^"]+)"[^}]*?\blanding:\s*\{/g)].map((m) => m[1]);
  } catch { return []; }
})());
console.log(`landing pages (no drawer by design): ${LANDING.size || "none"}`);

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
/* The document as SERVED, before any script has touched it. Used by the
   "no CSS or JS inlined" check — see the comment at its call site. */
const fetchText = (u) => new Promise((res, rej) => {
  http.get(u, (r) => {
    let d = ""; r.setEncoding("utf8");
    r.on("data", (c) => (d += c)); r.on("end", () => res(d));
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

/* The 43 article URLs are real on every host that serves this site, but they are
   not files in final-site: the articles live in the Instatic posts collection and
   are rendered through the `post` template. Checking them against the folder
   would report 43 broken links on a page where nothing is broken, so they are
   validated against the archive itself, which is the stronger test — a card
   pointing at a slug that is not in posts.json IS a dead link. */
const POSTS_JSON = new URL('../../13-content-export-import/.tmp/posts.json', import.meta.url);
const POST_SLUGS = (() => {
  try {
    const j = JSON.parse(fs.readFileSync(POSTS_JSON, 'utf8'));
    return (Array.isArray(j) ? j : j.posts || []).map((x) => 'posts/' + x.slug + '.html');
  } catch { return []; }
})();
const existing = new Set([...PAGES.map((p) => p + ".html"), ...POST_SLUGS]);
console.log(`link targets: ${PAGES.length} built pages + ${POST_SLUGS.length} CMS article routes`);

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

  const isLanding = LANDING.has(page);
  if (isLanding) {
    /* The landing shell, asserted rather than assumed: the header still has to
       be `#nav` with `#navProgress` inside it, because js/90-boot.js reads both
       without guarding and throws on the first scroll past 40px otherwise. The
       drawer and the burger have to be ABSENT — a site map on a paid landing
       page is the leak these pages exist to close — and the CTA rail has to be
       outside `#smooth-wrapper`, or ScrollSmoother's transform makes `fixed`
       position it against the wrapper instead of the viewport and it scrolls
       away with the page. */
    check(page, "page loaded with the landing shell",
      await evalJs(`!!(document.getElementById('nav') && document.getElementById('navProgress')
        && document.querySelector('header.lp-nav') && document.querySelector('footer.lp-foot')
        && document.getElementById('smooth-wrapper'))`));
    check(page, "landing page has no site map to leak the click into",
      await evalJs(`!document.getElementById('drawer') && !document.getElementById('burger')
        && !document.querySelector('.nav-links')`));
    const rail = await evalJs(`(function(){
      var r = document.querySelector('.lp-rail');
      if (!r) return 'none';
      return document.getElementById('smooth-wrapper').contains(r) ? 'inside the smoother' : 'fixed';
    })()`);
    /* The thank-you pages deliberately ship no rail: there is nothing left to
       convert once the form has been sent. */
    check(page, "mobile CTA rail is fixed outside the smoother, or absent by design",
      rail === "fixed" || (rail === "none" && /-thank-you$/.test(page)), rail);
  } else {
    check(page, "page loaded with the shared shell",
      await evalJs(`!!(document.getElementById('nav') && document.getElementById('drawer')
        && document.querySelector('footer.foot') && document.getElementById('smooth-wrapper'))`));
  }

  /* The architecture claim, checked rather than asserted in a comment: styling
     and behaviour are site-wide, and each section's module runs exactly when
     that section's markup is present. That is what makes a section something
     you can move between pages by moving only the markup.

     The claim is about what THIS BUILD ships, so the count is taken from the
     shipped document, not from the live DOM. A page carrying a third-party
     embed cannot control what the vendor's script does after load, and
     LeadConnector's form_embed.js injects a 2.8 KB `.ep-*` <style> into <head>
     — measuring the live DOM failed both contact pages for a stylesheet this
     repository does not write and cannot remove.

     The check is NOT weakened by that: a <style> or an inline <script> that we
     author into a page body is in the shipped HTML and still fails, on every
     page, embed or no embed. What is no longer counted is what a vendor adds at
     runtime, which was never this check's subject. */
  /* Comments are stripped FIRST. The page bodies discuss their own markup —
     "One <style> + one <script>, injected once per page" is a real comment in
     contact.body.html — and counting those reports a violation that is a
     sentence in English, not an element. */
  const shipped = (await fetchText(url)).replace(/<!--[\s\S]*?-->/g, "");
  const shippedStyles = (shipped.match(/<style[\s>]/gi) || []).length;
  /* 2026-09-17: partials/site-scripts.html ships the Google Tag Manager
     bootstrap on every page, and GTM's bootstrap is inline by design. It is
     the one inline script this build authors, it carries `data-site-script`,
     and only a script carrying that attribute is exempt: an inline script in
     a page body still fails. On Instatic the same tags live in `siteScripts`. */
  const shippedInline = (shipped.match(/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)(?![^>]*\bdata-site-script=)[^>]*>/gi) || []).length;
  check(page, "no CSS or JS inlined into the page",
    shippedStyles === 0 && shippedInline === 0,
    `${shippedStyles} style, ${shippedInline} inline script (as shipped)`);

  /* 2026-09-22: the GoHighLevel number pool can only swap a telephone number
     it can recognise. Its `replaceNumber` matches, in TEXT, only
     `(NNN) NNN-NNNN`, `NNN-NNN-NNNN`, `NNN.NNN.NNNN` and `(NNN)NNN-NNNN`,
     and in an `<a href>` a contiguous ten-digit run as well. A number written
     `571 253 7790`, with a non-breaking space after the area code, or as bare
     digits in running text is invisible to it: the page keeps the practice's
     own number, the call is never attributed, and nothing anywhere fails.
     So the format is a gate, not a preference. `noswap` opts a number out on
     purpose and is therefore allowed any shape. */
  const phoneShapes = await evalJs(`(function(){
    /* The swapper uses String.includes, not a whole-string match, so a
       recognised form ANYWHERE in the string is enough: "1-800-677-0718"
       carries "800-677-0718" and swaps fine. */
    var OK = /(\\(\\d{3}\\)\\s?\\d{3}-\\d{4}|\\d{3}-\\d{3}-\\d{4}|\\d{3}\\.\\d{3}\\.\\d{4})/;
    var ANY = /(?:\\+?1[\\s.\\u00a0-]?)?\\(?\\d{3}\\)?[\\s.\\u00a0-]?\\d{3}[\\s.\\u00a0-]?\\d{4}/g;
    var bad = [];
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    var n;
    while ((n = w.nextNode())) {
      if (n.parentElement && n.parentElement.closest('.noswap')) continue;
      var m = n.nodeValue.match(ANY);
      if (!m) continue;
      m.forEach(function(x){ if (!OK.test(x)) bad.push('text "' + x + '"'); });
    }
    [].forEach.call(document.querySelectorAll('a[href^="tel:"]'), function(a){
      if (a.closest('.noswap')) return;
      var h = a.getAttribute('href');
      /* 911 and the other short codes are not ten-digit numbers, so no pool can
         ever hold one and there is nothing here to keep swappable. */
      if ((h.match(/\\d/g) || []).length < 10) return;
      if (!/\\d{10}/.test(h.replace(/[^\\d]/g, '')) && !OK.test(h)) bad.push('href "' + h + '"');
    });
    return bad.length ? bad.slice(0, 4).join(', ') : 'ok';
  })()`);
  check(page, "every phone number is in a shape the GHL number pool can swap",
    phoneShapes === "ok", phoneShapes);

  const modules = await evalJs(`(function(){
    if (!window.WZ || !WZ.modules) return 'no registry';
    var wrong = WZ.modules.filter(function(m){
      var present = !!document.querySelector(m.selector);
      var ran = WZ.active.indexOf(m.name) > -1;
      return present !== ran;
    }).map(function(m){ return m.name; });
    return wrong.length ? wrong.join(',') : 'ok:' + WZ.active.length + '/' + WZ.modules.length;
  })()`);
  check(page, "every section module ran iff its section is on the page",
    String(modules).startsWith("ok:"), modules);

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

  /* CLICK THE FILM, do not just assert the markup is there. A click-to-play
     facade that renders perfectly and does nothing when clicked looks identical
     to a working one in every screenshot and in every other check on this page,
     and these are paid pages where the testimonial is a large part of the
     argument. So: click the first facade, and require that a real player took
     its place. */
  const facades = await evalJs(`document.querySelectorAll('.vl-card[data-yt]').length`);
  if (facades > 0) {
    const played = await evalJs(`(function(){
      var card = document.querySelector('.vl-card[data-yt]');
      var id = card.getAttribute('data-yt');
      card.click();
      var open = document.querySelector('.vl-card .vl-frame iframe');
      if (!open) return 'click produced no player';
      if ((open.getAttribute('src') || '').indexOf(id) === -1) return 'player is the wrong film';
      if (document.querySelector('.vl-card[data-yt="' + id + '"]')) return 'facade still a control';
      return 'plays';
    })()`);
    check(page, `${facades} film facades play when clicked`, played === "plays", played);
  }

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

  /* A landing page has no burger and no drawer to open, so the four checks
     below have nothing to measure on it. What it has instead is a CTA within
     reach of a thumb, and THAT is the equivalent claim worth asserting: the
     rail is pure CSS precisely so it cannot be the thing that failed, and a
     landing page whose only CTA is above the fold on a phone is a landing page
     that converts nobody who scrolled. */
  if (isLanding) {
    if (/-thank-you$/.test(page)) { continue; }
    const railHit = await evalJs(`(function(){
      var r = document.querySelector('.lp-rail');
      if (!r) return 'no rail';
      if (getComputedStyle(r).display === 'none') return 'hidden at 390';
      var a = r.querySelectorAll('a');
      if (a.length < 2) return a.length + ' action(s)';
      for (var i = 0; i < a.length; i++) {
        var b = a[i].getBoundingClientRect();
        // Ask who owns the pixel rather than reading the box: that covers
        // z-index, transform, opacity and clipping in one measurement, which is
        // the same question the user's thumb asks.
        var hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
        if (!hit || !r.contains(hit)) return 'action ' + (i + 1) + ' is covered by ' +
          (hit ? hit.tagName.toLowerCase() + '.' + (hit.className || '') : 'nothing');
        if (b.bottom > innerHeight + 1) return 'action ' + (i + 1) + ' is off the bottom';
      }
      return 'reachable';
    })()`);
    check(page, "CTA rail is reachable on mobile", railHit === "reachable", railHit);
    continue;
  }

  check(page, "menu button reachable on mobile",
    await evalJs(`getComputedStyle(document.getElementById('burger')).display !== 'none'`));

  /* The drawer is the site index, so a dead burger is a dead sitemap on every
     page at once. Asserting the class name is not enough — the state classes the
     script toggles and the ones the stylesheet reads are written in two different
     files, and when they drifted apart the drawer stopped opening while every
     other check on this page stayed green. So: click it, and look at whether the
     panel actually arrived on screen. */
  /* Hit-test a real link rather than reading the panel's box. The drawer is
     `position:fixed; inset:0` at all times and hides itself with a clip-path,
     so its bounding rect, visibility and opacity are identical open and shut —
     a check on those passes against a drawer that never opened. Asking who owns
     the pixel covers clip-path, opacity, visibility, z-index and transform in
     one measurement, and it is the same question the user's finger asks. */
  await evalJs(`document.getElementById('burger').click()`);
  await wait(700);
  const drawerOpen = await evalJs(`(function(){
    var d = document.getElementById('drawer');
    if (!d) return 'no drawer';
    // elementFromPoint only answers for coordinates inside the viewport, and at
    // 390px most of the drawer's index is below the fold — so pick the first
    // link whose centre is actually on screen rather than the first link.
    // The header deliberately rides ABOVE the open drawer so its close button
    // stays reachable, so anything under that strip is legitimately covered.
    var navEl = document.getElementById('nav');
    var navBottom = navEl ? navEl.getBoundingClientRect().bottom : 0;
    var links = d.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
      var r = links[i].getBoundingClientRect();
      var x = r.left + r.width / 2, y = r.top + r.height / 2;
      if (!r.width || !r.height) continue;
      if (y < navBottom + 2) continue;
      if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) continue;
      var hit = document.elementFromPoint(x, y);
      return (hit && d.contains(hit)) ? 'open' : 'covered by ' +
        (hit ? hit.tagName.toLowerCase() + '.' + (hit.className || '') : 'nothing');
    }
    return 'no drawer link is on screen';
  })()`);
  check(page, "menu button opens the drawer", drawerOpen === "open", drawerOpen);
  check(page, "burger reports its state to assistive tech",
    (await evalJs(`document.getElementById('burger').getAttribute('aria-expanded')`)) === "true");

  await evalJs(`document.getElementById('burger').click()`);
  await wait(600);
  check(page, "drawer closes again",
    (await evalJs(`document.getElementById('burger').getAttribute('aria-expanded')`)) === "false");
}

console.log(`\n${pass}/${pass + failures.length} checks passed`);
if (failures.length) {
  console.log("\nFAILED:\n" + failures.join("\n"));
}
ws.close(); chrome.kill();
process.exit(failures.length ? 1 : 0);
