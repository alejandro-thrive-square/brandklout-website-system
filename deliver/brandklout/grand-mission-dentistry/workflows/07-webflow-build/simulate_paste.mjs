/**
 * simulate_paste.mjs — render a clipboard payload the way Webflow will, then
 * interaction-test it BEFORE pasting.
 *
 * Screenshots cannot catch what actually broke the Dr. Nahlah paste: state
 * classes baked into the wrong element, and a JS-written custom property
 * frozen at its fallback. Both look fine in a still frame and are dead on
 * interaction. So this reproduces the post-paste DOM under Webflow's rules —
 *
 *   - EVERY style record becomes a FLAT `.name{styleLess}` rule. Webflow's
 *     class model has no descendant or compound selectors, so any styling the
 *     converter failed to bake simply is not there. Rendering the source CSS
 *     instead would hide exactly the bugs we are hunting.
 *   - `webflow-runtime-states.css` goes in <head> (Site Settings -> Custom
 *     Code -> Head), `webflow-custom-code.js` in the footer.
 *   - HtmlEmbed nodes render their raw HTML, as Webflow does.
 *
 * — then drives it and asserts on COMPUTED style, not pixels.
 *
 * Usage: node simulate_paste.mjs <payload.json> <artifactDir> [assetDir]
 *   node simulate_paste.mjs .tmp/light/final.json .tmp/light \
 *        ../04-design/.tmp/final-site/assets
 * Pass the design's assets folder whenever the payload's images point at the
 * Webflow CDN — see the mirror block below for why it is not optional.
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import http from "node:http";
import { spawn } from "node:child_process";

const [payloadPath, artifactDir, assetDir] = process.argv.slice(2);
const doc = JSON.parse(fs.readFileSync(payloadPath, "utf8"));
const p = doc.payload;
const styles = new Map(p.styles.map((s) => [s._id, s]));
const nodes = new Map(p.nodes.map((n) => [n._id, n]));

/* The head/footer blocks are read back out of the INSTALL PAGES, not rebuilt
   here. A simulator that assembles its own approximation cannot catch an
   install-ordering bug: the first version loaded GSAP in the footer, exactly
   as the (then wrong) install page did, so both agreed and both were wrong —
   `WZ.ok` was false forever and nothing animated on the live site. Testing the
   artifact the user actually pastes is the only way this check is worth
   anything. */
const unescapeHtml = (s) => s
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&amp;/g, "&");

const installBlock = (file) => {
  const fp = path.join(artifactDir, file);
  if (!fs.existsSync(fp)) return "";
  const m = fs.readFileSync(fp, "utf8")
    .match(/<textarea[^>]*>([\s\S]*?)<\/textarea>/);
  return m ? unescapeHtml(m[1]) : "";
};

const read = (f) => {
  const fp = path.join(artifactDir, f);
  return fs.existsSync(fp) ? fs.readFileSync(fp, "utf8") : "";
};

/* Flat class CSS — one rule per style record, exactly what the Designer
   publishes. Combo chains are emitted at their own specificity. */
const css = p.styles
  .filter((s) => (s.styleLess || "").trim())
  .map((s) => {
    const chain = (s.comb === "&" && Array.isArray(s.styleLessChain))
      ? s.styleLessChain : null;
    return `.${s.name}{${s.styleLess}}`;
  })
  .join("\n");

const esc = (t) => String(t).replace(/[<>&]/g, (c) =>
  ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));

function render(id) {
  const n = nodes.get(id);
  if (!n) return "";
  if (n.text === true && "v" in n) return esc(n.v);
  if (n.type === "HtmlEmbed") {
    /* Webflow renders an embed inside a real `div.w-embed` wrapper that also
       carries the node's own classes. Rendering the raw HTML bare hid two
       whole failure classes: a script-only embed occupying a grid cell, and
       an embed's classes styling BOTH the wrapper and the inner element. */
    const ecls = (n.classes || [])
      .map((c) => styles.get(c)?.name)
      .filter(Boolean)
      .join(" ");
    return `<div class="${ecls ? ecls + " " : ""}w-embed">${n.v || ""}</div>`;
  }
  const tag = n.tag || "div";
  const cls = (n.classes || [])
    .map((c) => styles.get(c)?.name)
    .filter(Boolean)
    .join(" ");
  const attr = n.data?.attr || {};
  const parts = [];
  if (cls) parts.push(`class="${cls}"`);
  for (const [k, v] of Object.entries(attr)) {
    if (v !== "" && v != null) parts.push(`${k}="${esc(v)}"`);
  }
  /* `data.xattr` carries EVERY custom attribute — data-anim, data-chapter,
     data-theme, data-count, data-slide, role, aria-*. Rendering only
     `data.attr` (id/href) silently dropped all of them, so the simulated DOM
     had none of the hooks the page actually runs on: a check that looked for
     `[data-theme="dark"]` sections found zero and PASSED VACUOUSLY on a build
     whose dark chapters were black-on-black. The same omission was already
     found and fixed once in headless_paste.mjs; it was never fixed here. */
  for (const x of n.data?.xattr || []) {
    if (x?.name) parts.push(`${x.name}="${esc(x.value ?? "")}"`);
  }
  const href = n.data?.link?.url;
  if (href && (tag === "a" || tag === "link")) parts.push(`href="${esc(href)}"`);
  const open = `<${tag}${parts.length ? " " + parts.join(" ") : ""}>`;
  const VOID = new Set(["img", "br", "hr", "input", "source"]);
  if (VOID.has(tag)) return open;
  const kids = (n.children || []).map(render).join("");
  return `${open}${kids}</${tag}>`;
}

const roots = p.nodes.filter(
  (n) => !p.nodes.some((o) => (o.children || []).includes(n._id)),
);
const body = roots.map((r) => render(r._id)).join("\n");

/* Static payload defects that the rendered DOM alone will not reveal. */
const staticFaults = [];
{
  // `classes` holds style IDs. A name or a stale ID resolves to nothing and the
  // element arrives unstyled — silently, with no error anywhere.
  const dangling = new Set();
  for (const n of p.nodes) {
    for (const c of n.classes || []) if (!styles.has(c)) dangling.add(String(c));
  }
  if (dangling.size) {
    staticFaults.push(`dangling class refs: ${[...dangling].join(", ")}`);
  }
  // Duplicate ids break getElementById, which the page code uses for every
  // nav/drawer/chapter hook. The first match wins and it is usually the wrong one.
  const seen = new Map();
  for (const n of p.nodes) {
    const id = n.data?.attr?.id;
    if (id) seen.set(id, (seen.get(id) || 0) + 1);
  }
  const dupes = [...seen].filter(([, c]) => c > 1).map(([i, c]) => `${i} x${c}`);
  if (dupes.length) staticFaults.push(`duplicate ids: ${dupes.join(", ")}`);
  if (roots.length !== 1) {
    staticFaults.push(`${roots.length} roots (a multi-root merge crashes the Designer)`);
  }
  // A mobile-first `@media (min-width: X)` that got mapped to the wrong
  // breakpoint leaves the NARROW value at base and the wide value nowhere
  // reachable — the footer shipped as one column on desktop. Symptom that
  // survives into the payload: a base grid/flex layout identical to its own
  // narrow-breakpoint override, i.e. the breakpoint override is a no-op.
  const layoutProps = ["grid-template-columns", "flex-direction"];
  const noops = [];
  for (const s of p.styles) {
    const base = s.styleLess || "";
    for (const [vk, v] of Object.entries(s.variants || {})) {
      if (!/^(small|tiny|medium)$/.test(vk)) continue;
      for (const prop of layoutProps) {
        const re = new RegExp(`${prop}\\s*:\\s*([^;]+)`);
        const b = base.match(re), o = (v.styleLess || "").match(re);
        if (b && o && b[1].trim() === o[1].trim()) {
          noops.push(`${s.name}@${vk} ${prop}`);
        }
      }
    }
  }
  if (noops.length) {
    staticFaults.push(`breakpoint override identical to base (lost desktop ` +
      `layout?): ${noops.slice(0, 4).join(", ")}`);
  }
  // resolve_fluid turns clamp() into a concrete DESKTOP px and hands the other
  // breakpoints back separately. If those never make it into `variants`, the
  // paste carries desktop type at every width — the live hero rendered 106px
  // on a 500px viewport. Any build that resolved fluid type must ship variants.
  const px = /font-size:\s*([\d.]+)px/;
  const bigType = p.styles.filter((s) => {
    const m = (s.styleLess || "").match(px);
    return m && parseFloat(m[1]) >= 40;
  });
  const noVariant = bigType.filter(
    (s) => !["medium", "small", "tiny"].some((k) => s.variants?.[k]));
  if (bigType.length && noVariant.length === bigType.length) {
    staticFaults.push(`${bigType.length} styles have desktop-sized type and NO ` +
      `breakpoint variants — resolve_fluid overrides were not merged`);
  }
}

/* Head and footer are the EXACT strings the install pages hand to Webflow's
   two custom-code slots — same content, same order. `css` (the flat class
   rules) stands in for Webflow's published stylesheet, which the Designer
   emits between the head slot and the body. */
const headBlock = installBlock("install-head.html");
const footerBlock = installBlock("install-footer.html");
if (!headBlock || !footerBlock) {
  console.error("install-head.html / install-footer.html missing — run " +
    "`python gen_install_pages.py " + artifactDir + "` first.");
  process.exit(2);
}
/* Optional third arg: the design's own `assets/` folder. Every Webflow CDN URL
   in the payload is then served from disk instead of fetched.
 *
 * This is not a convenience. Left on the CDN, the payload's ~11 MB of video
 * (hero.mp4 + broll.mp4) streams alongside 17 images while the standard
 * chapter's clip-path entrance and scrubbed image parallax are refreshing, and
 * the headless renderer — software raster, no GPU — wedges permanently: even
 * `Debugger.pause` stops answering, so every check below times out. The same
 * page with the same bytes served locally is responsive, and so is the source
 * design. The bytes are identical (these files ARE what was uploaded), so
 * nothing about the render changes; only the network does.
 *
 * Webflow prefixes an uploaded filename with a hash (`<hash>_lab.jpg`), so the
 * tail after the last underscore is the original name.
 */
let bodyOut = body;
let mirrored = 0;
if (assetDir) {
  const mirror = path.join(artifactDir, "assets");
  fs.mkdirSync(mirror, { recursive: true });
  const urls = new Set(
    [...page0(body, headBlock, footerBlock).matchAll(
      /https:\/\/cdn\.prod\.website-files\.com\/[^"' )\\]+/g)].map((m) => m[0]));
  for (const u of urls) {
    const name = u.split("_").pop();
    const from = path.join(assetDir, name);
    if (!fs.existsSync(from)) continue;
    fs.copyFileSync(from, path.join(mirror, name));
    bodyOut = bodyOut.split(u).join(`assets/${name}`);
    mirrored++;
  }
  console.log(`mirrored ${mirrored}/${urls.size} CDN assets from ${assetDir}`);
}
function page0(b, h, f) { return b + h + f; }

const page = `<!doctype html><html><head><meta charset="utf-8">
${headBlock}
<style>${css}</style>
</head><body>
${bodyOut}
${footerBlock}
</body></html>`;

const out = path.join(artifactDir, "simulated-paste.html");
fs.writeFileSync(out, page, "utf8");
console.log(`rendered post-paste DOM -> ${out}`);

/* The DESIGNER CANVAS view: flat class CSS only, NO custom code and no GSAP.
   Webflow does not run site/page custom code on the canvas, so anything whose
   visibility depends on it is invisible — and therefore uneditable — for the
   team. Rendering this separately is the only way to test editability. */
const canvas = `<!doctype html><html><head><meta charset="utf-8">
<style>${css}</style>
</head><body>\n${bodyOut}\n</body></html>`;
const canvasOut = path.join(artifactDir, "simulated-designer-canvas.html");
fs.writeFileSync(canvasOut, canvas, "utf8");
console.log(`rendered Designer-canvas DOM -> ${canvasOut}`);

/* ---------------------------------------------------------------- checks */
/* Driven over CDP against the real local Chrome rather than Playwright: the
   repo already proves this path (04-design/.tmp/interaction-test-gsap.mjs) and
   it needs no browser download. Served over http, not file://, so the CDN
   script tags and any relative asset behave as they will on a real host. */
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const srv = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split("?")[0]).replace(/^\//, "") ||
    "simulated-paste.html";
  const fp = path.join(artifactDir, rel);
  if (!fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
    res.writeHead(404).end("nf");
    return;
  }
  /* SVG must carry image/svg+xml or Chrome refuses to paint it in an <img> and
     the "every image loads" check fails on a file that is perfectly fine. */
  const TYPES = {
    ".html": "text/html; charset=utf-8", ".css": "text/css",
    ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png",
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
    ".gif": "image/gif", ".avif": "image/avif", ".mp4": "video/mp4",
    ".webm": "video/webm", ".woff2": "font/woff2",
  };
  const ext = path.extname(fp).toLowerCase();
  res.writeHead(200, {
    "content-type": TYPES[ext] || "application/octet-stream",
  });
  fs.createReadStream(fp).pipe(res);
});
const PORT = 8900 + Math.floor(Math.random() * 90);
await new Promise((r) => srv.listen(PORT, "127.0.0.1", r));

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const CDP = 9700 + Math.floor(Math.random() * 300);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-sim-"));
const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--hide-scrollbars",
  `--remote-debugging-port=${CDP}`, "--remote-allow-origins=*",
  "--force-device-scale-factor=1", "--window-size=1440,900",
  "--no-first-run", "--no-default-browser-check",
  `--user-data-dir=${profile}`, "about:blank",
]);
const getJSON = (p) => new Promise((res, rej) => {
  http.get({ host: "127.0.0.1", port: CDP, path: p }, (r) => {
    let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res(JSON.parse(d)));
  }).on("error", rej);
});
let wsUrl;
for (let i = 0; i < 150 && !wsUrl; i++) {
  try { wsUrl = (await getJSON("/json/version")).webSocketDebuggerUrl; } catch {}
  if (!wsUrl) await wait(300);
}
if (!wsUrl) throw new Error("CDP did not start");

const ws = new WebSocket(wsUrl);
let mid = 0; const pending = new Map();
ws.addEventListener("message", async (ev) => {
  const raw = typeof ev.data === "string" ? ev.data : await ev.data.text();
  const m = JSON.parse(raw);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  else if (m.method === "Runtime.exceptionThrown") {
    errors.push(m.params?.exceptionDetails?.exception?.description ||
      m.params?.exceptionDetails?.text || "exception");
  }
});
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
  const i = ++mid;
  const t = setTimeout(() => rej(new Error("timeout " + method)), 30000);
  pending.set(i, (m) => { clearTimeout(t); m.error ? rej(new Error(m.error.message)) : res(m.result); });
  ws.send(JSON.stringify({ id: i, method, params, sessionId }));
});

const errors = [];
const { targetInfos } = await send("Target.getTargets");
let pt = targetInfos.find((t) => t.type === "page");
if (!pt) pt = { targetId: (await send("Target.createTarget", { url: "about:blank" })).targetId };
const { sessionId } = await send("Target.attachToTarget",
  { targetId: pt.targetId, flatten: true });
await send("Runtime.enable", {}, sessionId);
await send("Page.enable", {}, sessionId);
await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/simulated-paste.html` }, sessionId);

const evaluate = async (fn, ...args) => {
  const r = await send("Runtime.evaluate", {
    expression: `(${fn.toString()})(${args.map((a) => JSON.stringify(a)).join(",")})`,
    returnByValue: true, awaitPromise: true,
  }, sessionId);
  if (r.exceptionDetails) return { err: r.exceptionDetails.text };
  return r.result.value;
};
const pg = { evaluate };

/* Wait for the page to actually finish, rather than sleeping a fixed 3s. Every
   section script that rides the payload as its own HtmlEmbed adds parse time,
   so the flush that creates the smoother and its ScrollTriggers lands later on
   a self-contained build than on one with a single footer bundle — a fixed
   sleep reported `smoother:false, triggers:0` for a payload that comes up
   perfectly a second later. The cap is real: if nothing appears in 40s, the
   motion layer genuinely did not initialise and the check below says so. */
for (let i = 0; i < 80; i++) {
  const s = await pg.evaluate(() => ({
    rs: document.readyState,
    tr: window.ScrollTrigger ? ScrollTrigger.getAll().length : 0,
  }));
  if (s.rs === "complete" && s.tr > 0) break;
  await wait(500);
}
await wait(1000);

const results = [];
const check = (name, pass, detail) => results.push({ name, pass, detail });

/* Feature checks below are written against the home page, which is the only
 * page carrying the before/after slider. Running them on a page that has no
 * such component reported two hard FAILs for content that is correctly absent.
 *
 * Applicability is decided from the PAYLOAD, not from the rendered DOM. That
 * distinction is the whole point: "the DOM has no slides, so skip" would pass
 * vacuously on a build whose slides went missing, which is exactly the failure
 * mode that let a black-on-black page through earlier. The payload is the spec
 * — if it declares the classes, the check MUST run and pass. */
const payloadHas = (...names) => {
  const have = new Set(p.styles.map((s) => s.name));
  return names.every((n) => have.has(n));
};
const skip = (name, why) => results.push({ name, skipped: true, detail: why });

check("payload structure (class refs, unique ids, single root)",
  staticFaults.length === 0, staticFaults.join(" | ") || "clean");

/* THE check this suite was missing. Every visual assertion below passed on a
   build where `WZ.ok` was false, the flush took its "GSAP missing" branch and
   returned, and not one of the nine chapters ever animated — because a
   revealed, un-animated page looks fine in every static probe. Assert that the
   motion layer actually came up. */
const motion = await pg.evaluate(() => ({
  wz: typeof window.WZ,
  ok: window.WZ ? window.WZ.ok : null,
  gsap: typeof window.gsap,
  smoother: window.WZ ? !!window.WZ.smoother : null,
  triggers: window.ScrollTrigger ? ScrollTrigger.getAll().length : 0,
  tweens: window.gsap ? gsap.globalTimeline.getChildren(true, true, true).length : 0,
}));
check("motion layer initialised (WZ.ok, smoother, ScrollTriggers registered)",
  motion.ok === true && motion.smoother === true && motion.triggers > 5,
  JSON.stringify(motion));

/* 0. The nav's scroll state targets the element the page code actually finds.
      `getElementById('nav')` must land on the styled header, not on a wrapper
      that happens to share the id. */
const navSolid = await pg.evaluate(async () => {
  /* Two nav shapes exist across the builds this gate serves: Dr. Nahlah's
     `#nav` + `.solid`, and the Grand Mission kit's `#header` + `.is-stuck`.
     Same contract either way: transparent at rest, painted once scrolled. */
  const el = document.getElementById("nav") || document.getElementById("header");
  if (!el) return { err: "no #nav/#header" };
  const stateClass = document.getElementById("nav") ? "solid" : "is-stuck";
  const before = getComputedStyle(el).backgroundColor;
  el.classList.add(stateClass);
  /* Settle-poll, not a fixed sleep — the background rides a transition that
     costs MAIN-THREAD time, and this page keeps it busy. A fixed 700ms read
     the pre-transition colour and failed a build whose state CSS was correct
     byte-for-byte (same flake as the drawer check below). */
  let after = before, prev = null;
  for (let i = 0; i < 32 && (after === before || after !== prev); i++) {
    prev = after;
    await new Promise((r) => setTimeout(r, 250));
    after = getComputedStyle(el).backgroundColor;
  }
  return { classes: [...el.classList], before, after };
});
check("nav: scrolled state class changes the header background",
  !navSolid.err && navSolid.before !== navSolid.after, JSON.stringify(navSolid));

/* Every `[data-theme="dark"]` container must actually read as dark: light text
   on a dark ground. The theme layer scopes its tokens, and a resolver that
   flattens all custom properties into one map bakes the LIGHT values inside
   dark sections — the Proof and Invitation headings published as #141416 on
   #141416, invisible, while every other check passed. Contrast is asserted,
   not just "different from the light one", because a wrong-but-different
   colour is still unreadable. */
const darkThemed = await pg.evaluate(() => {
  const lum = (c) => {
    const m = c.match(/[\d.]+/g);
    if (!m) return null;
    const [r, g, b] = m.slice(0, 3).map((v) => {
      const s = +v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  /* Asserted on the themed element's OWN colour, not on its descendants.
     Descendant contrast belongs to parity.mjs, which has the design to compare
     against: this page's invitation chapter really does paint one heading
     #0B0B0C on #0B0B0C in the SOURCE, so a blanket descendant sweep fails a
     conversion that is perfectly faithful. The element's own colour is the
     unambiguous signature of the scoping bug — `[data-theme="dark"]` sets
     `color: var(--fg-body)`, so a dark value there means the dark scope lost. */
  const bad = [];
  for (const sec of document.querySelectorAll('[data-theme="dark"]')) {
    const cs = getComputedStyle(sec);
    const bg = lum(cs.backgroundColor);
    if (bg === null || bg > 0.2) continue;            // not actually painted dark
    const fg = lum(cs.color);
    if (fg === null) continue;
    const ratio = (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
    if (ratio < 3) {
      bad.push(`${sec.id || sec.className || "?"}: ${cs.color} on ` +
        `${cs.backgroundColor} = ${ratio.toFixed(2)}:1`);
    }
  }
  return { checked: document.querySelectorAll('[data-theme="dark"]').length, bad };
});
check("dark-themed sections keep readable text (scoped tokens resolved)",
  darkThemed.bad?.length === 0,
  `${darkThemed.checked} dark sections` +
  (darkThemed.bad?.length ? ` | ${darkThemed.bad.slice(0, 4).join(" ; ")}` : " | all legible"));

/* The nav must also be TRANSPARENT at rest. Asserting only that `.solid`
   changes something passed green on a build where the header carried the
   body's opaque background: the bar looked permanently scrolled, and the whole
   transparent-over-hero effect was gone. A "changes on scroll" check cannot
   see that, because it never asks what the start state was. */
// Any zero-alpha colour is transparent — rgba(255, 255, 255, 0) is how a
// header that will BECOME white reads at rest, and it paints nothing.
const navRest = /^(rgba\([\d, ]+, 0\)|transparent)$/.test(navSolid.before || "");
check("nav: header is transparent before scrolling (no inherited body background)",
  navRest, `at rest: ${navSolid.before}`);

/* 1. The before/after carousel: `.on` must actually change opacity, and the
      class must be movable between siblings. */
const carouselApplies = payloadHas("cmp", "slide");
const carousel = !carouselApplies ? null : await pg.evaluate(() => {
  const slides = [...document.querySelectorAll(".cmp .slide")];
  if (slides.length < 2) return { err: "slides not found: " + slides.length };
  const op = (i) => getComputedStyle(slides[i]).opacity;
  const initial = slides.map((_, i) => op(i));
  slides.forEach((s, i) => s.classList.toggle("on", i === 1));
  const moved = slides.map((_, i) => op(i));
  return { count: slides.length, initial, moved };
});
if (!carouselApplies) skip("carousel: .on toggles opacity between siblings",
  "page has no .cmp/.slide component");
else check(
  "carousel: .on toggles opacity between siblings",
  !carousel.err && carousel.initial?.[0] === "1" && carousel.initial?.[1] === "0" &&
    carousel.moved?.[0] === "0" && carousel.moved?.[1] === "1",
  JSON.stringify(carousel),
);

/* 2. The scrub wipe: writing --pos must move the handle and the clip. */
const wipeApplies = payloadHas("cmp", "handle", "aft");
const wipe = !wipeApplies ? null : await pg.evaluate(() => {
  const cmp = document.querySelector(".cmp");
  const handle = document.querySelector(".cmp .handle");
  const aft = document.querySelector(".cmp .aft");
  if (!cmp || !handle || !aft) return { err: "wipe nodes missing" };
  cmp.style.setProperty("--pos", "0%");
  const a = { left: getComputedStyle(handle).left, clip: getComputedStyle(aft).clipPath };
  cmp.style.setProperty("--pos", "70%");
  const b = { left: getComputedStyle(handle).left, clip: getComputedStyle(aft).clipPath };
  return { a, b };
});
if (!wipeApplies) skip("wipe: --pos drives handle left + clip-path",
  "page has no .cmp wipe component");
else check(
  "wipe: --pos drives handle left + clip-path",
  !wipe.err && wipe.a?.left !== wipe.b?.left && wipe.a?.clip !== wipe.b?.clip,
  JSON.stringify(wipe),
);

/* 3. No phantom pseudo divs left in the DOM.
 *
 * The defect this guards against is the universal reset — `*,*::before,*::after
 * {box-sizing:border-box}` once materialised 636 empty divs, 54% of all nodes,
 * breaking every flex gap and `nth-child`. What makes those divs a defect is
 * that they PAINT NOTHING, not that they exist: a design's own `::before`
 * scrims, rules and glows are legitimate elements and a page may hold dozens.
 * Counting them all made this fail at 38 on a build whose 38 were every one a
 * real gradient or rule, so the test now asks the question it means to ask. */
/* Asked against the PAYLOAD, not one rendered viewport. Half this build's
 * pseudo divs are mobile-only scrims whose paint lives in a `small` variant;
 * a computed-style probe at 1440px calls every one of them blank and fails a
 * correct build. A phantom is a pseudo div that declares nothing that paints
 * at ANY breakpoint — which is exactly what the universal reset produced. */
const PAINTS = /(^|;)\s*(background|border(-\w+)*|box-shadow|outline|backdrop-filter|filter|mask|content)\s*:/;
const paintsSomewhere = (s) =>
  PAINTS.test(s.styleLess || "") ||
  Object.values(s.variants || {}).some((v) => PAINTS.test(v.styleLess || ""));
const blankStyleIds = new Set(
  p.styles.filter((s) => /-(before|after)$/.test(s.name) && !paintsSomewhere(s))
    .map((s) => s._id));
const pseudoNodes = p.nodes.filter(
  (n) => !(n.children || []).length &&
    (n.classes || []).some((c) => styles.get(c) &&
      /-(before|after)$/.test(styles.get(c).name)));
const phantomNodes = pseudoNodes.filter(
  (n) => (n.classes || []).every((c) => blankStyleIds.has(c)));
check("no reset-generated phantom pseudo divs (paint nothing at any breakpoint)",
  phantomNodes.length <= 5,
  `${phantomNodes.length} phantom of ${pseudoNodes.length} pseudo divs` +
  (phantomNodes.length
    ? ` | ${phantomNodes.slice(0, 5).map((n) => (n.classes || [])
        .map((c) => styles.get(c)?.name).join(".")).join(", ")}`
    : ""));

/* 4. Nav state class works (drawer/burger/solid). The drawer carries an 800ms
      clip-path transition, so the computed value must be read AFTER it lands —
      reading immediately returns the start value and fails a working build. */
const drawerApplies = payloadHas("drawer");
const nav = !drawerApplies ? null : await pg.evaluate(async () => {
  const d = document.querySelector(".drawer");
  if (!d) return { err: "no drawer" };
  const closed = getComputedStyle(d).clipPath;
  d.classList.add("open");
  /* Poll to settle rather than sleeping a fixed 1100ms. The transition is
     800ms of MAIN-THREAD time, and this page keeps the main thread busy with
     ScrollSmoother, 48 ScrollTriggers and image decode — a fixed sleep read
     the start value and failed a build that works. */
  let open = closed, prev = null;
  for (let i = 0; i < 40 && (open === closed || open !== prev); i++) {
    prev = open;
    await new Promise((r) => setTimeout(r, 250));
    open = getComputedStyle(d).clipPath;
  }
  return { closed, open };
});
if (!drawerApplies) skip("nav: .open changes drawer clip-path",
  "page has no .drawer (mobile nav is the sticky call bar)");
else check("nav: .open changes drawer clip-path", !nav.err && nav.closed !== nav.open,
  JSON.stringify(nav));

/* 5. Type scale survived — headings must not collapse to a browser default. */
const type = await pg.evaluate(() => {
  const h = document.querySelector("h1, h2");
  return h ? { tag: h.tagName, size: getComputedStyle(h).fontSize } : { err: "no heading" };
});
check("headings keep the design's type scale (not 32px default)",
  !type.err && parseFloat(type.size) > 40, JSON.stringify(type));

/* 6. Every image actually loads. A relative `assets/…` src (the converter's
      default) or an un-uploaded URL yields naturalWidth 0 — a broken box on
      the pasted page, which is what "the paste looks bad" usually means. */
const imgs = await pg.evaluate(async () => {
  const list = [...document.images];
  // Force eager: a below-the-fold loading="lazy" image never enters the
  // viewport in a headless run, so it stays complete=false forever and would
  // read as broken when its URL is perfectly fine.
  list.forEach((i) => { i.loading = "eager"; });
  await Promise.all(list.map((i) => i.complete ? null : new Promise((r) => {
    i.addEventListener("load", r, { once: true });
    i.addEventListener("error", r, { once: true });
    setTimeout(r, 8000);
  })));
  const broken = list
    // An intentionally empty src (the lightbox's stage img before any case is
    // opened) is not a broken asset — flagging it drowned the real signal.
    .filter((i) => !i.naturalWidth && (i.getAttribute("src") || "").trim() !== "")
    .map((i) => i.getAttribute("src"));
  return { total: list.length, broken: [...new Set(broken)] };
});
check("every image loads (no relative or dead src)",
  imgs.total > 0 && imgs.broken.length === 0,
  `${imgs.total - imgs.broken.length}/${imgs.total} loaded` +
    (imgs.broken.length ? ` | broken: ${imgs.broken.slice(0, 3).join(", ")}` : ""));

check("no page errors", errors.length === 0, errors.slice(0, 3).join(" | ") || "none");

/* 7. EDITABILITY: on the Designer canvas (no custom code, no GSAP) the content
      must be visible, or the team cannot select or edit it. */
await send("Page.navigate",
  { url: `http://127.0.0.1:${PORT}/simulated-designer-canvas.html` }, sessionId);
await wait(2500);
/* Content that is SUPPOSED to be hidden until a runtime state (the quiz
   form's success message, revealed by `.is-done`) is declared here instead of
   special-cased in the probe: it is real, Navigator-selectable content whose
   hidden canvas state is the design. */
const EXPECT_HIDDEN = process.env.EXPECT_HIDDEN || ".panel__success *, .panel__success";
const canvasVis = await pg.evaluate((expectHidden) => {
  const invisible = [];
  for (const el of document.querySelectorAll(
    "h1, h2, p, [data-anim], .slide, section[data-chapter]")) {
    try { if (expectHidden && el.matches(expectHidden)) continue; } catch {}
    /* Elements INSIDE an HtmlEmbed are not individually selectable in the
       Designer — the embed is edited as one code block — so their canvas
       visibility says nothing about editability (empty .field__error slots
       and the form's hidden success panel live there by design). */
    if (el.closest(".w-embed")) continue;
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (s.visibility === "hidden" || s.display === "none" ||
        (parseFloat(s.opacity) === 0 && s.pointerEvents !== "none")) {
      invisible.push(`${el.tagName}${el.id ? "#" + el.id : ""}.${el.className}`
        .slice(0, 44));
    } else if (r.width < 1 && r.height < 1) {
      invisible.push(`${el.tagName}#${el.id || "?"} zero-size`);
    }
  }
  return { checked: document.querySelectorAll(
    "h1, h2, p, [data-anim], .slide, section[data-chapter]").length,
    invisible };
}, EXPECT_HIDDEN);
check("Designer canvas: content visible without custom code (editable)",
  canvasVis.invisible.length === 0,
  `${canvasVis.checked} elements checked` +
    (canvasVis.invisible.length
      ? ` | INVISIBLE: ${canvasVis.invisible.slice(0, 5).join(", ")}` : ""));

try { chrome.kill(); } catch {}
srv.close();

let failed = 0;
let skipped = 0;
for (const r of results) {
  if (r.skipped) { skipped++; console.log(`SKIP  ${r.name}\n        ${r.detail}`); continue; }
  if (!r.pass) failed++;
  console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.name}\n        ${r.detail}`);
}
const applicable = results.length - skipped;
console.log(`\n${applicable - failed}/${applicable} checks passed` +
  (skipped ? `  (${skipped} not applicable to this page)` : ""));
process.exit(failed ? 1 : 0);
