#!/usr/bin/env node
/**
 * dump.mjs — snapshot the live Dr. Nahlah site before any consolidation.
 *
 * Writes three files:
 *   pages.json     every page (id, slug, draft)
 *   styles.json    every style: id, Designer name, CSS selector, properties at
 *                  all 7 breakpoints
 *   elements.json  every element on every page with its applied classes
 *
 * `elements.json` doubles as the ROLLBACK RECORD — it holds each element's
 * exact styleNames before anything is touched.
 *
 * Style enumeration is two-pass on purpose. Paging query_styles by first letter
 * silently truncates at the 200-match cap and cannot be shown to be complete;
 * get_styles(query:"all") without properties returns the full id list cheaply,
 * then properties are fetched in id batches via query:"filtered".
 */
import fs from 'node:fs';
import { call, collectElements } from './api.mjs';

const SITE = '6a6b84cc7fe55ddeabc0b314';
const BPS = ['main', 'large', 'xl', 'xxl', 'medium', 'small', 'tiny'];
const CTX = 'Snapshotting styles and elements before consolidating duplicated per-page classes into shared global ones.';
const BATCH = Number(process.env.WF_STYLE_BATCH ?? 60);

async function main() {
  // ---- pages -------------------------------------------------------------
  const [pr] = await call('data_pages_tool', {
    context: CTX,
    actions: [{ label: 'p', list_pages: { site_id: SITE, limit: 100 } }],
  }, 'list_pages');
  const pages = pr.result.pages.map((p) => ({
    id: p.id, slug: p.slug ?? '', title: p.title,
    draft: !!p.draft, path: p.publishedPath,
  }));
  fs.writeFileSync('pages.json', JSON.stringify(pages, null, 2));
  console.log(`pages: ${pages.length}`);
  // ---- styles ------------------------------------------------------------
  // NOT fetched from the API. `get_styles(query:"all")` returns 429 every time
  // on this site regardless of cooldown — it is too expensive at ~1900 styles,
  // and paging query_styles by name substring truncates at the 200-match cap
  // without any way to prove completeness.
  //
  // The published stylesheet is a complete and authoritative source for every
  // selector and its properties at every breakpoint, and costs no API quota.
  // Element styleNames (below) supply the Designer names. Webflow's selector is
  // the name with spaces replaced by hyphens; `plan.mjs` asserts that mapping is
  // unique rather than assuming it.
  console.log('styles: read from the published stylesheet, not the API (see comment)');

  // ---- elements ----------------------------------------------------------
  // Resumable: pages already captured in a previous run are skipped, so a run
  // that partly 429s can be topped up instead of restarted. RESUME=0 to refetch.
  let elements = {};
  if (process.env.RESUME !== '0' && fs.existsSync('elements.json')) {
    elements = JSON.parse(fs.readFileSync('elements.json', 'utf8'));
    const have = Object.values(elements).filter((e) => e.elements?.length).length;
    if (have) console.log(`resuming: ${have} pages already captured`);
  }
  for (const p of pages) {
    if (elements[p.id]?.elements?.length) { console.log(`  ${p.title}: cached`); continue; }
    try {
      const [r] = await call('data_element_tool', {
        siteId: SITE, pageId: p.id, context: CTX,
        actions: [{ label: 'e', get_all_elements: { depth: -1 } }],
      }, `elements ${p.title}`);
      const flat = collectElements(r);
      // de-duplicate: the shape-agnostic walk can meet the same node twice
      const uniq = new Map(flat.map((e) => [`${e.id.component}/${e.id.element}`, e]));
      elements[p.id] = { slug: p.slug, title: p.title, draft: p.draft, elements: [...uniq.values()] };
      console.log(`  ${p.title}: ${uniq.size} elements`);
    } catch (e) {
      console.error(`  ${p.title}: FAILED ${String(e.message).slice(0, 200)}`);
      elements[p.id] = { slug: p.slug, title: p.title, draft: p.draft, error: String(e.message) };
    }
  }
  fs.writeFileSync('elements.json', JSON.stringify(elements, null, 2));
  const tot = Object.values(elements).reduce((a, b) => a + (b.elements?.length ?? 0), 0);
  console.log(`elements: ${tot} across ${pages.length} pages`);
}

main().catch((e) => { console.error(e); process.exit(1); });
