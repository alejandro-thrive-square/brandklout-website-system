#!/usr/bin/env node
/**
 * make-template.mjs — turn the client's v2 reference into the build template.
 *
 * The reference is already client-first in spirit, so this is a rename plus a
 * short list of structural repairs, every one of them forced by something
 * data_whtml_builder refuses:
 *
 *   campaign-*            -> camp_*            (house prefix, matches Mason Park's lp_)
 *   :after / :before      -> a real child <span> with its own class
 *   descendant selectors  -> an is-* combo on the element itself
 *   <main class=page>     -> .camp_page > (announce, header, main.main-wrapper, footer, bar)
 *   inline style=         -> a class
 *
 * Output: 04-design/.tmp/v2/_shared/page-template.html — the shared skeleton
 * all 18 pages are rendered from.
 *
 *   node make-template.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, 'ref-emergency-v2.body.html');
const OUT = path.resolve(HERE, '../../../04-design/.tmp/v2/_shared/page-template.html');

let h = fs.readFileSync(SRC, 'utf8');

// Strip the document shell — the template is a body fragment.
h = h.replace(/<!DOCTYPE[^>]*>/i, '').replace(/<\/?html[^>]*>/gi, '').replace(/<\/?body[^>]*>/gi, '').trim();

/* ------------------------------------------------------------- 1. rename -- */

h = h.replace(/\bcampaign-/g, 'camp_');

/* ------------------------------ 2. pseudo-elements become real children --- */

// .camp_button:after {content:'›'}  and  .camp_text-link:after {content:'›'}
// The glyph goes last inside the element, which is where ::after painted it.
function appendGlyph(html, cls, glyphCls, glyph) {
  const re = new RegExp(`(<a[^>]*class="[^"]*\\b${cls}\\b[^"]*"[^>]*>)([\\s\\S]*?)(</a>)`, 'g');
  return html.replace(re, (m, open, inner, close) =>
    inner.includes(glyphCls) ? m : `${open}${inner}<span class="${glyphCls}">${glyph}</span>${close}`);
}
h = appendGlyph(h, 'camp_button', 'camp_button_chev', '›');
h = appendGlyph(h, 'camp_text-link', 'camp_text-link_chev', '›');

// .camp_header_status:before {content:'◷'} and .camp_header_phone:before {content:'☎'}
function prependGlyph(html, cls, glyphCls, glyph) {
  const re = new RegExp(`(<(?:a|span|div)[^>]*class="[^"]*\\b${cls}\\b[^"]*"[^>]*>)`, 'g');
  return html.replace(re, (m) => `${m}<span class="${glyphCls}">${glyph}</span>`);
}
h = prependGlyph(h, 'camp_header_status', 'camp_header_status-icon', '◷');
h = prependGlyph(h, 'camp_header_phone', 'camp_header_phone-icon', '☎');
h = prependGlyph(h, 'camp_credential-text', 'camp_credential_check', '✓');

/* ------------------- 3. descendant selectors become classes / combos ------ */

// .camp_urgent-note strong { display:block; color:#fff }
h = h.replace(/<strong>/g, '<span class="camp_urgent-note_title">').replace(/<\/strong>/g, '</span>');

// .camp_result-panel img
h = h.replace(/(<div class="camp_result-panel">\s*)<img /g, '$1<img class="camp_result-panel_img" ');

// The <iframe> is simply dropped by the builder — Webflow has no iframe
// element, and an HtmlEmbed is off the table. Webflow's own `YouTubeVideo`
// element is the native equivalent, so the iframe is reduced to a marker that
// build-page.mjs fills in after the markup lands.
h = h.replace(/<iframe[^>]*\bsrc="([^"]*)"[^>]*>\s*<\/iframe>/g, (m, src) => {
  const id = (src.match(/embed\/([\w-]+)/) || [])[1] || '';
  return `<div class="camp_video_slot" data-youtube="${id}"></div>`;
});

// .camp_mobile-bar a  (+ :first-child is the call button)
{
  let n = 0;
  h = h.replace(/(<div class="camp_mobile-bar">)([\s\S]*?)(<\/div>)/, (m, open, inner, close) => {
    const fixed = inner.replace(/<a /g, () => `<a class="camp_mobile-bar_link${n++ === 0 ? ' is-call' : ''}" `);
    return open + fixed + close;
  });
}

// Context colour: inside a dark section (.is-navy / .is-blue) and inside the CTA,
// the heading, body copy and text link are light. Webflow cannot express that as
// a descendant rule, so the combo goes on the element.
function markDark(html) {
  const openTag = /<section class="camp_section is-(navy|blue)"[\s\S]*?(?=<section |<\/main>|$)/g;
  html = html.replace(openTag, (block) => block
    .replace(/class="camp_h2"/g, 'class="camp_h2 is-on-dark"')
    .replace(/class="camp_text"/g, 'class="camp_text is-on-dark"')
    .replace(/class="camp_text-link"/g, 'class="camp_text-link is-on-dark"'));
  const cta = /<section class="camp_cta"[\s\S]*?<\/section>/g;
  return html.replace(cta, (block) => block
    .replace(/class="camp_h2"/g, 'class="camp_h2 is-on-dark"')
    .replace(/class="camp_text"/g, 'class="camp_text is-on-dark"'));
}
h = markDark(h);

/* ------------------- 3b. one base class per element, plus its combos ------ */

// Webflow gives an element ONE base class and any number of combos of it.
// `class="camp_container camp_split"` therefore cannot work: camp_split
// already owns combos (is-result / is-provider / is-video / is-faq), and a
// class that owns combos cannot also be a secondary class on another base —
// the builder drops it, silently, and the section loses its whole grid.
// Splitting the two concerns is also the client-first shape Mason Park uses:
// container and layout grid are separate elements.
h = h.replace(/<div class="camp_container (camp_split[^"]*)">/g,
  (m, rest) => `<div class="camp_container"><div class="${rest}">`);
// …and close the extra div. The split blocks are the direct children of a
// section, so their closing tag is the one before the section closes.
h = h.replace(/(<div class="camp_container"><div class="camp_split[^"]*">)([\s\S]*?)(<\/div><\/section>)/g,
  (m, open, inner, close) => `${open}${inner}</div>${close}`);

// The reference writes `class="campaign-button campaign-button …"` on the
// header CTA. A duplicate is harmless in CSS and makes the build report look
// like a dropped class, so normalise every class attribute.
h = h.replace(/class="([^"]+)"/g, (m, v) => `class="${[...new Set(v.trim().split(/\s+/))].join(' ')}"`);

/* ------------------------------------------- 4. inline styles become a class */

h = h.replace(/<div style="margin-top:28px">/g, '<div class="camp_action-offset">');

/* ------------------------------------------------ 5. client-first wrapper -- */
// <main class="camp_page"> ... </main>
//   becomes
// <div class="camp_page"> announce, header, <main class="main-wrapper"> …content… </main>, footer, bar </div>

h = h.replace(/<main class="camp_page">/, '<div class="camp_page">').replace(/<\/main>\s*$/, '</div>');

// open main-wrapper before the hero, close it after the CTA
h = h.replace(/(\s*)(<section class="camp_hero")/, '$1<main class="main-wrapper" id="main">$1$2');
h = h.replace(/(<\/section>)(\s*)(<section class="camp_footer")/, '$1$2</main>$2$3');

/* ------------------------------------------------------------------ save -- */

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, h.replace(/\n{3,}/g, '\n\n') + '\n');

/* ---------------------------------------------------------------- report -- */

const classes = new Map();
for (const m of h.matchAll(/class="([^"]+)"/g)) for (const c of m[1].split(/\s+/)) classes.set(c, (classes.get(c) || 0) + 1);
// Strip comments first — the header prose names file extensions and the old
// campaign-* classes, and both show up as phantom "unused rules" otherwise.
const cssSrc = fs.readFileSync(path.resolve(HERE, '../../../04-design/.tmp/v2/_shared/camp.css'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '');
const cssNames = new Set([...cssSrc.matchAll(/\.([a-z][\w-]*)/g)].map((m) => m[1]));

const KNOWN_SITE = new Set(['main-wrapper', 'page-wrapper']);
const undefinedClasses = [...classes.keys()].filter((c) => !cssNames.has(c) && !KNOWN_SITE.has(c));
const unusedRules = [...cssNames].filter((c) => !classes.has(c));

console.log(`${OUT}: ${h.length} bytes`);
console.log(`${classes.size} distinct classes used`);
if (undefinedClasses.length) console.log('\nUSED BUT NOT IN camp.css: ' + undefinedClasses.join(', '));
if (unusedRules.length) console.log('\nIN camp.css BUT UNUSED HERE: ' + unusedRules.join(', '));
if (/style="/.test(h)) console.log('\nSTILL HAS INLINE STYLES: ' + [...h.matchAll(/style="[^"]*"/g)].map((m) => m[0]).join(', '));
if (/campaign-/.test(h)) console.log('\nSTILL HAS campaign- NAMES');
