/**
 * retool.mjs — re-author the three Grand Mission design packages into the
 * pasteable-components architecture (deliver/process/07-webflow-build/
 * PASTEABLE-COMPONENTS.md):
 *
 *   - the WZ bootstrap moves INLINE into <head> (embeds call WZ.add mid-parse);
 *   - every per-section behaviour moves INSIDE its section as a
 *     `<script data-embed class="wz-js">` (from _embeds/<page>/<section>.js);
 *   - the shared page runtime (kit + content behaviours + boot) is inlined at
 *     the end of <body> — byte-identical on all three pages;
 *   - sections are wrapped in `<main id="top">` (the extractor's contract:
 *     sections are main's children, the footer stays a sibling inside
 *     #smooth-content);
 *   - chapter-departure sections get `data-recede` (kit-driven now);
 *   - `.wz-js{display:none}` is appended to styles.css so the w-embed wrapper
 *     div a script embed becomes in Webflow can never occupy a grid cell.
 *
 * Idempotent: the first run snapshots index.html -> index.src.html and every
 * run regenerates index.html from that snapshot. Edit index.src.html (markup)
 * or _embeds/* / _shared/* (behaviour), then re-run:
 *
 *   node _shared/retool.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(HERE); // 04-design/.tmp

const read = (p) => fs.readFileSync(p, 'utf8');

const BOOTSTRAP = read(path.join(HERE, 'wz-bootstrap.js')).trim();
const RUNTIME = read(path.join(HERE, 'wz-runtime.js')).trim();

const PAGES = {
  'implant-landing-page': {
    embeds: {
      arrival: ['implant/arrival.js', 'implant/offer.js'],
      loss: ['implant/loss.js'],
      answer: ['implant/answer.js'],
      options: ['implant/options.js'],
      specialist: ['implant/specialist.js'],
      terms: ['implant/terms.js'],
      invitation: ['implant/invitation.js'],
    },
    recede: ['candidacy', 'specialist', 'terms'],
  },
  'cosmetic-landing-page': {
    embeds: {
      arrival: ['cosmetic/arrival.js', 'cosmetic/offer.js'],
      hands: ['cosmetic/hands.js'],
      work: ['cosmetic/work.js'],
      standard: ['cosmetic/standard.js'],
      proof: ['cosmetic/proof.js'],
      invitation: ['cosmetic/invitation.js'],
    },
    recede: ['hands', 'voices'],
  },
  'thank-you-landing-page': {
    embeds: {
      arrival: ['thank-you/arrival.js'],
      'fast-track': ['thank-you/practice.js', 'thank-you/fast-track.js'],
      path: ['thank-you/path.js'],
      preparation: ['thank-you/preparation.js'],
      place: ['thank-you/place.js'],
    },
    recede: ['team'],
  },
};

const die = (msg) => { console.error('FATAL: ' + msg); process.exit(1); };

const embedTag = (code) =>
  '<script data-embed class="wz-js">\n' + code.trim() + '\n</script>';

for (const [page, cfg] of Object.entries(PAGES)) {
  const dir = path.join(ROOT, page);
  const srcPath = path.join(dir, 'index.src.html');
  const outPath = path.join(dir, 'index.html');

  if (!fs.existsSync(srcPath)) {
    // First run: snapshot the pristine page as the build source.
    fs.copyFileSync(outPath, srcPath);
    console.log(`${page}: snapshotted index.html -> index.src.html`);
  }
  let html = read(srcPath);

  // 1. head bootstrap, directly after the GSAP tags it tests for
  const splitTag = '<script src="assets/gsap/SplitText.min.js"></script>';
  if (!html.includes(splitTag)) die(`${page}: SplitText head tag not found`);
  html = html.replace(
    splitTag,
    splitTag + '\n\n    <script>\n' + BOOTSTRAP + '\n    </script>'
  );

  // 2. shared footer runtime replaces the wz.js/page.js/app.js stack
  const tail = /[ \t]*<script src="assets\/wz\.js"><\/script>[\s\S]*?<\/script>\s*(<\/body>)/;
  if (!tail.test(html)) die(`${page}: script tail (wz.js .. wzFlush) not found`);
  html = html.replace(
    tail,
    '    <script>\n' + RUNTIME + '\n    </script>\n  $1'
  );

  // 3. wrap the sections in <main id="top">; the footer stays its sibling
  const contentOpen = '<div id="smooth-content">';
  if (!html.includes(contentOpen)) die(`${page}: #smooth-content not found`);
  html = html.replace(contentOpen, contentOpen + '\n<main id="top">');
  const footerAt = html.indexOf('<footer');
  if (footerAt < 0) die(`${page}: <footer> not found`);
  html = html.slice(0, footerAt) + '</main>\n\n        ' + html.slice(footerAt);

  // 4. data-recede on the chapters whose departure the kit now drives
  for (const id of cfg.recede) {
    const re = new RegExp(`(<section[^>]*id="${id}")`);
    if (!re.test(html)) die(`${page}: section #${id} not found for data-recede`);
    html = html.replace(re, '$1 data-recede');
  }

  // 5. per-section embeds, injected before each section's own </section>
  for (const [id, files] of Object.entries(cfg.embeds)) {
    const open = html.match(new RegExp(`<section[^>]*id="${id}"[^>]*>`));
    if (!open) die(`${page}: section #${id} not found for embeds`);
    const at = html.indexOf('</section>', open.index);
    if (at < 0) die(`${page}: #${id} has no </section>`);
    const block = files
      .map((f) => embedTag(read(path.join(ROOT, '_embeds', f))))
      .join('\n\n');
    html = html.slice(0, at) + '\n' + block + '\n' + html.slice(at);
  }

  fs.writeFileSync(outPath, html, 'utf8');

  // 6. .wz-js neutraliser in the page CSS (baked as a real class on convert)
  const cssPath = path.join(dir, 'styles.css');
  let css = read(cssPath);
  if (!css.includes('.wz-js')) {
    css += '\n/* Script embeds: layout-inert. In Webflow a script-only HtmlEmbed is a\n' +
      '   visible div.w-embed — without this it occupies a grid/flex cell. */\n' +
      '.wz-js { display: none; }\n';
    fs.writeFileSync(cssPath, css, 'utf8');
  }

  const embeds = (html.match(/<script data-embed/g) || []).length;
  console.log(
    `${page}: bootstrap inlined, runtime inlined, main#top wrapped, ` +
    `${embeds} section embeds, data-recede on ${cfg.recede.join('/')}`
  );
}

// The shared blocks must be byte-identical across the three pages — verify by
// asserting each page contains the canonical block text verbatim, exactly once.
const bootBlock = '<script>\n' + BOOTSTRAP + '\n    </script>';
const runBlock = '<script>\n' + RUNTIME + '\n    </script>\n  </body>';
for (const page of Object.keys(PAGES)) {
  const html = read(path.join(ROOT, page, 'index.html'));
  if (html.split(bootBlock).length !== 2) die(`${page}: bootstrap block missing or duplicated`);
  if (html.split(runBlock).length !== 2) die(`${page}: runtime block missing or duplicated`);
}
console.log(
  `shared layer identical on all 3 pages: bootstrap ${BOOTSTRAP.length} chars, ` +
  `runtime ${RUNTIME.length} chars`
);
