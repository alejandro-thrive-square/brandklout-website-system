/**
 * gen_shared_install.mjs — build the SHARED page-level code layer for the
 * three Grand Mission landing pages (identical on all three, installed once
 * per page; the brief's rule — site-wide custom code is FORBIDDEN on this
 * 303-page production site).
 *
 *   HEAD   = 5 GSAP 3.13 CDN tags → WZ bootstrap → runtime-states CSS UNION
 *   FOOTER = the shared page runtime (kit + behaviours + register/smoother/
 *            flush), exactly the artifact the converter hoisted — what was
 *            verified locally is what ships.
 *
 * The union is taken over the three per-page webflow-runtime-states.css
 * artifacts at BLOCK level (line-level dedupe corrupts multi-line @keyframes:
 * every block ends in a bare `}` line). Union, not per-page CSS, is what
 * keeps a section movable between the three pages without losing its state
 * rules.
 *
 * Size contract: the two blocks exceed the Designer UI's 10,000-char slot
 * validation, and that is fine ON PURPOSE — page-level custom code is
 * installed by the agent over the Data API MCP (data_scripts_tool), which
 * accepts 50k per block on this site (verified 2026-08-07, see
 * reference_webflow_api_real_limits). Do NOT try to paste these into the
 * page-settings UI by hand; if a manual install is ever unavoidable, the
 * blocks must first be re-split under 10k.
 *
 * Usage: node gen_shared_install.mjs      (from 07-webflow-build)
 * Emits .tmp/_shared-install/{head.html,footer.html,report.json}
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const PAGES = ['implant', 'cosmetic', 'thank-you'];
const TMP = '.tmp';
const OUT = path.join(TMP, '_shared-install');
fs.mkdirSync(OUT, { recursive: true });

/* ---- the two JS artifacts must be byte-identical across pages ---------- */
const readArtifact = (name) => {
  const texts = PAGES.map((p) => fs.readFileSync(path.join(TMP, p, name), 'utf8'));
  const hashes = texts.map((t) => crypto.createHash('md5').update(t).digest('hex'));
  if (new Set(hashes).size !== 1) {
    console.error(`FATAL: ${name} differs across pages (${hashes.join(' ')})`);
    process.exit(1);
  }
  return texts[0].trim();
};
const bootstrap = readArtifact('webflow-custom-code-head.js');
const runtime = readArtifact('webflow-custom-code.js');

/* ---- block-level CSS union -------------------------------------------- */
function blocks(css) {
  const out = [];
  let depth = 0, cur = '';
  for (const line of css.split(/\r?\n/)) {
    if (!line.trim() && depth === 0) continue;
    cur += (cur ? '\n' : '') + line;
    depth += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
    if (depth === 0 && cur.trim()) { out.push(cur.trim()); cur = ''; }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
const seen = new Set();
const union = [];
for (const p of PAGES) {
  for (const b of blocks(fs.readFileSync(path.join(TMP, p, 'webflow-runtime-states.css'), 'utf8'))) {
    if (!seen.has(b)) { seen.add(b); union.push(b); }
  }
}
const unionCss = union.join('\n');

/* ---- GSAP CDN tags (from any page's animation manifest) ---------------- */
const GSAP_CDN = 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/{}.min.js';
const manifest = JSON.parse(fs.readFileSync(path.join(TMP, 'implant', 'animation-manifest.json'), 'utf8'));
const plugins = [];
const dedupe = new Set();
for (const src of manifest.externalScripts || []) {
  const base = path.basename(src).replace('.min.js', '');
  if (src.toLowerCase().includes('gsap') && !dedupe.has(base)) { dedupe.add(base); plugins.push(base); }
}
const gsapTags = plugins.map((p) => `<script src="${GSAP_CDN.replace('{}', p)}"></script>`).join('\n');

/* ---- assemble ----------------------------------------------------------- */
const head = [
  '<!-- GRAND MISSION LP SHARED LAYER (head) — identical on implant-ai /',
  '     cosmetic-ai / thank-u-landing-ai. GSAP loads HERE (the bootstrap and',
  '     the section embeds test window.gsap); registration stays in the',
  '     footer block. Installed over the Data API; never also at site level,',
  '     and never twice. -->',
  gsapTags,
  '<script>',
  bootstrap,
  '</script>',
  '<style>',
  unionCss,
  '</style>',
].join('\n');

const footer = [
  '<!-- GRAND MISSION LP SHARED LAYER (footer) — identical on the three LP',
  '     pages. registerPlugin + ScrollSmoother.create + WZ.flush; a second',
  '     copy anywhere kills every trigger. -->',
  '<script>',
  runtime,
  '</script>',
].join('\n');

const smootherCreates = (footer.match(/ScrollSmoother\.create\(/g) || []).length;
if (smootherCreates !== 1) {
  console.error(`FATAL: footer holds ${smootherCreates} ScrollSmoother.create calls (must be exactly 1)`);
  process.exit(1);
}
for (const [name, text] of [['head', head], ['footer', footer]]) {
  if (text.length > 50000) {
    console.error(`FATAL: ${name} block ${text.length} chars exceeds the API's 50k limit`);
    process.exit(1);
  }
}

fs.writeFileSync(path.join(OUT, 'head.html'), head, 'utf8');
fs.writeFileSync(path.join(OUT, 'footer.html'), footer, 'utf8');

/* Textarea copy-pages per page dir. Two consumers:
   - simulate_paste.mjs reads the install blocks back out of EXACTLY these
     files, so the simulator exercises the artifact that gets installed;
   - a human can still copy from them (though the blocks exceed the 10k
     page-settings UI validation — install over the Data API instead). */
const escHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const copyPage = (title, text) => `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font:14px system-ui;margin:2rem;max-width:760px}button{font-size:1.05rem;padding:.8rem 1.4rem;background:#1463ff;color:#fff;border:0;border-radius:.4rem;cursor:pointer}.ok{color:#0a7d28;font-weight:600;margin-left:1rem}textarea{width:100%;height:280px;font:12px monospace;margin-top:1rem}</style>
</head><body>
<h2>${title} — Grand Mission shared page layer (${text.length} chars, Data API install)</h2>
<p><button id="b">Copy</button><span id="s"></span></p>
<textarea id="d" readonly>${escHtml(text)}</textarea>
<script>
const t=document.getElementById('d').value;
document.getElementById('b').addEventListener('click',()=>{
  const h=ev=>{ev.preventDefault();ev.clipboardData.setData('text/plain',t);};
  document.addEventListener('copy',h);
  const ok=document.execCommand('copy');
  document.removeEventListener('copy',h);
  const s=document.getElementById('s');
  s.textContent= ok ? '✓ Copied '+t.length+' chars' : 'Copy failed';
  s.className= ok ? 'ok':'';
});
</script></body></html>`;
for (const p of PAGES) {
  fs.writeFileSync(path.join(TMP, p, 'install-head.html'), copyPage('Install HEAD', head), 'utf8');
  fs.writeFileSync(path.join(TMP, p, 'install-footer.html'), copyPage('Install FOOTER', footer), 'utf8');
}
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({
  head: { chars: head.length, gsapTags: plugins, bootstrapChars: bootstrap.length, stateCssChars: unionCss.length, stateBlocks: union.length },
  footer: { chars: footer.length, runtimeChars: runtime.length },
  designerSlotCompatible: head.length <= 10000 && footer.length <= 10000,
  installedVia: 'data_scripts_tool (Data API, 50k/block)',
}, null, 2), 'utf8');

console.log(`head.html   ${head.length} chars (${plugins.length} gsap tags + bootstrap ${bootstrap.length} + state css ${unionCss.length}, ${union.length} blocks)`);
console.log(`footer.html ${footer.length} chars`);
console.log('identical across the 3 pages by construction; install per page via data_scripts_tool');
