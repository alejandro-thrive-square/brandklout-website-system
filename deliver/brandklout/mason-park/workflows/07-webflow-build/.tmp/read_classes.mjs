// read_classes.mjs — dump what the SITE actually stores for named classes.
//
// The parity gates say what the browser renders; this says what Webflow holds,
// which is the thing update_style has to change. Always through wfstyles.mjs —
// get_styles returns only the base breakpoint and no pseudo states unless you
// opt in, and a wrong parse path returns [] that reads as "empty site".
//
// Usage: node read_classes.mjs chip offer-rail btn--ghost ...
// Source Asana task GID: 1217040406855582
import { liveStyles } from './wfstyles.mjs';

const want = process.argv.slice(2);
if (!want.length) { console.error('usage: node read_classes.mjs <class> [class...]'); process.exit(1); }

const all = await liveStyles('read named classes');
console.log(`site holds ${all.length} style records\n`);

const norm = (s) => String(s || '').trim();
for (const w of want) {
  const hits = all.filter((s) => {
    const n = norm(s.name || s.styleName || s.label);
    return n === w || n.split(/\s+/).includes(w) || n.replace(/\s+/g, '-') === w;
  });
  console.log('='.repeat(70));
  console.log(`CLASS  ${w}   — ${hits.length} record(s)`);
  if (!hits.length) { console.log('  (no record with this name)'); continue; }
  for (const h of hits) {
    console.log(`  name="${h.name || h.styleName}"  id=${h.id || h.styleId || '?'}` +
      (h.comboClassNames || h.parentStyleNames ? `  combo-of=${JSON.stringify(h.comboClassNames || h.parentStyleNames)}` : ''));
    const base = h.properties || h.base?.properties || h.base || {};
    const keys = Object.keys(base).filter((k) => typeof base[k] !== 'object');
    if (keys.length) {
      console.log('    base:');
      keys.sort().forEach((k) => console.log(`      ${k}: ${base[k]}`));
    } else {
      console.log('    base: (none)');
    }
    const bps = h.breakpoints || h.base?.breakpoints || {};
    for (const [bp, v] of Object.entries(bps)) {
      const p = v?.properties || v || {};
      const ks = Object.keys(p).filter((k) => typeof p[k] !== 'object');
      if (ks.length) console.log(`    @${bp}: ` + ks.sort().map((k) => `${k}: ${p[k]}`).join('; '));
    }
    const ps = h.pseudos || h.base?.pseudos || {};
    for (const [name, p] of Object.entries(ps)) {
      const ks = Object.keys(p || {}).filter((k) => typeof p[k] !== 'object');
      if (ks.length) console.log(`    :${name}: ` + ks.sort().map((k) => `${k}: ${p[k]}`).join('; '));
    }
  }
}
