#!/usr/bin/env node
/**
 * split-page.mjs — turn one journey page into three standalone files.
 *
 *   node _shared/split-page.mjs aox
 *   -> aox-split/aox.html   markup only, no <style>, no <script>
 *      aox-split/aox.css    journey.css + the page's every <style>, in order
 *      aox-split/aox.js     journey.js + every chapter <script> + boot, in order
 *      aox-split/preview.html   the three stitched back together, for proving it
 *
 * The pages are authored as one self-contained file per landing page: the
 * shared kit is linked, and every chapter carries its own <style> and
 * <script> inside its <section>. A component-copy tool that pushes markup
 * into Webflow needs those three concerns separated instead, with nothing
 * pointing at a local path — so this also swaps the vendored GSAP bundle for
 * a CDN (documented in the file headers, not injected into the markup) and
 * the local imagery for hosted URLs.
 *
 * ORDER IS LOAD-BEARING in both concatenations. The chapter scripts queue
 * themselves into WZ.add() and the boot block flushes that queue after
 * ScrollSmoother exists; move the boot block and every pinned chapter
 * measures a half-built page. Chapter CSS overrides the shared kit by
 * appearing after it, exactly as the <section> blocks did in the page.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SHARED = path.dirname(fileURLToPath(import.meta.url));
const TMP = path.dirname(SHARED);
const GSAP = 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist';

const slug = process.argv[2];
if (!slug) {
  console.error('usage: node _shared/split-page.mjs <page-slug>');
  process.exit(2);
}
const SRC = path.join(TMP, slug, 'index.html');
const OUT = path.join(TMP, slug + '-split');

const html = fs.readFileSync(SRC, 'utf8');

/* ---------- 1. carve the body out ---------- */
let body = html.slice(html.indexOf('<body>') + '<body>'.length, html.lastIndexOf('</body>'));

/* ---------- 2. every inline <style>, in document order ---------- */
const headStyle = (html.match(/<style>([\s\S]*?)<\/style>/) || [, ''])[1];
const sectionCss = [];
body = body.replace(/[ \t]*<style>([\s\S]*?)<\/style>\n?/g, (_m, css) => {
  sectionCss.push(css);
  return '';
});

/* ---------- 3. every inline <script>, in document order ---------- */
const sectionJs = [];
body = body.replace(/[ \t]*<script>([\s\S]*?)<\/script>\n?/g, (_m, js) => {
  sectionJs.push(js);
  return '';
});
body = body.replace(/[ \t]*<script src="[^"]*"><\/script>\n?/g, '');   /* the boot tag */

/* ---------- 4. local imagery -> hosted URLs ----------
   The originals are the practice's own, but arvadadentalcenter.com sits
   behind a SiteGround captcha that answers a cross-origin image request with
   an HTML challenge; Chrome then refuses the response (ERR_BLOCKED_BY_ORB)
   and every image on the page is broken. Hotlinking the source is therefore
   not an option. They go through wsrv.nl, a public image CDN that fetches
   server-side and returns real image bytes.

   This is a staging arrangement, not the shipped one: each <img> keeps the
   practice's own address in data-src-original so swapping these for Webflow
   assets after the paste is mechanical. */
const manifest = JSON.parse(
  fs.readFileSync(path.join(SHARED, 'assets', 'assets-manifest.json'), 'utf8'));
const byFile = new Map(manifest.files.map((f) => [f.file, f.url]));
const proxy = (url) => 'https://wsrv.nl/?url=' + encodeURIComponent(url.replace(/^https?:\/\//, ''));

const missing = new Set();
body = body.replace(/(<img\b[^>]*?)src="\.\.\/_shared\/assets\/([^"]+)"/g, (m, pre, file) => {
  const url = byFile.get(file);
  if (!url) { missing.add(file); return m; }
  return `${pre}src="${proxy(url)}" data-src-original="${url}"`;
});
if (/\.\.\/_shared\//.test(body)) missing.add('(a ../_shared/ reference outside an <img src>)');
if (missing.size) {
  console.error('NO HOSTED URL FOR:', [...missing].join(', '));
  process.exit(1);
}

/* Sibling landing pages in the local review set have no Webflow slug yet, and
   a relative path that resolves to nothing is worse on a live page than an
   obvious placeholder. */
let relinked = 0;
body = body.replace(/href="(\.\.\/[^"]*)"/g, (_m, href) => {
  relinked++;
  return `href="#" data-href-original="${href}"`;
});

body = body.replace(/\n{3,}/g, '\n\n').trim();

/* ---------- 5. write ---------- */
fs.mkdirSync(OUT, { recursive: true });

const banner = (what) => `${what} — Arvada Dental Center · ${slug} landing page
Generated from 04-design/.tmp/${slug}/index.html by _shared/split-page.mjs.
Do not hand-edit: edit the source page and re-run the script.`;

fs.writeFileSync(path.join(OUT, `${slug}.html`), `<!--
${banner('MARKUP')}

Load order this markup depends on:
  <head>   ${slug}.css   (or Webflow's page/site custom CSS)
  </body>  gsap.min.js, ScrollTrigger, ScrollToPlugin, ScrollSmoother, SplitText
           then ${slug}.js — LAST, and after all five GSAP files.

#smooth-wrapper / #smooth-content must stay wrapped around the page content
and must stay direct children of <body>; ScrollSmoother transforms them.

Imagery is the practice's own, served through the wsrv.nl image CDN because
arvadadentalcenter.com answers cross-origin image requests with a captcha
challenge the browser then blocks. Before launch, upload the originals to
Webflow and swap each src for the Webflow asset URL; every <img> carries the
practice's own address in data-src-original.

data-href-original marks links that pointed at sibling pages in the local
review set. They are "#" until those pages have Webflow slugs.
-->
${body}
`, 'utf8');

const css = [
  `/* ${banner('STYLES')} */`,
  `/* Fonts. Drop this @import if the same three families are loaded through
   Webflow's own font settings or a <link> in the head. */
@import url("https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Montserrat:wght@500;600;700&family=Open+Sans:wght@400;600&display=swap");`,
  `/* ==========================================================================
   1. SHARED JOURNEY KIT  (_shared/journey.css)
   ========================================================================== */`,
  fs.readFileSync(path.join(SHARED, 'journey.css'), 'utf8').trim(),
  `/* ==========================================================================
   2. PAGE MOTION CONTRACT  (was the <style> block in <head>)
   ========================================================================== */`,
  headStyle.trim(),
  `/* ==========================================================================
   3. CHAPTER STYLES  (each was a <style> inside its own <section>, in order)
   ========================================================================== */`,
  ...sectionCss.map((c) => c.replace(/^\n+|\s+$/g, '')),
].join('\n\n');
fs.writeFileSync(path.join(OUT, `${slug}.css`), css + '\n', 'utf8');

const js = [
  `/* ${banner('BEHAVIOUR')}

REQUIRES, in this order, before this file:
  ${GSAP}/gsap.min.js
  ${GSAP}/ScrollTrigger.min.js
  ${GSAP}/ScrollToPlugin.min.js
  ${GSAP}/ScrollSmoother.min.js
  ${GSAP}/SplitText.min.js

Order inside this file is load-bearing: WZ is defined first, each chapter
queues its choreography into WZ.add(), and the boot block at the bottom
registers the plugins, creates ScrollSmoother and only then flushes the
queue — so every ScrollTrigger measures the final, smoothed layout. */`,
  `/* ==========================================================================
   1. WZ — chapter queue and shared motion helpers  (_shared/journey.js)
   ========================================================================== */`,
  fs.readFileSync(path.join(SHARED, 'journey.js'), 'utf8').trim(),
  `/* ==========================================================================
   2. CHAPTERS  (each was a <script> inside its own <section>, in order)
   ========================================================================== */`,
  ...sectionJs.map((s) => s.replace(/^\n+|\s+$/g, '')),
  `/* ==========================================================================
   3. BOOT — must stay last  (_shared/journey-boot.js)
   ========================================================================== */`,
  fs.readFileSync(path.join(SHARED, 'journey-boot.js'), 'utf8').trim(),
].join('\n\n');
fs.writeFileSync(path.join(OUT, `${slug}.js`), js + '\n', 'utf8');

/* Not part of the paste: the three files stitched back together in the
   documented order, so the split can be opened and proved. */
fs.writeFileSync(path.join(OUT, 'preview.html'), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${(html.match(/<title>([\s\S]*?)<\/title>/) || [, slug])[1]}</title>
<meta name="robots" content="noindex, nofollow">
<!-- Preview only. Proves ${slug}.css + ${slug}.html + ${slug}.js are still one
     working page, in the load order a Webflow build has to reproduce. -->
<link rel="stylesheet" href="${slug}.css">
</head>
<body>
${fs.readFileSync(path.join(OUT, `${slug}.html`), 'utf8').replace(/^<!--[\s\S]*?-->\n/, '').trim()}
<script src="${GSAP}/gsap.min.js"></script>
<script src="${GSAP}/ScrollTrigger.min.js"></script>
<script src="${GSAP}/ScrollToPlugin.min.js"></script>
<script src="${GSAP}/ScrollSmoother.min.js"></script>
<script src="${GSAP}/SplitText.min.js"></script>
<script src="${slug}.js"></script>
</body>
</html>
`, 'utf8');

const out = fs.readFileSync(path.join(OUT, `${slug}.html`), 'utf8');
console.log(`${slug}: ${sectionCss.length} chapter styles, ${sectionJs.length} chapter scripts, `
  + `${relinked} sibling links neutralised`);
console.log(`  residual <style>/<script> in markup: ${/<style|<script/.test(out)}`);
/* data-*-original attributes are the record of what was rewritten, so they
   are excluded — a live src or href still on a local path is the failure. */
console.log(`  residual local paths in markup:      `
  + `${/\.\.\//.test(out.replace(/ data-(?:src|href)-original="[^"]*"/g, ''))}`);
for (const f of [`${slug}.html`, `${slug}.css`, `${slug}.js`, 'preview.html']) {
  console.log('  ', f.padEnd(14), fs.statSync(path.join(OUT, f)).size, 'bytes');
}
