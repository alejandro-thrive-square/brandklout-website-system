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

async function withPage(url, fn, { reduced = false, width = 1440, height = 900 } = {}) {
  const PORT = 9500 + Math.floor(Math.random() * 400);
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
  await wait(3200);

  try {
    await fn({ evaluate, consoleErrors, send, sessionId });
  } finally {
    ws.close();
    chrome.kill();
  }
}

/* -------------------------------------------------------------- *
 * Checks shared by every page
 * -------------------------------------------------------------- */
async function commonChecks(page, ctx) {
  const { evaluate, consoleErrors } = ctx;

  record(page, "no uncaught JS errors", consoleErrors.length === 0, consoleErrors.join(" | "));

  // Scroll the whole page FIRST. Below-the-fold images are loading="lazy", so
  // asserting on them before a scroll measures the test's impatience rather
  // than the page. The same pass is what drives the reveal observers.
  const revealed = await evaluate(`(async () => {
    const step = innerHeight * 0.7;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      scrollTo(0, y); await new Promise(r => setTimeout(r, 90));
    }
    scrollTo(0, document.body.scrollHeight);
    await new Promise(r => setTimeout(r, 900));
    scrollTo(0, 0);
    await new Promise(r => setTimeout(r, 400));
    const all = [...document.querySelectorAll('.reveal')];
    return JSON.stringify({ total: all.length, shown: all.filter(e => e.classList.contains('in')).length });
  })()`);
  const rv = JSON.parse(revealed);
  record(page, `all ${rv.total} reveals fire`, rv.total === 0 || rv.shown === rv.total,
    `${rv.shown}/${rv.total}`);

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

  const phones = await evaluate(`JSON.stringify({
    hrefs: [...new Set([...document.querySelectorAll('a[href^="tel:"]')].map(a => a.getAttribute('href')))],
    texts: [...new Set([...document.querySelectorAll('[data-phone-text]')].map(e => e.textContent.trim()))]
  })`);
  const p = JSON.parse(phones);
  record(page, "phone number painted consistently",
    p.hrefs.length === 1 && p.texts.length === 1 && p.hrefs[0] === "tel:+12817698878",
    JSON.stringify(p));

  const contrastish = await evaluate(`(() => {
    const b = getComputedStyle(document.body);
    return b.color + ' on ' + b.backgroundColor;
  })()`);
  record(page, "body colours resolve", !!contrastish, contrastish);
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

  console.log(`--- ${page} — reduced motion ---`);
  await withPage(
    fileUrl(page),
    async (ctx) => {
      const res = await ctx.evaluate(`(async () => {
        await new Promise(r => setTimeout(r, 500));
        const all = [...document.querySelectorAll('.reveal')];
        const hidden = all.filter(e => getComputedStyle(e).opacity === '0').length;
        return JSON.stringify({ total: all.length, hidden });
      })()`);
      const r = JSON.parse(res);
      record(page, "content visible without motion", r.hidden === 0,
        `${r.hidden}/${r.total} stuck hidden`);
    },
    { reduced: true }
  );
}

console.log(`\n${checks - failures}/${checks} checks passed`);
process.exit(failures ? 1 : 0);
