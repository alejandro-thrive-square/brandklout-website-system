/**
 * push_theme.mjs — install the Arvada colour layer into each page's head code.
 *
 * The pages carry an existing generated block ("published-page corrections"),
 * so this APPENDS rather than replaces, and it strips any previous copy of its
 * own block first so re-running is idempotent. set_page_freeform_code replaces
 * the whole block, which makes read-modify-write mandatory: writing only the
 * theme would silently delete the corrections that hold the pages together.
 *
 *   node push_theme.mjs            # dry run — reports sizes, writes nothing
 *   node push_theme.mjs --apply
 */
import { callTool } from './wfmcp.mjs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const SITE = '693c51e685b19f0d0c149cab';
const PAGES = {
  implants: '6a79f2aeabc1d37969522293', aox: '6a7a21d7f34df29a4defacdf',
  veneers: '6a7a21fef87845352663538f', emergency: '6a7a223bf8c58b0aa0c6af2e',
  'dentist-near-me': '6a7a2268da766fb28cddb149', 'next-door': '6a7a228d106ed97b8a7885c9',
};
const APPLY = process.argv.includes('--apply');
const ONLY = process.argv.includes('--page')
  ? process.argv[process.argv.indexOf('--page') + 1] : null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const OPEN = '<!-- WZ-ARVADA-THEME -->';
const CLOSE = '<!-- /WZ-ARVADA-THEME -->';

/** Reads retry on an empty envelope; a 429 arrives shaped like success. */
async function read(tool, args, pick) {
  for (let i = 0; i < 8; i++) {
    const r = await callTool(tool, args);
    let v; try { v = pick(JSON.parse(r.text)); } catch { v = undefined; }
    if (v !== undefined && v !== null) return v;
    const lim = /\b429\b/.test(r.text);
    process.stderr.write(`      …${lim ? '429' : 'no data'}, waiting\n`);
    await sleep(lim ? 20000 : 3000);
  }
  throw new Error('no usable response from ' + tool);
}

/**
 * Writes do NOT retry. Wrapping a mutating call in a retry-on-empty loop
 * created eight duplicate elements earlier in this build: every call had
 * succeeded and only the response parse had failed. One attempt, report what
 * came back.
 */
async function write(tool, args) {
  const r = await callTool(tool, args);
  let o; try { o = JSON.parse(r.text); } catch { return { status: 'unparseable', raw: r.text.slice(0, 300) }; }
  const first = Array.isArray(o) ? o[0]
    : (Array.isArray(o?.result) ? o.result[0] : o?.result);
  return { status: first?.status || (first?.content !== undefined ? 'success' : 'unknown'),
    raw: r.text.slice(0, 300) };
}

const theme = readFileSync(join(HERE, 'theme-arvada.css'), 'utf8');

for (const [page, pid] of Object.entries(PAGES)) {
  if (ONLY && ONLY !== page) continue;
  const tints = readFileSync(join(HERE, `tints-${page}.css`), 'utf8');
  const block = `${OPEN}\n<style>\n${theme}\n${tints}</style>\n${CLOSE}`;

  const got = await read('data_scripts_tool', { siteId: SITE, pageId: pid,
    context: 'Reading the current head custom code before appending the Arvada colour layer.',
    actions: [{ label: 'get', get_page_freeform_code: { page_id: pid, location: 'head' } }] },
    /* This tool answers {result:{location,content}} — result is an OBJECT,
       where data_element_tool returns an array. Assuming the array shape made
       every read look empty and the retry loop hid it as "no data". */
    (o) => {
      const d = o?.result;
      if (!d || Array.isArray(d)) return undefined;
      // An empty head block is legitimate — distinguish it from no answer.
      return typeof d.content === 'string' ? d.content : undefined;
    });
  await sleep(1200);

  const existing = String(got || '');
  const stripped = existing.includes(OPEN)
    ? existing.slice(0, existing.indexOf(OPEN)) +
      existing.slice(existing.indexOf(CLOSE) + CLOSE.length)
    : existing;
  const next = `${stripped.trimEnd()}\n${block}\n`;

  console.log(`${page.padEnd(18)} head ${String(existing.length).padStart(6)}` +
    ` -> ${String(next.length).padStart(6)}` +
    `  ${existing.includes(OPEN) ? 'REPLACING previous theme' : 'appending'}` +
    `${next.length > 50000 ? '   OVER THE 50k BLOCK LIMIT' : ''}`);
  if (next.length > 50000) { console.log('   refusing to write'); continue; }
  if (!APPLY) continue;

  const res = await write('data_scripts_tool', { siteId: SITE, pageId: pid,
    context: 'Installing the Arvada brand colour layer in the page head code.',
    actions: [{ label: 'set', set_page_freeform_code: { page_id: pid, location: 'head', content: next } }] });
  console.log(`   ${res.status}${res.status !== 'success' ? '  ' + res.raw : ''}`);
  await sleep(1500);
}
