#!/usr/bin/env node
/**
 * to-instatic.mjs — turn a built local page into the HTML Instatic should hold.
 *
 * The local package and the Instatic site are the same markup with three
 * differences, and only three:
 *
 *   1. ROUTES.  Local is a folder of files (`veneers.html`, `index.html`);
 *      Instatic is a routed site (`/veneers`, `/`). Anchors carry through
 *      (`contact.html#book` -> `/contact#book`).
 *   2. MEDIA.   Local is `assets/<name>`; Instatic is
 *      `/uploads/<id>-<name>`, and the id is assigned at upload time, so the
 *      map has to be harvested (harvest-media-map.mjs) or built as we upload
 *      (upload-media.mjs). Instatic also normalises the filename on the way in
 *      (`.jpeg` -> `.jpg`, `.` -> `_`), which is exactly why the map is keyed on
 *      the LOCAL name and valued with whatever came back.
 *   3. SCRIPTS AND STYLES.  Local links `assets/site.css` and `assets/site.js`
 *      plus six GSAP files from the page head. On Instatic those are code
 *      assets applied site-wide, so every <script> and <link rel=stylesheet>
 *      is dropped here rather than pushed into the page body.
 *
 * Everything else, the class vocabulary included, is identical, which is the
 * whole point of having centralised the CSS first.
 *
 * Exported so the page pusher can use it; runnable for eyeballing one page:
 *   node to-instatic.mjs veneers.html [--out veneers.instatic.html]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const SITE = path.resolve(HERE, '../../04-design/.tmp/final-site');
const MAP = JSON.parse(fs.readFileSync(path.join(HERE, 'instatic-media-map.json'), 'utf8'));

/** `index.html` -> `/`, `veneers.html#faq` -> `/veneers#faq`. */
export function route(href) {
  const m = /^([A-Za-z0-9._-]+)\.html(#.*)?$/.exec(href);
  if (!m) return null;
  const [, slug, hash = ''] = m;
  return (slug === 'index' ? '/' : `/${slug}`) + hash;
}

/** `assets/foo.jpg` -> `/uploads/<id>-foo.jpg`, or null if not uploaded. */
export function upload(src) {
  const name = src.replace(/^assets\//, '');
  return MAP[name] || MAP[name.replace(/\.avif$/i, '.jpg')] || null;
}

export function transform(file) {
  const raw = fs.readFileSync(path.join(SITE, file), 'utf8');

  // STRIP COMMENTS FIRST. This is correctness, not tidiness. The head carries a
  // build note whose text contains the literal "<body>", so indexOf('<body>')
  // on the raw file lands INSIDE that comment. Slicing there leaves a dangling
  // `-->`, which then pairs with the next real `<!--`, and the comment stripper
  // eats alternate blocks of the actual page. veneers.html came out at 4KB of
  // its 24KB that way, with no error and no warning. Same failure mode as the
  // 2026-08-17 re-sync; it is worth only learning once.
  let src = raw.replace(/<!--[\s\S]*?-->/g, '');

  // Body only. The head is Instatic's business (SEO fields, and the code assets).
  const bodyOpen = src.indexOf('<body>');
  const bodyClose = src.lastIndexOf('</body>');
  if (bodyOpen === -1 || bodyClose === -1) throw new Error(`${file}: no <body>`);
  let html = src.slice(bodyOpen + '<body>'.length, bodyClose);

  const warn = [];

  // 3. drop the local asset plumbing
  html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');
  html = html.replace(/<link\b[^>]*rel="stylesheet"[^>]*>/g, '');

  // 1. routes
  html = html.replace(/\bhref="([^"]+)"/g, (whole, href) => {
    const r = route(href);
    return r ? `href="${r}"` : whole;
  });

  // 2. media
  html = html.replace(/\bsrc="(assets\/[^"]+)"/g, (whole, src) => {
    const u = upload(src);
    if (!u) { warn.push(src); return whole; }
    return `src="${u}"`;
  });
  // poster="" on the film blocks points at assets/ too
  html = html.replace(/\bposter="(assets\/[^"]+)"/g, (whole, src) => {
    const u = upload(src);
    if (!u) { warn.push(src); return whole; }
    return `poster="${u}"`;
  });

  // Collapse the blank lines the comment strip leaves behind.
  html = html.replace(/\n{3,}/g, '\n\n').trim();

  return { html, unmapped: [...new Set(warn)] };
}

const isMain = process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const file = process.argv[2];
  if (!file) { console.error('usage: to-instatic.mjs <page.html> [--out f]'); process.exit(1); }
  const { html, unmapped } = transform(file);
  console.error(`${file}: ${html.length} chars` + (unmapped.length ? `, UNMAPPED: ${unmapped.join(', ')}` : ''));
  const oi = process.argv.indexOf('--out');
  if (oi > -1) fs.writeFileSync(process.argv[oi + 1], html);
  else process.stdout.write(html);
}
