#!/usr/bin/env node
/**
 * build-convert.mjs — create and build the 12 consult / thank-you v2 pages.
 *
 * Slugs mirror the live ones the user listed, with `-v2` appended, so each new
 * page sits beside the page it replaces.
 *
 *   node build-convert.mjs [topic …]        (default: all six)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { call, SITES } from './wf.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const V2 = path.resolve(HERE, '../../../04-design/.tmp/v2');
const MAP = path.join(HERE, 'v2-pages.json');

const PAGES = {
  implants: {
    consult: ['dental-implants-consult-v2', 'Dental Implants Consult v2', 'Book a Free Dental Implant Consultation in Arvada, CO'],
    ty: ['dental-implant-thank-you-v2', 'Dental Implants Thank You v2', 'Thank You | Arvada Dental Center'],
  },
  aox: {
    consult: ['all-on-x-full-arch-consult-v2', 'All-on-X / Full Arch Consult v2', 'Book a Full-Arch Implant Consultation in Arvada, CO'],
    ty: ['all-on-x-thank-you-v2', 'All-on-X / Full Arch Thank You v2', 'Thank You | Arvada Dental Center'],
  },
  veneers: {
    consult: ['porcelain-veneers-consult-v2', 'Porcelain Veneers Consult v2', 'Book a Smile Evaluation in Arvada, CO'],
    ty: ['porcelain-veneers-thank-you-v2', 'Porcelain Veneers Thank You v2', 'Thank You | Arvada Dental Center'],
  },
  emergency: {
    consult: ['emergency-dentist-consult-v2', 'Emergency Dentist Consult v2', 'Request an Urgent Dental Visit in Arvada, CO'],
    ty: ['emergency-dentist-thank-you-v2', 'Emergency Dentist Thank You v2', 'Thank You | Arvada Dental Center'],
  },
  'dentist-near-me': {
    consult: ['dentist-near-me-consult-v2', 'Dentist Near Me Consult v2', 'Claim the $109 New Patient Special in Arvada, CO'],
    ty: ['dentist-near-me-thank-you-v2', 'Dentist Near Me Thank You v2', 'Thank You | Arvada Dental Center'],
  },
  'next-door': {
    consult: ['next-door-family-consult-v2', 'Next Door / Family Consult v2', 'Book Your $109 First Visit in Arvada, CO'],
    ty: ['next-door-family-thank-you-v2', 'Next Door / Family Thank You v2', 'Thank You | Arvada Dental Center'],
  },
};

const DESC = {
  consult: 'Request a call back from Arvada Dental Center. The team calls Monday to Friday, 8am to 5pm.',
  ty: 'Your request is with the Arvada Dental Center team. Someone will call you back Monday to Friday, 8am to 5pm.',
};

const pages = fs.existsSync(MAP) ? JSON.parse(fs.readFileSync(MAP, 'utf8')) : {};
const topics = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(PAGES);

// One list_pages for the whole run — it is the call that trips the rate limit.
const existing = new Map();
{
  const list = call('data_pages_tool', [{ label: 'l', list_pages: { limit: 100 } }], { site: SITES.arvada });
  for (const p of list?.result?.pages || []) existing.set(p.slug, p.id);
}

for (const topic of topics) {
  for (const kind of ['consult', 'ty']) {
    const [slug, title, seoTitle] = PAGES[topic][kind];
    const key = `${topic}.${kind}`;
    console.log(`\n===== ${key} =====`);

    let pageId = pages[key] || existing.get(slug);
    if (!pageId) {
      const r = call('data_pages_tool', [{
        label: 'c',
        create_page: { title, slug, seo: { title: seoTitle, description: DESC[kind] } },
      }], { site: SITES.arvada });
      pageId = r?.result?.id;
      if (!pageId) { console.log('create_page failed: ' + JSON.stringify(r).slice(0, 300)); continue; }
      console.log(`created ${pageId} (${slug})`);
    } else {
      console.log(`reusing ${pageId} (${slug})`);
    }
    pages[key] = pageId;
    fs.writeFileSync(MAP, JSON.stringify(pages, null, 1));

    const body = path.join(V2, `${topic}-${kind === 'ty' ? 'ty' : 'consult'}`, 'body.html');
    if (!fs.existsSync(body)) { console.log(`missing ${body}`); continue; }
    execFileSync(process.execPath, [path.join(HERE, 'build-page.mjs'), pageId, body, '--clear'], { stdio: 'inherit' });
  }
}

console.log('\n' + JSON.stringify(pages, null, 1));
