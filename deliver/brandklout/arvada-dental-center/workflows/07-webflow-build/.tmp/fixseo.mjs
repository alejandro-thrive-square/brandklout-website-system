/**
 * fixseo.mjs — restore the SEO title and meta description the design specifies.
 *
 * All six pages published with no meta description at all, and with a <title>
 * that was just the internal Webflow page name — including
 * dental-implants-ads-landing, which was titled "Porcelain Veneers": the wrong
 * service, in the browser tab and the search/ads snippet, on a page bought
 * traffic lands on.
 *
 * The design carries a proper title and description in each page's <head>.
 * The packager packages SECTIONS, and <head> is not a section, so none of it
 * travelled. Same root cause as the missing <main id="main">.
 *
 * og:title/og:description are set to copy the SEO fields rather than being
 * written separately, so they cannot drift apart later.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { callTool } from './wfmcp.mjs';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const SITE = '693c51e685b19f0d0c149cab';
const IDS = {
  implants: '6a79f2aeabc1d37969522293', aox: '6a7a21d7f34df29a4defacdf',
  veneers: '6a7a21fef87845352663538f', emergency: '6a7a223bf8c58b0aa0c6af2e',
  'dentist-near-me': '6a7a2268da766fb28cddb149', 'next-door': '6a7a228d106ed97b8a7885c9',
};
const SEO = JSON.parse(readFileSync(join(HERE, 'seo.json'), 'utf8'));
const APPLY = process.argv.includes('--apply');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let done = 0;
for (const [page, pid] of Object.entries(IDS)) {
  const { title, description } = SEO[page];
  if (!title || !description) { console.log(`${page}: design has no title/description, skipped`); continue; }
  console.log(`${page}\n   title: ${title}\n   desc : ${description.slice(0, 90)}…`);
  if (!APPLY) { done++; continue; }
  for (let i = 0; i < 6; i++) {
    const r = await callTool('data_pages_tool', {
      actions: [{ label: 'seo', update_page_settings: {
        page_id: pid,
        seo: { title, description },
        openGraph: { titleCopied: true, descriptionCopied: true },
      } }],
    });
    if (/"status"\s*:\s*"error"/.test(r.text) || /\b429\b/.test(r.text)) {
      process.stderr.write('   …retrying\n'); await sleep(15000); continue;
    }
    console.log('   updated'); done++; break;
  }
  await sleep(1500);
}
console.log(`\n${done}/6 pages ${APPLY ? 'updated' : 'to update'}`);
