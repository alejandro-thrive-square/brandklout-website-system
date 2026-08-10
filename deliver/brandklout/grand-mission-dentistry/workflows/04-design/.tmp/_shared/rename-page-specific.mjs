/**
 * rename-page-specific.mjs — one-off, idempotent. build_vocab.py found six
 * classes shared by name across the three pages whose RESOLVED definitions
 * genuinely differ per page (theme values, combo-ness): arrival__sub,
 * ch-arrival, closing, disclaimer, head, hours. Same-name-different-def is
 * exactly what forks `-2` twins on the second paste, so they are renamed with
 * the page's own prefix (imp-/cos-/ty-, matching --page-prefix) — they were
 * never truly shared classes.
 *
 * Touches each page's assets/kit.css copy, styles.css, and index.src.html
 * (class attributes). No JS selects any of these.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(HERE);
const TOKENS = ['arrival__sub', 'ch-arrival', 'closing', 'disclaimer', 'head', 'hours'];
const PAGES = {
  'implant-landing-page': 'imp',
  'cosmetic-landing-page': 'cos',
  'thank-you-landing-page': 'ty',
};

const clsRe = new RegExp(`\\.(${TOKENS.join('|')})(?![\\w-])`, 'g');

let changed = 0;
const apply = (file, fn) => {
  if (!fs.existsSync(file)) return;
  const before = fs.readFileSync(file, 'utf8');
  const after = fn(before);
  if (after !== before) {
    fs.writeFileSync(file, after, 'utf8');
    changed++;
    console.log('renamed in', path.relative(ROOT, file));
  }
};

for (const [page, pfx] of Object.entries(PAGES)) {
  const renameCss = (text) => text.replace(clsRe, (_, t) => `.${pfx}-${t}`);
  const renameHtml = (text) =>
    text.replace(/class="([^"]*)"/g, (whole, list) => {
      const out = list
        .split(/\s+/)
        .map((c) => (TOKENS.includes(c) ? `${pfx}-${c}` : c))
        .join(' ');
      return `class="${out}"`;
    });
  apply(path.join(ROOT, page, 'assets/kit.css'), renameCss);
  apply(path.join(ROOT, page, 'styles.css'), renameCss);
  apply(path.join(ROOT, page, 'index.src.html'), renameHtml);
}
console.log(changed ? `${changed} files changed` : 'nothing to do (already renamed)');
