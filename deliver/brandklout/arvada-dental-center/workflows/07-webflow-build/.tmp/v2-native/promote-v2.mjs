#!/usr/bin/env node
/**
 * promote-v2.mjs — hand the live ad URLs from the old pages to the v2 ones.
 *
 * The ads point at the ORIGINAL slugs, so the v2 pages have to take those
 * slugs over or every paid-traffic URL 404s. Two writes per pair:
 *
 *   old page   slug -> `<slug>-v1-archived`, title suffixed, draft: true
 *   v2 page    slug -> `<slug>`,             title de-suffixed
 *
 * The old page must be renamed BEFORE the v2 page can take the slug — Webflow
 * will not have two pages on one slug, and a draft page still occupies its own.
 *
 * NOTE: this MCP has no delete_page action at all. Archiving is therefore the
 * only route, and it is the better one: `draft: true` stops the page being
 * published while leaving it fully recoverable.
 *
 *   node promote-v2.mjs [--dry] [pageKey …]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { call, SITES } from './wf.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DRY = process.argv.includes('--dry');
const map = JSON.parse(fs.readFileSync(path.join(HERE, 'v2-pages.json'), 'utf8'));

/** v2 page key -> the live slug it should take over. */
const TAKEOVER = {
  implants: 'dental-implants-ads-landing',
  aox: 'all-on-x-ads-landing',
  veneers: 'porcelain-veneers-ads-landing',
  emergency: 'emergency-dentist-ads-landing',
  'dentist-near-me': 'dentist-near-me-ads-landing',
  'next-door': 'next-door-family-ads-landing',
  'implants.consult': 'dental-implants-consult',
  'aox.consult': 'all-on-x-full-arch-consult',
  'veneers.consult': 'porcelain-veneers-consult',
  'emergency.consult': 'emergency-dentist-consult',
  'dentist-near-me.consult': 'dentist-near-me-consult',
  'next-door.consult': 'next-door-family-consult',
  'implants.ty': 'dental-implant-thank-you',
  'aox.ty': 'all-on-x-thank-you',
  'veneers.ty': 'porcelain-veneers-thank-you',
  'emergency.ty': 'emergency-dentist-thank-you',
  'dentist-near-me.ty': 'dentist-near-me-thank-you',
  'next-door.ty': 'next-door-family-thank-you',
};

const keys = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const todo = keys.length ? keys : Object.keys(TAKEOVER);

// One listing for the whole run; list_pages is the call that trips the limit.
const pages = new Map();
{
  const r = call('data_pages_tool', [{ label: 'l', list_pages: { limit: 100 } }], { site: SITES.arvada });
  for (const p of r?.result?.pages || []) pages.set(p.slug, p);
}
console.log(`site has ${pages.size} pages\n`);

let done = 0;
const problems = [];

for (const key of todo) {
  const target = TAKEOVER[key];
  const v2Id = map[key];
  const v2 = [...pages.values()].find((p) => p.id === v2Id);
  const old = pages.get(target);

  if (!v2) { problems.push(`${key}: v2 page ${v2Id} not found`); continue; }
  if (v2.slug === target) { console.log(`ok   ${key}: already on ${target}`); done++; continue; }

  const plan = [];
  if (old) plan.push(`archive "${old.title}" (${target} -> ${target}-v1-archived, draft)`);
  plan.push(`move "${v2.title}" (${v2.slug} -> ${target})`);
  console.log(`${DRY ? 'DRY ' : '--> '} ${key}: ${plan.join('  |  ')}`);
  if (DRY) { done++; continue; }

  // 1. free the slug
  if (old) {
    const r = call('data_pages_tool', [{
      label: 'a',
      update_page_settings: {
        page_id: old.id,
        slug: `${target}-v1-archived`,
        title: `${old.title} (v1 archived)`,
        draft: true,
      },
    }], { site: SITES.arvada });
    if (/"error"/.test(JSON.stringify(r))) { problems.push(`${key}: archiving old failed — ${JSON.stringify(r).slice(0, 160)}`); continue; }
  }

  // 2. take it
  const r2 = call('data_pages_tool', [{
    label: 'm',
    update_page_settings: {
      page_id: v2.id,
      slug: target,
      title: v2.title.replace(/\s*v2$/i, ''),
    },
  }], { site: SITES.arvada });
  if (/"error"/.test(JSON.stringify(r2))) { problems.push(`${key}: moving v2 failed — ${JSON.stringify(r2).slice(0, 160)}`); continue; }
  done++;
}

console.log(`\n${done}/${todo.length} promoted`);
for (const p of problems) console.log('  ' + p);

if (!DRY && !problems.length) {
  // Verify against the site, not against the write responses.
  const r = call('data_pages_tool', [{ label: 'l', list_pages: { limit: 100 } }], { site: SITES.arvada });
  const now = new Map((r?.result?.pages || []).map((p) => [p.slug, p]));
  let bad = 0;
  for (const key of todo) {
    const target = TAKEOVER[key];
    const live = now.get(target);
    const arch = now.get(`${target}-v1-archived`);
    const okLive = live && live.id === map[key];
    const okArch = !arch || arch.draft === true;
    if (!okLive || !okArch) { bad++; console.log(`  CHECK ${key}: live=${live ? live.id : 'missing'} wanted ${map[key]}; archived draft=${arch ? arch.draft : 'n/a'}`); }
  }
  console.log(bad ? `\n${bad} page(s) need attention` : '\nverified: every v2 page owns its live slug, every old page is an archived draft');
}
