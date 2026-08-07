/**
 * rename-collisions.mjs — one-off, idempotent. Nine authored class names
 * collide with classes already live on the 303-page Grand Mission production
 * site (site-classes-before.txt): card, figure, footer, grid, header, label,
 * more, stars, step. A paste would fork them (`header-2`) inconsistently
 * across the three pages, so they are renamed `gm-*` at the source — the same
 * move the Dr. Nahlah build made for .nav/.label/.section.
 *
 * Touches: _vendor/kit/kit.css (+ its per-page assets/kit.css copies), each
 * page's styles.css, each page's index.src.html (class attributes only), and
 * _embeds JS selector strings.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(HERE);
const TOKENS = ['card', 'figure', 'footer', 'grid', 'header', 'label', 'more', 'stars', 'step'];
const PAGES = ['implant-landing-page', 'cosmetic-landing-page', 'thank-you-landing-page'];

const clsRe = new RegExp(`\\.(${TOKENS.join('|')})(?![\\w-])`, 'g');

function renameCss(text) {
  return text.replace(clsRe, (_, t) => '.gm-' + t);
}

function renameHtmlClasses(text) {
  return text.replace(/class="([^"]*)"/g, (whole, list) => {
    const out = list
      .split(/\s+/)
      .map((c) => (TOKENS.includes(c) ? 'gm-' + c : c))
      .join(' ');
    return `class="${out}"`;
  });
}

let changed = 0;
const apply = (file, fn) => {
  const before = fs.readFileSync(file, 'utf8');
  const after = fn(before);
  if (after !== before) {
    fs.writeFileSync(file, after, 'utf8');
    changed++;
    console.log('renamed in', path.relative(ROOT, file));
  }
};

apply(path.join(ROOT, '_vendor/kit/kit.css'), renameCss);
for (const page of PAGES) {
  apply(path.join(ROOT, page, 'assets/kit.css'), renameCss);
  apply(path.join(ROOT, page, 'styles.css'), renameCss);
  apply(path.join(ROOT, page, 'index.src.html'), renameHtmlClasses);
}
// JS selector strings ('.step' in the implant quiz) — same class regex works.
for (const page of ['implant', 'cosmetic', 'thank-you']) {
  const dir = path.join(ROOT, '_embeds', page);
  for (const f of fs.readdirSync(dir)) apply(path.join(dir, f), renameCss);
}
apply(path.join(HERE, 'wz-runtime.js'), renameCss);

console.log(changed ? `${changed} files changed` : 'nothing to do (already renamed)');
