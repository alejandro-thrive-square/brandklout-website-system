/**
 * gen_install_blocks.mjs — compose the SITE-level shared layer for the
 * pasteable-components build and wrap it in copy pages.
 *
 * Head  (Site Settings -> Custom Code -> Head, must be < 10,000 chars):
 *   fonts link -> fluid root -> body base -> <=478 reading tier (union of the
 *   three pages' head-tier.json) -> 1439 display rung -> runtime-state rules
 *   -> reduced-motion -> GSAP 3.13 CDN tags -> minified MPD bootstrap.
 *   The bootstrap MUST be in the head: section embeds call MPD.add mid-parse.
 *
 * Footer (Site Settings -> Custom Code -> Footer, < 10,000 chars):
 *   minified mpd-flush.js — registerPlugin + conversion layer + the
 *   selector-driven kit + buildJourney. There is deliberately NO
 *   ScrollSmoother (see mpd-flush.js header; do not add one).
 *
 * Install at SITE level only, exactly once. The state rules are curated here;
 * the script ASSERTS they cover every rule the converter's
 * webflow-runtime-states.css files carry, so a future design edit that adds a
 * new runtime state fails this build loudly instead of shipping a dead toggle.
 *
 * Usage: node gen_install_blocks.mjs   (from 07-webflow-build; reads .tmp/pc)
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const PC = ".tmp/pc";
const PAGES = ["invisalign", "new-patient-special", "thank-you"];
const DESIGN = "../04-design/.tmp/shared";

const FONT_LINKS = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..500&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">`;

// Verbatim house fluid root (webzite-house-v1), as installed and verified on
// this site — the style panel cannot parse calc()/clamp(), so it lives here.
const FLUID_ROOT = `:root{--font-from:18;--font-to:20;--vw-from:calc(1920 / 100);--vw-to:calc(2400 / 100);--coefficient:calc((var(--font-to) - var(--font-from)) / (var(--vw-to) - var(--vw-from)));--base:calc((var(--font-from) - var(--vw-from) * var(--coefficient)) / 16)}
html{font-size:calc(var(--base) * 1rem + var(--coefficient) * 1vw)}
@media screen and (max-width:1920px){:root{--font-from:16;--font-to:18;--vw-from:calc(1440 / 100);--vw-to:calc(1920 / 100)}}
@media screen and (max-width:1440px){:root{--font-from:16;--font-to:16;--vw-from:calc(479 / 100);--vw-to:calc(1440 / 100)}}
@media screen and (max-width:479px){:root{--font-from:12;--font-to:16;--vw-from:calc(320 / 100);--vw-to:calc(479 / 100)}}
html{-webkit-text-size-adjust:100%}
body{margin:0;overflow-x:clip;font-size:1.125rem;line-height:1.65}
body.is-locked{overflow:hidden}
@media (max-width:859px){body{padding-bottom:var(--bar-h)}}`;

// Runtime state + JS-written custom properties. Ancestor-scoped and attribute
// selectors Webflow classes cannot express; var() consumers the resolver froze
// at their fallback (--strike/--fill/--mx/--my are written by the runtime).
const STATE_RULES = `.mpd-armed [data-anim="hide"]{visibility:hidden}
.mpd-ready [data-anim="hide"]{visibility:visible}
.mpd-line{will-change:transform}
.site-head.is-solid.is-solid{background:rgba(255,255,255,.95);border-bottom-color:rgba(32,36,42,0.12);box-shadow:0 10px 30px -24px rgba(32,36,42,0.5)}
.site-head.is-solid .wrap{padding-block:.6rem}
.offer-rail.is-up.is-up{transform:translate(-50%,0);opacity:1}
.faq details.is-open .answer-wrap{grid-template-rows:1fr}
.btn .btn-before{background:radial-gradient(140px circle at var(--mx, 50%) var(--my, 50%),rgba(255,255,255,0.22),transparent 62%)}
.price-was .price-was-after{transform:scaleX(var(--strike, 1))}
.step .step-before{transform:scaleX(var(--fill, 0))}
.ch-inclusion .ledger-steps span.on{color:#007E9B;font-weight:700}
.ch-hesitation .hes-statement .mpd-word.mpd-word.mpd-word{color:rgba(32, 36, 42, 0.19)}
.ch-catch .catch-statement .mpd-word.mpd-word.mpd-word{color:rgba(32, 36, 42, 0.19)}
.ch-fasttrack .open-dot.is-open.is-open.is-open{background:#3f9e63;box-shadow:0 0 0 3px rgba(63, 158, 99, 0.18)}
.ch-find .hours-list li.is-today.is-today.is-today{background:#E8F6FA;color:#26292F;font-weight:600}`;

const REDUCED = `@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important}[data-anim="hide"]{visibility:visible!important}.offer-rail{opacity:1;transform:translate(-50%,0)}.head-progress i{transform:scaleX(0)}}`;

const GSAP = ["gsap", "ScrollTrigger", "ScrollToPlugin", "SplitText"]
  .map((p) => `<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/${p}.min.js"></script>`)
  .join("\n");

// ---- reading tier + 1439 rung: union across the three pages --------------
const TIER_ORDER = ["eyebrow", "small", "ui", "body", "lead"];
const tierSel = {}; const tierVal = {};
const rungSel = {}; const rungVal = {};
for (const pg of PAGES) {
  const ht = JSON.parse(fs.readFileSync(path.join(PC, pg, "head-tier.json"), "utf8"));
  for (const [tok, { value, selectors }] of Object.entries(ht.tier478)) {
    if (tierVal[tok] && tierVal[tok] !== value) throw new Error(`tier value drift for ${tok}`);
    tierVal[tok] = value;
    (tierSel[tok] ||= new Set()); selectors.forEach((s) => tierSel[tok].add(s));
  }
  for (const [tok, { value, selectors }] of Object.entries(ht.rung1439)) {
    if (rungVal[tok] && rungVal[tok] !== value) throw new Error(`rung value drift for ${tok}`);
    rungVal[tok] = value;
    (rungSel[tok] ||= new Set()); selectors.forEach((s) => rungSel[tok].add(s));
  }
}
// Order-independence: Webflow's published stylesheet and the head slot have
// no guaranteed order (the paste simulator models stylesheet-after-head), so
// every tier/rung selector is boosted one class level — it must win on
// SPECIFICITY, not on source order. The 1439 rung is band-bounded to
// (min-width:992px) so the boost can never override the real medium/small
// breakpoint variants that carry the 991/767 rungs.
const boost = (sel) => {
  const last = sel.match(/\.[\w-]+$/);
  return last ? sel + last[0] : sel;
};
const tierRules = TIER_ORDER
  .filter((t) => tierSel[t]?.size)
  .map((t) => `${[...tierSel[t]].sort().map(boost).join(",")}{font-size:${tierVal[t]}}`)
  .join("\n");
// .form-card .field input: the form embed's own <=478 rule outranks the site
// head at equal specificity (it sits later in the document) — outrank it back.
// .btn--lg rides at triple specificity: its payload emission is a 3-class stack.
const TIER = `@media (max-width:478px){body{font-size:1.31rem}
${tierRules}
.btn--lg.btn--lg.btn--lg{font-size:1.2rem}
.form-card .field input{font-size:1.31rem}}`;

const rungRules = Object.keys(rungVal)
  .map((t) => `${[...rungSel[t]].sort().map(boost).join(",")}{font-size:${rungVal[t]}}`)
  .join("\n");
const RUNG = `@media (min-width:992px) and (max-width:1439px){${rungRules}}`;

// ---- coverage assertion against the converter's runtime-state output ------
for (const pg of PAGES) {
  const css = fs.readFileSync(path.join(PC, pg, "webflow-runtime-states.css"), "utf8");
  for (const line of css.split("\n")) {
    const m = line.match(/^([^@{]+)\{/);
    if (!m) continue;
    // normalize the converter's specificity boosts (.x.x.x -> .x) for lookup
    const key = m[1].trim().replace(/(\.[\w-]+)(\1)+/g, "$1");
    const mine = STATE_RULES.replace(/(\.[\w-]+)(\1)+/g, "$1");
    if (!mine.includes(key)) {
      throw new Error(`${pg}: converter emitted a runtime-state rule this head does not carry: ${key}`);
    }
  }
}

// ---- minify the two runtime files -----------------------------------------
function minify(file) {
  return execSync(`npx --no-install terser "${file}" --compress --mangle`, {
    encoding: "utf8", maxBuffer: 4 * 1024 * 1024,
  }).trim();
}
const bootstrap = minify(path.join(DESIGN, "mpd.js"));
const flush = minify(path.join(DESIGN, "mpd-flush.js"));

const HEAD = `${FONT_LINKS}
<style>
${FLUID_ROOT}
${TIER}
${RUNG}
${STATE_RULES}
${REDUCED}
</style>
${GSAP}
<script>${bootstrap}
window.MPD.THANK_YOU_URL="/thank-you";</script>`;

const FOOTER = `<script>${flush}</script>`;

// ---- copy pages (textarea holder: head/footer contain literal <script>) ---
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function copyPage(title, content) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font:14px system-ui;margin:2rem;max-width:760px}button{font-size:1.05rem;padding:.8rem 1.4rem;background:#1463ff;color:#fff;border:0;border-radius:.4rem;cursor:pointer}.ok{color:#0a7d28;font-weight:600;margin-left:1rem}textarea{width:100%;height:320px;font:12px monospace;margin-top:1rem}</style>
</head><body>
<h2>${title} — ${content.length} chars (slot limit 10,000)</h2>
<p><button id="b">Copy</button><span id="s"></span></p>
<textarea id="d" readonly>${esc(content)}</textarea>
<script>
const t=document.getElementById('d').value;
document.getElementById('b').addEventListener('click',()=>{
  const h=ev=>{ev.preventDefault();ev.clipboardData.setData('text/plain',t);};
  document.addEventListener('copy',h);
  const ok=document.execCommand('copy');
  document.removeEventListener('copy',h);
  const s=document.getElementById('s');
  s.textContent= ok ? '\\u2713 Copied '+t.length+' chars' : 'Copy failed';
  s.className= ok ? 'ok':'';
});
</script></body></html>`;
}

fs.writeFileSync(path.join(PC, "site-head.content.html"), HEAD);
fs.writeFileSync(path.join(PC, "site-footer.content.html"), FOOTER);
fs.writeFileSync(path.join(PC, "install-head.html"), copyPage("Mason Park — SITE HEAD custom code", HEAD));
fs.writeFileSync(path.join(PC, "install-footer.html"), copyPage("Mason Park — SITE FOOTER custom code", FOOTER));

for (const [name, s] of [["head", HEAD], ["footer", FOOTER]]) {
  const ok = s.length < 10000 ? "OK" : "OVER THE 10k SLOT LIMIT";
  console.log(`site ${name}: ${s.length} chars — ${ok}`);
  if (s.length >= 10000) process.exitCode = 1;
}
