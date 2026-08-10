#!/usr/bin/env node
/**
 * build_page_code.mjs — generate (and optionally install) the head custom code
 * each landing page needs so the published page renders like the local design.
 *
 * Two independent causes, two clearly separated parts in the output.
 *
 * PART 1 — RESTORED KIT RULES. The packager tree-shakes journey.css per
 * section, and 12-17 rules per page that DO match elements on the page were
 * dropped anyway: `*{box-sizing:border-box}` (600+ elements), the h1-h4 reset,
 * `.label`/`.eyebrow` sizing, `.faq__a>div{overflow:hidden}`, both
 * prefers-reduced-motion rules, and `[data-theme="light"] .card`. These are
 * discovered empirically by .tmp/missing_rules.mjs, which keeps only rules
 * whose selector actually matches something on the PUBLISHED page — so this is
 * evidence, not a guess, and it is re-derivable after any packager change.
 *
 * PART 2 — ENVIRONMENT NEUTRALISERS. The design is a bare page; the published
 * page sits under Webflow's normalize plus the client's own site stylesheet,
 * which styles bare tags the design never has to undo (li margins and padding,
 * blockquote/figure boxes, h3 at 40px). The design's headings are at UA default
 * sizes, so those are restored explicitly.
 *
 * Plus one paste artifact: Webflow copies an embedded element's class onto the
 * w-embed wrapper it generates, so the quiz options paste as a padded bordered
 * box nested inside an identical one. display:contents removes the wrapper.
 *
 * SCOPING. Bare-tag selectors are confined to the pasted subtree with
 * `[class*="<prefix>-"] `; already-namespaced class selectors are emitted
 * as-is so their specificity relationship with the chapter CSS is preserved.
 * Nothing here can reach the rest of the client's site.
 *
 *   node build_page_code.mjs            # write .tmp/page-code/<page>.css
 *   node build_page_code.mjs --install  # also PUT it into each page's head code
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { callTool } from './.tmp/wfmcp.mjs';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const TMP = join(HERE, '.tmp');
const OUT = join(TMP, 'page-code');
mkdirSync(OUT, { recursive: true });

const SITE = '693c51e685b19f0d0c149cab';
const PAGES = {
  implants: { slug: 'dental-implants-ads-landing', prefix: 'imp', id: '6a79f2aeabc1d37969522293' },
  aox: { slug: 'all-on-x-ads-landing', prefix: 'aox', id: '6a7a21d7f34df29a4defacdf' },
  veneers: { slug: 'porcelain-veneers-ads-landing', prefix: 'vnr', id: '6a7a21fef87845352663538f' },
  emergency: { slug: 'emergency-dentist-ads-landing', prefix: 'emg', id: '6a7a223bf8c58b0aa0c6af2e' },
  'dentist-near-me': { slug: 'dentist-near-me-ads-landing', prefix: 'dnm', id: '6a7a2268da766fb28cddb149' },
  'next-door': { slug: 'next-door-family-ads-landing', prefix: 'nxd', id: '6a7a228d106ed97b8a7885c9' },
};

const INSTALL = process.argv.includes('--install');
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));

/**
 * PART 0 — the house fluid root, on `html`.
 *
 * The packager rewrites every `rem` in the CSS to a multiple of `--wz-root`
 * precisely so it does not have to touch the document root. That works for
 * everything in a stylesheet — but journey.js writes `padding-block:
 * clamp(3rem,6vw,5rem)` onto each pinned chapter AS AN INLINE STYLE at
 * runtime, and a rem in an inline style resolves against `html` like any
 * other. The design's html is the fluid root (13.77px at 390); Webflow's is a
 * flat 16px. So the pinned chapters padded 48px instead of 41.31px on every
 * page, at every width where the two roots disagree — invisible at 1440,
 * where the fluid root happens to be 16.0015px.
 *
 * Installing the root here is safe in a way it would not be site-wide: this is
 * PAGE custom code, and these six pages contain nothing but the pasted
 * sections. The variables are renamed `--wzfr-*` so they cannot collide with
 * the client's own design-system tokens if that ever stops being true.
 *
 * Generated from deliver/process/04-design/fluid-root.md (webzite-house-v1);
 * scripts/fluid-root.mjs is the single source of truth for the curve.
 */
const FLUID_ROOT = `/* --- house fluid root (webzite-house-v1) --------------------------------
   journey.js writes rem-based padding inline at runtime, and a rem in an
   inline style resolves against html — so the page root has to match the
   design's or every pinned chapter pads wrong below 479 and above 1440. */
:root{
  --wzfr-font-from:18; --wzfr-font-to:20;
  --wzfr-vw-from:calc(1920 / 100); --wzfr-vw-to:calc(2400 / 100);
  --wzfr-coefficient:calc((var(--wzfr-font-to) - var(--wzfr-font-from)) / (var(--wzfr-vw-to) - var(--wzfr-vw-from)));
  --wzfr-base:calc((var(--wzfr-font-from) - var(--wzfr-vw-from) * var(--wzfr-coefficient)) / 16);
}
html{font-size:calc(var(--wzfr-base) * 1rem + var(--wzfr-coefficient) * 1vw)}
@media screen and (max-width:1920px){:root{
  --wzfr-font-from:16; --wzfr-font-to:18;
  --wzfr-vw-from:calc(1440 / 100); --wzfr-vw-to:calc(1920 / 100)}}
@media screen and (max-width:1440px){:root{
  --wzfr-font-from:16; --wzfr-font-to:16;
  --wzfr-vw-from:calc(479 / 100); --wzfr-vw-to:calc(1440 / 100)}}
@media screen and (max-width:479px){:root{
  --wzfr-font-from:12; --wzfr-font-to:16;
  --wzfr-vw-from:calc(320 / 100); --wzfr-vw-to:calc(479 / 100)}}
`;

/** Does this selector part already carry a namespaced class/id? */
const namespaced = (part, p) => part.includes(`.${p}-`) || part.includes(`#${p}-`);

/**
 * Confine a selector to the pasted subtree. A part that already carries the
 * page prefix is left alone — prefixing it again would change its specificity
 * relative to the chapter CSS that has to be able to override it.
 */
function scope(sel, p, force) {
  const S = `[class*="${p}-"]`;
  return sel.split(',').map((raw) => {
    const part = raw.trim();
    if (!part) return null;
    // strippedMain rules lost the `main` type selector journey.css used to
    // outrank the chapter CSS; re-scoping restores the weight it gave up.
    if (namespaced(part, p) && !force) return part;
    // `*` and `*::before` must also cover the scoping roots themselves.
    if (part === '*') return `${S},${S} *`;
    return `${S} ${part}`;
  }).filter(Boolean).join(',');
}

/**
 * The design sits on the fluid root (html ~16.0015px at 1440); the published
 * page's html is a flat 16px. The packager rewrote every rem to a multiple of
 * --wz-root for exactly this reason — restored rules must use the same
 * spelling or they drift at every viewport the two roots disagree on.
 */
const remToRoot = (body) => body.replace(/(-?[\d.]+)rem\b/g, (_, n) => `calc(${n} * var(--wz-root, 16px))`);

function partOne(page, prefix) {
  const f = join(TMP, `missing-${page}.json`);
  if (!existsSync(f)) throw new Error(`no missing-${page}.json — run .tmp/missing_rules.mjs first`);
  const rules = JSON.parse(readFileSync(f, 'utf8'));
  const plain = [], byMedia = new Map();
  for (const r of rules) {
    const css = `${scope(r.mapped, prefix, r.strippedMain)}{${remToRoot(r.body)}}`;
    if (r.media) { if (!byMedia.has(r.media)) byMedia.set(r.media, []); byMedia.get(r.media).push(css); }
    else plain.push(css);
  }
  const out = [`/* --- restored journey.css kit rules (${rules.length}) --------------------- */`, ...plain];
  for (const [m, list] of byMedia) out.push(`${m}{`, ...list.map((l) => '  ' + l), '}');
  return out.join('\n');
}

function partTwo(prefix) {
  const S = `[class*="${prefix}-"]`;
  return `
/* --- environment neutralisers ------------------------------------------
   The client's site stylesheet styles bare tags the design never has to
   undo. Weight is (0,1,1): above a bare tag rule, below any chapter rule. */
${S} :where(ul,ol,li){margin:0;padding:0}
/* border, not just margin/padding: the client's stylesheet gives every
   blockquote a border-left, and under box-sizing:border-box that 2.63px comes
   straight off the content width — enough to wrap one testimonial to a
   seventh line at 768. Nothing else on the page showed it. */
${S} :where(blockquote,figure){margin:0;padding:0;border:0}
${S} :where(label,fieldset,legend){margin:0;padding:0}
/* Webflow's normalize ships sub,sup{font-size:75%;line-height:0;position:
   relative;vertical-align:baseline} plus sup{top:-.5em}. The design is a bare
   page and gets the UA defaults instead, so its superscripts are 12.67px on a
   15.2px parent (font-size:smaller = 0.8333) with line-height inherited from
   the paragraph's unitless 1.7. line-height:inherit is right, not a fixed
   value: a unitless line-height inherits as the NUMBER, so the sup recomputes
   it against its own smaller font-size. */
${S} :where(sub,sup){font-size:smaller;line-height:inherit;position:static;top:auto;bottom:auto}
${S} :where(sup){vertical-align:super}
${S} :where(sub){vertical-align:sub}
/* The design's unclassed headings sit at UA default sizes; the client's
   stylesheet forces h3 to 40px, which is 2.2x the design. */
${S} :where(h1){font-size:2em}
${S} :where(h2){font-size:1.5em}
${S} :where(h3){font-size:1.17em}
${S} :where(h4){font-size:1em}

/* --- paste artifact ------------------------------------------------------
   Webflow copies an embedded element's class onto the w-embed wrapper it
   generates, so e.g. the quiz options paste as
     <div class="${prefix}-quiz__opt w-embed"><button class="${prefix}-quiz__opt">
   and render as a padded, bordered box inside an identical one. The design has
   no wrapper at all, so the wrapper is removed from layout.

   The [class*=] on the WRAPPER is the discriminator, and it must not be
   widened to all w-embeds. Only a wrapper that duplicated its child's class is
   drawing a box; the plain <div class="w-embed"> around each inline SVG is
   inert, and giving THAT display:contents promotes the svg to a grid item
   whose auto track then measures 370px instead of the icon's 18px — it breaks
   every .rule-list and .checks row on the page. Measured, not assumed:
   .tmp/bisect.mjs.

   The 'div' is load-bearing too: without it this ties with the chapter's own
   class rule at (0,2,0) and loses on source order, since chapter <style>
   blocks sit in <body> and this is in <head>. */
div.w-embed[class*="${prefix}-"]{display:contents}
`;
}

/**
 * PART 3 — inline styles the paste dropped. The design pages carry 8-10
 * `style="..."` attributes each (the footer paragraphs' .9rem, the eyebrow's
 * --cyan-ink, the hero image's object-position, margin:0 on figures) and
 * Webflow keeps exactly one style attribute on the whole pasted page.
 *
 * Selectors come from .tmp/inline_styles.mjs, which computes them in the
 * design's own DOM and then verifies each one matches the SAME number of
 * elements on the published page before allowing it through.
 *
 * WEIGHT. An inline style outranks every author rule, so a plain rule in
 * <head> would lose to the chapter CSS in <body> that the inline style existed
 * to override. `:not(#id)` contributes its argument's specificity while always
 * matching, so appending it twice adds (2,0,0) — comfortably above anything
 * here, still below a real !important. Repeating the last compound instead
 * would be shape-dependent and produces invalid CSS the moment a selector ends
 * in a bare tag: `p:nth-of-type(1)` cannot be written three times.
 */
const BOOST = ':not(#wz-no-such-id):not(#wz-no-such-id)';
function partThree(page) {
  const f = join(TMP, 'inline-styles.json');
  if (!existsSync(f)) return '';
  const entry = JSON.parse(readFileSync(f, 'utf8'))[page];
  if (!entry || !entry.keep.length) return '';
  const lines = entry.keep.map((k) => `${k.mapped}${BOOST}{${remToRoot(k.style)}}`);
  return `
/* --- inline styles dropped by the paste (${entry.keep.length}) ---------------- */
${lines.join('\n')}
`;
}

/**
 * PART 4 — root-class collisions.
 *
 * The packager names a section's root class after the section id, and it also
 * page-prefixes every kit class. When a section id equals a kit class name the
 * two land on the same name and the section inherits styling meant for
 * something else. dentist-near-me has `<section id="offer">`, the kit has an
 * `.offer` OFFER CARD (gradient, border, radius, padding, display:grid), and
 * both became `.dnm-offer` — so the section is painted as a card. That page
 * has no `.offer` card element at all, so the rule should have been
 * tree-shaken; the collision is what kept it alive.
 *
 * Overridden here on the SECTION only, at (0,1,1), restoring the values the
 * design computes. The section's own `:scope` rules are (0,1,0) and would lose
 * to this, so only the properties the card rule actually sets are listed —
 * never a blanket reset.
 *
 * The real fix belongs in the packager: a section root class must not collide
 * with a kit class name. Until then, new pages need checking for this.
 */
const COLLISIONS = {
  'dentist-near-me': `section.dnm-offer{display:block;grid-template-columns:none;
  padding:0;border-radius:0;border-width:0;border-color:rgb(59,70,87)}`,
};

function partFour(page) {
  const css = COLLISIONS[page];
  return css ? `\n/* --- root-class collisions ---------------------------------------------- */\n${css}\n` : '';
}

const pages = only.length ? only : Object.keys(PAGES);
for (const page of pages) {
  const { prefix, id } = PAGES[page];
  const css = `/* Webzite — published-page corrections for ${page}.
   GENERATED by build_page_code.mjs. Regenerate rather than hand-editing:
   re-run .tmp/missing_rules.mjs and .tmp/inline_styles.mjs, then this script. */
${FLUID_ROOT}
${partOne(page, prefix)}
${partTwo(prefix)}
${partThree(page)}
${partFour(page)}`;
  const file = join(OUT, `${page}.css`);
  writeFileSync(file, css);
  console.log(`${page.padEnd(17)} ${String(css.length).padStart(5)} bytes -> ${file}`);

  if (INSTALL) {
    const { text } = await callTool('data_scripts_tool', {
      actions: [{
        label: 'set', set_page_freeform_code: {
          page_id: id, location: 'head', content: `<style>\n${css}\n</style>`,
        },
      }],
    });
    const bad = /"status"\s*:\s*"error"/.test(text) || /error/i.test(text.slice(0, 120));
    console.log(`   ${bad ? 'FAILED: ' + text.slice(0, 300) : 'installed into head custom code'}`);
  }
}
