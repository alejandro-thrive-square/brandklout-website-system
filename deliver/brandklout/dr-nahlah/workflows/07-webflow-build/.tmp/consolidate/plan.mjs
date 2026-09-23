#!/usr/bin/env node
/**
 * plan.mjs — decide which forked classes collapse into which canonical class,
 * and exactly which elements get rewritten. READ-ONLY: writes plan.json and
 * PLAN.md for review. Nothing is sent to Webflow.
 *
 *   node plan.mjs            # uses site.css + elements.json in this folder
 *
 * Inputs
 *   site.css       the PUBLISHED stylesheet (fetch.sh writes it). Authoritative
 *                  for every selector's properties at every breakpoint, and
 *                  free of API quota.
 *   elements.json  every element with its Designer style NAMES.
 *
 * The two are joined by Webflow's naming rule: selector = name with spaces
 * replaced by hyphens. That is asserted per name, not assumed.
 */
import fs from 'node:fs';

const OUT_PLAN = 'plan.json';
const OUT_MD = 'PLAN.md';

// ---------------------------------------------------------------------------
// CSS parsing
// ---------------------------------------------------------------------------
function parseCss(css) {
  const media = [];
  for (const m of css.matchAll(/@media[^{]*\{/g)) {
    let d = 1, j = m.index + m[0].length;
    while (d > 0 && j < css.length) { if (css[j] === '{') d++; else if (css[j] === '}') d--; j++; }
    media.push([m.index, j, m[0].replace('@media screen and ', '').replace(/[{ ]/g, '')]);
  }
  const ctx = (p) => { for (const [s, e, q] of media) if (p >= s && p < e) return q; return 'BASE'; };

  const single = new Map();   // ".cls" -> { media: sortedProps }
  const combos = [];          // { base, combo, media, props }
  for (const m of css.matchAll(/([^{}@]+)\{([^{}]*)\}/g)) {
    const sel = m[1].trim();
    const props = m[2].split(';').map((s) => s.trim()).filter(Boolean).sort();
    if (/^\.[A-Za-z0-9_-]+$/.test(sel)) {
      const cls = sel.slice(1);
      if (!single.has(cls)) single.set(cls, {});
      single.get(cls)[ctx(m.index)] = props;
    }
    const cm = sel.match(/^\.([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/);
    if (cm) combos.push({ base: cm[1], combo: cm[2], media: ctx(m.index), props });
  }
  return { single, combos };
}

const sigOf = (byMedia) =>
  JSON.stringify(Object.entries(byMedia ?? {}).sort(([a], [b]) => a.localeCompare(b)));

// Auto-generated "<pagePrefix>-<htmlTag>[-N]" names. Their definitions match
// only because the design is consistent; they are per-element names, not
// components. Merging them would fuse unrelated elements under one meaningless
// name. Excluded by agreement.
const TAG = '(?:div|span|a|i|b|p|h[1-6]|img|ul|ol|li|button|header|section|strong|em|figure|figcaption|dt|dd|label|form|input|video|details|summary|nav|main|footer|aside|blockquote|small|sup|sub|hr|br|table|td|th|tr)';
const CONVERTER = new RegExp(`^[a-z0-9-]*?-${TAG}(?:-\\d+)*$`);

function main() {
  const css = fs.readFileSync('site.css', 'utf8');
  const { single, combos } = parseCss(css);
  const pagesEl = JSON.parse(fs.readFileSync('elements.json', 'utf8'));

  // ---- name <-> selector -------------------------------------------------
  const nameToSel = new Map();
  const selToNames = new Map();
  const allNames = new Set();
  for (const p of Object.values(pagesEl)) for (const el of p.elements ?? []) for (const n of el.styleNames) allNames.add(n);
  for (const n of allNames) {
    const sel = n.replace(/\s+/g, '-');
    nameToSel.set(n, sel);
    if (!selToNames.has(sel)) selToNames.set(sel, []);
    selToNames.get(sel).push(n);
  }
  const ambiguousMapping = [...selToNames.entries()].filter(([, ns]) => ns.length > 1);
  const missingInCss = [...nameToSel.entries()].filter(([, s]) => !single.has(s)).map(([n]) => n);

  // ---- bucket by identical definition ------------------------------------
  const inUse = new Set([...nameToSel.values()]);
  const buckets = new Map();
  for (const [cls, byMedia] of single) {
    if (!inUse.has(cls)) continue;               // only classes actually applied
    if (cls.startsWith('w-') || cls.startsWith('zz-')) continue;
    const k = sigOf(byMedia);
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k).push(cls);
  }

  // combo index: which combo names hang off a base class
  const combosByBase = new Map();
  const comboDefs = new Map();                   // "base|combo" -> {media:props}
  for (const c of combos) {
    if (!combosByBase.has(c.base)) combosByBase.set(c.base, new Set());
    combosByBase.get(c.base).add(c.combo);
    const k = `${c.base}|${c.combo}`;
    if (!comboDefs.has(k)) comboDefs.set(k, {});
    comboDefs.get(k)[c.media] = c.props;
  }
  // names shared by a global class AND some combo -> set_style cannot resolve
  const comboNames = new Set(combos.map((c) => c.combo));

  const ambiguousSelectors = new Set(ambiguousMapping.map(([s]) => s));

  const families = [], skipped = [];
  for (const members of buckets.values()) {
    if (members.length < 2) continue;
    if (members.every((c) => CONVERTER.test(c))) { skipped.push({ members, why: 'converter tag-names (out of scope)' }); continue; }
    if (members.some((c) => CONVERTER.test(c))) { skipped.push({ members, why: 'mixed named/converter bucket — coincidental match' }); continue; }

    // Webflow sanitises a class name to its selector by replacing spaces with
    // hyphens, so "btn-after 2" and "btn-after-2" are two DISTINCT Designer
    // classes that share one selector. The published CSS cannot tell them
    // apart, so a merge here could retire the wrong one. Refuse.
    const ambig = members.filter((c) => ambiguousSelectors.has(c));
    if (ambig.length) { skipped.push({ members, why: `selector shared by more than one Designer name: ${ambig.join(', ')}`, }); continue; }

    // An identical definition is NOT enough. `creds-more-after` and
    // `pk-more-after` are byte-identical but are different components; merging
    // them would tie the credentials block to the package block forever. Only
    // merge classes that are numbered variants of the SAME stem — that is what
    // "the converter forked this class per page" actually looks like.
    const stems = new Set(members.map((c) => c.replace(/-\d+$/, '')));
    if (stems.size > 1) {
      skipped.push({ members, why: `identical definitions but different components (stems: ${[...stems].join(', ')})` });
      continue;
    }
    // Relume style-guide classes are shared library styles on a draft page.
    // Retiring one would edit the kit, not this build.
    if (members.some((c) => /_|^rl-|^slider-|^navbar/.test(c))) {
      skipped.push({ members, why: 'looks like a Relume library class — left alone' });
      continue;
    }

    // Canonical = the un-numbered name. Prefer it even when it is applied to no
    // element (it still exists as a style, and it is the name a human expects);
    // `members` only holds applied classes, so check the full stylesheet too.
    const stem = members[0].replace(/-\d+$/, '');
    const stemIsUsable = single.has(stem)
      && sigOf(single.get(stem)) === sigOf(single.get(members[0]))
      && !ambiguousSelectors.has(stem);
    const canonical = stemIsUsable ? stem : [...members].sort((a, b) =>
      (/-\d+$/.test(a) - /-\d+$/.test(b)) || a.length - b.length || a.localeCompare(b))[0];
    const forks = members.filter((c) => c !== canonical);
    if (!forks.length) continue;

    // combo reconciliation: every combo on a fork must exist identically on the
    // canonical, or merging silently changes rendering.
    const conflicts = [];
    for (const f of forks) {
      for (const cb of combosByBase.get(f) ?? []) {
        const a = sigOf(comboDefs.get(`${f}|${cb}`));
        const b = sigOf(comboDefs.get(`${canonical}|${cb}`));
        if (a !== b) conflicts.push({ fork: f, combo: cb, canonicalHasIt: comboDefs.has(`${canonical}|${cb}`) });
      }
    }
    if (conflicts.length) { skipped.push({ members, why: 'combo definitions differ between fork and canonical', conflicts }); continue; }

    families.push({
      canonical, forks,
      canonicalNameIsAlsoACombo: comboNames.has(canonical),
      redundantCombosToDelete: comboNames.has(canonical)
        ? combos.filter((c) => c.combo === canonical)
            .map((c) => ({ base: c.base, combo: c.combo,
                           identicalToBase: sigOf(comboDefs.get(`${c.base}|${c.combo}`)) === sigOf(single.get(canonical)) }))
            .filter((v, i, arr) => arr.findIndex((x) => x.base === v.base) === i)
        : [],
    });
  }

  // ---- per-element rewrites ----------------------------------------------
  const selToCanonicalSel = new Map();
  for (const f of families) for (const fork of f.forks) selToCanonicalSel.set(fork, f.canonical);
  const selToName = new Map();
  for (const [n, s] of nameToSel) if (!selToName.has(s)) selToName.set(s, n);

  const rewrites = [];
  for (const [pageId, p] of Object.entries(pagesEl)) {
    for (const el of p.elements ?? []) {
      const before = el.styleNames;
      const after = [];
      let touched = false;
      for (const n of before) {
        const sel = nameToSel.get(n);
        const canonSel = selToCanonicalSel.get(sel);
        if (canonSel) {
          touched = true;
          const canonName = selToName.get(canonSel) ?? canonSel;
          if (!after.includes(canonName)) after.push(canonName);
        } else if (!after.includes(n)) after.push(n);
      }
      if (touched) rewrites.push({ pageId, page: p.title, id: el.id, type: el.type, before, after });
    }
  }

  const plan = {
    generated: 'plan.mjs',
    pagesCaptured: Object.values(pagesEl).filter((p) => p.elements?.length).length,
    pagesMissing: Object.entries(pagesEl).filter(([, p]) => !p.elements?.length).map(([, p]) => p.title),
    families, skipped, rewrites,
    // selector -> Designer name, taken from what is actually applied to
    // elements. remove_style takes the NAME ("pk-more 7"), not the selector
    // (".pk-more-7"), and the two are not derivable from each other safely.
    forkNames: Object.fromEntries([...selToName.entries()]),
    diagnostics: { ambiguousMapping, missingInCss: missingInCss.slice(0, 40), missingInCssCount: missingInCss.length },
  };
  fs.writeFileSync(OUT_PLAN, JSON.stringify(plan, null, 2));

  // ---- report ------------------------------------------------------------
  const L = [];
  L.push('# Class consolidation plan\n');
  L.push(`- pages captured: **${plan.pagesCaptured}**` + (plan.pagesMissing.length ? ` (MISSING: ${plan.pagesMissing.join(', ')})` : ''));
  L.push(`- families to consolidate: **${families.length}**`);
  L.push(`- classes to retire: **${families.reduce((a, f) => a + f.forks.length, 0)}**`);
  L.push(`- elements to rewrite: **${rewrites.length}**`);
  L.push(`- buckets skipped: **${skipped.length}**\n`);
  if (ambiguousMapping.length) {
    L.push('> [!WARNING]\n> Names collapsing to the same selector: ' +
      ambiguousMapping.map(([s, ns]) => `\`${s}\` <- ${ns.map((n) => `"${n}"`).join(', ')}`).join('; ') + '\n');
  }
  if (missingInCss.length) L.push(`> [!NOTE]\n> ${missingInCss.length} applied names have no rule in the published CSS (empty classes): ${missingInCss.slice(0, 10).join(', ')}${missingInCss.length > 10 ? ' …' : ''}\n`);
  L.push('## Families\n');
  L.push('| canonical | forks | elements | prerequisite |');
  L.push('| :--- | ---: | ---: | :--- |');
  for (const f of families.sort((a, b) => b.forks.length - a.forks.length)) {
    const n = rewrites.filter((r) => f.forks.includes(nameToSel.get(r.before.find((x) => f.forks.includes(nameToSel.get(x)))))).length;
    const pre = f.canonicalNameIsAlsoACombo
      ? `delete ${f.redundantCombosToDelete.length} redundant combo(s): ${f.redundantCombosToDelete.map((c) => `.${c.base}.${c.combo}${c.identicalToBase ? '' : ' **DIFFERS**'}`).join(', ')}`
      : '';
    L.push(`| \`${f.canonical}\` | ${f.forks.length} | ${n} | ${pre} |`);
  }
  L.push('\n## Skipped buckets\n');
  for (const s of skipped) L.push(`- ${s.why}: ${s.members.slice(0, 6).map((m) => `\`${m}\``).join(', ')}${s.members.length > 6 ? ` (+${s.members.length - 6})` : ''}`);
  fs.writeFileSync(OUT_MD, L.join('\n') + '\n');

  console.log(`families ${families.length} | retire ${families.reduce((a, f) => a + f.forks.length, 0)} classes | rewrite ${rewrites.length} elements | skipped ${skipped.length}`);
  if (plan.pagesMissing.length) console.error(`!! pages missing from the snapshot: ${plan.pagesMissing.join(', ')}`);
}

main();
