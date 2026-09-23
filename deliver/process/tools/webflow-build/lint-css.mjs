#!/usr/bin/env node
/**
 * lint-css.mjs — gate a stylesheet against the Webflow-safe dialect BEFORE data_whtml_builder.
 *
 * Promoted 2026-09-23 from legacy-dental-pasadena/workflows/07-webflow-build/.tmp/native/lint-css.mjs
 * (near-identical copies ran on arvada-dental-center v2-native and marvel-dental). Generalised:
 * the installed font list was hardcoded per client; it is now --fonts.
 *
 * Every rule here is one data_whtml_builder enforces by REJECTING the whole call, or by accepting
 * it and producing something the Designer cannot edit. A rejected call can leave half-built,
 * classless elements behind, so run this first.
 *
 *   node lint-css.mjs <file.css> [more.css ...] --fonts "karla,noto serif"
 *   node lint-css.mjs <file.css> --no-fonts          skip the font check
 * Read the site's installed families off existing styles (data_style_tool) or Site settings.
 * Exit 1 on any error. Warnings do not fail the gate.
 */
import fs from 'node:fs';

const ALLOWED_MEDIA = new Set([
  'screen and (max-width: 991px)',
  'screen and (max-width: 767px)',
  'screen and (max-width: 479px)',
  'screen and (min-width: 1280px)',
  'screen and (min-width: 1440px)',
  'screen and (min-width: 1920px)',
]);

const argv = process.argv.slice(2);
const fi = argv.indexOf('--fonts');
const NO_FONTS = argv.includes('--no-fonts');
const FILES = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--fonts');
if (!FILES.length || (fi < 0 && !NO_FONTS)) {
  console.error('usage: lint-css.mjs <file.css> [...] --fonts "family,family" | --no-fonts');
  process.exit(2);
}
// Font families installed on THIS site. A family not installed is dropped with a missing_font
// warning and the declaration is lost.
const INSTALLED_FONTS = new Set([
  ...(fi >= 0 ? argv[fi + 1].split(',').map((s) => s.trim().toLowerCase()) : []),
  'arial', 'verdana', 'tahoma', 'helvetica', 'sans-serif', 'serif', 'monospace', 'inherit', 'system-ui',
]);

const errors = [];
const warnings = [];

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Split a stylesheet into {selector, body, media} records. */
function parseRules(css) {
  const out = [];
  const re = /(@media[^{]+)\{([\s\S]*?)\n\}/g;   // top-level media blocks
  let rest = css;
  let m;
  while ((m = re.exec(css))) {
    const media = m[1].replace(/^@media\s*/, '').trim();
    for (const r of splitFlat(m[2])) out.push({ ...r, media });
    rest = rest.replace(m[0], '');
  }
  for (const r of splitFlat(rest)) out.push({ ...r, media: null });
  return out;
}

function splitFlat(css) {
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(css))) {
    const sel = m[1].trim();
    if (!sel || sel.startsWith('@')) continue;
    out.push({ selector: sel, body: m[2] });
  }
  return out;
}

for (const file of FILES) {
  const css = stripComments(fs.readFileSync(file, 'utf8'));
  const rules = parseRules(css);

  // --- media queries must be spelled exactly ------------------------------
  for (const m of css.matchAll(/@media([^{]+)\{/g)) {
    const q = m[1].trim();
    if (!ALLOWED_MEDIA.has(q)) {
      errors.push(`${file}: media query "${q}" is not one Webflow accepts.\n    use exactly: ${[...ALLOWED_MEDIA].join(' | ')}`);
    }
  }

  // --- @font-face / @keyframes / @supports cannot be a class --------------
  for (const m of css.matchAll(/@(font-face|keyframes|supports|import)\b/g)) {
    errors.push(`${file}: @${m[1]} cannot become a Webflow class — remove it, or install the font in Webflow.`);
  }

  for (const { selector, body, media } of rules) {
    const where = `${file}${media ? ` @media ${media}` : ''}: "${selector}"`;

    for (const sel of selector.split(',').map((s) => s.trim())) {
      // pseudo-ELEMENTS are rejected outright
      if (/::/.test(sel) || /:(before|after|first-line|first-letter|marker|placeholder|selection)\b/.test(sel)) {
        errors.push(`${where}\n    pseudo-element — add a real child element with its own class instead.`);
      }
      // structural pseudo-classes have no Webflow equivalent
      if (/:(nth-child|nth-of-type|nth-last-child|first-child|last-child|only-child|first-of-type|last-of-type|not|is|where|has)\b/.test(sel)) {
        errors.push(`${where}\n    structural pseudo-class — use an is-* combo class on the element instead.`);
      }
      // combinators: Webflow styles one element, not a relationship
      if (/[>+~]/.test(sel) || /\.\S+\s+\S/.test(sel.replace(/\.[\w-]+(\.[\w-]+)*/g, (x) => x.replace(/\s/g, '')))) {
        const compact = sel.replace(/\s*([>+~])\s*/g, '$1');
        if (/[>+~]/.test(compact) || /\s/.test(sel.trim())) {
          errors.push(`${where}\n    descendant/child/sibling selector — Webflow styles one element. Move the rule onto that element as an is-* combo.`);
        }
      }
      // attribute selectors (e.g. [open]) are not expressible either
      if (/\[[^\]]+\]/.test(sel)) {
        errors.push(`${where}\n    attribute selector — not expressible as a Webflow class.`);
      }
      // bare tag names merge site-wide and corrupt other pages
      if (/^[a-z][a-z0-9]*$/i.test(sel)) {
        errors.push(`${where}\n    bare tag selector — Webflow merges by name site-wide. Give it a class.`);
      }
    }

    // --- CSS functions are stored verbatim and read as 0 in the panel -----
    for (const m of body.matchAll(/\b(clamp|min|max|calc)\s*\(/g)) {
      // gradients legitimately contain no arithmetic; only flag the value functions
      errors.push(`${where}\n    ${m[1]}() — resolve to concrete values per breakpoint; the style panel cannot parse it and shows 0.`);
    }

    // --- a bare 0 before a negative length is silently corrupted ----------
    // Webflow drops the separating space, storing `0 -8px 25px …` as
    // `0-8px 25px …` — invalid CSS, so the shadow/offset simply never paints.
    // Measured on box-shadow; `0px -8px` round-trips correctly.
    for (const d of body.split(';')) {
      if (/(^|[\s:(])0\s+-\d/.test(d)) {
        errors.push(`${where}\n    "${d.trim()}" — a bare 0 before a negative length loses its space in Webflow ("0-8px"). Write 0px.`);
      }
    }

    // --- fonts must be installed -----------------------------------------
    const ff = body.match(/font-family\s*:\s*([^;]+)/i);
    if (ff && !NO_FONTS) {
      for (const name of ff[1].split(',')) {
        const n = name.trim().replace(/^["']|["']$/g, '').toLowerCase();
        if (n && !INSTALLED_FONTS.has(n)) {
          errors.push(`${where}\n    font-family "${name.trim()}" is not installed in Webflow — the declaration will be dropped.`);
        }
      }
    }
    // the `font:` shorthand hides a family from the check above
    if (/(^|;)\s*font\s*:/.test(body)) {
      warnings.push(`${where}\n    \`font:\` shorthand — expand it; the family inside is not checked and Webflow stores shorthands unevenly.`);
    }
  }
}

for (const w of warnings) console.log('WARN  ' + w);
for (const e of errors) console.log('ERROR ' + e);
console.log(`\n${errors.length} error(s), ${warnings.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
