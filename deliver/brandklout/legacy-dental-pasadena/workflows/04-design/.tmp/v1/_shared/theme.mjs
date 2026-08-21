#!/usr/bin/env node
/**
 * theme.mjs — re-theme the campaign class layer onto Legacy Dental Pasadena.
 *
 * The three stylesheets in this folder arrived from Marvel Dental (which got
 * them from Arvada). Structure, class names and the Webflow-safe dialect are
 * worth keeping verbatim; the *look* is Marvel's teal system and has to go.
 * Rather than hand-edit 130 selectors, this script applies one declared
 * mapping so the re-theme is auditable and repeatable:
 *
 *   node theme.mjs            re-theme in place, print a report
 *   node theme.mjs --check    report only, write nothing
 *
 * Legacy's brand values are MEASURED, not guessed — read out of the practice's
 * own published stylesheet at `01-content-intake/.tmp/site/site.css`:
 *
 *   --dark-green  #585b2f   43 uses, the dominant brand colour
 *   --soft-white  #fdf8ee   28
 *   --skin        #eaddca   17
 *   amber         #f99b1b    4, used sparingly as the one warm accent
 *   --grey        #949c94    3
 *   headings      Cardo 700, UPPERCASE, h1 3rem/48px · h2 2.5rem/40px, lh 1.2
 *   body          Montserrat
 *   buttons       square (no radius), 1px border, .75rem/1.5rem padding
 *   --radius--large 16px (cards), medium/small 0px
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
   Left: Marvel's value. Right: Legacy's, and the role it plays.

   The one judgement call worth stating: Marvel ran TWO distinct blues — a deep
   teal for dark grounds and a mid teal for accents on light. Legacy has one
   dominant olive. Collapsing both onto #585b2f would make an eyebrow the same
   colour as the heading above it and lose the accent entirely, so the dark
   ground goes DARKER than brand (#3f411f) and the brand olive itself becomes
   the accent on light, where it measures 7.1:1 against white.

   Amber is not a text colour anywhere. #f99b1b on white is 2.16:1 and fails
   outright; it earns its place as a FILL (CTA, rules, marks) carrying dark
   olive text at 6.6:1.                                                       */
const COLORS = {
  // dark grounds and dark type
  '#00394d': '#3f411f', // deep teal -> deep olive: hero, CTA, is-navy, footer, dark headings
  '#005c7c': '#585b2f', // teal mid  -> brand olive: hero gradient midpoint
  '#222222': '#2b2d17', // near-black h2 -> near-black olive
  '#3f5058': '#4a4d36',
  // accents
  '#00769d': '#585b2f', // brand teal -> brand olive (eyebrows, rules, icons on light)
  '#00618a': '#43461f', // hover teal -> deeper olive
  '#8ed0e6': '#eaddca', // pale teal on dark -> skin, 5.3:1 on the olive ground
  '#f2b203': '#f99b1b', // star gold -> Legacy's own amber
  // tints and bands
  '#f0f9fd': '#fdf8ee', // pale blue band -> soft white
  '#f1f2f2': '#f4ece0', // grey band      -> light skin tint
  '#e8f4fa': '#f6efe4',
  '#eaf5fa': '#f6efe4',
  // lines and on-dark body text
  '#dce7ec': '#e2d8c6', // cool hairline -> warm hairline
  '#d3e2e9': '#ded2bd',
  '#cfe4ec': '#e8e2d4', // body text on dark
  // greys
  '#6b7b82': '#767a63', // sub-heading grey -> warm grey
  '#5c5c5c': '#54574a',
  '#9bb0b9': '#a9ac97',
};

/* ------------------------------------------------------------------ rgba ---
   Colour does not only appear as hex. Five of Marvel's teal declarations are
   written as `rgba(...)` because they carry an alpha — the header's own
   translucent ground among them — and a hex-only map walks straight past them.
   Missing these is invisible in a diff and obvious on the page: the palette
   reads Legacy everywhere except the one bar across the top.

   Keyed by the rgb triple, so any alpha on it is preserved.               */
const RGB = {
  '0, 57, 77': '63, 65, 31',      // #00394d deep teal -> #3f411f deep olive
  '142, 208, 230': '234, 221, 202', // #8ed0e6 pale teal -> #eaddca skin
};

const FONTS = {
  'Noto Serif': 'Cardo',    // display -> Legacy's heading serif
  Karla: 'Montserrat',      // body/UI -> Legacy's UI sans
};

/* ------------------------------------------------------------- rule patches ---
   Measured off legacydentalpasadena.com: headings are Cardo 700 UPPERCASE,
   h1 48px / h2 40px at lh 1.2, and buttons are square with a 1px border.
   Uppercase serif is the practice's loudest brand signal; a campaign page that
   sets it in sentence case does not read as theirs.                          */
const AMBER = '#f99b1b';
const OLIVE = '#585b2f';
const OLIVE_DEEP = '#3f411f';
const INK = '#2b2d17';
const CREAM = '#fdf8ee';
const SKIN = '#eaddca';

const PATCHES = [
  ['.camp_h1', {
    'font-family': 'Cardo', 'font-size': '48px', 'line-height': '1.2', 'font-weight': '700',
    'text-transform': 'uppercase', 'letter-spacing': 'normal', 'max-width': '640px',
  }],
  ['.camp_h2', {
    'font-family': 'Cardo', 'font-size': '40px', 'line-height': '1.2', 'font-weight': '700',
    'text-transform': 'uppercase', 'letter-spacing': 'normal', color: INK,
  }],
  ['.camp_h3', { 'font-family': 'Cardo', 'font-size': '20px', 'line-height': '1.4', 'font-weight': '700', color: OLIVE }],
  ['.camp_eyebrow', { 'font-family': 'Montserrat', 'font-size': '13px', 'font-weight': '600', 'letter-spacing': '0.14em', color: OLIVE }],
  ['.camp_section', { 'padding-top': '104px', 'padding-bottom': '104px' }],
  // Square, not pill: the practice's own buttons carry no radius at all.
  ['.camp_button', {
    'font-family': 'Montserrat', 'font-size': '14px', 'font-weight': '600', 'letter-spacing': '0.06em',
    'border-radius': '0px', 'min-height': '54px', 'padding-top': '15px', 'padding-bottom': '15px',
    'padding-left': '30px', 'padding-right': '30px',
    'background-color': AMBER, color: INK,
  }],
  ['.camp_button.is-light', { 'background-color': CREAM, color: OLIVE }],
  ['.camp_button.is-navy', { 'background-color': OLIVE, color: CREAM }],
  ['.camp_text-link', { 'font-family': 'Montserrat', 'font-size': '13px', 'font-weight': '600', 'letter-spacing': '0.04em' }],
  ['.camp_mobile-bar_link', { 'background-color': AMBER, color: INK, 'font-family': 'Montserrat', 'font-weight': '600' }],
  ['.camp_footer_heading', { color: SKIN }],
  /* The price chip is the single most important number on the page and it was
     cream on deep olive, sitting on an olive hero: technically legible, visually
     invisible. Amber is the brand's one warm accent and this is what it is for. */
  ['.camp_hero_promise', { 'background-color': AMBER, color: INK }],
  /* Both card kickers inherited the accent-on-LIGHT olive and then got placed on
     a deep-olive card top: #585b2f on #3f411f measures 1.46:1. Skin is 7.8:1. */
  ['.camp_offer-card_kicker', { color: SKIN }],
  ['.camp_form-card_kicker', { color: SKIN }],
  ['.camp_review_stars', { color: AMBER }],
  ['.camp_offer-card', { 'border-radius': '16px' }],   // --radius--large
  ['.camp_form-card', { 'border-radius': '16px' }],
  ['.camp_urgent-note', { 'border-left-color': AMBER }],
  ['.camp_check-icon', { color: OLIVE }],
  ['.camp_credential_check', { color: OLIVE }],
  ['.camp_faq_plus', { color: OLIVE }],
  ['.camp_benefit_number', { color: OLIVE }],
];

/* Responsive type steps. Cardo is a high-contrast serif with a small x-height,
   and set in caps it needs to shed size faster than a sans would. */
const STEPS = {
  991: { '.camp_h1': '40px', '.camp_h2': '34px' },
  767: { '.camp_h1': '34px', '.camp_h2': '28px' },
  479: { '.camp_h1': '29px', '.camp_h2': '24px' },
};

const report = [];
for (const file of FILES) {
  const p = path.join(HERE, file);
  const before = fs.readFileSync(p, 'utf8');
  let css = before;

  for (const [from, to] of Object.entries(COLORS)) {
    const re = new RegExp(from, 'gi');
    const hits = (css.match(re) || []).length;
    if (hits) report.push(`${file}: ${from} -> ${to} (${hits})`);
    css = css.replace(re, to);
  }
  for (const [from, to] of Object.entries(RGB)) {
    const re = new RegExp(from.replace(/, /g, ',\\s*'), 'g');
    const hits = (css.match(re) || []).length;
    if (hits) report.push(`${file}: rgb(${from}) -> rgb(${to}) (${hits})`);
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
    if (!m) { report.push(`${file}: no rule ${selector} here`); continue; }
    let body = m[3];
    for (const [prop, value] of Object.entries(props)) {
      const pre = new RegExp(`(\\n\\s*)${prop}: *[^;]+;`);
      if (pre.test(body)) body = body.replace(pre, `$1${prop}: ${value};`);
      else body = body.replace(/\s*$/, `\n  ${prop}: ${value};\n`);
    }
    css = css.replace(re, `$1$2${body}$4`);
  }

  // shorthand padding the patcher cannot see into
  css = css.replace(/(\.camp_section \{[^}]*?)padding: *112px 0px;/s, '$1padding: 104px 0px;');

  // responsive steps
  for (const [width, rules] of Object.entries(STEPS)) {
    for (const [selector, size] of Object.entries(rules)) {
      const re = new RegExp(`(@media screen and \\(max-width: ${width}px\\) \\{[\\s\\S]*?)${selector.replace('.', '\\.')} \\{ font-size: \\d+px; \\}`);
      if (re.test(css)) css = css.replace(re, `$1${selector} { font-size: ${size}; }`);
      else if (file === 'camp.css') report.push(`${file}: no ${selector} step at ${width}`);
    }
  }

  if (!CHECK && css !== before) fs.writeFileSync(p, css);
  report.push(`${file}: ${css === before ? 'unchanged' : (CHECK ? 'would change' : 'rewritten')}`);
}

console.log(report.join('\n'));

/* Nothing Marvel-coloured may survive — in the DECLARATIONS. Comments are
   stripped first on purpose: this layer's provenance is worth recording, and a
   gate that fails on the word "Marvel" in a header note pushes you to delete
   the history rather than the value. */
const leftovers = [];
for (const file of FILES) {
  const css = fs.readFileSync(path.join(HERE, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const from of Object.keys(COLORS)) if (css.toLowerCase().includes(from)) leftovers.push(`${file}: ${from}`);
  for (const from of Object.keys(RGB)) if (new RegExp(from.replace(/, /g, ',\\s*')).test(css)) leftovers.push(`${file}: rgb(${from})`);
  for (const from of Object.keys(FONTS)) if (css.includes(from)) leftovers.push(`${file}: ${from}`);
}
if (leftovers.length && !CHECK) {
  console.log('\nMARVEL VALUES REMAIN:\n  ' + leftovers.join('\n  '));
  process.exit(1);
}
console.log(CHECK ? '\ncheck only, nothing written' : '\nno Marvel colour or font remains');
