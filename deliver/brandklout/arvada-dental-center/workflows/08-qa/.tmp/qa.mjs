// Functional QA for the Arvada landing pages.
//
// Screenshots cannot see any of this: the stepped qualifier, form validation,
// the FAQ accordion, the live open/closed pill, or whether reduced-motion
// actually reveals the content. This drives each page over CDP and asserts.
//
// Usage: node qa.mjs
// Asana parent task: 1217040406855586
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const design = path.resolve(here, "../../04-design/.tmp");

const PAGES = [
  { slug: "implants", quiz: true, steps: 4, form: "#consult form", offer: false },
  { slug: "aox", quiz: true, steps: 4, form: "#consult form", offer: false },
  { slug: "veneers", quiz: false, form: "#evaluation form", offer: true },
  { slug: "emergency", quiz: false, form: "#callback form", offer: false },
  { slug: "dentist-near-me", quiz: false, form: "#book form", offer: true },
  { slug: "next-door", quiz: false, form: "#book form", offer: true },
];

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9600 + Math.floor(Math.random() * 300);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-qa-"));
const chrome = spawn(CHROME, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  `--remote-debugging-port=${PORT}`,
  "--remote-allow-origins=*",
  "--window-size=1440,1000",
  "--no-first-run",
  "--no-default-browser-check",
  `--user-data-dir=${profile}`,
  "about:blank",
]);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function getJSON(p) {
  return new Promise((resolve, reject) => {
    http
      .get({ host: "127.0.0.1", port: PORT, path: p }, (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => resolve(JSON.parse(d)));
      })
      .on("error", reject);
  });
}
let wsUrl;
for (let i = 0; i < 40 && !wsUrl; i++) {
  try { wsUrl = (await getJSON("/json/version")).webSocketDebuggerUrl; } catch {}
  if (!wsUrl) await wait(200);
}
const ws = new WebSocket(wsUrl);
let id = 0;
const pending = new Map();
let consoleErrors = [];
ws.addEventListener("message", (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result ?? m.error); pending.delete(m.id); return; }
  if (m.method === "Runtime.exceptionThrown")
    consoleErrors.push(m.params.exceptionDetails?.exception?.description?.split("\n")[0] || "exception");
  if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error")
    consoleErrors.push((m.params.args || []).map((a) => a.value ?? a.description).join(" "));
});
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
const send = (method, params = {}, sid) =>
  new Promise((resolve) => { const mid = ++id; pending.set(mid, resolve); ws.send(JSON.stringify({ id: mid, method, params, sessionId: sid })); });

const { targetInfos } = await send("Target.getTargets");
const t = targetInfos.find((x) => x.type === "page");
const { sessionId } = await send("Target.attachToTarget", { targetId: t.targetId, flatten: true });
await send("Page.enable", {}, sessionId);
await send("Runtime.enable", {}, sessionId);

const evaluate = async (expr) =>
  (await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }, sessionId))?.result?.value;

const results = [];
let failures = 0;
function check(page, name, ok, detail) {
  results.push({ page, name, ok: !!ok, detail: detail || "" });
  if (!ok) failures++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
}

async function setViewport(w, h = 900, mobile = false) {
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile }, sessionId);
}
async function load(slug, reduced = false) {
  consoleErrors = [];
  await send("Emulation.setEmulatedMedia",
    { features: reduced ? [{ name: "prefers-reduced-motion", value: "reduce" }] : [] }, sessionId);
  await send("Page.navigate", { url: pathToFileURL(path.join(design, slug, "index.html")).href }, sessionId);
  // Wait for the real readiness signal, not a guessed delay. brand.js sets
  // data-js="on" as the last thing boot() does, so this is the moment every
  // handler is bound. A fixed sleep here made the FAQ and action-bar checks
  // flaky on the heaviest page — the test clicked before the listener existed.
  let booted = false;
  for (let i = 0; i < 60; i++) {
    booted = (await evaluate("document.documentElement.getAttribute('data-js') === 'on'")) === true;
    if (booted) break;
    await wait(100);
  }
  if (!booted) console.log("  !! brand.js never booted within 6s");
  await evaluate("document.fonts ? document.fonts.ready.then(()=>1) : 1");
  await wait(150);
}

for (const p of PAGES) {
  console.log(`\n=== ${p.slug}`);
  await setViewport(1440);
  await load(p.slug);

  // Scroll first: below-the-fold images are loading="lazy", so checking image
  // integrity on a freshly-loaded page reports every one of them as broken.
  // Steps are 0.45vh / 220ms — roughly human. A faster sweep outruns
  // IntersectionObserver and under-reports reveals.
  await evaluate(`(async () => {
    const step = window.innerHeight * 0.45, h = document.body.scrollHeight;
    for (let y = 0; y < h + step; y += step) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 220)); }
    window.scrollTo(0, 0); await new Promise(r => setTimeout(r, 700));
  })()`);

  // ---- structure & integrity ----
  const base = await evaluate(`(() => {
    const imgs = [...document.querySelectorAll('img')];
    const decorative = imgs.filter(i => i.getAttribute('aria-hidden') === 'true');
    return {
      h1: document.querySelectorAll('h1').length,
      title: document.title,
      lang: document.documentElement.lang,
      gid: document.documentElement.getAttribute('data-asana-gid'),
      js: document.documentElement.getAttribute('data-js'),
      broken: imgs.filter(i => !i.complete || i.naturalWidth === 0).map(i => i.getAttribute('src')),
      missingAlt: imgs.filter(i => !i.hasAttribute('alt')).length,
      emptyAltNonDecorative: imgs.filter(i => i.getAttribute('alt') === '' && i.getAttribute('aria-hidden') !== 'true').length,
      decorative: decorative.length,
      unlabelledInputs: [...document.querySelectorAll('input:not([type=hidden]), select, textarea')]
        .filter(el => !el.id || !document.querySelector('label[for="' + el.id + '"]')).length,
      telLinks: [...new Set([...document.querySelectorAll('a[href^="tel:"]')].map(a => a.getAttribute('href')))],
      emptyHref: [...document.querySelectorAll('a[href="#"], a[href=""]')].length,
      skipLink: !!document.querySelector('a.skip'),
      loremish: /lorem ipsum|consectetur adipisicing|placeholder text/i.test(document.body.innerText)
    };
  })()`);

  check(p.slug, "single h1", base.h1 === 1, `found ${base.h1}`);
  check(p.slug, "lang + title set", base.lang === "en" && base.title.length > 20);
  check(p.slug, "Asana GID recorded", !!base.gid, base.gid || "missing");
  check(p.slug, "JS booted", base.js === "on");
  check(p.slug, "no broken images", base.broken.length === 0, base.broken.join(", "));
  check(p.slug, "all images have alt", base.missingAlt === 0, `${base.missingAlt} missing`);
  check(p.slug, "empty alt only on decorative", base.emptyAltNonDecorative === 0, `${base.emptyAltNonDecorative} bad`);
  check(p.slug, "every form control labelled", base.unlabelledInputs === 0, `${base.unlabelledInputs} unlabelled`);
  check(p.slug, "skip link present", base.skipLink);
  check(p.slug, "no dead '#' links", base.emptyHref === 0, `${base.emptyHref} found`);
  check(p.slug, "no placeholder copy", !base.loremish);
  check(p.slug, "phone is the main line only",
    base.telLinks.length === 1 && base.telLinks[0] === "tel:+13034217611", base.telLinks.join(", "));

  // ---- live open/closed status ----
  const status = await evaluate(`(() => {
    const el = document.querySelector('[data-status]');
    if (!el) return null;
    return { open: el.getAttribute('data-open'), text: el.querySelector('[data-status-text]')?.textContent || '' };
  })()`);
  check(p.slug, "status pill resolved",
    status && (status.open === "true" || status.open === "false") && /Open now|Opens at|Closed/.test(status.text),
    status ? `${status.open} · "${status.text}"` : "no pill");

  // ---- reveals fire on scroll (already scrolled above) ----
  const rev = await evaluate(`JSON.stringify({
    all: document.querySelectorAll('[data-reveal]').length,
    shown: document.querySelectorAll('[data-reveal].is-in').length
  })`);
  const rv = JSON.parse(rev);
  check(p.slug, "all reveals fire", rv.all === rv.shown, `${rv.shown}/${rv.all}`);

  // ---- FAQ accordion ----
  const faq = await evaluate(`(async () => {
    const btn = document.querySelector('.faq__q');
    if (!btn) return { skip: true };
    const panel = document.getElementById(btn.getAttribute('aria-controls'));
    // Poll for the height to settle rather than sleeping a fixed interval — the
    // grid-template-rows transition is 360ms but the first paint can lag on a
    // heavy page, and a fixed wait turned that into a false failure.
    const settle = async (want) => {
      for (let i = 0; i < 30; i++) {
        const h = panel.getBoundingClientRect().height;
        if (want === 'open' ? h > 10 : h < 1) return h;
        await new Promise(r => setTimeout(r, 60));
      }
      return panel.getBoundingClientRect().height;
    };
    const before = { exp: btn.getAttribute('aria-expanded'), open: panel.getAttribute('data-open'), h: panel.getBoundingClientRect().height };
    btn.click();
    const openH = await settle('open');
    const after = { exp: btn.getAttribute('aria-expanded'), open: panel.getAttribute('data-open'), h: openH };
    btn.click();
    const closeH = await settle('closed');
    const closed = { exp: btn.getAttribute('aria-expanded'), h: closeH };
    return { before, after, closed };
  })()`);
  if (faq && !faq.skip) {
    check(p.slug, "FAQ opens (aria + height)",
      faq.after.exp === "true" && faq.after.h > faq.before.h + 10, `h ${Math.round(faq.before.h)}→${Math.round(faq.after.h)}`);
    check(p.slug, "FAQ closes again",
      faq.closed.exp === "false" && faq.closed.h < faq.after.h - 10, `h → ${Math.round(faq.closed.h)}`);
  }

  // ---- stepped qualifier ----
  if (p.quiz) {
    const quiz = await evaluate(`(async () => {
      const q = document.querySelector('[data-quiz]');
      const steps = [...q.querySelectorAll('.quiz__step')];
      const done = q.querySelector('.quiz__done');
      const seen = [];
      for (let i = 0; i < steps.length; i++) {
        const active = steps.findIndex(s => s.getAttribute('data-active') === 'true');
        seen.push(active);
        const opt = steps[active].querySelector('.quiz__opt');
        opt.click();
        await new Promise(r => setTimeout(r, 380));
      }
      const answers = q.querySelector('[data-quiz-answers]');
      const ticks = [...q.querySelectorAll('.quiz__tick')].filter(t => t.getAttribute('data-done') === 'true').length;
      return {
        order: seen,
        reachedForm: done.getAttribute('data-active') === 'true',
        answers: answers ? answers.value : null,
        ticks
      };
    })()`);
    check(p.slug, "qualifier advances one step at a time",
      JSON.stringify(quiz.order) === JSON.stringify([...Array(p.steps).keys()]), `order ${quiz.order}`);
    check(p.slug, "qualifier reaches the form", quiz.reachedForm);
    const parsed = quiz.answers ? JSON.parse(quiz.answers) : {};
    check(p.slug, "qualifier answers captured",
      Object.keys(parsed).length === p.steps, `${Object.keys(parsed).length}/${p.steps}: ${quiz.answers}`);
    check(p.slug, "progress ticks fill", quiz.ticks >= p.steps, `${quiz.ticks} ticks`);

    // back button
    const back = await evaluate(`(async () => {
      const q = document.querySelector('[data-quiz]');
      const b = q.querySelector('.quiz__back');
      if (!b) return null;
      b.click(); await new Promise(r => setTimeout(r, 260));
      return [...q.querySelectorAll('.quiz__step')].findIndex(s => s.getAttribute('data-active') === 'true');
    })()`);
    check(p.slug, "qualifier back button works", back === p.steps - 1, `landed on step index ${back}`);
  }

  // ---- form validation blocks empty submit ----
  await load(p.slug);
  const invalid = await evaluate(`(async () => {
    const form = document.querySelector('${p.form}');
    ${p.quiz ? `
      const q = document.querySelector('[data-quiz]');
      const steps = [...q.querySelectorAll('.quiz__step')];
      for (let i = 0; i < steps.length; i++) {
        const a = steps.findIndex(s => s.getAttribute('data-active') === 'true');
        steps[a].querySelector('.quiz__opt').click();
        await new Promise(r => setTimeout(r, 330));
      }
    ` : ""}
    form.querySelector('[type=submit]').click();
    await new Promise(r => setTimeout(r, 400));
    return {
      stillThere: !!document.querySelector('${p.form}'),
      invalidFields: document.querySelectorAll('.field[data-invalid="true"]').length,
      errText: [...document.querySelectorAll('.field__err')].map(e => e.textContent).filter(Boolean).length,
      leaked: (window.__arvadaLeads || []).length
    };
  })()`);
  check(p.slug, "empty submit is blocked", invalid.stillThere && invalid.leaked === 0,
    `form present=${invalid.stillThere}, leads=${invalid.leaked}`);
  check(p.slug, "invalid fields flagged", invalid.invalidFields > 0 && invalid.errText > 0,
    `${invalid.invalidFields} flagged, ${invalid.errText} messages`);

  // ---- short phone is rejected ----
  const shortPhone = await evaluate(`(async () => {
    const form = document.querySelector('${p.form}');
    form.querySelector('input[name=name]').value = 'Test Patient';
    const ph = form.querySelector('input[name=phone]');
    ph.value = '12345';
    form.querySelector('[type=submit]').click();
    await new Promise(r => setTimeout(r, 350));
    return { stillThere: !!document.querySelector('${p.form}'), leads: (window.__arvadaLeads||[]).length };
  })()`);
  check(p.slug, "9-digit phone rejected", shortPhone.stillThere && shortPhone.leads === 0);

  // ---- valid submit confirms ----
  const valid = await evaluate(`(async () => {
    const form = document.querySelector('${p.form}');
    form.querySelector('input[name=name]').value = 'Test Patient';
    form.querySelector('input[name=phone]').value = '3035550147';
    const em = form.querySelector('input[name=email]'); if (em) em.value = 'test@example.com';
    form.querySelector('[type=submit]').click();
    await new Promise(r => setTimeout(r, 600));
    const leads = window.__arvadaLeads || [];
    return {
      gone: !document.querySelector('${p.form}'),
      thanks: !!document.querySelector('.form-done'),
      thanksHasPhone: !!document.querySelector('.form-done a[href^="tel:"]'),
      lead: leads[leads.length - 1] || null
    };
  })()`);
  check(p.slug, "valid submit shows confirmation", valid.gone && valid.thanks);
  check(p.slug, "confirmation offers the phone number", valid.thanksHasPhone);
  check(p.slug, "lead payload carries source + GID",
    valid.lead && valid.lead.source && valid.lead.asanaTaskGid && valid.lead.fields?.phone,
    valid.lead ? `${valid.lead.source} / ${valid.lead.asanaTaskGid}` : "no payload");

  // ---- offer block, where the page has one ----
  if (p.offer) {
    const offer = await evaluate(`(() => {
      const o = document.querySelector('[data-offer]');
      if (!o) return null;
      return { key: o.getAttribute('data-offer'), hasTerms: !!o.querySelector('.offer__terms'), text: o.innerText.slice(0,200) };
    })()`);
    check(p.slug, "offer block present and labelled", offer && offer.key, offer ? offer.key : "none");
    check(p.slug, "offer states its terms", offer && offer.hasTerms);
  }

  // ---- responsive: no horizontal overflow ----
  for (const w of [1440, 1024, 768, 390, 320]) {
    await setViewport(w, 900, w < 700);
    await wait(320);
    const of = await evaluate(
      "document.documentElement.scrollWidth - document.documentElement.clientWidth"
    );
    check(p.slug, `no h-overflow @${w}px`, of <= 0, of > 0 ? `${of}px` : "");
  }

  // ---- sticky action bar appears past the hero on mobile ----
  await setViewport(390, 800, true);
  await load(p.slug);
  const bar = await evaluate(`(async () => {
    const b = document.querySelector('.actionbar');
    if (!b) return null;
    const atTop = b.classList.contains('is-on');
    window.scrollTo(0, document.body.scrollHeight * 0.6);
    await new Promise(r => setTimeout(r, 700));
    return { atTop, scrolled: b.classList.contains('is-on'), tel: !!b.querySelector('a[href^="tel:"]') };
  })()`);
  check(p.slug, "mobile action bar hidden at top, shown after hero",
    bar && bar.atTop === false && bar.scrolled === true, bar ? `top=${bar.atTop} scrolled=${bar.scrolled}` : "none");
  check(p.slug, "action bar has a tap-to-call", bar && bar.tel);

  // ---- reduced motion: content must be visible without scrolling ----
  await setViewport(1440);
  await load(p.slug, true);
  const rm = await evaluate(`(() => {
    const all = [...document.querySelectorAll('[data-reveal]')];
    const hidden = all.filter(el => getComputedStyle(el).opacity === '0');
    return { all: all.length, hidden: hidden.length };
  })()`);
  check(p.slug, "reduced-motion reveals everything immediately",
    rm.hidden === 0, `${rm.hidden}/${rm.all} still hidden`);

  check(p.slug, "no console errors", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" | "));
}

// ---- cross-page content audit ----
console.log(`\n=== cross-page content audit`);
const FORBIDDEN = [
  { re: /open 24\/7|24 hours a day|always open|walk-?ins welcome/i, why: "practice is Mon-Fri 8-5 only" },
  { re: /guaranteed same-?day|same-?day guaranteed/i, why: "client says 'whenever possible', not guaranteed" },
  { re: /painless|no pain at all/i, why: "absolute clinical claim" },
  { re: /\b\d{1,3}% success\b/i, why: "unsourced success-rate statistic" },
  { re: /\(720\)\s*419-3699/, why: "tracking line — see Open Question 2" },
  { re: /\$14,999/, why: "the conflicting price variant" },
  // --- three fabrications Brandklout flagged in the source material, 2026-08-06.
  // These are not ours to inherit; each is a gap to raise, never a fact to copy forward.
  { re: /\b4[.,]8\b|\b931\b|\b1,?270\b|\b1,?000\+?\s*(?:reviews|patients)/i,
    why: "the aggregated 4.8 / 1,000+ review figure — an estimate, not a real number" },
  { re: /average rating|star rating|\b\d(?:\.\d)?\s*(?:out of|\/)\s*5\b|rated \d(?:\.\d)? stars/i,
    why: "an aggregate rating claim" },
  { re: /\bCareCredit\b|\bSunbit\b|\bPatientFi\b|\bLendingClub\b|\bProceed Finance\b|\bCherry\b/,
    why: "an unconfirmed named finance partner" },
  { re: /without affecting your credit( score)?|soft credit (check|pull)|no credit check/i,
    why: "a soft-pull credit claim that rides on the unconfirmed lender list" },
  { re: /before[- ]and[- ]after|before ?\/ ?after|\bsmile transformation photo/i,
    why: "before/after imagery — the client's are stock placeholders, not consented patient photos" },
  { re: /actual patient|real patient results?|patient photo/i,
    why: "presenting imagery as a real patient result" },
  // From the previous vendor's index_1.html (Asana attachment 1217133289235647). Its own
  // README admits the site says only "10+ lending partners" with no named brands, so these
  // monthly figures are unverified in the same way the lender names were.
  { re: /\$105\s*\/?\s*mo|\$185\s*\/?\s*mo|\$230\s*\/?\s*mo|\$105 per month|10\+ lending partners/i,
    why: "the vendor's unverified monthly financing figures" },
  { re: /images\.unsplash\.com|unsplash/i,
    why: "stock photography — the vendor used Unsplash images as fake before/after patient photos" },
];
for (const p of PAGES) {
  const html = fs.readFileSync(path.join(design, p.slug, "index.html"), "utf8");
  const body = html.replace(/<!--[\s\S]*?-->/g, ""); // ignore build notes
  for (const f of FORBIDDEN) {
    check(p.slug, `no "${f.why}"`, !f.re.test(body), f.re.test(body) ? String(body.match(f.re)) : "");
  }
}

// ---- commercial-terms guard ----
// Brandklout is a partner engagement, not a per-page client: sales/PRICING_TIMELINE_RULES.md
// does not apply anywhere under deliver/brandklout/, and no rate, quote or cost belongs in
// this folder. The dental practice's OWN patient-facing prices ($109 special, full-arch
// figure) are landing-page content and are expected — this checks for *our* commercial terms.
console.log(`\n=== commercial-terms guard`);
const OURS = /PRICING_TIMELINE_RULES|per-page rate|our (?:rate|fee)\b|we (?:charge|quote)\b|project (?:cost|fee)\b|day rate|\bretainer fee\b|\bdeposit of\b/i;
const docRoots = [
  path.resolve(here, "../../../docs"),
  path.resolve(here, ".."),
  path.resolve(here, "../../01-content-intake/.tmp"),
  path.resolve(here, "../../04-design/.tmp"),
];
function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      // Skip scraped third-party mirrors — those are the client's words, not ours.
      if (e.name === "client-site" || e.name === "reference-captures" || e.name === "assets") continue;
      walk(full, acc);
    } else if (/\.(md|html|css|js|mjs)$/.test(e.name)) acc.push(full);
  }
  return acc;
}
for (const f of [...new Set(docRoots.flatMap((d) => walk(d)))]) {
  const text = fs.readFileSync(f, "utf8");
  const hit = text.match(OURS);
  // An explicit statement that the rules do NOT apply is the point, not a violation.
  const isTheRuleItself =
    hit && /do(?:es)? \*?\*?not\*?\*? apply|out of scope|never for cost|not a per-page client/i.test(text);
  check("commercial", `no Webzite rate/quote in ${path.basename(f)}`, !hit || isTheRuleItself,
    hit && !isTheRuleItself ? hit[0] : "");
}

const summary = {
  ranAt: new Date().toISOString(),
  asanaTaskGid: "1217040406855586",
  total: results.length,
  passed: results.filter((r) => r.ok).length,
  failed: failures,
  failures: results.filter((r) => !r.ok),
};
fs.writeFileSync(path.join(here, "qa-results.json"), JSON.stringify(summary, null, 2));
console.log(`\n${summary.passed}/${summary.total} checks passed, ${failures} failed`);
if (failures) console.log(summary.failures.map((f) => `  ${f.page}: ${f.name} ${f.detail}`).join("\n"));

ws.close();
chrome.kill();
process.exit(failures ? 1 : 0);
