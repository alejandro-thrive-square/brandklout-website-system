#!/usr/bin/env node
/**
 * push-wfsync.mjs — put the client's Webflow edits onto Instatic.
 *
 * Uploads the five practice photographs, then applies, on the home page:
 * the new Chapter 08 heading and gallery, the comparison-table wording, the
 * story film, the review widget and the 4.9 rating. The patient-stories films
 * are handled here too.
 *
 * Written in INSTATIC's class idiom for anything that reuses existing styling,
 * and in the package's own names (.iv-gallery, .st-film, .rv-embed) for what is
 * genuinely new. The new CSS ships in the runtime-states.css code asset, which
 * survives the publish-time purge; site_apply_css does not.
 *
 * IMAGES: media_upload sniffs the file type from the BYTES and takes JPEG, PNG,
 * GIF, WebP and SVG only. The gallery is AVIF on both Webflow and in the local
 * package, so it is re-encoded to JPEG first (04-design/.tmp/avif-to-jpeg.mjs)
 * — renaming the file does not fool the sniffer.
 *
 * SCRIPTS: site_insert_html strips <script>, so the review widget's loader
 * cannot ride in the markup. It ships as a `script` code asset scoped to the
 * home page instead; without it the iframe never resizes to its content.
 */
import fs from 'node:fs';
import path from 'node:path';
import { callJson } from './instatic-mcp.mjs';

const JPEG = path.resolve(import.meta.dirname, '..', '..', '04-design', '.tmp', 'jpeg-out');
const problems = [];
let ok = 0;
const step = async (label, fn) => {
  try { const r = await fn(); ok++; console.log(`  ${label}${r ? ' ' + r : ''}`); }
  catch (e) { problems.push(`${label}: ${e.message.slice(0, 200)}`); }
};
const guard = (r) => {
  if (r && typeof r.text === 'string' && !/^\s*(ok|done)/i.test(r.text)) throw new Error(r.text.slice(0, 160));
  return r;
};

const ALT = [
  'The reception desk, with the Dr. Nahlah wordmark above a marble counter and cream and gold waiting chairs',
  'A consultation room with a round table, two upholstered chairs and a monitor',
  'The corridor between treatment rooms, lined with gold arch detailing',
  'A treatment room with the dental chair, overhead light and chairside monitor',
  'The preparation corridor, with instrument cabinetry along one wall',
];

// ------------------------------------------------------------------ uploads
const paths = [];
for (let i = 1; i <= 5; i++) {
  await step(`uploaded practice-space-${i}.jpg`, async () => {
    const file = path.join(JPEG, `practice-space-${i}.jpg`);
    const r = await callJson('media_upload', {
      filename: `practice-space-${i}.jpg`,
      data: fs.readFileSync(file).toString('base64'),
      altText: ALT[i - 1],
    });
    if (!r.publicPath) throw new Error(JSON.stringify(r).slice(0, 150));
    paths[i - 1] = r.publicPath;
    return `-> ${r.publicPath}`;
  });
}
if (paths.filter(Boolean).length !== 5) {
  console.error('\nnot all images uploaded; stopping before the markup goes in');
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}

fs.writeFileSync(path.join(import.meta.dirname, 'gallery-paths.json'), JSON.stringify(paths, null, 1));
console.log('\ngallery paths saved to gallery-paths.json');
