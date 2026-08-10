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

/** Does this selector part already carry a namespaced class/id? */
const namespaced = (part, p) => part.includes(`.${p}-`) || part.includes(`#${p}-`);

/**
 * Confine a selector to the pasted subtree. A part that already carries the
 * page prefix is left alone — prefixing it again would change its specificity
 * relative to the chapter CSS that has to be able to override it.
 */
function scope(sel, p) {
  const S = `[class*="${p}-"]`;
  return sel.split(',').map((raw) => {
    const part = raw.trim();
    if (!part) return null;
    if (namespaced(part, p)) return part;
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
    const css = `${scope(r.mapped, prefix)}{${remToRoot(r.body)}}`;
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
${S} :where(blockquote,figure){margin:0;padding:0}
${S} :where(label,fieldset,legend){margin:0;padding:0}
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

const pages = only.length ? only : Object.keys(PAGES);
for (const page of pages) {
  const { prefix, id } = PAGES[page];
  const css = `/* Webzite — published-page corrections for ${page}.
   GENERATED by build_page_code.mjs. Regenerate rather than hand-editing:
   re-run .tmp/missing_rules.mjs then this script. */
${partOne(page, prefix)}
${partTwo(prefix)}`;
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
