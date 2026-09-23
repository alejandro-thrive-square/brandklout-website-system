#!/usr/bin/env node
/**
 * build-topic.mjs — create (or reuse) a topic's v2 page, build its markup, and
 * add the native YouTube element.
 *
 * Everything it needs is in TOPICS below; the copy comes from
 * content/<topic>.json via render-page.mjs, which must have been run first.
 *
 *   node build-topic.mjs <topic> [more topics…]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { call, SITES } from './wf.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const V2 = path.resolve(HERE, '../../../04-design/.tmp/v2');
const MAP = path.join(HERE, 'v2-pages.json');

const TOPICS = {
  implants: { slug: 'dental-implants-ads-landing-v2', title: 'Dental Implants v2', seo: 'Dental Implants in Arvada, CO | Arvada Dental Center', desc: 'Replace missing teeth with dental implants in Arvada, CO. Free consultation, 3D scan and a written plan with Dr. Gregory Bennett.' },
  aox: { slug: 'all-on-x-ads-landing-v2', title: 'All-on-X / Full Arch v2', seo: 'All-on-X Full Arch Dental Implants in Arvada, CO | Arvada Dental Center', desc: 'Fixed full-arch dental implants in Arvada, CO. A published price, a 3D scan and same-day teeth where the case allows.' },
  veneers: { slug: 'porcelain-veneers-ads-landing-v2', title: 'Porcelain Veneers v2', seo: 'Porcelain Veneers in Arvada, CO | Arvada Dental Center', desc: 'Porcelain veneers designed around your face in Arvada, CO. Shade, shape and proportion decided with you by Dr. Gregory Bennett.' },
  emergency: { slug: 'emergency-dentist-ads-landing-v2', title: 'Emergency Dentist v2', seo: 'Emergency Dentist in Arvada, CO | Arvada Dental Center', desc: 'Urgent dental care in Arvada, CO. Severe pain, swelling, broken or knocked-out teeth seen by Dr. Gregory Bennett.' },
  'dentist-near-me': { slug: 'dentist-near-me-ads-landing-v2', title: 'Dentist Near Me v2', seo: '$109 New Patient Special | Dentist Near Me in Arvada, CO', desc: '$109 first visit at Arvada Dental Center: comprehensive exam, digital X-rays, oral cancer screening and a treatment plan.' },
  'next-door': { slug: 'next-door-family-ads-landing-v2', title: 'Next Door / Family v2', seo: 'Your Neighbourhood Dentist in Arvada | $109 New Patient Special', desc: 'The Arvada dentist your neighbours already use. One practice for the whole household, and a $109 first visit to start.' },
};

const pages = fs.existsSync(MAP) ? JSON.parse(fs.readFileSync(MAP, 'utf8')) : {};

for (const topic of process.argv.slice(2)) {
  const spec = TOPICS[topic];
  if (!spec) { console.log(`unknown topic: ${topic}`); continue; }
  console.log(`\n===== ${topic} =====`);

  // Reuse the page if it already exists, so re-running does not litter the site.
  let pageId = pages[topic];
  if (!pageId) {
    const list = call('data_pages_tool', [{ label: 'l', list_pages: { limit: 100 } }], { site: SITES.arvada });
    const found = (list?.result?.pages || []).find((p) => p.slug === spec.slug);
    if (found) { pageId = found.id; console.log(`reusing existing page ${pageId}`); }
  }
  if (!pageId) {
    const r = call('data_pages_tool', [{
      label: 'c',
      create_page: { title: spec.title, slug: spec.slug, seo: { title: spec.seo, description: spec.desc } },
    }], { site: SITES.arvada });
    pageId = r?.result?.id;
    if (!pageId) { console.log('create_page failed: ' + JSON.stringify(r).slice(0, 400)); continue; }
    console.log(`created page ${pageId} (${spec.slug})`);
  }
  pages[topic] = pageId;
  fs.writeFileSync(MAP, JSON.stringify(pages, null, 1));

  const body = path.join(V2, topic, 'body.html');
  if (!fs.existsSync(body)) { console.log(`no body.html — run render-page.mjs ${topic} first`); continue; }

  execFileSync(process.execPath, [path.join(HERE, 'build-page.mjs'), pageId, body, '--clear'], { stdio: 'inherit' });

  // The native YouTube element cannot come from markup — Webflow has no iframe.
  const tree = call('data_element_tool', [{ label: 'e', get_all_elements: {} }], { site: SITES.arvada, page: pageId });
  let slot = null;
  (function walk(n) { if ((n.styleNames || []).includes('camp_video_slot')) slot = n; for (const c of n.children || []) walk(c); })(tree.result[0].data);
  if (slot) {
    const r = call('data_element_builder', [{
      build_label: 'yt', parent_element_id: slot.id, creation_position: 'append',
      element_schema: { type: 'YouTubeVideo' }, return_element_info: true,
    }], { site: SITES.arvada, page: pageId });
    console.log('youtube element: ' + (JSON.stringify(r).match(/"status":"[a-z_]+"/) || ['?'])[0]);
  } else {
    console.log('no camp_video_slot found — video element NOT added');
  }
}

console.log('\npage map: ' + JSON.stringify(pages, null, 1));
