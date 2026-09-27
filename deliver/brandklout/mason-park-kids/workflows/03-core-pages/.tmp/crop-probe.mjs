// ===========================================================================
// CROP PROBE - does a heading lose its glyphs to a mask?
//
//   node crop-probe.mjs ../home/index.html
//   node crop-probe.mjs https://mason-park-kids.up.railway.app/
//   node crop-probe.mjs ../home/index.html --shots     also write PNGs
//
// WHY. 2026-09-08, the client: "The titles crop." GSAP SplitText is asked for
// `{ type: "lines", mask: "lines" }` in journey.js, and a masked line is an
// extra <div> with `overflow: clip` sized to the LINE BOX. Fraunces is a
// display face with long descenders and a tall ascent; at a display size the
// ink of a `g`, `y`, `p` or an accent sits OUTSIDE the line box, so the mask
// cuts it. The cut survives the animation - it is not a start state, it is the
// wrapper's permanent height - so a PNG taken after the reveal still shows it.
//
// WHAT IT MEASURES. For every heading on the page it takes the union of the
// client rects of the text's own Range (the real ink box, which includes
// overshoot) and compares it against the padding box of the nearest ancestor
// that clips (overflow hidden/clip). Anything sticking out by more than
// TOLERANCE px is reported with the number of pixels lost on each edge.
//
// It runs with motion ON and scrolls the whole page first, so every reveal has
// finished and every wrapper has its final height.
// ===========================================================================
import { chromium } from "playwright-core";
import { settle } from "./settle.mjs";
import fs from "node:fs";
import path from "node:path";

const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith("--"));
if (!target) {
  console.error("usage: node crop-probe.mjs <path/to/index.html | url> [--shots] [--width N]");
  process.exit(1);
}
const wantShots = args.includes("--shots");
const width = args.includes("--width") ? Number(args[args.indexOf("--width") + 1]) : 1440;
const isUrl = /^https?:\/\//.test(target);
const url = isUrl ? target : "file:///" + path.resolve(target).split(path.sep).join("/");
const tag = isUrl
  ? (new URL(target).pathname.replace(/\//g, "-").replace(/^-|-$/g, "") || "home")
  : (path.basename(path.dirname(path.resolve(target))) === "home" ? "home" : path.basename(path.dirname(path.resolve(target))));

const TOLERANCE = 1.5;

const browser = await chromium.launch({ executablePath: CHROME, args: ["--allow-file-access-from-files"] });
const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: "load", timeout: 60000 });
await page.waitForTimeout(1200);
// The mask heights this probe measures are line boxes, and a line box in the
// font-swap window is the fallback's. See settle.mjs.
await settle(page);

// Scroll the whole page so every reveal fires and every mask reaches its
// final height, then come back to the top.
await page.evaluate(async () => {
  document.documentElement.style.scrollBehavior = "auto";
  const step = Math.round(window.innerHeight * 0.6);
  for (let y = 0; y < document.body.scrollHeight + window.innerHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 90));
  }
  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 400));
});
await page.waitForTimeout(600);

const findings = await page.evaluate((TOL) => {
  const out = [];
  // A mask can cut with `overflow` OR with `clip-path`, and site.css uses the
  // second precisely so the first is not doing it. A probe that only knew
  // about overflow would report the fix as "clean" whatever the clip-path
  // said, so parse the inset and treat it as the real edge.
  const insetOf = (cs) => {
    const m = /^inset\(([^)]*)\)/.exec(cs.clipPath || "");
    if (!m) return null;
    const n = m[1].trim().split(/\s+/).map(parseFloat).filter((v) => !Number.isNaN(v));
    if (!n.length) return null;
    const [t, r = t, b = t, l = r] = n; // CSS shorthand order
    return { top: t, right: r, bottom: b, left: l };
  };
  const clips = (cs) =>
    /hidden|clip|scroll|auto/.test(cs.overflowY) ||
    /hidden|clip|scroll|auto/.test(cs.overflowX) ||
    !!insetOf(cs);

  // The real ink box of a text node run: a Range's client rects include the
  // font's ascent and descent, which is what a mask actually cuts.
  function inkBox(el) {
    const r = document.createRange();
    r.selectNodeContents(el);
    const rects = Array.from(r.getClientRects()).filter((b) => b.width > 0 && b.height > 0);
    if (!rects.length) return null;
    let top = Infinity, bottom = -Infinity, left = Infinity, right = -Infinity;
    for (const b of rects) {
      top = Math.min(top, b.top); bottom = Math.max(bottom, b.bottom);
      left = Math.min(left, b.left); right = Math.max(right, b.right);
    }
    return { top, bottom, left, right };
  }

  const heads = Array.from(document.querySelectorAll("h1, h2, h3, .statement, [data-split], [data-write]"));
  for (const h of heads) {
    const hs = getComputedStyle(h);
    if (hs.display === "none" || hs.visibility === "hidden") continue;
    const text = (h.textContent || "").trim();
    if (!text) continue;

    // Measure the deepest text-carrying descendants (a split line, or the
    // element itself when it was never split).
    const lines = h.querySelectorAll(".jr-line, .jr-word");
    const units = lines.length ? Array.from(lines) : [h];

    for (const u of units) {
      const ink = inkBox(u);
      if (!ink) continue;
      // Walk up for every clipping ancestor, not only the first: a masked line
      // sits inside a wrapper which sits inside .ch { overflow: clip }.
      let node = u.parentElement;
      let depth = 0;
      // A pinned or scrubbed scene (the horizontal path) legitimately parks
      // its cards outside the clipper: that is the scene, not a crop. Any
      // transform on the way up marks the finding so it is not counted.
      let moved = false;
      while (node && depth < 8) {
        const cs = getComputedStyle(node);
        if (cs.transform && cs.transform !== "none") moved = true;
        if (clips(cs)) {
          const b = node.getBoundingClientRect();
          const ins = insetOf(cs);
          // With a clip-path the border box IS the reference box, and a
          // negative inset pushes the edge outwards.
          let padTop = b.top + parseFloat(cs.borderTopWidth || 0);
          let padBottom = b.bottom - parseFloat(cs.borderBottomWidth || 0);
          let padLeft = b.left + parseFloat(cs.borderLeftWidth || 0);
          let padRight = b.right - parseFloat(cs.borderRightWidth || 0);
          if (ins) {
            const ovf = /hidden|clip|scroll|auto/.test(cs.overflowY) || /hidden|clip|scroll|auto/.test(cs.overflowX);
            const ct = b.top + ins.top, cb = b.bottom - ins.bottom;
            const cl = b.left + ins.left, cr = b.right - ins.right;
            // Both clipping: the visible area is the intersection. Only the
            // clip-path clipping: it is the edge on its own.
            padTop = ovf ? Math.max(padTop, ct) : ct;
            padBottom = ovf ? Math.min(padBottom, cb) : cb;
            padLeft = ovf ? Math.max(padLeft, cl) : cl;
            padRight = ovf ? Math.min(padRight, cr) : cr;
          }
          const lostTop = padTop - ink.top;
          const lostBottom = ink.bottom - padBottom;
          const lostLeft = padLeft - ink.left;
          const lostRight = ink.right - padRight;
          const worst = Math.max(lostTop, lostBottom, lostLeft, lostRight);
          if (worst > TOL) {
            out.push({
              moved,
              tag: h.tagName.toLowerCase(),
              cls: h.className || "",
              id: h.id || (h.closest("[id]") ? h.closest("[id]").id : ""),
              text: text.slice(0, 70),
              clipper: node.tagName.toLowerCase() + (node.className ? "." + String(node.className).split(/\s+/).join(".") : ""),
              overflow: cs.overflow + " / " + cs.overflowY,
              lost: {
                top: +lostTop.toFixed(1), bottom: +lostBottom.toFixed(1),
                left: +lostLeft.toFixed(1), right: +lostRight.toFixed(1),
              },
              fontSize: hs.fontSize,
              lineHeight: hs.lineHeight,
              family: hs.fontFamily.split(",")[0].replace(/["']/g, ""),
              y: Math.round(ink.top + window.scrollY),
            });
          }
          break; // report the innermost clipper only; it is the one that cuts
        }
        node = node.parentElement;
        depth++;
      }
    }
  }
  // Collapse to one row per heading, worst line first.
  const seen = new Map();
  for (const f of out) {
    if (f.moved) continue;
    const k = f.text + "|" + f.clipper;
    const prev = seen.get(k);
    const worst = Math.max(f.lost.top, f.lost.bottom, f.lost.left, f.lost.right);
    if (!prev || worst > prev.worst) seen.set(k, { ...f, worst: +worst.toFixed(1) });
  }
  return Array.from(seen.values()).sort((a, b) => b.worst - a.worst);
}, TOLERANCE);

console.log(`\n${tag}  @${width}  ${url}`);
if (!findings.length) {
  console.log("  clean - no heading loses ink to a clipping ancestor");
} else {
  for (const f of findings) {
    console.log(
      `  CROP ${String(f.worst).padStart(6)}px  ${f.tag}${f.cls ? "." + String(f.cls).split(/\s+/)[0] : ""}  y=${f.y}` +
        `\n        "${f.text}"` +
        `\n        clipped by ${f.clipper}  (${f.overflow})  lost T${f.lost.top} B${f.lost.bottom} L${f.lost.left} R${f.lost.right}` +
        `\n        ${f.family} ${f.fontSize}/${f.lineHeight}`,
    );
  }
}

if (wantShots && findings.length) {
  const dir = path.resolve("shots/crop");
  fs.mkdirSync(dir, { recursive: true });
  let i = 0;
  for (const f of findings.slice(0, 8)) {
    i++;
    await page.evaluate((y) => window.scrollTo(0, Math.max(0, y - 220)), f.y);
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(dir, `${tag}-${width}-${String(i).padStart(2, "0")}.png`) });
  }
  console.log(`  ${i} shot(s) -> ${dir}`);
}

await browser.close();
process.exitCode = findings.length ? 1 : 0;
