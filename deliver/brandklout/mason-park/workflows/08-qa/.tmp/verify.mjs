// Functional verification for the Mason Park landing pages.
//
// Screenshots cannot prove a form advances, a reveal fires, or an accordion
// opens — those are invisible to a capture. This drives the real pages through
// real interactions over CDP and asserts on the resulting DOM state.
//
// Usage: node verify.mjs            (all pages)
//        node verify.mjs invisalign (one page)
//
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

// The number each page must render. Sourced from the outgoing vendor's
// originals, which ran a different tracking number per landing page.
// See 01-content-intake/.tmp/vendor-originals.md
const PUBLIC = { display: "(281) 769-8878", e164: "+12817698878" };
const EXPECTED_PHONE = {
  invisalign: { display: "(281) 767-8698", e164: "+12817678698" },
  "new-patient-special": { display: "(281) 688-1610", e164: "+12816881610" },
  // No vendor original and no GHL number yet, so it falls back to the public
  // number unless a ?src= carries a campaign number through.
  "thank-you": PUBLIC,
};
const only = process.argv[2];
const targets = only ? PAGES.filter((p) => p === only) : PAGES;

const fileUrl = (p) =>
  "file:///" + path.join(DESIGN, p, "index.html").replace(/\\/g, "/").replace(/ /g, "%20");

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
let checks = 0;

function record(page, name, pass, detail) {
  checks++;
  if (!pass) failures++;
  const mark = pass ? "PASS" : "FAIL";
  console.log(`  [${mark}] ${name}${detail ? "  — " + detail : ""}`);
}

// Injected before motion assertions. An element counts as "stuck hidden" if it
// is transparent, still displaced, still clipped, or its mask inner is still
// parked below the edge. This is what catches a reveal that never fired —
// which a screenshot of the top of the page would never show.
const HIDDEN_PROBE = `
  function isIdentity(t){
    return !t || t === 'none' || /^matrix\\(1,\\s*0,\\s*0,\\s*1,\\s*0,\\s*0\\)$/.test(t);
  }
  function clipHides(c){
    if (!c || c === 'none') return false;
    var nums = c.match(/-?[\\d.]+%/g);
    return !!(nums && nums.some(function (n) { return parseFloat(n) > 0.5; }));
  }
  function hiddenIn(root){
    var scope = (root && root.querySelectorAll) ? root : document;
    var els = [].slice.call(scope.querySelectorAll('[data-anim], .reveal'));
    var stuck = [];
    els.forEach(function (el) {
      var cs = getComputedStyle(el), bad = false;
      if (parseFloat(cs.opacity) < 0.99) bad = true;
      if (!isIdentity(cs.transform)) bad = true;
      if (clipHides(cs.clipPath)) bad = true;
      var inner = el.querySelector(':scope > .anim-inner');
      if (inner && !isIdentity(getComputedStyle(inner).transform)) bad = true;
      if (bad) stuck.push((el.tagName || '').toLowerCase() + '.' +
        String(el.className || '').split(' ')[0]);
    });
    return { total: els.length, stuck: stuck.length, samples: stuck.slice(0, 6) };
  }
`;

// What the headline price must land on, exactly.
const EXPECTED_PRICE = {
  invisalign: "$3,800",
  "new-patient-special": "$189",
};

// Monotonic, never random. Random ports let a fresh run attach to a previous
// Chrome that has not finished exiting, which silently verifies the WRONG page
// — it showed up here as a ?src= case reading the prior navigation's number.
let nextPort = 9500;

async function withPage(url, fn, { reduced = false, width = 1440, height = 900 } = {}) {
  const PORT = nextPort++;
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-verify-"));
  const chrome = spawn(CHROME, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    `--remote-debugging-port=${PORT}`,
    "--remote-allow-origins=*",
    "--force-device-scale-factor=1",
    `--window-size=${width},${height}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--allow-file-access-from-files",
    // A backgrounded/occluded tab freezes transitions, IntersectionObserver and
    // rAF, which reports motion as broken when it is fine. Keep the page
    // foregrounded and unthrottled, and assert on it below.
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
    "--disable-renderer-backgrounding",
    "--disable-features=CalculateNativeWinOcclusion",
    `--user-data-dir=${profile}`,
    "about:blank",
  ]);
  let chromeErr = "";
  chrome.stderr.on("data", (d) => (chromeErr += d));

  const getJSON = (p) =>
    new Promise((resolve, reject) => {
      http
        .get({ host: "127.0.0.1", port: PORT, path: p }, (res) => {
          let d = "";
          res.on("data", (c) => (d += c));
          res.on("end", () => resolve(JSON.parse(d)));
        })
        .on("error", reject);
    });

  let wsUrl = null;
  for (let i = 0; i < 50 && !wsUrl; i++) {
    try {
      const v = await getJSON("/json/version");
      wsUrl = v.webSocketDebuggerUrl;
    } catch {}
    if (!wsUrl) await wait(200);
  }
  if (!wsUrl) throw new Error("CDP did not start\n" + chromeErr.slice(0, 500));

  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  const consoleErrors = [];

  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg.result);
      pending.delete(msg.id);
    }
    if (msg.method === "Runtime.exceptionThrown") {
      consoleErrors.push(
        msg.params?.exceptionDetails?.exception?.description ||
          msg.params?.exceptionDetails?.text || "exception"
      );
    }
    if (msg.method === "Runtime.consoleAPICalled" && msg.params?.type === "error") {
      consoleErrors.push((msg.params.args || []).map((a) => a.value || a.description).join(" "));
    }
  });
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));

  const send = (method, params = {}, sessionId) =>
    new Promise((resolve) => {
      const mid = ++id;
      pending.set(mid, resolve);
      ws.send(JSON.stringify({ id: mid, method, params, sessionId }));
    });

  const { targetInfos } = await send("Target.getTargets");
  let target = targetInfos.find((t) => t.type === "page");
  if (!target)
    target = { targetId: (await send("Target.createTarget", { url: "about:blank" })).targetId };
  const { sessionId } = await send("Target.attachToTarget", {
    targetId: target.targetId,
    flatten: true,
  });

  await send("Page.enable", {}, sessionId);
  await send("Runtime.enable", {}, sessionId);
  await send("Page.bringToFront", {}, sessionId); // never verify a background tab
  await send(
    "Emulation.setEmulatedMedia",
    { features: reduced ? [{ name: "prefers-reduced-motion", value: "reduce" }] : [] },
    sessionId
  );
  await send(
    "Emulation.setDeviceMetricsOverride",
    { width, height, deviceScaleFactor: 1, mobile: width < 700 },
    sessionId
  );

  const evaluate = async (expression) => {
    const r = await send(
      "Runtime.evaluate",
      { expression, returnByValue: true, awaitPromise: true },
      sessionId
    );
    if (r?.exceptionDetails) {
      throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    }
    return r?.result?.value;
  };

  await send("Page.navigate", { url }, sessionId);

  // Do not assert on a fixed sleep. Wait until the navigation has actually
  // committed with the query string we asked for and the document is complete,
  // otherwise a slow commit lets assertions read the PREVIOUS page — which is
  // exactly how a ?src= check silently passed against the wrong number.
  const expectedSearch = url.includes("?") ? "?" + url.split("?").slice(1).join("?") : "";
  const expectedKey = url.split("/").slice(-2)[0].split("?")[0];

  // Poll for OUR page's own marker rather than readyState 'complete'. 'complete'
  // blocks on the Google Fonts stylesheet over the network, which made this
  // flaky; and matching on location.search alone would pass instantly against
  // the initial about:blank, which has an empty search too.
  let settled = false;
  for (let i = 0; i < 80; i++) {
    try {
      const st = await evaluate(
        `JSON.stringify({
          rs: document.readyState,
          s: location.search,
          key: document.body ? document.body.getAttribute('data-page-key') : null
        })`
      );
      const o = JSON.parse(st);
      if (o.rs !== "loading" && o.s === expectedSearch && o.key === expectedKey) {
        settled = true;
        break;
      }
    } catch {}
    await wait(150);
  }
  if (!settled) {
    throw new Error(
      `navigation never settled at ${url} (expected key "${expectedKey}", search "${expectedSearch}")`
    );
  }
  await wait(1400); // fonts, reveals, page-local scripts

  try {
    await fn({ evaluate, consoleErrors, send, sessionId });
  } finally {
    ws.close();
    chrome.kill();
    // Wait for the process to actually go away before the next run starts.
    await new Promise((r) => {
      if (chrome.exitCode !== null) return r();
      chrome.once("exit", r);
      setTimeout(r, 3000);
    });
  }
}

/* -------------------------------------------------------------- *
 * Checks shared by every page
 * -------------------------------------------------------------- */
async function commonChecks(page, ctx) {
  const { evaluate, consoleErrors } = ctx;

  record(page, "no uncaught JS errors", consoleErrors.length === 0, consoleErrors.join(" | "));

  // A frozen tab reports working motion as broken. Fail loudly rather than
  // letting it look like a page defect.
  const vis = await evaluate(
    `JSON.stringify({ v: document.visibilityState, js: document.documentElement.classList.contains('js') })`
  );
  const vs = JSON.parse(vis);
  record(page, "tab is foregrounded (motion not throttled)", vs.v === "visible", vs.v);
  record(page, "motion system armed (html.js)", vs.js === true, String(vs.js));

  // Above-the-fold content must never wait for a scroll — the offer and the
  // form are up there.
  const heroVisible = await evaluate(`${HIDDEN_PROBE}(async () => {
    await new Promise(r => setTimeout(r, 1800)); // let the entrance finish
    return JSON.stringify(hiddenIn(document.querySelector('.hero, .status-banner')));
  })()`);
  const hv = JSON.parse(heroVisible);
  record(page, "hero content visible without scrolling", hv.stuck === 0,
    `${hv.stuck} hidden: ${hv.samples.join(", ")}`);

  // Scroll the whole page FIRST. Below-the-fold images are loading="lazy", so
  // asserting on them before a scroll measures the test's impatience rather
  // than the page. The same pass is what drives the observers.
  const revealed = await evaluate(`${HIDDEN_PROBE}(async () => {
    const step = innerHeight * 0.7;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      scrollTo(0, y); await new Promise(r => setTimeout(r, 110));
    }
    scrollTo(0, document.body.scrollHeight);
    await new Promise(r => setTimeout(r, 1400));
    const res = hiddenIn(document);
    scrollTo(0, 0);
    await new Promise(r => setTimeout(r, 400));
    return JSON.stringify(res);
  })()`);
  const rv = JSON.parse(revealed);
  record(page, `no animated element left hidden (${rv.total} animated)`, rv.stuck === 0,
    `${rv.stuck} stuck: ${rv.samples.join(", ")}`);

  const imgs = await evaluate(`(async () => {
    await Promise.all([...document.images].map(i => i.complete ? null : i.decode().catch(() => null)));
    return JSON.stringify(
      [...document.images].map(i => ({ src: i.getAttribute('src'), ok: i.complete && i.naturalWidth > 0 }))
    );
  })()`);
  const broken = JSON.parse(imgs).filter((i) => !i.ok);
  record(page, `all ${JSON.parse(imgs).length} images render`, broken.length === 0,
    broken.map((b) => b.src).join(", "));

  const fonts = await evaluate(`(async () => {
    await document.fonts.ready;
    const h1 = document.querySelector('h1');
    return h1 ? getComputedStyle(h1).fontFamily : '';
  })()`);
  record(page, "display font applied", /Outfit/i.test(fonts || ""), fonts);

  // Call tracking is PER PAGE. Each page must show exactly one number, and it
  // must be that page's own tracking number — unifying them would destroy
  // per-campaign call attribution.
  const phones = await evaluate(`JSON.stringify({
    hrefs: [...new Set([...document.querySelectorAll('a[href^="tel:"]')].map(a => a.getAttribute('href')))],
    texts: [...new Set([...document.querySelectorAll('[data-phone-text]')].map(e => e.textContent.trim()))],
    key: document.body.getAttribute('data-page-key')
  })`);
  const p = JSON.parse(phones);
  const expected = EXPECTED_PHONE[page];
  record(page, "exactly one phone number on the page",
    p.hrefs.length === 1 && p.texts.length === 1, JSON.stringify(p));
  record(page, `page-specific tracking number (${expected.display})`,
    p.hrefs[0] === "tel:" + expected.e164 && p.texts[0] === expected.display,
    `${p.hrefs[0]} / ${p.texts[0]}`);
  record(page, "page key declared", p.key === page, p.key);

  const contrastish = await evaluate(`(() => {
    const b = getComputedStyle(document.body);
    return b.color + ' on ' + b.backgroundColor;
  })()`);
  record(page, "body colours resolve", !!contrastish, contrastish);
}

/* -------------------------------------------------------------- *
 * Motion must serve the offer, never bury it.
 * -------------------------------------------------------------- */
async function motionChecks(page, ctx) {
  const { evaluate } = ctx;

  // The price must animate to the exact published figure, not near it.
  if (EXPECTED_PRICE[page]) {
    const price = await evaluate(`(async () => {
      await new Promise(r => setTimeout(r, 2600));
      return (document.querySelector('.price-now') || {}).textContent || '';
    })()`);
    record(page, `price counts up to exactly ${EXPECTED_PRICE[page]}`,
      (price || "").trim() === EXPECTED_PRICE[page], price);
  }

  // Scroll progress must actually track scrolling.
  const prog = await evaluate(`(async () => {
    const bar = document.querySelector('.scroll-progress');
    if (!bar) return JSON.stringify({ ok: false, why: 'missing' });
    const at = () => new DOMMatrixReadOnly(getComputedStyle(bar).transform).a;
    scrollTo(0, 0); await new Promise(r => setTimeout(r, 250));
    const top = at();
    scrollTo(0, document.body.scrollHeight); await new Promise(r => setTimeout(r, 450));
    const bottom = at();
    scrollTo(0, 0); await new Promise(r => setTimeout(r, 250));
    return JSON.stringify({ ok: bottom > top + 0.5 && bottom > 0.9, top, bottom });
  })()`);
  const pr = JSON.parse(prog);
  record(page, "scroll progress tracks the page", pr.ok === true, prog);

  // At the very bottom of the page the offer, the phone and the form must all
  // still be one tap away.
  const reach = await evaluate(`(async () => {
    scrollTo(0, document.body.scrollHeight);
    await new Promise(r => setTimeout(r, 900));
    const rail = document.querySelector('.offer-rail');
    const railUp = rail && rail.classList.contains('is-up') &&
      getComputedStyle(rail).display !== 'none';
    const railBox = rail ? rail.getBoundingClientRect() : null;
    const onScreen = railBox && railBox.top >= 0 && railBox.bottom <= innerHeight + 1;
    const header = document.querySelector('.site-head');
    const headBox = header ? header.getBoundingClientRect() : null;
    const res = {
      railUp: !!railUp,
      railOnScreen: !!onScreen,
      railOffer: rail ? (rail.querySelector('.rail-offer') || {}).textContent || '' : '',
      railTel: rail ? ((rail.querySelector('a[href^="tel:"]') || {}).getAttribute
        ? rail.querySelector('a[href^="tel:"]').getAttribute('href') : '') : '',
      railBook: rail ? !!rail.querySelector('a[href="#book"]') : false,
      headerStuck: headBox ? headBox.top <= 1 : false,
      headerTel: !!document.querySelector('.site-head a[href^="tel:"]')
    };
    scrollTo(0, 0);
    await new Promise(r => setTimeout(r, 250));
    return JSON.stringify(res);
  })()`);
  const rc = JSON.parse(reach);

  if (page === "thank-you") {
    // No offer and no form here; the sticky header keeps the phone reachable.
    record(page, "phone reachable at full scroll depth",
      rc.headerStuck && rc.headerTel, JSON.stringify(rc));
  } else {
    record(page, "offer rail surfaces at depth", rc.railUp && rc.railOnScreen,
      JSON.stringify({ up: rc.railUp, onScreen: rc.railOnScreen }));
    record(page, "rail carries offer + tracking number + booking CTA",
      rc.railOffer.length > 10 &&
        rc.railTel === "tel:" + EXPECTED_PHONE[page].e164 &&
        rc.railBook === true,
      JSON.stringify({ offer: rc.railOffer.slice(0, 40), tel: rc.railTel, book: rc.railBook }));
  }
}

async function overflowCheck(page, ctx) {
  const { evaluate } = ctx;
  const res = await evaluate(`JSON.stringify({
    doc: document.documentElement.scrollWidth,
    win: window.innerWidth,
    culprits: [...document.querySelectorAll('body *')]
      .filter(el => el.getBoundingClientRect().right > window.innerWidth + 2)
      .slice(0, 6)
      .map(el => el.tagName.toLowerCase() + '.' + (el.className.toString().split(' ')[0] || ''))
  })`);
  const o = JSON.parse(res);
  record(page, "no horizontal overflow at 390px", o.doc <= o.win + 2,
    `scrollWidth ${o.doc} vs ${o.win}${o.culprits.length ? " — " + o.culprits.join(", ") : ""}`);
}

/* -------------------------------------------------------------- *
 * Lead-form interaction (the two landing pages)
 * -------------------------------------------------------------- */
async function formChecks(page, ctx) {
  const { evaluate } = ctx;

  const start = await evaluate(`JSON.stringify({
    panels: document.querySelectorAll('.step-panel').length,
    active: [...document.querySelectorAll('.step-panel')].findIndex(p => p.classList.contains('active')),
    submitDisabled: document.querySelector('[type=submit]').disabled
  })`);
  const s = JSON.parse(start);
  record(page, "form starts on step 1 with submit locked",
    s.panels === 2 && s.active === 0 && s.submitDisabled === true, start);

  // Step 1 -> step 2 via the intent question.
  const advanced = await evaluate(`(async () => {
    document.querySelector('.choice').click();
    await new Promise(r => setTimeout(r, 400));
    return JSON.stringify({
      active: [...document.querySelectorAll('.step-panel')].findIndex(p => p.classList.contains('active')),
      pressed: document.querySelector('.choice').getAttribute('aria-pressed'),
      bars: [...document.querySelectorAll('.progress span')].filter(b => b.classList.contains('on')).length
    });
  })()`);
  const a = JSON.parse(advanced);
  record(page, "intent choice advances to step 2",
    a.active === 1 && a.pressed === "true" && a.bars === 2, advanced);

  // Invalid input must surface an error and keep submit locked.
  const invalid = await evaluate(`(async () => {
    const f = document.querySelector('form[data-lead-form]');
    const set = (name, v) => {
      const el = f.elements[name];
      el.value = v;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('blur', { bubbles: true }));
    };
    set('full_name', 'A');
    set('email', 'not-an-email');
    set('phone', '123');
    await new Promise(r => setTimeout(r, 200));
    return JSON.stringify({
      errors: [...f.querySelectorAll('.err')].filter(e => e.textContent.trim()).length,
      invalidFields: f.querySelectorAll('.invalid').length,
      submitDisabled: f.querySelector('[type=submit]').disabled
    });
  })()`);
  const iv = JSON.parse(invalid);
  record(page, "invalid input blocks submit and shows errors",
    iv.errors >= 3 && iv.invalidFields >= 3 && iv.submitDisabled === true, invalid);

  // Valid input + consent must unlock submit; phone must auto-format.
  const valid = await evaluate(`(async () => {
    const f = document.querySelector('form[data-lead-form]');
    const set = (name, v) => {
      const el = f.elements[name];
      el.value = v;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('blur', { bubbles: true }));
    };
    set('full_name', 'Jordan Reyes');
    set('email', 'jordan@example.com');
    set('phone', '2815550100');
    const c = f.elements['consent'];
    c.checked = true;
    c.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(r => setTimeout(r, 200));
    return JSON.stringify({
      phoneFormatted: f.elements['phone'].value,
      errors: [...f.querySelectorAll('.err')].filter(e => e.textContent.trim()).length,
      submitDisabled: f.querySelector('[type=submit]').disabled
    });
  })()`);
  const v = JSON.parse(valid);
  record(page, "valid input unlocks submit", v.submitDisabled === false && v.errors === 0, valid);
  record(page, "phone auto-formats", v.phoneFormatted === "(281) 555-0100", v.phoneFormatted);

  // Submitting with no webhook configured must say so rather than fake success.
  const submitted = await evaluate(`(async () => {
    const f = document.querySelector('form[data-lead-form]');
    let captured = null;
    f.addEventListener('mpd:lead', e => { captured = e.detail; });
    f.querySelector('[type=submit]').click();
    await new Promise(r => setTimeout(r, 500));
    const msg = f.querySelector('.form-msg');
    return JSON.stringify({
      msg: msg.textContent.trim(),
      cls: msg.className,
      stillHere: location.href.indexOf('thank-you') === -1,
      payloadOffer: captured && captured.lp_offer,
      payloadGid: captured && captured.lp_asana_gid,
      payloadIntent: captured && captured.intent,
      payloadPhone: captured && captured.phone
    });
  })()`);
  const sub = JSON.parse(submitted);
  record(page, "unconfigured webhook reports honestly (no fake success)",
    /not yet connected/i.test(sub.msg) && /bad/.test(sub.cls) && sub.stillHere === true, sub.msg);
  record(page, "lead payload carries offer, Asana GID, intent, E.164 phone",
    !!sub.payloadOffer && !!sub.payloadGid && !!sub.payloadIntent &&
      sub.payloadPhone === "+12815550100",
    JSON.stringify({ offer: sub.payloadOffer, gid: sub.payloadGid, intent: sub.payloadIntent, phone: sub.payloadPhone }));
}

async function faqChecks(page, ctx) {
  const { evaluate } = ctx;
  const res = await evaluate(`(async () => {
    const d = document.querySelector('.faq details');
    const before = d.open;
    d.querySelector('summary').click();
    await new Promise(r => setTimeout(r, 300));
    const h = d.querySelector('.answer').getBoundingClientRect().height;
    // Summary text must be a single flex item, else <sup> marks split the line.
    const kids = [...d.querySelector('summary').childNodes]
      .filter(n => n.nodeType === 1 || (n.textContent || '').trim()).length;
    return JSON.stringify({ before, after: d.open, answerHeight: h, summaryChildren: kids });
  })()`);
  const f = JSON.parse(res);
  record(page, "FAQ accordion opens and reveals answer",
    f.before === false && f.after === true && f.answerHeight > 10, res);
  record(page, "FAQ summary is a single flex item (no split words)",
    f.summaryChildren === 1, `children: ${f.summaryChildren}`);
}

async function thankYouChecks(page, ctx) {
  const { evaluate } = ctx;
  const res = await evaluate(`JSON.stringify({
    sections: [...document.querySelectorAll('main > section')].length,
    banner: !!document.querySelector('.status-banner h1'),
    callBox: !!document.querySelector('.call-box .big-number'),
    steps: document.querySelectorAll('.steps .step').length,
    map: !!document.querySelector('.map-frame iframe'),
    mapTitled: (document.querySelector('.map-frame iframe')||{}).title || '',
    openState: (document.querySelector('[data-open-state]')||{}).textContent || '',
    received: (document.querySelector('[data-received-line]')||{}).textContent || '',
    noindex: (document.querySelector('meta[name=robots]')||{}).content || ''
  })`);
  const t = JSON.parse(res);
  record(page, "four spec sections present", t.sections === 4, `found ${t.sections}`);
  record(page, "1. status banner", t.banner);
  record(page, "2. fast-track call box", t.callBox);
  record(page, "3. three-step timeline", t.steps === 3, `${t.steps} steps`);
  record(page, "4. location map (titled for a11y)", t.map && t.mapTitled.length > 10);
  record(page, "open/closed state computed", !/Checking/.test(t.openState), t.openState);
  record(page, "received timestamp rendered", /Received/.test(t.received), t.received);
  record(page, "noindex set", /noindex/.test(t.noindex), t.noindex);
}

/* -------------------------------------------------------------- *
 * Run
 * -------------------------------------------------------------- */
for (const page of targets) {
  console.log(`\n=== ${page} — desktop 1440 ===`);
  await withPage(fileUrl(page), async (ctx) => {
    await commonChecks(page, ctx);
    await motionChecks(page, ctx);
    if (page !== "thank-you") {
      await formChecks(page, ctx);
      if (page === "invisalign") await faqChecks(page, ctx);
    } else {
      await thankYouChecks(page, ctx);
    }
  });

  console.log(`--- ${page} — mobile 390 ---`);
  await withPage(
    fileUrl(page),
    async (ctx) => {
      await overflowCheck(page, ctx);
      const stickyVisible = await ctx.evaluate(`(() => {
        const b = document.querySelector('.sticky-bar');
        if (!b) return 'none';
        return getComputedStyle(b).display;
      })()`);
      if (page !== "thank-you") {
        record(page, "sticky action bar shows on mobile", stickyVisible === "flex", stickyVisible);
      }
    },
    { width: 390, height: 844 }
  );

  // The thank-you page is shared by both landing pages, so it carries the
  // originating campaign's number through ?src= rather than showing a generic
  // one and losing the attribution at the last step.
  if (page === "thank-you") {
    console.log(`--- ${page} — inherits campaign number via ?src= ---`);
    for (const src of ["invisalign", "new-patient-special"]) {
      await withPage(fileUrl(page) + "?src=" + src, async ({ evaluate }) => {
        const got = await evaluate(
          `JSON.stringify({
            href: (document.querySelector('a[href^="tel:"]')||{}).getAttribute ? document.querySelector('a[href^="tel:"]').getAttribute('href') : '',
            text: (document.querySelector('[data-phone-text]')||{}).textContent || ''
          })`
        );
        const g = JSON.parse(got);
        const want = EXPECTED_PHONE[src];
        record(page, `?src=${src} shows ${want.display}`,
          g.href === "tel:" + want.e164 && g.text.trim() === want.display, got);
      });
    }
    // An unknown or spoofed src must not inject an arbitrary number.
    await withPage(fileUrl(page) + "?src=evil", async ({ evaluate }) => {
      const got = await evaluate(
        `(document.querySelector('[data-phone-text]')||{}).textContent || ''`
      );
      record(page, "unknown ?src falls back to the public number",
        (got || "").trim() === PUBLIC.display, got);
    });
  }

  console.log(`--- ${page} — reduced motion ---`);
  await withPage(
    fileUrl(page),
    async (ctx) => {
      const res = await ctx.evaluate(`${HIDDEN_PROBE}(async () => {
        await new Promise(r => setTimeout(r, 700));
        const step = innerHeight * 0.9;
        for (let y = 0; y < document.body.scrollHeight; y += step) {
          scrollTo(0, y); await new Promise(r => setTimeout(r, 60));
        }
        scrollTo(0, document.body.scrollHeight);
        await new Promise(r => setTimeout(r, 500));
        const h = hiddenIn(document);
        const hero = document.querySelector('.hero');
        const drift = hero ? getComputedStyle(hero, '::before').animationName : 'none';
        const moving = [].slice.call(document.querySelectorAll('[data-anim]'))
          .filter(function (e) { return parseFloat(getComputedStyle(e).transitionDuration) > 0.05; })
          .length;
        return JSON.stringify({
          total: h.total, stuck: h.stuck, samples: h.samples, drift, moving
        });
      })()`);
      const r = JSON.parse(res);
      // Reduced motion must remove the motion, not the content.
      record(page, `content fully visible without motion (${r.total} animated)`,
        r.stuck === 0, `${r.stuck} stuck: ${r.samples.join(", ")}`);
      record(page, "motion actually disabled, not just shortened",
        r.moving === 0 && (r.drift === "none" || !r.drift),
        `transitions:${r.moving} drift:${r.drift}`);
    },
    { reduced: true }
  );
}

console.log(`\n${checks - failures}/${checks} checks passed`);
process.exit(failures ? 1 : 0);
