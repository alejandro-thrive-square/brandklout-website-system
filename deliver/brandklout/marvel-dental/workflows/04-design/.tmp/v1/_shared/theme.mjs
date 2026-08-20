#!/usr/bin/env node
/**
 * theme.mjs — re-theme the Arvada campaign class layer onto Marvel Dental.
 *
 * The three stylesheets in this folder started life as Arvada Dental Center's
 * `camp_` layer (branch `bk-arvada`). Structure, class names and the
 * Webflow-safe dialect are worth keeping verbatim; the *look* is Arvada's and
 * has to go. Rather than hand-edit 130 selectors, this script applies one
 * declared mapping so the re-theme is auditable and repeatable:
 *
 *   node theme.mjs            re-theme in place, print a report
 *   node theme.mjs --check    report only, write nothing
 *
 * Marvel's brand values are MEASURED, not guessed — `01-content-intake/.tmp/
 * brand-probe.mjs` reads computed styles off the published site. See
 * `docs/brand.md`.
 *
 * Everything stays in the Webflow-safe dialect: concrete values only (no
 * clamp/calc), no pseudo-elements, no descendant selectors, and media queries
 * only at 991 / 767 / 479.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CHECK = process.argv.includes('--check');
const FILES = ['camp.css', 'camp-convert.css', 'camp-sections.css'];

/* ---------------------------------------------------------------- palette ---
   Left: Arvada's value. Right: Marvel's, and the role it plays.

   Marvel's own site is white-dominant with one teal (#00769D) doing all the
   accent work, a deep teal (#00394D) on step headings, and two tinted bands
   (#F0F9FD blue, #F1F2F2 grey). The warm cream/gold system Arvada used has no
   counterpart, so gold splits by CONTEXT: on light it becomes the teal, on
   dark it becomes a pale teal that can hold contrast against #00394D.        */
const COLORS = {
  // brand darks
  '#0b2c41': '#00394d', // navy      -> deep teal: hero, CTA, is-navy, result label
  '#133f52': '#005c7c', // navy mid  -> hero gradient midpoint
  '#403830': '#00394d', // brown     -> deep teal: dark headings, dark text, footer
  // accents
  '#c8b282': '#00769d', // gold      -> brand teal (eyebrows, rules, kickers on light)
  '#d3aa5a': '#00618a', // gold 2    -> hover/darker teal (icons, numbers, button hover)
  // tints and lines
  '#fdf8ef': '#f0f9fd', // cream     -> Marvel's pale blue band
  '#f3f1ec': '#f1f2f2', // mist      -> Marvel's grey band
  '#ece8e1': '#e8f4fa',
  '#eee8df': '#e8f4fa',
  '#ede9e2': '#eaf5fa',
  '#d8d1c6': '#dce7ec', // line      -> cool hairline
  '#ded8ce': '#d3e2e9',
  '#dedbd4': '#d3e2e9',
  '#ddd8d0': '#cfe4ec', // body text on dark
  '#ddd6cc': '#cfe4ec',
  '#d7d1c8': '#d3e2e9',
  // greys
  '#5f5f5d': '#5c5c5c', // silver    -> Marvel's --sub-heading
  '#5d5a54': '#5c5c5c',
  '#77736c': '#6b7b82',
  '#66625c': '#6b7b82',
  '#514e49': '#3f5058',
  '#7a7771': '#6b7b82',
  '#aaa59e': '#9bb0b9',
  '#8e8d8d': '#9bb0b9',
};

/* gold on a DARK ground cannot become the mid teal — it would vanish. These
   selectors carry the accent against #00394d and take the pale teal instead. */
const ON_DARK_ACCENT = '#8ed0e6';

const FONTS = {
  'area extended': 'Noto Serif',   // display -> Marvel's heading serif
  Centurygothic: 'Karla',          // body/UI -> Marvel's UI sans
};

/* ------------------------------------------------------------- rule patches ---
   Values measured from marveldentaldds.com: h1 69/1.1, h2 40/56, section
   112px, pill buttons (999px) in uppercase Karla 600, eyebrow-ish labels in
   Karla with wide tracking. */
const PATCHES = [
  ['.camp_h1', { 'font-size': '69px', 'line-height': '1.1', 'letter-spacing': 'normal', 'font-weight': '500', 'max-width': '640px' }],
  ['.camp_h2', { 'font-size': '40px', 'line-height': '1.3', 'letter-spacing': 'normal', 'font-weight': '500', color: '#222222' }],
  ['.camp_h3', { 'font-size': '22px', 'line-height': '1.35', 'font-weight': '500', color: '#00394d' }],
  ['.camp_eyebrow', { 'font-family': 'Karla', 'font-size': '13px', 'font-weight': '600', 'letter-spacing': '0.14em', color: '#00769d' }],
  ['.camp_section', { 'padding-top': '112px', 'padding-bottom': '112px' }],
  ['.camp_button', {
    'font-family': 'Karla', 'font-size': '14px', 'font-weight': '600', 'letter-spacing': '0.06em',
    'border-radius': '999px', 'min-height': '54px', 'padding-top': '15px', 'padding-bottom': '15px',
    'padding-left': '30px', 'padding-right': '30px',
    'background-color': '#00769d', color: '#ffffff',
  }],
  ['.camp_button.is-light', { 'background-color': '#ffffff', color: '#00394d' }],
  ['.camp_button.is-navy', { 'background-color': '#00394d', color: '#ffffff' }],
  ['.camp_text-link', { 'font-size': '13px', 'font-weight': '600', 'letter-spacing': '0.04em' }],
  ['.camp_mobile-bar_link', { 'background-color': '#00769d', color: '#ffffff', 'font-family': 'Karla', 'font-weight': '600' }],
  ['.camp_footer_heading', { color: ON_DARK_ACCENT }],
  ['.camp_hero_promise', { 'background-color': '#00394d', color: '#ffffff' }],
  ['.camp_review_stars', { color: '#f2b203' }],           // a star that is not gold reads as broken
  ['.camp_offer-card', { 'border-radius': '16px' }],
  ['.camp_form-card', { 'border-radius': '16px' }],
  ['.camp_urgent-note', { 'border-left-color': '#00769d' }],
  ['.camp_check-icon', { color: '#00769d' }],
  ['.camp_credential_check', { color: '#00769d' }],
  ['.camp_faq_plus', { color: '#00769d' }],
  ['.camp_benefit_number', { color: '#00769d' }],
];

/* responsive type steps, replacing Arvada's resolved clamps */
const STEPS = {
  991: { '.camp_h1': '52px', '.camp_h2': '34px' },
  767: { '.camp_h1': '44px', '.camp_h2': '30px' },
  479: { '.camp_h1': '36px', '.camp_h2': '27px' },
};

const report = [];
for (const file of FILES) {
  const p = path.join(HERE, file);
  const before = fs.readFileSync(p, 'utf8');
  let css = before;

  for (const [from, to] of Object.entries(COLORS)) {
    const re = new RegExp(from.replace('#', '#'), 'gi');
    const hits = (css.match(re) || []).length;
    if (hits) report.push(`${file}: ${from} -> ${to} (${hits})`);
    css = css.replace(re, to);
  }
  for (const [from, to] of Object.entries(FONTS)) {
    const re = new RegExp(`font-family: *${from}`, 'gi');
    const hits = (css.match(re) || []).length;
    if (hits) report.push(`${file}: font ${from} -> ${to} (${hits})`);
    css = css.replace(re, `font-family: ${to}`);
  }

  // rule patches: set the property inside the rule's own block, or append it
  for (const [selector, props] of PATCHES) {
    const re = new RegExp(`(^|\\n)(${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} *\\{)([^}]*)(\\})`, 'm');
    const m = css.match(re);
    if (!m) { if (file === 'camp.css') report.push(`${file}: MISSING rule ${selector}`); continue; }
    let body = m[3];
    for (const [prop, value] of Object.entries(props)) {
      const pre = new RegExp(`(\\n\\s*)${prop}: *[^;]+;`);
      if (pre.test(body)) body = body.replace(pre, `$1${prop}: ${value};`);
      else body = body.replace(/\s*$/, `\n  ${prop}: ${value};\n`);
    }
    css = css.replace(re, `$1$2${body}$4`);
  }

  // shorthand margins/paddings the patcher cannot see into
  css = css.replace(/(\.camp_section \{[^}]*?)padding: *104px 0px;/s, '$1padding: 112px 0px;');

  // responsive steps
  for (const [width, rules] of Object.entries(STEPS)) {
    for (const [selector, size] of Object.entries(rules)) {
      const re = new RegExp(`(@media screen and \\(max-width: ${width}px\\) \\{[\\s\\S]*?)${selector.replace('.', '\\.')} \\{ font-size: \\d+px; \\}`);
      if (re.test(css)) css = css.replace(re, `$1${selector} { font-size: ${size}; }`);
      else report.push(`${file}: no ${selector} step at ${width}`);
    }
  }

  if (!CHECK && css !== before) fs.writeFileSync(p, css);
  report.push(`${file}: ${css === before ? 'unchanged' : (CHECK ? 'would change' : 'rewritten')}`);
}

console.log(report.join('\n'));

// nothing Arvada-coloured may survive
const leftovers = [];
for (const file of FILES) {
  const css = fs.readFileSync(path.join(HERE, file), 'utf8');
  for (const from of Object.keys(COLORS)) if (css.toLowerCase().includes(from)) leftovers.push(`${file}: ${from}`);
  for (const from of Object.keys(FONTS)) if (css.includes(from)) leftovers.push(`${file}: ${from}`);
}
if (leftovers.length && !CHECK) {
  console.log('\nARVADA VALUES REMAIN:\n  ' + leftovers.join('\n  '));
  process.exit(1);
}
console.log(CHECK ? '\ncheck only, nothing written' : '\nno Arvada colour or font remains');
