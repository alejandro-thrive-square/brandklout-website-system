#!/usr/bin/env node
/**
 * verify_styles.mjs — read every style back off the site and assert that each
 * rule in each page's `retheme-diff.json` actually holds its new value.
 *
 * Source Asana task GID: 1217040406855582
 *
 * WHY THIS EXISTS
 * ---------------
 * `data_style_tool` reports failures PER ACTION inside an otherwise successful
 * call, and at this volume it routinely refuses some ("Too Many Requests",
 * "[Conflict] ... style block store"). A push that reports success is not
 * evidence the re-theme landed. This asks the site.
 *
 * It also catches the shorthand trap in the other direction: Webflow stores
 * `background` and `background-color` as SEPARATE properties, so an earlier
 * shorthand write can leave a style holding the old colour next to the new one.
 * Any surviving old-palette value is reported as a leftover.
 *
 *   node verify_styles.mjs [--json <path>] [--repair <dir>]
 *
 * `--repair` writes push_styles-shaped batches containing ONLY the properties
 * that are actually missing, one directory per page, so a second pass costs a
 * handful of actions instead of re-sending three hundred.
 *
 * Exit 0 only when every rule matches.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { callTool } from './wfmcp.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = '6a60bdc0340e5f1784b4d553'; // Mason Park Dental — the boundary.
const PAGES = {
  invisalign: '6a75f467c7c9e1a0c133edd1',
  'new-patient-special': '6a75f468bfddad669aaf8321',
  'thank-you': '6a75f468c490cc1bb6fa6a8c',
};
const BPS = ['main', 'medium', 'small', 'tiny'];
const PSEUDOS = ['noPseudo', 'hover'];

// The pre-re-theme palette. Any of these still stored anywhere is a leftover.
const OLD = /#(a8875f|c3a98e|7f9a8b|1b2224|8a6c46|f4ece2|e6dccf|dfe4e6|fbf9f7|778386|e9edee)\b/i;
const OLD_FONTS = /\b(Outfit|DM Sans)\b/;

/** `font-family` stores one family; the diff carries the CSS stack. */
const firstFamily = (v) => v.split(',')[0].trim().replace(/^["']|["']$/g, '');

/** Read every style on the site, with breakpoints and the pseudos we use. */
async function allStyles(pageId) {
  const { text } = await callTool('data_style_tool', {
    siteId: SITE,
    pageId,
    context: 'Reads back every style so the applied re-theme can be verified rule by rule.',
    actions: [
      {
        label: 'all',
        get_styles: {
          query: 'all',
          include_properties: true,
          include_breakpoints: BPS,
          include_base_pseudos: PSEUDOS,
          include_breakpoints_pseudos: PSEUDOS,
        },
      },
    ],
  });
  const parsed = JSON.parse(text);
  return parsed.result ?? parsed;
}

/** {selector -> {breakpoint -> {pseudo -> {prop: value}}}} */
function index(styles) {
  const out = new Map();
  for (const s of styles) {
    const p = s.properties ?? {};
    const byBp = { main: { noPseudo: p.base?.properties ?? {} } };
    for (const [name, blk] of Object.entries(p.base?.pseudos ?? {})) {
      byBp.main[name] = blk.properties ?? blk;
    }
    for (const [bp, blk] of Object.entries(p.breakpoints ?? {})) {
      byBp[bp] = { noPseudo: blk.properties ?? {} };
      for (const [name, pb] of Object.entries(blk.pseudos ?? {})) {
        byBp[bp][name] = pb.properties ?? pb;
      }
    }
    out.set(s.selector, byBp);
  }
  return out;
}

const report = { pages: {}, leftovers: [] };
let bad = 0;

for (const [page, pageId] of Object.entries(PAGES)) {
  const styles = await allStyles(pageId);
  const idx = index(styles);

  // Old-palette sweep — done once, on the first page, since styles are site-wide.
  if (!report.leftovers.length && page === Object.keys(PAGES)[0]) {
    for (const s of styles) {
      for (const [bp, blk] of Object.entries(idx.get(s.selector) ?? {})) {
        for (const [ps, props] of Object.entries(blk)) {
          for (const [k, v] of Object.entries(props)) {
            if (OLD.test(String(v)) || (k === 'font-family' && OLD_FONTS.test(String(v)))) {
              report.leftovers.push({ selector: s.selector, bp, pseudo: ps, prop: k, value: v });
            }
          }
        }
      }
    }
  }

  const diff = JSON.parse(
    fs.readFileSync(path.join(HERE, page, 'whtml', 'retheme-diff.json'), 'utf8')
  ).actions;

  const misses = [];
  for (const rule of diff) {
    const selector = '.' + [...rule.parents, rule.style].join('.');
    const bp = rule.breakpoint;
    const ps = rule.pseudo ?? 'noPseudo';
    const stored = idx.get(selector)?.[bp]?.[ps];
    if (!stored) {
      misses.push({ selector, bp, pseudo: ps, reason: 'no such rule stored' });
      continue;
    }
    for (const [k, raw] of Object.entries(rule.properties)) {
      const want = k === 'font-family' ? firstFamily(raw) : raw;
      const got = stored[k];
      if (got === undefined) {
        misses.push({ selector, bp, pseudo: ps, prop: k, want, got: null });
      } else if (String(got).replace(/\s+/g, '') !== String(want).replace(/\s+/g, '')) {
        misses.push({ selector, bp, pseudo: ps, prop: k, want, got });
      }
    }
  }
  report.pages[page] = { rules: diff.length, mismatches: misses.length, misses: misses.slice(0, 60) };
  bad += misses.length;

  const repairFlag = process.argv.indexOf('--repair');
  if (repairFlag !== -1) {
    // Re-send only what is missing, grouped back into one action per rule.
    const byRule = new Map();
    for (const m of misses) {
      if (!m.prop) continue; // "no such rule stored" cannot be repaired by name
      const key = `${m.selector}|${m.bp}|${m.pseudo}`;
      if (!byRule.has(key)) byRule.set(key, []);
      byRule.get(key).push(m);
    }
    const actions = [...byRule.entries()].map(([key, props], i) => {
      const [selector, bp, ps] = key.split('|');
      const chain = selector.slice(1).split('.');
      const body = {
        style_name: chain.at(-1),
        breakpoint_id: bp,
        properties: props.map((p) => ({ property_name: p.prop, property_value: p.want })),
      };
      if (chain.length > 1) body.parent_style_names = chain.slice(0, -1);
      if (ps !== 'noPseudo') body.pseudo = ps;
      return { label: `${String(i).padStart(3, '0')} repair ${selector}@${bp}:${ps}`, update_style: body };
    });
    const dir = path.join(process.argv[repairFlag + 1], page);
    fs.mkdirSync(dir, { recursive: true });
    for (const f of fs.readdirSync(dir)) fs.unlinkSync(path.join(dir, f));
    for (let i = 0; i < actions.length; i += 20) {
      fs.writeFileSync(
        path.join(dir, `${i / 20 + 1}.json`),
        JSON.stringify(actions.slice(i, i + 20), null, 1)
      );
    }
    if (actions.length) console.log(`   repair batch: ${actions.length} rule(s) -> ${dir}`);
  }
}

const outFlag = process.argv.indexOf('--json');
if (outFlag !== -1) fs.writeFileSync(process.argv[outFlag + 1], JSON.stringify(report, null, 1));

for (const [page, r] of Object.entries(report.pages)) {
  console.log(`${page}: ${r.rules - r.mismatches}/${r.rules} rule-properties verified` +
    (r.mismatches ? ` — ${r.mismatches} MISMATCH(ES)` : ''));
  r.misses.slice(0, 12).forEach((m) =>
    console.log(`   ${m.selector}@${m.bp}:${m.pseudo} ${m.prop ?? ''} want=${m.want ?? m.reason} got=${m.got}`));
}
console.log(`old-palette leftovers: ${report.leftovers.length}`);
report.leftovers.slice(0, 15).forEach((l) =>
  console.log(`   ${l.selector}@${l.bp}:${l.pseudo} ${l.prop}=${l.value}`));

process.exitCode = bad || report.leftovers.length ? 1 : 0;
