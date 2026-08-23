/**
 * gen_tints.mjs — recolour the brand values the token layer cannot reach.
 *
 * Most of the design reads --cyan / --amber, so remapping those two tokens
 * turns the whole page over. A residue does not: rules that write the brand
 * hue as a LITERAL, nearly all of them low-alpha background tints —
 *
 *   .rule-list i     { background:rgba(3,197,236,.12) }
 *   .compare .is-best{ background:rgba(3,197,236,.09) }
 *   .quiz__opt:hover { background:rgba(3,197,236,.07) }
 *
 * — plus a scatter of per-page ones at half a dozen different alphas. Those
 * are invisible to a token swap and would have left cyan chips and cyan
 * table highlights on an otherwise cream page.
 *
 * Hand-listing them is exactly the sort of enumeration that goes stale and
 * silently misses a page, so read the six PUBLISHED pages instead and emit an
 * override for every rule that actually carries one. What is on the page is
 * the only reliable list of what is on the page.
 *
 *   node gen_tints.mjs          # writes tints-<page>.css
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const PAGES = {
  implants: 'dental-implants-ads-landing', aox: 'all-on-x-ads-landing',
  veneers: 'porcelain-veneers-ads-landing', emergency: 'emergency-dentist-ads-landing',
  'dentist-near-me': 'dentist-near-me-ads-landing', 'next-door': 'next-door-family-ads-landing',
};

/** Solid brand hues -> the practice's own. */
const SOLID = {
  '#03c5ec': '#C8B282', '#0299b6': '#A8905F', '#056b80': '#6F5A38',
  '#fb8e28': '#8C6946', '#d9700f': '#7A5B3D', '#a4530a': '#5A4128',
  '#8ee9ff': '#E3D5B8', '#0e2f60': '#8C6946',
  '#242a3a': '#403830', '#1a1f2c': '#2A231C',
};
/** Tint families, matched on the rgb triple whatever the alpha. */
const TINT = [
  { from: /rgba\(\s*3\s*,\s*197\s*,\s*236\s*,\s*([\d.]+)\s*\)/gi, to: [200, 178, 130] },
  { from: /rgba\(\s*2\s*,\s*153\s*,\s*182\s*,\s*([\d.]+)\s*\)/gi, to: [168, 144, 95] },
  { from: /rgba\(\s*251\s*,\s*142\s*,\s*40\s*,\s*([\d.]+)\s*\)/gi, to: [140, 105, 70] },
  { from: /rgba\(\s*217\s*,\s*112\s*,\s*15\s*,\s*([\d.]+)\s*\)/gi, to: [122, 91, 61] },
  { from: /rgba\(\s*14\s*,\s*47\s*,\s*96\s*,\s*([\d.]+)\s*\)/gi, to: [64, 56, 48] },
  /* The hero photo scrim is three stacked gradients of rgba(10,13,20,…) —
     the cold near-black. It survives the token remap untouched and reads
     blue-grey against a warm cream page. Same for the rgba(20,24,33,…) hairlines. */
  { from: /rgba\(\s*10\s*,\s*13\s*,\s*20\s*,\s*([\d.]+)\s*\)/gi, to: [42, 35, 28], keepAlpha: true },
  { from: /rgba\(\s*20\s*,\s*24\s*,\s*33\s*,\s*([\d.]+)\s*\)/gi, to: [64, 56, 48], keepAlpha: true },
];
/* Must list every triple in TINT, not just the accents. A rule carrying only
   a cold scrim — rgba(10,13,20,…) with no cyan beside it — was skipped
   entirely while this regex knew about the accents alone, and the swap it
   would have received never ran. */
const HAS_BRAND = /rgba\(\s*(?:3\s*,\s*197\s*,\s*236|2\s*,\s*153\s*,\s*182|251\s*,\s*142\s*,\s*40|217\s*,\s*112\s*,\s*15|14\s*,\s*47\s*,\s*96|10\s*,\s*13\s*,\s*20|20\s*,\s*24\s*,\s*33)\s*,|#03c5ec|#0299b6|#056b80|#fb8e28|#d9700f|#a4530a|#8ee9ff|#0e2f60|#242a3a|#1a1f2c/i;

function swap(decl) {
  let out = decl;
  for (const t of TINT) {
    out = out.replace(t.from, (_, a) => {
      /* Gold on cream is a fainter contrast than cyan on near-black was, so an
         accent tint carried over at its original alpha all but disappears:
         lift it by half, capped, rather than pick a number per rule. Scrims
         and hairlines are the opposite case and keep their exact alpha —
         lifting those would darken the hero photo and thicken every rule on
         the page. */
      const alpha = t.keepAlpha ? parseFloat(a)
        : Math.min(0.6, +(parseFloat(a) * 1.5).toFixed(3));
      return `rgba(${t.to.join(',')},${alpha})`;
    });
  }
  for (const [from, to] of Object.entries(SOLID)) {
    out = out.replace(new RegExp(from, 'gi'), to);
  }
  return out;
}

let grand = 0;
for (const [page, slug] of Object.entries(PAGES)) {
  const html = readFileSync(join(HERE, 'staging', `${slug}.html`), 'utf8');
  const rules = [];
  for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
    // Never read our own injected block back in.
    if (m[1].includes('published-page corrections') || m[1].includes('ARVADA LIGHT')) continue;
    const flat = m[1].replace(/\/\*[\s\S]*?\*\//g, '');
    for (const r of flat.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const sel = r[1].trim().replace(/\s+/g, ' ');
      const body = r[2].trim();
      if (!sel || sel.startsWith('@') || !HAS_BRAND.test(body)) continue;
      // Keep only the declarations that actually carry a brand literal —
      // re-emitting the whole rule would drag unrelated properties along and
      // re-assert them at a higher specificity.
      const kept = body.split(';').map((d) => d.trim()).filter(Boolean)
        .filter((d) => HAS_BRAND.test(d)).map(swap);
      if (!kept.length) continue;
      // :scope is meaningless outside the converter's block; #main restores
      // the specificity the original had plus an id.
      const outSel = sel.split(',').map((s) => `#main ${s.replace(/:scope\s*/g, '').trim()}`)
        .filter((s) => s !== '#main').join(',\n');
      if (!outSel) continue;
      rules.push(`${outSel}{${kept.join(';')}}`);
    }
  }
  const uniq = [...new Set(rules)];
  grand += uniq.length;
  const css = `/* Literal brand values on ${page}, recoloured to the practice's palette.
   GENERATED by gen_tints.mjs from the published page — do not hand-edit.
   These are the rules the token remap cannot reach, because they write the
   hue directly instead of reading --cyan / --amber. */\n${uniq.join('\n')}\n`;
  writeFileSync(join(HERE, `tints-${page}.css`), css);
  console.log(`${page.padEnd(18)} ${String(uniq.length).padStart(3)} rule(s)`);
}
console.log(`\n${grand} literal-brand rules recoloured`);
